import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-500/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-50" />
      
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-20 left-10 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-10 w-96 h-96 bg-adaptive-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-20 lg:py-32">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 text-brand-400 text-sm font-medium mb-8 border border-brand-500/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Now in Public Beta
          </motion.div>

          <motion.h1 
            className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-white via-brand-200 to-brand-400 bg-clip-text text-transparent">
              DEVCLASH
            </span>
          </motion.h1>

          <motion.p 
            className="text-2xl lg:text-3xl text-surface-300 mb-6 font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Code. Compete. Improve.
          </motion.p>

          <motion.p 
            className="text-lg lg:text-xl text-surface-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Practice coding. Challenge your friends. Let AI adapt to your skill.
            Three independent progression systems. One platform.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Button size="xl" leftIcon={<Icon name="arrowUpRight" />} rightIcon={<Icon name="arrowRight" />}>
              Start Coding
            </Button>
            <Button variant="outline" size="xl" leftIcon={<Icon name="trophy" />}>
              Enter a Battle
            </Button>
          </motion.div>


        </motion.div>

        <motion.div 
          className="mt-20 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-transparent z-10 h-32 bottom-0 top-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚔️', title: 'Live 1v1 Battles', desc: 'Real-time coding duels with live ranking', color: 'duel' },
              { icon: '🧠', title: 'Adaptive Coding', desc: 'AI-powered sessions that match your level', color: 'adaptive' },
              { icon: '💻', title: 'Problem Sets', desc: 'Curated challenges with detailed solutions', color: 'practice' },
              { icon: '🎓', title: 'Classroom Analytics', desc: 'Teacher tools for student tracking', color: 'brand' },
            ].map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: { icon: string; title: string; desc: string; color: string }; index: number }) {
  return (
    <motion.div
      className="group relative p-6 lg:p-8 rounded-2xl bg-white/5 dark:bg-surface-900/50 backdrop-blur-md border border-white/10 dark:border-surface-800 hover:border-brand-500/30 transition-all duration-500"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      <div className="relative z-10">
        <motion.div 
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 flex items-center justify-center text-3xl mb-6"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          {feature.icon}
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
        <p className="text-surface-400 leading-relaxed">{feature.desc}</p>
      </div>
    </motion.div>
  );
}