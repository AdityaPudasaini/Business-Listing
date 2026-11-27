# Backend (NestJS + Prisma) production image.
# Build:  docker build -t autohub-backend ./backend
# Normally started through the docker-compose.yml at the repository root.
FROM node:25-bookworm-slim

# Prisma needs OpenSSL.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first, so this layer is cached until package files change.
COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

ENV NODE_ENV=production

# Uploaded images live here; mount a volume on it so they survive redeploys.
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Applies any pending database migrations, then starts the API.
CMD ["npm", "run", "start:prod:migrate"]
