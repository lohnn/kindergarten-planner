FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js db.js ./
COPY routes ./routes
COPY flutter/build/web ./flutter/build/web
EXPOSE 3000
CMD ["node", "server.js"]
