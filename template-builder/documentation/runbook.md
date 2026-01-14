# Runbook Documentation Template

## Overview
Operational runbook templates for incident response, deployment procedures, and system maintenance with structured troubleshooting guides.

## Quick Start
```bash
mkdir -p docs/runbooks/{incidents,deployments,maintenance}
cp templates/runbook-template.md docs/runbooks/incidents/RB-001-service-outage.md
```

## Incident Response Runbook

### RB-001-service-outage.md
```markdown
# Runbook: Service Outage

| Field | Value |
|-------|-------|
| **Runbook ID** | RB-001 |
| **Service** | API Gateway |
| **Severity** | P1 - Critical |
| **Last Updated** | 2024-01-15 |
| **Owner** | Platform Team |
| **On-Call** | #platform-oncall |

## Overview

This runbook covers response procedures for complete or partial API Gateway outages affecting production traffic.

## Symptoms

- [ ] HTTP 5xx errors from API Gateway
- [ ] Increased latency (>5s response times)
- [ ] Connection timeouts to API endpoints
- [ ] Health check failures in load balancer
- [ ] Alert: `api_gateway_error_rate_high`

## Impact Assessment

| Impact Level | Description | Response Time |
|--------------|-------------|---------------|
| **Critical** | Complete outage, all users affected | Immediate (15 min) |
| **High** | Partial outage, >50% users affected | 30 minutes |
| **Medium** | Degraded performance, <50% affected | 1 hour |
| **Low** | Minor issues, workarounds available | 4 hours |

## Quick Diagnosis

### 1. Check Service Status

```bash
# Check pod status
kubectl get pods -n production -l app=api-gateway

# Check recent events
kubectl get events -n production --sort-by='.lastTimestamp' | grep api-gateway

# Check service endpoints
kubectl get endpoints api-gateway -n production
```

### 2. Check Metrics

```bash
# Query Prometheus for error rate
curl -s "http://prometheus:9090/api/v1/query" \
  --data-urlencode 'query=rate(http_requests_total{status=~"5.."}[5m])'

# Check latency
curl -s "http://prometheus:9090/api/v1/query" \
  --data-urlencode 'query=histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))'
```

### 3. Check Logs

```bash
# Get recent error logs
kubectl logs -n production -l app=api-gateway --since=10m | grep -i error

# Check for OOM events
kubectl logs -n production -l app=api-gateway --previous | grep -i "out of memory"

# Stream live logs
kubectl logs -n production -l app=api-gateway -f
```

## Troubleshooting Steps

### Scenario A: Pods Not Running

**Symptoms:** Pods in CrashLoopBackOff or Pending state

**Steps:**

1. Check pod details:
   ```bash
   kubectl describe pod <pod-name> -n production
   ```

2. Check for resource constraints:
   ```bash
   kubectl top nodes
   kubectl describe nodes | grep -A 5 "Allocated resources"
   ```

3. If resource-related, scale nodes:
   ```bash
   # GKE
   gcloud container clusters resize CLUSTER_NAME --num-nodes=5 --zone=ZONE

   # EKS
   aws eks update-nodegroup-config --cluster-name CLUSTER --nodegroup-name NODE_GROUP --scaling-config minSize=3,maxSize=10,desiredSize=5
   ```

4. Restart deployment:
   ```bash
   kubectl rollout restart deployment/api-gateway -n production
   kubectl rollout status deployment/api-gateway -n production
   ```

### Scenario B: High Error Rate

**Symptoms:** Service running but returning 5xx errors

**Steps:**

1. Check upstream dependencies:
   ```bash
   # Check database connectivity
   kubectl exec -it <pod-name> -n production -- nc -zv postgres-svc 5432

   # Check cache connectivity
   kubectl exec -it <pod-name> -n production -- nc -zv redis-svc 6379
   ```

2. If database issue, check database runbook: [RB-010-database-issues](./RB-010-database-issues.md)

3. If cache issue, check cache runbook: [RB-011-cache-issues](./RB-011-cache-issues.md)

4. Check for rate limiting:
   ```bash
   kubectl logs -n production -l app=api-gateway | grep "rate limit"
   ```

5. If rate limited, increase limits temporarily:
   ```bash
   kubectl set env deployment/api-gateway -n production RATE_LIMIT=10000
   ```

### Scenario C: Memory/CPU Issues

**Symptoms:** High memory usage, OOMKilled pods

**Steps:**

1. Check resource usage:
   ```bash
   kubectl top pods -n production -l app=api-gateway
   ```

2. Check for memory leaks:
   ```bash
   kubectl exec -it <pod-name> -n production -- curl localhost:9090/debug/pprof/heap > heap.prof
   ```

3. Scale horizontally:
   ```bash
   kubectl scale deployment/api-gateway --replicas=10 -n production
   ```

4. If persistent, increase resources:
   ```bash
   kubectl patch deployment api-gateway -n production -p '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","resources":{"limits":{"memory":"4Gi"}}}]}}}}'
   ```

### Scenario D: Network Issues

**Symptoms:** Connection timeouts, DNS failures

**Steps:**

1. Check DNS resolution:
   ```bash
   kubectl exec -it <pod-name> -n production -- nslookup kubernetes.default
   ```

2. Check network policies:
   ```bash
   kubectl get networkpolicies -n production
   kubectl describe networkpolicy <policy-name> -n production
   ```

3. Test connectivity:
   ```bash
   kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash
   # Inside pod: curl -v http://api-gateway.production.svc.cluster.local
   ```

4. Check ingress:
   ```bash
   kubectl get ingress -n production
   kubectl describe ingress api-gateway -n production
   ```

## Mitigation Actions

### Immediate Actions (First 5 minutes)

1. **Acknowledge alert** in PagerDuty/OpsGenie
2. **Join incident channel** #incident-YYYYMMDD
3. **Page additional help** if needed
4. **Enable maintenance page** if complete outage:
   ```bash
   kubectl apply -f k8s/maintenance-mode.yaml
   ```

### Short-term Actions (5-30 minutes)

1. **Rollback if recent deployment:**
   ```bash
   kubectl rollout undo deployment/api-gateway -n production
   kubectl rollout status deployment/api-gateway -n production
   ```

2. **Scale up replicas:**
   ```bash
   kubectl scale deployment/api-gateway --replicas=20 -n production
   ```

3. **Enable circuit breaker:**
   ```bash
   kubectl set env deployment/api-gateway -n production CIRCUIT_BREAKER_ENABLED=true
   ```

### Long-term Actions (Post-incident)

1. Create post-mortem document
2. Update monitoring and alerts
3. Add automated remediation
4. Update this runbook

## Escalation Path

| Time | Action |
|------|--------|
| 0 min | On-call engineer responds |
| 15 min | Escalate to senior engineer |
| 30 min | Escalate to team lead |
| 60 min | Escalate to engineering manager |
| 2 hours | Executive notification |

### Contacts

| Role | Name | Contact |
|------|------|---------|
| Primary On-Call | See PagerDuty | #platform-oncall |
| Secondary On-Call | See PagerDuty | #platform-oncall |
| Team Lead | Jane Doe | @jane.doe |
| Engineering Manager | John Smith | @john.smith |

## Recovery Verification

After mitigation, verify recovery:

1. **Check metrics:**
   ```bash
   # Error rate should be < 0.1%
   curl -s "http://prometheus:9090/api/v1/query" \
     --data-urlencode 'query=rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])'
   ```

2. **Check health endpoints:**
   ```bash
   curl -f https://api.example.com/health
   curl -f https://api.example.com/ready
   ```

3. **Test critical paths:**
   ```bash
   # Authentication
   curl -X POST https://api.example.com/auth/login -d '{"test": true}'

   # Core API
   curl https://api.example.com/api/v1/status
   ```

4. **Verify monitoring:**
   - [ ] Error rate alert cleared
   - [ ] Latency within SLA
   - [ ] All health checks passing

## Post-Incident

1. **Disable maintenance mode:**
   ```bash
   kubectl delete -f k8s/maintenance-mode.yaml
   ```

2. **Update status page:**
   - Incident resolved
   - Services restored

3. **Schedule post-mortem:**
   - Within 48 hours of resolution
   - Invite all responders

4. **Document in incident log:**
   - Timeline of events
   - Actions taken
   - Root cause (if known)

## Related Runbooks

- [RB-002-high-latency](./RB-002-high-latency.md)
- [RB-010-database-issues](./RB-010-database-issues.md)
- [RB-011-cache-issues](./RB-011-cache-issues.md)
- [RB-020-deployment-rollback](./RB-020-deployment-rollback.md)

## Appendix

### Useful Commands

```bash
# Quick health check
./scripts/health-check.sh

# Get all resource status
kubectl get all -n production -l app=api-gateway

# Force pod recreation
kubectl delete pods -n production -l app=api-gateway

# Check recent deployments
kubectl rollout history deployment/api-gateway -n production
```

### Dashboard Links

- [Grafana - API Gateway](https://grafana.example.com/d/api-gateway)
- [Prometheus Alerts](https://prometheus.example.com/alerts)
- [Service Logs](https://logs.example.com/api-gateway)
- [Traces](https://jaeger.example.com/search?service=api-gateway)

### SLA Reference

| Metric | Target | Current |
|--------|--------|---------|
| Availability | 99.9% | [Dashboard](link) |
| P50 Latency | <100ms | [Dashboard](link) |
| P99 Latency | <500ms | [Dashboard](link) |
| Error Rate | <0.1% | [Dashboard](link) |
```

## Deployment Runbook

### RB-020-deployment.md
```markdown
# Runbook: Production Deployment

| Field | Value |
|-------|-------|
| **Runbook ID** | RB-020 |
| **Service** | All Services |
| **Last Updated** | 2024-01-15 |
| **Owner** | DevOps Team |

## Pre-Deployment Checklist

- [ ] All tests passing in CI
- [ ] Code review approved
- [ ] Security scan completed
- [ ] Database migrations tested
- [ ] Feature flags configured
- [ ] Rollback plan documented
- [ ] On-call engineer notified
- [ ] Deployment window confirmed

## Deployment Steps

### 1. Pre-Deployment Verification

```bash
# Verify current state
kubectl get deployments -n production
kubectl get pods -n production

# Check current version
kubectl get deployment api-gateway -n production -o jsonpath='{.spec.template.spec.containers[0].image}'

# Verify no ongoing incidents
curl -s https://status.example.com/api/v1/incidents | jq '.incidents | length'
```

### 2. Deploy to Staging

```bash
# Deploy to staging first
kubectl apply -f k8s/staging/ --dry-run=client
kubectl apply -f k8s/staging/

# Wait for rollout
kubectl rollout status deployment/api-gateway -n staging --timeout=300s

# Run smoke tests
./scripts/smoke-tests.sh staging
```

### 3. Deploy to Production

```bash
# Start deployment
kubectl apply -f k8s/production/

# Monitor rollout
kubectl rollout status deployment/api-gateway -n production --timeout=600s

# Watch pods
watch kubectl get pods -n production -l app=api-gateway
```

### 4. Post-Deployment Verification

```bash
# Health check
curl -f https://api.example.com/health

# Run smoke tests
./scripts/smoke-tests.sh production

# Check metrics
./scripts/check-metrics.sh --threshold=error_rate:0.01
```

## Rollback Procedure

If issues detected:

```bash
# Immediate rollback
kubectl rollout undo deployment/api-gateway -n production

# Verify rollback
kubectl rollout status deployment/api-gateway -n production

# Check version
kubectl get deployment api-gateway -n production -o jsonpath='{.spec.template.spec.containers[0].image}'
```

## Emergency Contacts

| Role | Contact |
|------|---------|
| On-Call | #oncall |
| DevOps Lead | @devops-lead |
```

## Runbook Generator

```typescript
// tools/runbook-generator.ts
import * as fs from 'fs';
import * as path from 'path';

interface RunbookConfig {
  id: string;
  title: string;
  service: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  owner: string;
  type: 'incident' | 'deployment' | 'maintenance';
  symptoms?: string[];
  commands?: string[];
}

class RunbookGenerator {
  private templateDir: string;
  private outputDir: string;

  constructor(templateDir = './templates', outputDir = './docs/runbooks') {
    this.templateDir = templateDir;
    this.outputDir = outputDir;
  }

  generate(config: RunbookConfig): string {
    const template = this.loadTemplate(config.type);
    const content = this.populateTemplate(template, config);

    const filename = `RB-${config.id}-${this.slugify(config.title)}.md`;
    const outputPath = path.join(this.outputDir, config.type + 's', filename);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content);

    return outputPath;
  }

  private loadTemplate(type: string): string {
    const templatePath = path.join(this.templateDir, `runbook-${type}.md`);
    return fs.readFileSync(templatePath, 'utf-8');
  }

  private populateTemplate(template: string, config: RunbookConfig): string {
    return template
      .replace(/\{\{ID\}\}/g, config.id)
      .replace(/\{\{TITLE\}\}/g, config.title)
      .replace(/\{\{SERVICE\}\}/g, config.service)
      .replace(/\{\{SEVERITY\}\}/g, config.severity)
      .replace(/\{\{OWNER\}\}/g, config.owner)
      .replace(/\{\{DATE\}\}/g, new Date().toISOString().split('T')[0])
      .replace(/\{\{SYMPTOMS\}\}/g, this.formatSymptoms(config.symptoms))
      .replace(/\{\{COMMANDS\}\}/g, this.formatCommands(config.commands));
  }

  private formatSymptoms(symptoms?: string[]): string {
    if (!symptoms || symptoms.length === 0) return '- [ ] Symptom 1\n- [ ] Symptom 2';
    return symptoms.map(s => `- [ ] ${s}`).join('\n');
  }

  private formatCommands(commands?: string[]): string {
    if (!commands || commands.length === 0) return '# Add diagnostic commands';
    return commands.map(c => `\`\`\`bash\n${c}\n\`\`\``).join('\n\n');
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^\w]+/g, '-');
  }
}

export { RunbookGenerator };
```

## CLAUDE.md Integration

```markdown
## Runbook Documentation

### Runbook Types
- **Incident** - Response to service issues
- **Deployment** - Release procedures
- **Maintenance** - Scheduled operations

### Required Sections
1. Symptoms and detection
2. Impact assessment
3. Diagnostic commands
4. Step-by-step remediation
5. Escalation path
6. Recovery verification

### Severity Levels
- P1: Critical - Immediate response
- P2: High - 30 minute response
- P3: Medium - 1 hour response
- P4: Low - Next business day

### Commands
- `npm run runbook:new` - Create runbook
- `npm run runbook:index` - Update index
- `npm run runbook:validate` - Check structure
```

## AI Suggestions

1. **Auto-generate runbooks** - Create from incident history
2. **Command validation** - Test commands work
3. **Symptom correlation** - Link symptoms to runbooks
4. **Escalation automation** - Auto-page based on severity
5. **Runbook versioning** - Track changes over time
6. **Integration testing** - Verify diagnostic commands
7. **Metric extraction** - Pull thresholds from monitoring
8. **Link validation** - Check dashboard links work
9. **Template customization** - Build team-specific templates
10. **Search optimization** - Full-text runbook search
