# ---------- Build Stage ----------
FROM oven/bun:1.3.0 AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock ./

# Copy workspace manifests only (better cache usage)
COPY apps/web/package.json apps/web/
COPY packages/*/package.json packages/

# Install all dependencies (including dev for TypeScript build)
RUN bun install

# Copy full repository
COPY . .

# Move into web workspace
WORKDIR /app/apps/web

# Ensure app-local node_modules exist, then build web app
RUN bun install && bun run build


# ---------- Production Stage ----------
FROM nginx:1.27-alpine

# Copy custom nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
