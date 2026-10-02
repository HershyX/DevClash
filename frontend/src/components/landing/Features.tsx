import { motion } from 'framer-motion';

const features = [
  {
    icon: '⚔️',
    title: 'Live 1v1 Duels',
    desc: 'Real-time coding battles over Socket.IO. Watch the clock, beat your opponent, climb the Duel Rating ladder.',
    tags: ['Real-time sync', 'Ranked + Casual', 'Bot quick-match'],
    accent: '#f59e0b',
    glow:   'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.2)',
    bar:    'linear-gradient(90deg,#f59e0b,#f97316)',
  },
  {
    icon: '🧠',
    title: 'Adaptive Engine',
    desc: 'AI tracks your skill per-topic and picks the exact problems you need — stronger where you\'re weak, harder when you\'re on a streak.',
    tags: ['Topic skill profiling', 'Dynamic difficulty', 'Weakness targeting'],
    accent: '#d946ef',
    glow:   'rgba(217,70,239,0.15)',
    border: 'rgba(217,70,239,0.2)',
    bar:    'linear-gradient(90deg,#d946ef,#9333ea)',
  },
  {
    icon: '💻',
    title: 'Problem Sets',
    desc: 'Curated algorithmic problems from easy to hard, sandbox-evaluated with hidden test cases. Your Problem Set Rating is yours alone.',
    tags: ['Hidden test cases', 'Sandbox execution', 'XP anti-farm rules'],
    accent: '#06b6d4',
    glow:   'rgba(6,182,212,0.15)',
    border: 'rgba(6,182,212,0.2)',
    bar:    'linear-gradient(90deg,#22d3ee,#0891b2)',
  },
  {
    icon: '📊',
    title: '3 Independent Ratings',
    desc: 'Duel, Problem Set, and Adaptive ratings are mathematically isolated. One system never contaminates another.',
    tags: ['Separate leaderboards', 'Independent XP', 'Rating ledger audit'],
    accent: '#6366f1',
    glow:   'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.2)',
    bar:    'linear-gradient(90deg,#818cf8,#6366f1)',
  },
  {
    icon: '🎓',
    title: 'Teacher Classrooms',
    desc: 'Create classes, share a join code, and watch every student\'s three independent ratings evolve in real-time analytics.',
    tags: ['Classroom codes', 'Per-student analytics', 'Three-ladder view'],
    accent: '#10b981',
    glow:   'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.2)',
    bar:    'linear-gradient(90deg,#34d399,#059669)',
  },
  {
    icon: '🔒',
    title: 'Secure Sandbox',
    desc: 'User code runs in isolated Docker containers — no network, no filesystem, hard CPU/memory limits. Safe by design.',
    tags: ['--network none', '128MB memory cap', 'PID limits'],
    accent: '#f43f5e',
    glow:   'rgba(244,63,94,0.15)',
    border: 'rgba(244,63,94,0.2)',
    bar:    'linear-gradient(90deg,#fb7185,#e11d48)',
  },
];

export function Features() {
  return (
    <section className="py-24 lg:py-32" style={{ background:'#07080a' }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        {/* Section header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.6, ease:[0.16,1,0.3,1] }}
        >
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background:'rgba(99,102,241,0.12)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.22)' }}
          >
            ✦ PLATFORM FEATURES
          </div>
          <h2
            className="font-black text-white mb-4"
            style={{ fontSize:'clamp(1.75rem,3.5vw,2.75rem)', lineHeight:1.15, letterSpacing:'-0.025em' }}
          >
            Built Different from Traditional Platforms
          </h2>
          <p className="text-surface-400 text-base leading-relaxed">
            Three independent experiences. Three separate progression systems. Zero compromises.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group relative rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background:'#0d1117',
                border:`1px solid rgba(255,255,255,0.06)`,
              }}
              initial={{ opacity:0, y:28 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay: i*0.08, duration:0.5, ease:[0.16,1,0.3,1] }}
              whileHover={{ y:-3,
                boxShadow: `0 12px 40px ${f.glow}, 0 0 0 1px ${f.border}`,
              }}
            >
              {/* Top accent bar */}
              <div className="h-[2px] w-0 group-hover:w-full transition-all duration-500" style={{ background: f.bar }} />

              {/* Glow bg on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background:`radial-gradient(ellipse 80% 50% at 50% 0%, ${f.glow} 0%, transparent 70%)` }}
              />

              <div className="relative p-6">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5"
                  style={{ background: f.glow, border:`1px solid ${f.border}` }}
                >
                  {f.icon}
                </div>

                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed mb-4">{f.desc}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {f.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                      style={{ background: f.glow, color: f.accent, border:`1px solid ${f.border}` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
