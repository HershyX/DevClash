import { motion } from 'framer-motion';
import { cn } from '../../utils';

export interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function LoadingState({ size = 'md', text, className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <motion.div
        className={cn('border-4 border-brand-500 border-t-transparent rounded-full', sizes[size])}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-surface-600 dark:text-surface-400 text-sm"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('bg-surface-200 dark:bg-surface-800 rounded animate-pulse', className)}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
    />
  );
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}