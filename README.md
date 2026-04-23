# Knowledge Stack — Real-time Quiz Platform

A production-ready, Kahoot-style real-time quiz platform.

- **Frontend:** Next.js 14 (App Router) + TailwindCSS + **shadcn/ui** + Zustand + socket.io-client
- **Backend:** Node.js + Express + Socket.IO + Mongoose
- **Database:** MongoDB
- **Optional:** Redis (reserved for horizontal scaling)
- **Deployment:** Dockerfiles + `docker-compose.yml`

Hosts sign in, create quizzes, and launch live sessions with a 6-digit PIN.
Players join from any device with just a name, see questions in real-time,
answer within a timer, and watch the leaderboard update live.

---

## Folder layout

```
kahoot-clone/
├── backend/                 Express + Socket.IO + Mongoose
│   ├── src/
│   │   ├── config/          env + DB connection
│   │   ├── middleware/      auth + error handling
│   │   ├── models/          User, Quiz, GameSession
│   │   ├── routes/          REST endpoints (auth, quizzes, games)
│   │   ├── sockets/         real-time game engine
│   │   ├── utils/           scoring + PIN generation
│   │   ├── scripts/seed.js  demo host + sample quiz
│   │   ├── app.js           express app factory
│   │   └── server.js        HTTP + socket entrypoint
│   ├── tests/               jest unit + integration tests
│   └── Dockerfile
├── frontend/                Next.js 14 (App Router) + Tailwind
│   ├── src/
│   │   ├── app/             pages: /, /login, /register, /host,
│   │   │                    /quiz/create, /game/[pin]/host,
│   │   │                    /game/[pin]/player
│   │   ├── components/
│   │   │   ├── ui/          shadcn primitives: button, card, input,
│   │   │   │                textarea, label, progress, badge, alert
│   │   │   └── …            AnswerButton, TimerBar, Leaderboard, JoinForm
│   │   └── lib/             api, socket, auth store, utils (cn)
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick start

### Option A — Docker (recommended)

```bash
cp .env.example .env          # optional — override secrets
docker compose up --build
```

Then open http://localhost:3000. Backend is on http://localhost:4000.

To seed a demo host and sample quiz:

```bash
docker compose exec backend npm run seed
```

Demo credentials: **teacher@example.com** / **password123**

### Option B — Local development

You need Node 20+ and a running MongoDB on `localhost:27017`.

```bash
# Backend
cd backend
cp ../.env.example .env
npm install
npm run seed     # creates the demo host + sample quiz
npm run dev      # http://localhost:4000
```

```bash
# Frontend (in a second terminal)
cd frontend
npm install
npm run dev      # http://localhost:3000
```

---

## Demo flow

1. Go to http://localhost:3000 and click **Login**.
2. Sign in with `teacher@example.com` / `password123`.
3. On the host dashboard, click **Start game** on the sample quiz. You'll be
   taken to the host game screen with a 6-digit PIN.
4. On a second device (or a private browser window), open
   http://localhost:3000, enter the PIN, pick a player name, and join.
5. Back on the host screen, click **Start game**. The first question is
   broadcast; players answer on their devices. Scores and leaderboard update
   live after each question.

---

## REST API

All routes return JSON. Host routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST   | `/api/auth/register` | — | Register a host. Returns `{ token, user }`. |
| POST   | `/api/auth/login`    | — | Log in. Returns `{ token, user }`. |
| GET    | `/api/auth/me`       | host | Current host. |
| GET    | `/api/quizzes`       | host | List your quizzes. |
| POST   | `/api/quizzes`       | host | Create a quiz. |
| GET    | `/api/quizzes/:id`   | host | Get a quiz. |
| PUT    | `/api/quizzes/:id`   | host | Update a quiz. |
| DELETE | `/api/quizzes/:id`   | host | Delete a quiz. |
| POST   | `/api/games`         | host | Create a game session from a quiz. Returns `{ pin }`. |
| GET    | `/api/games/:pin`    | —    | Public lookup of a session (used when a player joins). |

---

## WebSocket events

All real-time traffic runs over Socket.IO at the backend URL.

**Client → Server**

| Event | Payload | Ack |
|-------|---------|-----|
| `join_game` | `{ pin, playerName }` | `{ ok, player?, players?, error? }` |
| `host_join` | `{ pin, hostId }` | `{ ok, session?, error? }` |
| `host_start_game` | `{ pin, hostId }` | `{ ok, error? }` |
| `host_next_question` | `{ pin, hostId }` | `{ ok, error? }` |
| `submit_answer` | `{ pin, questionId, answer, timeTaken }` | `{ ok, correct?, points?, error? }` |

**Server → Client**

| Event | Payload |
|-------|---------|
| `player_joined` | `{ player, players }` |
| `player_left` | `{ playerId }` |
| `game_started` | `{ totalQuestions }` |
| `next_question` | `{ index, total, question, startedAt }` |
| `answer_result` | `{ questionId, correctAnswer, correct, points, totalScore }` |
| `leaderboard_update` | `{ leaderboard, questionIndex, correctAnswer, answerCounts }` |
| `game_ended` | `{ leaderboard }` |

---

## Scoring

```
score = correct ? max(0, 1000 - timeTaken * 50) : 0
```

`timeTaken` is in seconds and is clamped to the question's `timeLimit`. The
server is authoritative: it computes elapsed time from `Date.now()` and rejects
late submissions.

---

## Data models (Mongoose)

- **User** — `{ email, password (hashed), name, timestamps }`
- **Quiz** — `{ title, description, hostId, questions: [{ questionText, options[4], correctAnswer (0–3), timeLimit }] }`
- **GameSession** — `{ pin, hostId, quizId, players: [{ id, name, socketId }], scores: Map<playerId, number>, currentQuestionIndex, status ∈ {waiting, live, ended}, startedAt, endedAt }`

---

## Security

- Passwords hashed with bcrypt (cost 10).
- JWTs (HS256) for host auth; player sessions are anonymous and bound to
  their socket + server-assigned `playerId`.
- Per-socket validation: only the socket that joined a game with a given
  `playerId` can submit answers for that player.
- Answers accepted at most once per player per question.
- Duplicate player names per session rejected (case-insensitive).
- Input validated with Zod on every REST endpoint.
- Express rate-limit on auth endpoints (20 req/min/IP).

---

## Testing

```bash
cd backend && npm test
```

- `tests/scoring.test.js` — unit tests for the scoring formula & leaderboard.
- `tests/sockets.test.js` — integration test of the Socket.IO event flow
  (join → start → submit → result), with Mongoose models mocked.

---

## Design notes & assumptions

- **Single-instance authoritative server.** In-flight per-question timers
  and per-question tallies live in memory (`activeGames` in `gameEngine.js`);
  durable state (players, scores, status) is persisted to MongoDB. For
  multi-instance scaling, plug `@socket.io/redis-adapter` in front of the
  existing Redis service and move `activeGames` into Redis.
- **Auto-advance.** After a question ends, the server broadcasts the
  leaderboard and auto-advances after ~5 seconds. The host can also manually
  advance with `host_next_question` from the host UI.
- **Early finish.** If every joined player submits before the timer, the
  question ends immediately.
- **Redis is wired but optional.** The compose file starts a Redis container
  for future pub/sub adapter work; the code currently runs fine without it.
- **Players aren't authenticated.** Joining with a name is enough — matches
  the Kahoot experience. Player identity is a random server-issued UUID.
- **No quiz-editor UI yet for existing quizzes.** You can create and delete
  via the host dashboard; updating an existing quiz is available via the
  REST `PUT /api/quizzes/:id` but not yet in the UI.

---

## Environment variables

See `.env.example`. Noteworthy:

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `4000` | Backend HTTP + socket port |
| `MONGO_URI` | `mongodb://mongo:27017/kahoot` | MongoDB connection string |
| `JWT_SECRET` | `dev-insecure-secret` | JWT signing key — **change in production** |
| `CLIENT_ORIGIN` | `http://localhost:3000` | CORS origin(s). Comma-separated list, or `*` to allow any. |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend URL used by the frontend |
| `NEXT_PUBLIC_SOCKET_URL` | same as API | Socket.IO URL used by the frontend |

---

## License

MIT
