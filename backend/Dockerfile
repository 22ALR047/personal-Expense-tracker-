FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm rebuild sqlite3 --build-from-source

COPY . .

EXPOSE $PORT
CMD ["node", "index.js"]
