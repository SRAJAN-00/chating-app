# Railway Deployment (Backends + Postgres)

This repo has three runtime pieces:
- `exdraww` frontend (already deployed on Vercel)
- `http-backend` REST API
- `ws-backend` WebSocket server

Use Railway for `http-backend`, `ws-backend`, and Postgres.

## 1) Create Railway Project + Postgres

1. In Railway, create a new project.
2. Add a `PostgreSQL` service.
3. Keep it in the same Railway project as both backends.

Railway will provide a DB connection URL you can reference from other services.

## 2) Deploy `http-backend` on Railway

1. Add a new service from your GitHub repo.
2. Configure service build:
   - Root Directory: `.`
   - Dockerfile Path: `apps/http-backend/Dockerfile`
3. Add environment variables:
   - `DATABASE_URL` = reference your Railway Postgres `DATABASE_URL`
   - `JWT_SECRET` = a strong random string
   - `PORT` = `3001` (Railway can override automatically; code supports that)
4. Deploy the service.
5. Generate a public domain for this service in Railway settings.

Notes:
- This service runs `prisma migrate deploy` at startup before launching API server.
- API routes are under `/api/v1/*`.

## 3) Deploy `ws-backend` on Railway

1. Add another service from the same GitHub repo.
2. Configure service build:
   - Root Directory: `.`
   - Dockerfile Path: `apps/ws-backend/Dockerfile`
3. Add environment variables:
   - `DATABASE_URL` = reference the same Railway Postgres `DATABASE_URL`
   - `JWT_SECRET` = same value as `http-backend`
   - `PORT` = `8080` (Railway can override automatically; code supports that)
4. Deploy the service.
5. Generate a public domain for this service.

## 4) Point Vercel Frontend to Railway Backends

In your Vercel project (`exdraww`), set:

- `NEXT_PUBLIC_BACKEND_URL` = `https://<http-backend-domain>/api/v1`
- `NEXT_PUBLIC_WS_URL` = `wss://<ws-backend-domain>`

Then redeploy Vercel frontend.

## 5) Smoke Test

1. Open frontend URL.
2. Sign up / sign in.
3. Create or join a room.
4. Open same room in two tabs and draw to verify realtime sync.
