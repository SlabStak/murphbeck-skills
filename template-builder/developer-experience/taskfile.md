# Task Runners Template

## Overview
Comprehensive task runner setup with Taskfile, Make, Just, and npm scripts for consistent development workflows.

## Quick Start
```bash
# Taskfile
go install github.com/go-task/task/v3/cmd/task@latest

# Just
brew install just

# Make (pre-installed on most systems)
```

## Taskfile Configuration

### Taskfile.yml
```yaml
# https://taskfile.dev
version: '3'

vars:
  PROJECT_NAME: myproject
  GO_VERSION: '1.21'
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.11'

env:
  CGO_ENABLED: '0'
  GOOS: '{{OS}}'
  GOARCH: '{{ARCH}}'

includes:
  docker: ./tasks/docker.yml
  test: ./tasks/test.yml
  deploy: ./tasks/deploy.yml

tasks:
  # Default task
  default:
    desc: Show available tasks
    cmds:
      - task --list

  # Setup tasks
  setup:
    desc: Setup development environment
    cmds:
      - task: setup:deps
      - task: setup:tools
      - task: setup:hooks
    silent: true

  setup:deps:
    desc: Install dependencies
    cmds:
      - npm install
      - pip install -e ".[dev]"
    sources:
      - package.json
      - package-lock.json
      - pyproject.toml
    generates:
      - node_modules/**/*

  setup:tools:
    desc: Install development tools
    cmds:
      - npm install -g typescript ts-node
      - pip install ruff mypy pytest
    status:
      - which typescript
      - which ruff

  setup:hooks:
    desc: Setup git hooks
    cmds:
      - npx husky install
      - chmod +x .husky/*
    status:
      - test -f .husky/pre-commit

  # Development tasks
  dev:
    desc: Start development server
    deps: [setup:deps]
    cmds:
      - npm run dev
    interactive: true

  dev:watch:
    desc: Start development with file watching
    cmds:
      - task --watch dev

  # Build tasks
  build:
    desc: Build the project
    deps: [lint, typecheck]
    cmds:
      - npm run build
    sources:
      - src/**/*.ts
      - src/**/*.tsx
    generates:
      - dist/**/*

  build:prod:
    desc: Production build
    env:
      NODE_ENV: production
    cmds:
      - task: clean
      - task: build
      - task: test

  # Lint tasks
  lint:
    desc: Run all linters
    cmds:
      - task: lint:js
      - task: lint:css
      - task: lint:py

  lint:js:
    desc: Lint JavaScript/TypeScript
    cmds:
      - npx eslint . --ext .ts,.tsx,.js,.jsx
    sources:
      - src/**/*.ts
      - src/**/*.tsx
      - .eslintrc*

  lint:css:
    desc: Lint CSS/SCSS
    cmds:
      - npx stylelint "**/*.{css,scss}"
    sources:
      - src/**/*.css
      - src/**/*.scss

  lint:py:
    desc: Lint Python code
    cmds:
      - ruff check .
      - ruff format --check .
    sources:
      - "**/*.py"

  lint:fix:
    desc: Auto-fix linting issues
    cmds:
      - npx eslint . --ext .ts,.tsx --fix
      - npx stylelint "**/*.{css,scss}" --fix
      - ruff check . --fix
      - ruff format .

  # Type checking
  typecheck:
    desc: Run type checking
    cmds:
      - npx tsc --noEmit
      - mypy .
    sources:
      - src/**/*.ts
      - "**/*.py"

  # Test tasks
  test:
    desc: Run all tests
    cmds:
      - task: test:unit
      - task: test:integration

  test:unit:
    desc: Run unit tests
    cmds:
      - npm run test
    env:
      CI: 'true'

  test:integration:
    desc: Run integration tests
    cmds:
      - npm run test:integration
    env:
      CI: 'true'

  test:watch:
    desc: Run tests in watch mode
    cmds:
      - npm run test -- --watch
    interactive: true

  test:coverage:
    desc: Run tests with coverage
    cmds:
      - npm run test -- --coverage
    generates:
      - coverage/**/*

  # Database tasks
  db:migrate:
    desc: Run database migrations
    cmds:
      - npx prisma migrate dev
    preconditions:
      - sh: '[ -n "$DATABASE_URL" ]'
        msg: DATABASE_URL environment variable is required

  db:seed:
    desc: Seed the database
    deps: [db:migrate]
    cmds:
      - npx prisma db seed

  db:reset:
    desc: Reset the database
    prompt: This will delete all data. Are you sure?
    cmds:
      - npx prisma migrate reset --force

  db:studio:
    desc: Open Prisma Studio
    cmds:
      - npx prisma studio
    interactive: true

  # Docker tasks
  docker:build:
    desc: Build Docker image
    cmds:
      - docker build -t {{.PROJECT_NAME}}:{{.VERSION | default "latest"}} .
    vars:
      VERSION:
        sh: git describe --tags --always

  docker:run:
    desc: Run Docker container
    deps: [docker:build]
    cmds:
      - docker run -p 3000:3000 {{.PROJECT_NAME}}:{{.VERSION | default "latest"}}

  docker:compose:up:
    desc: Start Docker Compose services
    cmds:
      - docker-compose up -d

  docker:compose:down:
    desc: Stop Docker Compose services
    cmds:
      - docker-compose down

  # Clean tasks
  clean:
    desc: Clean build artifacts
    cmds:
      - rm -rf dist
      - rm -rf .next
      - rm -rf coverage
      - rm -rf __pycache__
      - rm -rf .pytest_cache
      - rm -rf .mypy_cache

  clean:all:
    desc: Clean everything including dependencies
    deps: [clean]
    cmds:
      - rm -rf node_modules
      - rm -rf .venv

  # Release tasks
  release:
    desc: Create a new release
    cmds:
      - task: test
      - task: build:prod
      - npx changeset version
      - npx changeset publish

  release:patch:
    desc: Create patch release
    cmds:
      - npm version patch
      - git push --follow-tags

  release:minor:
    desc: Create minor release
    cmds:
      - npm version minor
      - git push --follow-tags

  release:major:
    desc: Create major release
    cmds:
      - npm version major
      - git push --follow-tags

  # Utility tasks
  format:
    desc: Format all code
    cmds:
      - npx prettier --write .
      - ruff format .

  update:
    desc: Update dependencies
    cmds:
      - npm update
      - pip install --upgrade -e ".[dev]"
      - npx npm-check-updates -u

  docs:
    desc: Generate documentation
    cmds:
      - npx typedoc src/index.ts
    generates:
      - docs/**/*

  docs:serve:
    desc: Serve documentation locally
    deps: [docs]
    cmds:
      - npx serve docs
    interactive: true
```

### tasks/docker.yml
```yaml
version: '3'

tasks:
  build:
    desc: Build Docker image
    cmds:
      - docker build
        --build-arg NODE_VERSION={{.NODE_VERSION}}
        --build-arg BUILD_DATE={{.BUILD_DATE}}
        --build-arg VCS_REF={{.VCS_REF}}
        -t {{.IMAGE_NAME}}:{{.TAG}}
        -f {{.DOCKERFILE}}
        .
    vars:
      IMAGE_NAME: '{{.PROJECT_NAME | default "app"}}'
      TAG: '{{.VERSION | default "latest"}}'
      DOCKERFILE: '{{.DOCKERFILE | default "Dockerfile"}}'
      BUILD_DATE:
        sh: date -u +"%Y-%m-%dT%H:%M:%SZ"
      VCS_REF:
        sh: git rev-parse --short HEAD

  push:
    desc: Push Docker image to registry
    cmds:
      - docker push {{.REGISTRY}}/{{.IMAGE_NAME}}:{{.TAG}}
    requires:
      vars: [REGISTRY]

  scan:
    desc: Scan Docker image for vulnerabilities
    cmds:
      - docker scout cves {{.IMAGE_NAME}}:{{.TAG}}

  prune:
    desc: Remove unused Docker resources
    cmds:
      - docker system prune -f
      - docker image prune -f
```

## Makefile Configuration

### Makefile
```makefile
# Project configuration
PROJECT_NAME := myproject
VERSION := $(shell git describe --tags --always --dirty)
BUILD_DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT := $(shell git rev-parse --short HEAD)

# Go configuration
GOOS ?= $(shell go env GOOS)
GOARCH ?= $(shell go env GOARCH)
GOFLAGS := -ldflags "-X main.version=$(VERSION) -X main.buildDate=$(BUILD_DATE)"

# Docker configuration
DOCKER_IMAGE := $(PROJECT_NAME)
DOCKER_TAG := $(VERSION)
DOCKER_REGISTRY ?= ghcr.io/myorg

# Directories
SRC_DIR := ./src
BUILD_DIR := ./dist
COVERAGE_DIR := ./coverage

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

.PHONY: all
all: help

##@ Development

.PHONY: setup
setup: ## Setup development environment
	@echo "$(BLUE)Setting up development environment...$(NC)"
	npm install
	pip install -e ".[dev]"
	npx husky install

.PHONY: dev
dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(NC)"
	npm run dev

.PHONY: watch
watch: ## Start development with file watching
	@echo "$(BLUE)Starting watch mode...$(NC)"
	npm run dev -- --watch

##@ Building

.PHONY: build
build: lint typecheck ## Build the project
	@echo "$(BLUE)Building project...$(NC)"
	npm run build

.PHONY: build-prod
build-prod: clean build test ## Production build
	@echo "$(GREEN)Production build complete$(NC)"

.PHONY: build-go
build-go: ## Build Go binary
	@echo "$(BLUE)Building Go binary...$(NC)"
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) \
		go build $(GOFLAGS) -o $(BUILD_DIR)/$(PROJECT_NAME) ./cmd/main.go

##@ Testing

.PHONY: test
test: test-unit test-integration ## Run all tests

.PHONY: test-unit
test-unit: ## Run unit tests
	@echo "$(BLUE)Running unit tests...$(NC)"
	npm run test

.PHONY: test-integration
test-integration: ## Run integration tests
	@echo "$(BLUE)Running integration tests...$(NC)"
	npm run test:integration

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	npm run test -- --watch

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	npm run test -- --coverage
	@echo "$(GREEN)Coverage report: $(COVERAGE_DIR)/lcov-report/index.html$(NC)"

##@ Linting

.PHONY: lint
lint: lint-js lint-py ## Run all linters

.PHONY: lint-js
lint-js: ## Lint JavaScript/TypeScript
	@echo "$(BLUE)Linting JavaScript/TypeScript...$(NC)"
	npx eslint . --ext .ts,.tsx,.js,.jsx

.PHONY: lint-py
lint-py: ## Lint Python code
	@echo "$(BLUE)Linting Python...$(NC)"
	ruff check .
	ruff format --check .

.PHONY: lint-fix
lint-fix: ## Auto-fix linting issues
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	npx eslint . --ext .ts,.tsx --fix
	ruff check . --fix
	ruff format .

.PHONY: typecheck
typecheck: ## Run type checking
	@echo "$(BLUE)Type checking...$(NC)"
	npx tsc --noEmit
	mypy .

##@ Database

.PHONY: db-migrate
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	npx prisma migrate dev

.PHONY: db-seed
db-seed: db-migrate ## Seed the database
	@echo "$(BLUE)Seeding database...$(NC)"
	npx prisma db seed

.PHONY: db-reset
db-reset: ## Reset the database
	@echo "$(YELLOW)Resetting database...$(NC)"
	npx prisma migrate reset --force

##@ Docker

.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build \
		--build-arg VERSION=$(VERSION) \
		--build-arg BUILD_DATE=$(BUILD_DATE) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		-t $(DOCKER_IMAGE):$(DOCKER_TAG) .

.PHONY: docker-push
docker-push: docker-build ## Push Docker image
	@echo "$(BLUE)Pushing Docker image...$(NC)"
	docker tag $(DOCKER_IMAGE):$(DOCKER_TAG) $(DOCKER_REGISTRY)/$(DOCKER_IMAGE):$(DOCKER_TAG)
	docker push $(DOCKER_REGISTRY)/$(DOCKER_IMAGE):$(DOCKER_TAG)

.PHONY: docker-run
docker-run: ## Run Docker container
	docker run -p 3000:3000 $(DOCKER_IMAGE):$(DOCKER_TAG)

.PHONY: compose-up
compose-up: ## Start Docker Compose services
	docker-compose up -d

.PHONY: compose-down
compose-down: ## Stop Docker Compose services
	docker-compose down

##@ Cleaning

.PHONY: clean
clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf $(BUILD_DIR)
	rm -rf .next
	rm -rf $(COVERAGE_DIR)
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -rf .mypy_cache

.PHONY: clean-all
clean-all: clean ## Clean everything including dependencies
	@echo "$(YELLOW)Cleaning all...$(NC)"
	rm -rf node_modules
	rm -rf .venv

##@ Release

.PHONY: release
release: test build-prod ## Create a release
	@echo "$(BLUE)Creating release...$(NC)"
	npx changeset version
	npx changeset publish

.PHONY: release-patch
release-patch: ## Create patch release
	npm version patch
	git push --follow-tags

.PHONY: release-minor
release-minor: ## Create minor release
	npm version minor
	git push --follow-tags

##@ Utilities

.PHONY: format
format: ## Format all code
	@echo "$(BLUE)Formatting code...$(NC)"
	npx prettier --write .
	ruff format .

.PHONY: update
update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	npm update
	pip install --upgrade -e ".[dev]"

.PHONY: docs
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	npx typedoc src/index.ts

.PHONY: version
version: ## Show version information
	@echo "Version: $(VERSION)"
	@echo "Build Date: $(BUILD_DATE)"
	@echo "Git Commit: $(GIT_COMMIT)"

##@ Help

.PHONY: help
help: ## Show this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
```

## Just Configuration

### justfile
```just
# Project configuration
project_name := "myproject"
version := `git describe --tags --always --dirty 2>/dev/null || echo "dev"`

# Default recipe
default:
    @just --list

# Aliases
alias b := build
alias t := test
alias d := dev
alias l := lint
alias f := format

# Setup development environment
setup:
    npm install
    pip install -e ".[dev]"
    npx husky install

# Start development server
dev:
    npm run dev

# Build the project
build: lint typecheck
    npm run build

# Production build
build-prod: clean build test
    @echo "Production build complete"

# Run all tests
test: test-unit test-integration

# Run unit tests
test-unit:
    npm run test

# Run integration tests
test-integration:
    npm run test:integration

# Run tests with coverage
test-coverage:
    npm run test -- --coverage

# Run all linters
lint: lint-js lint-py

# Lint JavaScript/TypeScript
lint-js:
    npx eslint . --ext .ts,.tsx,.js,.jsx

# Lint Python
lint-py:
    ruff check .
    ruff format --check .

# Fix linting issues
lint-fix:
    npx eslint . --ext .ts,.tsx --fix
    ruff check . --fix
    ruff format .

# Type checking
typecheck:
    npx tsc --noEmit
    mypy .

# Format code
format:
    npx prettier --write .
    ruff format .

# Database migrations
db-migrate:
    npx prisma migrate dev

# Seed database
db-seed: db-migrate
    npx prisma db seed

# Reset database
[confirm("This will delete all data. Continue?")]
db-reset:
    npx prisma migrate reset --force

# Build Docker image
docker-build:
    docker build -t {{project_name}}:{{version}} .

# Run Docker container
docker-run: docker-build
    docker run -p 3000:3000 {{project_name}}:{{version}}

# Start Docker Compose
compose-up:
    docker-compose up -d

# Stop Docker Compose
compose-down:
    docker-compose down

# Clean build artifacts
clean:
    rm -rf dist .next coverage __pycache__ .pytest_cache .mypy_cache

# Clean everything
clean-all: clean
    rm -rf node_modules .venv

# Create release
release: test build-prod
    npx changeset version
    npx changeset publish

# Show version
version:
    @echo "Version: {{version}}"

# Generate documentation
docs:
    npx typedoc src/index.ts

# Run arbitrary npm script
npm script:
    npm run {{script}}

# Run with environment file
[private]
with-env file cmd:
    @set -a && source {{file}} && {{cmd}}
```

## npm Scripts Configuration

### package.json
```json
{
  "name": "myproject",
  "version": "0.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "lint:css": "stylelint '**/*.{css,scss}'",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "clean": "rm -rf .next dist coverage",
    "prepare": "husky",
    "validate": "npm-run-all --parallel lint typecheck test",
    "precommit": "lint-staged",
    "release": "changeset publish",
    "version": "changeset version"
  },
  "devDependencies": {
    "npm-run-all": "^4.1.5"
  }
}
```

## CLAUDE.md Integration

```markdown
## Task Runners

### Available Commands
Using Taskfile:
- `task` - Show available tasks
- `task dev` - Start development
- `task build` - Build project
- `task test` - Run tests
- `task lint` - Run linters
- `task db:migrate` - Run migrations

Using Make:
- `make help` - Show available commands
- `make dev` - Start development
- `make build` - Build project
- `make test` - Run tests

Using Just:
- `just` - Show available recipes
- `just dev` - Start development
- `just build` - Build project

### Common Workflows
1. Setup: `task setup` or `make setup`
2. Development: `task dev` or `make dev`
3. Before commit: `task lint test`
4. Release: `task release`
```

## AI Suggestions

1. **Task discovery** - Auto-discover available tasks
2. **Dependency graphing** - Visualize task dependencies
3. **Parallel execution** - Optimize parallel tasks
4. **Caching** - Intelligent task caching
5. **Cross-platform** - Handle OS differences
6. **Environment management** - Manage env variables
7. **Task templates** - Generate common tasks
8. **Progress reporting** - Show task progress
9. **Error recovery** - Handle task failures
10. **Task composition** - Combine tasks flexibly
