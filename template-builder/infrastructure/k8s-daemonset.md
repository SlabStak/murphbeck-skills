# Kubernetes DaemonSet Template

> Production-ready DaemonSet configurations for node-level services like log collectors, monitoring agents, and network plugins

## Overview

This template provides DaemonSet configurations with:
- Node-level daemon deployment
- Update strategies
- Tolerations for all nodes
- Resource management
- Host networking options

## Quick Start

```bash
# Apply DaemonSet
kubectl apply -f daemonset.yaml

# View DaemonSets
kubectl get daemonsets

# Check pod distribution
kubectl get pods -l app=fluent-bit -o wide

# View rollout status
kubectl rollout status daemonset/fluent-bit
```

## Log Collector DaemonSet (Fluent Bit)

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
  labels:
    app.kubernetes.io/name: fluent-bit
    app.kubernetes.io/component: logging
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: fluent-bit
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app.kubernetes.io/name: fluent-bit
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "2020"
        prometheus.io/path: "/api/v1/metrics/prometheus"
    spec:
      serviceAccountName: fluent-bit
      terminationGracePeriodSeconds: 30

      # Run on all nodes including control plane
      tolerations:
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule
        - key: node-role.kubernetes.io/master
          operator: Exists
          effect: NoSchedule
        - operator: Exists
          effect: NoExecute
        - operator: Exists
          effect: NoSchedule

      # Priority class for system components
      priorityClassName: system-node-critical

      containers:
        - name: fluent-bit
          image: fluent/fluent-bit:2.2
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 2020
              protocol: TCP
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: CLUSTER_NAME
              value: "production-cluster"
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          volumeMounts:
            - name: varlog
              mountPath: /var/log
              readOnly: true
            - name: varlibdockercontainers
              mountPath: /var/lib/docker/containers
              readOnly: true
            - name: config
              mountPath: /fluent-bit/etc/
            - name: machine-id
              mountPath: /etc/machine-id
              readOnly: true
          livenessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/v1/health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]

      volumes:
        - name: varlog
          hostPath:
            path: /var/log
        - name: varlibdockercontainers
          hostPath:
            path: /var/lib/docker/containers
        - name: config
          configMap:
            name: fluent-bit-config
        - name: machine-id
          hostPath:
            path: /etc/machine-id
            type: File

      # Node selector
      nodeSelector:
        kubernetes.io/os: linux
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf
        HTTP_Server   On
        HTTP_Listen   0.0.0.0
        HTTP_Port     2020
        Health_Check  On

    [INPUT]
        Name              tail
        Path              /var/log/containers/*.log
        Parser            cri
        Tag               kube.*
        Refresh_Interval  5
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On
        DB                /var/log/flb_kube.db

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Kube_Tag_Prefix     kube.var.log.containers.
        Merge_Log           On
        Merge_Log_Key       log_processed
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off

    [OUTPUT]
        Name            es
        Match           *
        Host            elasticsearch.logging.svc.cluster.local
        Port            9200
        Index           kubernetes
        Type            _doc
        Logstash_Format On
        Retry_Limit     False
        Replace_Dots    On

  parsers.conf: |
    [PARSER]
        Name        cri
        Format      regex
        Regex       ^(?<time>[^ ]+) (?<stream>stdout|stderr) (?<logtag>[^ ]*) (?<log>.*)$
        Time_Key    time
        Time_Format %Y-%m-%dT%H:%M:%S.%L%z
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fluent-bit
  namespace: logging
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: fluent-bit
rules:
  - apiGroups: [""]
    resources: ["namespaces", "pods"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: fluent-bit
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: fluent-bit
subjects:
  - kind: ServiceAccount
    name: fluent-bit
    namespace: logging
```

## Node Exporter DaemonSet

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
  labels:
    app.kubernetes.io/name: node-exporter
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: node-exporter
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app.kubernetes.io/name: node-exporter
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9100"
    spec:
      hostNetwork: true
      hostPID: true
      serviceAccountName: node-exporter
      priorityClassName: system-node-critical

      tolerations:
        - operator: Exists

      securityContext:
        runAsNonRoot: true
        runAsUser: 65534

      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.7.0
          args:
            - --path.procfs=/host/proc
            - --path.sysfs=/host/sys
            - --path.rootfs=/host/root
            - --collector.filesystem.mount-points-exclude=^/(dev|proc|sys|var/lib/docker/.+|var/lib/kubelet/.+)($|/)
            - --collector.filesystem.fs-types-exclude=^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$
          ports:
            - name: metrics
              containerPort: 9100
              hostPort: 9100
              protocol: TCP
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 250m
              memory: 128Mi
          volumeMounts:
            - name: proc
              mountPath: /host/proc
              readOnly: true
            - name: sys
              mountPath: /host/sys
              readOnly: true
            - name: root
              mountPath: /host/root
              mountPropagation: HostToContainer
              readOnly: true
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
              add: ["SYS_TIME"]

      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: sys
          hostPath:
            path: /sys
        - name: root
          hostPath:
            path: /

      nodeSelector:
        kubernetes.io/os: linux
---
apiVersion: v1
kind: Service
metadata:
  name: node-exporter
  namespace: monitoring
  labels:
    app.kubernetes.io/name: node-exporter
spec:
  clusterIP: None
  ports:
    - name: metrics
      port: 9100
      targetPort: metrics
  selector:
    app.kubernetes.io/name: node-exporter
```

## CNI Plugin DaemonSet

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: cilium
  namespace: kube-system
  labels:
    k8s-app: cilium
spec:
  selector:
    matchLabels:
      k8s-app: cilium
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 2
  template:
    metadata:
      labels:
        k8s-app: cilium
    spec:
      hostNetwork: true
      hostPID: false
      serviceAccountName: cilium
      priorityClassName: system-node-critical

      tolerations:
        - operator: Exists

      initContainers:
        - name: mount-cgroup
          image: cilium/cilium:v1.14
          command: ['sh', '-c', 'mount -o remount,rw /sys/fs/cgroup']
          securityContext:
            privileged: true
          volumeMounts:
            - name: cgroup
              mountPath: /sys/fs/cgroup

        - name: clean-cilium-state
          image: cilium/cilium:v1.14
          command:
            - /init-container.sh
          env:
            - name: CILIUM_ALL_STATE
              value: "false"
            - name: CILIUM_BPF_STATE
              value: "true"
          securityContext:
            privileged: true
            capabilities:
              add: ["NET_ADMIN", "SYS_ADMIN", "SYS_MODULE"]
          volumeMounts:
            - name: bpf-maps
              mountPath: /sys/fs/bpf
            - name: cilium-run
              mountPath: /var/run/cilium

      containers:
        - name: cilium-agent
          image: cilium/cilium:v1.14
          command: ["cilium-agent"]
          args:
            - --config-dir=/tmp/cilium/config-map
          env:
            - name: K8S_NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: CILIUM_K8S_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          lifecycle:
            preStop:
              exec:
                command: ["/cni-uninstall.sh"]
          ports:
            - name: peer-service
              containerPort: 4244
              hostPort: 4244
              protocol: TCP
            - name: prometheus
              containerPort: 9962
              hostPort: 9962
              protocol: TCP
            - name: health
              containerPort: 9879
              hostPort: 9879
              protocol: TCP
          resources:
            requests:
              cpu: 100m
              memory: 512Mi
            limits:
              cpu: 4000m
              memory: 4Gi
          securityContext:
            privileged: true
            capabilities:
              add:
                - NET_ADMIN
                - SYS_MODULE
                - SYS_ADMIN
                - SYS_RESOURCE
          volumeMounts:
            - name: bpf-maps
              mountPath: /sys/fs/bpf
              mountPropagation: Bidirectional
            - name: cilium-run
              mountPath: /var/run/cilium
            - name: cni-path
              mountPath: /host/opt/cni/bin
            - name: etc-cni-netd
              mountPath: /host/etc/cni/net.d
            - name: cilium-config-path
              mountPath: /tmp/cilium/config-map
              readOnly: true
            - name: lib-modules
              mountPath: /lib/modules
              readOnly: true
            - name: host-proc-sys-net
              mountPath: /host/proc/sys/net
            - name: host-proc-sys-kernel
              mountPath: /host/proc/sys/kernel
          livenessProbe:
            httpGet:
              path: /healthz
              port: health
              host: "127.0.0.1"
            initialDelaySeconds: 120
            periodSeconds: 30
            timeoutSeconds: 5
          readinessProbe:
            httpGet:
              path: /healthz
              port: health
              host: "127.0.0.1"
            initialDelaySeconds: 5
            periodSeconds: 5

      volumes:
        - name: bpf-maps
          hostPath:
            path: /sys/fs/bpf
            type: DirectoryOrCreate
        - name: cilium-run
          hostPath:
            path: /var/run/cilium
            type: DirectoryOrCreate
        - name: cni-path
          hostPath:
            path: /opt/cni/bin
            type: DirectoryOrCreate
        - name: etc-cni-netd
          hostPath:
            path: /etc/cni/net.d
            type: DirectoryOrCreate
        - name: lib-modules
          hostPath:
            path: /lib/modules
        - name: cgroup
          hostPath:
            path: /sys/fs/cgroup
            type: DirectoryOrCreate
        - name: host-proc-sys-net
          hostPath:
            path: /proc/sys/net
            type: Directory
        - name: host-proc-sys-kernel
          hostPath:
            path: /proc/sys/kernel
            type: Directory
        - name: cilium-config-path
          configMap:
            name: cilium-config

      nodeSelector:
        kubernetes.io/os: linux
```

## GPU Device Plugin DaemonSet

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: nvidia-device-plugin
  namespace: kube-system
  labels:
    k8s-app: nvidia-device-plugin
spec:
  selector:
    matchLabels:
      k8s-app: nvidia-device-plugin
  updateStrategy:
    type: RollingUpdate
  template:
    metadata:
      labels:
        k8s-app: nvidia-device-plugin
    spec:
      priorityClassName: system-node-critical

      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule

      nodeSelector:
        accelerator: nvidia

      containers:
        - name: nvidia-device-plugin
          image: nvcr.io/nvidia/k8s-device-plugin:v0.14.3
          env:
            - name: FAIL_ON_INIT_ERROR
              value: "false"
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
          volumeMounts:
            - name: device-plugin
              mountPath: /var/lib/kubelet/device-plugins
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 100m
              memory: 128Mi

      volumes:
        - name: device-plugin
          hostPath:
            path: /var/lib/kubelet/device-plugins
```

## CLAUDE.md Integration

```markdown
# Kubernetes DaemonSet

## Commands
- `kubectl get daemonsets` - List DaemonSets
- `kubectl describe daemonset <name>` - Show details
- `kubectl rollout status daemonset/<name>` - Check rollout
- `kubectl rollout restart daemonset/<name>` - Restart pods
- `kubectl get pods -l app=<name> -o wide` - View pod distribution

## Update Strategies
- `RollingUpdate` - Gradual pod replacement
- `OnDelete` - Manual pod deletion triggers update

## Tolerations
- Use `operator: Exists` to run on all nodes
- Add specific tolerations for control plane nodes
- Priority class `system-node-critical` for essential daemons

## Common Use Cases
- Log collectors (Fluent Bit, Filebeat)
- Monitoring agents (Node Exporter, Datadog)
- Network plugins (Cilium, Calico)
- Storage drivers (CSI node plugins)
- GPU/device plugins
```

## AI Suggestions

1. **Add pod anti-affinity** - Ensure daemon distribution
2. **Implement canary updates** - Use partition in updateStrategy
3. **Configure resource quotas** - Limit daemon resource usage
4. **Add pod disruption budgets** - Maintain availability
5. **Implement health checks** - Custom health endpoints
6. **Configure log rotation** - Manage host log files
7. **Add node affinity** - Target specific node types
8. **Implement graceful shutdown** - Handle termination signals
9. **Configure network policies** - Restrict daemon network access
10. **Add monitoring dashboards** - Track daemon health
