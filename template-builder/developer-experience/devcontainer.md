# Dev Containers Template

## Overview
Complete VS Code Dev Container setup for consistent development environments with Docker, features, and multi-service configurations.

## Quick Start
```bash
mkdir -p .devcontainer
code --install-extension ms-vscode-remote.remote-containers
```

## Basic Dev Container

### devcontainer.json
```json
{
  "name": "My Project Dev Container",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",

  // Features to add
  "features": {
    "ghcr.io/devcontainers/features/git:1": {
      "version": "latest",
      "ppa": true
    },
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": true,
      "configureZshAsDefaultShell": true,
      "installOhMyZsh": true
    }
  },

  // Port forwarding
  "forwardPorts": [3000, 5432, 6379],
  "portsAttributes": {
    "3000": {
      "label": "Application",
      "onAutoForward": "notify"
    },
    "5432": {
      "label": "PostgreSQL",
      "onAutoForward": "silent"
    },
    "6379": {
      "label": "Redis",
      "onAutoForward": "silent"
    }
  },

  // Environment variables
  "containerEnv": {
    "NODE_ENV": "development",
    "DATABASE_URL": "postgresql://postgres:postgres@db:5432/myapp"
  },

  // Run commands
  "postCreateCommand": "npm install && npm run db:migrate",
  "postStartCommand": "npm run dev &",
  "postAttachCommand": "git config --global --add safe.directory ${containerWorkspaceFolder}",

  // VS Code settings
  "customizations": {
    "vscode": {
      "settings": {
        "terminal.integrated.defaultProfile.linux": "zsh",
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit"
        },
        "typescript.preferences.importModuleSpecifier": "relative",
        "files.watcherExclude": {
          "**/node_modules/**": true
        }
      },
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "prisma.prisma",
        "ms-azuretools.vscode-docker",
        "GitHub.copilot",
        "eamodio.gitlens",
        "usernamehw.errorlens",
        "formulahendry.auto-rename-tag",
        "christian-kohler.path-intellisense"
      ]
    }
  },

  // User and permissions
  "remoteUser": "node",
  "containerUser": "node",
  "updateRemoteUserUID": true,

  // Mounts
  "mounts": [
    "source=${localEnv:HOME}/.ssh,target=/home/node/.ssh,type=bind,consistency=cached",
    "source=${localEnv:HOME}/.gitconfig,target=/home/node/.gitconfig,type=bind,consistency=cached",
    "source=node_modules,target=${containerWorkspaceFolder}/node_modules,type=volume"
  ],

  // Lifecycle hooks
  "initializeCommand": "docker network create myapp-network 2>/dev/null || true",
  "shutdownAction": "stopContainer"
}
```

## Docker Compose Dev Container

### devcontainer.json (Compose)
```json
{
  "name": "Full Stack Dev Container",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",

  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    }
  },

  "forwardPorts": [3000, 5432, 6379, 9000],
  "portsAttributes": {
    "3000": { "label": "Web App" },
    "5432": { "label": "PostgreSQL" },
    "6379": { "label": "Redis" },
    "9000": { "label": "MinIO" }
  },

  "customizations": {
    "vscode": {
      "settings": {
        "terminal.integrated.defaultProfile.linux": "zsh"
      },
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "prisma.prisma",
        "cweijan.vscode-postgresql-client2",
        "cweijan.vscode-redis-client"
      ]
    }
  },

  "postCreateCommand": ".devcontainer/post-create.sh",
  "remoteUser": "node"
}
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ..:/workspace:cached
      - node_modules:/workspace/node_modules
    command: sleep infinity
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
      - REDIS_URL=redis://redis:6379
      - S3_ENDPOINT=http://minio:9000
    depends_on:
      - db
      - redis
      - minio
    networks:
      - devcontainer

  db:
    image: postgres:15-alpine
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    networks:
      - devcontainer
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - devcontainer
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    networks:
      - devcontainer
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog:latest
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"
    networks:
      - devcontainer

volumes:
  node_modules:
  postgres_data:
  redis_data:
  minio_data:

networks:
  devcontainer:
    name: devcontainer-network
```

### Dockerfile
```dockerfile
# .devcontainer/Dockerfile
FROM mcr.microsoft.com/devcontainers/typescript-node:20-bookworm

# Install additional tools
RUN apt-get update && apt-get install -y \
    postgresql-client \
    redis-tools \
    jq \
    httpie \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    typescript \
    ts-node \
    prisma \
    @anthropic-ai/claude-code

# Install Oh My Zsh plugins
USER node
RUN git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions && \
    git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# Configure zsh
COPY --chown=node:node .zshrc /home/node/.zshrc

USER root
```

### Post-create Script
```bash
#!/bin/bash
# .devcontainer/post-create.sh

set -e

echo "🚀 Running post-create setup..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
until pg_isready -h db -U postgres; do
  sleep 1
done
echo "✅ Database is ready!"

# Wait for Redis
echo "⏳ Waiting for Redis..."
until redis-cli -h redis ping; do
  sleep 1
done
echo "✅ Redis is ready!"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run database migrations
echo "🗃️ Running database migrations..."
npm run db:migrate

# Seed database (if in development)
if [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Seeding database..."
  npm run db:seed
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Create MinIO bucket
echo "📁 Creating MinIO bucket..."
mc alias set myminio http://minio:9000 minioadmin minioadmin 2>/dev/null || true
mc mb myminio/uploads --ignore-existing 2>/dev/null || true

# Git configuration
echo "⚙️ Configuring Git..."
git config --global --add safe.directory /workspace
git config --global core.editor "code --wait"

echo "✅ Setup complete!"
echo ""
echo "Run 'npm run dev' to start the development server."
```

## Python Dev Container

### devcontainer.json (Python)
```json
{
  "name": "Python Dev Container",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",

  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },

  "forwardPorts": [8000, 5432, 6379],

  "customizations": {
    "vscode": {
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "python.languageServer": "Pylance",
        "python.analysis.typeCheckingMode": "basic",
        "python.formatting.provider": "none",
        "[python]": {
          "editor.defaultFormatter": "charliermarsh.ruff",
          "editor.formatOnSave": true,
          "editor.codeActionsOnSave": {
            "source.fixAll": "explicit",
            "source.organizeImports": "explicit"
          }
        },
        "python.testing.pytestEnabled": true,
        "python.testing.pytestArgs": ["tests"]
      },
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance",
        "charliermarsh.ruff",
        "ms-python.debugpy",
        "tamasfe.even-better-toml",
        "littlefoxteam.vscode-python-test-adapter"
      ]
    }
  },

  "postCreateCommand": "pip install -e '.[dev]' && pre-commit install",

  "containerEnv": {
    "PYTHONUNBUFFERED": "1",
    "PYTHONDONTWRITEBYTECODE": "1"
  },

  "remoteUser": "vscode"
}
```

## Multi-Service Dev Container

### devcontainer.json (Microservices)
```json
{
  "name": "Microservices Dev Container",
  "dockerComposeFile": "docker-compose.yml",
  "service": "workspace",
  "workspaceFolder": "/workspace",

  "features": {
    "ghcr.io/devcontainers/features/docker-outside-of-docker:1": {},
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {
      "minikube": "latest"
    }
  },

  "forwardPorts": [
    3000, 3001, 3002,  // Frontend services
    8000, 8001, 8002,  // Backend services
    5432, 6379, 27017  // Databases
  ],

  "customizations": {
    "vscode": {
      "settings": {
        "workbench.colorTheme": "Default Dark Modern",
        "terminal.integrated.defaultProfile.linux": "zsh"
      },
      "extensions": [
        "ms-azuretools.vscode-docker",
        "ms-kubernetes-tools.vscode-kubernetes-tools",
        "hashicorp.terraform"
      ]
    }
  },

  "postCreateCommand": "./scripts/setup-services.sh"
}
```

## CLAUDE.md Integration

```markdown
## Dev Containers

### Structure
- `.devcontainer/devcontainer.json` - Main config
- `.devcontainer/docker-compose.yml` - Multi-service
- `.devcontainer/Dockerfile` - Custom image
- `.devcontainer/post-create.sh` - Setup script

### Commands
- Rebuild Container - `Ctrl+Shift+P > Rebuild Container`
- Reopen in Container - `Ctrl+Shift+P > Reopen in Container`
- Open Folder in Container - File > Open Folder

### Services
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO: localhost:9000

### Troubleshooting
- Rebuild if dependencies change
- Check Docker daemon is running
- Verify port availability
```

## AI Suggestions

1. **Auto-detect stack** - Generate config from package.json
2. **Service templates** - Pre-built database configs
3. **Extension recommendations** - Suggest based on project
4. **Performance tuning** - Optimize Docker settings
5. **Multi-repo support** - Workspace configurations
6. **Secret management** - Secure credential handling
7. **GPU support** - ML development setup
8. **Remote tunnels** - Cloud development
9. **Backup/restore** - Container state persistence
10. **Health monitoring** - Service status checks
