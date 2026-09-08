# syntax=docker/dockerfile:1


# Base

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./


# Dependencies (all, including dev)

FROM base AS dependencies
RUN npm ci


# Development (used by docker-compose-dev.yml)

FROM dependencies AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3000 9229
CMD ["npm", "run", "start:dev"]


# Build (compiles NestJS -> dist)

FROM dependencies AS build
COPY . .
RUN npm run build


# Production dependencies only

FROM base AS prod-dependencies
RUN npm ci --omit=dev


# Production (used by docker-compose-prod.yml)

FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]