# Drone CI Configuration Template

> Production-ready Drone CI configurations for container-native CI/CD

## Overview

This template provides Drone CI configurations with:
- Multi-pipeline support
- Secrets management
- Matrix builds
- Promotion workflows
- Kubernetes deployments

## Quick Start

```bash
# Install Drone CLI
curl -L https://github.com/harness/drone-cli/releases/latest/download/drone_linux_amd64.tar.gz | tar zx
sudo install -t /usr/local/bin drone

# Configure CLI
export DRONE_SERVER=https://drone.example.com
export DRONE_TOKEN=<your-token>

# Validate config
drone lint .drone.yml

# Start build
drone build create owner/repo

# View logs
drone log view owner/repo 1
```

## Complete Configuration

```yaml
# .drone.yml
kind: pipeline
type: docker
name: default

platform:
  os: linux
  arch: amd64

trigger:
  branch:
    - main
    - develop
    - feature/*
  event:
    - push
    - pull_request
    - tag

# ==============================================================================
# Clone settings
# ==============================================================================
clone:
  depth: 50
  disable: false

# ==============================================================================
# Steps
# ==============================================================================
steps:
  - name: restore-cache
    image: meltwater/drone-cache:latest
    pull: if-not-exists
    settings:
      backend: s3
      restore: true
      bucket: drone-cache
      region: us-east-1
      mount:
        - node_modules
        - .npm
    environment:
      AWS_ACCESS_KEY_ID:
        from_secret: aws_access_key_id
      AWS_SECRET_ACCESS_KEY:
        from_secret: aws_secret_access_key

  - name: install
    image: node:20-alpine
    commands:
      - npm ci --prefer-offline

  - name: lint
    image: node:20-alpine
    commands:
      - npm run lint
    depends_on:
      - install

  - name: typecheck
    image: node:20-alpine
    commands:
      - npm run typecheck
    depends_on:
      - install

  - name: test
    image: node:20-alpine
    commands:
      - npm test -- --coverage --ci
    depends_on:
      - install

  - name: build
    image: node:20-alpine
    commands:
      - npm run build
    depends_on:
      - lint
      - typecheck
      - test

  - name: rebuild-cache
    image: meltwater/drone-cache:latest
    pull: if-not-exists
    settings:
      backend: s3
      rebuild: true
      bucket: drone-cache
      region: us-east-1
      mount:
        - node_modules
        - .npm
    environment:
      AWS_ACCESS_KEY_ID:
        from_secret: aws_access_key_id
      AWS_SECRET_ACCESS_KEY:
        from_secret: aws_secret_access_key
    depends_on:
      - build

  - name: build-image
    image: plugins/docker
    settings:
      registry: ghcr.io
      repo: ghcr.io/myorg/myapp
      tags:
        - ${DRONE_COMMIT_SHA:0:8}
        - ${DRONE_TAG:-latest}
      username:
        from_secret: docker_username
      password:
        from_secret: docker_password
      build_args:
        - BUILD_DATE=${DRONE_BUILD_CREATED}
        - VCS_REF=${DRONE_COMMIT_SHA}
    when:
      branch:
        - main
        - develop
      event:
        - push
        - tag
    depends_on:
      - build

  - name: deploy-staging
    image: bitnami/kubectl:latest
    commands:
      - kubectl config set-cluster staging --server=$KUBE_SERVER --insecure-skip-tls-verify=true
      - kubectl config set-credentials drone --token=$KUBE_TOKEN
      - kubectl config set-context staging --cluster=staging --user=drone
      - kubectl config use-context staging
      - kubectl -n staging set image deployment/myapp myapp=ghcr.io/myorg/myapp:${DRONE_COMMIT_SHA:0:8}
      - kubectl -n staging rollout status deployment/myapp --timeout=300s
    environment:
      KUBE_SERVER:
        from_secret: staging_kube_server
      KUBE_TOKEN:
        from_secret: staging_kube_token
    when:
      branch:
        - develop
      event:
        - push
    depends_on:
      - build-image

  - name: notify-success
    image: plugins/slack
    settings:
      webhook:
        from_secret: slack_webhook
      channel: deployments
      template: >
        {{#success build.status}}
          Build {{build.number}} succeeded for {{repo.name}}
          Commit: {{build.commit}}
          Author: {{build.author}}
        {{/success}}
    when:
      status:
        - success
    depends_on:
      - build-image

  - name: notify-failure
    image: plugins/slack
    settings:
      webhook:
        from_secret: slack_webhook
      channel: alerts
      template: >
        {{#failure build.status}}
          Build {{build.number}} failed for {{repo.name}}
          Commit: {{build.commit}}
          Author: {{build.author}}
        {{/failure}}
    when:
      status:
        - failure

# ==============================================================================
# Services
# ==============================================================================
services:
  - name: postgres
    image: postgres:15
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test_db

  - name: redis
    image: redis:7-alpine

# ==============================================================================
# Volumes
# ==============================================================================
volumes:
  - name: cache
    host:
      path: /var/lib/drone/cache

---
# ==============================================================================
# Promotion Pipeline (Production)
# ==============================================================================
kind: pipeline
type: docker
name: production

trigger:
  event:
    - promote
  target:
    - production

steps:
  - name: deploy-production
    image: bitnami/kubectl:latest
    commands:
      - kubectl config set-cluster production --server=$KUBE_SERVER --insecure-skip-tls-verify=true
      - kubectl config set-credentials drone --token=$KUBE_TOKEN
      - kubectl config set-context production --cluster=production --user=drone
      - kubectl config use-context production
      - kubectl -n production set image deployment/myapp myapp=ghcr.io/myorg/myapp:${DRONE_COMMIT_SHA:0:8}
      - kubectl -n production rollout status deployment/myapp --timeout=300s
    environment:
      KUBE_SERVER:
        from_secret: production_kube_server
      KUBE_TOKEN:
        from_secret: production_kube_token

  - name: notify-production
    image: plugins/slack
    settings:
      webhook:
        from_secret: slack_webhook
      channel: deployments
      template: >
        Production deployment completed!
        Build: {{build.number}}
        Commit: {{build.commit}}
        Deployed by: {{build.author}}
    depends_on:
      - deploy-production

---
# ==============================================================================
# Rollback Pipeline
# ==============================================================================
kind: pipeline
type: docker
name: rollback

trigger:
  event:
    - rollback

steps:
  - name: rollback
    image: bitnami/kubectl:latest
    commands:
      - kubectl config set-cluster $DRONE_DEPLOY_TO --server=$KUBE_SERVER
      - kubectl config set-credentials drone --token=$KUBE_TOKEN
      - kubectl config set-context $DRONE_DEPLOY_TO --cluster=$DRONE_DEPLOY_TO --user=drone
      - kubectl config use-context $DRONE_DEPLOY_TO
      - kubectl -n $DRONE_DEPLOY_TO rollout undo deployment/myapp
    environment:
      KUBE_SERVER:
        from_secret: ${DRONE_DEPLOY_TO}_kube_server
      KUBE_TOKEN:
        from_secret: ${DRONE_DEPLOY_TO}_kube_token

---
# ==============================================================================
# Cron Pipeline (Nightly)
# ==============================================================================
kind: pipeline
type: docker
name: nightly

trigger:
  event:
    - cron
  cron:
    - nightly

steps:
  - name: install
    image: node:20-alpine
    commands:
      - npm ci

  - name: security-audit
    image: node:20-alpine
    commands:
      - npm audit --audit-level=high

  - name: e2e-tests
    image: mcr.microsoft.com/playwright:latest
    commands:
      - npm run test:e2e

  - name: report
    image: plugins/slack
    settings:
      webhook:
        from_secret: slack_webhook
      channel: nightly-builds
      template: >
        Nightly build completed
        Security audit: {{#success build.status}}Passed{{/success}}{{#failure build.status}}Failed{{/failure}}
    depends_on:
      - security-audit
      - e2e-tests
```

## Matrix Builds

```yaml
# .drone.yml (Matrix)
kind: pipeline
type: docker
name: test-matrix

steps:
  - name: test
    image: node:${NODE_VERSION}
    commands:
      - node --version
      - npm ci
      - npm test

---
kind: pipeline
type: docker
name: node-18

clone:
  disable: true

trigger:
  branch:
    - main

depends_on:
  - test-matrix

steps:
  - name: test
    image: node:18
    commands:
      - node --version

---
kind: pipeline
type: docker
name: node-20

clone:
  disable: true

trigger:
  branch:
    - main

depends_on:
  - test-matrix

steps:
  - name: test
    image: node:20
    commands:
      - node --version

---
kind: pipeline
type: docker
name: node-21

clone:
  disable: true

trigger:
  branch:
    - main

depends_on:
  - test-matrix

steps:
  - name: test
    image: node:21
    commands:
      - node --version
```

## Kubernetes Pipeline

```yaml
# .drone.yml (Kubernetes)
kind: pipeline
type: kubernetes
name: kubernetes

platform:
  os: linux
  arch: amd64

metadata:
  namespace: drone

steps:
  - name: build
    image: node:20-alpine
    commands:
      - npm ci
      - npm run build
    resources:
      requests:
        cpu: 500
        memory: 512MiB
      limits:
        cpu: 1000
        memory: 1GiB

  - name: test
    image: node:20-alpine
    commands:
      - npm test
    resources:
      requests:
        cpu: 500
        memory: 512MiB

  - name: publish
    image: plugins/docker
    settings:
      repo: myorg/myapp
      tags:
        - ${DRONE_COMMIT_SHA:0:8}
      username:
        from_secret: docker_username
      password:
        from_secret: docker_password

node_selector:
  kubernetes.io/os: linux

tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "ci"
    effect: "NoSchedule"

service_account_name: drone-runner

volumes:
  - name: cache
    claim:
      name: drone-cache
      read_only: false
```

## Secrets Configuration

```yaml
# Drone secrets (via CLI)
# drone secret add --repository owner/repo --name docker_username --data <value>
# drone secret add --repository owner/repo --name docker_password --data <value>

# Organization secrets
# drone orgsecret add myorg aws_access_key_id <value>
# drone orgsecret add myorg aws_secret_access_key <value>

# .drone.yml - Using external secrets
kind: secret
name: docker_username
get:
  path: secret/data/docker
  name: username
---
kind: secret
name: docker_password
get:
  path: secret/data/docker
  name: password
```

## Signature Validation

```yaml
# .drone.yml (with signature)
kind: signature
hmac: <generated-signature>

---
kind: pipeline
type: docker
name: signed

steps:
  - name: build
    image: node:20-alpine
    commands:
      - npm ci
      - npm run build
```

```bash
# Generate signature
drone sign owner/repo --save
```

## Jsonnet Templates

```jsonnet
// .drone.jsonnet
local Pipeline(name, branch='main') = {
  kind: 'pipeline',
  type: 'docker',
  name: name,
  trigger: {
    branch: [branch],
  },
  steps: [
    {
      name: 'build',
      image: 'node:20-alpine',
      commands: [
        'npm ci',
        'npm run build',
      ],
    },
  ],
};

[
  Pipeline('build-main', 'main'),
  Pipeline('build-develop', 'develop'),
]
```

```bash
# Convert Jsonnet to YAML
drone jsonnet --stream --format
```

## Starlark Templates

```python
# .drone.star
def main(ctx):
    return {
        "kind": "pipeline",
        "type": "docker",
        "name": "default",
        "steps": [
            {
                "name": "build",
                "image": "node:20-alpine",
                "commands": [
                    "npm ci",
                    "npm run build",
                ],
            },
        ],
    }

def build_pipeline(name, node_version="20"):
    return {
        "kind": "pipeline",
        "type": "docker",
        "name": name,
        "steps": [
            {
                "name": "test",
                "image": f"node:{node_version}-alpine",
                "commands": [
                    "npm ci",
                    "npm test",
                ],
            },
        ],
    }
```

## CLAUDE.md Integration

```markdown
# Drone CI

## Commands
- `drone lint .drone.yml` - Validate config
- `drone exec` - Run locally
- `drone build create owner/repo` - Start build
- `drone build promote owner/repo 1 production` - Promote
- `drone build rollback owner/repo 1 production` - Rollback

## Pipeline Types
- `docker` - Docker-based (default)
- `kubernetes` - Kubernetes-native
- `exec` - Direct execution
- `ssh` - Remote SSH

## Triggers
- `branch` - Branch filter
- `event` - push, pull_request, tag, promote, cron
- `target` - Promotion target

## Secrets
- `from_secret` - Reference secrets
- `drone secret add` - Add secrets via CLI
- External secrets (Vault, K8s)
```

## AI Suggestions

1. **Configure caching** - Use drone-cache plugin
2. **Implement promotions** - Manual production deploys
3. **Add matrix builds** - Multi-version testing
4. **Configure Kubernetes runner** - Native K8s execution
5. **Use Jsonnet/Starlark** - Dynamic configuration
6. **Add signature validation** - Secure pipelines
7. **Configure services** - Database/cache for tests
8. **Implement rollback** - Easy production rollback
9. **Add cron pipelines** - Scheduled builds
10. **Configure notifications** - Slack/email alerts
