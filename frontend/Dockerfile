# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim

WORKDIR /app

ARG NEXT_PUBLIC_BACKEND_WS_URL=ws://localhost:4000
ENV NEXT_PUBLIC_BACKEND_WS_URL=$NEXT_PUBLIC_BACKEND_WS_URL

COPY package*.json ./
RUN npm ci

COPY next.config.mjs ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./
COPY next-env.d.ts ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]

