FROM node:20-bullseye-slim
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/db exec prisma generate
EXPOSE 3000
CMD ["pnpm", "dev:all"]
