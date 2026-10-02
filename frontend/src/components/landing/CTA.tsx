import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export function CTA() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden" style={{ background:'#07080a' }}>

      {/* Gradient mesh */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:[
          'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.2)  0%, transparent 65%)',
          'radial-gradient(ellipse 40% 40% at 20% 30%, rgba(6,182,212,0.08)  0%, transparent 55%)',
          'radial-gradient(ellipse 40% 40% at 80% 70%, rgba(217,70,239,0.08) 0%, transparent 55%)',
        ].join(','),
      }}/>

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'32px 32px' }}
      />

      <div className="relative max-w-3xl mx-auto px-5 lg:px-8 text-center">

        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}
          initial={{ opacity:0, scale:0.85 }} whileInView={{ opacity:1, scale:1 }}
          viewport={{ once:true }} transition={{ duration:0.45 }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-70 animate-ping"/>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"/>
          </span>
          <span className="text-sm font-medium text-surface-300">Ready to start?</span>
        </motion.div>

        <motion.h2
          className="font-black text-white mb-5"
          style={{ fontSize:'clamp(2rem,4.5vw,3.5rem)', lineHeight:1.1, letterSpacing:'-0.03em' }}
          initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ delay:0.1, duration:0.6, ease:[0.16,1,0.3,1] }}
        >
          Level up your coding.{' '}
          <span style={{
            background:'linear-gradient(135deg,#818cf8,#c084fc,#f0abfc)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>One rep at a time.</span>
        </motion.h2>

        <motion.p
          className="text-surface-400 text-base lg:text-lg mb-10 leading-relaxed"
          initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ delay:0.2, duration:0.5 }}
        >
          Demo accounts are backed by a real MongoDB database. Every rating change, submission, and battle is persisted — nothing is mocked.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ delay:0.3, duration:0.5 }}
        >
          <NavLink
            to="/login"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5"
            style={{
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              boxShadow:'0 0 28px rgba(99,102,241,0.45), 0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            Start for Free
          </NavLink>

          <NavLink
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-surface-300 transition-all hover:text-white hover:bg-white/[0.04]"
            style={{ border:'1px solid rgba(255,255,255,0.1)' }}
          >
            ⚔️ Demo Battle
          </NavLink>
        </motion.div>
      </div>
    </section>
  );
}
