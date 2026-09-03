FROM node:22-alpine
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

COPY apps/api apps/api

RUN pnpm --filter @orcamento/api prisma:generate
RUN pnpm --filter @orcamento/api build

ENV NODE_ENV=production
CMD ["node", "apps/api/dist/main.js"]