FROM node:20

WORKDIR /app

# Skopírujeme package.json
COPY package*.json ./

RUN npm install

# Skopírujeme zvyšok kódu
COPY . .

# TCP port pre signaling (HTTP/WebSocket)
EXPOSE 3000

# UDP porty pre mediasoup media
EXPOSE 40000-40100/udp

CMD ["node", "index.js"]
