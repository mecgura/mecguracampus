# MecguraCampus — production image (Next.js standalone + Prisma)
FROM node:22-alpine AS base
WORKDIR /app

# System deps for native modules (better-sqlite3) if they ever rebuild
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PRISMA_SCHEMA=prisma/schema.postgres.prisma
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
