# Study Multiply Go Beyond Monorepo

This repository now groups the existing Vite React application together with a brand-new Express API so the project can evolve as a full-stack codebase.

## Repository Layout

```
.
├── backend/   # Express + MongoDB API (Node 20+ recommended)
├── frontend/  # Original Vite React application
├── LICENSE
└── README.md  # You are here
```

## Backend (Express + MongoDB)

1. Create a `.env` inside `backend/` (there is a `.env.example` you can copy):
   ```
   cd backend
   cp .env.example .env
   ```
   - `PORT` defaults to `5000`.
   - `MONGO_URI` should point to your local MongoDB instance (e.g. `mongodb://127.0.0.1:27017/study_multiply_go_beyond`).
   - `MONGO_DB_NAME` is optional because the URI already includes the db name.
2. Install dependencies:
   ```
   npm install
   ```
3. Start MongoDB locally (using `mongod --config /path/to/mongod.conf`, the MongoDB app, Docker, etc.).
4. Run the development server:
   ```
   npm run dev
   ```
   You should see `API server listening on http://localhost:5000` followed by a successful MongoDB connection log.
5. Test the sample endpoint:
   ```
   curl http://localhost:5000/api/test
   # -> { "message": "Backend working" }
   ```

## Frontend (Vite React)

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```
2. Create or update `frontend/.env` with your existing Vite variables (all values that need to be exposed to the browser must continue to use the `VITE_` prefix).
3. Start the Vite dev server:
   ```
   npm run dev
   ```
   The frontend now proxies every request that starts with `/api` to `http://localhost:5000`, so you can call Express endpoints directly from the browser without extra configuration.

## Full-stack Test

1. Run both servers (`npm run dev` in `backend/` and `frontend/`).
2. Visit `http://localhost:5173` and call `/api/test` from the browser (or run `curl http://localhost:5173/api/test`). The request travels through the Vite proxy to the Express server and should return `{ "message": "Backend working" }`.

## Sample Accounts

Run the migration helper to seed demo content plus ready-to-use accounts:

```
cd backend
node scripts/migrate-data.js
```

All seeded demo users share the password `pwd`. Their login emails are:

| Username        | Email                            | Password |
| --------------- | -------------------------------- | -------- |
| `aiko_hennyu`   | `aiko_hennyu@nyacademy.dev`      | `pwd`    |
| `haruto_study`  | `haruto_study@nyacademy.dev`     | `pwd`    |
| `miyu_gakushu`  | `miyu_gakushu@nyacademy.dev`     | `pwd`    |
| `ren_math`      | `ren_math@nyacademy.dev`         | `pwd`    |
| `sora_english`  | `sora_english@nyacademy.dev`     | `pwd`    |

> ℹ️ The backend automatically ensures these accounts exist (and get the correct password) every time it boots, so you can log in immediately without running extra scripts.

Sign in with any of these accounts to explore the social feed and other authenticated areas quickly.

That’s it—both halves of the application are now separated but co-located for easier development, deployment, and scaling.
