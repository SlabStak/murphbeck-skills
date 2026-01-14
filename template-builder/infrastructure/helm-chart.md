# Helm Chart Template

> Production-ready Helm chart structure with comprehensive values, templates, and best practices

## Overview

This template provides a complete Helm chart with:
- Full deployment, service, and ingress templates
- ConfigMap and Secret management
- Horizontal Pod Autoscaler
- Service Account with RBAC
- Network policies
- Pod disruption budget
- Comprehensive values.yaml

## Quick Start

```bash
# Create new chart
helm create my-app

# Install chart
helm install my-release ./my-app

# Upgrade chart
helm upgrade my-release ./my-app -f values-prod.yaml

# Template rendering (debug)
helm template my-release ./my-app --debug

# Lint chart
helm lint ./my-app
```

## Chart Structure

```
my-app/
├── Chart.yaml
├── Chart.lock
├── values.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-prod.yaml
├── .helmignore
├── templates/
│   ├── _helpers.tpl
│   ├── NOTES.txt
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── serviceaccount.yaml
│   ├── hpa.yaml
│   ├── pdb.yaml
│   ├── networkpolicy.yaml
│   └── tests/
│       └── test-connection.yaml
└── charts/
    └── (subcharts)
```

## Chart.yaml

```yaml
apiVersion: v2
name: my-app
description: A Helm chart for My Application
type: application
version: 1.0.0
appVersion: "1.0.0"
kubeVersion: ">=1.25.0-0"

keywords:
  - api
  - backend
  - microservice

home: https://github.com/org/my-app
sources:
  - https://github.com/org/my-app

maintainers:
  - name: Platform Team
    email: platform@example.com
    url: https://example.com

annotations:
  artifacthub.io/changes: |
    - kind: added
      description: Initial release
  artifacthub.io/containsSecurityUpdates: "false"
  artifacthub.io/license: MIT

dependencies:
  - name: postgresql
    version: "13.x.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
  - name: redis
    version: "18.x.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
```

## values.yaml

```yaml
# ============================================
# Global Configuration
# ============================================
global:
  imageRegistry: ""
  imagePullSecrets: []
  storageClass: ""

# ============================================
# Application Configuration
# ============================================
replicaCount: 3

image:
  repository: my-registry/my-app
  pullPolicy: IfNotPresent
  tag: ""  # Overrides appVersion

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

# ============================================
# Service Account
# ============================================
serviceAccount:
  create: true
  automount: false
  annotations: {}
    # eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/my-app
  name: ""

# ============================================
# RBAC
# ============================================
rbac:
  create: true
  rules: []
    # - apiGroups: [""]
    #   resources: ["configmaps"]
    #   verbs: ["get", "list", "watch"]

# ============================================
# Pod Configuration
# ============================================
podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"

podLabels: {}

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault

securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL

# ============================================
# Container Configuration
# ============================================
containerPort: 8080
metricsPort: 9090

command: []
args: []

env: []
  # - name: LOG_LEVEL
  #   value: info

envFrom: []
  # - configMapRef:
  #     name: my-config
  # - secretRef:
  #     name: my-secret

# ============================================
# Config and Secrets
# ============================================
config:
  enabled: true
  data:
    LOG_LEVEL: info
    LOG_FORMAT: json

secrets:
  enabled: false
  data: {}
    # DATABASE_URL: ""
    # API_KEY: ""

externalSecrets:
  enabled: false
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  data: []
    # - secretKey: database-url
    #   remoteRef:
    #     key: my-app/database
    #     property: url

# ============================================
# Service Configuration
# ============================================
service:
  type: ClusterIP
  port: 80
  targetPort: http
  annotations: {}

# ============================================
# Ingress Configuration
# ============================================
ingress:
  enabled: false
  className: nginx
  annotations: {}
    # nginx.ingress.kubernetes.io/ssl-redirect: "true"
    # cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: my-app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls: []
    # - secretName: my-app-tls
    #   hosts:
    #     - my-app.example.com

# ============================================
# Resources
# ============================================
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

# ============================================
# Probes
# ============================================
livenessProbe:
  enabled: true
  httpGet:
    path: /health/live
    port: http
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  enabled: true
  httpGet:
    path: /health/ready
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

startupProbe:
  enabled: false
  httpGet:
    path: /health/startup
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 30

# ============================================
# Autoscaling
# ============================================
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15

# ============================================
# Pod Disruption Budget
# ============================================
pdb:
  enabled: true
  minAvailable: 2
  # maxUnavailable: 1

# ============================================
# Volumes
# ============================================
volumes:
  - name: tmp
    emptyDir: {}
  - name: cache
    emptyDir:
      sizeLimit: 100Mi

volumeMounts:
  - name: tmp
    mountPath: /tmp
  - name: cache
    mountPath: /app/cache

# ============================================
# Node Selection
# ============================================
nodeSelector:
  kubernetes.io/os: linux

tolerations: []

affinity: {}

topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app.kubernetes.io/name: '{{ include "my-app.name" . }}'

# ============================================
# Network Policy
# ============================================
networkPolicy:
  enabled: false
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: UDP
          port: 53

# ============================================
# Lifecycle
# ============================================
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 10"]

terminationGracePeriodSeconds: 30

# ============================================
# Dependencies
# ============================================
postgresql:
  enabled: false
  auth:
    database: myapp
    username: myapp
    password: ""
    existingSecret: ""

redis:
  enabled: false
  architecture: standalone
  auth:
    enabled: false

# ============================================
# Monitoring
# ============================================
metrics:
  enabled: true
  serviceMonitor:
    enabled: false
    namespace: ""
    interval: 30s
    scrapeTimeout: 10s
    labels: {}
```

## templates/_helpers.tpl

```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "my-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "my-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "my-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "my-app.labels" -}}
helm.sh/chart: {{ include "my-app.chart" . }}
{{ include "my-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "my-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "my-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "my-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "my-app.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create image reference
*/}}
{{- define "my-app.image" -}}
{{- $registry := .Values.global.imageRegistry | default .Values.image.registry -}}
{{- $repository := .Values.image.repository -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- if $registry }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- else }}
{{- printf "%s:%s" $repository $tag }}
{{- end }}
{{- end }}
```

## templates/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "my-app.labels" . | nindent 8 }}
        {{- with .Values.podLabels }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "my-app.serviceAccountName" . }}
      automountServiceAccountToken: {{ .Values.serviceAccount.automount }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      {{- with .Values.topologySpreadConstraints }}
      topologySpreadConstraints:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: {{ include "my-app.image" . }}
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          {{- with .Values.command }}
          command:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          {{- with .Values.args }}
          args:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          ports:
            - name: http
              containerPort: {{ .Values.containerPort }}
              protocol: TCP
            {{- if .Values.metrics.enabled }}
            - name: metrics
              containerPort: {{ .Values.metricsPort }}
              protocol: TCP
            {{- end }}
          {{- with .Values.env }}
          env:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          envFrom:
            {{- if .Values.config.enabled }}
            - configMapRef:
                name: {{ include "my-app.fullname" . }}
            {{- end }}
            {{- if .Values.secrets.enabled }}
            - secretRef:
                name: {{ include "my-app.fullname" . }}
            {{- end }}
            {{- with .Values.envFrom }}
            {{- toYaml . | nindent 12 }}
            {{- end }}
          {{- if .Values.livenessProbe.enabled }}
          livenessProbe:
            {{- omit .Values.livenessProbe "enabled" | toYaml | nindent 12 }}
          {{- end }}
          {{- if .Values.readinessProbe.enabled }}
          readinessProbe:
            {{- omit .Values.readinessProbe "enabled" | toYaml | nindent 12 }}
          {{- end }}
          {{- if .Values.startupProbe.enabled }}
          startupProbe:
            {{- omit .Values.startupProbe "enabled" | toYaml | nindent 12 }}
          {{- end }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          {{- with .Values.volumeMounts }}
          volumeMounts:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          {{- with .Values.lifecycle }}
          lifecycle:
            {{- toYaml . | nindent 12 }}
          {{- end }}
      {{- with .Values.volumes }}
      volumes:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      terminationGracePeriodSeconds: {{ .Values.terminationGracePeriodSeconds }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

## templates/service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  {{- with .Values.service.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
      name: http
    {{- if .Values.metrics.enabled }}
    - port: {{ .Values.metricsPort }}
      targetPort: metrics
      protocol: TCP
      name: metrics
    {{- end }}
  selector:
    {{- include "my-app.selectorLabels" . | nindent 4 }}
```

## templates/ingress.yaml

```yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  {{- if .Values.ingress.className }}
  ingressClassName: {{ .Values.ingress.className }}
  {{- end }}
  {{- if .Values.ingress.tls }}
  tls:
    {{- range .Values.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "my-app.fullname" $ }}
                port:
                  number: {{ $.Values.service.port }}
          {{- end }}
    {{- end }}
{{- end }}
```

## templates/hpa.yaml

```yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "my-app.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
  {{- with .Values.autoscaling.behavior }}
  behavior:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
```

## CLAUDE.md Integration

```markdown
# Helm Chart

## Commands
- `helm install release ./chart` - Install chart
- `helm upgrade release ./chart` - Upgrade release
- `helm rollback release 1` - Rollback to revision
- `helm template release ./chart` - Render templates
- `helm lint ./chart` - Validate chart

## Value Files
- `values.yaml` - Default values
- `values-dev.yaml` - Development overrides
- `values-staging.yaml` - Staging overrides
- `values-prod.yaml` - Production overrides

## Structure
- `Chart.yaml` - Chart metadata
- `values.yaml` - Default configuration
- `templates/` - Kubernetes manifests
- `charts/` - Dependencies

## Testing
```bash
helm test release
helm template release ./chart --debug
```
```

## AI Suggestions

1. **Add Helmfile for multi-chart** - Use Helmfile for managing multiple releases
2. **Implement chart tests** - Add comprehensive helm test hooks
3. **Add JSON Schema** - Create values.schema.json for IDE validation
4. **Configure hooks** - Add pre/post install/upgrade hooks
5. **Add library chart** - Create shared templates as library
6. **Implement OCI registry** - Push charts to OCI-compliant registries
7. **Add Artifactory support** - Configure chart repository in Artifactory
8. **Create umbrella chart** - Bundle related services in parent chart
9. **Add chart signing** - Sign charts with GPG for verification
10. **Implement GitOps** - Configure Flux HelmRelease or ArgoCD Application
