FROM oven/bun:1

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN rm -f bun.lock
RUN bun install

# Generate Prisma client
WORKDIR /app/packages/db
RUN bun run prisma generate

# Go back to root
WORKDIR /app

# Expose ports for all services
# Auth
EXPOSE 3000
# API
EXPOSE 3001
# Gateway
EXPOSE 6000
# Realtime
EXPOSE 8080
# Web
EXPOSE 5173

# Start the entire backend project using Turbo, ignoring frontend to avoid vite issues
CMD ["bun", "x", "turbo", "run", "dev", "--filter=!@apps/web"]
