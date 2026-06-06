FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm rebuild sqlite3 --build-from-source

COPY . .
RUN npm run build

EXPOSE $PORT
CMD ["node", "server/index.js"]
