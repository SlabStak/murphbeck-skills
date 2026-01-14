# GitLab CI Template

> Production-ready GitLab CI/CD pipelines with testing, security scanning, and deployment

## Overview

This template provides GitLab CI configurations with:
- Multi-stage pipeline
- Caching and artifacts
- Security scanning (SAST, DAST, Container)
- Auto DevOps compatible
- Kubernetes deployment

## Quick Start

```bash
# Create GitLab CI file
cp .gitlab-ci.yml ./

# Validate configuration
gitlab-ci-lint .gitlab-ci.yml

# Trigger pipeline
git push origin main
```

## Complete Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - prepare
  - validate
  - test
  - build
  - security
  - deploy
  - cleanup

variables:
  # Docker settings
  DOCKER_HOST: tcp://docker:2376
  DOCKER_TLS_CERTDIR: "/certs"
  DOCKER_TLS_VERIFY: 1
  DOCKER_CERT_PATH: "$DOCKER_TLS_CERTDIR/client"

  # Image settings
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  IMAGE_LATEST: $CI_REGISTRY_IMAGE:latest

  # Node settings
  NODE_VERSION: "20"

  # Cache settings
  FF_USE_FASTZIP: "true"
  CACHE_COMPRESSION_LEVEL: "fastest"

  # Kubernetes settings
  KUBE_NAMESPACE: $CI_PROJECT_NAME-$CI_ENVIRONMENT_SLUG

default:
  image: node:${NODE_VERSION}-alpine
  tags:
    - docker
  interruptible: true
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure

# Cache configuration
.node_cache: &node_cache
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/
    - .npm/
  policy: pull-push

# Workflow rules
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG

# =============================================================================
# Prepare Stage
# =============================================================================
install:
  stage: prepare
  cache:
    <<: *node_cache
    policy: push
  script:
    - npm ci --cache .npm --prefer-offline
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour

# =============================================================================
# Validate Stage
# =============================================================================
lint:
  stage: validate
  needs: [install]
  cache:
    <<: *node_cache
    policy: pull
  script:
    - npm run lint
    - npm run format:check
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

typecheck:
  stage: validate
  needs: [install]
  cache:
    <<: *node_cache
    policy: pull
  script:
    - npm run typecheck

commitlint:
  stage: validate
  needs: []
  image: node:${NODE_VERSION}-alpine
  script:
    - npm install -g @commitlint/cli @commitlint/config-conventional
    - echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
    - echo "$CI_COMMIT_MESSAGE" | commitlint
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# =============================================================================
# Test Stage
# =============================================================================
unit_test:
  stage: test
  needs: [install]
  cache:
    <<: *node_cache
    policy: pull
  script:
    - npm run test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    when: always
    paths:
      - coverage/
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
      junit: junit.xml
    expire_in: 1 week

integration_test:
  stage: test
  needs: [install]
  cache:
    <<: *node_cache
    policy: pull
  services:
    - name: postgres:16-alpine
      alias: postgres
    - name: redis:7-alpine
      alias: redis
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgresql://test:test@postgres:5432/test
    REDIS_URL: redis://redis:6379
  script:
    - npm run test:integration
  artifacts:
    when: always
    reports:
      junit: junit-integration.xml

e2e_test:
  stage: test
  needs: [install]
  image: mcr.microsoft.com/playwright:v1.40.0-jammy
  cache:
    <<: *node_cache
    policy: pull
  services:
    - name: postgres:16-alpine
      alias: postgres
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
  script:
    - npm run build
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - test-results/
      - playwright-report/
    reports:
      junit: junit-e2e.xml
    expire_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: manual
      allow_failure: true

# =============================================================================
# Build Stage
# =============================================================================
build:
  stage: build
  needs: [lint, typecheck, unit_test]
  cache:
    <<: *node_cache
    policy: pull
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

build_docker:
  stage: build
  needs: [build]
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $IMAGE_TAG -t $IMAGE_LATEST .
    - docker push $IMAGE_TAG
    - docker push $IMAGE_LATEST
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG

# =============================================================================
# Security Stage
# =============================================================================
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Container-Scanning.gitlab-ci.yml
  - template: Security/License-Scanning.gitlab-ci.yml

sast:
  stage: security
  needs: []
  variables:
    SAST_EXCLUDED_PATHS: "node_modules, dist, coverage"

secret_detection:
  stage: security
  needs: []

dependency_scanning:
  stage: security
  needs: [install]

container_scanning:
  stage: security
  needs: [build_docker]
  variables:
    CS_IMAGE: $IMAGE_TAG
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG

license_scanning:
  stage: security
  needs: [install]

trivy_scan:
  stage: security
  needs: [build_docker]
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy image --exit-code 1 --severity CRITICAL $IMAGE_TAG
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_TAG
  allow_failure: true

# =============================================================================
# Deploy Stage
# =============================================================================
.deploy_template: &deploy_template
  stage: deploy
  image:
    name: bitnami/kubectl:latest
    entrypoint: [""]
  before_script:
    - kubectl config set-cluster k8s --server="$KUBE_URL" --insecure-skip-tls-verify=true
    - kubectl config set-credentials admin --token="$KUBE_TOKEN"
    - kubectl config set-context default --cluster=k8s --user=admin --namespace=$KUBE_NAMESPACE
    - kubectl config use-context default
  script:
    - kubectl apply -f k8s/$CI_ENVIRONMENT_NAME/
    - kubectl set image deployment/$CI_PROJECT_NAME $CI_PROJECT_NAME=$IMAGE_TAG
    - kubectl rollout status deployment/$CI_PROJECT_NAME --timeout=300s

deploy_staging:
  <<: *deploy_template
  environment:
    name: staging
    url: https://staging.$CI_PROJECT_NAME.example.com
    on_stop: stop_staging
  needs: [build_docker, trivy_scan]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

deploy_production:
  <<: *deploy_template
  environment:
    name: production
    url: https://$CI_PROJECT_NAME.example.com
  needs: [deploy_staging]
  rules:
    - if: $CI_COMMIT_TAG
      when: manual

stop_staging:
  stage: deploy
  image:
    name: bitnami/kubectl:latest
    entrypoint: [""]
  environment:
    name: staging
    action: stop
  script:
    - kubectl delete deployment $CI_PROJECT_NAME --ignore-not-found
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# =============================================================================
# Review Apps
# =============================================================================
deploy_review:
  stage: deploy
  image:
    name: bitnami/kubectl:latest
    entrypoint: [""]
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG.$CI_PROJECT_NAME.example.com
    on_stop: stop_review
    auto_stop_in: 1 week
  needs: [build_docker]
  script:
    - kubectl create namespace $KUBE_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    - envsubst < k8s/review/deployment.yaml | kubectl apply -f -
    - kubectl rollout status deployment/$CI_PROJECT_NAME -n $KUBE_NAMESPACE --timeout=300s
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

stop_review:
  stage: deploy
  image:
    name: bitnami/kubectl:latest
    entrypoint: [""]
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  script:
    - kubectl delete namespace $KUBE_NAMESPACE --ignore-not-found
  when: manual
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: manual

# =============================================================================
# Cleanup Stage
# =============================================================================
cleanup_images:
  stage: cleanup
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker image prune -af --filter "until=168h"
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
```

## Python Pipeline

```yaml
# .gitlab-ci.yml (Python)
stages:
  - validate
  - test
  - build
  - deploy

variables:
  PYTHON_VERSION: "3.12"
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.pip-cache"

default:
  image: python:${PYTHON_VERSION}-slim

.python_cache: &python_cache
  key:
    files:
      - poetry.lock
  paths:
    - .venv/
    - .pip-cache/

install:
  stage: validate
  cache:
    <<: *python_cache
    policy: push
  script:
    - pip install poetry
    - poetry config virtualenvs.in-project true
    - poetry install --no-interaction

lint:
  stage: validate
  needs: [install]
  cache:
    <<: *python_cache
    policy: pull
  script:
    - pip install poetry
    - poetry run ruff check .
    - poetry run ruff format --check .
    - poetry run mypy src/

test:
  stage: test
  needs: [install]
  cache:
    <<: *python_cache
    policy: pull
  services:
    - postgres:16-alpine
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgresql://test:test@postgres:5432/test
  script:
    - pip install poetry
    - poetry run pytest --cov=src --cov-report=xml
  coverage: '/TOTAL.*\s+(\d+%)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml

build:
  stage: build
  needs: [lint, test]
  cache:
    <<: *python_cache
    policy: pull
  script:
    - pip install poetry
    - poetry build
  artifacts:
    paths:
      - dist/

publish_pypi:
  stage: deploy
  needs: [build]
  script:
    - pip install poetry
    - poetry config pypi-token.pypi $PYPI_TOKEN
    - poetry publish
  rules:
    - if: $CI_COMMIT_TAG
```

## Monorepo Pipeline

```yaml
# .gitlab-ci.yml (Monorepo)
stages:
  - detect
  - build
  - test
  - deploy

variables:
  GIT_DEPTH: 0

detect_changes:
  stage: detect
  image: alpine/git
  script:
    - |
      if [ "$CI_PIPELINE_SOURCE" == "merge_request_event" ]; then
        CHANGED=$(git diff --name-only $CI_MERGE_REQUEST_DIFF_BASE_SHA...$CI_COMMIT_SHA)
      else
        CHANGED=$(git diff --name-only HEAD~1)
      fi

      echo "Changed files:"
      echo "$CHANGED"

      # Detect which packages changed
      echo "$CHANGED" | grep -q "^packages/api/" && echo "API=true" >> changes.env || echo "API=false" >> changes.env
      echo "$CHANGED" | grep -q "^packages/web/" && echo "WEB=true" >> changes.env || echo "WEB=false" >> changes.env
      echo "$CHANGED" | grep -q "^packages/shared/" && echo "SHARED=true" >> changes.env || echo "SHARED=false" >> changes.env
  artifacts:
    reports:
      dotenv: changes.env

.build_template:
  stage: build
  needs: [detect_changes]
  script:
    - cd packages/$PACKAGE_NAME
    - npm ci
    - npm run build
  artifacts:
    paths:
      - packages/$PACKAGE_NAME/dist/

build_api:
  extends: .build_template
  variables:
    PACKAGE_NAME: api
  rules:
    - if: $API == "true" || $SHARED == "true"

build_web:
  extends: .build_template
  variables:
    PACKAGE_NAME: web
  rules:
    - if: $WEB == "true" || $SHARED == "true"

.test_template:
  stage: test
  script:
    - cd packages/$PACKAGE_NAME
    - npm ci
    - npm test

test_api:
  extends: .test_template
  needs: [build_api]
  variables:
    PACKAGE_NAME: api
  rules:
    - if: $API == "true" || $SHARED == "true"

test_web:
  extends: .test_template
  needs: [build_web]
  variables:
    PACKAGE_NAME: web
  rules:
    - if: $WEB == "true" || $SHARED == "true"
```

## CLAUDE.md Integration

```markdown
# GitLab CI/CD

## Commands
- Validate config: `gitlab-ci-lint .gitlab-ci.yml`
- Run locally: `gitlab-runner exec docker test`
- View pipeline: `glab ci view`

## Key Features
- Multi-stage pipelines
- Built-in security scanning (SAST, DAST, Container)
- Review apps with auto cleanup
- Kubernetes integration

## Variables
- `CI_COMMIT_SHA` - Current commit
- `CI_COMMIT_TAG` - Tag name (if tagged)
- `CI_REGISTRY_IMAGE` - Container registry image
- `CI_ENVIRONMENT_NAME` - Deployment environment

## Caching
- Use `key: files:` for lockfile-based caching
- Set `policy: pull` for jobs that only read cache
- Use artifacts for job outputs
```

## AI Suggestions

1. **Add parallel testing** - Split tests across jobs
2. **Implement caching** - Package and Docker layer caching
3. **Add security scanning** - SAST, DAST, container scanning
4. **Configure review apps** - Dynamic environments
5. **Implement canary deployments** - Kubernetes canary
6. **Add rules optimization** - Skip unnecessary jobs
7. **Configure DAG pipelines** - Optimize job dependencies
8. **Add GitLab Pages** - Documentation deployment
9. **Implement Multi-project pipelines** - Cross-project triggers
10. **Add compliance pipelines** - Enforce security standards
