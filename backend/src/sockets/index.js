import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { setIo, getBotTimeline } from '../services/battleService.js';
import Battle from '../models/Battle.js';

/**
 * Socket.IO real-time layer.
 *
 * Authentication: same JWT as the REST API (Bearer token sent as socket.handshake.auth.token).
 *
 * Rooms:
 *  - `user:<userId>`    — personal notification channel, joined automatically on connect.
 *  - `battle:<battleId>` — joined by both players to receive live battle events.
 *
 * Events the SERVER emits (to rooms or sockets):
 *  - battle:joined            — to battle room when second player joins (via joinCustomBattle)
 *  - battle:start             — to battle room + creator user room when battle goes active
 *  - battle:submission-update — live progress of any player's submission attempt
 *  - battle:finished          — battle concluded (winner determined)
 *  - battle:opponent-progress — forwarded participant snapshot (used for progress bar)
 *  - battle:timer             — countdown heartbeat (emitted server-side every 60s)
 *  - notification:new         — pushed on personal user room for any server notification
 *
 * Events the SERVER receives (from client):
 *  - battle:join              — client joins a battle room
 *  - battle:leave             — client leaves a battle room
 *  - battle:request-state     — client asks for current battle state (re-fetch on reconnect)
 *  - battle:bot-timeline      — client asks for the cosmetic bot progress steps
 */
export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      env.clientOrigins,
      credentials: true,
    },
    // Allow 2-minute polling before upgrading to WS; helps in restricted networks
    transports: ['websocket', 'polling'],
  });

  // Wire io into battleService so service methods can push events
  setIo(io);

  // ── Authentication middleware ──────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token ?? null;
      if (!token) return next(new Error('Authentication required'));

      const payload = jwt.verify(token, env.jwtSecret);
      const user    = await User.findById(payload.sub);
      if (!user) return next(new Error('User no longer exists'));

      socket.data.userId = user._id.toString();
      socket.data.role   = user.role;
      return next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[socket] connected: ${socket.data.role} ${userId}`);

    // Auto-join the personal notification room
    socket.join(`user:${userId}`);

    // ── Battle room management ───────────────────────────────────────────────

    socket.on('battle:join', async ({ battleId }) => {
      if (typeof battleId !== 'string' || battleId.length > 64) return;
      socket.join(`battle:${battleId}`);
      socket.emit('battle:joined', { battleId });

      // On reconnect, send the current battle state so the UI can re-hydrate
      try {
        const battle = await Battle.findById(battleId).populate('problem').lean();
        if (battle) {
          const client = sanitizeBattleForSocket(battle);
          socket.emit('battle:state', { battleId, battle: client });

          // If the battle is active, push the bot timeline too
          if (battle.status === 'active') {
            const timeline = getBotTimeline(client, userId);
            if (timeline.length) {
              socket.emit('battle:bot-timeline', { battleId, timeline });
            }
          }
        }
      } catch { /* ignore — client will fall back to REST */ }
    });

    socket.on('battle:leave', ({ battleId }) => {
      if (typeof battleId === 'string') socket.leave(`battle:${battleId}`);
    });

    // Client explicitly requests the current battle state (e.g. after page refresh)
    socket.on('battle:request-state', async ({ battleId }) => {
      if (typeof battleId !== 'string') return;
      try {
        const battle = await Battle.findById(battleId).populate('problem').lean();
        if (battle) {
          socket.emit('battle:state', { battleId, battle: sanitizeBattleForSocket(battle) });
        }
      } catch { /* ignore */ }
    });

    // Client requests the cosmetic bot timeline
    socket.on('battle:bot-timeline', async ({ battleId }) => {
      if (typeof battleId !== 'string') return;
      try {
        const battle = await Battle.findById(battleId).lean();
        if (battle) {
          const timeline = getBotTimeline(sanitizeBattleForSocket(battle), userId);
          socket.emit('battle:bot-timeline', { battleId, timeline });
        }
      } catch { /* ignore */ }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected: ${socket.data.role} ${userId} (${reason})`);
      // Future: mark participant as disconnected, start grace timer
    });
  });

  return io;
}

/**
 * Return a battle object safe to send over the socket — strips source code
 * from participant records.
 */
function sanitizeBattleForSocket(b) {
  return {
    id:           b._id.toString(),
    battleCode:   b.battleCode,
    isRanked:     b.isRanked,
    status:       b.status,
    mode:         b.mode,
    timeLimit:    b.timeLimit,
    startedAt:    b.startedAt,
    endedAt:      b.endedAt,
    problem: b.problem && typeof b.problem === 'object'
      ? { ...b.problem, id: b.problem._id?.toString?.() ?? String(b.problem._id), _id: undefined }
      : b.problem,
    participants: (b.participants ?? []).map((p) => ({
      userId:          p.user?.toString?.() ?? String(p.user),
      name:            p.name,
      isBot:           p.isBot ?? false,
      rating:          p.rating,
      status:          p.status,
      score:           p.score,
      testCasesPassed: p.testCasesPassed,
      totalTestCases:  p.totalTestCases,
      // code intentionally omitted
    })),
    result: b.result
      ? {
          winnerId:  b.result.winnerId,
          isVictory: b.result.isVictory,
          duration:  b.result.duration,
          scores:    b.result.scores instanceof Map
            ? Object.fromEntries(b.result.scores)
            : (b.result.scores ?? {}),
        }
      : undefined,
  };
}

export { getBotTimeline };
