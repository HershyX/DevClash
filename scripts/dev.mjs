/**
 * Root dev orchestrator: starts MongoDB-dependent backend and Vite frontend
 * together. Zero dependencies — plain Node child processes.
 *
 *   npm run dev          → backend (:3001) + frontend (:5173)
 *
 * Prerequisite: MongoDB running → `docker compose up -d`
 */
import { spawn } from 'node:child_process';

const PROCS = [
  { name: 'backend', cmd: 'npm', args: ['run', 'dev'], cwd: 'backend', color: '\x1b[36m' },
  { name: 'frontend', cmd: 'npm', args: ['run', 'dev'], cwd: 'frontend', color: '\x1b[35m' },
];

const children = [];
let shuttingDown = false;

function shutdown(signal = 'SIGINT') {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[dev] ${signal} received — stopping all processes...`);
  for (const child of children) {
    if (!child.killed && child.exitCode === null) {
      try {
        child.kill('SIGINT');
      } catch {
        /* already gone */
      }
    }
  }
  // Hard-exit safety net (Windows doesn't always propagate signals)
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

for (const proc of PROCS) {
  const child = spawn(proc.cmd, proc.args, {
    cwd: proc.cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(child);

  const pipe = (stream, isError) => {
    let buffer = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const tag = `${proc.color}[${proc.name}]\x1b[0m`;
        (isError ? console.error : console.log)(`${tag} ${line}`);
      }
    });
  };
  pipe(child.stdout, false);
  pipe(child.stderr, true);

  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`\x1b[31m[${proc.name}]\x1b[0m exited with code ${code} — shutting down.`);
      shutdown();
    }
  });
}

console.log('[dev] DevClash starting — backend on :3001, frontend on :5173');
console.log('[dev] Press Ctrl+C to stop both.\n');
