# Kubernetes Deployment Template

> Production-ready Kubernetes Deployment manifests with best practices for reliability and security

## Overview

This template provides comprehensive Kubernetes Deployment configurations with:
- Resource management and limits
- Liveness and readiness probes
- Rolling update strategies
- Pod disruption budgets
- Security contexts
- Anti-affinity rules

## Quick Start

```bash
# Apply deployment
kubectl apply -f deployment.yaml

# Check status
kubectl rollout status deployment/my-app

# Scale deployment
kubectl scale deployment/my-app --replicas=5

# Update image
kubectl set image deployment/my-app app=my-image:v2
```

## Basic Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
  labels:
    app: my-app
    version: v1
    team: backend
spec:
  replicas: 3
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      containers:
        - name: app
          image: my-registry/my-app:v1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
            - name: metrics
              containerPort: 9090
              protocol: TCP
          env:
            - name: PORT
              value: "8080"
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
      restartPolicy: Always
```

## Production Deployment (Full)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
  labels:
    app.kubernetes.io/name: my-app
    app.kubernetes.io/instance: my-app-prod
    app.kubernetes.io/version: "1.0.0"
    app.kubernetes.io/component: api
    app.kubernetes.io/part-of: my-platform
    app.kubernetes.io/managed-by: kubectl
  annotations:
    kubernetes.io/change-cause: "Initial deployment"
spec:
  replicas: 3
  revisionHistoryLimit: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: my-app
      app.kubernetes.io/instance: my-app-prod
  template:
    metadata:
      labels:
        app.kubernetes.io/name: my-app
        app.kubernetes.io/instance: my-app-prod
        app.kubernetes.io/version: "1.0.0"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        checksum/config: "{{ sha256sum .Values.config }}"
    spec:
      # Service Account
      serviceAccountName: my-app
      automountServiceAccountToken: false

      # Security Context (Pod level)
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault

      # Topology Spread
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: my-app

      # Anti-Affinity
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app.kubernetes.io/name: my-app
                topologyKey: kubernetes.io/hostname

      # Init Containers
      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command: ['sh', '-c', 'until nc -z db-service 5432; do echo waiting for db; sleep 2; done']
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]

      # Main Container
      containers:
        - name: app
          image: my-registry/my-app:1.0.0
          imagePullPolicy: IfNotPresent

          # Ports
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
            - name: metrics
              containerPort: 9090
              protocol: TCP

          # Environment Variables
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: PORT
              value: "8080"

          # Environment from ConfigMap/Secret
          envFrom:
            - configMapRef:
                name: my-app-config
            - secretRef:
                name: my-app-secrets

          # Resources
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
              ephemeral-storage: 100Mi
            limits:
              cpu: 1000m
              memory: 1Gi
              ephemeral-storage: 1Gi

          # Security Context (Container level)
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]

          # Probes
          startupProbe:
            httpGet:
              path: /health/startup
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 30  # 150 seconds max startup time

          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 0
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 0
            periodSeconds: 5
            timeoutSeconds: 3
            successThreshold: 1
            failureThreshold: 3

          # Volume Mounts
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: config
              mountPath: /app/config
              readOnly: true
            - name: secrets
              mountPath: /app/secrets
              readOnly: true

          # Lifecycle Hooks
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 10"]

      # Volumes
      volumes:
        - name: tmp
          emptyDir: {}
        - name: config
          configMap:
            name: my-app-config
        - name: secrets
          secret:
            secretName: my-app-secrets

      # Termination
      terminationGracePeriodSeconds: 30

      # Image Pull Secrets
      imagePullSecrets:
        - name: registry-credentials

      # Node Selection
      nodeSelector:
        kubernetes.io/os: linux

      # Tolerations
      tolerations:
        - key: "node.kubernetes.io/not-ready"
          operator: "Exists"
          effect: "NoExecute"
          tolerationSeconds: 300
```

## Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
  namespace: production
spec:
  minAvailable: 2  # or maxUnavailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: my-app
```

## Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
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
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

## Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: production
  labels:
    app.kubernetes.io/name: my-app
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: my-app
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
    - name: metrics
      port: 9090
      targetPort: metrics
      protocol: TCP
```

## ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app-config
  namespace: production
data:
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  CACHE_TTL: "3600"
  FEATURE_FLAGS: |
    {
      "newFeature": true,
      "experimentalMode": false
    }
```

## Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-app-secrets
  namespace: production
type: Opaque
stringData:
  DATABASE_URL: "postgres://user:pass@db:5432/mydb"
  API_KEY: "secret-api-key"
  JWT_SECRET: "jwt-secret-key"
```

## Service Account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
  namespace: production
  annotations:
    # For AWS IRSA
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/my-app-role
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: my-app
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: my-app
  namespace: production
subjects:
  - kind: ServiceAccount
    name: my-app
    namespace: production
roleRef:
  kind: Role
  name: my-app
  apiGroup: rbac.authorization.k8s.io
```

## Network Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: my-app-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: my-app
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: frontend
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: redis
      ports:
        - protocol: TCP
          port: 6379
    - to:  # DNS
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

## Kustomization

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: production

commonLabels:
  app.kubernetes.io/managed-by: kustomize

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml
  - pdb.yaml
  - hpa.yaml

configMapGenerator:
  - name: my-app-config
    envs:
      - config.env

secretGenerator:
  - name: my-app-secrets
    envs:
      - secrets.env

images:
  - name: my-registry/my-app
    newTag: v1.0.0
```

## CLAUDE.md Integration

```markdown
# Kubernetes Deployment

## Commands
- `kubectl apply -f deployment.yaml` - Apply deployment
- `kubectl rollout status deployment/my-app` - Check rollout
- `kubectl rollout undo deployment/my-app` - Rollback
- `kubectl scale deployment/my-app --replicas=5` - Scale

## Key Components
- **Deployment**: Main application pods
- **Service**: Internal load balancer
- **ConfigMap**: Non-sensitive configuration
- **Secret**: Sensitive data (encrypted at rest)
- **PDB**: Availability during disruptions
- **HPA**: Auto-scaling based on metrics

## Health Checks
- **startupProbe**: For slow-starting containers
- **livenessProbe**: Restart unhealthy pods
- **readinessProbe**: Traffic routing control
```

## AI Suggestions

1. **Add Vertical Pod Autoscaler** - Implement VPA for automatic resource right-sizing
2. **Configure Pod Priority** - Set priority classes for critical workloads
3. **Add Pod Topology Spread** - Ensure even distribution across zones
4. **Implement Canary Deployments** - Use Argo Rollouts for progressive delivery
5. **Add Resource Quotas** - Set namespace-level resource limits
6. **Configure Pod Security Standards** - Apply restricted PSS profile
7. **Add External Secrets** - Integrate with Vault or AWS Secrets Manager
8. **Implement Service Mesh** - Add Istio/Linkerd for observability and security
9. **Configure Admission Webhooks** - Add OPA/Gatekeeper for policy enforcement
10. **Add GitOps with Flux/ArgoCD** - Implement declarative cluster management
