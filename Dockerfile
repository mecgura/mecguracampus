# MecguraCampus — production image (Next.js standalone + Prisma)
FROM node:22-alpine AS base
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PRISMA_SCHEMA=prisma/schema.postgres.prisma
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy?sslmode=disable
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
