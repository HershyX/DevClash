import { useState, useEffect } from 'react';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { Tabs, TabsList, TabTrigger, TabPanel } from '@components/ui/Tabs';
import { analyticsService } from '@services/analyticsService';
import { cn } from '@utils';

type Mode = 'duel' | 'practice' | 'adaptive';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  rating: number;
  level: number;
  xp: number;
  winRate?: number;
  problemsSolved?: number;
}

export interface LadderPosition {
  rating: number;
  rank: number;
  caption: string;
}

interface LeaderboardViewProps {
  title: string;
  subtitle: string;
  /** Per-ladder positions for the summary strip (Your Position / Classroom Summary). */
  positions?: Partial<Record<Mode, LadderPosition>>;
  footerTitle?: string;
}

export function LeaderboardView({ title, subtitle, positions, footerTitle = 'Your Position' }: LeaderboardViewProps) {
  const [activeMode, setActiveMode] = useState<Mode>('duel');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const modeConfig = {
    duel: { label: 'Duel', icon: '⚔️', color: 'duel' },
    practice: { label: 'Problem Set', icon: '💻', color: 'practice' },
    adaptive: { label: 'Adaptive', icon: '🧠', color: 'adaptive' },
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    analyticsService
      .getLeaderboard(activeMode, 50)
      .then((data) => {
        if (!cancelled) setEntries(data as LeaderboardEntry[]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeMode]);

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const positionKeys = positions ? (Object.keys(modeConfig) as Mode[]).filter((m) => positions[m]) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">{title}</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">{subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="duel" value={activeMode} onChange={(val) => setActiveMode(val as Mode)} variant="pills">
        <TabsList aria-label="Leaderboard mode">
          {Object.entries(modeConfig).map(([key, config]) => (
            <TabTrigger key={key} value={key} leftIcon={<span>{config.icon}</span>}>
              {config.label}
            </TabTrigger>
          ))}
        </TabsList>

        {(Object.keys(modeConfig) as Mode[]).map((mode) => (
          <TabPanel key={mode} value={mode}>
            <Card variant="glass">
              <CardContent className="pt-0">
                {isLoading && mode === activeMode ? (
                  <div className="text-center py-12 text-surface-500">Loading leaderboard…</div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-12 text-surface-500">No entries on this ladder yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-200 dark:border-surface-700">
                          {['Rank', 'Player', 'Rating', 'Level', 'XP', 'Win Rate', 'Solved'].map((h) => (
                            <th key={h} className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry) => (
                          <tr key={entry.userId} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                            <td className="p-3">
                              <span className={cn('font-bold text-lg', entry.rank <= 3 ? 'text-yellow-500' : 'text-surface-600 dark:text-surface-400')}>
                                {getMedal(entry.rank)}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={entry.name} size="sm" />
                                <span className="font-medium text-surface-900 dark:text-white">{entry.name}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-lg text-surface-900 dark:text-white">
                                {entry.rating.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge variant={modeConfig[mode].color as 'duel' | 'practice' | 'adaptive'} size="sm">
                                Lv.{entry.level}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-surface-600 dark:text-surface-400 font-mono">{entry.xp.toLocaleString()}</td>
                            <td className="p-3 text-sm text-surface-600 dark:text-surface-400">
                              {entry.winRate != null ? `${entry.winRate}%` : '—'}
                            </td>
                            <td className="p-3 text-sm text-surface-600 dark:text-surface-400">
                              {entry.problemsSolved != null ? entry.problemsSolved : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        ))}

        {positionKeys.length > 0 && (
          <div className="mt-6 p-6 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
            <h3 className="font-semibold text-surface-900 dark:text-white mb-2">{footerTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {positionKeys.map((key) => {
                const pos = positions![key]!;
                return (
                  <div key={key} className="p-4 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{modeConfig[key].icon}</span>
                      <span className="font-medium text-surface-900 dark:text-white">{modeConfig[key].label} Rating</span>
                    </div>
                    <div className="text-2xl font-bold text-surface-900 dark:text-white">
                      {pos.rating.toLocaleString()}
                    </div>
                    <div className="text-sm text-surface-500 dark:text-surface-400">
                      {pos.rank > 0 ? `Rank #${pos.rank.toLocaleString()}` : 'Unranked'} · {pos.caption}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}
