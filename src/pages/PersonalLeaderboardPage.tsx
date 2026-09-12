import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Avatar } from '@components/ui/Avatar';
import { Tabs, TabsList, TabTrigger, TabPanel } from '@components/ui/Tabs';
import { mockLeaderboard } from '@services/mockData';
import { cn, formatRating } from '@utils';

export function PersonalLeaderboardPage() {
  const [activeMode, setActiveMode] = useState<'duel' | 'practice' | 'adaptive'>('duel');

  const modeConfig = {
    duel: { label: 'Duel', icon: '⚔️', color: 'duel' },
    practice: { label: 'Problem Set', icon: '💻', color: 'practice' },
    adaptive: { label: 'Adaptive', icon: '🧠', color: 'adaptive' },
  };

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Leaderboards</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">Compare your ranking across all three rating systems</p>
        </div>
      </div>

      <Tabs defaultValue="duel" value={activeMode} onChange={(val) => setActiveMode(val as 'duel' | 'practice' | 'adaptive')} variant="pills">
        <TabsList aria-label="Leaderboard mode">
          {Object.entries(modeConfig).map(([key, config]) => (
            <TabTrigger key={key} value={key} leftIcon={<span>{config.icon}</span>}>
              {config.label}
            </TabTrigger>
          ))}
        </TabsList>

        {(Object.keys(modeConfig) as Array<keyof typeof modeConfig>).map((mode) => (
          <TabPanel key={mode} value={mode}>
            <Card variant="glass">
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400 w-16">Rank</th>
                        <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Player</th>
                        <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Rating</th>
                        <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Level</th>
                        <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">XP</th>
                        <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Win Rate</th>
                        <th className="text-left p-3 text-sm font-medium text-surface-500 dark:text-surface-400">Solved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockLeaderboard.map((entry) => (
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
                            <span className={cn('font-mono font-bold text-lg', formatRating(entry.rating))} />
                          </td>
                          <td className="p-3">
                            <Badge variant={modeConfig[mode].color as any} size="sm">Lv.{entry.level}</Badge>
                          </td>
                          <td className="p-3 text-sm text-surface-600 dark:text-surface-400 font-mono">{entry.xp.toLocaleString()}</td>
                          <td className="p-3 text-sm text-surface-600 dark:text-surface-400">{entry.winRate}%</td>
                          <td className="p-3 text-sm text-surface-600 dark:text-surface-400">{entry.problemsSolved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabPanel>
        ))}

        <div className="mt-6 p-6 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-2">Your Position</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(modeConfig).map(([key, config]) => (
              <div key={key} className="p-4 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                <div className="flex items-center gap-2 mb-2">
                  <span>{config.icon}</span>
                  <span className="font-medium text-surface-900 dark:text-white">{config.label} Rating</span>
                </div>
                <div className="text-2xl font-bold text-surface-900 dark:text-white">
                  {key === 'duel' ? '1,823' : key === 'practice' ? '1,654' : '1,789'}
                </div>
                <div className="text-sm text-surface-500 dark:text-surface-400">Rank #{key === 'duel' ? '156' : key === 'practice' ? '234' : '89'}</div>
              </div>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
}