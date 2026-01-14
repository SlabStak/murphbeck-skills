# Tekton Pipeline Configuration Template

> Production-ready Tekton configurations for Kubernetes-native CI/CD

## Overview

This template provides Tekton configurations with:
- Pipeline and Task resources
- Triggers and EventListeners
- Workspaces and PVCs
- Catalog tasks integration
- Multi-cluster deployments

## Quick Start

```bash
# Install Tekton Pipelines
kubectl apply --filename https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml

# Install Tekton Triggers
kubectl apply --filename https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml

# Install Tekton Dashboard
kubectl apply --filename https://storage.googleapis.com/tekton-releases/dashboard/latest/release.yaml

# Install Tekton CLI
brew install tektoncd-cli

# List pipelines
tkn pipeline list

# Start pipeline
tkn pipeline start myapp-pipeline

# View logs
tkn pipelinerun logs -f
```

## Task Definitions

```yaml
# tasks/git-clone.yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: git-clone
  labels:
    app.kubernetes.io/version: "0.9"
spec:
  description: Clone a git repository
  workspaces:
    - name: output
      description: The git repo will be cloned onto this workspace

  params:
    - name: url
      type: string
      description: Repository URL
    - name: revision
      type: string
      default: main
      description: Branch, tag, or commit
    - name: submodules
      type: string
      default: "true"
    - name: depth
      type: string
      default: "1"
    - name: sslVerify
      type: string
      default: "true"

  results:
    - name: commit
      description: The commit SHA
    - name: url
      description: The repository URL
    - name: committer-date
      description: The commit date

  steps:
    - name: clone
      image: gcr.io/tekton-releases/github.com/tektoncd/pipeline/cmd/git-init:latest
      env:
        - name: HOME
          value: /tekton/home
        - name: PARAM_URL
          value: $(params.url)
        - name: PARAM_REVISION
          value: $(params.revision)
        - name: PARAM_SUBMODULES
          value: $(params.submodules)
        - name: PARAM_DEPTH
          value: $(params.depth)
        - name: WORKSPACE_OUTPUT_PATH
          value: $(workspaces.output.path)
      securityContext:
        runAsNonRoot: true
        runAsUser: 65532
      script: |
        #!/usr/bin/env sh
        set -eu

        CHECKOUT_DIR="${WORKSPACE_OUTPUT_PATH}"

        /ko-app/git-init \
          -url="${PARAM_URL}" \
          -revision="${PARAM_REVISION}" \
          -refspec="" \
          -path="${CHECKOUT_DIR}" \
          -sslVerify="${PARAM_SSL_VERIFY:-true}" \
          -submodules="${PARAM_SUBMODULES}" \
          -depth="${PARAM_DEPTH}" \
          -sparseCheckoutDirectories=""

        cd "${CHECKOUT_DIR}"
        RESULT_SHA="$(git rev-parse HEAD)"
        printf "%s" "${RESULT_SHA}" > "$(results.commit.path)"
        printf "%s" "${PARAM_URL}" > "$(results.url.path)"
        printf "%s" "$(git log -1 --format=%cI)" > "$(results.committer-date.path)"
---
# tasks/npm-build.yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: npm-build
spec:
  description: Build Node.js application
  workspaces:
    - name: source
      description: Source code workspace

  params:
    - name: image
      type: string
      default: node:20-alpine
    - name: build-command
      type: string
      default: npm run build

  steps:
    - name: install
      image: $(params.image)
      workingDir: $(workspaces.source.path)
      script: |
        #!/bin/sh
        npm ci --prefer-offline

    - name: build
      image: $(params.image)
      workingDir: $(workspaces.source.path)
      script: |
        #!/bin/sh
        $(params.build-command)
---
# tasks/npm-test.yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: npm-test
spec:
  description: Run Node.js tests
  workspaces:
    - name: source

  params:
    - name: image
      type: string
      default: node:20-alpine
    - name: test-command
      type: string
      default: npm test -- --coverage

  results:
    - name: coverage
      description: Test coverage percentage

  steps:
    - name: test
      image: $(params.image)
      workingDir: $(workspaces.source.path)
      script: |
        #!/bin/sh
        $(params.test-command) | tee test-output.txt
        COVERAGE=$(grep -o 'All files[^|]*|[^|]*|[^|]*|[^|]*| *[0-9.]*' test-output.txt | awk -F'|' '{print $5}' | tr -d ' ' || echo "0")
        printf "%s" "${COVERAGE}" > $(results.coverage.path)
---
# tasks/docker-build-push.yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: docker-build-push
spec:
  description: Build and push Docker image using Kaniko
  workspaces:
    - name: source
    - name: dockerconfig
      optional: true

  params:
    - name: image
      type: string
      description: Image name including registry
    - name: tag
      type: string
      default: latest
    - name: dockerfile
      type: string
      default: ./Dockerfile
    - name: context
      type: string
      default: .
    - name: build-args
      type: array
      default: []

  results:
    - name: digest
      description: Image digest

  steps:
    - name: build-push
      image: gcr.io/kaniko-project/executor:latest
      args:
        - --dockerfile=$(params.dockerfile)
        - --context=$(workspaces.source.path)/$(params.context)
        - --destination=$(params.image):$(params.tag)
        - --destination=$(params.image):latest
        - --digest-file=$(results.digest.path)
        - --cache=true
        - --cache-ttl=24h
        - $(params.build-args[*])
      volumeMounts:
        - name: docker-config
          mountPath: /kaniko/.docker
      securityContext:
        runAsUser: 0

  volumes:
    - name: docker-config
      secret:
        secretName: docker-credentials
        optional: true
---
# tasks/kubernetes-deploy.yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: kubernetes-deploy
spec:
  description: Deploy to Kubernetes
  workspaces:
    - name: source
    - name: kubeconfig
      optional: true

  params:
    - name: namespace
      type: string
    - name: deployment
      type: string
    - name: image
      type: string
    - name: container
      type: string
      default: app

  steps:
    - name: deploy
      image: bitnami/kubectl:latest
      script: |
        #!/bin/bash
        set -e

        if [ -f "$(workspaces.kubeconfig.path)/kubeconfig" ]; then
          export KUBECONFIG="$(workspaces.kubeconfig.path)/kubeconfig"
        fi

        kubectl -n $(params.namespace) set image deployment/$(params.deployment) \
          $(params.container)=$(params.image)

        kubectl -n $(params.namespace) rollout status deployment/$(params.deployment) \
          --timeout=300s

    - name: verify
      image: bitnami/kubectl:latest
      script: |
        #!/bin/bash
        kubectl -n $(params.namespace) get pods -l app=$(params.deployment) -o wide
```

## Pipeline Definition

```yaml
# pipelines/nodejs-pipeline.yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: nodejs-pipeline
spec:
  description: CI/CD pipeline for Node.js applications

  params:
    - name: repo-url
      type: string
      description: Git repository URL
    - name: revision
      type: string
      default: main
    - name: image
      type: string
      description: Target image name
    - name: namespace
      type: string
      default: default
    - name: deployment
      type: string

  workspaces:
    - name: shared-workspace
      description: Workspace shared between tasks
    - name: docker-credentials
      description: Docker registry credentials
    - name: kubeconfig
      description: Kubeconfig for deployment
      optional: true

  tasks:
    # Clone repository
    - name: clone
      taskRef:
        name: git-clone
      workspaces:
        - name: output
          workspace: shared-workspace
      params:
        - name: url
          value: $(params.repo-url)
        - name: revision
          value: $(params.revision)

    # Run linting
    - name: lint
      runAfter:
        - clone
      taskSpec:
        workspaces:
          - name: source
        steps:
          - name: lint
            image: node:20-alpine
            workingDir: $(workspaces.source.path)
            script: |
              npm ci --prefer-offline
              npm run lint
      workspaces:
        - name: source
          workspace: shared-workspace

    # Run tests
    - name: test
      runAfter:
        - clone
      taskRef:
        name: npm-test
      workspaces:
        - name: source
          workspace: shared-workspace
      params:
        - name: test-command
          value: "npm test -- --coverage --ci"

    # Build application
    - name: build
      runAfter:
        - lint
        - test
      taskRef:
        name: npm-build
      workspaces:
        - name: source
          workspace: shared-workspace

    # Build and push Docker image
    - name: build-push-image
      runAfter:
        - build
      taskRef:
        name: docker-build-push
      workspaces:
        - name: source
          workspace: shared-workspace
        - name: dockerconfig
          workspace: docker-credentials
      params:
        - name: image
          value: $(params.image)
        - name: tag
          value: $(tasks.clone.results.commit)

    # Deploy to staging
    - name: deploy-staging
      runAfter:
        - build-push-image
      taskRef:
        name: kubernetes-deploy
      workspaces:
        - name: source
          workspace: shared-workspace
        - name: kubeconfig
          workspace: kubeconfig
      params:
        - name: namespace
          value: staging
        - name: deployment
          value: $(params.deployment)
        - name: image
          value: "$(params.image)@$(tasks.build-push-image.results.digest)"

    # Run smoke tests
    - name: smoke-test
      runAfter:
        - deploy-staging
      taskSpec:
        params:
          - name: url
            type: string
        steps:
          - name: test
            image: curlimages/curl:latest
            script: |
              #!/bin/sh
              set -e
              sleep 30
              curl -f $(params.url)/health || exit 1
              echo "Smoke tests passed!"
      params:
        - name: url
          value: "https://staging.example.com"

  finally:
    - name: notify
      taskSpec:
        params:
          - name: status
            type: string
        steps:
          - name: send-notification
            image: curlimages/curl:latest
            script: |
              #!/bin/sh
              curl -X POST $SLACK_WEBHOOK_URL \
                -H 'Content-type: application/json' \
                -d '{"text": "Pipeline $(context.pipelineRun.name) $(params.status)"}'
      params:
        - name: status
          value: "$(tasks.status)"

    - name: cleanup
      taskSpec:
        workspaces:
          - name: source
        steps:
          - name: clean
            image: alpine
            script: |
              #!/bin/sh
              rm -rf $(workspaces.source.path)/*
      workspaces:
        - name: source
          workspace: shared-workspace
```

## Triggers

```yaml
# triggers/github-trigger.yaml
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerTemplate
metadata:
  name: github-trigger-template
spec:
  params:
    - name: git-repo-url
      description: The git repository URL
    - name: git-revision
      description: The git revision
      default: main
    - name: git-repo-name
      description: The repository name

  resourcetemplates:
    - apiVersion: tekton.dev/v1
      kind: PipelineRun
      metadata:
        generateName: $(tt.params.git-repo-name)-run-
      spec:
        pipelineRef:
          name: nodejs-pipeline
        params:
          - name: repo-url
            value: $(tt.params.git-repo-url)
          - name: revision
            value: $(tt.params.git-revision)
          - name: image
            value: ghcr.io/myorg/$(tt.params.git-repo-name)
          - name: deployment
            value: $(tt.params.git-repo-name)
        workspaces:
          - name: shared-workspace
            volumeClaimTemplate:
              spec:
                accessModes:
                  - ReadWriteOnce
                resources:
                  requests:
                    storage: 1Gi
          - name: docker-credentials
            secret:
              secretName: docker-credentials
---
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerBinding
metadata:
  name: github-push-binding
spec:
  params:
    - name: git-repo-url
      value: $(body.repository.clone_url)
    - name: git-revision
      value: $(body.after)
    - name: git-repo-name
      value: $(body.repository.name)
---
apiVersion: triggers.tekton.dev/v1beta1
kind: TriggerBinding
metadata:
  name: github-pr-binding
spec:
  params:
    - name: git-repo-url
      value: $(body.pull_request.head.repo.clone_url)
    - name: git-revision
      value: $(body.pull_request.head.sha)
    - name: git-repo-name
      value: $(body.repository.name)
---
apiVersion: triggers.tekton.dev/v1beta1
kind: Trigger
metadata:
  name: github-push-trigger
spec:
  interceptors:
    - ref:
        name: github
      params:
        - name: secretRef
          value:
            secretName: github-webhook-secret
            secretKey: secret
        - name: eventTypes
          value:
            - push
    - ref:
        name: cel
      params:
        - name: filter
          value: >-
            body.ref.startsWith('refs/heads/main') ||
            body.ref.startsWith('refs/heads/develop')
  bindings:
    - ref: github-push-binding
  template:
    ref: github-trigger-template
---
apiVersion: triggers.tekton.dev/v1beta1
kind: EventListener
metadata:
  name: github-listener
spec:
  serviceAccountName: tekton-triggers-sa
  triggers:
    - triggerRef: github-push-trigger
  resources:
    kubernetesResource:
      spec:
        template:
          spec:
            serviceAccountName: tekton-triggers-sa
            containers:
              - resources:
                  requests:
                    memory: "64Mi"
                    cpu: "250m"
                  limits:
                    memory: "128Mi"
                    cpu: "500m"
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tekton-webhook
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - tekton.example.com
      secretName: tekton-tls
  rules:
    - host: tekton.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: el-github-listener
                port:
                  number: 8080
```

## PipelineRun

```yaml
# pipelineruns/manual-run.yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: myapp-run-manual
spec:
  pipelineRef:
    name: nodejs-pipeline

  params:
    - name: repo-url
      value: https://github.com/myorg/myapp.git
    - name: revision
      value: main
    - name: image
      value: ghcr.io/myorg/myapp
    - name: namespace
      value: staging
    - name: deployment
      value: myapp

  workspaces:
    - name: shared-workspace
      volumeClaimTemplate:
        spec:
          accessModes:
            - ReadWriteOnce
          storageClassName: standard
          resources:
            requests:
              storage: 2Gi

    - name: docker-credentials
      secret:
        secretName: docker-credentials

    - name: kubeconfig
      secret:
        secretName: kubeconfig

  taskRunSpecs:
    - pipelineTaskName: build-push-image
      serviceAccountName: kaniko-sa
      computeResources:
        requests:
          memory: "2Gi"
          cpu: "1"
        limits:
          memory: "4Gi"
          cpu: "2"

  timeout: 1h0m0s
```

## RBAC

```yaml
# rbac/tekton-rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tekton-triggers-sa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tekton-triggers-role
rules:
  - apiGroups: ["triggers.tekton.dev"]
    resources: ["eventlisteners", "triggerbindings", "triggertemplates", "triggers"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["tekton.dev"]
    resources: ["pipelineruns", "pipelineresources"]
    verbs: ["create", "get", "list", "watch"]
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tekton-triggers-binding
subjects:
  - kind: ServiceAccount
    name: tekton-triggers-sa
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: tekton-triggers-role
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: tekton-triggers-cluster-binding
subjects:
  - kind: ServiceAccount
    name: tekton-triggers-sa
    namespace: default
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: tekton-triggers-eventlistener-roles
```

## CLAUDE.md Integration

```markdown
# Tekton Pipelines

## Commands
- `tkn pipeline list` - List pipelines
- `tkn pipeline start <name>` - Start pipeline
- `tkn pipelinerun list` - List runs
- `tkn pipelinerun logs <name> -f` - View logs
- `tkn task list` - List tasks

## Key Resources
- **Task**: Single unit of work
- **Pipeline**: Sequence of tasks
- **PipelineRun**: Pipeline execution
- **Trigger**: Event-based execution
- **EventListener**: Webhook handler

## Workspaces
- Shared storage between tasks
- VolumeClaimTemplate for dynamic PVCs
- ConfigMap/Secret mounting

## Catalog
- `tkn hub install task git-clone` - Install from hub
- https://hub.tekton.dev - Tekton Hub
```

## AI Suggestions

1. **Use Tekton Hub tasks** - Leverage pre-built tasks
2. **Configure workspaces** - Shared storage between tasks
3. **Implement triggers** - Webhook-based execution
4. **Add finally tasks** - Cleanup and notifications
5. **Configure RBAC** - Proper service accounts
6. **Use result passing** - Share data between tasks
7. **Implement caching** - Speed up builds
8. **Add timeout handling** - Prevent stuck runs
9. **Configure retries** - Handle transient failures
10. **Use task bundles** - Versioned task distribution
