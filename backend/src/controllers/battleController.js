import { asyncHandler } from '../utils/asyncHandler.js';
import * as battleService from '../services/battleService.js';

/** GET /api/battles */
export const list = asyncHandler(async (req, res) => {
  const limit  = Math.min(Number(req.query.limit)  || 20, 100);
  const page   = Math.max(Number(req.query.page)   || 1,  1);
  const result = await battleService.listBattles({
    userId: req.user._id.toString(),
    status: req.query.status,
    limit,
    page,
  });
  res.json({ success: true, data: result });
});

/** GET /api/battles/:id */
export const get = asyncHandler(async (req, res) => {
  const battle = await battleService.getBattle(req.params.id, req.user._id.toString());
  res.json({ success: true, data: battle });
});

/** POST /api/battles/custom */
export const createCustom = asyncHandler(async (req, res) => {
  const battle = await battleService.createCustomBattle({
    isRanked: req.body.isRanked !== false,
    problemId: req.body.problemId,
    user: req.user,
  });
  res.status(201).json({ success: true, message: 'Battle created', data: battle });
});

/** POST /api/battles/join */
export const join = asyncHandler(async (req, res) => {
  const battle = await battleService.joinCustomBattle({ battleCode: req.body.battleCode, user: req.user });
  res.json({ success: true, message: 'Joined battle', data: battle });
});

/** POST /api/battles/quick-match */
export const quickMatch = asyncHandler(async (req, res) => {
  const battle = await battleService.findQuickMatch({
    isRanked: req.body.isRanked !== false,
    user: req.user,
  });
  res.status(201).json({ success: true, message: 'Match found', data: battle });
});

/** POST /api/battles/:id/submit */
export const submit = asyncHandler(async (req, res) => {
  const result = await battleService.submitBattleCode({
    battleId: req.params.id,
    code: req.body.code,
    language: req.body.language ?? 'javascript',
    user: req.user,
  });
  res.json({ success: true, data: result });
});
