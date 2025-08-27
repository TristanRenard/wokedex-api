# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copie des dépendances
COPY package*.json ./

# Installation
RUN npm install --production

# Copie du code
COPY . .

# Expose le port HTTP
EXPOSE 3000

# Lancement de l'app
CMD ["node", "server.js"]
