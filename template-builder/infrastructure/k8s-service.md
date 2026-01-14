# Kubernetes Service Template

> Production-ready Service configurations for load balancing, service discovery, and external access

## Overview

This template provides Service configurations with:
- ClusterIP, NodePort, LoadBalancer types
- Headless services for StatefulSets
- External name services
- Service mesh integration
- Multi-port configurations

## Quick Start

```bash
# Apply Service
kubectl apply -f service.yaml

# View Services
kubectl get services

# Describe Service
kubectl describe service my-app

# Test service DNS
kubectl run test --rm -it --image=busybox -- nslookup my-app
```

## ClusterIP Service (Internal)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: production
  labels:
    app.kubernetes.io/name: api
    app.kubernetes.io/component: backend
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9090"
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: api
  ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
    - name: grpc
      port: 9000
      targetPort: 9000
      protocol: TCP
    - name: metrics
      port: 9090
      targetPort: 9090
      protocol: TCP
  sessionAffinity: None
---
# Service with session affinity
apiVersion: v1
kind: Service
metadata:
  name: stateful-api
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: stateful-api
  ports:
    - port: 80
      targetPort: 8080
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
```

## LoadBalancer Service (External)

```yaml
# AWS Network Load Balancer
apiVersion: v1
kind: Service
metadata:
  name: api-external
  namespace: production
  annotations:
    # AWS NLB
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"

    # Health check
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: /health
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-interval: "30"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-timeout: "10"

    # SSL/TLS
    service.beta.kubernetes.io/aws-load-balancer-ssl-cert: arn:aws:acm:us-east-1:123456789:certificate/xxx
    service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "443"
    service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS13-1-2-2021-06

    # Access logs
    service.beta.kubernetes.io/aws-load-balancer-access-log-enabled: "true"
    service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-name: my-lb-logs
    service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-prefix: api
spec:
  type: LoadBalancer
  loadBalancerClass: service.k8s.aws/nlb
  selector:
    app: api
  ports:
    - name: https
      port: 443
      targetPort: 8080
      protocol: TCP
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
  externalTrafficPolicy: Local  # Preserve client IP
  healthCheckNodePort: 30000
---
# GCP Load Balancer
apiVersion: v1
kind: Service
metadata:
  name: api-gcp
  namespace: production
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
    cloud.google.com/backend-config: '{"default": "api-backend-config"}'
    networking.gke.io/load-balancer-type: "External"
spec:
  type: LoadBalancer
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
---
# Azure Load Balancer
apiVersion: v1
kind: Service
metadata:
  name: api-azure
  namespace: production
  annotations:
    service.beta.kubernetes.io/azure-load-balancer-internal: "false"
    service.beta.kubernetes.io/azure-load-balancer-health-probe-request-path: /health
spec:
  type: LoadBalancer
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
```

## NodePort Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-nodeport
  namespace: production
spec:
  type: NodePort
  selector:
    app: api
  ports:
    - name: http
      port: 80
      targetPort: 8080
      nodePort: 30080  # 30000-32767
    - name: https
      port: 443
      targetPort: 8443
      nodePort: 30443
  externalTrafficPolicy: Local
```

## Headless Service (StatefulSet)

```yaml
# Headless service for StatefulSet
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
  namespace: production
  labels:
    app: postgres
spec:
  type: ClusterIP
  clusterIP: None  # Headless
  publishNotReadyAddresses: true  # Include unready pods in DNS
  selector:
    app: postgres
  ports:
    - name: postgres
      port: 5432
      targetPort: 5432
---
# Regular service for client connections
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: postgres
    role: primary
  ports:
    - name: postgres
      port: 5432
      targetPort: 5432
---
# Read replica service
apiVersion: v1
kind: Service
metadata:
  name: postgres-read
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: postgres
    role: replica
  ports:
    - name: postgres
      port: 5432
      targetPort: 5432
```

## ExternalName Service

```yaml
# External database
apiVersion: v1
kind: Service
metadata:
  name: external-db
  namespace: production
spec:
  type: ExternalName
  externalName: mydb.abc123.us-east-1.rds.amazonaws.com
---
# External API
apiVersion: v1
kind: Service
metadata:
  name: external-api
  namespace: production
spec:
  type: ExternalName
  externalName: api.external-service.com
```

## External IPs Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-external-ip
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
  externalIPs:
    - 192.168.1.100
    - 192.168.1.101
```

## Multi-Port Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: full-stack-app
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: full-stack
  ports:
    - name: web
      port: 80
      targetPort: 3000
      protocol: TCP
    - name: api
      port: 8080
      targetPort: 8080
      protocol: TCP
    - name: grpc
      port: 9000
      targetPort: 9000
      protocol: TCP
    - name: metrics
      port: 9090
      targetPort: 9090
      protocol: TCP
    - name: debug
      port: 40000
      targetPort: 40000
      protocol: TCP
```

## Internal Load Balancer

```yaml
# AWS Internal NLB
apiVersion: v1
kind: Service
metadata:
  name: internal-api
  namespace: production
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    service.beta.kubernetes.io/aws-load-balancer-internal: "true"
    service.beta.kubernetes.io/aws-load-balancer-scheme: internal
spec:
  type: LoadBalancer
  selector:
    app: internal-api
  ports:
    - port: 80
      targetPort: 8080
---
# GCP Internal Load Balancer
apiVersion: v1
kind: Service
metadata:
  name: internal-api-gcp
  namespace: production
  annotations:
    networking.gke.io/load-balancer-type: "Internal"
    networking.gke.io/internal-load-balancer-allow-global-access: "true"
spec:
  type: LoadBalancer
  selector:
    app: internal-api
  ports:
    - port: 80
      targetPort: 8080
---
# Azure Internal Load Balancer
apiVersion: v1
kind: Service
metadata:
  name: internal-api-azure
  namespace: production
  annotations:
    service.beta.kubernetes.io/azure-load-balancer-internal: "true"
spec:
  type: LoadBalancer
  selector:
    app: internal-api
  ports:
    - port: 80
      targetPort: 8080
```

## Service with Topology Awareness

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-topology-aware
  namespace: production
  annotations:
    # Prefer same zone/node routing
    service.kubernetes.io/topology-aware-hints: auto
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
  internalTrafficPolicy: Local  # Prefer local pods
```

## Service Mesh (Istio)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: production
  labels:
    app: api
    version: v1
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
    - name: http
      port: 80
      targetPort: 8080
    - name: grpc
      port: 9000
      targetPort: 9000
---
# Istio Virtual Service for traffic routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: api
  namespace: production
spec:
  hosts:
    - api
  http:
    - match:
        - headers:
            x-version:
              exact: v2
      route:
        - destination:
            host: api
            subset: v2
    - route:
        - destination:
            host: api
            subset: v1
          weight: 90
        - destination:
            host: api
            subset: v2
          weight: 10
---
# Istio Destination Rule
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: api
  namespace: production
spec:
  host: api
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    loadBalancer:
      simple: ROUND_ROBIN
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

## Monitoring Service Endpoints

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: api-monitor
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: api
  namespaceSelector:
    matchNames:
      - production
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
      scheme: http
```

## CLAUDE.md Integration

```markdown
# Kubernetes Services

## Commands
- `kubectl get services` - List services
- `kubectl describe service <name>` - Show details
- `kubectl get endpoints <name>` - View endpoints
- `kubectl port-forward svc/<name> 8080:80` - Port forward

## Service Types
- `ClusterIP` - Internal only (default)
- `NodePort` - Expose on node port
- `LoadBalancer` - Cloud load balancer
- `ExternalName` - DNS CNAME

## Service Discovery
- DNS: `<service>.<namespace>.svc.cluster.local`
- Environment variables: `<SERVICE>_SERVICE_HOST`

## Session Affinity
- `None` - Random pod selection
- `ClientIP` - Sticky sessions by IP

## Traffic Policies
- `externalTrafficPolicy: Cluster` - Load across all pods
- `externalTrafficPolicy: Local` - Preserve client IP
```

## AI Suggestions

1. **Add service mesh** - Implement Istio/Linkerd
2. **Configure circuit breaking** - Prevent cascade failures
3. **Add rate limiting** - Per-service rate limits
4. **Implement canary routing** - Traffic splitting
5. **Configure mTLS** - Service-to-service encryption
6. **Add service discovery** - External service catalog
7. **Implement retries** - Automatic retry policies
8. **Configure timeouts** - Request timeout policies
9. **Add health checks** - Custom health endpoints
10. **Implement tracing** - Distributed request tracing
