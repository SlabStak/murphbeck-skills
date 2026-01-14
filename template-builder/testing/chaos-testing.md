# Chaos Testing Templates

Production-ready chaos engineering patterns for resilience testing and failure injection.

## Overview

- **Chaos Monkey**: Random service termination
- **Network Chaos**: Latency, packet loss, partitions
- **Resource Chaos**: CPU, memory, disk pressure
- **Application Chaos**: Exception injection, state corruption

## Quick Start

```bash
# Chaos Toolkit
pip install chaostoolkit chaostoolkit-kubernetes chaostoolkit-aws

# Gremlin CLI
brew install gremlin/tap/gremlin

# LitmusChaos (Kubernetes)
kubectl apply -f https://litmuschaos.github.io/litmus/litmus-operator-v2.0.0.yaml

# Toxiproxy
brew install toxiproxy
```

## Chaos Toolkit Experiments

```yaml
# experiments/pod-kill.yaml
---
title: "Kill random pod"
description: "Verify application survives pod termination"
tags:
  - kubernetes
  - resilience

configuration:
  namespace:
    type: env
    key: CHAOS_NAMESPACE
    default: "default"

steady-state-hypothesis:
  title: "Application is healthy"
  probes:
    - name: "api-responds"
      type: probe
      tolerance: 200
      provider:
        type: http
        url: "http://api.${namespace}.svc.cluster.local/health"
        timeout: 5

    - name: "pods-running"
      type: probe
      tolerance: true
      provider:
        type: python
        module: chaosk8s.pod.probes
        func: pods_in_phase
        arguments:
          label_selector: "app=myapp"
          phase: "Running"
          ns: "${namespace}"

method:
  - name: "terminate-pod"
    type: action
    provider:
      type: python
      module: chaosk8s.pod.actions
      func: terminate_pods
      arguments:
        label_selector: "app=myapp"
        ns: "${namespace}"
        qty: 1
        rand: true
    pauses:
      after: 30

rollbacks:
  - name: "scale-up-if-needed"
    type: action
    provider:
      type: python
      module: chaosk8s.deployment.actions
      func: scale_deployment
      arguments:
        name: "myapp"
        replicas: 3
        ns: "${namespace}"
```

```yaml
# experiments/network-latency.yaml
---
title: "Inject network latency"
description: "Verify application handles slow network"
tags:
  - network
  - latency

configuration:
  target_service:
    type: env
    key: TARGET_SERVICE
    default: "database"

steady-state-hypothesis:
  title: "Application responds within SLA"
  probes:
    - name: "response-time-acceptable"
      type: probe
      tolerance:
        type: range
        range: [0, 2000]
      provider:
        type: python
        module: chaoslib.probes
        func: http_response_time
        arguments:
          url: "http://api.default.svc.cluster.local/users"
          timeout: 10

method:
  - name: "inject-latency"
    type: action
    provider:
      type: python
      module: chaosk8s.network.actions
      func: add_latency
      arguments:
        label_selector: "app=${target_service}"
        latency: "500ms"
        duration: "60s"
    pauses:
      after: 70

  - name: "verify-graceful-degradation"
    type: probe
    provider:
      type: http
      url: "http://api.default.svc.cluster.local/health"
      timeout: 10
```

```yaml
# experiments/zone-failure.yaml
---
title: "Simulate availability zone failure"
description: "Verify multi-AZ resilience"
tags:
  - aws
  - availability

configuration:
  target_az:
    type: env
    key: TARGET_AZ
    default: "us-east-1a"

steady-state-hypothesis:
  title: "Service remains available"
  probes:
    - name: "service-healthy"
      type: probe
      tolerance: true
      provider:
        type: python
        module: chaosaws.elbv2.probes
        func: targets_health_count
        arguments:
          target_group_names: ["myapp-tg"]
          count: 2
          state: "healthy"

method:
  - name: "fail-az-instances"
    type: action
    provider:
      type: python
      module: chaosaws.ec2.actions
      func: stop_instances
      arguments:
        az: "${target_az}"
        filters:
          - name: "tag:Application"
            values: ["myapp"]
    pauses:
      after: 60

rollbacks:
  - name: "restart-instances"
    type: action
    provider:
      type: python
      module: chaosaws.ec2.actions
      func: start_instances
      arguments:
        az: "${target_az}"
        filters:
          - name: "tag:Application"
            values: ["myapp"]
```

## LitmusChaos Kubernetes

```yaml
# litmus/pod-delete-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: myapp-pod-delete
  namespace: default
spec:
  engineState: "active"
  appinfo:
    appns: "default"
    applabel: "app=myapp"
    appkind: "deployment"
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "30"
            - name: CHAOS_INTERVAL
              value: "10"
            - name: FORCE
              value: "false"
            - name: PODS_AFFECTED_PERC
              value: "50"
        probe:
          - name: "check-application-health"
            type: "httpProbe"
            mode: "Continuous"
            runProperties:
              probeTimeout: 5
              retry: 3
              interval: 5
            httpProbe/inputs:
              url: "http://myapp.default.svc.cluster.local/health"
              insecureSkipVerify: false
              method:
                get:
                  criteria: "=="
                  responseCode: "200"
```

```yaml
# litmus/network-chaos-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: myapp-network-chaos
  namespace: default
spec:
  engineState: "active"
  appinfo:
    appns: "default"
    applabel: "app=myapp"
    appkind: "deployment"
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-network-latency
      spec:
        components:
          env:
            - name: NETWORK_INTERFACE
              value: "eth0"
            - name: NETWORK_LATENCY
              value: "300"
            - name: TOTAL_CHAOS_DURATION
              value: "60"
            - name: CONTAINER_RUNTIME
              value: "containerd"
        probe:
          - name: "latency-sli-check"
            type: "promProbe"
            mode: "Edge"
            runProperties:
              probeTimeout: 5
              retry: 2
              interval: 5
            promProbe/inputs:
              endpoint: "http://prometheus:9090"
              query: "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))"
              comparator:
                type: "float"
                criteria: "<="
                value: "2.0"
```

```yaml
# litmus/cpu-stress-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: myapp-cpu-stress
  namespace: default
spec:
  engineState: "active"
  appinfo:
    appns: "default"
    applabel: "app=myapp"
    appkind: "deployment"
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-cpu-hog
      spec:
        components:
          env:
            - name: CPU_CORES
              value: "2"
            - name: TOTAL_CHAOS_DURATION
              value: "60"
            - name: CPU_LOAD
              value: "80"
            - name: PODS_AFFECTED_PERC
              value: "100"
        probe:
          - name: "cpu-usage-check"
            type: "cmdProbe"
            mode: "Edge"
            runProperties:
              probeTimeout: 10
              retry: 2
              interval: 5
            cmdProbe/inputs:
              command: "kubectl top pods -l app=myapp -n default | awk 'NR>1 {print $2}' | sed 's/m//' | awk '{sum+=$1} END {print sum/NR}'"
              comparator:
                type: "int"
                criteria: "<="
                value: "500"
```

## Toxiproxy Network Chaos

```go
// chaos/toxiproxy_test.go
package chaos

import (
	"context"
	"net/http"
	"testing"
	"time"

	toxiproxy "github.com/Shopify/toxiproxy/v2/client"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDatabaseLatency(t *testing.T) {
	client := toxiproxy.NewClient("localhost:8474")

	// Create proxy
	proxy, err := client.CreateProxy("postgres", "localhost:25432", "postgres:5432")
	require.NoError(t, err)
	defer proxy.Delete()

	// Add latency toxic
	_, err = proxy.AddToxic("latency", "latency", "downstream", 1.0, toxiproxy.Attributes{
		"latency": 500,
		"jitter":  100,
	})
	require.NoError(t, err)

	// Test application behavior
	start := time.Now()
	resp, err := makeAPIRequest("/users")
	duration := time.Since(start)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.True(t, duration > 500*time.Millisecond, "Expected latency to be injected")
	assert.True(t, duration < 5*time.Second, "Request should not timeout")
}

func TestDatabaseConnectionReset(t *testing.T) {
	client := toxiproxy.NewClient("localhost:8474")

	proxy, err := client.CreateProxy("postgres", "localhost:25432", "postgres:5432")
	require.NoError(t, err)
	defer proxy.Delete()

	// Add reset_peer toxic to simulate connection drops
	_, err = proxy.AddToxic("reset", "reset_peer", "downstream", 0.3, toxiproxy.Attributes{
		"timeout": 1000,
	})
	require.NoError(t, err)

	// Test retry logic
	var successCount int
	for i := 0; i < 10; i++ {
		resp, err := makeAPIRequest("/users")
		if err == nil && resp.StatusCode == http.StatusOK {
			successCount++
		}
	}

	// Application should handle failures gracefully
	assert.True(t, successCount >= 5, "Application should recover from connection resets")
}

func TestServiceTimeout(t *testing.T) {
	client := toxiproxy.NewClient("localhost:8474")

	proxy, err := client.CreateProxy("external-api", "localhost:28080", "api.external.com:443")
	require.NoError(t, err)
	defer proxy.Delete()

	// Add timeout toxic
	_, err = proxy.AddToxic("timeout", "timeout", "downstream", 1.0, toxiproxy.Attributes{
		"timeout": 30000, // 30 seconds - longer than client timeout
	})
	require.NoError(t, err)

	// Test timeout handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := makeAPIRequestWithContext(ctx, "/external-data")

	// Application should timeout gracefully
	assert.Error(t, err)
	assert.Nil(t, resp)
}

func TestBandwidthLimiting(t *testing.T) {
	client := toxiproxy.NewClient("localhost:8474")

	proxy, err := client.CreateProxy("storage", "localhost:29000", "storage:9000")
	require.NoError(t, err)
	defer proxy.Delete()

	// Add bandwidth toxic (1KB/s)
	_, err = proxy.AddToxic("bandwidth", "bandwidth", "downstream", 1.0, toxiproxy.Attributes{
		"rate": 1024,
	})
	require.NoError(t, err)

	// Test large file download with rate limiting
	start := time.Now()
	resp, err := makeAPIRequest("/download/large-file")
	duration := time.Since(start)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	// File download should be slow but complete
}
```

## Python Chaos Testing

```python
# chaos/test_resilience.py
"""Chaos testing with failure injection."""
import asyncio
import random
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import pytest
import httpx
from unittest.mock import patch, AsyncMock


class ChaosMonkey:
    """Chaos monkey for injecting failures."""

    def __init__(self, failure_rate: float = 0.3):
        self.failure_rate = failure_rate
        self.failures_injected = 0

    def maybe_fail(self, failure_type: str = "exception"):
        """Randomly inject failure."""
        if random.random() < self.failure_rate:
            self.failures_injected += 1
            if failure_type == "exception":
                raise RuntimeError("Chaos monkey exception")
            elif failure_type == "timeout":
                raise asyncio.TimeoutError("Chaos monkey timeout")
            elif failure_type == "connection":
                raise ConnectionError("Chaos monkey connection error")

    @asynccontextmanager
    async def latency(
        self, min_ms: int = 100, max_ms: int = 1000
    ) -> AsyncGenerator[None, None]:
        """Inject random latency."""
        if random.random() < self.failure_rate:
            delay = random.randint(min_ms, max_ms) / 1000
            await asyncio.sleep(delay)
        yield


class TestServiceResilience:
    """Tests for service resilience under chaos."""

    @pytest.fixture
    def chaos_monkey(self):
        return ChaosMonkey(failure_rate=0.5)

    @pytest.mark.asyncio
    async def test_handles_random_exceptions(self, chaos_monkey, client):
        """Test service handles random exceptions."""
        success_count = 0
        error_count = 0

        with patch("app.services.external_api.fetch") as mock_fetch:
            async def chaotic_fetch(*args, **kwargs):
                chaos_monkey.maybe_fail("exception")
                return {"data": "success"}

            mock_fetch.side_effect = chaotic_fetch

            for _ in range(100):
                try:
                    response = await client.get("/api/data")
                    if response.status_code == 200:
                        success_count += 1
                except Exception:
                    error_count += 1

        # Service should gracefully handle failures
        assert success_count > 30, "Too few successful requests"
        assert error_count < 70, "Too many errors propagated"

    @pytest.mark.asyncio
    async def test_handles_timeouts(self, chaos_monkey, client):
        """Test service handles timeouts gracefully."""
        with patch("app.services.database.query") as mock_query:
            async def chaotic_query(*args, **kwargs):
                async with chaos_monkey.latency(500, 5000):
                    return {"result": []}

            mock_query.side_effect = chaotic_query

            response = await client.get(
                "/api/users",
                timeout=httpx.Timeout(2.0),
            )

            # Should return cached data or error gracefully
            assert response.status_code in [200, 503, 504]

    @pytest.mark.asyncio
    async def test_circuit_breaker_activates(self, client):
        """Test circuit breaker activates under sustained failures."""
        with patch("app.services.external_api.fetch") as mock_fetch:
            mock_fetch.side_effect = ConnectionError("Service unavailable")

            # Make many requests to trigger circuit breaker
            responses = []
            for _ in range(20):
                try:
                    response = await client.get("/api/external")
                    responses.append(response.status_code)
                except Exception:
                    responses.append(503)

            # Circuit breaker should open, returning fast failures
            # Initial failures + fast circuit breaker responses
            assert responses.count(503) > 15


class TestDatabaseResilience:
    """Tests for database resilience."""

    @pytest.mark.asyncio
    async def test_connection_pool_exhaustion(self, client, db_pool):
        """Test behavior when connection pool is exhausted."""
        # Hold all connections
        connections = []
        for _ in range(db_pool.max_size):
            conn = await db_pool.acquire()
            connections.append(conn)

        try:
            # Request should timeout waiting for connection
            response = await client.get("/api/users", timeout=httpx.Timeout(2.0))
            assert response.status_code in [503, 504]
        finally:
            for conn in connections:
                await db_pool.release(conn)

    @pytest.mark.asyncio
    async def test_read_replica_failover(self, client):
        """Test failover to primary when read replica fails."""
        with patch("app.db.read_replica") as mock_replica:
            mock_replica.query.side_effect = ConnectionError("Replica down")

            response = await client.get("/api/users")

            # Should fallback to primary
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_database_slow_queries(self, client):
        """Test handling of slow database queries."""
        with patch("app.db.execute") as mock_execute:
            async def slow_query(*args, **kwargs):
                await asyncio.sleep(5)  # 5 second query
                return []

            mock_execute.side_effect = slow_query

            # Request should timeout, not hang
            response = await client.get(
                "/api/reports",
                timeout=httpx.Timeout(3.0),
            )

            assert response.status_code in [504, 503]


class TestNetworkResilience:
    """Tests for network resilience."""

    @pytest.mark.asyncio
    async def test_partial_network_partition(self, client):
        """Test behavior during partial network partition."""
        call_count = 0

        with patch("app.services.service_mesh.call") as mock_call:
            async def partitioned_call(service: str, *args, **kwargs):
                nonlocal call_count
                call_count += 1
                # 50% of calls fail
                if call_count % 2 == 0:
                    raise ConnectionError("Network partition")
                return {"status": "ok"}

            mock_call.side_effect = partitioned_call

            successes = 0
            for _ in range(20):
                response = await client.get("/api/distributed-data")
                if response.status_code == 200:
                    successes += 1

            # With retries, should recover from some failures
            assert successes >= 10

    @pytest.mark.asyncio
    async def test_dns_resolution_failure(self, client):
        """Test behavior when DNS resolution fails."""
        with patch("socket.getaddrinfo") as mock_dns:
            mock_dns.side_effect = OSError("DNS resolution failed")

            response = await client.get("/api/external-service")

            # Should return cached data or error gracefully
            assert response.status_code in [200, 503]
```

## Continuous Chaos Testing

```typescript
// chaos/continuous-chaos.ts
import { ChaosToolkit, Experiment } from './chaos-toolkit';
import { metrics } from './metrics';
import { alerts } from './alerts';

interface ChaosSchedule {
  experiment: string;
  cron: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export class ContinuousChaos {
  private toolkit: ChaosToolkit;
  private schedules: ChaosSchedule[] = [];

  constructor() {
    this.toolkit = new ChaosToolkit();
  }

  addSchedule(schedule: ChaosSchedule): void {
    this.schedules.push(schedule);
  }

  async runExperiment(name: string): Promise<ExperimentResult> {
    const experiment = await this.toolkit.loadExperiment(name);

    // Check steady state before
    const steadyStateBefore = await this.checkSteadyState(experiment);
    if (!steadyStateBefore.passed) {
      return {
        success: false,
        reason: 'Pre-experiment steady state check failed',
        details: steadyStateBefore,
      };
    }

    // Run chaos method
    const chaosResult = await this.toolkit.runMethod(experiment);

    // Record metrics
    metrics.recordChaosExperiment({
      experiment: name,
      duration: chaosResult.duration,
      success: chaosResult.success,
    });

    // Check steady state after
    const steadyStateAfter = await this.checkSteadyState(experiment);

    const result: ExperimentResult = {
      success: steadyStateAfter.passed,
      steadyStateBefore,
      steadyStateAfter,
      chaosResult,
    };

    // Alert on failure
    if (!result.success) {
      await alerts.send({
        severity: 'warning',
        title: `Chaos experiment failed: ${name}`,
        details: result,
      });
    }

    return result;
  }

  private async checkSteadyState(
    experiment: Experiment
  ): Promise<SteadyStateResult> {
    const probeResults = await Promise.all(
      experiment.steadyStateHypothesis.probes.map(async (probe) => {
        const result = await this.toolkit.runProbe(probe);
        return {
          name: probe.name,
          passed: this.toolkit.checkTolerance(result, probe.tolerance),
          value: result,
        };
      })
    );

    return {
      passed: probeResults.every((r) => r.passed),
      probes: probeResults,
    };
  }
}

// Usage
const chaos = new ContinuousChaos();

chaos.addSchedule({
  experiment: 'pod-kill',
  cron: '0 */4 * * *', // Every 4 hours
  enabled: true,
});

chaos.addSchedule({
  experiment: 'network-latency',
  cron: '0 2 * * *', // Daily at 2 AM
  enabled: true,
  config: { latency: '200ms' },
});
```

## CLAUDE.md Integration

```markdown
# Chaos Testing

## Commands
- `chaos run experiments/pod-kill.yaml` - Run pod kill experiment
- `litmus apply -f experiment.yaml` - Apply LitmusChaos experiment
- `toxiproxy-cli create` - Create Toxiproxy proxy

## Experiment Types
- Pod/container termination
- Network latency/partition
- Resource exhaustion (CPU, memory)
- Dependency failures

## Safety Guidelines
- Always have rollback procedures
- Start with low blast radius
- Run in staging before production
- Monitor during experiments
- Have kill switch ready
```

## AI Suggestions

1. **Blast radius control** - Limit chaos experiment impact
2. **Automated rollback** - Auto-rollback on SLO breach
3. **Chaos scheduling** - Game day automation
4. **Experiment templates** - Common chaos patterns
5. **Chaos reports** - Detailed experiment reports
6. **Steady state monitoring** - Real-time steady state checks
7. **Multi-cluster chaos** - Cross-cluster experiments
8. **Chaos observability** - Chaos experiment dashboards
9. **Progressive chaos** - Gradually increase chaos intensity
10. **Chaos compliance** - Audit trail for chaos experiments
