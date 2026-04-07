FROM node:20-bullseye-slim

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/db exec prisma generate
RUN pnpm --filter @repo/backend-common build
RUN pnpm --filter @repo/common build
RUN pnpm --filter @repo/db build
RUN pnpm --filter http-backend build

ENV PORT=3001
EXPOSE 3001

CMD ["sh", "-c", "pnpm --filter @repo/db exec prisma migrate deploy && node apps/http-backend/dist/index.js"]
