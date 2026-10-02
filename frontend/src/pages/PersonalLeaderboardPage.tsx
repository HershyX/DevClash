import { useEffect, useState } from 'react';
import { LeaderboardView } from '@components/leaderboard/LeaderboardView';
import type { LadderPosition } from '@components/leaderboard/LeaderboardView';
import { useAuth } from '@context/AuthContext';
import { analyticsService } from '@services/analyticsService';

type Mode = 'duel' | 'practice' | 'adaptive';

export function PersonalLeaderboardPage() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Partial<Record<Mode, LadderPosition>>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const u = user as unknown as Record<string, { rating?: number }>;
      const [duelRank, practiceRank, adaptiveRank] = await Promise.all([
        analyticsService.getUserRank(user.id, 'duel'),
        analyticsService.getUserRank(user.id, 'practice'),
        analyticsService.getUserRank(user.id, 'adaptive'),
      ]);
      if (cancelled) return;
      setPositions({
        duel: { rating: u.duelRating?.rating ?? 1200, rank: duelRank, caption: 'Duel ladder' },
        practice: { rating: u.practiceRating?.rating ?? 1200, rank: practiceRank, caption: 'Problem Set ladder' },
        adaptive: { rating: u.adaptiveRating?.rating ?? 1200, rank: adaptiveRank, caption: 'Adaptive ladder' },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <LeaderboardView
      title="Leaderboards"
      subtitle="Compare your ranking across all three rating systems"
      positions={positions}
      footerTitle="Your Position"
    />
  );
}
