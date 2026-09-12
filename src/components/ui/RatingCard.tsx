import { forwardRef, HTMLAttributes } from 'react';
import { cn, formatRating, getRatingColor } from '../../utils';
import { Card, CardContent } from './Card';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';

export interface RatingCardProps extends HTMLAttributes<HTMLDivElement> {
  type: 'duel' | 'practice' | 'adaptive';
  rating: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  weeklyXpGain: number;
  trend?: 'up' | 'down' | 'stable';
  rank?: string;
  percentile?: number;
  compact?: boolean;
  showProgress?: boolean;
}

const typeConfig = {
  duel: {
    label: 'DUEL',
    icon: '⚔️',
    color: 'duel',
    gradient: 'from-duel-500 to-duel-600',
    bg: 'bg-duel-50 dark:bg-duel-900/20',
    border: 'border-duel-200 dark:border-duel-800',
  },
  practice: {
    label: 'PROBLEM SET',
    icon: '💻',
    color: 'practice',
    gradient: 'from-practice-500 to-practice-600',
    bg: 'bg-practice-50 dark:bg-practice-900/20',
    border: 'border-practice-200 dark:border-practice-800',
  },
  adaptive: {
    label: 'ADAPTIVE',
    icon: '🧠',
    color: 'adaptive',
    gradient: 'from-adaptive-500 to-adaptive-600',
    bg: 'bg-adaptive-50 dark:bg-adaptive-900/20',
    border: 'border-adaptive-200 dark:border-adaptive-800',
  },
};

const RatingCard = forwardRef<HTMLDivElement, RatingCardProps>(
  ({
    className,
    type,
    rating,
    level,
    xp,
    xpToNextLevel,
    weeklyXpGain,
    trend = 'stable',
    rank,
    percentile,
    compact = false,
    showProgress = true,
    ...props
  }, ref) => {
    const config = typeConfig[type];
    const totalXpForLevel = xp + xpToNextLevel;
    const progressPercentage = totalXpForLevel > 0 ? (xp / totalXpForLevel) * 100 : 0;

    const trendIcons = {
      up: (
        <svg className="w-4 h-4 text-practice-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      down: (
        <svg className="w-4 h-4 text-duel-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      stable: (
        <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      ),
    };

    return (
      <Card
        ref={ref}
        variant="outlined"
        className={cn(
          config.border,
          config.bg,
          'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
          compact && 'p-4',
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
        
        <div className="relative flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">{config.icon}</span>
              <div>
                <span className={cn('text-xs font-semibold uppercase tracking-wider', `text-${config.color}-700 dark:text-${config.color}-300`)}>
                  {config.label}
                </span>
                {rank && (
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{rank}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {trendIcons[trend]}
              {percentile && (
                <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
                  Top {100 - percentile}%
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center mb-4">
            <div className="mb-2">
              <span className={cn('text-4xl font-bold tabular-nums', compact && 'text-3xl', getRatingColor(rating))}>
                {formatRating(rating)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={cn('font-medium px-2 py-0.5 rounded-full', `bg-${config.color}-100 text-${config.color}-700 dark:bg-${config.color}-900/30 dark:text-${config.color}-300`)}>
                Level {level}
              </span>
              {compact && (
                <>
                  <span className="text-surface-500 dark:text-surface-400">•</span>
                  <span className="font-mono text-brand-600 dark:text-brand-400">{xp.toLocaleString()} XP</span>
                </>
              )}
            </div>
          </div>

          {showProgress && !compact && (
            <div className="space-y-3 pt-4 border-t border-surface-200 dark:border-surface-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-600 dark:text-surface-400">XP Progress</span>
                <span className="font-mono font-medium text-surface-900 dark:text-white">
                  {xp.toLocaleString()} / {totalXpForLevel.toLocaleString()}
                </span>
              </div>
              <ProgressBar
                value={xp}
                max={totalXpForLevel}
                variant={type}
                size="md"
                showLabel={false}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-500 dark:text-surface-400">
                  {xpToNextLevel.toLocaleString()} XP to Level {level + 1}
                </span>
                <span className={cn('font-medium flex items-center gap-1', weeklyXpGain >= 0 ? 'text-practice-600' : 'text-duel-600')}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ 
                    backgroundColor: weeklyXpGain >= 0 ? '#22c55e' : '#ef4444' 
                  }} />
                  {weeklyXpGain >= 0 ? '+' : ''}{weeklyXpGain} XP this week
                </span>
              </div>
            </div>
          )}

          {compact && (
            <div className="pt-3 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
              <ProgressBar
                value={xp}
                max={totalXpForLevel}
                variant={type}
                size="sm"
                showLabel={false}
                className="flex-1 mr-3"
              />
              <div className="text-right">
                <p className="text-xs text-surface-500 dark:text-surface-400">Weekly</p>
                <p className={cn('text-xs font-medium', weeklyXpGain >= 0 ? 'text-practice-600' : 'text-duel-600')}>
                  {weeklyXpGain >= 0 ? '+' : ''}{weeklyXpGain} XP
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

RatingCard.displayName = 'RatingCard';

export { RatingCard };

export interface CompactRatingCardProps extends Omit<RatingCardProps, 'compact'> {
  compact?: true;
}

export const CompactRatingCard = forwardRef<HTMLDivElement, CompactRatingCardProps>(
  (props, ref) => <RatingCard ref={ref} {...props} compact={true} showProgress={false} />,
);

CompactRatingCard.displayName = 'CompactRatingCard';