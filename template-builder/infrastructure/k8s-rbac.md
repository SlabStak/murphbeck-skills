# Kubernetes RBAC Template

> Production-ready RBAC configurations for secure access control with least-privilege principles

## Overview

This template provides RBAC configurations with:
- Role and ClusterRole definitions
- RoleBinding and ClusterRoleBinding
- ServiceAccount configurations
- Namespace-scoped permissions
- Aggregated ClusterRoles

## Quick Start

```bash
# Apply RBAC
kubectl apply -f rbac.yaml

# View roles
kubectl get roles,clusterroles

# View bindings
kubectl get rolebindings,clusterrolebindings

# Check permissions
kubectl auth can-i list pods --as=system:serviceaccount:default:my-sa
```

## ServiceAccount Configurations

```yaml
# Application ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
  namespace: production
  labels:
    app.kubernetes.io/name: my-app
automountServiceAccountToken: true
---
# ServiceAccount with image pull secrets
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-with-registry
  namespace: production
imagePullSecrets:
  - name: registry-credentials
secrets:
  - name: app-token
---
# ServiceAccount for CI/CD
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cicd-deployer
  namespace: production
  annotations:
    description: "ServiceAccount for CI/CD deployments"
```

## Namespace-Scoped Roles

```yaml
# Developer Role - read-only access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer
  namespace: production
rules:
  # Read pods, deployments, services
  - apiGroups: [""]
    resources: ["pods", "pods/log", "services", "endpoints", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["batch"]
    resources: ["jobs", "cronjobs"]
    verbs: ["get", "list", "watch"]

  # Exec into pods for debugging
  - apiGroups: [""]
    resources: ["pods/exec", "pods/portforward"]
    verbs: ["create"]
---
# Operator Role - manage deployments
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: operator
  namespace: production
rules:
  # Full access to workloads
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps", "secrets", "persistentvolumeclaims"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets", "daemonsets"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["batch"]
    resources: ["jobs", "cronjobs"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["autoscaling"]
    resources: ["horizontalpodautoscalers"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

  # Scale deployments
  - apiGroups: ["apps"]
    resources: ["deployments/scale", "statefulsets/scale", "replicasets/scale"]
    verbs: ["get", "update", "patch"]

  # Pod debugging
  - apiGroups: [""]
    resources: ["pods/exec", "pods/portforward", "pods/log"]
    verbs: ["create", "get"]
---
# Application Role - minimal permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: production
rules:
  # Read own configmaps
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["my-app-config"]
    verbs: ["get", "watch"]

  # Read secrets (limited)
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["my-app-secrets"]
    verbs: ["get"]

  # Lease for leader election
  - apiGroups: ["coordination.k8s.io"]
    resources: ["leases"]
    verbs: ["get", "create", "update"]
```

## ClusterRoles

```yaml
# Cluster Admin (built-in alternative)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: custom-cluster-admin
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
  - nonResourceURLs: ["*"]
    verbs: ["*"]
---
# Read-only cluster access
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-reader
rules:
  - apiGroups: [""]
    resources: ["namespaces", "nodes", "persistentvolumes"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["storage.k8s.io"]
    resources: ["storageclasses"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["rbac.authorization.k8s.io"]
    resources: ["clusterroles", "clusterrolebindings"]
    verbs: ["get", "list", "watch"]
---
# Namespace admin (can manage within any namespace)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: namespace-admin
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps", "secrets", "persistentvolumeclaims", "serviceaccounts"]
    verbs: ["*"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets", "daemonsets"]
    verbs: ["*"]
  - apiGroups: ["batch"]
    resources: ["jobs", "cronjobs"]
    verbs: ["*"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["ingresses", "networkpolicies"]
    verbs: ["*"]
  - apiGroups: ["autoscaling"]
    resources: ["horizontalpodautoscalers"]
    verbs: ["*"]
  - apiGroups: ["policy"]
    resources: ["poddisruptionbudgets"]
    verbs: ["*"]
---
# CI/CD Deployer
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cicd-deployer
rules:
  # Deployment management
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]

  # ConfigMap and Secret updates
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]

  # Service management
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]

  # Rollout status
  - apiGroups: ["apps"]
    resources: ["deployments/status"]
    verbs: ["get", "watch"]

  # Pod status (for readiness checks)
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
```

## RoleBindings

```yaml
# Bind user to developer role
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: production
subjects:
  - kind: User
    name: developer@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
---
# Bind group to operator role
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: operators-binding
  namespace: production
subjects:
  - kind: Group
    name: platform-team
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: operator
  apiGroup: rbac.authorization.k8s.io
---
# Bind ServiceAccount to app role
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: my-app
    namespace: production
roleRef:
  kind: Role
  name: app-role
  apiGroup: rbac.authorization.k8s.io
```

## ClusterRoleBindings

```yaml
# Bind user to cluster admin
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-binding
subjects:
  - kind: User
    name: admin@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
---
# Bind group to cluster reader
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: readers-binding
subjects:
  - kind: Group
    name: developers
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-reader
  apiGroup: rbac.authorization.k8s.io
---
# Bind ClusterRole to namespace (via RoleBinding)
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: namespace-admin-binding
  namespace: production
subjects:
  - kind: Group
    name: production-team
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: namespace-admin
  apiGroup: rbac.authorization.k8s.io
```

## Aggregated ClusterRoles

```yaml
# Base role with aggregation label
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: custom-metrics-reader
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"
rules:
  - apiGroups: ["custom.metrics.k8s.io"]
    resources: ["*"]
    verbs: ["get", "list", "watch"]
---
# Aggregated role (combines labeled roles)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-role
aggregationRule:
  clusterRoleSelectors:
    - matchLabels:
        rbac.example.com/aggregate-to-monitoring: "true"
rules: []  # Automatically populated
---
# Another role to aggregate
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: logs-reader
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"
rules:
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get", "list", "watch"]
```

## OIDC/External Auth Integration

```yaml
# For OIDC groups (Azure AD, Okta, etc.)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: azure-ad-admins
subjects:
  - kind: Group
    name: "00000000-0000-0000-0000-000000000000"  # Azure AD group ID
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
---
# AWS IAM integration (EKS)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: eks-admins
subjects:
  - kind: Group
    name: eks-admins
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

## Workload Identity

```yaml
# GKE Workload Identity
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
  namespace: production
  annotations:
    iam.gke.io/gcp-service-account: my-app@project-id.iam.gserviceaccount.com
---
# AWS IRSA
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
  namespace: production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/my-app-role
---
# Azure Workload Identity
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app
  namespace: production
  annotations:
    azure.workload.identity/client-id: "00000000-0000-0000-0000-000000000000"
  labels:
    azure.workload.identity/use: "true"
```

## Pod Security with RBAC

```yaml
# Allow using specific PodSecurityPolicy
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: use-restricted-psp
rules:
  - apiGroups: ["policy"]
    resources: ["podsecuritypolicies"]
    resourceNames: ["restricted"]
    verbs: ["use"]
---
# Role for Pod Security Standards
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-security-admin
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["namespaces"]
    verbs: ["get", "patch"]
    # For setting pod-security.kubernetes.io/* labels
```

## Audit Configuration

```yaml
# Audit policy for RBAC
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Log all RBAC changes
  - level: RequestResponse
    resources:
      - group: rbac.authorization.k8s.io
        resources: ["roles", "rolebindings", "clusterroles", "clusterrolebindings"]

  # Log ServiceAccount token requests
  - level: Metadata
    resources:
      - group: ""
        resources: ["serviceaccounts/token"]

  # Log authentication attempts
  - level: Metadata
    users: ["system:anonymous"]

  # Omit health checks
  - level: None
    users: ["system:kube-proxy"]
    verbs: ["watch"]
    resources:
      - group: ""
        resources: ["endpoints", "services"]
```

## CLAUDE.md Integration

```markdown
# Kubernetes RBAC

## Commands
- `kubectl auth can-i <verb> <resource>` - Check current permissions
- `kubectl auth can-i --list` - List all permissions
- `kubectl auth can-i <verb> <resource> --as=<user>` - Impersonate
- `kubectl get clusterroles` - List ClusterRoles
- `kubectl describe rolebinding <name>` - Show binding details

## Permission Verbs
- `get`, `list`, `watch` - Read operations
- `create`, `update`, `patch` - Write operations
- `delete`, `deletecollection` - Delete operations
- `*` - All verbs

## Subject Types
- `User` - Human user (from auth provider)
- `Group` - Group of users
- `ServiceAccount` - Kubernetes ServiceAccount

## Best Practices
1. Use namespace-scoped roles when possible
2. Follow least-privilege principle
3. Use Groups for team access
4. Audit RBAC changes
5. Avoid wildcards in production
```

## AI Suggestions

1. **Add RBAC audit logging** - Track permission changes and access
2. **Implement just-in-time access** - Temporary elevated permissions
3. **Configure break-glass access** - Emergency admin access
4. **Add RBAC visualization** - Graph role relationships
5. **Implement policy enforcement** - OPA/Gatekeeper for RBAC policies
6. **Configure multi-tenancy** - Namespace-based isolation
7. **Add permission reports** - Regular access reviews
8. **Implement token rotation** - Auto-rotate ServiceAccount tokens
9. **Configure impersonation** - Controlled user impersonation
10. **Add RBAC testing** - Automated permission tests
