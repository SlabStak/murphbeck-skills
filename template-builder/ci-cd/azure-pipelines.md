# Azure Pipelines Configuration Template

> Production-ready Azure DevOps pipeline configurations for CI/CD

## Overview

This template provides Azure Pipelines configurations with:
- Multi-stage pipelines
- Template reuse
- Variable groups and environments
- Container jobs and services
- Deployment strategies

## Quick Start

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure DevOps
az devops login --organization https://dev.azure.com/myorg

# Create pipeline
az pipelines create --name "my-pipeline" --yml-path azure-pipelines.yml

# Run pipeline
az pipelines run --name "my-pipeline"
```

## Complete Configuration

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop
      - feature/*
    exclude:
      - feature/experimental/*
  paths:
    include:
      - src/**
      - package.json
    exclude:
      - docs/**
      - '*.md'
  tags:
    include:
      - v*

pr:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - src/**

schedules:
  - cron: '0 2 * * *'
    displayName: 'Nightly build'
    branches:
      include:
        - main
    always: true

# ==============================================================================
# Variables
# ==============================================================================
variables:
  - group: common-variables
  - name: nodeVersion
    value: '20.x'
  - name: npmCache
    value: $(Pipeline.Workspace)/.npm
  - name: isMain
    value: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]
  - name: isTag
    value: $[startsWith(variables['Build.SourceBranch'], 'refs/tags/')]
  - name: imageTag
    value: $(Build.BuildNumber)

# ==============================================================================
# Resources
# ==============================================================================
resources:
  repositories:
    - repository: templates
      type: git
      name: DevOps/pipeline-templates
      ref: refs/heads/main

  containers:
    - container: node
      image: node:20-alpine
    - container: postgres
      image: postgres:15
      env:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: test_db

  pipelines:
    - pipeline: build
      source: 'Build Pipeline'
      trigger:
        branches:
          include:
            - main

# ==============================================================================
# Stages
# ==============================================================================
stages:
  # ============================================================================
  # Build Stage
  # ============================================================================
  - stage: Build
    displayName: 'Build & Test'
    jobs:
      - job: Build
        displayName: 'Build Application'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            displayName: 'Install Node.js'
            inputs:
              versionSpec: $(nodeVersion)

          - task: Cache@2
            displayName: 'Cache npm packages'
            inputs:
              key: 'npm | "$(Agent.OS)" | package-lock.json'
              restoreKeys: |
                npm | "$(Agent.OS)"
              path: $(npmCache)

          - script: npm ci --cache $(npmCache)
            displayName: 'Install dependencies'

          - script: npm run lint
            displayName: 'Run linting'

          - script: npm run typecheck
            displayName: 'TypeScript check'

          - script: npm run build
            displayName: 'Build application'

          - task: PublishPipelineArtifact@1
            displayName: 'Publish build artifacts'
            inputs:
              targetPath: $(Build.SourcesDirectory)/dist
              artifact: 'dist'
              publishLocation: 'pipeline'

      - job: Test
        displayName: 'Run Tests'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)

          - task: Cache@2
            inputs:
              key: 'npm | "$(Agent.OS)" | package-lock.json'
              path: $(npmCache)

          - script: npm ci --cache $(npmCache)
            displayName: 'Install dependencies'

          - script: npm test -- --coverage --ci --reporters=default --reporters=jest-junit
            displayName: 'Run unit tests'
            env:
              JEST_JUNIT_OUTPUT_DIR: $(Build.SourcesDirectory)/test-results

          - task: PublishTestResults@2
            displayName: 'Publish test results'
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/test-results/*.xml'
              mergeTestResults: true

          - task: PublishCodeCoverageResults@1
            displayName: 'Publish coverage'
            inputs:
              codeCoverageTool: 'Cobertura'
              summaryFileLocation: '$(Build.SourcesDirectory)/coverage/cobertura-coverage.xml'

      - job: IntegrationTest
        displayName: 'Integration Tests'
        pool:
          vmImage: 'ubuntu-latest'
        services:
          postgres: postgres
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm run db:migrate
            displayName: 'Run migrations'
            env:
              DATABASE_URL: postgres://test:test@postgres:5432/test_db

          - script: npm run test:integration
            displayName: 'Run integration tests'
            env:
              DATABASE_URL: postgres://test:test@postgres:5432/test_db

      - job: SecurityScan
        displayName: 'Security Scanning'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm audit --audit-level=high
            displayName: 'npm audit'
            continueOnError: true

          - task: SnykSecurityScan@1
            displayName: 'Snyk scan'
            inputs:
              serviceConnectionEndpoint: 'snyk-connection'
              testType: 'app'
              severityThreshold: 'high'
            continueOnError: true

  # ============================================================================
  # Docker Build Stage
  # ============================================================================
  - stage: Docker
    displayName: 'Build Docker Image'
    dependsOn: Build
    condition: and(succeeded(), or(eq(variables.isMain, true), eq(variables.isTag, true)))
    jobs:
      - job: BuildImage
        displayName: 'Build & Push Docker Image'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: DownloadPipelineArtifact@2
            inputs:
              artifact: 'dist'
              path: $(Build.SourcesDirectory)/dist

          - task: Docker@2
            displayName: 'Build image'
            inputs:
              containerRegistry: 'acr-connection'
              repository: 'myapp'
              command: 'build'
              Dockerfile: '**/Dockerfile'
              tags: |
                $(imageTag)
                latest

          - task: Docker@2
            displayName: 'Push image'
            inputs:
              containerRegistry: 'acr-connection'
              repository: 'myapp'
              command: 'push'
              tags: |
                $(imageTag)
                latest

          - task: AquaSecScanner@4
            displayName: 'Trivy scan'
            inputs:
              image: 'myregistry.azurecr.io/myapp:$(imageTag)'
              severityThreshold: 'HIGH'
            continueOnError: true

  # ============================================================================
  # Deploy to Staging
  # ============================================================================
  - stage: DeployStaging
    displayName: 'Deploy to Staging'
    dependsOn: Docker
    condition: and(succeeded(), eq(variables.isMain, true))
    jobs:
      - deployment: DeployStaging
        displayName: 'Deploy to Staging'
        pool:
          vmImage: 'ubuntu-latest'
        environment: 'staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: KubernetesManifest@0
                  displayName: 'Deploy to AKS'
                  inputs:
                    action: 'deploy'
                    kubernetesServiceConnection: 'aks-staging'
                    namespace: 'staging'
                    manifests: |
                      $(Pipeline.Workspace)/k8s/deployment.yaml
                      $(Pipeline.Workspace)/k8s/service.yaml
                    containers: 'myregistry.azurecr.io/myapp:$(imageTag)'

                - task: Kubernetes@1
                  displayName: 'Verify deployment'
                  inputs:
                    connectionType: 'Kubernetes Service Connection'
                    kubernetesServiceEndpoint: 'aks-staging'
                    namespace: 'staging'
                    command: 'rollout'
                    arguments: 'status deployment/myapp --timeout=300s'

  # ============================================================================
  # Deploy to Production
  # ============================================================================
  - stage: DeployProduction
    displayName: 'Deploy to Production'
    dependsOn: DeployStaging
    condition: and(succeeded(), eq(variables.isMain, true))
    jobs:
      - deployment: DeployProduction
        displayName: 'Deploy to Production'
        pool:
          vmImage: 'ubuntu-latest'
        environment: 'production'
        strategy:
          canary:
            increments: [10, 50]
            preDeploy:
              steps:
                - script: echo "Preparing canary deployment"
            deploy:
              steps:
                - task: KubernetesManifest@0
                  displayName: 'Deploy canary'
                  inputs:
                    action: 'deploy'
                    kubernetesServiceConnection: 'aks-production'
                    namespace: 'production'
                    strategy: 'canary'
                    percentage: $(strategy.increment)
                    manifests: |
                      $(Pipeline.Workspace)/k8s/deployment.yaml
                    containers: 'myregistry.azurecr.io/myapp:$(imageTag)'
            postRouteTraffic:
              steps:
                - script: |
                    echo "Running smoke tests"
                    curl -f https://myapp.example.com/health || exit 1
            on:
              failure:
                steps:
                  - task: KubernetesManifest@0
                    displayName: 'Rollback'
                    inputs:
                      action: 'reject'
                      kubernetesServiceConnection: 'aks-production'
                      namespace: 'production'
                      strategy: 'canary'
              success:
                steps:
                  - task: KubernetesManifest@0
                    displayName: 'Promote canary'
                    inputs:
                      action: 'promote'
                      kubernetesServiceConnection: 'aks-production'
                      namespace: 'production'
                      strategy: 'canary'
```

## Templates

```yaml
# templates/build-template.yml
parameters:
  - name: nodeVersion
    type: string
    default: '20.x'
  - name: buildCommand
    type: string
    default: 'npm run build'
  - name: testCommand
    type: string
    default: 'npm test'

jobs:
  - job: Build
    displayName: 'Build'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
      - task: NodeTool@0
        inputs:
          versionSpec: ${{ parameters.nodeVersion }}

      - task: Cache@2
        inputs:
          key: 'npm | "$(Agent.OS)" | package-lock.json'
          path: $(Pipeline.Workspace)/.npm

      - script: npm ci
        displayName: 'Install dependencies'

      - script: ${{ parameters.testCommand }}
        displayName: 'Run tests'

      - script: ${{ parameters.buildCommand }}
        displayName: 'Build'

      - publish: $(Build.SourcesDirectory)/dist
        artifact: 'dist'
```

```yaml
# templates/deploy-template.yml
parameters:
  - name: environment
    type: string
  - name: serviceConnection
    type: string
  - name: namespace
    type: string

jobs:
  - deployment: Deploy
    displayName: 'Deploy to ${{ parameters.environment }}'
    pool:
      vmImage: 'ubuntu-latest'
    environment: ${{ parameters.environment }}
    strategy:
      runOnce:
        deploy:
          steps:
            - download: current
              artifact: 'dist'

            - task: KubernetesManifest@0
              inputs:
                action: 'deploy'
                kubernetesServiceConnection: ${{ parameters.serviceConnection }}
                namespace: ${{ parameters.namespace }}
                manifests: |
                  $(Pipeline.Workspace)/k8s/*.yaml
```

```yaml
# azure-pipelines.yml (using templates)
trigger:
  - main

stages:
  - stage: Build
    jobs:
      - template: templates/build-template.yml
        parameters:
          nodeVersion: '20.x'

  - stage: DeployStaging
    dependsOn: Build
    jobs:
      - template: templates/deploy-template.yml
        parameters:
          environment: 'staging'
          serviceConnection: 'aks-staging'
          namespace: 'staging'

  - stage: DeployProduction
    dependsOn: DeployStaging
    jobs:
      - template: templates/deploy-template.yml
        parameters:
          environment: 'production'
          serviceConnection: 'aks-production'
          namespace: 'production'
```

## Monorepo Configuration

```yaml
# azure-pipelines.yml (Monorepo)
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - packages/**

variables:
  - name: apiChanged
    value: $[or(
      contains(variables['Build.SourceVersionMessage'], '[api]'),
      ne(variables['System.PullRequest.TargetBranch'], '')
    )]

stages:
  - stage: Detect
    jobs:
      - job: DetectChanges
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - bash: |
              API_CHANGED=$(git diff --name-only HEAD~1 | grep -q "^packages/api/" && echo true || echo false)
              WEB_CHANGED=$(git diff --name-only HEAD~1 | grep -q "^packages/web/" && echo true || echo false)

              echo "##vso[task.setvariable variable=apiChanged;isOutput=true]$API_CHANGED"
              echo "##vso[task.setvariable variable=webChanged;isOutput=true]$WEB_CHANGED"
            name: changes

  - stage: BuildAPI
    dependsOn: Detect
    condition: eq(dependencies.Detect.outputs['DetectChanges.changes.apiChanged'], 'true')
    jobs:
      - job: BuildAPI
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - script: |
              cd packages/api
              npm ci
              npm test
              npm run build

  - stage: BuildWeb
    dependsOn: Detect
    condition: eq(dependencies.Detect.outputs['DetectChanges.changes.webChanged'], 'true')
    jobs:
      - job: BuildWeb
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - script: |
              cd packages/web
              npm ci
              npm test
              npm run build
```

## Matrix Builds

```yaml
# azure-pipelines.yml (Matrix)
trigger:
  - main

strategy:
  matrix:
    Node18:
      nodeVersion: '18.x'
    Node20:
      nodeVersion: '20.x'
    Node21:
      nodeVersion: '21.x'

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: $(nodeVersion)

  - script: npm ci
  - script: npm test
```

## Container Jobs

```yaml
# azure-pipelines.yml (Container Jobs)
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

container: node:20-alpine

services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test
    ports:
      - 5432:5432
  redis:
    image: redis:7
    ports:
      - 6379:6379

steps:
  - script: npm ci
  - script: npm run test:integration
    env:
      DATABASE_URL: postgres://test:test@postgres:5432/test
      REDIS_URL: redis://redis:6379
```

## Variable Groups and Key Vault

```yaml
# azure-pipelines.yml (Variable Groups)
trigger:
  - main

variables:
  - group: 'common-variables'
  - group: 'production-secrets'
  - name: environment
    value: 'production'

stages:
  - stage: Deploy
    jobs:
      - deployment: Deploy
        environment: 'production'
        pool:
          vmImage: 'ubuntu-latest'
        variables:
          - group: 'production-keyvault'  # Linked to Azure Key Vault
        strategy:
          runOnce:
            deploy:
              steps:
                - script: |
                    echo "Deploying with API_KEY: $(API_KEY)"
                    echo "Database: $(DATABASE_URL)"
```

## CLAUDE.md Integration

```markdown
# Azure Pipelines

## Commands
- `az pipelines run --name <pipeline>` - Run pipeline
- `az pipelines show --name <pipeline>` - Show pipeline
- `az pipelines build list` - List builds
- `az pipelines variable-group list` - List variable groups

## Key Concepts
- **Stages**: Pipeline phases (Build, Test, Deploy)
- **Jobs**: Collection of steps
- **Steps**: Individual tasks
- **Templates**: Reusable configurations

## Triggers
- `trigger`: Branch/tag triggers
- `pr`: Pull request triggers
- `schedules`: Scheduled triggers
- `resources.pipelines`: Pipeline triggers

## Deployment Strategies
- `runOnce`: Single deployment
- `rolling`: Rolling update
- `canary`: Canary deployment
- `blue-green`: Blue-green deployment
```

## AI Suggestions

1. **Use templates** - Extract reusable pipeline components
2. **Configure caching** - Cache dependencies and Docker layers
3. **Add variable groups** - Centralize configuration
4. **Implement environments** - Use approval gates
5. **Configure service connections** - Secure cloud access
6. **Add deployment strategies** - Canary/blue-green
7. **Use container jobs** - Consistent build environments
8. **Implement matrix builds** - Multi-version testing
9. **Add Key Vault integration** - Secure secret management
10. **Configure branch policies** - Require successful builds
