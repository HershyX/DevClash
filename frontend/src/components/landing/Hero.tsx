import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const statItems = [
  { label: 'Battles Fought',   value: '12,400+', color: '#f59e0b' },
  { label: 'Problems Solved',  value: '89,200+', color: '#06b6d4' },
  { label: 'Adaptive Sessions',value: '4,800+',  color: '#d946ef' },
  { label: 'Active Users',     value: '2,100+',  color: '#6366f1' },
];

const floatVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.55, ease: 'easeOut' as const },
  }),
};

export function Hero() {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden" style={{ background:'#07080a' }}>

      {/* ── Mesh gradient background ──────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:[
          'radial-gradient(ellipse 75% 55% at 50% -5%,  rgba(99,102,241,0.28) 0%, transparent 60%)',
          'radial-gradient(ellipse 45% 35% at 85% 45%,  rgba(217,70,239,0.14) 0%, transparent 55%)',
          'radial-gradient(ellipse 45% 35% at 15% 65%,  rgba(6,182,212,0.12)  0%, transparent 55%)',
        ].join(','),
      }}/>

      {/* ── Dot grid ──────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'28px 28px' }}
      />

      {/* ── Orbiting orbs ─────────────────────────────────────────────────── */}
      {[
        { size:480, x:'60%', y:'15%', color:'rgba(99,102,241,0.12)', delay:0,   duration:14 },
        { size:360, x:'10%', y:'55%', color:'rgba(6,182,212,0.10)',  delay:3,   duration:18 },
        { size:280, x:'80%', y:'65%', color:'rgba(217,70,239,0.09)', delay:6,   duration:12 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ width:orb.size, height:orb.size, left:orb.x, top:orb.y, background:orb.color, filter:'blur(80px)' }}
          animate={{ scale:[1,1.15,1], opacity:[0.6,1,0.6] }}
          transition={{ duration:orb.duration, delay:orb.delay, repeat:Infinity, ease:'easeInOut' }}
        />
      ))}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 py-24 text-center">

        {/* Live badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)' }}
          initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75 animate-ping"/>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"/>
          </span>
          <span className="text-sm font-semibold text-brand-300">Now in Public Beta · Real backend · Real MongoDB</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-black tracking-tight text-white mb-5"
          style={{ fontSize:'clamp(3rem,7vw,5.5rem)', lineHeight:1.0, letterSpacing:'-0.04em' }}
          initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.1, duration:0.65, ease:[0.16,1,0.3,1] }}
        >
          Code.{' '}
          <span style={{
            background:'linear-gradient(135deg,#818cf8 0%,#c084fc 50%,#f0abfc 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>Compete.</span>
          {' '}Improve.
        </motion.h1>

        {/* Sub */}
        <motion.p
          className="text-lg lg:text-xl font-light mb-10 max-w-2xl mx-auto leading-relaxed"
          style={{ color:'rgba(148,163,184,0.9)' }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.22, duration:0.55, ease:[0.16,1,0.3,1] }}
        >
          Real-time 1v1 duels · Adaptive AI sessions · Curated problem sets ·{' '}
          <span className="text-white font-medium">Three completely independent rating systems</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.32, duration:0.5 }}
        >
          <NavLink
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:-translate-y-0.5"
            style={{
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              boxShadow:'0 0 24px rgba(99,102,241,0.45), 0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            Start Coding Free
          </NavLink>
          <NavLink
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-surface-300 text-base transition-all hover:text-white hover:border-white/20 hover:bg-white/[0.04]"
            style={{ border:'1px solid rgba(255,255,255,0.1)' }}
          >
            ⚔️ Try a Demo Battle
          </NavLink>
        </motion.div>

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto"
          initial={{ opacity:0 }} animate={{ opacity:1 }}
          transition={{ delay:0.45, duration:0.5 }}
        >
          {statItems.map((s, i) => (
            <motion.div
              key={s.label}
              className="rounded-xl p-4 text-center"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}
              custom={i} variants={floatVariants} initial="initial" animate="animate"
            >
              <div className="text-2xl font-black mb-1" style={{ color: s.color, textShadow:`0 0 20px ${s.color}60` }}>
                {s.value}
              </div>
              <div className="text-xs font-medium" style={{ color:'rgba(100,116,139,0.9)' }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background:'linear-gradient(to bottom, transparent, #07080a)' }}
      />
    </section>
  );
}
