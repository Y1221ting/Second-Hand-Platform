# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY config/ ./config/
COPY controllers/ ./controllers/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY routes/ ./routes/
COPY scripts/ ./scripts/
COPY server.js ./

EXPOSE 8000

CMD ["node", "server.js"]
