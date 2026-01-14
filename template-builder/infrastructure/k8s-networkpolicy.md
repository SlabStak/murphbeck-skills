# Kubernetes NetworkPolicy Template

> Production-ready NetworkPolicy configurations for micro-segmentation and zero-trust networking

## Overview

This template provides NetworkPolicy configurations with:
- Default deny policies
- Namespace isolation
- Pod-to-pod communication rules
- Egress restrictions
- CIDR-based rules

## Quick Start

```bash
# Apply NetworkPolicy
kubectl apply -f networkpolicy.yaml

# View NetworkPolicies
kubectl get networkpolicies

# Describe policy
kubectl describe networkpolicy default-deny

# Test connectivity
kubectl exec -it test-pod -- nc -zv target-service 80
```

## Default Deny Policies

```yaml
# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}  # Applies to all pods
  policyTypes:
    - Ingress
---
# Default deny all egress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
---
# Default deny all (ingress and egress)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

## Allow Specific Traffic

```yaml
# Allow ingress from specific pods
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow-frontend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
---
# Allow ingress from multiple sources
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-ingress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
  ingress:
    # From frontend pods
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080

    # From monitoring namespace
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
          podSelector:
            matchLabels:
              app: prometheus
      ports:
        - protocol: TCP
          port: 9090

    # From specific CIDR (internal network)
    - from:
        - ipBlock:
            cidr: 10.0.0.0/8
            except:
              - 10.0.1.0/24  # Exclude subnet
      ports:
        - protocol: TCP
          port: 8080
```

## Database Access Policy

```yaml
# Allow database access from API only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-access
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # From API pods only
    - from:
        - podSelector:
            matchLabels:
              app: api
      ports:
        - protocol: TCP
          port: 5432

    # From backup jobs
    - from:
        - podSelector:
            matchLabels:
              app: backup
      ports:
        - protocol: TCP
          port: 5432

  egress:
    # Allow DNS
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

## Multi-Tier Application

```yaml
# Frontend policy - allow ingress from anywhere, egress to API only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: frontend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # From ingress controller
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 80
  egress:
    # To API tier
    - to:
        - podSelector:
            matchLabels:
              tier: api
      ports:
        - protocol: TCP
          port: 8080
    # DNS
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
---
# API policy - from frontend, to database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              tier: frontend
      ports:
        - protocol: TCP
          port: 8080
  egress:
    # To database
    - to:
        - podSelector:
            matchLabels:
              tier: database
      ports:
        - protocol: TCP
          port: 5432
    # To cache
    - to:
        - podSelector:
            matchLabels:
              tier: cache
      ports:
        - protocol: TCP
          port: 6379
    # DNS
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
    # External APIs (HTTPS)
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.0.0.0/8
              - 172.16.0.0/12
              - 192.168.0.0/16
      ports:
        - protocol: TCP
          port: 443
---
# Database policy - from API only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      tier: database
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              tier: api
      ports:
        - protocol: TCP
          port: 5432
  egress:
    # DNS only
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

## Namespace Isolation

```yaml
# Deny all traffic from other namespaces
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: namespace-isolation
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    # Only allow from same namespace
    - from:
        - podSelector: {}
---
# Allow specific namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-monitoring-namespace
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    # Same namespace
    - from:
        - podSelector: {}
    # Monitoring namespace
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
    # Ingress namespace
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
```

## Allow DNS Egress

```yaml
# Allow DNS for all pods (usually needed)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

## External Access Policies

```yaml
# Allow egress to specific external services
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external-apis
  namespace: production
spec:
  podSelector:
    matchLabels:
      external-access: "true"
  policyTypes:
    - Egress
  egress:
    # DNS
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53

    # HTTPS to external
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.0.0.0/8
              - 172.16.0.0/12
              - 192.168.0.0/16
      ports:
        - protocol: TCP
          port: 443
---
# Block external egress (internal only)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: internal-only
  namespace: production
spec:
  podSelector:
    matchLabels:
      network: internal
  policyTypes:
    - Egress
  egress:
    # DNS
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53

    # Internal networks only
    - to:
        - ipBlock:
            cidr: 10.0.0.0/8
        - ipBlock:
            cidr: 172.16.0.0/12
        - ipBlock:
            cidr: 192.168.0.0/16
```

## Service Mesh Integration (Cilium)

```yaml
# Cilium Network Policy (L7 aware)
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: api-l7-policy
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: api
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: frontend
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
          rules:
            http:
              - method: GET
                path: "/api/v1/.*"
              - method: POST
                path: "/api/v1/users"
                headers:
                  - "Content-Type: application/json"
---
# Cilium Cluster-Wide Policy
apiVersion: cilium.io/v2
kind: CiliumClusterwideNetworkPolicy
metadata:
  name: deny-external-egress
spec:
  endpointSelector: {}
  egressDeny:
    - toEntities:
        - world
```

## Calico Network Policies

```yaml
# Calico Global Network Policy
apiVersion: projectcalico.org/v3
kind: GlobalNetworkPolicy
metadata:
  name: default-deny
spec:
  selector: all()
  types:
    - Ingress
    - Egress
---
# Calico Network Policy with service accounts
apiVersion: projectcalico.org/v3
kind: NetworkPolicy
metadata:
  name: api-policy
  namespace: production
spec:
  selector: app == 'api'
  ingress:
    - action: Allow
      source:
        serviceAccounts:
          names:
            - frontend-sa
      destination:
        ports:
          - 8080
  egress:
    - action: Allow
      destination:
        selector: app == 'postgres'
        ports:
          - 5432
```

## Monitoring Policies

```yaml
# Allow Prometheus scraping
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-prometheus
  namespace: production
spec:
  podSelector:
    matchLabels:
      prometheus-scrape: "true"
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
          podSelector:
            matchLabels:
              app: prometheus
      ports:
        - protocol: TCP
          port: 9090
        - protocol: TCP
          port: 9100
---
# Allow logging collection
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-logging
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    # Fluentd/Fluent Bit
    - to:
        - namespaceSelector:
            matchLabels:
              name: logging
          podSelector:
            matchLabels:
              app: fluentd
      ports:
        - protocol: TCP
          port: 24224
```

## CLAUDE.md Integration

```markdown
# Kubernetes NetworkPolicies

## Commands
- `kubectl get networkpolicies` - List policies
- `kubectl describe networkpolicy <name>` - Show details
- `kubectl get pods --show-labels` - View pod labels for selectors

## Policy Types
- `Ingress` - Incoming traffic rules
- `Egress` - Outgoing traffic rules

## Selectors
- `podSelector` - Select pods by label
- `namespaceSelector` - Select namespaces by label
- `ipBlock` - CIDR-based selection

## Testing
```bash
# Test connectivity
kubectl exec -it test-pod -- nc -zv target-service 80

# Check DNS
kubectl exec -it test-pod -- nslookup kubernetes

# Verify policy
kubectl get networkpolicy -o yaml
```

## Common Patterns
1. Default deny all → allow specific
2. Namespace isolation
3. Tiered access (frontend→api→db)
4. External egress restrictions
```

## AI Suggestions

1. **Add policy visualization** - Use Cilium Hubble for traffic flow
2. **Implement policy testing** - Automated connectivity tests
3. **Add audit logging** - Log policy violations
4. **Configure fallback rules** - Handle policy failures gracefully
5. **Implement microsegmentation** - Per-service policies
6. **Add L7 policies** - HTTP/gRPC-aware rules with Cilium
7. **Configure DNS policies** - Restrict DNS egress targets
8. **Implement policy inheritance** - Cluster-wide base policies
9. **Add compliance reporting** - Policy compliance dashboards
10. **Configure policy priorities** - Order-dependent rule evaluation
