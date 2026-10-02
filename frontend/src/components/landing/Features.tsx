import { cn } from '../../utils';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { motion } from 'framer-motion';

const features = [
  {
    icon: '⚔️',
    title: 'Live 1v1 Battles',
    description: 'Challenge friends or random opponents in real-time coding duels. Watch each other\'s code as you type, race against the clock, and climb the Duel Rating ladder.',
    highlights: ['Real-time sync', 'Multiple languages', 'Spectator mode', 'Ranked seasons'],
    color: 'duel',
    gradient: 'from-duel-500 to-duel-600',
  },
  {
    icon: '🧠',
    title: 'Adaptive Coding',
    description: 'Our AI analyzes your strengths and weaknesses to generate personalized problem sequences. Every session adapts to your current skill level.',
    highlights: ['Skill profiling', 'Dynamic difficulty', 'Weakness targeting', 'Progress tracking'],
    color: 'adaptive',
    gradient: 'from-adaptive-500 to-adaptive-600',
  },
  {
    icon: '💻',
    title: 'Problem Sets',
    description: 'Curated collections of algorithmic problems from easy to expert. Track your Problem Set Rating independently from other modes.',
    highlights: ['200+ problems', 'Detailed editorial', 'Test case runner', 'Discussion forum'],
    color: 'practice',
    gradient: 'from-practice-500 to-practice-600',
  },
  {
    icon: '🏆',
    title: 'Three Independent Ratings',
    description: 'Duel Rating, Problem Set Rating, and Adaptive Rating are completely separate. No averaging, no compromise. Master each domain on its own terms.',
    highlights: ['Separate leaderboards', 'Independent XP', 'Unique progression', 'Specialized ranks'],
    color: 'brand',
    gradient: 'from-brand-500 to-brand-600',
  },
  {
    icon: '🎓',
    title: 'Classroom Analytics',
    description: 'Built for educators. Create classrooms, invite students with codes, and track performance across all three rating systems with detailed analytics.',
    highlights: ['Classroom codes', 'Student dashboards', 'Comparative analytics', 'Assignment tracking'],
    color: 'brand',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    icon: '📊',
    title: 'Rich Statistics',
    description: 'Deep dive into your coding patterns. Visualize rating history, skill breakdowns, streak tracking, and peer comparisons.',
    highlights: ['Rating graphs', 'Skill heatmaps', 'Streak tracking', 'Peer comparison'],
    color: 'brand',
    gradient: 'from-purple-500 to-purple-600',
  },
];

export function Features() {
  return (
    <section className="py-20 lg:py-32 bg-surface-50 dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="brand" size="lg" className="mb-4">
            Why DevClash?
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white mb-4">
            Built Different from Traditional Platforms
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400">
            Three distinct experiences. Three independent progression systems. Zero compromises.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card
        variant="glass"
        hover
        className="group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r" style={{ background: `var(--tw-gradient-from, ${feature.gradient})` }} />
        
        <div className="relative p-6 lg:p-8">
          <motion.div 
            className="w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-3xl mb-6"
            style={{ background: feature.gradient }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            {feature.icon}
          </motion.div>
          
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-3">
            {feature.title}
          </h3>
          
          <p className="text-surface-600 dark:text-surface-400 mb-6 leading-relaxed">
            {feature.description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {feature.highlights.map((highlight) => (
              <Badge key={highlight} variant={feature.color as any} size="sm" className="border-0">
                {highlight}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}