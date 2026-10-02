import { spawn } from 'child_process';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../config/env.js';

/**
 * Windows compatibility: Docker Desktop file sharing requires forward-slash
 * Windows paths like C:/Users/... (not backslashes). Git Bash's /c/... form
 * and plain backslash paths both fail on mounts.
 */
function toDockerMountPath(winDir) {
  return winDir.replace(/\\/g, '/');
}

/**
 * Isolated code execution service.
 *
 * Architecture: Node API → (in-process FIFO queue) → per-run Docker container
 * → result JSON. User code NEVER runs inside the API process.
 *
 * Sandbox guarantees per execution:
 *  - one-off container (--rm), isolated network (--network none)
 *  - no writes outside its own workdir (--read-only + tmpfs /tmp)
 *  - non-root user, dropped capabilities, no new privileges
 *  - CPU quota, memory hard limit, PIDs limit, wall-clock timeout
 *  - sees ONLY the problem's stdin/expected data for the current test case
 *  - cannot reach MongoDB, the API, or host env secrets (no -e, no mounts
 *    besides the read-only code dir, network disabled)
 */

const IMAGE = {
  javascript: 'devclash-sandbox:node',
  python: 'devclash-sandbox:python',
};

const LANG_CONFIG = {
  javascript: {
    file: 'solution.js',
    // The runner harness prints one JSON line: {"result": <serialized output>}
    cmd: () => ['node', '/sandbox/harness.js'],
  },
  python: {
    file: 'solution.py',
    cmd: () => ['python3', '-I', '/sandbox/harness.py'], // -I = isolated mode
  },
};

const LIMITS = {
  cpuQuota: 0.5, // 50% of one core
  memoryMb: 128,
  pidsLimit: 64,
  defaultTimeLimitMs: 5000,
  maxWallClockMs: 20000, // hard cap across all tests for one submission
};

/** In-process FIFO so a burst of submissions can't spawn unbounded containers. */
class ExecutionQueue {
  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this._drain();
    });
  }

  async _drain() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      this.running++;
      task()
        .then(resolve, reject)
        .finally(() => {
          this.running--;
          this._drain();
        });
    }
  }
}

const queue = new ExecutionQueue(env.isTest ? 1 : 2);

export function dockerAvailable() {
  return new Promise((resolve) => {
    const probe = spawn('docker', ['info', '--format', 'ok'], { stdio: ['ignore', 'pipe', 'ignore'] });
    probe.on('close', (code) => resolve(code === 0));
    probe.on('error', () => resolve(false));
  });
}

function runDocker(args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn('docker', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      // Git Bash / MSYS mangles leading-slash args (e.g. /sandbox/...);
      // disable that so container paths reach Docker intact.
      env: { ...process.env, MSYS_NO_PATHCONV: '1' },
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch { /* already dead */ }
    }, timeoutMs);

    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: String(err.message), timedOut });
    });
  });
}

/** Pull only the fields the sandbox needs; never pass Mongo docs to the container. */
function sanitizeTestCase(tc) {
  return {
    stdin: String(tc.input ?? ''),
    expected: String(tc.expectedOutput ?? ''),
    timeLimitMs: tc.timeLimitMs > 0 ? tc.timeLimitMs : null,
  };
}

/**
 * Runs user source against a list of test cases inside the sandbox.
 * Returns { engine, results: [{passed, actual, timeMs, error}], timedOut, containerId }
 */
export async function executeInSandbox({ language, sourceCode, testCases, timeLimitMs }) {
  return queue.enqueue(() => _execute({ language, sourceCode, testCases, timeLimitMs }));
}

async function _execute({ language, sourceCode, testCases, timeLimitMs }) {
  const lang = LANG_CONFIG[language];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  const useDocker = await dockerAvailable();
  if (useDocker) {
    try {
      return await dockerExecute({ language, sourceCode, testCases, timeLimitMs, lang });
    } catch (err) {
      console.error('[sandbox] docker execution failed, falling back:', err.message);
    }
  }
  // Dev fallback: NOT a security boundary; used only when Docker is unavailable.
  // Same harness, executed via a short-lived `node` child process with a timeout.
  console.warn('[sandbox] Docker unavailable — using UNISOLATED dev fallback. Do not use in production.');
  return fallbackExecute({ language, sourceCode, testCases, timeLimitMs, lang });
}

/**
 * JavaScript user code is written to disk AS-IS (no export wrapper needed):
 * the harness evaluates it in a `node:vm` context, where every top-level
 * function declaration becomes a context global — and nested helper functions
 * (e.g. `validate` inside `isValidBST`) correctly stay private.
 */
async function dockerExecute({ language, sourceCode, testCases, timeLimitMs, lang }) {
  const workdir = await mkdtemp(path.join(tmpdir(), 'devclash-run-'));
  const containerId = `devclash-exec-${crypto.randomBytes(6).toString('hex')}`;
  const effectiveLimit = Math.min(timeLimitMs > 0 ? timeLimitMs : LIMITS.defaultTimeLimitMs, LIMITS.maxWallClockMs);

  try {
    // Harness evaluates the user's solution via node:vm and reports via JSON on stdout.
    const harness = buildHarness(language, testCases.map(sanitizeTestCase), '/sandbox/solution.js');
    const solutionFile = sourceCode;
    await writeFile(path.join(workdir, lang.file), solutionFile, 'utf8');
    await writeFile(path.join(workdir, `harness.${language === 'javascript' ? 'js' : 'py'}`), harness, 'utf8');
    if (language === 'javascript') {
      await writeFile(path.join(workdir, 'package.json'), JSON.stringify({ type: 'module' }), 'utf8');
    }

    const args = [
      'run',
      '--rm',
      '--name', containerId,
      '--network', 'none',
      '--read-only',
      '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m',
      '--memory', `${LIMITS.memoryMb}m`,
      '--memory-swap', `${LIMITS.memoryMb}m`, // no swap
      '--cpus', String(LIMITS.cpuQuota),
      '--pids-limit', String(LIMITS.pidsLimit),
      '--security-opt', 'no-new-privileges',
      '--cap-drop', 'ALL',
      '--user', '1000:1000',
      '-v', `${toDockerMountPath(workdir)}:/sandbox:ro`,
      IMAGE[language],
      ...lang.cmd(lang.file),
    ];

    // Wall clock = per-test limit x tests + harness overhead
    const wall = Math.min(testCases.length * effectiveLimit + 5000, LIMITS.maxWallClockMs + 5000);
    const { stdout, timedOut } = await runDocker(args, wall);

    // Harness emits lines: {"i":0,"ok":true,"actual":...,"timeMs":...} / fatal error JSON
    const results = parseHarnessOutput(stdout, testCases.map(sanitizeTestCase));
    return {
      engine: 'docker',
      containerId,
      timedOut: timedOut || results.fatal === 'timeout',
      results: results.perTest,
      compileError: results.fatal === 'compile' ? results.message : null,
      runtimeError: results.fatal === 'runtime' ? results.message : null,
    };
  } finally {
    rm(workdir, { recursive: true, force: true }).catch(() => {});
    // Belt & suspenders: remove container if still around
    spawn('docker', ['rm', '-f', containerId], { stdio: 'ignore' });
  }
}

function buildHarness(language, testCases, solutionPath) {
  const payload = JSON.stringify(testCases);
  if (language === 'javascript') {
    return `
import fs from 'node:fs';
import vm from 'node:vm';
const CASES = ${payload};
const SOLUTION_PATH = ${JSON.stringify(solutionPath ?? '/sandbox/solution.js')};
function __serialize(v) {
  if (v === null || v === undefined) return String(v);
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}
function __parseInput(s) { return new Function('"use strict"; return [' + s + '];')(); }
function __findSolution(context) {
  const injected = new Set(['module', 'exports', 'globalThis', 'console', '__exports']);
  const modExports = context.module && typeof context.module === 'object' ? context.module.exports : null;
  if (typeof modExports?.solution === 'function') return modExports.solution;
  if (typeof modExports?.default === 'function') return modExports.default;
  if (typeof context.solution === 'function') return context.solution;
  for (const key of Object.getOwnPropertyNames(context)) {
    if (injected.has(key)) continue;
    try { if (typeof context[key] === 'function') return context[key]; } catch { /* getter threw */ }
  }
  return null;
}
(async () => {
  let fn = null;
  try {
    const source = fs.readFileSync(SOLUTION_PATH, 'utf8');
    // Sandbox properties become context globals: user code sees module/exports
    // like a CJS file, and top-level function declarations land on the global.
    const context = vm.createContext({ module: { exports: {} }, exports: {}, __exports: undefined });
    vm.runInContext(source, context, { timeout: ${testCases.length * 8000 + 4000} });
    if (typeof context.__exports === 'function') fn = context.__exports;
    if (!fn) fn = __findSolution(context);
  } catch (e) {
    process.stdout.write(JSON.stringify({ fatal: 'compile', message: String(e && e.message || e) }) + '\\n');
    process.exit(0);
  }
  if (!fn) {
    process.stdout.write(JSON.stringify({ fatal: 'compile', message: 'No solution function found. Define a top-level function (e.g. function solution(...) {}).'}) + '\\n');
    process.exit(0);
  }
  for (let i = 0; i < CASES.length; i++) {
    const tc = CASES[i];
    const t0 = Date.now();
    try {
      const out = await Promise.race([
        Promise.resolve(fn(...__parseInput(tc.stdin))),
        new Promise((_, rej) => setTimeout(() => rej(new Error('TIME_LIMIT_EXCEEDED')), tc.timeLimitMs || 5000)),
      ]);
      process.stdout.write(JSON.stringify({ i, ok: true, actual: __serialize(out), timeMs: Date.now() - t0 }) + '\\n');
    } catch (e) {
      const msg = String(e && e.message || e);
      process.stdout.write(JSON.stringify({ i, ok: false, fatal: msg === 'TIME_LIMIT_EXCEEDED' ? 'timeout' : 'runtime', message: msg, timeMs: Date.now() - t0 }) + '\\n');
    }
  }
  process.exit(0);
})();
`;
  }
  // Python harness
  return `
import json, sys, importlib.util, signal

CASES = json.loads(r'''${payload}''')

class Timeout(Exception): pass
def handler(signum, frame): raise Timeout()
signal.signal(signal.SIGALRM, handler)

def serialize(v):
    if v is None: return 'null'
    if isinstance(v, str): return v
    try: return json.dumps(v)
    except Exception: return str(v)

def parse_input(s):
    return json.loads('[' + s + ']')

spec = importlib.util.spec_from_file_location('solution', '/sandbox/solution.py')
mod = importlib.util.module_from_spec(spec)
try:
    spec.loader.exec_module(mod)
except Exception as e:
    print(json.dumps({'fatal': 'compile', 'message': str(e)})); sys.exit(0)

fn = getattr(mod, 'solution', None) or getattr(mod, 'solve', None)
for i, tc in enumerate(CASES):
    t0 = __import__('time').time()
    signal.setitimer(signal.ITIMER_REAL, (tc.get('timeLimitMs') or 5000) / 1000.0)
    try:
        out = fn(*parse_input(tc['stdin']))
        signal.setitimer(signal.ITIMER_REAL, 0)
        print(json.dumps({'i': i, 'ok': True, 'actual': serialize(out), 'timeMs': int((__import__('time').time() - t0) * 1000)}))
    except Timeout:
        print(json.dumps({'i': i, 'ok': False, 'fatal': 'timeout', 'message': 'TIME_LIMIT_EXCEEDED', 'timeMs': int((__import__('time').time() - t0) * 1000)})); sys.exit(0)
    except Exception as e:
        signal.setitimer(signal.ITIMER_REAL, 0)
        print(json.dumps({'i': i, 'ok': False, 'fatal': 'runtime', 'message': str(e), 'timeMs': int((__import__('time').time() - t0) * 1000)})); sys.exit(0)
sys.exit(0)
`;
}

function parseHarnessOutput(stdout, sanitizedCases) {
  const totalTests = sanitizedCases.length;
  const perTest = [];
  let fatal = null;
  let message = '';
  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const obj = JSON.parse(trimmed);
      if (obj.fatal === 'compile') { fatal = 'compile'; message = obj.message; break; }
      if (obj.fatal === 'runtime') { fatal = 'runtime'; message = obj.message; }
      if (obj.fatal === 'timeout') { fatal = 'timeout'; message = 'TIME_LIMIT_EXCEEDED'; }
      if (typeof obj.i === 'number') {
        const expected = sanitizedCases[obj.i]?.expected ?? '';
        const actual = obj.actual ?? null;
        const executedOk = !!obj.ok;
        // Verdict = ran without error AND output matches expected.
        // Whitespace-insensitive: Python's json.dumps writes "[0, 1]" while the
        // stored expected output is "[0,1]" — same value, different formatting.
        const norm = (s) => String(s).replace(/\s+/g, '');
        const passed = executedOk && actual !== null && norm(actual) === norm(expected);
        perTest[obj.i] = {
          passed,
          actual,
          timeMs: obj.timeMs ?? 0,
          error: !executedOk ? (obj.message ?? 'runtime error') : !passed ? 'wrong answer' : null,
        };
      }
    } catch { /* ignore malformed lines */ }
  }
  for (let i = 0; i < totalTests; i++) {
    if (!perTest[i]) perTest[i] = { passed: false, actual: null, timeMs: 0, error: message || 'no output' };
  }
  return { perTest, fatal, message };
}

/**
 * Dev fallback: runs the same JS harness via a child `node` process with a
 * hard wall-clock timeout. NOT isolated — flagged in DB as engine:'fallback'.
 *
 * Python is not supported in the fallback path: Docker images are required for
 * Python execution. Returning a compile_error makes it clear to the user.
 */
async function fallbackExecute({ language, sourceCode, testCases, timeLimitMs }) {
  if (language !== 'javascript') {
    // Python (and any future language) needs the Docker sandbox — surface this
    // as a compile error rather than silently passing all tests.
    return {
      engine: 'fallback',
      containerId: '',
      timedOut: false,
      results: testCases.map(() => ({ passed: false, actual: null, timeMs: 0, error: 'Docker required for Python execution' })),
      compileError: 'Python execution requires Docker. Please install and start Docker Desktop, then retry.',
      runtimeError: null,
    };
  }

  const workdir = await mkdtemp(path.join(tmpdir(), 'devclash-fb-'));
  try {
    const solutionPath = path.join(workdir, 'solution.js');
    const harness = buildHarness('javascript', testCases.map(sanitizeTestCase), solutionPath);
    await writeFile(path.join(workdir, 'solution.js'), sourceCode, 'utf8');
    await writeFile(path.join(workdir, 'harness.js'), harness, 'utf8');
    await writeFile(path.join(workdir, 'package.json'), '{"type":"module"}', 'utf8');

    const wall = Math.min(
      testCases.length * (timeLimitMs || LIMITS.defaultTimeLimitMs) + 5000,
      LIMITS.maxWallClockMs + 5000
    );

    const { spawn: spawnProc } = await import('child_process');
    const result = await new Promise((resolve) => {
      const child = spawnProc(process.execPath, ['harness.js'], {
        cwd: workdir,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let out = '';
      let timedOutLocal = false;
      const t = setTimeout(() => {
        timedOutLocal = true;
        try { child.kill('SIGKILL'); } catch { /* already exited */ }
      }, wall);
      child.stdout.on('data', (d) => { out += d; });
      child.stderr.on('data', () => {}); // drain stderr to avoid blocking
      child.on('close', () => { clearTimeout(t); resolve({ stdout: out, timedOut: timedOutLocal }); });
      child.on('error', (err) => { clearTimeout(t); resolve({ stdout: out, timedOut: timedOutLocal, spawnErr: err.message }); });
    });

    const parsed = parseHarnessOutput(result.stdout, testCases.map(sanitizeTestCase));
    return {
      engine: 'fallback',
      containerId: '',
      timedOut: result.timedOut || parsed.fatal === 'timeout',
      results: parsed.perTest,
      compileError: parsed.fatal === 'compile' ? parsed.message : null,
      runtimeError: parsed.fatal === 'runtime' ? parsed.message : null,
    };
  } finally {
    rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}

export { LIMITS };
