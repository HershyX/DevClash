# DevClash API Reference

Base URL: `http://localhost:3001/api` (dev) · `https://your-backend.com/api` (prod)

All authenticated endpoints require:
```
Authorization: Bearer <JWT>
```

All responses follow the envelope:
```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": "message" }
```

Rate limits: 300 req/min (general) · 30 req/15 min (auth endpoints)

---

## Authentication  `/api/auth`

### POST /api/auth/register
Register a new account.

**Body**
```json
{ "name": "Alex Johnson", "email": "alex@example.com", "password": "secret123", "role": "student" }
```
`role`: `student` | `teacher` | `personal`

**Response 201**
```json
{ "success": true, "data": { "user": { ...User }, "token": "eyJ..." } }
```

**Errors** `409` email taken · `422` validation failed

---

### POST /api/auth/login
Login with email + password.

**Body** `{ "email": "...", "password": "..." }`

**Response 200** `{ "success": true, "data": { "user": {...}, "token": "..." } }`

**Errors** `401` wrong credentials

---

### POST /api/auth/demo-login
One-click demo login (uses seeded accounts from MongoDB).

**Body** `{ "role": "student" }` — `student` | `teacher` | `personal`

**Response 200** same shape as `/login`

**Errors** `400` unknown role · `503` demo accounts not seeded (run `npm run seed`)

---

### POST /api/auth/logout
Stateless logout (JWT is client-side; this endpoint exists for explicit invalidation hooks).

**Auth required** ✓

**Response 200** `{ "success": true, "message": "Logged out" }`

---

### GET /api/auth/me
Return the authenticated user's full profile (refreshed from MongoDB).

**Auth required** ✓

**Response 200**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...", "name": "Alex Johnson", "email": "...", "role": "student",
      "duelRating":    { "rating": 1642, "xp": 28900, "level": 18, "xpToNextLevel": 3500, "weeklyXpGain": 42, "trend": "up" },
      "practiceRating":{ "rating": 1287, "xp": 14400, "level": 13, "xpToNextLevel": 2500, "weeklyXpGain": 85, "trend": "up" },
      "adaptiveRating":{ "rating": 1519, "xp": 22500, "level": 16, "xpToNextLevel": 3100, "weeklyXpGain": 67, "trend": "up" },
      "statistics": { "totalBattles": 84, "battlesWon": 52, "winRate": 62, "problemsSolved": 156, ... }
    }
  }
}
```

---

## Users  `/api/users`

### GET /api/users/me/stats
Dashboard stats: statistics + leaderboard ranks + active adaptive session.

**Auth required** ✓

**Response 200** `{ "data": { "user": {...}, "statistics": {...}, "ranks": { "duel": 4, "problemSet": 12, "adaptive": 7 }, "activeAdaptiveSession": null } }`

---

### GET /api/users/me/submissions
Submission history (paginated).

**Auth required** ✓

**Query params** `?problemId=<id>&limit=20`

**Response 200** `{ "data": [ { "id", "problemTitle", "language", "status", "testCasesPassed", "xpEarned", "createdAt" } ] }`

---

### PATCH /api/users/me
Update profile fields.

**Auth required** ✓

**Body** (any subset) `{ "name": "...", "bio": "...", "avatar": "https://..." }`

**Response 200** `{ "data": { "user": {...} } }`

---

## Problems  `/api/problems`

### GET /api/problems
List problems with filtering and pagination.

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default 1 |
| `limit` | number | Default 20, max 100 |
| `difficulty` | `easy`\|`medium`\|`hard` | Filter by difficulty |
| `topic` | string | Filter by topic tag |
| `search` | string | Text search on title/description |
| `status` | `solved`\|`unsolved` | Filter by user solve status (auth required) |

**Response 200** `{ "data": { "data": [Problem], "total": 8, "page": 1, "limit": 20, "totalPages": 1 } }`

---

### GET /api/problems/topics/list
All distinct topics across active problems.

**Response 200** `{ "data": ["Arrays", "Binary Search", "Dynamic Programming", ...] }`

---

### GET /api/problems/:id
Single problem. Public test cases only (hidden test cases never exposed).

**Response 200** `{ "data": Problem }`

**Errors** `404`

---

### GET /api/problems/:id/statistics
Acceptance rate, total submissions.

**Response 200** `{ "data": { "totalSubmissions": 1200, "acceptedSubmissions": 834, "acceptanceRate": 69.5, "averageTime": 42 } }`

---

### POST /api/problems/:id/run
Run code against **public test cases only**. Nothing persisted, no rating effects.

**Auth required** ✓

**Body** `{ "code": "function twoSum(...){...}", "language": "javascript" }`

**Response 200**
```json
{
  "data": {
    "status": "accepted",
    "passedCount": 3, "totalCount": 3,
    "runtimeMs": 12, "message": "All 3 test cases passed.",
    "testCaseResults": [ { "id": "tc-1", "input": "...", "expected": "...", "actual": "[0,1]", "passed": true, "timeMs": 4 } ]
  }
}
```
`status`: `accepted` | `wrong` | `tle` | `compile_error` | `runtime_error`

---

### POST /api/problems/:id/submit
Full submission against all test cases (including hidden). Persists a Submission record. Applies Problem Set XP/rating on first accepted solve.

**Auth required** ✓

**Body** `{ "code": "...", "language": "javascript" }`

**Response 200** same as `/run` plus `xpEarned`, `ratingDelta`, `previouslySolved`, `user` (updated user object)

**Anti-farm rule:** First accepted solve → full XP + rating. Repeat solve → 10% XP, no rating change.

---

### POST /api/problems  *(teacher only)*
Create a problem.

**Auth required** ✓ · **Role** `teacher`

**Body** `{ "title", "description", "difficulty", "topics", "constraints", "examples", "hints", "starterCode", "testCases" }`

**Response 201** `{ "data": Problem }`

---

### PUT /api/problems/:id  *(teacher only)*
Update a problem.

**Auth** ✓ · **Role** `teacher`

---

### DELETE /api/problems/:id  *(teacher only)*
Delete a problem.

**Auth** ✓ · **Role** `teacher`

**Response 204**

---

## Battles  `/api/battles`

All battle routes require auth. Create/join/submit require role `student` or `personal`.

### GET /api/battles
List the authenticated user's battles (paginated).

**Query params** `?status=active&limit=20&page=1`

**Response 200** `{ "data": { "data": [Battle], "total": 5, "page": 1, "limit": 20, "totalPages": 1 } }`

---

### GET /api/battles/:id
Get a single battle by ID or battle code (e.g. `DC-7F29K`).

**Response 200** `{ "data": Battle }`

---

### POST /api/battles/custom
Create a private battle and get a shareable code.

**Body** `{ "isRanked": true, "problemId": "..." }` (`problemId` optional — omit for random)

**Response 201** `{ "data": Battle }` — `battle.battleCode` is the code to share

---

### POST /api/battles/join
Join a battle by code.

**Body** `{ "battleCode": "DC-7F29K" }`

**Response 200** `{ "data": Battle }` — battle is now `active`

**Errors** `404` code not found · `409` already started / already full / already joined

---

### POST /api/battles/quick-match
Instant match against a named bot.

**Body** `{ "isRanked": true }`

**Response 201** `{ "data": Battle }` — battle is immediately `active`

---

### POST /api/battles/:id/submit
Submit code for a battle. Runs through the real sandbox. Applies Duel rating/XP on completion.

**Body** `{ "code": "...", "language": "javascript" }`

**Response 200**
```json
{
  "data": {
    "isVictory": true, "evalStatus": "accepted",
    "passedCount": 5, "totalCount": 5,
    "ratingChange": 38, "xpGained": 120, "newRating": 1680,
    "streak": 3, "duration": 542,
    "user": { ...updatedUser }
  }
}
```

**Security enforced server-side:**
- User must be a participant
- Battle must be `active`
- Player must not have already submitted a passing solution
- Casual battles: `ratingChange` is always 0
- Source code is never stored in the battle document

---

## Adaptive Coding  `/api/adaptive`

All routes require auth. Session start/submit require role `student` or `personal`.

### POST /api/adaptive/session
Start (or resume) an adaptive session. The engine picks the first problem.

**Body** `{ "focusTopics": ["Arrays", "Graphs"] }` (empty array = fully adaptive)

**Response 201**
```json
{
  "data": {
    "id": "...", "status": "active",
    "currentProblem": { ...Problem },
    "reasoning": "Weakest area right now: Graphs (skill 32/100).",
    "problemsAttempted": []
  }
}
```

---

### POST /api/adaptive/session/:id/next
Get the next recommended problem.

**Response 200** — updated session with new `currentProblem` and `reasoning`

---

### POST /api/adaptive/session/:id/submit
Submit code for the session's current problem. Runs sandbox evaluation. Updates Adaptive rating/XP and SkillProfile.

**Body** `{ "code": "...", "language": "javascript", "timeSpent": 120 }`

**Response 200** `{ "data": { "evalStatus", "passedCount", "totalCount", "ratingChange", "xpEarned", "session", "user" } }`

---

### POST /api/adaptive/session/:id/complete
End a session.

**Response 200** `{ "data": { ...session, "status": "completed" } }`

---

### GET /api/adaptive/sessions
List all sessions for the authenticated user.

---

### GET /api/adaptive/sessions/:id
Get a single session.

---

### GET /api/adaptive/skill-profile
Full skill analytics: per-topic accuracy, skill scores, strongest/weakest topics.

**Response 200**
```json
{
  "data": {
    "topics": [ { "topic": "Arrays", "attempts": 12, "solved": 9, "accuracy": 75, "skillScore": 68 } ],
    "strongest": [...], "weakest": [...],
    "overall": { "accuracy": 71, "totalAttempted": 45, "totalSolved": 32, "avgSolveTimeSec": 480 },
    "difficultyPerformance": { "easy": { "attempts": 20, "solved": 18, "accuracy": 90 }, ... }
  }
}
```

---

### GET /api/adaptive/history
Completed session summaries.

**Query** `?limit=10`

**Response 200** `{ "data": [ { "id", "date", "problems", "solved", "xp", "ratingChange", "durationSec", "topics", "accuracy" } ] }`

---

## Classrooms  `/api/classrooms`

### POST /api/classrooms/join  *(student only)*
Join a classroom by code.

**Body** `{ "code": "CS101-F24" }`

**Response 200** `{ "data": { "classroomId", "name", "code" } }`

**Errors** `404` code not found · `409` already a member · `403` non-student

---

### GET /api/classrooms  *(teacher only)*
List teacher's classrooms with student counts.

**Response 200** `{ "data": [ { "id", "name", "code", "studentCount", "isActive", "createdAt" } ] }`

---

### POST /api/classrooms  *(teacher only)*
Create a classroom. Auto-generates a unique join code.

**Body** `{ "name": "CS 101", "description": "...", "subject": "...", "section": "..." }`

**Response 201** `{ "data": { ...Classroom, "code": "CS10-26-ABCD" } }`

---

### GET /api/classrooms/:id  *(teacher only)*
Full classroom detail including student list with all three ratings.

**Response 200** `{ "data": { ...Classroom, "students": [ { "userId", "name", "email", "duelRating", "practiceRating", "adaptiveRating", "problemsSolved", "isActive" } ] } }`

---

### PUT /api/classrooms/:id  *(teacher only)*
Update classroom name/description/settings.

### DELETE /api/classrooms/:id  *(teacher only)*
Delete classroom and all memberships. **Response 204**

### POST /api/classrooms/:id/students  *(teacher only)*
Add a student by email. **Body** `{ "email": "student@example.com" }`

### DELETE /api/classrooms/:id/students/:studentId  *(teacher only)*
Remove a student.

### GET /api/classrooms/:id/analytics  *(teacher only)*
Classroom-level statistics: average ratings, active students, recent activity.

### GET /api/classrooms/:id/students/:studentId  *(teacher only)*
Individual student detail with 12-point rating history across all three ladders.

### GET /api/classrooms/students  *(teacher only)*
All students across all of the teacher's classrooms in one call. Each entry includes `classroom` (name) and `classroomId`.

---

## Analytics  `/api/analytics`

All require auth.

### GET /api/analytics/leaderboard
Global leaderboard for one rating ladder.

**Query** `?ladder=duel&limit=50&offset=0` — `ladder`: `duel` | `problemSet` | `adaptive`

**Response 200** `{ "data": [ { "rank", "userId", "name", "rating", "level", "xp", "winRate", "problemsSolved" } ] }`

---

### GET /api/analytics/rank
Authenticated user's rank on a ladder.

**Query** `?ladder=duel`

**Response 200** `{ "data": { "rank": 4 } }`

---

### GET /api/analytics/activity
Activity feed (per-user or global).

**Query** `?scope=global&limit=20` — omit `scope` for personal feed

**Response 200** `{ "data": [ { "id", "userId", "userName", "type", "description", "metadata", "timestamp" } ] }`

---

### GET /api/analytics/statistics
Authenticated user's full statistics object.

---

### GET /api/analytics/rating-history
Rating over time for one ladder.

**Query** `?ladder=duel&days=30`

**Response 200** `{ "data": [ { "date": "2026-09-01", "rating": 1580 } ] }`

---

### GET /api/analytics/weekly-progress
XP/activity this week across all three ladders.

**Response 200**
```json
{ "data": {
  "duel":    { "xp": 240, "battles": 6, "wins": 4 },
  "practice":{ "xp": 360, "problems": 8, "solved": 6 },
  "adaptive":{ "xp": 180, "sessions": 3, "completed": 3 }
}}
```

---

### GET /api/analytics/skill-breakdown
Per-tag problem solve proficiency (0–100 score per tag).

**Response 200** `{ "data": { "Arrays": 80, "Dynamic Programming": 55, "Graphs": 32 } }`

---

### GET /api/analytics/teacher  *(teacher only)*
Aggregated analytics across all the teacher's classrooms.

**Response 200**
```json
{ "data": {
  "totalClassrooms": 2, "totalStudents": 8, "activeStudents": 6,
  "averageDuelRating": 1520, "averagePracticeRating": 1340, "averageAdaptiveRating": 1430,
  "topStudents": [ { "rank", "userId", "name", "rating", "level", "winRate", "problemsSolved" } ],
  "recentActivity": [ ...ActivityEvent ]
}}
```

---

## Notifications  `/api/notifications`

All require auth.

### GET /api/notifications
List notifications (paginated).

**Query** `?unread=true&limit=20&page=1`

**Response 200** `{ "data": [ { "id", "type", "title", "message", "isRead", "createdAt" } ] }`

---

### GET /api/notifications/unread-count
**Response 200** `{ "data": { "count": 3 } }`

---

### POST /api/notifications/mark-read
Mark one or all notifications as read.

**Body** `{ "id": "..." }` — omit `id` to mark all read

**Response 200** `{ "success": true, "message": "Notifications marked as read" }`

---

## Error Responses

| Status | When |
|--------|------|
| 400 | Bad request / invalid input format |
| 401 | Missing or expired JWT |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, battle already started, etc.) |
| 422 | Validation failed (field-level errors in `details` array) |
| 429 | Rate limit exceeded |
| 500 | Internal server error (message is generic in production) |

**422 example:**
```json
{
  "success": false,
  "error": "Name must be 2-80 characters",
  "details": [ { "field": "name", "message": "Name must be 2-80 characters" } ]
}
```
