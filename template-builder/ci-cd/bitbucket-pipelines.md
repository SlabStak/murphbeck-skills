# Bitbucket Pipelines Configuration Template

> Production-ready Bitbucket Pipelines configurations for CI/CD

## Overview

This template provides Bitbucket Pipelines configurations with:
- Multi-stage pipelines
- Parallel steps
- Deployment environments
- Caching and artifacts
- Self-hosted runners

## Quick Start

```bash
# Create bitbucket-pipelines.yml in repository root
# Push to trigger pipeline

# Validate pipeline locally
pip install bitbucket-pipes
bitbucket-pipes validate bitbucket-pipelines.yml

# Check pipeline status
curl -u username:app_password \
  https://api.bitbucket.org/2.0/repositories/workspace/repo/pipelines/
```

## Complete Configuration

```yaml
# bitbucket-pipelines.yml
image: node:20

definitions:
  # ===========================================================================
  # Caches
  # ===========================================================================
  caches:
    npm: ~/.npm
    node: node_modules
    pip: ~/.cache/pip
    docker: /var/lib/docker

  # ===========================================================================
  # Services
  # ===========================================================================
  services:
    docker:
      memory: 2048
    postgres:
      image: postgres:15
      variables:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: test_db
    redis:
      image: redis:7

  # ===========================================================================
  # YAML Anchors (Reusable Steps)
  # ===========================================================================
  steps:
    - step: &install-dependencies
        name: Install Dependencies
        caches:
          - npm
          - node
        script:
          - npm ci

    - step: &lint
        name: Lint
        caches:
          - node
        script:
          - npm run lint

    - step: &typecheck
        name: TypeScript Check
        caches:
          - node
        script:
          - npm run typecheck

    - step: &unit-tests
        name: Unit Tests
        caches:
          - node
        script:
          - npm test -- --coverage --ci
        artifacts:
          - coverage/**

    - step: &integration-tests
        name: Integration Tests
        caches:
          - node
        services:
          - postgres
          - redis
        script:
          - npm run test:integration
        artifacts:
          - test-results/**

    - step: &build
        name: Build
        caches:
          - node
        script:
          - npm run build
        artifacts:
          - dist/**

    - step: &security-scan
        name: Security Scan
        caches:
          - node
        script:
          - npm audit --audit-level=high
          - pipe: snyk/snyk-scan:1.0.0
            variables:
              SNYK_TOKEN: $SNYK_TOKEN
              LANGUAGE: "npm"
              SEVERITY_THRESHOLD: "high"

    - step: &build-docker
        name: Build Docker Image
        services:
          - docker
        caches:
          - docker
        script:
          - export IMAGE_NAME=$DOCKER_REGISTRY/$BITBUCKET_REPO_SLUG
          - export IMAGE_TAG=$BITBUCKET_COMMIT
          - docker build -t $IMAGE_NAME:$IMAGE_TAG -t $IMAGE_NAME:latest .
          - docker save $IMAGE_NAME:$IMAGE_TAG > image.tar
        artifacts:
          - image.tar

    - step: &push-docker
        name: Push Docker Image
        services:
          - docker
        script:
          - docker load < image.tar
          - echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin $DOCKER_REGISTRY
          - export IMAGE_NAME=$DOCKER_REGISTRY/$BITBUCKET_REPO_SLUG
          - docker push $IMAGE_NAME:$BITBUCKET_COMMIT
          - docker push $IMAGE_NAME:latest

    - step: &deploy-staging
        name: Deploy to Staging
        deployment: staging
        script:
          - pipe: atlassian/aws-eks-kubectl-run:2.4.0
            variables:
              AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
              AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
              AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION
              CLUSTER_NAME: "staging-cluster"
              KUBECTL_COMMAND: "set image deployment/myapp myapp=$DOCKER_REGISTRY/$BITBUCKET_REPO_SLUG:$BITBUCKET_COMMIT"
          - pipe: atlassian/aws-eks-kubectl-run:2.4.0
            variables:
              AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
              AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
              AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION
              CLUSTER_NAME: "staging-cluster"
              KUBECTL_COMMAND: "rollout status deployment/myapp --timeout=300s"

    - step: &deploy-production
        name: Deploy to Production
        deployment: production
        trigger: manual
        script:
          - pipe: atlassian/aws-eks-kubectl-run:2.4.0
            variables:
              AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
              AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
              AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION
              CLUSTER_NAME: "production-cluster"
              KUBECTL_COMMAND: "set image deployment/myapp myapp=$DOCKER_REGISTRY/$BITBUCKET_REPO_SLUG:$BITBUCKET_COMMIT"
          - pipe: atlassian/aws-eks-kubectl-run:2.4.0
            variables:
              AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
              AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
              AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION
              CLUSTER_NAME: "production-cluster"
              KUBECTL_COMMAND: "rollout status deployment/myapp --timeout=300s"

# =============================================================================
# Pipelines
# =============================================================================
pipelines:
  # Default pipeline for all branches
  default:
    - step: *install-dependencies
    - parallel:
        - step: *lint
        - step: *typecheck
        - step: *unit-tests
    - step: *build

  # Branch-specific pipelines
  branches:
    main:
      - step: *install-dependencies
      - parallel:
          - step: *lint
          - step: *typecheck
          - step: *unit-tests
          - step: *security-scan
      - step: *build
      - step: *integration-tests
      - step: *build-docker
      - step: *push-docker
      - step: *deploy-staging
      - step: *deploy-production

    develop:
      - step: *install-dependencies
      - parallel:
          - step: *lint
          - step: *typecheck
          - step: *unit-tests
      - step: *build
      - step: *build-docker
      - step: *push-docker
      - step: *deploy-staging

    feature/*:
      - step: *install-dependencies
      - parallel:
          - step: *lint
          - step: *typecheck
          - step: *unit-tests
      - step: *build

    hotfix/*:
      - step: *install-dependencies
      - parallel:
          - step: *lint
          - step: *unit-tests
      - step: *build
      - step: *build-docker
      - step: *push-docker
      - step:
          name: Deploy Hotfix
          deployment: production
          trigger: manual
          script:
            - echo "Deploying hotfix..."

  # Pull request pipelines
  pull-requests:
    '**':
      - step: *install-dependencies
      - parallel:
          - step: *lint
          - step: *typecheck
          - step: *unit-tests
      - step: *build
      - step:
          name: Preview Deployment
          deployment: preview
          script:
            - echo "Deploying preview for PR-$BITBUCKET_PR_ID"
            - pipe: atlassian/aws-s3-deploy:1.1.0
              variables:
                AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
                AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
                AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION
                S3_BUCKET: 'preview-bucket'
                LOCAL_PATH: 'dist'
                ACL: 'public-read'

  # Tag pipelines
  tags:
    v*:
      - step: *install-dependencies
      - parallel:
          - step: *lint
          - step: *typecheck
          - step: *unit-tests
          - step: *security-scan
      - step: *build
      - step: *integration-tests
      - step:
          name: Build Release Image
          services:
            - docker
          script:
            - export IMAGE_NAME=$DOCKER_REGISTRY/$BITBUCKET_REPO_SLUG
            - docker build -t $IMAGE_NAME:$BITBUCKET_TAG -t $IMAGE_NAME:latest .
            - echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin $DOCKER_REGISTRY
            - docker push $IMAGE_NAME:$BITBUCKET_TAG
            - docker push $IMAGE_NAME:latest
      - step:
          name: Create Release
          script:
            - pipe: atlassian/github-release:0.1.0
              variables:
                GITHUB_TOKEN: $GITHUB_TOKEN
                TAG: $BITBUCKET_TAG
                TITLE: "Release $BITBUCKET_TAG"

  # Custom pipelines (triggered manually or via API)
  custom:
    deploy-to-staging:
      - step: *build-docker
      - step: *push-docker
      - step: *deploy-staging

    deploy-to-production:
      - step: *deploy-production

    full-test:
      - step: *install-dependencies
      - parallel:
          - step: *lint
          - step: *typecheck
          - step: *unit-tests
          - step: *security-scan
      - step: *build
      - step: *integration-tests
      - step:
          name: E2E Tests
          caches:
            - node
          script:
            - npm run test:e2e
          artifacts:
            - playwright-report/**

    rollback:
      - variables:
          - name: VERSION
            default: "latest"
      - step:
          name: Rollback Production
          deployment: production
          script:
            - pipe: atlassian/aws-eks-kubectl-run:2.4.0
              variables:
                AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
                AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
                AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION
                CLUSTER_NAME: "production-cluster"
                KUBECTL_COMMAND: "rollout undo deployment/myapp"

  # Scheduled pipelines
  schedules:
    - cron: '0 2 * * *'
      pipeline:
        - step: *install-dependencies
        - parallel:
            - step: *lint
            - step: *unit-tests
            - step: *security-scan
        - step: *build
        - step:
            name: Nightly E2E Tests
            script:
              - npm run test:e2e
            artifacts:
              - playwright-report/**
```

## Monorepo Configuration

```yaml
# bitbucket-pipelines.yml (Monorepo)
image: node:20

definitions:
  caches:
    npm: ~/.npm

  steps:
    - step: &detect-changes
        name: Detect Changes
        script:
          - |
            API_CHANGED=$(git diff --name-only origin/main...HEAD | grep -q "^packages/api/" && echo "true" || echo "false")
            WEB_CHANGED=$(git diff --name-only origin/main...HEAD | grep -q "^packages/web/" && echo "true" || echo "false")
            echo "API_CHANGED=$API_CHANGED" >> changes.env
            echo "WEB_CHANGED=$WEB_CHANGED" >> changes.env
        artifacts:
          - changes.env

pipelines:
  default:
    - step: *detect-changes
    - parallel:
        - step:
            name: Build API
            condition:
              changesets:
                includePaths:
                  - "packages/api/**"
            script:
              - cd packages/api
              - npm ci
              - npm test
              - npm run build

        - step:
            name: Build Web
            condition:
              changesets:
                includePaths:
                  - "packages/web/**"
            script:
              - cd packages/web
              - npm ci
              - npm test
              - npm run build

        - step:
            name: Build Shared
            condition:
              changesets:
                includePaths:
                  - "packages/shared/**"
            script:
              - cd packages/shared
              - npm ci
              - npm test
              - npm run build
```

## Matrix Builds

```yaml
# bitbucket-pipelines.yml (Matrix)
pipelines:
  default:
    - parallel:
        - step:
            name: Test Node 18
            image: node:18
            script:
              - npm ci
              - npm test

        - step:
            name: Test Node 20
            image: node:20
            script:
              - npm ci
              - npm test

        - step:
            name: Test Node 21
            image: node:21
            script:
              - npm ci
              - npm test
```

## Self-Hosted Runners

```yaml
# bitbucket-pipelines.yml (Self-hosted)
pipelines:
  default:
    - step:
        name: Build on Self-hosted
        runs-on:
          - self.hosted
          - linux.shell
        script:
          - npm ci
          - npm run build

  branches:
    main:
      - step:
          name: Deploy
          runs-on:
            - self.hosted
            - production
          deployment: production
          script:
            - ./deploy.sh
```

## Common Pipes

```yaml
# bitbucket-pipelines.yml (Pipes)
image: node:20

pipelines:
  default:
    - step:
        name: Build
        script:
          - npm ci
          - npm run build
        artifacts:
          - dist/**

    - step:
        name: Deploy to S3
        script:
          - pipe: atlassian/aws-s3-deploy:1.1.0
            variables:
              AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
              AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
              AWS_DEFAULT_REGION: 'us-east-1'
              S3_BUCKET: 'my-bucket'
              LOCAL_PATH: 'dist'
              ACL: 'public-read'

    - step:
        name: Invalidate CloudFront
        script:
          - pipe: atlassian/aws-cloudfront-invalidate:0.6.0
            variables:
              AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
              AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
              AWS_DEFAULT_REGION: 'us-east-1'
              DISTRIBUTION_ID: $CLOUDFRONT_DISTRIBUTION_ID

    - step:
        name: Send Slack Notification
        script:
          - pipe: atlassian/slack-notify:2.1.0
            variables:
              WEBHOOK_URL: $SLACK_WEBHOOK_URL
              MESSAGE: 'Deployment completed successfully!'

    - step:
        name: Trigger Webhook
        script:
          - pipe: atlassian/trigger-pipeline:4.4.0
            variables:
              BITBUCKET_USERNAME: $BITBUCKET_USERNAME
              BITBUCKET_APP_PASSWORD: $BITBUCKET_APP_PASSWORD
              REPOSITORY: 'other-repo'
              REF_TYPE: 'branch'
              REF_NAME: 'main'
```

## CLAUDE.md Integration

```markdown
# Bitbucket Pipelines

## Commands
- Push to trigger default pipeline
- Manual triggers via Pipelines UI
- API: `POST /2.0/repositories/{workspace}/{repo_slug}/pipelines/`

## Key Concepts
- **Steps**: Individual tasks
- **Parallel**: Concurrent execution
- **Pipes**: Reusable integrations
- **Artifacts**: Shared files between steps

## Deployments
- `deployment: staging` - Environment tracking
- `trigger: manual` - Require manual trigger
- Deployment variables per environment

## Caching
- Named caches in definitions
- `caches:` in step configuration
- Docker layer caching with service

## Runners
- Cloud runners (default)
- Self-hosted: `runs-on: [self.hosted, label]`
```

## AI Suggestions

1. **Configure caching** - Cache npm and Docker layers
2. **Use parallel steps** - Run independent jobs concurrently
3. **Implement pipes** - Use Atlassian pipes for common tasks
4. **Configure deployments** - Track deployments per environment
5. **Add custom pipelines** - Manual triggers for specific tasks
6. **Implement branch patterns** - Different pipelines per branch
7. **Configure self-hosted runners** - For specific requirements
8. **Add scheduled pipelines** - Nightly builds and security scans
9. **Use artifacts** - Share files between steps
10. **Implement PR pipelines** - Preview deployments for PRs
