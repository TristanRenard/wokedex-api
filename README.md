# WokeDex API

Une API moderne construite avec Hono, TypeScript, et PostgreSQL pour la gestion d'utilisateurs avec authentification.

## 🚀 Technologies

- **Framework**: [Hono](https://hono.dev/) - Framework web rapide et léger
- **Runtime**: Node.js avec TypeScript
- **Base de données**: PostgreSQL avec [Drizzle ORM](https://orm.drizzle.team/)
- **Tests**: [Vitest](https://vitest.dev/) avec TestContainers
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **Commit Convention**: Commitlint

## 📋 Prérequis

- Node.js 18+
- pnpm 9+
- Docker et Docker Compose (pour le développement local)

## 🛠️ Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd wokedex-api
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configuration de l'environnement

```bash
cp env.sample .env
```

Modifiez le fichier `.env` avec vos configurations.

### 4. Démarrer les services avec Docker Compose

```bash
docker-compose up -d
```

Cette commande démarre :

- PostgreSQL (port 5432)
- MeiliSearch (port 7700)
- MinIO (port 9000)

### 5. Générer et appliquer les migrations

```bash
pnpm db:generate
pnpm db:migrate
```

### 6. Démarrer le serveur de développement

```bash
pnpm dev
```

L'API sera accessible sur `http://localhost:3000`

## 🧪 Tests

### Exécuter tous les tests

```bash
pnpm test
```

### Exécuter les tests en mode watch

```bash
pnpm test:ui
```

### Exécuter les tests avec couverture

```bash
pnpm test:coverage
```

### Exécuter les tests une seule fois

```bash
pnpm test:run
```

## 📝 Scripts disponibles

| Script               | Description                                         |
| -------------------- | --------------------------------------------------- |
| `pnpm dev`           | Démarre le serveur de développement avec hot reload |
| `pnpm build`         | Compile le projet TypeScript                        |
| `pnpm start`         | Démarre le serveur de production                    |
| `pnpm test`          | Lance les tests avec Vitest                         |
| `pnpm test:ui`       | Interface graphique pour les tests                  |
| `pnpm test:coverage` | Génère un rapport de couverture                     |
| `pnpm lint`          | Vérifie le code avec ESLint                         |
| `pnpm lint:fix`      | Corrige automatiquement les erreurs ESLint          |
| `pnpm format`        | Formate le code avec Prettier                       |
| `pnpm db:generate`   | Génère les migrations Drizzle                       |
| `pnpm db:migrate`    | Applique les migrations                             |
| `pnpm db:studio`     | Ouvre Drizzle Studio                                |

## 🛠️ Commandes Makefile

Le projet inclut un `Makefile` avec des commandes utiles :

```bash
# Afficher l'aide
make help

# Setup complet du projet
make setup

# Commandes de développement
make dev          # Démarre le serveur de développement
make build        # Compile le projet
make start        # Démarre le serveur de production

# Tests
make test         # Lance les tests en mode watch
make test-ui      # Interface graphique des tests
make test-run     # Exécute les tests une seule fois
make test-coverage # Rapport de couverture

# Linting et formatage
make lint         # Vérifie le code avec ESLint
make lint-fix     # Corrige les erreurs ESLint
make format       # Formate le code avec Prettier

# Base de données
make db-setup     # Génère et applique les migrations
make db-studio    # Ouvre Drizzle Studio

# Docker
make docker-up    # Démarre les services Docker
make docker-down  # Arrête les services Docker
make docker-logs  # Affiche les logs Docker

# Utilitaires
make logs         # Affiche les logs de tous les services
make status       # Statut des services Docker
make clean        # Nettoie les fichiers générés
```

## 🔧 Configuration

### Variables d'environnement

Copiez `env.sample` vers `.env` et configurez les variables :

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/wokedex

# MeiliSearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=your-master-key

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET_NAME=wokedex
MINIO_USE_SSL=false
```

### Git Hooks

Le projet utilise Husky pour les hooks Git :

- **pre-commit** : Exécute lint-staged pour vérifier le code avant chaque commit
- **commit-msg** : Vérifie le format des messages de commit avec commitlint

### Convention de commits

Le projet suit la convention [Conventional Commits](https://www.conventionalcommits.org/) :

```
type(scope): description

feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
style: formatage
refactor: refactoring
perf: amélioration de performance
test: ajout/modification de tests
chore: tâches de maintenance
ci: configuration CI/CD
build: build system
revert: revert d'un commit
```

## 🏗️ Architecture

```
src/
├── __tests__/          # Tests avec Vitest
├── db/                 # Configuration base de données
│   ├── index.ts       # Connexion DB
│   └── schema.ts      # Schéma Drizzle
├── routes/             # Routes API
│   ├── auth.ts        # Authentification
│   └── verify.ts      # Vérification
├── types/              # Types TypeScript
│   └── user.ts        # Types utilisateur
├── utils/              # Utilitaires
│   └── users/         # Logique métier utilisateurs
└── index.ts           # Point d'entrée
```

## 🐳 Docker

### Services disponibles

- **PostgreSQL 15** : Base de données principale
- **MeiliSearch** : Moteur de recherche
- **MinIO** : Stockage d'objets compatible S3

### Commandes Docker utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Redémarrer un service spécifique
docker-compose restart postgres
```

## 🔍 Développement

### Structure des tests

Les tests utilisent TestContainers pour créer une base de données PostgreSQL isolée :

- `setup.ts` : Configuration de l'environnement de test
- `helper.ts` : Fonctions utilitaires pour les tests
- `*.test.ts` : Tests unitaires et d'intégration

### Linting et formatage

Le projet utilise :

- **ESLint** : Analyse statique du code
- **Prettier** : Formatage automatique
- **lint-staged** : Exécution des linters sur les fichiers modifiés

### Base de données

- **Drizzle ORM** : ORM type-safe pour PostgreSQL
- **Migrations** : Gestion des changements de schéma
- **Drizzle Studio** : Interface graphique pour explorer les données

## 📊 Monitoring

### Logs

Les logs sont affichés dans la console avec différents niveaux :

- 🐳 Container operations
- 📦 Database operations
- 🔌 Connection status
- ✅ Success messages
- 🧹 Cleanup operations

### Couverture de tests

Générez un rapport de couverture avec :

```bash
pnpm test:coverage
```

Le rapport sera disponible dans `coverage/`.

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'feat: add amazing feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

> [!WARNING]
> Chaque fonctionnalité doit être couverte par des tests. Les fonctionnalités sans tests ne seront pas acceptées.
> De plus, ce projet étant fait par des personnes de gauche, pour des personnes de gauche, vous êtes invités à utiliser avec parcimonie l'IA (svp soyez raisonnable). On vous invite aussi a ne pas genrer ou d'utiliser le neutre pour les retours d'erreurs ou les messages console.
