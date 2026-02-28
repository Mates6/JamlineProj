# Použijeme oficiálny Node image
FROM node:20-alpine

# Pracovný adresár v kontajneri
WORKDIR /app

# Skopírujeme len package súbory (lepší cache)
COPY package*.json ./

# Nainštalujeme dependencies
RUN npm install

# Skopírujeme zvyšok projektu
COPY . .

# Port na ktorom beží Express
EXPOSE 80

# Spustenie backendu (nodemon)
CMD ["npm", "run", "dev"]
