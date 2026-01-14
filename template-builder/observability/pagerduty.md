# PagerDuty Template

## Overview
Enterprise incident management platform for alerting, on-call scheduling, and incident response orchestration.

## Installation

```bash
# Node.js SDK
npm install @pagerduty/pdjs

# Python SDK
pip install pdpyras

# Go SDK
go get github.com/PagerDuty/go-pagerduty

# Ruby SDK
gem install pagerduty
```

## Environment Variables

```bash
# API Configuration
PAGERDUTY_API_KEY=your_api_key
PAGERDUTY_SERVICE_ID=your_service_id
PAGERDUTY_ROUTING_KEY=your_routing_key

# Integration Keys
PAGERDUTY_INTEGRATION_KEY=your_integration_key
PAGERDUTY_EVENTS_BASE_URL=https://events.pagerduty.com

# Optional
PAGERDUTY_DEFAULT_ESCALATION_POLICY=your_policy_id
PAGERDUTY_DEFAULT_FROM_EMAIL=oncall@example.com
```

## Node.js Integration

### Events API v2 Client
```typescript
// lib/pagerduty/events-client.ts
import axios, { AxiosInstance } from 'axios';

type Severity = 'critical' | 'error' | 'warning' | 'info';
type EventAction = 'trigger' | 'acknowledge' | 'resolve';

interface EventPayload {
  summary: string;
  severity: Severity;
  source: string;
  timestamp?: string;
  component?: string;
  group?: string;
  class?: string;
  custom_details?: Record<string, any>;
}

interface EventImage {
  src: string;
  href?: string;
  alt?: string;
}

interface EventLink {
  href: string;
  text?: string;
}

interface TriggerEvent {
  routing_key: string;
  event_action: 'trigger';
  dedup_key?: string;
  payload: EventPayload;
  images?: EventImage[];
  links?: EventLink[];
  client?: string;
  client_url?: string;
}

interface AcknowledgeEvent {
  routing_key: string;
  event_action: 'acknowledge';
  dedup_key: string;
}

interface ResolveEvent {
  routing_key: string;
  event_action: 'resolve';
  dedup_key: string;
}

type PagerDutyEvent = TriggerEvent | AcknowledgeEvent | ResolveEvent;

interface EventResponse {
  status: string;
  message: string;
  dedup_key: string;
}

class PagerDutyEventsClient {
  private client: AxiosInstance;
  private routingKey: string;
  private defaultSource: string;

  constructor(config: {
    routingKey: string;
    defaultSource?: string;
  }) {
    this.routingKey = config.routingKey;
    this.defaultSource = config.defaultSource || 'application';

    this.client = axios.create({
      baseURL: process.env.PAGERDUTY_EVENTS_BASE_URL || 'https://events.pagerduty.com',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async trigger(params: {
    summary: string;
    severity: Severity;
    dedupKey?: string;
    source?: string;
    component?: string;
    group?: string;
    class?: string;
    customDetails?: Record<string, any>;
    images?: EventImage[];
    links?: EventLink[];
  }): Promise<EventResponse> {
    const event: TriggerEvent = {
      routing_key: this.routingKey,
      event_action: 'trigger',
      dedup_key: params.dedupKey,
      payload: {
        summary: params.summary,
        severity: params.severity,
        source: params.source || this.defaultSource,
        timestamp: new Date().toISOString(),
        component: params.component,
        group: params.group,
        class: params.class,
        custom_details: params.customDetails
      },
      images: params.images,
      links: params.links,
      client: 'Application Monitor',
      client_url: process.env.APP_URL
    };

    const response = await this.client.post('/v2/enqueue', event);
    return response.data;
  }

  async acknowledge(dedupKey: string): Promise<EventResponse> {
    const event: AcknowledgeEvent = {
      routing_key: this.routingKey,
      event_action: 'acknowledge',
      dedup_key: dedupKey
    };

    const response = await this.client.post('/v2/enqueue', event);
    return response.data;
  }

  async resolve(dedupKey: string): Promise<EventResponse> {
    const event: ResolveEvent = {
      routing_key: this.routingKey,
      event_action: 'resolve',
      dedup_key: dedupKey
    };

    const response = await this.client.post('/v2/enqueue', event);
    return response.data;
  }

  async changeEvent(params: {
    summary: string;
    source?: string;
    customDetails?: Record<string, any>;
    links?: EventLink[];
  }): Promise<void> {
    const event = {
      routing_key: this.routingKey,
      payload: {
        summary: params.summary,
        source: params.source || this.defaultSource,
        timestamp: new Date().toISOString(),
        custom_details: params.customDetails
      },
      links: params.links
    };

    await this.client.post('/v2/change/enqueue', event);
  }
}

export {
  PagerDutyEventsClient,
  Severity,
  EventPayload,
  EventResponse,
  EventImage,
  EventLink
};
```

### REST API Client
```typescript
// lib/pagerduty/api-client.ts
import { api } from '@pagerduty/pdjs';

interface Incident {
  id: string;
  incident_number: number;
  title: string;
  status: 'triggered' | 'acknowledged' | 'resolved';
  urgency: 'high' | 'low';
  created_at: string;
  service: { id: string; summary: string };
  assignments: { assignee: { id: string; summary: string } }[];
}

interface Service {
  id: string;
  name: string;
  status: string;
  escalation_policy: { id: string; summary: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OnCall {
  user: User;
  schedule: { id: string; summary: string };
  escalation_level: number;
  start: string;
  end: string;
}

class PagerDutyAPIClient {
  private pd: ReturnType<typeof api>;
  private fromEmail: string;

  constructor(config: {
    apiKey: string;
    fromEmail: string;
  }) {
    this.pd = api({ token: config.apiKey });
    this.fromEmail = config.fromEmail;
  }

  // Incident Management
  async listIncidents(params?: {
    statuses?: string[];
    serviceIds?: string[];
    since?: string;
    until?: string;
    limit?: number;
  }): Promise<Incident[]> {
    const response = await this.pd.get('/incidents', {
      data: {
        'statuses[]': params?.statuses || ['triggered', 'acknowledged'],
        'service_ids[]': params?.serviceIds,
        since: params?.since,
        until: params?.until,
        limit: params?.limit || 25
      }
    });

    return response.data.incidents;
  }

  async getIncident(incidentId: string): Promise<Incident> {
    const response = await this.pd.get(`/incidents/${incidentId}`);
    return response.data.incident;
  }

  async createIncident(params: {
    title: string;
    serviceId: string;
    urgency?: 'high' | 'low';
    body?: string;
    escalationPolicyId?: string;
    incidentKey?: string;
    priority?: { id: string };
  }): Promise<Incident> {
    const response = await this.pd.post('/incidents', {
      headers: {
        From: this.fromEmail
      },
      data: {
        incident: {
          type: 'incident',
          title: params.title,
          service: { id: params.serviceId, type: 'service_reference' },
          urgency: params.urgency || 'high',
          body: params.body ? { type: 'incident_body', details: params.body } : undefined,
          escalation_policy: params.escalationPolicyId
            ? { id: params.escalationPolicyId, type: 'escalation_policy_reference' }
            : undefined,
          incident_key: params.incidentKey,
          priority: params.priority
        }
      }
    });

    return response.data.incident;
  }

  async acknowledgeIncident(incidentId: string): Promise<Incident> {
    const response = await this.pd.put(`/incidents/${incidentId}`, {
      headers: {
        From: this.fromEmail
      },
      data: {
        incident: {
          type: 'incident_reference',
          status: 'acknowledged'
        }
      }
    });

    return response.data.incident;
  }

  async resolveIncident(incidentId: string, resolution?: string): Promise<Incident> {
    const response = await this.pd.put(`/incidents/${incidentId}`, {
      headers: {
        From: this.fromEmail
      },
      data: {
        incident: {
          type: 'incident_reference',
          status: 'resolved',
          resolution: resolution
        }
      }
    });

    return response.data.incident;
  }

  async addIncidentNote(incidentId: string, note: string): Promise<void> {
    await this.pd.post(`/incidents/${incidentId}/notes`, {
      headers: {
        From: this.fromEmail
      },
      data: {
        note: {
          content: note
        }
      }
    });
  }

  async reassignIncident(
    incidentId: string,
    userIds: string[]
  ): Promise<Incident> {
    const response = await this.pd.put(`/incidents/${incidentId}`, {
      headers: {
        From: this.fromEmail
      },
      data: {
        incident: {
          type: 'incident_reference',
          assignments: userIds.map(id => ({
            assignee: { id, type: 'user_reference' }
          }))
        }
      }
    });

    return response.data.incident;
  }

  async mergeIncidents(
    targetIncidentId: string,
    sourceIncidentIds: string[]
  ): Promise<void> {
    await this.pd.put(`/incidents/${targetIncidentId}/merge`, {
      headers: {
        From: this.fromEmail
      },
      data: {
        source_incidents: sourceIncidentIds.map(id => ({
          id,
          type: 'incident_reference'
        }))
      }
    });
  }

  // Service Management
  async listServices(params?: {
    limit?: number;
    teamIds?: string[];
  }): Promise<Service[]> {
    const response = await this.pd.get('/services', {
      data: {
        limit: params?.limit || 25,
        'team_ids[]': params?.teamIds
      }
    });

    return response.data.services;
  }

  async getService(serviceId: string): Promise<Service> {
    const response = await this.pd.get(`/services/${serviceId}`);
    return response.data.service;
  }

  async createMaintenanceWindow(params: {
    serviceIds: string[];
    startTime: Date;
    endTime: Date;
    description: string;
  }): Promise<void> {
    await this.pd.post('/maintenance_windows', {
      data: {
        maintenance_window: {
          type: 'maintenance_window',
          start_time: params.startTime.toISOString(),
          end_time: params.endTime.toISOString(),
          description: params.description,
          services: params.serviceIds.map(id => ({
            id,
            type: 'service_reference'
          }))
        }
      }
    });
  }

  // On-Call Management
  async listOnCalls(params?: {
    scheduleIds?: string[];
    userIds?: string[];
    escalationPolicyIds?: string[];
    since?: string;
    until?: string;
  }): Promise<OnCall[]> {
    const response = await this.pd.get('/oncalls', {
      data: {
        'schedule_ids[]': params?.scheduleIds,
        'user_ids[]': params?.userIds,
        'escalation_policy_ids[]': params?.escalationPolicyIds,
        since: params?.since,
        until: params?.until
      }
    });

    return response.data.oncalls;
  }

  async getCurrentOnCall(scheduleId: string): Promise<User | null> {
    const now = new Date().toISOString();
    const oncalls = await this.listOnCalls({
      scheduleIds: [scheduleId],
      since: now,
      until: now
    });

    return oncalls.length > 0 ? oncalls[0].user : null;
  }

  // User Management
  async listUsers(params?: { limit?: number }): Promise<User[]> {
    const response = await this.pd.get('/users', {
      data: { limit: params?.limit || 25 }
    });

    return response.data.users;
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.pd.get(`/users/${userId}`);
    return response.data.user;
  }
}

export { PagerDutyAPIClient, Incident, Service, User, OnCall };
```

### Alert Manager
```typescript
// lib/pagerduty/alert-manager.ts
import { PagerDutyEventsClient, Severity } from './events-client';
import { createHash } from 'crypto';

interface AlertConfig {
  routingKey: string;
  defaultSource: string;
  dedupKeyPrefix?: string;
  autoResolveAfter?: number; // seconds
}

interface Alert {
  id: string;
  dedupKey: string;
  summary: string;
  severity: Severity;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  autoResolveTimer?: NodeJS.Timer;
}

class AlertManager {
  private client: PagerDutyEventsClient;
  private config: AlertConfig;
  private activeAlerts: Map<string, Alert> = new Map();

  constructor(config: AlertConfig) {
    this.config = config;
    this.client = new PagerDutyEventsClient({
      routingKey: config.routingKey,
      defaultSource: config.defaultSource
    });
  }

  private generateDedupKey(params: {
    component?: string;
    alertType: string;
    identifier?: string;
  }): string {
    const parts = [
      this.config.dedupKeyPrefix || 'alert',
      params.component,
      params.alertType,
      params.identifier
    ].filter(Boolean);

    return createHash('md5')
      .update(parts.join(':'))
      .digest('hex')
      .substring(0, 16);
  }

  async alert(params: {
    summary: string;
    severity: Severity;
    component?: string;
    alertType: string;
    identifier?: string;
    customDetails?: Record<string, any>;
    autoResolve?: boolean;
  }): Promise<string> {
    const dedupKey = this.generateDedupKey({
      component: params.component,
      alertType: params.alertType,
      identifier: params.identifier
    });

    // Check if alert already exists
    const existingAlert = this.activeAlerts.get(dedupKey);
    if (existingAlert && !existingAlert.resolvedAt) {
      console.log(`Alert already active: ${dedupKey}`);
      return dedupKey;
    }

    const response = await this.client.trigger({
      summary: params.summary,
      severity: params.severity,
      dedupKey,
      component: params.component,
      customDetails: {
        alert_type: params.alertType,
        ...params.customDetails
      }
    });

    const alert: Alert = {
      id: response.dedup_key,
      dedupKey,
      summary: params.summary,
      severity: params.severity,
      triggeredAt: new Date()
    };

    // Set up auto-resolve if configured
    if (params.autoResolve && this.config.autoResolveAfter) {
      alert.autoResolveTimer = setTimeout(async () => {
        await this.resolve(dedupKey);
      }, this.config.autoResolveAfter * 1000);
    }

    this.activeAlerts.set(dedupKey, alert);
    return dedupKey;
  }

  async acknowledge(dedupKey: string): Promise<void> {
    const alert = this.activeAlerts.get(dedupKey);
    if (!alert) {
      throw new Error(`Alert not found: ${dedupKey}`);
    }

    await this.client.acknowledge(dedupKey);
    alert.acknowledgedAt = new Date();
  }

  async resolve(dedupKey: string): Promise<void> {
    const alert = this.activeAlerts.get(dedupKey);

    if (alert?.autoResolveTimer) {
      clearTimeout(alert.autoResolveTimer);
    }

    await this.client.resolve(dedupKey);

    if (alert) {
      alert.resolvedAt = new Date();
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(a => !a.resolvedAt);
  }

  getAlert(dedupKey: string): Alert | undefined {
    return this.activeAlerts.get(dedupKey);
  }

  // Convenience methods for common alert types
  async criticalAlert(summary: string, details?: Record<string, any>): Promise<string> {
    return this.alert({
      summary,
      severity: 'critical',
      alertType: 'critical',
      customDetails: details
    });
  }

  async errorAlert(summary: string, details?: Record<string, any>): Promise<string> {
    return this.alert({
      summary,
      severity: 'error',
      alertType: 'error',
      customDetails: details,
      autoResolve: true
    });
  }

  async warningAlert(summary: string, details?: Record<string, any>): Promise<string> {
    return this.alert({
      summary,
      severity: 'warning',
      alertType: 'warning',
      customDetails: details,
      autoResolve: true
    });
  }
}

export { AlertManager, Alert, AlertConfig };
```

## Express.js Integration

### Middleware and Error Handler
```typescript
// middleware/pagerduty.ts
import { Request, Response, NextFunction } from 'express';
import { AlertManager } from '../lib/pagerduty/alert-manager';

const alertManager = new AlertManager({
  routingKey: process.env.PAGERDUTY_ROUTING_KEY!,
  defaultSource: process.env.APP_NAME || 'api-server',
  dedupKeyPrefix: process.env.APP_ENV || 'production',
  autoResolveAfter: 3600
});

// Error handler that creates PagerDuty incidents
export function pagerDutyErrorHandler(
  error: Error & { statusCode?: number; context?: Record<string, any> },
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = error.statusCode || 500;

  // Only alert on 5xx errors
  if (statusCode >= 500) {
    alertManager.alert({
      summary: `[${statusCode}] ${error.message} - ${req.method} ${req.path}`,
      severity: statusCode === 500 ? 'critical' : 'error',
      component: 'api',
      alertType: 'http_error',
      identifier: `${req.method}_${req.path}`,
      customDetails: {
        error_name: error.name,
        error_message: error.message,
        stack_trace: error.stack?.split('\n').slice(0, 5),
        request: {
          method: req.method,
          path: req.path,
          query: req.query,
          headers: {
            'user-agent': req.headers['user-agent'],
            'x-request-id': req.headers['x-request-id']
          }
        },
        context: error.context
      }
    }).catch(console.error);
  }

  res.status(statusCode).json({
    error: error.message,
    requestId: req.headers['x-request-id']
  });
}

// Health check alert middleware
export function healthCheckAlert(
  checkName: string,
  check: () => Promise<boolean>
) {
  let lastStatus = true;
  let dedupKey: string | null = null;

  return async function performHealthCheck(): Promise<boolean> {
    try {
      const isHealthy = await check();

      if (!isHealthy && lastStatus) {
        // Service became unhealthy
        dedupKey = await alertManager.alert({
          summary: `Health check failed: ${checkName}`,
          severity: 'critical',
          component: 'health',
          alertType: 'health_check_failure',
          identifier: checkName,
          customDetails: {
            check_name: checkName,
            timestamp: new Date().toISOString()
          }
        });
      } else if (isHealthy && !lastStatus && dedupKey) {
        // Service recovered
        await alertManager.resolve(dedupKey);
        dedupKey = null;
      }

      lastStatus = isHealthy;
      return isHealthy;
    } catch (error) {
      if (lastStatus) {
        dedupKey = await alertManager.alert({
          summary: `Health check error: ${checkName}`,
          severity: 'critical',
          component: 'health',
          alertType: 'health_check_error',
          identifier: checkName,
          customDetails: {
            check_name: checkName,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
      lastStatus = false;
      return false;
    }
  };
}

export { alertManager };
```

### Webhook Handler
```typescript
// routes/pagerduty-webhooks.ts
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

interface WebhookPayload {
  messages: Array<{
    id: string;
    event: {
      id: string;
      event_type: string;
      resource_type: string;
      occurred_at: string;
      agent: {
        type: string;
        id?: string;
        summary?: string;
      };
      client?: {
        name: string;
      };
      data: {
        id: string;
        type: string;
        self: string;
        html_url: string;
        number?: number;
        title?: string;
        status?: string;
        service?: { id: string; summary: string };
        assignees?: Array<{ id: string; summary: string }>;
        priority?: { id: string; summary: string };
      };
    };
  }>;
}

// Signature verification middleware
function verifySignature(secret: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const signature = req.headers['x-pagerduty-signature'] as string;

    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const signatures = signature.split(',').map(s => s.replace('v1=', ''));
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (!signatures.includes(expectedSignature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  };
}

router.use(express.json());
router.use(verifySignature(process.env.PAGERDUTY_WEBHOOK_SECRET!));

router.post('/webhook', async (req, res) => {
  const payload = req.body as WebhookPayload;

  for (const message of payload.messages) {
    const { event } = message;

    console.log(`PagerDuty event: ${event.event_type}`, {
      resourceType: event.resource_type,
      resourceId: event.data.id
    });

    switch (event.event_type) {
      case 'incident.triggered':
        await handleIncidentTriggered(event);
        break;
      case 'incident.acknowledged':
        await handleIncidentAcknowledged(event);
        break;
      case 'incident.resolved':
        await handleIncidentResolved(event);
        break;
      case 'incident.reassigned':
        await handleIncidentReassigned(event);
        break;
      case 'incident.escalated':
        await handleIncidentEscalated(event);
        break;
      case 'incident.priority_updated':
        await handlePriorityUpdated(event);
        break;
    }
  }

  res.status(200).json({ status: 'ok' });
});

async function handleIncidentTriggered(event: WebhookPayload['messages'][0]['event']) {
  // Create incident record in database
  console.log('Incident triggered:', event.data.title);

  // Post to Slack
  // Update status page
  // Create JIRA ticket
}

async function handleIncidentAcknowledged(event: WebhookPayload['messages'][0]['event']) {
  console.log('Incident acknowledged by:', event.agent.summary);

  // Update incident record
  // Notify stakeholders
}

async function handleIncidentResolved(event: WebhookPayload['messages'][0]['event']) {
  console.log('Incident resolved:', event.data.title);

  // Update incident record
  // Generate post-incident report
  // Update status page
}

async function handleIncidentReassigned(event: WebhookPayload['messages'][0]['event']) {
  console.log('Incident reassigned to:', event.data.assignees);
}

async function handleIncidentEscalated(event: WebhookPayload['messages'][0]['event']) {
  console.log('Incident escalated');
}

async function handlePriorityUpdated(event: WebhookPayload['messages'][0]['event']) {
  console.log('Priority updated to:', event.data.priority?.summary);
}

export default router;
```

## Python Integration

### Events API Client
```python
# pagerduty/events.py
import os
import hashlib
import httpx
from datetime import datetime
from typing import Optional, Dict, Any, List, Literal
from dataclasses import dataclass, field
from enum import Enum

class Severity(str, Enum):
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

@dataclass
class EventPayload:
    summary: str
    severity: Severity
    source: str
    timestamp: Optional[str] = None
    component: Optional[str] = None
    group: Optional[str] = None
    class_type: Optional[str] = None
    custom_details: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "summary": self.summary,
            "severity": self.severity.value,
            "source": self.source,
            "timestamp": self.timestamp or datetime.utcnow().isoformat() + "Z",
            "component": self.component,
            "group": self.group,
            "class": self.class_type,
            "custom_details": self.custom_details
        }

@dataclass
class EventResponse:
    status: str
    message: str
    dedup_key: str

class PagerDutyEventsClient:
    def __init__(
        self,
        routing_key: str,
        default_source: str = "application",
        base_url: str = "https://events.pagerduty.com"
    ):
        self.routing_key = routing_key
        self.default_source = default_source
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def trigger(
        self,
        summary: str,
        severity: Severity,
        dedup_key: Optional[str] = None,
        source: Optional[str] = None,
        component: Optional[str] = None,
        group: Optional[str] = None,
        class_type: Optional[str] = None,
        custom_details: Optional[Dict[str, Any]] = None,
        images: Optional[List[Dict[str, str]]] = None,
        links: Optional[List[Dict[str, str]]] = None
    ) -> EventResponse:
        payload = EventPayload(
            summary=summary,
            severity=severity,
            source=source or self.default_source,
            component=component,
            group=group,
            class_type=class_type,
            custom_details=custom_details
        )

        event = {
            "routing_key": self.routing_key,
            "event_action": "trigger",
            "dedup_key": dedup_key,
            "payload": payload.to_dict(),
            "images": images,
            "links": links
        }

        response = await self.client.post(
            f"{self.base_url}/v2/enqueue",
            json=event
        )
        response.raise_for_status()
        data = response.json()

        return EventResponse(
            status=data["status"],
            message=data["message"],
            dedup_key=data["dedup_key"]
        )

    async def acknowledge(self, dedup_key: str) -> EventResponse:
        event = {
            "routing_key": self.routing_key,
            "event_action": "acknowledge",
            "dedup_key": dedup_key
        }

        response = await self.client.post(
            f"{self.base_url}/v2/enqueue",
            json=event
        )
        response.raise_for_status()
        data = response.json()

        return EventResponse(
            status=data["status"],
            message=data["message"],
            dedup_key=data["dedup_key"]
        )

    async def resolve(self, dedup_key: str) -> EventResponse:
        event = {
            "routing_key": self.routing_key,
            "event_action": "resolve",
            "dedup_key": dedup_key
        }

        response = await self.client.post(
            f"{self.base_url}/v2/enqueue",
            json=event
        )
        response.raise_for_status()
        data = response.json()

        return EventResponse(
            status=data["status"],
            message=data["message"],
            dedup_key=data["dedup_key"]
        )

    async def change_event(
        self,
        summary: str,
        source: Optional[str] = None,
        custom_details: Optional[Dict[str, Any]] = None,
        links: Optional[List[Dict[str, str]]] = None
    ) -> None:
        event = {
            "routing_key": self.routing_key,
            "payload": {
                "summary": summary,
                "source": source or self.default_source,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "custom_details": custom_details
            },
            "links": links
        }

        response = await self.client.post(
            f"{self.base_url}/v2/change/enqueue",
            json=event
        )
        response.raise_for_status()

    async def close(self):
        await self.client.aclose()
```

### REST API Client
```python
# pagerduty/api.py
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
import httpx

class PagerDutyAPIClient:
    def __init__(
        self,
        api_key: str,
        from_email: str,
        base_url: str = "https://api.pagerduty.com"
    ):
        self.api_key = api_key
        self.from_email = from_email
        self.base_url = base_url
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Token token={api_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )

    # Incidents
    async def list_incidents(
        self,
        statuses: Optional[List[str]] = None,
        service_ids: Optional[List[str]] = None,
        since: Optional[str] = None,
        until: Optional[str] = None,
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        params = {
            "limit": limit,
            "statuses[]": statuses or ["triggered", "acknowledged"],
        }
        if service_ids:
            params["service_ids[]"] = service_ids
        if since:
            params["since"] = since
        if until:
            params["until"] = until

        response = await self.client.get(
            f"{self.base_url}/incidents",
            params=params
        )
        response.raise_for_status()
        return response.json()["incidents"]

    async def get_incident(self, incident_id: str) -> Dict[str, Any]:
        response = await self.client.get(
            f"{self.base_url}/incidents/{incident_id}"
        )
        response.raise_for_status()
        return response.json()["incident"]

    async def create_incident(
        self,
        title: str,
        service_id: str,
        urgency: str = "high",
        body: Optional[str] = None,
        escalation_policy_id: Optional[str] = None,
        incident_key: Optional[str] = None
    ) -> Dict[str, Any]:
        incident_data = {
            "type": "incident",
            "title": title,
            "service": {
                "id": service_id,
                "type": "service_reference"
            },
            "urgency": urgency
        }

        if body:
            incident_data["body"] = {
                "type": "incident_body",
                "details": body
            }

        if escalation_policy_id:
            incident_data["escalation_policy"] = {
                "id": escalation_policy_id,
                "type": "escalation_policy_reference"
            }

        if incident_key:
            incident_data["incident_key"] = incident_key

        response = await self.client.post(
            f"{self.base_url}/incidents",
            json={"incident": incident_data},
            headers={"From": self.from_email}
        )
        response.raise_for_status()
        return response.json()["incident"]

    async def acknowledge_incident(self, incident_id: str) -> Dict[str, Any]:
        response = await self.client.put(
            f"{self.base_url}/incidents/{incident_id}",
            json={
                "incident": {
                    "type": "incident_reference",
                    "status": "acknowledged"
                }
            },
            headers={"From": self.from_email}
        )
        response.raise_for_status()
        return response.json()["incident"]

    async def resolve_incident(
        self,
        incident_id: str,
        resolution: Optional[str] = None
    ) -> Dict[str, Any]:
        data = {
            "incident": {
                "type": "incident_reference",
                "status": "resolved"
            }
        }
        if resolution:
            data["incident"]["resolution"] = resolution

        response = await self.client.put(
            f"{self.base_url}/incidents/{incident_id}",
            json=data,
            headers={"From": self.from_email}
        )
        response.raise_for_status()
        return response.json()["incident"]

    async def add_note(self, incident_id: str, note: str) -> None:
        await self.client.post(
            f"{self.base_url}/incidents/{incident_id}/notes",
            json={"note": {"content": note}},
            headers={"From": self.from_email}
        )

    # On-Call
    async def list_oncalls(
        self,
        schedule_ids: Optional[List[str]] = None,
        user_ids: Optional[List[str]] = None,
        since: Optional[str] = None,
        until: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        params = {}
        if schedule_ids:
            params["schedule_ids[]"] = schedule_ids
        if user_ids:
            params["user_ids[]"] = user_ids
        if since:
            params["since"] = since
        if until:
            params["until"] = until

        response = await self.client.get(
            f"{self.base_url}/oncalls",
            params=params
        )
        response.raise_for_status()
        return response.json()["oncalls"]

    async def get_current_oncall(self, schedule_id: str) -> Optional[Dict[str, Any]]:
        now = datetime.utcnow().isoformat() + "Z"
        oncalls = await self.list_oncalls(
            schedule_ids=[schedule_id],
            since=now,
            until=now
        )
        return oncalls[0]["user"] if oncalls else None

    # Services
    async def list_services(
        self,
        limit: int = 25,
        team_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        params = {"limit": limit}
        if team_ids:
            params["team_ids[]"] = team_ids

        response = await self.client.get(
            f"{self.base_url}/services",
            params=params
        )
        response.raise_for_status()
        return response.json()["services"]

    async def close(self):
        await self.client.aclose()
```

### FastAPI Integration
```python
# fastapi_pagerduty.py
import os
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from pagerduty.events import PagerDutyEventsClient, Severity

# Global client
pagerduty_client: PagerDutyEventsClient = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pagerduty_client
    pagerduty_client = PagerDutyEventsClient(
        routing_key=os.environ["PAGERDUTY_ROUTING_KEY"],
        default_source=os.environ.get("APP_NAME", "api")
    )
    yield
    await pagerduty_client.close()

app = FastAPI(lifespan=lifespan)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Alert on 500 errors
    if not isinstance(exc, HTTPException) or exc.status_code >= 500:
        try:
            await pagerduty_client.trigger(
                summary=f"[500] {str(exc)} - {request.method} {request.url.path}",
                severity=Severity.CRITICAL,
                component="api",
                dedup_key=f"api_error_{request.method}_{request.url.path}".lower().replace("/", "_"),
                custom_details={
                    "error_type": type(exc).__name__,
                    "error_message": str(exc),
                    "traceback": traceback.format_exc().split("\n")[:10],
                    "request": {
                        "method": request.method,
                        "path": request.url.path,
                        "query": str(request.query_params),
                        "client": request.client.host if request.client else None
                    }
                }
            )
        except Exception as alert_error:
            print(f"Failed to send PagerDuty alert: {alert_error}")

    status_code = exc.status_code if isinstance(exc, HTTPException) else 500
    return JSONResponse(
        status_code=status_code,
        content={"error": str(exc)}
    )

# Middleware for slow request alerting
from starlette.middleware.base import BaseHTTPMiddleware
import time

class SlowRequestAlertMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, threshold_ms: int = 5000):
        super().__init__(app)
        self.threshold_ms = threshold_ms

    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start) * 1000

        if duration_ms > self.threshold_ms:
            await pagerduty_client.trigger(
                summary=f"Slow request: {request.method} {request.url.path} ({duration_ms:.0f}ms)",
                severity=Severity.WARNING,
                component="performance",
                custom_details={
                    "duration_ms": duration_ms,
                    "threshold_ms": self.threshold_ms,
                    "path": request.url.path
                }
            )

        return response

app.add_middleware(SlowRequestAlertMiddleware, threshold_ms=5000)
```

## Go Integration

```go
// pagerduty/client.go
package pagerduty

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "github.com/PagerDuty/go-pagerduty"
)

type Severity string

const (
    SeverityCritical Severity = "critical"
    SeverityError    Severity = "error"
    SeverityWarning  Severity = "warning"
    SeverityInfo     Severity = "info"
)

type EventsClient struct {
    routingKey    string
    defaultSource string
    httpClient    *http.Client
    baseURL       string
}

type EventResponse struct {
    Status   string `json:"status"`
    Message  string `json:"message"`
    DedupKey string `json:"dedup_key"`
}

func NewEventsClient(routingKey, defaultSource string) *EventsClient {
    return &EventsClient{
        routingKey:    routingKey,
        defaultSource: defaultSource,
        httpClient:    &http.Client{Timeout: 30 * time.Second},
        baseURL:       "https://events.pagerduty.com",
    }
}

type TriggerOptions struct {
    Summary       string
    Severity      Severity
    DedupKey      string
    Source        string
    Component     string
    Group         string
    Class         string
    CustomDetails map[string]interface{}
    Images        []map[string]string
    Links         []map[string]string
}

func (c *EventsClient) Trigger(ctx context.Context, opts TriggerOptions) (*EventResponse, error) {
    source := opts.Source
    if source == "" {
        source = c.defaultSource
    }

    payload := map[string]interface{}{
        "routing_key":  c.routingKey,
        "event_action": "trigger",
        "payload": map[string]interface{}{
            "summary":        opts.Summary,
            "severity":       opts.Severity,
            "source":         source,
            "timestamp":      time.Now().UTC().Format(time.RFC3339),
            "component":      opts.Component,
            "group":          opts.Group,
            "class":          opts.Class,
            "custom_details": opts.CustomDetails,
        },
    }

    if opts.DedupKey != "" {
        payload["dedup_key"] = opts.DedupKey
    }
    if opts.Images != nil {
        payload["images"] = opts.Images
    }
    if opts.Links != nil {
        payload["links"] = opts.Links
    }

    return c.sendEvent(ctx, payload)
}

func (c *EventsClient) Acknowledge(ctx context.Context, dedupKey string) (*EventResponse, error) {
    payload := map[string]interface{}{
        "routing_key":  c.routingKey,
        "event_action": "acknowledge",
        "dedup_key":    dedupKey,
    }
    return c.sendEvent(ctx, payload)
}

func (c *EventsClient) Resolve(ctx context.Context, dedupKey string) (*EventResponse, error) {
    payload := map[string]interface{}{
        "routing_key":  c.routingKey,
        "event_action": "resolve",
        "dedup_key":    dedupKey,
    }
    return c.sendEvent(ctx, payload)
}

func (c *EventsClient) sendEvent(ctx context.Context, payload map[string]interface{}) (*EventResponse, error) {
    body, err := json.Marshal(payload)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal payload: %w", err)
    }

    req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/v2/enqueue", bytes.NewReader(body))
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }
    req.Header.Set("Content-Type", "application/json")

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("failed to send request: %w", err)
    }
    defer resp.Body.Close()

    var result EventResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    if resp.StatusCode >= 400 {
        return nil, fmt.Errorf("PagerDuty API error: %s", result.Message)
    }

    return &result, nil
}

// REST API Client using official SDK
type APIClient struct {
    client    *pagerduty.Client
    fromEmail string
}

func NewAPIClient(apiKey, fromEmail string) *APIClient {
    return &APIClient{
        client:    pagerduty.NewClient(apiKey),
        fromEmail: fromEmail,
    }
}

func (c *APIClient) ListIncidents(opts pagerduty.ListIncidentsOptions) (*pagerduty.ListIncidentsResponse, error) {
    return c.client.ListIncidentsWithContext(context.Background(), opts)
}

func (c *APIClient) CreateIncident(serviceID, title string, urgency string) (*pagerduty.Incident, error) {
    incident := pagerduty.CreateIncidentOptions{
        Type:  "incident",
        Title: title,
        Service: &pagerduty.APIReference{
            ID:   serviceID,
            Type: "service_reference",
        },
        Urgency: urgency,
    }
    return c.client.CreateIncidentWithContext(context.Background(), c.fromEmail, &incident)
}

func (c *APIClient) GetOnCall(scheduleID string) (*pagerduty.User, error) {
    now := time.Now().UTC().Format(time.RFC3339)
    opts := pagerduty.ListOnCallOptions{
        ScheduleIDs: []string{scheduleID},
        Since:       now,
        Until:       now,
    }

    resp, err := c.client.ListOnCallsWithContext(context.Background(), opts)
    if err != nil {
        return nil, err
    }

    if len(resp.OnCalls) > 0 {
        return &resp.OnCalls[0].User, nil
    }
    return nil, nil
}
```

### Gin Middleware
```go
// middleware/pagerduty.go
package middleware

import (
    "fmt"
    "runtime/debug"
    "time"

    "github.com/gin-gonic/gin"
    "yourapp/pagerduty"
)

func PagerDutyRecovery(client *pagerduty.EventsClient) gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                stack := string(debug.Stack())

                _, alertErr := client.Trigger(c.Request.Context(), pagerduty.TriggerOptions{
                    Summary:  fmt.Sprintf("[PANIC] %v - %s %s", err, c.Request.Method, c.Request.URL.Path),
                    Severity: pagerduty.SeverityCritical,
                    Component: "api",
                    DedupKey: fmt.Sprintf("panic_%s_%s", c.Request.Method, c.Request.URL.Path),
                    CustomDetails: map[string]interface{}{
                        "error":      fmt.Sprintf("%v", err),
                        "stack":      stack[:min(len(stack), 1000)],
                        "method":     c.Request.Method,
                        "path":       c.Request.URL.Path,
                        "client_ip":  c.ClientIP(),
                    },
                })

                if alertErr != nil {
                    fmt.Printf("Failed to send PagerDuty alert: %v\n", alertErr)
                }

                c.AbortWithStatusJSON(500, gin.H{"error": "Internal server error"})
            }
        }()

        c.Next()
    }
}

func PagerDutyLatencyAlert(client *pagerduty.EventsClient, thresholdMs int64) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        c.Next()

        durationMs := time.Since(start).Milliseconds()

        if durationMs > thresholdMs {
            _, _ = client.Trigger(c.Request.Context(), pagerduty.TriggerOptions{
                Summary:  fmt.Sprintf("Slow request: %s %s (%dms)", c.Request.Method, c.Request.URL.Path, durationMs),
                Severity: pagerduty.SeverityWarning,
                Component: "performance",
                CustomDetails: map[string]interface{}{
                    "duration_ms":  durationMs,
                    "threshold_ms": thresholdMs,
                    "method":       c.Request.Method,
                    "path":         c.Request.URL.Path,
                    "status_code":  c.Writer.Status(),
                },
            })
        }
    }
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```

## Testing

### Unit Tests
```typescript
// __tests__/pagerduty.test.ts
import { PagerDutyEventsClient } from '../lib/pagerduty/events-client';
import { AlertManager } from '../lib/pagerduty/alert-manager';
import nock from 'nock';

describe('PagerDutyEventsClient', () => {
  let client: PagerDutyEventsClient;

  beforeEach(() => {
    client = new PagerDutyEventsClient({
      routingKey: 'test-routing-key',
      defaultSource: 'test-app'
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should trigger an event', async () => {
    const scope = nock('https://events.pagerduty.com')
      .post('/v2/enqueue', (body) => {
        return body.event_action === 'trigger' &&
               body.routing_key === 'test-routing-key' &&
               body.payload.summary === 'Test alert';
      })
      .reply(200, {
        status: 'success',
        message: 'Event processed',
        dedup_key: 'test-dedup-key'
      });

    const response = await client.trigger({
      summary: 'Test alert',
      severity: 'critical'
    });

    expect(response.status).toBe('success');
    expect(response.dedup_key).toBe('test-dedup-key');
    expect(scope.isDone()).toBe(true);
  });

  it('should acknowledge an event', async () => {
    const scope = nock('https://events.pagerduty.com')
      .post('/v2/enqueue', (body) => {
        return body.event_action === 'acknowledge' &&
               body.dedup_key === 'test-dedup-key';
      })
      .reply(200, {
        status: 'success',
        message: 'Event processed',
        dedup_key: 'test-dedup-key'
      });

    await client.acknowledge('test-dedup-key');
    expect(scope.isDone()).toBe(true);
  });

  it('should resolve an event', async () => {
    const scope = nock('https://events.pagerduty.com')
      .post('/v2/enqueue', (body) => {
        return body.event_action === 'resolve';
      })
      .reply(200, {
        status: 'success',
        message: 'Event processed',
        dedup_key: 'test-dedup-key'
      });

    await client.resolve('test-dedup-key');
    expect(scope.isDone()).toBe(true);
  });
});

describe('AlertManager', () => {
  let manager: AlertManager;

  beforeEach(() => {
    manager = new AlertManager({
      routingKey: 'test-key',
      defaultSource: 'test-app',
      dedupKeyPrefix: 'test'
    });
  });

  it('should track active alerts', async () => {
    nock('https://events.pagerduty.com')
      .post('/v2/enqueue')
      .reply(200, { status: 'success', dedup_key: 'abc123' });

    const dedupKey = await manager.alert({
      summary: 'Test alert',
      severity: 'error',
      alertType: 'test'
    });

    const activeAlerts = manager.getActiveAlerts();
    expect(activeAlerts).toHaveLength(1);
    expect(activeAlerts[0].summary).toBe('Test alert');
  });

  it('should not duplicate active alerts', async () => {
    nock('https://events.pagerduty.com')
      .post('/v2/enqueue')
      .times(2)
      .reply(200, { status: 'success', dedup_key: 'same-key' });

    await manager.alert({
      summary: 'Test',
      severity: 'error',
      alertType: 'test',
      identifier: 'same'
    });

    await manager.alert({
      summary: 'Test',
      severity: 'error',
      alertType: 'test',
      identifier: 'same'
    });

    expect(manager.getActiveAlerts()).toHaveLength(1);
  });
});
```

## CLAUDE.md Integration

```markdown
# PagerDuty Integration

## Quick Reference

### Trigger Alert
```bash
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "YOUR_ROUTING_KEY",
    "event_action": "trigger",
    "dedup_key": "unique-incident-key",
    "payload": {
      "summary": "Alert summary",
      "severity": "critical",
      "source": "monitoring"
    }
  }'
```

### Resolve Alert
```bash
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "YOUR_ROUTING_KEY",
    "event_action": "resolve",
    "dedup_key": "unique-incident-key"
  }'
```

## Service Configuration
- Production Service ID: PXXXXXX
- Staging Service ID: PXXXXXX
- Default Escalation Policy: PXXXXXX

## On-Call Schedules
- Primary: schedule_id_primary
- Secondary: schedule_id_secondary

## Alert Severity Guidelines
- **critical**: Service is down, data loss imminent
- **error**: Major functionality impaired
- **warning**: Degraded performance or approaching limits
- **info**: Notable events, no action required
```

## AI Suggestions

1. **Intelligent Alert Grouping** - Implement ML-based alert correlation to automatically group related incidents and reduce noise
2. **Predictive Escalation** - Use historical response data to predict when incidents will need escalation and pre-notify teams
3. **Auto-Remediation Triggers** - Integrate with runbooks to automatically execute remediation scripts for known issues
4. **Impact Analysis** - Automatically calculate business impact scores based on affected services and customer segments
5. **On-Call Optimization** - Analyze on-call patterns to suggest schedule optimizations and prevent burnout
6. **Post-Incident Automation** - Auto-generate post-mortem templates with timeline and affected services
7. **Alert Fatigue Detection** - Monitor alert patterns and suggest threshold adjustments to reduce false positives
8. **Cross-Service Dependencies** - Map service dependencies to predict cascade failures and notify appropriate teams
9. **SLA Tracking Integration** - Automatically track incident duration against SLA commitments and alert on breaches
10. **Contextual Runbooks** - Surface relevant runbooks and past incident resolutions when similar alerts trigger
