# Optimized Dockerfile for Vue.js/TypeScript development with selective mounts
# The node_modules directory is built into the image and not overridden by host mounts

FROM node:22-alpine

WORKDIR /app

# Copy only the package files first for better layer caching
COPY package.json package-lock.json* ./

RUN npm install --verbose

# Copy all configuration files (these will be selectively mounted in docker-compose)
COPY tsconfig.json vite.config.ts env.d.ts eslint.config.js openapi-ts.config.ts ./

# Copy source files (these will be selectively mounted in docker-compose)
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Expose development server port
EXPOSE 5173

# Set the environment variables
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV NODE_ENV=development

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
