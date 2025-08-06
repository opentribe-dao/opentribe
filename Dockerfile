# syntax=docker/dockerfile:1

# This Dockerfile follows Turborepo best practices for optimized Docker builds
# See: https://turbo.build/repo/docs/handbook/deploying-with-docker

ARG NODE_VERSION=22
ARG ALPINE_VERSION=3.20

# ========================================
# Base image with pnpm
# ========================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# ========================================
# Pruner stage - creates a pruned monorepo
# ========================================
FROM base AS pruner

# Install turbo globally
RUN pnpm add -g turbo@^2.5

# Copy entire monorepo
COPY . .

# Prune the monorepo for each app
RUN turbo prune web --docker
RUN mkdir -p /pruned/web && mv out/* /pruned/web/

RUN turbo prune dashboard --docker  
RUN mkdir -p /pruned/dashboard && mv out/* /pruned/dashboard/

RUN turbo prune api --docker
RUN mkdir -p /pruned/api && mv out/* /pruned/api/

# ========================================
# Installer stage - installs dependencies
# ========================================
FROM base AS installer

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy pruned lockfile and package files for all apps
COPY --from=pruner /pruned/web/json/ .
COPY --from=pruner /pruned/dashboard/json/ .
COPY --from=pruner /pruned/api/json/ .

# Install dependencies
RUN pnpm install --frozen-lockfile

# ========================================
# Builder stage - builds all apps
# ========================================
FROM base AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy installed node_modules
COPY --from=installer /app .

# Copy pruned source code for all apps
COPY --from=pruner /pruned/web/full/ .
COPY --from=pruner /pruned/dashboard/full/ .
COPY --from=pruner /pruned/api/full/ .

# Copy turbo.json from root
COPY turbo.json .

# Generate Prisma client
RUN cd packages/db && pnpm prisma generate

# Build all apps
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build with proper environment variables
ARG NEXT_PUBLIC_API_URL=http://api:3002
ARG NEXT_PUBLIC_WEB_URL=http://web:3000
ARG NEXT_PUBLIC_DASHBOARD_URL=http://dashboard:3001
ARG NEXT_PUBLIC_DOCS_URL=http://docs:3004
ARG NEXT_PUBLIC_BETTER_AUTH_URL=http://api:3002

RUN turbo build

# ========================================
# Runtime base
# ========================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runtime-base

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# ========================================
# Web app runner
# ========================================
FROM runtime-base AS web

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/public ./apps/web/public

USER nodejs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["node", "apps/web/server.js"]

# ========================================
# Dashboard app runner
# ========================================
FROM runtime-base AS dashboard

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/dashboard/public ./apps/dashboard/public

USER nodejs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["node", "apps/dashboard/server.js"]

# ========================================
# API app runner
# ========================================
FROM runtime-base AS api

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/.next/static ./apps/api/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/public ./apps/api/public

# Copy Prisma schema and migrations for runtime
COPY --from=builder --chown=nodejs:nodejs /app/packages/db/prisma ./packages/db/prisma

USER nodejs
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["node", "apps/api/server.js"]

# ========================================
# Development stage - for hot reload
# ========================================
FROM base AS development

# Install development dependencies
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy all source code
COPY . .

# Install all dependencies
RUN pnpm install

# Generate Prisma client
RUN cd packages/db && pnpm prisma generate

# Expose all ports
EXPOSE 3000 3001 3002 3003 3004

# Use the app argument to determine which app to run
ARG APP=web
ENV APP=${APP}

# Start the specified app in development mode
CMD pnpm --filter=${APP} dev