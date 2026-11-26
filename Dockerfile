# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Only NEXT_PUBLIC_* vars are needed at build time (inlined into the client
# bundle). Secrets are injected at runtime from Lockbox, never baked in.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ARG NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION=$NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION
ENV NEXT_PUBLIC_YANDEX_MAPS_API_KEY=$NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ENV NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=$NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY

ENV NEXT_TELEMETRY_DISABLED=1
RUN node scripts/validate-env.mjs
# Webpack + Sentry plugin exceed Node's default heap; CI runners have 16 GB.
RUN NODE_OPTIONS=--max-old-space-size=6144 npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache ffmpeg

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Russian Trusted Root CA, needed by Sber SaluteSpeech (ngw.devices.sberbank.ru).
# Added to Node's trust store instead of disabling TLS verification. Node logs a
# warning and continues if the file is absent.
COPY --from=builder /app/certs ./certs
ENV NODE_EXTRA_CA_CERTS=/app/certs/russian_trusted_root_ca.pem

USER nextjs

EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
