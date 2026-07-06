# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first (leverages Docker layer caching)
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY tsconfig.json tsup.config.ts ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the built artifacts (all deps are bundled by tsup's noExternal)
COPY --from=build /app/dist ./dist

# Use non-root user
USER appuser

# HTTP transport for containerized deployment
EXPOSE 3100
CMD ["node", "dist/http-index.js"]
