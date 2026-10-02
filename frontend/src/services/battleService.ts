import { apiClient } from './apiClient';
import type { Battle, BattleParticipant, BattleResult } from '../types';

/**
 * Battles now run through the backend: creation, joining, quick match and code
 * submission are REST calls; live opponent progress arrives over Socket.IO
 * (room `battle:<id>`). A small local fallback keeps the UI responsive if the
 * socket connection drops.
 */

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

let socket: any = null;

async function getSocket() {
  if (socket) return socket;
  const { io } = await import('socket.io-client');
  const token = localStorage.getItem('devclash_token');
  const url = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
  socket = io(url, {
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

function mapBattle(raw: any): Battle {
  return raw as Battle;
}

export const battleService = {
  async getBattles(status?: Battle['status'], limit = 20, page = 1): Promise<Battle[]> {
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (status) params.set('status', status);
      const res = await apiClient.get<ApiEnvelope<{ data: Battle[]; total: number } | Battle[]>>(
        `/battles?${params.toString()}`
      );
      // Handle both paginated shape { data: Battle[] } and plain Battle[]
      const raw = res.data;
      if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as any).data)) {
        return (raw as any).data;
      }
      return raw as Battle[];
    } catch {
      return [];
    }
  },

  async getBattle(id: string): Promise<Battle | null> {
    try {
      const res = await apiClient.get<ApiEnvelope<Battle>>(`/battles/${id}`);
      return mapBattle(res.data);
    } catch {
      return null;
    }
  },

  async createCustomBattle(
    isRanked: boolean,
    user: { id: string; name: string; duelRating?: { rating: number } },
    problemId?: string
  ): Promise<Battle> {
    const res = await apiClient.post<ApiEnvelope<Battle>>('/battles/custom', { isRanked, problemId });
    void user;
    return mapBattle(res.data);
  },

  async joinCustomBattle(
    battleCode: string,
    user: { id: string; name: string; duelRating?: { rating: number } }
  ): Promise<Battle> {
    const res = await apiClient.post<ApiEnvelope<Battle>>('/battles/join', { battleCode });
    void user;
    return mapBattle(res.data);
  },

  async findQuickMatch(
    isRanked: boolean,
    user: { id: string; name: string; duelRating?: { rating: number } }
  ): Promise<Battle> {
    const res = await apiClient.post<ApiEnvelope<Battle>>('/battles/quick-match', { isRanked });
    void user;
    return mapBattle(res.data);
  },

  /**
   * Live opponent progress: subscribes to the battle room over Socket.IO.
   * Returns an unsubscribe function (mirrors the old mock API shape).
   */
  async simulateOpponentProgress(
    battleId: string,
    onProgress: (participant: BattleParticipant) => void
  ): Promise<() => void> {
    try {
      const s = await getSocket();
      s.emit('battle:join', { battleId });

      const handler = (payload: { battleId: string; participant?: BattleParticipant }) => {
        if (payload.participant) onProgress(payload.participant);
      };
      s.on('battle:opponent-progress', handler);

      return () => {
        s.off('battle:opponent-progress', handler);
        s.emit('battle:leave', { battleId });
      };
    } catch {
      // Socket unavailable — no live progress; submission still works via REST.
      return () => {};
    }
  },

  async submitCode(
    battleId: string,
    userId: string,
    code: string,
    language: string,
    durationSeconds = 240
  ): Promise<BattleResult> {
    const res = await apiClient.post<ApiEnvelope<BattleResult>>(`/battles/${battleId}/submit`, {
      code,
      language,
      durationSeconds,
    });
    void userId;
    return res.data;
  },
};
