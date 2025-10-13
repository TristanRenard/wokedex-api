FROM node:20-alpine AS builder

WORKDIR /app

# Installer pnpm
RUN npm install -g pnpm

# Copier uniquement ce qui est nécessaire pour l’install
COPY package.json pnpm-lock.yaml ./

# Installer toutes les dépendances (dev incluses pour tsc)
RUN pnpm install

# Copier le reste du code
COPY . .

# Build TypeScript
RUN pnpm run build

# Étape finale pour une image plus légère
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copier seulement les fichiers nécessaires à l’exécution
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --ignore-scripts

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["pnpm","run","start"]
