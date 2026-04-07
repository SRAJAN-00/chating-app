FROM node:20-bullseye-slim

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/db exec prisma generate
RUN pnpm --filter @repo/backend-common build
RUN pnpm --filter @repo/db build
RUN pnpm --filter ws-backend build

ENV PORT=8080
EXPOSE 8080

CMD ["node", "apps/ws-backend/dist/index.js"]
