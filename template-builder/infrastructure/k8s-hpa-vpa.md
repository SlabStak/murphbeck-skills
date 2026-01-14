# Kubernetes HPA/VPA Autoscaling Template

> Production-ready Horizontal and Vertical Pod Autoscaler configurations for automatic scaling based on metrics

## Overview

This template provides autoscaling configurations with:
- Horizontal Pod Autoscaler (HPA) v2
- Vertical Pod Autoscaler (VPA)
- Custom metrics scaling
- KEDA event-driven autoscaling
- Cluster Autoscaler integration

## Quick Start

```bash
# Install metrics-server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Apply HPA
kubectl apply -f hpa.yaml

# Check HPA status
kubectl get hpa
kubectl describe hpa my-app

# Apply VPA
kubectl apply -f vpa.yaml

# Check VPA recommendations
kubectl describe vpa my-app
```

## Horizontal Pod Autoscaler (HPA)

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api
  namespace: production
  labels:
    app.kubernetes.io/name: api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 50

  metrics:
    # CPU-based scaling
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # Memory-based scaling
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

    # Container resource metrics (specific container)
    - type: ContainerResource
      containerResource:
        name: cpu
        container: api
        target:
          type: Utilization
          averageUtilization: 70

  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
        - type: Pods
          value: 4
          periodSeconds: 60
      selectPolicy: Min
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
---
# HPA with custom metrics
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-custom-metrics
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 100

  metrics:
    # Pods metric (from application)
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"

    # Object metric (external object)
    - type: Object
      object:
        metric:
          name: requests_per_second
        describedObject:
          apiVersion: networking.k8s.io/v1
          kind: Ingress
          name: api-ingress
        target:
          type: Value
          value: "10000"

    # External metric (from external system)
    - type: External
      external:
        metric:
          name: queue_messages_ready
          selector:
            matchLabels:
              queue: api-tasks
        target:
          type: AverageValue
          averageValue: "30"

  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 120
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 50
          periodSeconds: 30
```

## Vertical Pod Autoscaler (VPA)

```yaml
# vpa.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api

  updatePolicy:
    updateMode: Auto  # Auto, Recreate, Initial, Off
    minReplicas: 2    # Min replicas during update

  resourcePolicy:
    containerPolicies:
      - containerName: api
        minAllowed:
          cpu: 100m
          memory: 128Mi
        maxAllowed:
          cpu: 4
          memory: 8Gi
        controlledResources:
          - cpu
          - memory
        controlledValues: RequestsAndLimits

      # Sidecar container with different policy
      - containerName: sidecar
        mode: "Off"  # Don't autoscale sidecar
---
# VPA in recommendation-only mode
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-recommendations
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api

  updatePolicy:
    updateMode: "Off"  # Only provide recommendations

  resourcePolicy:
    containerPolicies:
      - containerName: "*"
        minAllowed:
          cpu: 50m
          memory: 64Mi
        maxAllowed:
          cpu: 8
          memory: 16Gi
---
# VPA for StatefulSet
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: postgres
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: postgres

  updatePolicy:
    updateMode: Initial  # Only set on pod creation

  resourcePolicy:
    containerPolicies:
      - containerName: postgres
        minAllowed:
          cpu: 500m
          memory: 1Gi
        maxAllowed:
          cpu: 8
          memory: 32Gi
```

## KEDA Event-Driven Autoscaling

```yaml
# keda-scalers.yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: api-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: api
    kind: Deployment
  pollingInterval: 15
  cooldownPeriod: 300
  idleReplicaCount: 0
  minReplicaCount: 2
  maxReplicaCount: 100

  advanced:
    restoreToOriginalReplicaCount: true
    horizontalPodAutoscalerConfig:
      behavior:
        scaleDown:
          stabilizationWindowSeconds: 300
          policies:
            - type: Percent
              value: 10
              periodSeconds: 60

  triggers:
    # Prometheus metrics
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.monitoring.svc.cluster.local:9090
        metricName: http_requests_total
        query: sum(rate(http_requests_total{deployment="api"}[2m]))
        threshold: "100"

    # RabbitMQ queue
    - type: rabbitmq
      metadata:
        host: amqp://rabbitmq.messaging.svc.cluster.local:5672
        queueName: tasks
        mode: QueueLength
        value: "50"

    # Redis list
    - type: redis
      metadata:
        address: redis.cache.svc.cluster.local:6379
        listName: job_queue
        listLength: "100"
---
# KEDA ScaledObject for Kafka consumer
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: kafka-consumer-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: kafka-consumer
    kind: Deployment
  pollingInterval: 30
  cooldownPeriod: 300
  minReplicaCount: 1
  maxReplicaCount: 50

  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka.messaging.svc.cluster.local:9092
        consumerGroup: my-consumer-group
        topic: events
        lagThreshold: "100"
        activationLagThreshold: "10"
---
# KEDA ScaledObject for AWS SQS
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: sqs-processor-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: sqs-processor
    kind: Deployment
  pollingInterval: 15
  cooldownPeriod: 60
  minReplicaCount: 0
  maxReplicaCount: 100

  triggers:
    - type: aws-sqs-queue
      authenticationRef:
        name: keda-aws-credentials
      metadata:
        queueURL: https://sqs.us-east-1.amazonaws.com/123456789/my-queue
        queueLength: "50"
        awsRegion: us-east-1
        activationQueueLength: "1"
---
# KEDA TriggerAuthentication for AWS
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: keda-aws-credentials
  namespace: production
spec:
  podIdentity:
    provider: aws-eks  # Uses IRSA
---
# KEDA ScaledObject for PostgreSQL
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: db-worker-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: db-worker
    kind: Deployment
  pollingInterval: 30
  cooldownPeriod: 300
  minReplicaCount: 1
  maxReplicaCount: 20

  triggers:
    - type: postgresql
      authenticationRef:
        name: postgres-auth
      metadata:
        connectionFromEnv: DATABASE_URL
        query: "SELECT COUNT(*) FROM jobs WHERE status = 'pending'"
        targetQueryValue: "50"
        activationTargetQueryValue: "1"
---
# KEDA TriggerAuthentication for PostgreSQL
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: postgres-auth
  namespace: production
spec:
  secretTargetRef:
    - parameter: connection
      name: db-credentials
      key: connection-string
---
# KEDA ScaledObject with multiple triggers
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: multi-trigger-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: worker
    kind: Deployment
  pollingInterval: 15
  cooldownPeriod: 300
  minReplicaCount: 2
  maxReplicaCount: 100

  triggers:
    # CPU trigger
    - type: cpu
      metricType: Utilization
      metadata:
        value: "70"

    # Memory trigger
    - type: memory
      metricType: Utilization
      metadata:
        value: "80"

    # Prometheus trigger
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.monitoring:9090
        metricName: pending_requests
        query: sum(pending_requests{service="worker"})
        threshold: "100"

    # Cron trigger (scheduled scaling)
    - type: cron
      metadata:
        timezone: America/New_York
        start: 0 6 * * *
        end: 0 20 * * *
        desiredReplicas: "10"
---
# KEDA ScaledJob for batch processing
apiVersion: keda.sh/v1alpha1
kind: ScaledJob
metadata:
  name: batch-processor
  namespace: production
spec:
  jobTargetRef:
    parallelism: 1
    completions: 1
    activeDeadlineSeconds: 600
    backoffLimit: 3
    template:
      spec:
        containers:
          - name: processor
            image: myapp/batch-processor:latest
            resources:
              requests:
                cpu: 500m
                memory: 512Mi
              limits:
                cpu: 2000m
                memory: 2Gi
        restartPolicy: Never

  pollingInterval: 30
  successfulJobsHistoryLimit: 5
  failedJobsHistoryLimit: 5
  maxReplicaCount: 50

  triggers:
    - type: rabbitmq
      metadata:
        host: amqp://rabbitmq:5672
        queueName: batch-jobs
        mode: QueueLength
        value: "1"
```

## Cluster Autoscaler

```yaml
# cluster-autoscaler.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/cluster-autoscaler
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-autoscaler
rules:
  - apiGroups: [""]
    resources: ["events", "endpoints"]
    verbs: ["create", "patch"]
  - apiGroups: [""]
    resources: ["pods/eviction"]
    verbs: ["create"]
  - apiGroups: [""]
    resources: ["pods/status"]
    verbs: ["update"]
  - apiGroups: [""]
    resources: ["endpoints"]
    resourceNames: ["cluster-autoscaler"]
    verbs: ["get", "update"]
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["watch", "list", "get", "update"]
  - apiGroups: [""]
    resources: ["namespaces", "pods", "services", "replicationcontrollers", "persistentvolumeclaims", "persistentvolumes"]
    verbs: ["watch", "list", "get"]
  - apiGroups: ["extensions"]
    resources: ["replicasets", "daemonsets"]
    verbs: ["watch", "list", "get"]
  - apiGroups: ["policy"]
    resources: ["poddisruptionbudgets"]
    verbs: ["watch", "list"]
  - apiGroups: ["apps"]
    resources: ["statefulsets", "replicasets", "daemonsets"]
    verbs: ["watch", "list", "get"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses", "csinodes", "csidrivers", "csistoragecapacities"]
    verbs: ["watch", "list", "get"]
  - apiGroups: ["batch", "extensions"]
    resources: ["jobs"]
    verbs: ["get", "list", "watch", "patch"]
  - apiGroups: ["coordination.k8s.io"]
    resources: ["leases"]
    verbs: ["create"]
  - apiGroups: ["coordination.k8s.io"]
    resourceNames: ["cluster-autoscaler"]
    resources: ["leases"]
    verbs: ["get", "update"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cluster-autoscaler
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-autoscaler
subjects:
  - kind: ServiceAccount
    name: cluster-autoscaler
    namespace: kube-system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  labels:
    app: cluster-autoscaler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      priorityClassName: system-cluster-critical
      securityContext:
        runAsNonRoot: true
        runAsUser: 65534
        fsGroup: 65534
      containers:
        - name: cluster-autoscaler
          image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.29.0
          command:
            - ./cluster-autoscaler
            - --v=4
            - --stderrthreshold=info
            - --cloud-provider=aws
            - --skip-nodes-with-local-storage=false
            - --expander=least-waste
            - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/my-cluster
            - --balance-similar-node-groups
            - --scale-down-enabled=true
            - --scale-down-delay-after-add=10m
            - --scale-down-delay-after-delete=0s
            - --scale-down-delay-after-failure=3m
            - --scale-down-unneeded-time=10m
            - --scale-down-utilization-threshold=0.5
            - --max-node-provision-time=15m
            - --max-graceful-termination-sec=600
          resources:
            limits:
              cpu: 200m
              memory: 500Mi
            requests:
              cpu: 100m
              memory: 300Mi
          volumeMounts:
            - name: ssl-certs
              mountPath: /etc/ssl/certs/ca-certificates.crt
              readOnly: true
      volumes:
        - name: ssl-certs
          hostPath:
            path: /etc/ssl/certs/ca-bundle.crt
      nodeSelector:
        kubernetes.io/os: linux
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node-role.kubernetes.io/control-plane
                    operator: DoesNotExist
```

## Pod Disruption Budgets

```yaml
# pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
  namespace: production
spec:
  minAvailable: 2  # Minimum pods that must be available
  selector:
    matchLabels:
      app: api
---
# PDB with percentage
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: worker-pdb
  namespace: production
spec:
  maxUnavailable: 25%  # Maximum percentage unavailable
  selector:
    matchLabels:
      app: worker
---
# PDB for StatefulSet
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: postgres-pdb
  namespace: production
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: postgres
```

## Prometheus Adapter for Custom Metrics

```yaml
# prometheus-adapter-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-adapter-config
  namespace: monitoring
data:
  config.yaml: |
    rules:
      # Custom metrics from Prometheus
      - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
        resources:
          overrides:
            namespace: {resource: "namespace"}
            pod: {resource: "pod"}
        name:
          matches: "^(.*)_total$"
          as: "${1}_per_second"
        metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>)'

      # Queue depth metric
      - seriesQuery: 'rabbitmq_queue_messages{namespace!=""}'
        resources:
          overrides:
            namespace: {resource: "namespace"}
        name:
          matches: "^(.*)$"
          as: "queue_messages_ready"
        metricsQuery: 'sum(<<.Series>>{<<.LabelMatchers>>}) by (<<.GroupBy>>)'

      # Custom application metrics
      - seriesQuery: 'myapp_pending_jobs{namespace!="",pod!=""}'
        resources:
          overrides:
            namespace: {resource: "namespace"}
            pod: {resource: "pod"}
        name:
          matches: "^(.*)$"
          as: "pending_jobs"
        metricsQuery: 'sum(<<.Series>>{<<.LabelMatchers>>}) by (<<.GroupBy>>)'

    externalRules:
      - seriesQuery: 'sqs_queue_messages_visible{}'
        resources: {}
        name:
          matches: "^(.*)$"
          as: "sqs_messages_visible"
        metricsQuery: 'sum(<<.Series>>{<<.LabelMatchers>>})'
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus-adapter
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus-adapter
  template:
    metadata:
      labels:
        app: prometheus-adapter
    spec:
      serviceAccountName: prometheus-adapter
      containers:
        - name: prometheus-adapter
          image: registry.k8s.io/prometheus-adapter/prometheus-adapter:v0.11.1
          args:
            - --secure-port=6443
            - --tls-cert-file=/var/run/serving-cert/serving.crt
            - --tls-private-key-file=/var/run/serving-cert/serving.key
            - --logtostderr=true
            - --prometheus-url=http://prometheus.monitoring.svc.cluster.local:9090
            - --metrics-relist-interval=30s
            - --v=4
            - --config=/etc/adapter/config.yaml
          ports:
            - containerPort: 6443
          volumeMounts:
            - mountPath: /etc/adapter
              name: config
              readOnly: true
            - mountPath: /var/run/serving-cert
              name: serving-cert
              readOnly: true
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
      volumes:
        - name: config
          configMap:
            name: prometheus-adapter-config
        - name: serving-cert
          secret:
            secretName: prometheus-adapter-serving-cert
```

## Goldilocks VPA Recommendations Dashboard

```yaml
# goldilocks.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: goldilocks
  labels:
    goldilocks.fairwinds.com/enabled: "true"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: goldilocks-controller
  namespace: goldilocks
spec:
  replicas: 1
  selector:
    matchLabels:
      app: goldilocks-controller
  template:
    metadata:
      labels:
        app: goldilocks-controller
    spec:
      serviceAccountName: goldilocks-controller
      containers:
        - name: goldilocks
          image: us-docker.pkg.dev/fairwinds-ops/oss/goldilocks:v4.10.0
          command:
            - /goldilocks
            - controller
            - --on-by-default
            - --exclude-namespaces=kube-system
          resources:
            requests:
              cpu: 25m
              memory: 32Mi
            limits:
              cpu: 100m
              memory: 128Mi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: goldilocks-dashboard
  namespace: goldilocks
spec:
  replicas: 1
  selector:
    matchLabels:
      app: goldilocks-dashboard
  template:
    metadata:
      labels:
        app: goldilocks-dashboard
    spec:
      serviceAccountName: goldilocks-dashboard
      containers:
        - name: dashboard
          image: us-docker.pkg.dev/fairwinds-ops/oss/goldilocks:v4.10.0
          command:
            - /goldilocks
            - dashboard
            - --listen-address=0.0.0.0:8080
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 25m
              memory: 32Mi
            limits:
              cpu: 100m
              memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: goldilocks-dashboard
  namespace: goldilocks
spec:
  selector:
    app: goldilocks-dashboard
  ports:
    - port: 80
      targetPort: 8080
```

## CLAUDE.md Integration

```markdown
# Kubernetes Autoscaling

## Commands
- `kubectl get hpa` - List HPAs
- `kubectl describe hpa <name>` - Show HPA details
- `kubectl get vpa` - List VPAs
- `kubectl describe vpa <name>` - Show VPA recommendations
- `kubectl top pods` - Show pod resource usage

## HPA Metrics Types
- `Resource` - CPU/Memory utilization
- `Pods` - Custom metrics from pods
- `Object` - Metrics from other K8s objects
- `External` - External metrics (cloud, queue)

## VPA Modes
- `Auto` - Automatically update pods
- `Recreate` - Recreate pods to update
- `Initial` - Only set on creation
- `Off` - Recommendations only

## KEDA Scalers
- Prometheus, Kafka, RabbitMQ
- AWS SQS, CloudWatch
- PostgreSQL, MySQL, Redis
- Cron (scheduled scaling)

## Best Practices
- Set appropriate min/max replicas
- Use stabilization windows
- Combine HPA with PDB
- Monitor scaling events
```

## AI Suggestions

1. **Add predictive scaling** - ML-based prediction for proactive scaling
2. **Implement cost-aware scaling** - Consider Spot vs On-Demand
3. **Configure multi-metric HPA** - Combine CPU, memory, custom metrics
4. **Add scaling alerts** - Prometheus alerts for scaling events
5. **Implement canary scaling** - Gradual traffic shift during scaling
6. **Configure scale-to-zero** - KEDA for event-driven workloads
7. **Add resource recommendations** - Goldilocks for VPA visualization
8. **Implement cluster over-provisioning** - Faster scaling response
9. **Configure priority-based scaling** - Scale critical workloads first
10. **Add scaling dashboards** - Grafana dashboards for scaling metrics
