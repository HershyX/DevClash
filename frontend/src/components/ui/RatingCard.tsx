import { forwardRef, HTMLAttributes } from 'react';
import { cn, formatRating } from '../../utils';

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

const cfg = {
  duel: {
    label: 'DUEL',
    icon: '⚔️',
    accent:       '#f59e0b',
    accentLight:  '#fcd34d',
    border:       'rgba(245,158,11,0.2)',
    bg:           'rgba(245,158,11,0.06)',
    glow:         'rgba(245,158,11,0.15)',
    bar:          'linear-gradient(90deg,#fbbf24,#f59e0b)',
    levelBg:      'rgba(245,158,11,0.15)',
    levelText:    '#fcd34d',
  },
  practice: {
    label: 'PROBLEM SET',
    icon: '💻',
    accent:       '#06b6d4',
    accentLight:  '#67e8f9',
    border:       'rgba(6,182,212,0.2)',
    bg:           'rgba(6,182,212,0.06)',
    glow:         'rgba(6,182,212,0.15)',
    bar:          'linear-gradient(90deg,#22d3ee,#06b6d4)',
    levelBg:      'rgba(6,182,212,0.15)',
    levelText:    '#67e8f9',
  },
  adaptive: {
    label: 'ADAPTIVE',
    icon: '🧠',
    accent:       '#d946ef',
    accentLight:  '#f0abfc',
    border:       'rgba(217,70,239,0.2)',
    bg:           'rgba(217,70,239,0.06)',
    glow:         'rgba(217,70,239,0.15)',
    bar:          'linear-gradient(90deg,#e879f9,#d946ef)',
    levelBg:      'rgba(217,70,239,0.15)',
    levelText:    '#f0abfc',
  },
};

const RatingCard = forwardRef<HTMLDivElement, RatingCardProps>(
  ({ className, type, rating, level, xp, xpToNextLevel, weeklyXpGain, trend = 'stable', rank, percentile, compact = false, showProgress = true, ...props }, ref) => {
    const c = cfg[type];
    const total = xp + xpToNextLevel;
    const pct   = total > 0 ? Math.round((xp / total) * 100) : 0;

    return (
      <div
        ref={ref}
        className={cn('relative rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5', className)}
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${c.glow} 0%, transparent 65%), #0d1117`,
          border: `1px solid ${c.border}`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
        }}
        {...props}
      >
        {/* Top accent bar */}
        <div className="h-[2px] w-full" style={{ background: c.bar }} />

        <div className={cn('p-5', compact && 'p-4')}>
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{c.icon}</span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.accentLight }}>
                  {c.label}
                </span>
                {rank && <p className="text-[10px] mt-0.5" style={{ color:'rgba(100,116,139,0.8)' }}>{rank}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {trend === 'up'   && <svg className="w-4 h-4" style={{ color:'#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>}
              {trend === 'down' && <svg className="w-4 h-4" style={{ color:'#f87171' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>}
              {trend === 'stable' && <svg className="w-4 h-4" style={{ color:'rgba(100,116,139,0.7)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14"/></svg>}
              {percentile != null && (
                <span className="text-xs font-medium" style={{ color:'rgba(148,163,184,0.8)' }}>Top {100 - percentile}%</span>
              )}
            </div>
          </div>

          {/* Rating number */}
          <div className="text-center mb-4">
            <div
              className={cn('font-black tabular-nums', compact ? 'text-3xl' : 'text-4xl')}
              style={{ color: c.accent, textShadow:`0 0 24px ${c.accent}60` }}
            >
              {formatRating(rating)}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: c.levelBg, color: c.levelText, border:`1px solid ${c.border}` }}
              >
                Level {level}
              </span>
              {compact && (
                <span className="text-xs font-mono font-semibold" style={{ color:'rgba(148,163,184,0.8)' }}>
                  {xp.toLocaleString()} XP
                </span>
              )}
            </div>
          </div>

          {/* Progress */}
          {showProgress && !compact && (
            <div className="space-y-2 pt-4" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color:'rgba(100,116,139,0.8)' }}>XP Progress</span>
                <span className="font-mono font-semibold text-white">{xp.toLocaleString()} / {total.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width:`${pct}%`, background: c.bar, boxShadow:`0 0 6px ${c.accent}80` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color:'rgba(100,116,139,0.7)' }}>{xpToNextLevel.toLocaleString()} XP to Level {level + 1}</span>
                <span className="font-semibold flex items-center gap-1" style={{ color: weeklyXpGain >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: weeklyXpGain >= 0 ? '#10b981' : '#ef4444' }}/>
                  {weeklyXpGain >= 0 ? '+' : ''}{weeklyXpGain} XP this week
                </span>
              </div>
            </div>
          )}

          {compact && (
            <div className="pt-3 flex items-center gap-3" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width:`${pct}%`, background: c.bar }}/>
              </div>
              <span className="text-[11px] font-semibold shrink-0" style={{ color: weeklyXpGain >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                {weeklyXpGain >= 0 ? '+' : ''}{weeklyXpGain} XP
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
RatingCard.displayName = 'RatingCard';
export { RatingCard };

export const CompactRatingCard = forwardRef<HTMLDivElement, Omit<RatingCardProps,'compact'>>((props, ref) => (
  <RatingCard ref={ref} {...props} compact showProgress={false} />
));
CompactRatingCard.displayName = 'CompactRatingCard';
