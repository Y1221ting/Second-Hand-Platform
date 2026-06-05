# Backend Dockerfile
FROM node:18-alpine

# PM2 进程管理（崩溃自动重启，零停机重载）
RUN npm install -g pm2

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY config/ ./config/
COPY controllers/ ./controllers/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY routes/ ./routes/
COPY server.js ./

# 非 root 用户（Docker 安全最佳实践）
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/logs && chown appuser:appgroup /app/logs
USER appuser

EXPOSE 8000

CMD ["pm2-runtime", "server.js"]
