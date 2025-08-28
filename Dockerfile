FROM node:20-alpine

WORKDIR /app

# Copier uniquement les fichiers nécessaires d'abord (pour le cache)
COPY package*.json ./

# Installer toutes les deps (dev aussi, car il y a tsc)
RUN npm install

# Copier le code source
COPY . .

# Build TypeScript -> dist/
RUN npm run build

# Exposer le port HTTP
EXPOSE 3000

# Lancer l'app compilée
CMD ["npm", "start"]
