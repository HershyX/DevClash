import { useState, FormEvent } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserRole } from '@types';

const demoRoles = [
  {
    role: 'student' as UserRole,
    label: 'Student Demo',
    icon: '🎓',
    desc: 'Duel · Practice · Adaptive',
    accent: '#6366f1',
    glow:   'rgba(99,102,241,0.18)',
    border: 'rgba(99,102,241,0.28)',
  },
  {
    role: 'teacher' as UserRole,
    label: 'Teacher Demo',
    icon: '🏫',
    desc: 'Classrooms · Analytics',
    accent: '#d946ef',
    glow:   'rgba(217,70,239,0.18)',
    border: 'rgba(217,70,239,0.28)',
  },
  {
    role: 'personal' as UserRole,
    label: 'Personal Demo',
    icon: '⚡',
    desc: 'Solo coding journey',
    accent: '#06b6d4',
    glow:   'rgba(6,182,212,0.18)',
    border: 'rgba(6,182,212,0.28)',
  },
];

export function LoginPage() {
  const navigate             = useNavigate();
  const { login, demoLogin } = useAuth();
  const { showToast }        = useToast();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [demoLoading, setDemoLoading] = useState<UserRole | null>(null);
  const [error, setError]       = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      showToast({ type:'success', title:'Welcome back!', message:`Logged in as ${user.name}` });
      navigate(`/${user.role}`, { replace:true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: UserRole) => {
    setDemoLoading(role);
    try {
      const user = await demoLogin(role);
      showToast({ type:'success', title:'Demo login', message:`Welcome, ${user.name}!` });
      navigate(`/${user.role}`, { replace:true });
    } catch (err) {
      showToast({ type:'error', title:'Demo failed', message: err instanceof Error ? err.message : 'Try again' });
    } finally {
      setDemoLoading(null);
    }
  };

  const busy = loading || demoLoading !== null;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background:'#07080a' }}
    >
      {/* ── Mesh gradient ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:[
          'radial-gradient(ellipse 70% 55% at 30% 30%, rgba(99,102,241,0.2)  0%, transparent 60%)',
          'radial-gradient(ellipse 50% 45% at 75% 70%, rgba(217,70,239,0.15) 0%, transparent 55%)',
          'radial-gradient(ellipse 40% 40% at 70% 15%, rgba(6,182,212,0.1)   0%, transparent 50%)',
        ].join(','),
      }}/>

      {/* ── Grid pattern ──────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'24px 24px' }}
      />

      {/* ── Main card ─────────────────────────────────────────────────────── */}
      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity:0, y:24, scale:0.97 }}
        animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:0.55, ease:[0.16,1,0.3,1] }}
      >

        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.12, duration:0.5 }}
        >
          <NavLink to="/" className="inline-flex flex-col items-center gap-3">
            <motion.div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white"
              style={{
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow:'0 0 32px rgba(99,102,241,0.55), 0 8px 24px rgba(0,0,0,0.4)',
              }}
              whileHover={{ scale:1.08, rotate:3 }}
              transition={{ duration:0.25 }}
            >
              DC
            </motion.div>
            <div>
              <div className="text-xl font-black text-white tracking-tight">DevClash</div>
              <div className="text-xs font-medium mt-0.5" style={{ color:'rgba(99,102,241,0.8)' }}>
                Code · Compete · Improve
              </div>
            </div>
          </NavLink>
        </motion.div>

        {/* Form card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background:'rgba(13,17,23,0.85)',
            border:'1px solid rgba(255,255,255,0.08)',
            backdropFilter:'blur(24px)',
            boxShadow:'0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div className="px-6 pt-6 pb-4">
            <h1 className="text-xl font-bold text-white mb-0.5">Welcome back</h1>
            <p className="text-sm text-surface-500">Sign in to continue your coding journey</p>
          </div>

          <div className="px-6 pb-6">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
                  style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#fca5a5' }}
                  initial={{ opacity:0, y:-8, height:0 }} animate={{ opacity:1, y:0, height:'auto' }} exit={{ opacity:0, height:0 }}
                  transition={{ duration:0.25 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2, duration:0.4 }}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:'rgba(148,163,184,0.9)' }}>
                  EMAIL
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-surface-600 transition-all"
                  style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => { e.target.style.borderColor='rgba(99,102,241,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)'; }}
                  onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.boxShadow='none'; }}
                  placeholder="you@devclash.demo"
                  required autoComplete="email" disabled={busy}
                />
              </motion.div>

              {/* Password */}
              <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.27, duration:0.4 }}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:'rgba(148,163,184,0.9)' }}>
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 rounded-lg text-sm text-white placeholder-surface-600 transition-all"
                    style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => { e.target.style.borderColor='rgba(99,102,241,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)'; }}
                    onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.boxShadow='none'; }}
                    placeholder="••••••••"
                    required autoComplete="current-password" disabled={busy}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-40"
                style={{
                  background: loading ? 'rgba(99,102,241,0.6)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  boxShadow: loading ? 'none' : '0 0 20px rgba(99,102,241,0.4)',
                }}
                whileHover={!busy ? { scale:1.01 } : {}}
                whileTap={!busy  ? { scale:0.99 } : {}}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.34, duration:0.4 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </motion.button>
            </form>

            {/* Divider */}
            <motion.div
              className="relative my-5"
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ height:1, background:'rgba(255,255,255,0.07)' }}/>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs font-semibold text-surface-600" style={{ background:'#0d1117' }}>
                  OR TRY A DEMO
                </span>
              </div>
            </motion.div>

            {/* Demo buttons */}
            <div className="space-y-2">
              {demoRoles.map((d, i) => (
                <motion.button
                  key={d.role}
                  onClick={() => handleDemo(d.role)}
                  disabled={busy}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all disabled:opacity-40"
                  style={{
                    background: demoLoading === d.role ? d.glow : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${demoLoading === d.role ? d.border : 'rgba(255,255,255,0.07)'}`,
                  }}
                  whileHover={!busy ? { x:2, borderColor: d.border, background: d.glow } : {}}
                  whileTap={!busy ? { scale:0.98 } : {}}
                  initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: 0.45 + i*0.07, duration:0.4, ease:[0.16,1,0.3,1] }}
                >
                  <span className="text-xl shrink-0">{d.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: d.accent }}>{d.label}</div>
                    <div className="text-xs text-surface-600">{d.desc}</div>
                  </div>
                  {demoLoading === d.role ? (
                    <svg className="animate-spin w-4 h-4 shrink-0" style={{ color: d.accent }} viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-surface-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <motion.p
          className="mt-5 text-center text-xs text-surface-600"
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.75 }}
        >
          Demo accounts run against a real MongoDB database — all data persists.
        </motion.p>
      </motion.div>
    </div>
  );
}
