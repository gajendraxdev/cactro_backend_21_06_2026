FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma/
COPY packages/queue/package.json ./packages/queue/
COPY apps/event-manager/package.json ./apps/event-manager/
RUN pnpm install --frozen-lockfile || pnpm install

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/event-manager ./apps/event-manager
RUN pnpm db:generate && pnpm --filter @event-booking/event-manager build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/event-manager/dist ./apps/event-manager/dist
COPY --from=build /app/apps/event-manager/package.json ./apps/event-manager/
COPY package.json pnpm-workspace.yaml ./

EXPOSE 3000
CMD ["node", "apps/event-manager/dist/server.js"]