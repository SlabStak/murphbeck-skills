# Kubernetes StatefulSet Template

> Production-ready StatefulSet configurations for stateful applications like databases and message queues

## Overview

This template provides StatefulSet configurations with:
- Ordered pod deployment and scaling
- Stable network identities
- Persistent volume claims
- Pod management policies
- Headless services

## Quick Start

```bash
# Apply StatefulSet
kubectl apply -f statefulset.yaml

# Check pod status
kubectl get pods -l app=my-db

# Scale StatefulSet
kubectl scale statefulset my-db --replicas=5
```

## StatefulSet Configuration

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: production
  labels:
    app.kubernetes.io/name: postgres
    app.kubernetes.io/component: database
spec:
  serviceName: postgres-headless
  replicas: 3
  podManagementPolicy: OrderedReady  # or Parallel
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: postgres
  template:
    metadata:
      labels:
        app.kubernetes.io/name: postgres
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9187"
    spec:
      serviceAccountName: postgres
      terminationGracePeriodSeconds: 120

      securityContext:
        runAsNonRoot: true
        runAsUser: 999
        fsGroup: 999
        seccompProfile:
          type: RuntimeDefault

      # Anti-affinity for HA
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app.kubernetes.io/name: postgres
              topologyKey: kubernetes.io/hostname

      initContainers:
        - name: init-permissions
          image: busybox:1.36
          command: ['sh', '-c', 'chown -R 999:999 /var/lib/postgresql/data']
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
          securityContext:
            runAsUser: 0

      containers:
        - name: postgres
          image: postgres:16-alpine
          imagePullPolicy: IfNotPresent
          ports:
            - name: postgres
              containerPort: 5432
              protocol: TCP
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: username
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: password
            - name: POSTGRES_DB
              value: "myapp"
            - name: PGDATA
              value: "/var/lib/postgresql/data/pgdata"
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 4Gi
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
            - name: config
              mountPath: /etc/postgresql
            - name: shm
              mountPath: /dev/shm
          livenessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - $(POSTGRES_USER)
                - -d
                - $(POSTGRES_DB)
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 6
          readinessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - $(POSTGRES_USER)
                - -d
                - $(POSTGRES_DB)
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: false
            capabilities:
              drop: ["ALL"]

        # Metrics exporter sidecar
        - name: postgres-exporter
          image: prometheuscommunity/postgres-exporter:latest
          ports:
            - name: metrics
              containerPort: 9187
          env:
            - name: DATA_SOURCE_URI
              value: "localhost:5432/myapp?sslmode=disable"
            - name: DATA_SOURCE_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: username
            - name: DATA_SOURCE_PASS
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: password
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 100m
              memory: 128Mi

      volumes:
        - name: config
          configMap:
            name: postgres-config
        - name: shm
          emptyDir:
            medium: Memory
            sizeLimit: 256Mi

  volumeClaimTemplates:
    - metadata:
        name: data
        labels:
          app.kubernetes.io/name: postgres
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 100Gi
```

## Headless Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
  namespace: production
  labels:
    app.kubernetes.io/name: postgres
spec:
  type: ClusterIP
  clusterIP: None
  publishNotReadyAddresses: true
  ports:
    - name: postgres
      port: 5432
      targetPort: postgres
  selector:
    app.kubernetes.io/name: postgres
---
# Regular service for client connections
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: production
  labels:
    app.kubernetes.io/name: postgres
spec:
  type: ClusterIP
  ports:
    - name: postgres
      port: 5432
      targetPort: postgres
    - name: metrics
      port: 9187
      targetPort: metrics
  selector:
    app.kubernetes.io/name: postgres
```

## ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: production
data:
  postgresql.conf: |
    # Connection Settings
    listen_addresses = '*'
    max_connections = 200

    # Memory Settings
    shared_buffers = 1GB
    effective_cache_size = 3GB
    maintenance_work_mem = 256MB
    work_mem = 16MB

    # Write Ahead Log
    wal_level = replica
    max_wal_senders = 3
    max_replication_slots = 3
    wal_keep_size = 256MB

    # Query Tuning
    random_page_cost = 1.1
    effective_io_concurrency = 200
    default_statistics_target = 100

    # Logging
    logging_collector = on
    log_directory = 'pg_log'
    log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
    log_min_duration_statement = 1000
    log_checkpoints = on
    log_connections = on
    log_disconnections = on
    log_lock_waits = on

    # Autovacuum
    autovacuum_max_workers = 3
    autovacuum_vacuum_scale_factor = 0.05
    autovacuum_analyze_scale_factor = 0.05

  pg_hba.conf: |
    local   all             all                                     trust
    host    all             all             127.0.0.1/32            md5
    host    all             all             ::1/128                 md5
    host    all             all             10.0.0.0/8              md5
    host    replication     all             10.0.0.0/8              md5
```

## Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: postgres-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: postgres
```

## StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs  # or gce-pd, azure-disk
parameters:
  type: gp3  # AWS
  iopsPerGB: "50"
  encrypted: "true"
  # type: pd-ssd  # GCP
  # type: Premium_LRS  # Azure
reclaimPolicy: Retain
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
```

## CLAUDE.md Integration

```markdown
# Kubernetes StatefulSet

## Commands
- `kubectl get statefulset` - List StatefulSets
- `kubectl describe statefulset postgres` - Show details
- `kubectl scale statefulset postgres --replicas=5` - Scale
- `kubectl rollout status statefulset postgres` - Rollout status
- `kubectl delete pod postgres-0` - Delete specific pod (recreated)

## Pod Naming
- Pods are named `<statefulset>-<ordinal>` (e.g., postgres-0, postgres-1)
- DNS: `<pod>.<service>.<namespace>.svc.cluster.local`

## Scaling
- Scale up: Pods created in order (0, 1, 2...)
- Scale down: Pods deleted in reverse order
- `podManagementPolicy: Parallel` for parallel operations

## Data Persistence
- Each pod gets its own PVC
- PVCs survive pod deletion
- Manual PVC cleanup required on StatefulSet deletion
```

## AI Suggestions

1. **Add replication setup** - Configure primary/replica with Patroni
2. **Implement backup CronJob** - Add scheduled backups to S3/GCS
3. **Add connection pooling** - Deploy PgBouncer as sidecar
4. **Configure monitoring** - Add Grafana dashboards for Postgres
5. **Implement failover** - Add automatic failover with Patroni
6. **Add init container for restore** - Support point-in-time recovery
7. **Configure WAL archiving** - Archive to object storage
8. **Add resource tuning** - Auto-tune based on available resources
9. **Implement TLS** - Enable encrypted connections
10. **Add logical replication** - Support cross-cluster replication
