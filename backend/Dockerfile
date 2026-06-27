FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache wget
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src/migrations/*.sql ./dist/src/migrations/
COPY --from=builder /app/scripts ./scripts
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=20s \
  CMD wget -qO- http://localhost:3001/api/health || exit 1
CMD ["node", "dist/src/main"]
