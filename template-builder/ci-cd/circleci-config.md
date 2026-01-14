# CircleCI Configuration Template

> Production-ready CircleCI configurations for continuous integration and deployment

## Overview

This template provides CircleCI configurations with:
- Workflow orchestration
- Reusable commands and executors
- Orbs for common integrations
- Caching and parallelism
- Multi-environment deployments

## Quick Start

```bash
# Install CircleCI CLI
curl -fLSs https://raw.githubusercontent.com/CircleCI-Public/circleci-cli/master/install.sh | bash

# Validate config
circleci config validate

# Run locally
circleci local execute --job build

# Process config (expand orbs)
circleci config process .circleci/config.yml
```

## Complete Configuration

```yaml
# .circleci/config.yml
version: 2.1

# ==============================================================================
# Orbs - Reusable packages
# ==============================================================================
orbs:
  node: circleci/node@5.1.0
  docker: circleci/docker@2.4.0
  aws-cli: circleci/aws-cli@4.1.2
  slack: circleci/slack@4.12.5
  codecov: codecov/codecov@3.3.0

# ==============================================================================
# Parameters - Pipeline configuration
# ==============================================================================
parameters:
  run-integration-tests:
    type: boolean
    default: false
  deploy-environment:
    type: string
    default: ""

# ==============================================================================
# Executors - Execution environments
# ==============================================================================
executors:
  node-executor:
    docker:
      - image: cimg/node:20.10
    working_directory: ~/project
    resource_class: medium

  node-with-browsers:
    docker:
      - image: cimg/node:20.10-browsers
    working_directory: ~/project
    resource_class: large

  node-with-db:
    docker:
      - image: cimg/node:20.10
      - image: cimg/postgres:15.4
        environment:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
      - image: cimg/redis:7.2
    working_directory: ~/project
    resource_class: medium

  machine-executor:
    machine:
      image: ubuntu-2204:current
    resource_class: medium

# ==============================================================================
# Commands - Reusable command sequences
# ==============================================================================
commands:
  install-dependencies:
    description: Install project dependencies with caching
    parameters:
      cache-version:
        type: string
        default: v1
    steps:
      - restore_cache:
          keys:
            - deps-<< parameters.cache-version >>-{{ checksum "package-lock.json" }}
            - deps-<< parameters.cache-version >>-
      - run:
          name: Install dependencies
          command: npm ci
      - save_cache:
          key: deps-<< parameters.cache-version >>-{{ checksum "package-lock.json" }}
          paths:
            - node_modules
            - ~/.npm

  setup-remote-docker:
    description: Setup remote Docker with layer caching
    steps:
      - setup_remote_docker:
          version: docker24
          docker_layer_caching: true

  notify-slack:
    description: Send Slack notification
    parameters:
      event:
        type: string
        default: fail
    steps:
      - slack/notify:
          event: << parameters.event >>
          template: basic_fail_1

  wait-for-db:
    description: Wait for database to be ready
    steps:
      - run:
          name: Wait for PostgreSQL
          command: |
            for i in $(seq 1 30); do
              nc -z localhost 5432 && echo "PostgreSQL is up" && exit 0
              echo "Waiting for PostgreSQL..."
              sleep 1
            done
            echo "PostgreSQL did not start in time"
            exit 1

  run-tests-with-coverage:
    description: Run tests with coverage reporting
    parameters:
      test-command:
        type: string
        default: npm test -- --coverage
    steps:
      - run:
          name: Run tests
          command: << parameters.test-command >>
          environment:
            JEST_JUNIT_OUTPUT_DIR: ./reports/junit
      - store_test_results:
          path: ./reports/junit
      - store_artifacts:
          path: ./coverage
          destination: coverage
      - codecov/upload:
          file: ./coverage/lcov.info

# ==============================================================================
# Jobs
# ==============================================================================
jobs:
  checkout-code:
    executor: node-executor
    steps:
      - checkout
      - persist_to_workspace:
          root: .
          paths:
            - .

  install:
    executor: node-executor
    steps:
      - attach_workspace:
          at: .
      - install-dependencies
      - persist_to_workspace:
          root: .
          paths:
            - node_modules

  lint:
    executor: node-executor
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Run ESLint
          command: npm run lint -- --format junit --output-file reports/eslint.xml
      - store_test_results:
          path: reports

  typecheck:
    executor: node-executor
    steps:
      - attach_workspace:
          at: .
      - run:
          name: TypeScript check
          command: npm run typecheck

  test:
    executor: node-executor
    parallelism: 4
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Run tests
          command: |
            TEST_FILES=$(circleci tests glob "src/**/*.test.ts" | circleci tests split --split-by=timings)
            npm test -- $TEST_FILES --coverage --reporters=default --reporters=jest-junit
          environment:
            JEST_JUNIT_OUTPUT_DIR: ./reports/junit
      - store_test_results:
          path: ./reports/junit
      - store_artifacts:
          path: ./coverage
      - codecov/upload:
          file: ./coverage/lcov.info

  test-integration:
    executor: node-with-db
    steps:
      - attach_workspace:
          at: .
      - wait-for-db
      - run:
          name: Run database migrations
          command: npm run db:migrate
          environment:
            DATABASE_URL: postgres://test:test@localhost:5432/test_db
      - run:
          name: Run integration tests
          command: npm run test:integration
          environment:
            DATABASE_URL: postgres://test:test@localhost:5432/test_db
            REDIS_URL: redis://localhost:6379
      - store_test_results:
          path: ./reports/junit

  test-e2e:
    executor: node-with-browsers
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Build application
          command: npm run build
      - run:
          name: Run E2E tests
          command: npm run test:e2e
      - store_artifacts:
          path: ./playwright-report
          destination: playwright-report
      - store_test_results:
          path: ./playwright-report

  security-scan:
    executor: node-executor
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Run npm audit
          command: npm audit --audit-level=high
      - run:
          name: Run Snyk scan
          command: |
            npm install -g snyk
            snyk test --severity-threshold=high || true
          environment:
            SNYK_TOKEN: ${SNYK_TOKEN}

  build:
    executor: node-executor
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Build application
          command: npm run build
      - store_artifacts:
          path: ./dist
          destination: dist
      - persist_to_workspace:
          root: .
          paths:
            - dist

  build-docker:
    executor: machine-executor
    parameters:
      image-name:
        type: string
        default: myapp
      registry:
        type: string
        default: ghcr.io/myorg
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Build Docker image
          command: |
            docker build \
              --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
              --build-arg VCS_REF=${CIRCLE_SHA1} \
              --build-arg VERSION=${CIRCLE_TAG:-${CIRCLE_SHA1:0:7}} \
              -t << parameters.registry >>/<< parameters.image-name >>:${CIRCLE_SHA1:0:7} \
              -t << parameters.registry >>/<< parameters.image-name >>:latest \
              .
      - run:
          name: Save Docker image
          command: |
            mkdir -p docker-cache
            docker save -o docker-cache/image.tar << parameters.registry >>/<< parameters.image-name >>:${CIRCLE_SHA1:0:7}
      - persist_to_workspace:
          root: .
          paths:
            - docker-cache

  push-docker:
    executor: machine-executor
    parameters:
      registry:
        type: string
        default: ghcr.io
      image-name:
        type: string
        default: myorg/myapp
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Load Docker image
          command: docker load -i docker-cache/image.tar
      - run:
          name: Push to registry
          command: |
            echo ${GITHUB_TOKEN} | docker login << parameters.registry >> -u ${GITHUB_USERNAME} --password-stdin
            docker push << parameters.registry >>/<< parameters.image-name >>:${CIRCLE_SHA1:0:7}
            if [ -n "${CIRCLE_TAG}" ]; then
              docker tag << parameters.registry >>/<< parameters.image-name >>:${CIRCLE_SHA1:0:7} << parameters.registry >>/<< parameters.image-name >>:${CIRCLE_TAG}
              docker push << parameters.registry >>/<< parameters.image-name >>:${CIRCLE_TAG}
            fi

  deploy:
    executor: node-executor
    parameters:
      environment:
        type: string
    steps:
      - attach_workspace:
          at: .
      - aws-cli/setup:
          role_arn: arn:aws:iam::${AWS_ACCOUNT_ID}:role/circleci-deploy
      - run:
          name: Deploy to << parameters.environment >>
          command: |
            if [ "<< parameters.environment >>" == "production" ]; then
              aws eks update-kubeconfig --name production-cluster --region us-east-1
            else
              aws eks update-kubeconfig --name staging-cluster --region us-east-1
            fi
            kubectl set image deployment/myapp myapp=ghcr.io/myorg/myapp:${CIRCLE_SHA1:0:7}
            kubectl rollout status deployment/myapp --timeout=300s
      - notify-slack:
          event: pass

  release:
    executor: node-executor
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Configure Git
          command: |
            git config user.email "ci@example.com"
            git config user.name "CircleCI"
      - run:
          name: Run semantic release
          command: npx semantic-release
          environment:
            GITHUB_TOKEN: ${GITHUB_TOKEN}
            NPM_TOKEN: ${NPM_TOKEN}

# ==============================================================================
# Workflows
# ==============================================================================
workflows:
  version: 2

  # Main CI workflow
  ci:
    jobs:
      - checkout-code

      - install:
          requires:
            - checkout-code

      - lint:
          requires:
            - install

      - typecheck:
          requires:
            - install

      - test:
          requires:
            - install

      - security-scan:
          requires:
            - install
          context: security

      - build:
          requires:
            - lint
            - typecheck
            - test

      - build-docker:
          requires:
            - build
          filters:
            branches:
              only:
                - main
                - develop

      - push-docker:
          requires:
            - build-docker
          context: docker-registry
          filters:
            branches:
              only:
                - main
                - develop

      - deploy:
          name: deploy-staging
          environment: staging
          requires:
            - push-docker
          context: aws-staging
          filters:
            branches:
              only: develop

      - hold-production:
          type: approval
          requires:
            - push-docker
          filters:
            branches:
              only: main

      - deploy:
          name: deploy-production
          environment: production
          requires:
            - hold-production
          context: aws-production
          filters:
            branches:
              only: main

  # Integration tests (triggered manually or by API)
  integration:
    when: << pipeline.parameters.run-integration-tests >>
    jobs:
      - checkout-code
      - install:
          requires:
            - checkout-code
      - test-integration:
          requires:
            - install
          context: integration-test

  # E2E tests (nightly)
  nightly-e2e:
    triggers:
      - schedule:
          cron: "0 2 * * *"
          filters:
            branches:
              only: main
    jobs:
      - checkout-code
      - install:
          requires:
            - checkout-code
      - build:
          requires:
            - install
      - test-e2e:
          requires:
            - build

  # Release workflow (tags only)
  release:
    jobs:
      - checkout-code:
          filters:
            tags:
              only: /^v.*/
            branches:
              ignore: /.*/

      - install:
          requires:
            - checkout-code
          filters:
            tags:
              only: /^v.*/

      - build:
          requires:
            - install
          filters:
            tags:
              only: /^v.*/

      - build-docker:
          requires:
            - build
          filters:
            tags:
              only: /^v.*/

      - push-docker:
          requires:
            - build-docker
          context: docker-registry
          filters:
            tags:
              only: /^v.*/

      - release:
          requires:
            - push-docker
          context: release
          filters:
            tags:
              only: /^v.*/
```

## Monorepo Configuration

```yaml
# .circleci/config.yml (Monorepo)
version: 2.1

parameters:
  api:
    type: boolean
    default: false
  web:
    type: boolean
    default: false
  shared:
    type: boolean
    default: false

executors:
  default:
    docker:
      - image: cimg/node:20.10

jobs:
  detect-changes:
    executor: default
    steps:
      - checkout
      - run:
          name: Detect changed packages
          command: |
            BASE_REVISION=${CIRCLE_MERGE_BASE:-origin/main}

            API_CHANGED=$(git diff --name-only $BASE_REVISION...HEAD | grep -q "^packages/api/" && echo true || echo false)
            WEB_CHANGED=$(git diff --name-only $BASE_REVISION...HEAD | grep -q "^packages/web/" && echo true || echo false)
            SHARED_CHANGED=$(git diff --name-only $BASE_REVISION...HEAD | grep -q "^packages/shared/" && echo true || echo false)

            echo "API changed: $API_CHANGED"
            echo "Web changed: $WEB_CHANGED"
            echo "Shared changed: $SHARED_CHANGED"

            # Trigger workflows via API
            if [ "$API_CHANGED" == "true" ] || [ "$SHARED_CHANGED" == "true" ]; then
              curl -X POST "https://circleci.com/api/v2/project/gh/myorg/myrepo/pipeline" \
                -H "Circle-Token: ${CIRCLE_TOKEN}" \
                -H "Content-Type: application/json" \
                -d '{"parameters": {"api": true}}'
            fi

  build-api:
    executor: default
    working_directory: ~/project/packages/api
    steps:
      - checkout:
          path: ~/project
      - restore_cache:
          keys:
            - api-deps-{{ checksum "package-lock.json" }}
      - run: npm ci
      - save_cache:
          key: api-deps-{{ checksum "package-lock.json" }}
          paths:
            - node_modules
      - run: npm test
      - run: npm run build

  build-web:
    executor: default
    working_directory: ~/project/packages/web
    steps:
      - checkout:
          path: ~/project
      - restore_cache:
          keys:
            - web-deps-{{ checksum "package-lock.json" }}
      - run: npm ci
      - save_cache:
          key: web-deps-{{ checksum "package-lock.json" }}
          paths:
            - node_modules
      - run: npm test
      - run: npm run build

workflows:
  detect:
    jobs:
      - detect-changes:
          filters:
            branches:
              ignore: main

  api:
    when: << pipeline.parameters.api >>
    jobs:
      - build-api

  web:
    when: << pipeline.parameters.web >>
    jobs:
      - build-web
```

## Matrix Builds

```yaml
# .circleci/config.yml (Matrix)
version: 2.1

parameters:
  node-version:
    type: string
    default: "20"

jobs:
  test:
    parameters:
      node-version:
        type: string
      os:
        type: string
    docker:
      - image: cimg/node:<< parameters.node-version >>
    steps:
      - checkout
      - run: npm ci
      - run: npm test

workflows:
  test-matrix:
    jobs:
      - test:
          matrix:
            parameters:
              node-version: ["18", "20", "21"]
              os: ["linux"]
          name: test-node-<< matrix.node-version >>
```

## Custom Orb

```yaml
# .circleci/orbs/deploy-orb.yml
version: 2.1

description: Custom deployment orb

executors:
  deployer:
    docker:
      - image: cimg/base:current
    resource_class: small

commands:
  deploy-to-k8s:
    description: Deploy to Kubernetes
    parameters:
      cluster:
        type: string
      namespace:
        type: string
      deployment:
        type: string
      image:
        type: string
    steps:
      - run:
          name: Configure kubectl
          command: |
            aws eks update-kubeconfig --name << parameters.cluster >> --region ${AWS_REGION}
      - run:
          name: Deploy
          command: |
            kubectl -n << parameters.namespace >> set image deployment/<< parameters.deployment >> app=<< parameters.image >>
            kubectl -n << parameters.namespace >> rollout status deployment/<< parameters.deployment >> --timeout=300s

jobs:
  deploy:
    executor: deployer
    parameters:
      environment:
        type: string
    steps:
      - checkout
      - deploy-to-k8s:
          cluster: ${<< parameters.environment >>_CLUSTER}
          namespace: << parameters.environment >>
          deployment: myapp
          image: ghcr.io/myorg/myapp:${CIRCLE_SHA1:0:7}
```

## Dynamic Configuration

```yaml
# .circleci/config.yml (Dynamic with setup workflow)
version: 2.1

setup: true

orbs:
  continuation: circleci/continuation@0.4.0
  path-filtering: circleci/path-filtering@0.1.3

workflows:
  setup:
    jobs:
      - path-filtering/filter:
          base-revision: main
          config-path: .circleci/continue-config.yml
          mapping: |
            packages/api/.* api true
            packages/web/.* web true
            packages/shared/.* shared true
            .circleci/.* ci true
```

```yaml
# .circleci/continue-config.yml
version: 2.1

parameters:
  api:
    type: boolean
    default: false
  web:
    type: boolean
    default: false
  shared:
    type: boolean
    default: false
  ci:
    type: boolean
    default: false

jobs:
  build-api:
    docker:
      - image: cimg/node:20.10
    steps:
      - checkout
      - run: cd packages/api && npm ci && npm run build && npm test

  build-web:
    docker:
      - image: cimg/node:20.10
    steps:
      - checkout
      - run: cd packages/web && npm ci && npm run build && npm test

workflows:
  api:
    when:
      or:
        - << pipeline.parameters.api >>
        - << pipeline.parameters.shared >>
    jobs:
      - build-api

  web:
    when:
      or:
        - << pipeline.parameters.web >>
        - << pipeline.parameters.shared >>
    jobs:
      - build-web
```

## CLAUDE.md Integration

```markdown
# CircleCI Configuration

## Commands
- `circleci config validate` - Validate configuration
- `circleci local execute --job <job>` - Run job locally
- `circleci config process .circleci/config.yml` - Expand orbs
- `circleci orb validate orb.yml` - Validate orb

## Key Concepts
- **Executors**: Reusable execution environments
- **Commands**: Reusable step sequences
- **Orbs**: Shareable configuration packages
- **Workflows**: Job orchestration

## Caching
- `save_cache`/`restore_cache` for dependencies
- Docker layer caching with `docker_layer_caching: true`
- Workspace persistence with `persist_to_workspace`

## Parallelism
- `parallelism: N` for test splitting
- `circleci tests split --split-by=timings`
- Matrix builds with `matrix.parameters`
```

## AI Suggestions

1. **Configure test splitting** - Use parallelism for faster tests
2. **Add caching strategy** - Cache dependencies and build artifacts
3. **Implement orbs** - Use and create reusable orbs
4. **Configure contexts** - Manage secrets with contexts
5. **Add approval gates** - Manual approval for production
6. **Implement dynamic config** - Path-based filtering
7. **Configure resource classes** - Right-size executors
8. **Add scheduled workflows** - Nightly builds and tests
9. **Implement matrix builds** - Multi-version testing
10. **Configure Slack notifications** - Build status alerts
