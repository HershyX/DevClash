import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils';
import { motion } from 'framer-motion';

export function CTA() {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-brand-700 to-adaptive-700" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
      
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-10 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-10 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
        animate={{
          scale: [1.3, 1, 1.3],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative max-w-4xl mx-auto px-4 lg:px-6 text-center">
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-8 border border-white/20 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/50"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          Ready to start your journey?
        </motion.div>

        <motion.h2 
          className="text-4xl lg:text-5xl font-bold text-white mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Join thousands of developers leveling up their skills
        </motion.h2>

        <motion.p 
          className="text-lg lg:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Choose your path: compete in real-time duels, master problem sets, or let AI adapt to you.
          All with independent ratings that actually mean something.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Button size="xl" variant="secondary" className="bg-white text-brand-700 hover:bg-white/90" leftIcon={<Icon name="arrowUpRight" />}>
            Start Free
          </Button>
          <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10" leftIcon={<Icon name="trophy" />}>
            Try Demo Battle
          </Button>
        </motion.div>
      </div>
    </section>
  );
}