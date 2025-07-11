FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code and env file
COPY . .

# Build the application
ENV SKIP_ENV_VALIDATION=true
RUN bun run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "start"]
