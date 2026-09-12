import type { Battle, BattleParticipant, BattleResult, Problem, User } from '../types';
import { mockBattles, mockProblems } from './mockData';

function generateBattleCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DC-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const botOpponents: Array<{ name: string; ratingOffset: number }> = [
  { name: 'Kavya_Dev', ratingOffset: 12 },
  { name: 'AlgoNinja_99', ratingOffset: -24 },
  { name: 'BinaryPhantom', ratingOffset: 35 },
  { name: 'RecursionRex', ratingOffset: -8 },
  { name: 'ByteMaster', ratingOffset: 19 },
];

export const battleService = {
  async getBattles(status?: Battle['status']): Promise<Battle[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    let battles = [...mockBattles];
    if (status) {
      battles = battles.filter(b => b.status === status);
    }
    return battles.sort((a, b) => new Date(b.startedAt || '').getTime() - new Date(a.startedAt || '').getTime());
  },

  async getBattle(id: string): Promise<Battle | null> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return mockBattles.find(b => b.id === id || b.battleCode === id) || null;
  },

  async createCustomBattle(
    isRanked: boolean,
    user: { id: string; name: string; duelRating?: { rating: number } },
    problemId?: string
  ): Promise<Battle> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const problem = problemId ? mockProblems.find(p => p.id === problemId) : mockProblems[Math.floor(Math.random() * mockProblems.length)];
    const battleCode = generateBattleCode();

    const userRating = user.duelRating?.rating || 1642;

    const newBattle: Battle = {
      id: `battle-${Date.now()}`,
      battleCode,
      isRanked,
      status: 'waiting',
      mode: 'duel',
      participants: [
        {
          userId: user.id,
          name: user.name,
          rating: userRating,
          status: 'connected',
          testCasesPassed: 0,
          totalTestCases: problem?.testCases?.length || 5,
        },
      ],
      problem,
      timeLimit: 30,
      language: 'javascript',
      startedAt: new Date().toISOString(),
    };

    mockBattles.unshift(newBattle);
    return newBattle;
  },

  async joinCustomBattle(
    battleCode: string,
    user: { id: string; name: string; duelRating?: { rating: number } }
  ): Promise<Battle> {
    await new Promise(resolve => setTimeout(resolve, 350));
    const normalized = battleCode.trim().toUpperCase();
    const battle = mockBattles.find(b => b.battleCode === normalized);
    
    if (!battle) {
      throw new Error(`No active battle found with code "${battleCode}". Please verify the code and try again.`);
    }

    if (battle.status !== 'waiting') {
      throw new Error('This battle has already started or concluded.');
    }

    const userRating = user.duelRating?.rating || 1642;

    battle.participants.push({
      userId: user.id,
      name: user.name,
      rating: userRating,
      status: 'connected',
      testCasesPassed: 0,
      totalTestCases: battle.problem?.testCases?.length || 5,
    });

    battle.status = 'active';
    battle.startedAt = new Date().toISOString();
    return battle;
  },

  async findQuickMatch(
    isRanked: boolean,
    user: { id: string; name: string; duelRating?: { rating: number } }
  ): Promise<Battle> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const problem = mockProblems[Math.floor(Math.random() * mockProblems.length)];
    const userRating = user.duelRating?.rating || 1642;
    const bot = botOpponents[Math.floor(Math.random() * botOpponents.length)];
    const opponentRating = Math.max(1000, userRating + bot.ratingOffset);

    const newBattle: Battle = {
      id: `battle-${Date.now()}`,
      battleCode: generateBattleCode(),
      isRanked,
      status: 'active',
      mode: 'duel',
      participants: [
        {
          userId: user.id,
          name: user.name,
          rating: userRating,
          status: 'coding',
          testCasesPassed: 0,
          totalTestCases: problem.testCases?.length || 5,
        },
        {
          userId: `opp-${Date.now()}`,
          name: bot.name,
          rating: opponentRating,
          status: 'coding',
          testCasesPassed: 0,
          totalTestCases: problem.testCases?.length || 5,
        },
      ],
      problem,
      timeLimit: 30,
      language: 'javascript',
      startedAt: new Date().toISOString(),
    };

    mockBattles.unshift(newBattle);
    return newBattle;
  },

  async simulateOpponentProgress(
    battleId: string,
    onProgress: (participant: BattleParticipant) => void
  ): Promise<() => void> {
    const battle = mockBattles.find(b => b.id === battleId);
    if (!battle) return () => {};

    const opponent = battle.participants.find(p => p.userId.startsWith('opp-'));
    if (!opponent) return () => {};

    let step = 0;
    const totalCases = opponent.totalTestCases || 5;

    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        opponent.status = 'coding';
        opponent.testCasesPassed = 1;
        onProgress({ ...opponent });
      } else if (step === 2) {
        opponent.testCasesPassed = Math.min(3, totalCases);
        onProgress({ ...opponent });
      } else if (step === 3) {
        opponent.testCasesPassed = Math.min(4, totalCases);
        onProgress({ ...opponent });
      } else if (step === 4) {
        opponent.status = 'submitted';
        opponent.testCasesPassed = totalCases;
        onProgress({ ...opponent });
        clearInterval(interval);
      }
    }, 4500);

    return () => clearInterval(interval);
  },

  async submitCode(
    battleId: string,
    userId: string,
    code: string,
    language: string,
    durationSeconds = 240
  ): Promise<BattleResult> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const battle = mockBattles.find(b => b.id === battleId);
    if (!battle) throw new Error('Battle not found');

    const participant = battle.participants.find(p => p.userId === userId);
    const opponent = battle.participants.find(p => p.userId !== userId);

    const isRanked = battle.isRanked !== false;
    const isVictory = true; // In demo flow, user's successful submission wins

    if (participant) {
      participant.code = code;
      participant.status = 'passed';
      participant.testCasesPassed = battle.problem?.testCases?.length || 5;
    }

    if (opponent) {
      opponent.status = 'passed';
      opponent.testCasesPassed = Math.max(1, (battle.problem?.testCases?.length || 5) - 1);
    }

    const ratingDelta = isRanked ? 38 : 0;
    const userRating = participant?.rating || 1642;
    const newRating = userRating + ratingDelta;
    const xpGained = isRanked ? 120 : 60;

    const result: BattleResult = {
      winnerId: userId,
      isVictory,
      scores: {
        [userId]: 95,
        [opponent?.userId || 'opp']: 82,
      },
      duration: durationSeconds,
      ratingChange: ratingDelta,
      xpGained,
      newRating,
      streak: 6,
      submissions: [
        {
          userId,
          code,
          language,
          status: 'accepted',
          score: 95,
          submittedAt: new Date().toISOString(),
        },
      ],
    };

    battle.status = 'completed';
    battle.endedAt = new Date().toISOString();
    battle.result = result;

    return result;
  },
};