# Flux GitOps Template

> Production-ready Flux CD configurations for GitOps-based Kubernetes deployments

## Overview

This template provides Flux configurations with:
- GitRepository and Kustomization resources
- HelmRelease for Helm chart deployments
- Image automation and updates
- Multi-tenancy support
- Notification and alerting

## Quick Start

```bash
# Install Flux CLI
curl -s https://fluxcd.io/install.sh | sudo bash

# Bootstrap Flux
flux bootstrap github \
  --owner=myorg \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/production \
  --personal

# Check Flux status
flux check

# View all resources
flux get all
```

## Repository Structure

```
fleet-infra/
├── clusters/
│   ├── staging/
│   │   ├── flux-system/
│   │   │   └── gotk-sync.yaml
│   │   ├── infrastructure.yaml
│   │   └── apps.yaml
│   └── production/
│       ├── flux-system/
│       │   └── gotk-sync.yaml
│       ├── infrastructure.yaml
│       └── apps.yaml
├── infrastructure/
│   ├── base/
│   │   ├── cert-manager/
│   │   ├── ingress-nginx/
│   │   └── monitoring/
│   └── overlays/
│       ├── staging/
│       └── production/
└── apps/
    ├── base/
    │   └── myapp/
    └── overlays/
        ├── staging/
        └── production/
```

## GitRepository Source

```yaml
# clusters/production/flux-system/gotk-sync.yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: flux-system
  namespace: flux-system
spec:
  interval: 1m
  url: ssh://git@github.com/myorg/fleet-infra
  ref:
    branch: main
  secretRef:
    name: flux-system
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: flux-system
  namespace: flux-system
spec:
  interval: 10m
  path: ./clusters/production
  prune: true
  sourceRef:
    kind: GitRepository
    name: flux-system
---
# Additional Git repository for apps
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: myapp
  namespace: flux-system
spec:
  interval: 5m
  url: https://github.com/myorg/myapp
  ref:
    branch: main
  secretRef:
    name: github-credentials
  ignore: |
    # exclude all
    /*
    # include kubernetes manifests
    !/k8s/
```

## Kustomization Resources

```yaml
# clusters/production/infrastructure.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: infrastructure
  namespace: flux-system
spec:
  interval: 10m
  retryInterval: 1m
  timeout: 5m
  sourceRef:
    kind: GitRepository
    name: flux-system
  path: ./infrastructure/overlays/production
  prune: true
  wait: true
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: ingress-nginx-controller
      namespace: ingress-nginx
    - apiVersion: apps/v1
      kind: Deployment
      name: cert-manager
      namespace: cert-manager
---
# clusters/production/apps.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  dependsOn:
    - name: infrastructure
  interval: 10m
  retryInterval: 1m
  timeout: 5m
  sourceRef:
    kind: GitRepository
    name: flux-system
  path: ./apps/overlays/production
  prune: true
  wait: true
  patches:
    - patch: |
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: all
        spec:
          template:
            spec:
              containers:
                - name: '*'
                  resources:
                    limits:
                      cpu: 2000m
                      memory: 2Gi
      target:
        kind: Deployment
  postBuild:
    substitute:
      ENVIRONMENT: production
      DOMAIN: example.com
    substituteFrom:
      - kind: ConfigMap
        name: cluster-vars
      - kind: Secret
        name: cluster-secrets
```

## HelmRelease

```yaml
# infrastructure/base/ingress-nginx/helmrelease.yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: HelmRepository
metadata:
  name: ingress-nginx
  namespace: flux-system
spec:
  interval: 24h
  url: https://kubernetes.github.io/ingress-nginx
---
apiVersion: helm.toolkit.fluxcd.io/v2beta2
kind: HelmRelease
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
spec:
  interval: 30m
  chart:
    spec:
      chart: ingress-nginx
      version: "4.x"
      sourceRef:
        kind: HelmRepository
        name: ingress-nginx
        namespace: flux-system
      interval: 12h

  install:
    remediation:
      retries: 3

  upgrade:
    cleanupOnFail: true
    remediation:
      retries: 3
      remediateLastFailure: true

  rollback:
    timeout: 5m
    cleanupOnFail: true

  values:
    controller:
      replicaCount: 2
      service:
        type: LoadBalancer
      metrics:
        enabled: true
        serviceMonitor:
          enabled: true
      resources:
        requests:
          cpu: 100m
          memory: 256Mi
        limits:
          cpu: 500m
          memory: 512Mi

  valuesFrom:
    - kind: ConfigMap
      name: ingress-nginx-values
      valuesKey: values.yaml
      optional: true
---
# infrastructure/overlays/production/ingress-nginx-values.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-values
  namespace: ingress-nginx
data:
  values.yaml: |
    controller:
      replicaCount: 3
      autoscaling:
        enabled: true
        minReplicas: 3
        maxReplicas: 10
```

## Image Automation

```yaml
# apps/base/myapp/image-automation.yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: GitRepository
metadata:
  name: myapp-images
  namespace: flux-system
spec:
  interval: 1m
  url: ssh://git@github.com/myorg/fleet-infra
  ref:
    branch: main
  secretRef:
    name: flux-system
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: myapp
  namespace: flux-system
spec:
  image: ghcr.io/myorg/myapp
  interval: 5m
  secretRef:
    name: ghcr-credentials
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: myapp
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: myapp
  policy:
    semver:
      range: ">=1.0.0"
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageUpdateAutomation
metadata:
  name: myapp
  namespace: flux-system
spec:
  interval: 30m
  sourceRef:
    kind: GitRepository
    name: myapp-images
  git:
    checkout:
      ref:
        branch: main
    commit:
      author:
        email: flux@example.com
        name: Flux
      messageTemplate: |
        Automated image update

        Automation: {{ .AutomationObject }}

        Files:
        {{ range $filename, $_ := .Updated.Files -}}
        - {{ $filename }}
        {{ end -}}

        Objects:
        {{ range $resource, $_ := .Updated.Objects -}}
        - {{ $resource.Kind }} {{ $resource.Name }}
        {{ end -}}

        Images:
        {{ range .Updated.Images -}}
        - {{ .Repository }}:{{ .Tag }}
        {{ end -}}
    push:
      branch: main
  update:
    path: ./apps
    strategy: Setters
---
# apps/base/myapp/deployment.yaml (with image marker)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: myapp
          image: ghcr.io/myorg/myapp:1.0.0 # {"$imagepolicy": "flux-system:myapp"}
```

## Notifications and Alerts

```yaml
# clusters/production/notifications.yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: slack
  namespace: flux-system
spec:
  type: slack
  channel: deployments
  secretRef:
    name: slack-webhook
---
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: github
  namespace: flux-system
spec:
  type: github
  address: https://github.com/myorg/myapp
  secretRef:
    name: github-token
---
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: on-call
  namespace: flux-system
spec:
  providerRef:
    name: slack
  eventSeverity: error
  eventSources:
    - kind: Kustomization
      name: '*'
    - kind: HelmRelease
      name: '*'
  summary: "Flux reconciliation failed"
---
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: deployments
  namespace: flux-system
spec:
  providerRef:
    name: slack
  eventSeverity: info
  eventSources:
    - kind: Kustomization
      name: apps
  inclusionList:
    - ".*succeeded.*"
  summary: "Deployment completed"
---
# Receiver for webhooks
apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: github-webhook
  namespace: flux-system
spec:
  type: github
  events:
    - ping
    - push
  secretRef:
    name: webhook-token
  resources:
    - kind: GitRepository
      name: myapp
      namespace: flux-system
```

## Multi-Tenancy

```yaml
# tenants/base/tenant.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-a
  labels:
    toolkit.fluxcd.io/tenant: tenant-a
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: flux
  namespace: tenant-a
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: flux
  namespace: tenant-a
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: flux
    namespace: tenant-a
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: tenant-a
  namespace: tenant-a
spec:
  interval: 1m
  url: https://github.com/tenant-a/apps
  ref:
    branch: main
  secretRef:
    name: git-credentials
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: tenant-a
  namespace: tenant-a
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: tenant-a
  path: ./production
  prune: true
  serviceAccountName: flux
  targetNamespace: tenant-a
```

## Monitoring

```yaml
# infrastructure/base/monitoring/flux-monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: flux-system
  namespace: flux-system
spec:
  selector:
    matchLabels:
      app.kubernetes.io/part-of: flux
  endpoints:
    - port: http-prom
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: flux-alerts
  namespace: flux-system
spec:
  groups:
    - name: flux
      rules:
        - alert: FluxReconciliationFailure
          expr: |
            max(gotk_reconcile_condition{status="False",type="Ready"}) by (namespace, name, kind) == 1
          for: 10m
          labels:
            severity: critical
          annotations:
            summary: "Flux reconciliation failing"
            description: "{{ $labels.kind }} {{ $labels.namespace }}/{{ $labels.name }} reconciliation has been failing for more than 10 minutes."
```

## CLAUDE.md Integration

```markdown
# Flux CD GitOps

## Commands
- `flux check` - Verify prerequisites
- `flux get all` - List all resources
- `flux reconcile kustomization apps` - Force reconcile
- `flux logs` - View Flux logs
- `flux suspend/resume` - Pause/resume reconciliation

## Key Resources
- **GitRepository**: Git source
- **Kustomization**: Kustomize deployment
- **HelmRelease**: Helm chart deployment
- **ImageRepository**: Container registry source
- **ImagePolicy**: Image update policy

## Reconciliation
- Interval-based polling
- Webhook triggers via Receivers
- Manual with `flux reconcile`

## Multi-tenancy
- Namespace isolation
- ServiceAccount per tenant
- RBAC restrictions
```

## AI Suggestions

1. **Add image automation** - Automatic image updates
2. **Implement notifications** - Slack/Teams alerts
3. **Configure webhooks** - Push-based reconciliation
4. **Add health checks** - Custom health assessments
5. **Implement multi-tenancy** - Tenant isolation
6. **Configure SOPS encryption** - Secret management
7. **Add monitoring** - Prometheus metrics and alerts
8. **Implement progressive delivery** - Flagger integration
9. **Configure drift detection** - Alert on manual changes
10. **Add dependency management** - Cross-app dependencies
