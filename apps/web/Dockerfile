# ---------- Build Stage ----------
FROM oven/bun:1.3.0 AS builder

WORKDIR /app

# Install deps (workspace-aware) with good layer caching.
COPY package.json bun.lock ./
COPY apps/*/package.json apps/*/package.json
COPY packages/*/package.json packages/*/package.json
RUN bun install

# Copy the rest of the repo and build the web app.
COPY . .
WORKDIR /app/apps/web
RUN bun run build

# ---------- Production Stage ----------
FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
