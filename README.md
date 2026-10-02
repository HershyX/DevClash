# DevClash — Full-Stack Competitive Coding Platform

> Real-time 1v1 coding duels · Adaptive learning · Problem sets · Teacher classrooms · Three independent rating systems

---

## What is DevClash?

DevClash is a full-stack competitive coding platform where students battle each other in live 1v1 coding duels, sharpen skills through an AI-powered adaptive engine, and work through curated problem sets — all tracked across **three completely independent rating ladders** (Duel, Problem Set, Adaptive). Teachers manage classrooms, monitor student progress, and see cross-system analytics.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│   React 19 + Vite + TypeScript + Tailwind + Framer Motion   │
│   Socket.IO client (real-time battles + notifications)      │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / WSS
┌───────────────────────▼─────────────────────────────────────┐
│              Node.js  (Express 4 + Socket.IO 4)             │
│   REST API (/api/*)   JWT auth   Rate limiting   CORS        │
│   Sandbox queue → Docker containers (code execution)        │
└───────────────────────┬─────────────────────────────────────┘
                        │ Mongoose 8
┌───────────────────────▼─────────────────────────────────────┐
│                    MongoDB 7                                 │
│   (Docker Compose for dev · MongoDB Atlas for production)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Authentication** | JWT + bcrypt, role-based (student / teacher / personal) |
| **Demo accounts** | One-click login for all three roles, seeded from MongoDB |
| **Problem Sets** | 8 seeded problems (easy→hard), filtering, search, hidden test cases |
| **Code Execution** | Isolated Docker sandboxes (`--network none`, `--memory 128m`, `--cpus 0.5`) |
| **1v1 Duels** | Real-time battles via Socket.IO, ranked + casual, bot quick-match |
| **Adaptive Coding** | Engine selects problems by topic skill score, adjusts difficulty live |
| **Three Rating Ladders** | Duel · Problem Set · Adaptive — completely independent, never cross-contaminated |
| **Teacher Classrooms** | Create classroom → share code → students join → analytics per student |
| **Leaderboards** | Separate leaderboard per ladder, paginated |
| **Notifications** | MongoDB-backed + Socket.IO push on battle events |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 3, Framer Motion |
| Backend | Node.js, Express 4, Socket.IO 4 |
| Database | MongoDB 7 (Mongoose 8) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Real-time | Socket.IO (battles, notifications) |
| Code execution | Docker containers (isolated, read-only, no network) |
| Testing | Vitest (43 tests across auth, rating isolation, battle security, classroom auth) |

---

## Project Structure

```
devclash/
├── frontend/               React app (Vite)
│   ├── src/
│   │   ├── pages/          21 page components (StudentDashboard, DuelPage, AdaptivePage, …)
│   │   ├── components/     Reusable UI (Button, Card, RatingCard, Toast, …)
│   │   ├── services/       API clients (apiClient, authService, battleService, …)
│   │   ├── context/        AuthContext, ToastContext
│   │   └── types/          Shared TypeScript types
│   └── .env.local          VITE_API_BASE_URL (not committed)
│
├── backend/                Express API
│   ├── src/
│   │   ├── config/         db.js, env.js
│   │   ├── controllers/    Route handlers (authController, battleController, …)
│   │   ├── middleware/      auth.js, rateLimiter.js, errorHandler.js, validate.js
│   │   ├── models/         Mongoose models (User, Problem, Battle, …)
│   │   ├── routes/         Express routers
│   │   ├── services/       Business logic (battleService, problemService, …)
│   │   │   └── sandbox/    Code execution (runner.js, Dockerfile.node, Dockerfile.python)
│   │   ├── sockets/        Socket.IO server (index.js)
│   │   └── utils/          ladder.js, asyncHandler.js, validateRun.js
│   ├── scripts/            seed.js, verify.mjs, verify-v2.mjs
│   ├── tests/              Vitest test suites
│   └── .env                Local dev environment variables
│
├── docker-compose.yml      MongoDB 7 dev server
├── docs/
│   └── API.md              Full API reference
└── README.md               This file
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Docker Desktop (for MongoDB and optional code sandboxing)
- npm 9+

### 1. Start MongoDB

```bash
docker compose up -d
```

Verify: `docker ps` should show `devclash-mongo` as `(healthy)`.

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure environment

Backend (already committed for local dev — do not use in production):
```
backend/.env    ← already present, uses localhost:27017
```

Frontend:
```bash
# frontend/.env.local
VITE_API_BASE_URL=http://localhost:3001/api
```

### 4. Seed demo data

```bash
cd backend && npm run seed
```

Creates 3 demo accounts, 8 problems, 2 classrooms, rating history, battles.

### 5. Start the backend

```bash
cd backend && npm run dev
```

Starts on `http://localhost:3001`. Logs `[db] MongoDB connected`.

### 6. Start the frontend

```bash
cd frontend && npm run dev
```

Opens at `http://localhost:5173`.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | `student@devclash.demo` | `demo1234` |
| Teacher | `teacher@devclash.demo` | `demo1234` |
| Personal | `personal@devclash.demo` | `demo1234` |

Or use the one-click **Demo Login** buttons on the login page.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `PORT` | `3001` | HTTP server port |
| `MONGO_URI` | `mongodb://localhost:27017/devclash` | MongoDB connection string |
| `JWT_SECRET` | dev fallback | **Must be a strong random string in production** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Comma-separated allowed CORS origins |

Generate a production secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3001/api` | Backend API base URL |

---

## Available Scripts

### Root
```bash
npm run mongo:up        # docker compose up -d (start MongoDB)
npm run mongo:down      # docker compose down
npm run seed            # seed demo data
npm run dev:backend     # start backend in dev mode
npm run dev:frontend    # start frontend in dev mode
```

### Backend (`cd backend`)
```bash
npm run dev             # nodemon (hot reload)
npm start               # production start
npm run seed            # seed / reset demo data
npm test                # run 43 vitest tests
npm run test:coverage   # with coverage report
npm run verify          # integration verification scripts
```

### Frontend (`cd frontend`)
```bash
npm run dev             # Vite dev server
npm run build           # TypeScript compile + Vite build
npm run preview         # preview production build
```

---

## MongoDB Setup

### Development (Docker)
```bash
docker compose up -d   # starts devclash-mongo on port 27017
```
No username/password required for local development.

### Production (MongoDB Atlas)
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with a strong password
3. Whitelist your server's IP (or use `0.0.0.0/0` with caution)
4. Set in your production environment:
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/devclash?retryWrites=true&w=majority
   ```

---

## API Overview

See [`docs/API.md`](docs/API.md) for the full endpoint reference.

| Prefix | Description |
|--------|-------------|
| `POST /api/auth/*` | Register, login, demo login, logout, current user |
| `GET/POST /api/problems/*` | Problem list, detail, run code, submit solution |
| `GET/POST /api/battles/*` | Create/join/submit battles, battle history |
| `GET/POST /api/adaptive/*` | Sessions, next problem, submit attempt, skill profile |
| `GET/PUT /api/classrooms/*` | Teacher classroom management, student join |
| `GET /api/analytics/*` | Leaderboards, rankings, rating history, statistics |
| `GET/POST /api/notifications/*` | List, unread count, mark read |
| `GET/PATCH /api/users/*` | Profile, submission history, stats |

---

## Socket.IO Overview

The backend exposes a Socket.IO server at the same port as the HTTP API.

**Authentication:** Pass JWT in handshake: `io(url, { auth: { token } })`

**Rooms:**
- `user:<userId>` — personal notification channel (auto-joined on connect)
- `battle:<battleId>` — battle room (join via `battle:join` event)

**Events emitted by server:**

| Event | Room | Payload |
|-------|------|---------|
| `battle:joined` | battle room | `{ battleId, participant }` |
| `battle:start` | battle room + user room | `{ battleId, battle }` |
| `battle:submission-update` | battle room | `{ battleId, participant, evalStatus, score }` |
| `battle:finished` | battle room + user room | `{ battleId, winnerId, ratingChange, xpGained }` |
| `battle:state` | socket | Current battle state (on reconnect) |
| `notification:new` | user room | `{ id, type, title, message }` |

---

## Code Execution Architecture

```
User submits code
       ↓
POST /api/problems/:id/submit  (or  /api/battles/:id/submit)
       ↓
problemService.evaluateSubmission()
       ↓
executeInSandbox() → in-process FIFO queue (max 2 concurrent)
       ↓
Docker container (one per submission):
  --network none          (no internet access)
  --read-only             (no filesystem writes outside /tmp)
  --memory 128m           (hard memory cap)
  --memory-swap 128m      (no swap)
  --cpus 0.5              (CPU quota)
  --pids-limit 64         (no fork bombs)
  --security-opt no-new-privileges
  --cap-drop ALL
  --user 1000:1000        (non-root)
       ↓
Harness script (node:vm or Python importlib) runs user code
against each test case, emits JSON lines
       ↓
Results parsed → Submission persisted → Rating/XP updated
```

**Dev fallback:** If Docker is unavailable, JavaScript runs via a child Node.js process (not isolated). Python returns a compile error in fallback mode. The `engine` field in Submission documents records `'docker'` vs `'fallback'`.

---

## Three Independent Rating Systems

A core DevClash invariant: **activity in one system never affects the other two.**

| System | Triggered by | Model field |
|--------|-------------|-------------|
| Duel Rating | Winning/losing a 1v1 battle | `user.duelRating` |
| Problem Set Rating | Submitting an accepted solution | `user.problemSetRating` |
| Adaptive Rating | Solving problems in adaptive sessions | `user.adaptiveRating` |

Each ladder has its own `rating`, `xp`, `level`, `weeklyXpGain`, `trend` fields. All changes are recorded in the `Rating` collection with a `ladder` field (`duel` / `problemSet` / `adaptive`).

This invariant is enforced by 10 automated tests in `backend/tests/rating-isolation.test.mjs`.

---

## Deployment

### Backend
1. Set all environment variables (see table above)
2. `npm start` or use a process manager like PM2: `pm2 start src/server.js`
3. Point `MONGO_URI` at your Atlas cluster
4. Set `NODE_ENV=production`

### Frontend
```bash
cd frontend && npm run build
```
Outputs to `frontend/dist/`. Deploy to any static host (Netlify, Vercel, S3+CloudFront).
Set `VITE_API_BASE_URL` to your production backend URL at build time.

### CORS
Set `CLIENT_URL` in production to your exact frontend origin:
```
CLIENT_URL=https://yourapp.com
```

---

## Known Limitations

- Code execution for Python requires Docker Desktop running. In the fallback (no Docker), Python submissions return a compile error message.
- The sandbox Docker images (`devclash-sandbox:node`, `devclash-sandbox:python`) must be built before Docker execution works. Without them, the JS fallback runner is used instead.
- Achievements are computed client-side from user statistics — there is no server-side achievement tracking or unlock events.
- The battle arena uses a basic `<textarea>` editor. A full Monaco/CodeMirror integration would improve the coding experience.
