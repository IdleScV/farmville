# ── Builder ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
RUN npm ci

# Copy source and build
COPY packages/shared/src      ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/server/src      ./packages/server/src
COPY packages/server/tsconfig.json ./packages/server/
COPY packages/server/prisma   ./packages/server/prisma

# Generate Prisma client, then build shared + server
RUN npx prisma generate --schema=packages/server/prisma/schema.prisma
RUN npm run build -w @farmville/shared && npm run build -w @farmville/server

# ── Runner ─────────────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install production deps only
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
RUN npm ci --omit=dev

# Copy compiled output and prisma files from builder
COPY --from=builder /app/packages/shared/dist    ./packages/shared/dist
COPY --from=builder /app/packages/server/dist    ./packages/server/dist
COPY --from=builder /app/packages/server/prisma  ./packages/server/prisma
COPY --from=builder /app/node_modules/.prisma    ./node_modules/.prisma

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/server/prisma/schema.prisma && node packages/server/dist/index.js"]
