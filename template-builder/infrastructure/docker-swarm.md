# Docker Swarm Configuration Template

> Production-ready Docker Swarm configurations for container orchestration with high availability

## Overview

This template provides Docker Swarm configurations with:
- Multi-node cluster setup
- Service deployment with replicas
- Rolling updates and rollbacks
- Secrets and configs management
- Overlay networking

## Quick Start

```bash
# Initialize swarm (on manager)
docker swarm init --advertise-addr <manager-ip>

# Join worker nodes
docker swarm join --token <token> <manager-ip>:2377

# Deploy stack
docker stack deploy -c docker-compose.yml myapp

# View services
docker service ls

# Scale service
docker service scale myapp_api=5
```

## Cluster Initialization

```bash
#!/bin/bash
# init-swarm.sh

MANAGER_IP="10.0.1.10"
WORKER_TOKEN=""
MANAGER_TOKEN=""

# Initialize swarm on first manager
docker swarm init --advertise-addr ${MANAGER_IP}

# Get tokens
WORKER_TOKEN=$(docker swarm join-token worker -q)
MANAGER_TOKEN=$(docker swarm join-token manager -q)

echo "Worker token: ${WORKER_TOKEN}"
echo "Manager token: ${MANAGER_TOKEN}"

# Save tokens securely
echo "${WORKER_TOKEN}" > /root/.swarm-worker-token
echo "${MANAGER_TOKEN}" > /root/.swarm-manager-token
chmod 600 /root/.swarm-*-token

# Join additional managers (run on other manager nodes)
# docker swarm join --token ${MANAGER_TOKEN} ${MANAGER_IP}:2377

# Join workers (run on worker nodes)
# docker swarm join --token ${WORKER_TOKEN} ${MANAGER_IP}:2377
```

## Docker Compose Stack

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Web application
  web:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - nginx-config:/etc/nginx/conf.d:ro
      - static-files:/var/www/html:ro
    networks:
      - frontend
    deploy:
      mode: replicated
      replicas: 3
      placement:
        constraints:
          - node.role == worker
        preferences:
          - spread: node.labels.zone
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        monitor: 60s
        max_failure_ratio: 0.3
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.web.rule=Host(`app.example.com`)"
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    configs:
      - source: nginx_config
        target: /etc/nginx/nginx.conf
    secrets:
      - ssl_certificate
      - ssl_key

  # API service
  api:
    image: myapp/api:latest
    environment:
      - NODE_ENV=production
      - PORT=8080
      - DATABASE_URL_FILE=/run/secrets/database_url
      - REDIS_URL=redis://redis:6379
    networks:
      - frontend
      - backend
    deploy:
      mode: replicated
      replicas: 5
      endpoint_mode: vip
      placement:
        constraints:
          - node.role == worker
          - node.labels.tier == api
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      update_config:
        parallelism: 2
        delay: 10s
        failure_action: rollback
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 5s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    secrets:
      - database_url
      - api_secret_key
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Worker service
  worker:
    image: myapp/worker:latest
    environment:
      - WORKER_CONCURRENCY=4
    networks:
      - backend
    deploy:
      mode: global
      placement:
        constraints:
          - node.labels.tier == worker
      resources:
        limits:
          cpus: '1'
          memory: 512M
      restart_policy:
        condition: on-failure
    secrets:
      - database_url

  # Redis cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - backend
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure

  # PostgreSQL database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER_FILE: /run/secrets/postgres_user
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - backend
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.labels.tier == database
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
      restart_policy:
        condition: on-failure
    secrets:
      - postgres_user
      - postgres_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$(cat /run/secrets/postgres_user)"]
      interval: 30s
      timeout: 10s
      retries: 5

networks:
  frontend:
    driver: overlay
    attachable: true
    driver_opts:
      encrypted: "true"
  backend:
    driver: overlay
    internal: true
    driver_opts:
      encrypted: "true"

volumes:
  postgres-data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=10.0.1.100,rw
      device: ":/exports/postgres-data"
  redis-data:
    driver: local
  nginx-config:
    driver: local
  static-files:
    driver: local

configs:
  nginx_config:
    file: ./nginx/nginx.conf
    external: false

secrets:
  database_url:
    external: true
  api_secret_key:
    external: true
  postgres_user:
    external: true
  postgres_password:
    external: true
  ssl_certificate:
    file: ./certs/cert.pem
  ssl_key:
    file: ./certs/key.pem
```

## Managing Secrets

```bash
#!/bin/bash
# manage-secrets.sh

# Create secrets
echo "postgresql://user:password@postgres:5432/myapp" | docker secret create database_url -
echo "supersecretkey123" | docker secret create api_secret_key -
echo "admin" | docker secret create postgres_user -
openssl rand -base64 32 | docker secret create postgres_password -

# List secrets
docker secret ls

# Inspect secret (metadata only)
docker secret inspect database_url

# Remove secret
# docker secret rm database_url

# Update secret (requires service update)
echo "new-secret-value" | docker secret create database_url_v2 -
docker service update --secret-rm database_url --secret-add database_url_v2 myapp_api
```

## Node Labels and Constraints

```bash
#!/bin/bash
# setup-nodes.sh

# Add labels to nodes
docker node update --label-add tier=api worker-1
docker node update --label-add tier=api worker-2
docker node update --label-add tier=worker worker-3
docker node update --label-add tier=database worker-4
docker node update --label-add zone=us-east-1a worker-1
docker node update --label-add zone=us-east-1b worker-2
docker node update --label-add zone=us-east-1c worker-3

# View node labels
docker node inspect worker-1 --format '{{ .Spec.Labels }}'

# List nodes with labels
docker node ls -q | xargs docker node inspect -f '{{ .Description.Hostname }}: {{ .Spec.Labels }}'
```

## Service Management

```bash
#!/bin/bash
# service-management.sh

# Create service
docker service create \
  --name api \
  --replicas 3 \
  --publish published=8080,target=8080 \
  --network frontend \
  --secret database_url \
  --env NODE_ENV=production \
  --constraint 'node.role == worker' \
  --update-parallelism 1 \
  --update-delay 10s \
  --rollback-parallelism 1 \
  --rollback-delay 10s \
  --health-cmd "curl -f http://localhost:8080/health" \
  --health-interval 30s \
  --health-timeout 10s \
  --health-retries 3 \
  myapp/api:latest

# Update service (rolling update)
docker service update \
  --image myapp/api:v2 \
  --update-parallelism 2 \
  --update-delay 10s \
  api

# Rollback service
docker service rollback api

# Scale service
docker service scale api=5

# View service logs
docker service logs -f api

# View service tasks
docker service ps api

# Force service update (redeploy all tasks)
docker service update --force api
```

## Traefik Load Balancer

```yaml
# traefik-stack.yml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    command:
      - --api.dashboard=true
      - --providers.docker=true
      - --providers.docker.swarmMode=true
      - --providers.docker.exposedbydefault=false
      - --providers.docker.network=traefik-public
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --certificatesresolvers.letsencrypt.acme.email=admin@example.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certificates:/letsencrypt
    networks:
      - traefik-public
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.dashboard.rule=Host(`traefik.example.com`)"
        - "traefik.http.routers.dashboard.service=api@internal"
        - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
        - "traefik.http.routers.dashboard.middlewares=auth"
        - "traefik.http.middlewares.auth.basicauth.users=admin:$$apr1$$..."
        - "traefik.http.services.traefik.loadbalancer.server.port=8080"

networks:
  traefik-public:
    external: true

volumes:
  traefik-certificates:
```

## Monitoring Stack

```yaml
# monitoring-stack.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - prometheus-data:/prometheus
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    networks:
      - monitoring
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          memory: 2G

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD__FILE=/run/secrets/grafana_admin_password
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - monitoring
      - traefik-public
    deploy:
      mode: replicated
      replicas: 1
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.grafana.rule=Host(`grafana.example.com`)"
        - "traefik.http.services.grafana.loadbalancer.server.port=3000"
    secrets:
      - grafana_admin_password

  node-exporter:
    image: prom/node-exporter:latest
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring
    deploy:
      mode: global

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker:/var/lib/docker:ro
    networks:
      - monitoring
    deploy:
      mode: global

networks:
  monitoring:
    driver: overlay
  traefik-public:
    external: true

volumes:
  prometheus-data:
  grafana-data:

secrets:
  grafana_admin_password:
    external: true
```

## CLAUDE.md Integration

```markdown
# Docker Swarm

## Commands
- `docker swarm init` - Initialize swarm
- `docker stack deploy -c docker-compose.yml app` - Deploy stack
- `docker service ls` - List services
- `docker service scale app_api=5` - Scale service
- `docker service update --image app:v2 app_api` - Update service
- `docker service rollback app_api` - Rollback service
- `docker service logs -f app_api` - View logs

## Node Management
- `docker node ls` - List nodes
- `docker node update --label-add key=value node` - Add label
- `docker node promote node` - Promote to manager
- `docker node demote node` - Demote to worker

## Stack Management
- `docker stack ls` - List stacks
- `docker stack services app` - List stack services
- `docker stack rm app` - Remove stack

## Secrets
- `docker secret create name -` - Create from stdin
- `docker secret ls` - List secrets
- `docker secret rm name` - Remove secret
```

## AI Suggestions

1. **Add distributed storage** - Configure GlusterFS or Ceph
2. **Implement service mesh** - Add Traefik mesh
3. **Configure log aggregation** - Ship logs to ELK/Loki
4. **Add backup strategy** - Automated volume backups
5. **Implement blue-green deployments** - Zero-downtime updates
6. **Configure health dashboards** - Grafana dashboards
7. **Add alerting** - Prometheus alertmanager
8. **Implement GitOps** - Automated deployments
9. **Configure multi-region** - Cross-datacenter clustering
10. **Add security scanning** - Container vulnerability scanning
