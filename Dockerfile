# =====================================================
# Topup Kilat - Multi-stage Dockerfile
# Production-ready Next.js application
# =====================================================

# ---- Dependencies stage ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Builder stage ----
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (if needed)
# RUN npx prisma generate

# Build Next.js application
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set ownership
RUN mkdir/.next && chown nextjs:nodejs /.next

# Switch to non-root user
USER nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Expose port
EXPOSE 3000

# Environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
