import { asyncHandler } from '../utils/asyncHandler.js';
import * as problemService from '../services/problemService.js';

/** GET /api/problems */
export const list = asyncHandler(async (req, res) => {
  const { page, limit, difficulty, search, topic, status } = req.query;
  const result = await problemService.listProblems({
    page: Number(page) || 1,
    limit: Math.min(Number(limit) || 20, 100),
    difficulty,
    search,
    topic,
    userId: req.user?._id?.toString(),
  });
  res.json({ success: true, data: result });
});

/** GET /api/problems/:id */
export const get = asyncHandler(async (req, res) => {
  const problem = await problemService.getProblem(req.params.id, req.user?._id?.toString());
  res.json({ success: true, data: problem });
});

/** GET /api/problems/:id/statistics */
export const statistics = asyncHandler(async (req, res) => {
  const stats = await problemService.getProblemStatistics(req.params.id);
  res.json({ success: true, data: stats });
});

/** POST /api/problems (teacher) */
export const create = asyncHandler(async (req, res) => {
  const problem = await problemService.createProblem(req.body, req.user);
  res.status(201).json({ success: true, message: 'Problem created', data: problem });
});

/** PUT /api/problems/:id (teacher) */
export const update = asyncHandler(async (req, res) => {
  const problem = await problemService.updateProblem(req.params.id, req.body);
  res.json({ success: true, message: 'Problem updated', data: problem });
});

/** DELETE /api/problems/:id (teacher) */
export const remove = asyncHandler(async (req, res) => {
  await problemService.deleteProblem(req.params.id);
  res.status(204).send();
});

/** POST /api/problems/:id/run — sandbox evaluation against PUBLIC test cases only. */
export const run = asyncHandler(async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(422).json({ success: false, error: 'code is required' });
  const result = await problemService.runTestCases(req.params.id, code, language ?? 'javascript', req.user);
  res.json({ success: true, data: result });
});

/** POST /api/problems/:id/submit — full suite, persisted, rating/XP effects. */
export const submit = asyncHandler(async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(422).json({ success: false, error: 'code is required' });
  const result = await problemService.evaluateSubmission({ problemId: req.params.id, code, language: language ?? 'javascript', user: req.user });
  res.json({ success: true, data: result });
});
