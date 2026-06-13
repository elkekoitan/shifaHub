# Monorepo-aware build for @shifahub/api (Fastify + tRPC, tsx runtime).
# Build context = repo root.
FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/trpc/package.json ./packages/trpc/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN npm ci

FROM base AS runner
ENV NODE_ENV=production PORT=4000 HOST=0.0.0.0
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/api ./apps/api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD curl -fsS http://localhost:4000/health || exit 1
CMD ["npm", "run", "start", "--workspace=@shifahub/api"]
