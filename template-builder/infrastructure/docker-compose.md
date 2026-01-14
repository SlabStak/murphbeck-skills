# Docker Compose Template

> Production-ready Docker Compose configurations for multi-service applications

## Overview

This template provides comprehensive Docker Compose configurations with:
- Multi-environment setups (dev, staging, production)
- Service health checks and dependencies
- Volume management and networking
- Resource constraints
- Secrets management
- Logging configuration

## Quick Start

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale worker=3
```

## Base Configuration (docker-compose.yml)

```yaml
version: '3.8'

# ============================================
# Common Configuration
# ============================================
x-common-env: &common-env
  TZ: UTC
  LOG_LEVEL: ${LOG_LEVEL:-info}

x-healthcheck-defaults: &healthcheck-defaults
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s

x-logging: &default-logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
    tag: "{{.Name}}/{{.ID}}"

# ============================================
# Services
# ============================================
services:
  # API Service
  api:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    image: ${REGISTRY:-local}/api:${VERSION:-latest}
    container_name: api
    restart: unless-stopped
    ports:
      - "${API_PORT:-3000}:3000"
    environment:
      <<: *common-env
      NODE_ENV: ${NODE_ENV:-production}
      DATABASE_URL: postgres://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@db:5432/${DB_NAME:-app}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      API_KEY: ${API_KEY}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      <<: *healthcheck-defaults
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    logging: *default-logging
    networks:
      - frontend
      - backend

  # Worker Service
  worker:
    build:
      context: .
      dockerfile: Dockerfile
      target: worker
    image: ${REGISTRY:-local}/worker:${VERSION:-latest}
    container_name: worker
    restart: unless-stopped
    environment:
      <<: *common-env
      DATABASE_URL: postgres://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@db:5432/${DB_NAME:-app}
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.1'
          memory: 128M
    logging: *default-logging
    networks:
      - backend

  # Scheduler Service
  scheduler:
    build:
      context: .
      dockerfile: Dockerfile
      target: scheduler
    image: ${REGISTRY:-local}/scheduler:${VERSION:-latest}
    container_name: scheduler
    restart: unless-stopped
    environment:
      <<: *common-env
      REDIS_URL: redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    logging: *default-logging
    networks:
      - backend

  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-app}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      <<: *healthcheck-defaults
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-app}"]
      interval: 10s
    logging: *default-logging
    networks:
      - backend

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      <<: *healthcheck-defaults
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
    logging: *default-logging
    networks:
      - backend

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certs:/etc/nginx/certs:ro
      - static_files:/var/www/static:ro
    depends_on:
      - api
    healthcheck:
      <<: *healthcheck-defaults
      test: ["CMD", "nginx", "-t"]
    logging: *default-logging
    networks:
      - frontend

# ============================================
# Networks
# ============================================
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true

# ============================================
# Volumes
# ============================================
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  static_files:
    driver: local
```

## Development Override (docker-compose.dev.yml)

```yaml
version: '3.8'

services:
  api:
    build:
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
      DEBUG: "app:*"
    command: npm run dev
    ports:
      - "3000:3000"
      - "9229:9229"  # Debugger

  worker:
    build:
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run worker:dev

  db:
    ports:
      - "5432:5432"

  redis:
    ports:
      - "6379:6379"

  # Development tools
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    networks:
      - backend

  redis-commander:
    image: rediscommander/redis-commander
    environment:
      REDIS_HOSTS: local:redis:6379
    ports:
      - "8081:8081"
    networks:
      - backend

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"
    networks:
      - backend
```

## Production Override (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  api:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"

  worker:
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  db:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    environment:
      POSTGRES_INITDB_ARGS: "--data-checksums"
    command: >
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c pg_stat_statements.track=all
      -c max_connections=200
      -c shared_buffers=1GB
      -c effective_cache_size=3GB
      -c maintenance_work_mem=256MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
      -c random_page_cost=1.1
      -c effective_io_concurrency=200

  redis:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    command: >
      redis-server
      --appendonly yes
      --maxmemory 384mb
      --maxmemory-policy allkeys-lru
      --tcp-backlog 511
      --timeout 0
      --tcp-keepalive 300

  nginx:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

## With Secrets (docker-compose.secrets.yml)

```yaml
version: '3.8'

services:
  api:
    secrets:
      - db_password
      - jwt_secret
      - api_key
    environment:
      DATABASE_URL: postgres://${DB_USER}:$(cat /run/secrets/db_password)@db:5432/${DB_NAME}
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      API_KEY_FILE: /run/secrets/api_key

  db:
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  api_key:
    external: true
    name: production_api_key
```

## Full Stack Example

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on:
      - api

  # API Gateway
  api:
    build:
      context: ./api
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
      - REDIS_URL=redis://redis:6379
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - RABBITMQ_URL=amqp://user:pass@rabbitmq:5672
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      elasticsearch:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  # Background Workers
  worker:
    build:
      context: ./api
      target: worker
    deploy:
      replicas: 3
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://user:pass@rabbitmq:5672
    depends_on:
      - api

  # PostgreSQL
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Elasticsearch
  elasticsearch:
    image: elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: user
      RABBITMQ_DEFAULT_PASS: pass
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "15672:15672"  # Management UI
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 30s
      timeout: 10s
      retries: 5

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  # Prometheus
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  # Grafana
  grafana:
    image: grafana/grafana
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
  rabbitmq_data:
  minio_data:
  prometheus_data:
  grafana_data:
```

## .env Example

```bash
# Application
NODE_ENV=production
VERSION=1.0.0
API_PORT=3000

# Database
DB_USER=postgres
DB_PASSWORD=secure_password_here
DB_NAME=myapp

# Redis
REDIS_PASSWORD=redis_password

# Secrets
JWT_SECRET=your_jwt_secret_here
API_KEY=your_api_key_here

# Registry
REGISTRY=ghcr.io/username

# Logging
LOG_LEVEL=info
```

## CLAUDE.md Integration

```markdown
# Docker Compose

## Commands
- `docker-compose up -d` - Start all services
- `docker-compose down` - Stop all services
- `docker-compose logs -f service` - View service logs
- `docker-compose ps` - List running services
- `docker-compose exec service sh` - Shell into service

## Environment Files
- `.env` - Default environment
- `.env.dev` - Development overrides
- `.env.prod` - Production overrides

## Compose Files
- `docker-compose.yml` - Base configuration
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.prod.yml` - Production overrides

## Production Deployment
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
```

## AI Suggestions

1. **Add Traefik for routing** - Replace nginx with Traefik for automatic SSL and service discovery
2. **Implement Docker Swarm** - Convert to swarm mode for built-in orchestration
3. **Add backup service** - Include automated database backup container
4. **Configure log aggregation** - Add Loki/Promtail for centralized logging
5. **Implement blue-green deployments** - Set up parallel environments for zero-downtime
6. **Add resource monitoring** - Include cAdvisor for container metrics
7. **Configure network policies** - Implement stricter network isolation
8. **Add health check dashboards** - Create Grafana dashboards for service health
9. **Implement auto-scaling** - Add container auto-scaling based on metrics
10. **Add secrets rotation** - Implement automated secrets rotation with Vault
