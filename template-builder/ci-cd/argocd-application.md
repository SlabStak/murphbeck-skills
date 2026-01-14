# ArgoCD Application Template

> Production-ready ArgoCD configurations for GitOps-based Kubernetes deployments

## Overview

This template provides ArgoCD configurations with:
- Application and ApplicationSet resources
- Multi-environment deployments
- Sync policies and strategies
- Health checks and hooks
- Multi-cluster support

## Quick Start

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Create application
kubectl apply -f application.yaml

# Sync application
argocd app sync myapp
```

## Application Resource

```yaml
# application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
  labels:
    app.kubernetes.io/name: myapp
    app.kubernetes.io/part-of: platform
  annotations:
    notifications.argoproj.io/subscribe.on-sync-succeeded.slack: deployments
    notifications.argoproj.io/subscribe.on-sync-failed.slack: alerts
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default

  source:
    repoURL: https://github.com/myorg/myapp.git
    targetRevision: HEAD
    path: k8s/overlays/production

    # Kustomize configuration
    kustomize:
      images:
        - myapp=ghcr.io/myorg/myapp:latest
      namePrefix: prod-
      commonLabels:
        environment: production

  destination:
    server: https://kubernetes.default.svc
    namespace: production

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
      - ApplyOutOfSyncOnly=true
      - ServerSideApply=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

  revisionHistoryLimit: 10

  # Ignore differences in specific fields
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
    - group: autoscaling
      kind: HorizontalPodAutoscaler
      jqPathExpressions:
        - .spec.minReplicas
        - .spec.maxReplicas
---
# Helm-based application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-helm
  namespace: argocd
spec:
  project: default

  source:
    repoURL: https://charts.example.com
    chart: myapp
    targetRevision: 1.2.3

    helm:
      releaseName: myapp
      valueFiles:
        - values.yaml
        - values-production.yaml

      values: |
        replicaCount: 3
        image:
          tag: v1.0.0
        resources:
          limits:
            cpu: 1000m
            memory: 1Gi

      parameters:
        - name: service.type
          value: LoadBalancer
        - name: ingress.enabled
          value: "true"

  destination:
    server: https://kubernetes.default.svc
    namespace: production

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## ApplicationSet

```yaml
# applicationset.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: myapp
  namespace: argocd
spec:
  generators:
    # List generator for multiple environments
    - list:
        elements:
          - cluster: staging
            url: https://staging.k8s.example.com
            namespace: staging
            values:
              replicas: "2"
              domain: staging.example.com
          - cluster: production
            url: https://production.k8s.example.com
            namespace: production
            values:
              replicas: "5"
              domain: example.com

  template:
    metadata:
      name: 'myapp-{{cluster}}'
      labels:
        environment: '{{cluster}}'
    spec:
      project: default

      source:
        repoURL: https://github.com/myorg/myapp.git
        targetRevision: HEAD
        path: 'k8s/overlays/{{cluster}}'

        kustomize:
          images:
            - myapp=ghcr.io/myorg/myapp:latest
          commonAnnotations:
            argocd.argoproj.io/sync-wave: "0"

      destination:
        server: '{{url}}'
        namespace: '{{namespace}}'

      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
---
# Git generator for directories
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: cluster-addons
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/myorg/cluster-config.git
        revision: HEAD
        directories:
          - path: 'addons/*'
          - path: 'addons/*/overlays/*'
            exclude: true

  template:
    metadata:
      name: '{{path.basename}}'
    spec:
      project: cluster-addons
      source:
        repoURL: https://github.com/myorg/cluster-config.git
        targetRevision: HEAD
        path: '{{path}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
---
# Matrix generator for clusters x applications
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: platform-services
  namespace: argocd
spec:
  generators:
    - matrix:
        generators:
          - clusters:
              selector:
                matchLabels:
                  environment: production
          - git:
              repoURL: https://github.com/myorg/platform-services.git
              revision: HEAD
              directories:
                - path: services/*

  template:
    metadata:
      name: '{{path.basename}}-{{name}}'
    spec:
      project: platform
      source:
        repoURL: https://github.com/myorg/platform-services.git
        targetRevision: HEAD
        path: '{{path}}'
      destination:
        server: '{{server}}'
        namespace: '{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
---
# Pull Request generator
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: preview-environments
  namespace: argocd
spec:
  generators:
    - pullRequest:
        github:
          owner: myorg
          repo: myapp
          tokenRef:
            secretName: github-token
            key: token
        requeueAfterSeconds: 60

  template:
    metadata:
      name: 'myapp-pr-{{number}}'
      labels:
        preview: "true"
    spec:
      project: previews
      source:
        repoURL: 'https://github.com/myorg/myapp.git'
        targetRevision: '{{head_sha}}'
        path: k8s/overlays/preview
        kustomize:
          nameSuffix: '-pr-{{number}}'
          images:
            - myapp=ghcr.io/myorg/myapp:pr-{{number}}
      destination:
        server: https://kubernetes.default.svc
        namespace: 'preview-{{number}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

## AppProject

```yaml
# appproject.yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: platform
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  description: Platform services project

  # Source repositories
  sourceRepos:
    - 'https://github.com/myorg/*'
    - 'https://charts.example.com'

  # Destination clusters and namespaces
  destinations:
    - namespace: '*'
      server: https://kubernetes.default.svc
    - namespace: 'production'
      server: https://production.k8s.example.com

  # Cluster resource whitelist
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
    - group: rbac.authorization.k8s.io
      kind: ClusterRole
    - group: rbac.authorization.k8s.io
      kind: ClusterRoleBinding

  # Namespace resource blacklist
  namespaceResourceBlacklist:
    - group: ''
      kind: ResourceQuota
    - group: ''
      kind: LimitRange

  # Roles
  roles:
    - name: developer
      description: Developer role
      policies:
        - p, proj:platform:developer, applications, get, platform/*, allow
        - p, proj:platform:developer, applications, sync, platform/*, allow
      groups:
        - developers

    - name: admin
      description: Admin role
      policies:
        - p, proj:platform:admin, applications, *, platform/*, allow
        - p, proj:platform:admin, repositories, *, platform/*, allow
      groups:
        - admins

  # Sync windows
  syncWindows:
    - kind: allow
      schedule: '* * * * *'
      duration: 24h
      applications:
        - '*'
      namespaces:
        - staging
    - kind: deny
      schedule: '0 22 * * 5'
      duration: 48h
      applications:
        - '*-production'
      namespaces:
        - production

  # Orphaned resources monitoring
  orphanedResources:
    warn: true
    ignore:
      - group: ''
        kind: ConfigMap
        name: kube-root-ca.crt
```

## Sync Hooks

```yaml
# hooks/pre-sync-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: pre-sync-migration
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      containers:
        - name: migration
          image: myapp/migration:latest
          command: ["./migrate.sh"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: url
      restartPolicy: Never
  backoffLimit: 3
---
# hooks/post-sync-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: post-sync-smoke-test
  annotations:
    argocd.argoproj.io/hook: PostSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      containers:
        - name: smoke-test
          image: myapp/smoke-test:latest
          command: ["./smoke-test.sh"]
          env:
            - name: APP_URL
              value: https://myapp.example.com
      restartPolicy: Never
  backoffLimit: 1
---
# hooks/sync-fail-notification.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: sync-fail-notification
  annotations:
    argocd.argoproj.io/hook: SyncFail
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      containers:
        - name: notify
          image: curlimages/curl:latest
          command:
            - /bin/sh
            - -c
            - |
              curl -X POST $SLACK_WEBHOOK_URL \
                -H 'Content-type: application/json' \
                -d '{"text": "ArgoCD sync failed for myapp"}'
          env:
            - name: SLACK_WEBHOOK_URL
              valueFrom:
                secretKeyRef:
                  name: slack-webhook
                  key: url
      restartPolicy: Never
```

## Notifications

```yaml
# argocd-notifications-cm.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.slack: |
    token: $slack-token

  template.app-deployed: |
    message: |
      Application {{.app.metadata.name}} has been deployed.
      Sync Status: {{.app.status.sync.status}}
      Health Status: {{.app.status.health.status}}
      Revision: {{.app.status.sync.revision}}

  template.app-sync-failed: |
    message: |
      :x: Application {{.app.metadata.name}} sync failed!
      Error: {{.app.status.operationState.message}}

  trigger.on-deployed: |
    - when: app.status.operationState.phase in ['Succeeded'] and app.status.health.status == 'Healthy'
      send: [app-deployed]

  trigger.on-sync-failed: |
    - when: app.status.operationState.phase in ['Error', 'Failed']
      send: [app-sync-failed]

  subscriptions: |
    - recipients:
        - slack:deployments
      triggers:
        - on-deployed
    - recipients:
        - slack:alerts
      triggers:
        - on-sync-failed
```

## Image Updater

```yaml
# argocd-image-updater-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-image-updater-config
  namespace: argocd
data:
  registries.conf: |
    registries:
      - name: GitHub Container Registry
        prefix: ghcr.io
        api_url: https://ghcr.io
        credentials: pullsecret:argocd/github-registry
        default: true
---
# Application with image updater annotations
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
  annotations:
    argocd-image-updater.argoproj.io/image-list: myapp=ghcr.io/myorg/myapp
    argocd-image-updater.argoproj.io/myapp.update-strategy: semver
    argocd-image-updater.argoproj.io/myapp.allow-tags: regexp:^v[0-9]+\.[0-9]+\.[0-9]+$
    argocd-image-updater.argoproj.io/write-back-method: git:secret:argocd/github-creds
spec:
  # ... application spec
```

## CLAUDE.md Integration

```markdown
# ArgoCD GitOps

## Commands
- `argocd app list` - List applications
- `argocd app sync myapp` - Sync application
- `argocd app diff myapp` - Show diff
- `argocd app rollback myapp` - Rollback
- `argocd app history myapp` - Show history

## Key Concepts
- **Application**: Single deployment unit
- **ApplicationSet**: Template for multiple apps
- **AppProject**: RBAC and policies
- **Sync Hooks**: Pre/Post sync jobs

## Sync Policies
- `automated.prune` - Delete removed resources
- `automated.selfHeal` - Auto-fix drift
- `syncOptions` - Sync behavior options

## Generators
- List, Cluster, Git, Matrix, Merge, Pull Request
```

## AI Suggestions

1. **Add ApplicationSets** - Manage multiple environments
2. **Implement sync hooks** - Pre/post sync jobs
3. **Configure notifications** - Slack/Teams integration
4. **Add image updater** - Automatic image updates
5. **Implement progressive delivery** - Argo Rollouts integration
6. **Configure RBAC** - Project-based access control
7. **Add sync windows** - Deployment schedules
8. **Implement multi-cluster** - Cross-cluster deployments
9. **Add health checks** - Custom health assessments
10. **Configure resource hooks** - Lifecycle management
