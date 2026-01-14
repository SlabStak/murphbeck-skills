# OpsGenie Template

## Overview
Modern incident management and alerting platform with powerful scheduling, escalation, and on-call management capabilities.

## Installation

```bash
# Node.js SDK
npm install opsgenie-sdk

# Python SDK
pip install opsgenie-sdk

# Go SDK
go get github.com/opsgenie/opsgenie-go-sdk-v2

# Java SDK (Maven)
# <dependency>
#   <groupId>com.opsgenie.integration</groupId>
#   <artifactId>sdk</artifactId>
#   <version>2.0.0</version>
# </dependency>
```

## Environment Variables

```bash
# API Configuration
OPSGENIE_API_KEY=your_api_key
OPSGENIE_API_URL=https://api.opsgenie.com

# Integration Key (for specific integrations)
OPSGENIE_INTEGRATION_KEY=your_integration_key

# Team Configuration
OPSGENIE_DEFAULT_TEAM=your_team_name
OPSGENIE_DEFAULT_PRIORITY=P3

# Optional
OPSGENIE_EU_INSTANCE=false  # Set to true for EU instance
```

## Node.js Integration

### Alert API Client
```typescript
// lib/opsgenie/alert-client.ts
import axios, { AxiosInstance } from 'axios';

type Priority = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

interface AlertPayload {
  message: string;
  alias?: string;
  description?: string;
  responders?: Array<{
    type: 'team' | 'user' | 'escalation' | 'schedule';
    id?: string;
    name?: string;
    username?: string;
  }>;
  visibleTo?: Array<{
    type: 'team' | 'user';
    id?: string;
    name?: string;
    username?: string;
  }>;
  actions?: string[];
  tags?: string[];
  details?: Record<string, string>;
  entity?: string;
  source?: string;
  priority?: Priority;
  user?: string;
  note?: string;
}

interface Alert {
  id: string;
  tinyId: string;
  alias: string;
  message: string;
  status: 'open' | 'closed';
  acknowledged: boolean;
  isSeen: boolean;
  tags: string[];
  snoozed: boolean;
  count: number;
  lastOccurredAt: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  owner: string;
  priority: Priority;
  responders: Array<{ type: string; id: string }>;
  integration: { id: string; name: string; type: string };
  ownerTeamId?: string;
}

interface AlertResponse {
  result: string;
  took: number;
  requestId: string;
}

interface ListAlertsResponse {
  data: Alert[];
  took: number;
  requestId: string;
  paging?: {
    next?: string;
    first?: string;
    last?: string;
  };
}

class OpsGenieAlertClient {
  private client: AxiosInstance;
  private defaultSource: string;

  constructor(config: {
    apiKey: string;
    apiUrl?: string;
    defaultSource?: string;
  }) {
    const baseURL = config.apiUrl ||
      (process.env.OPSGENIE_EU_INSTANCE === 'true'
        ? 'https://api.eu.opsgenie.com'
        : 'https://api.opsgenie.com');

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `GenieKey ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.defaultSource = config.defaultSource || 'application';
  }

  async create(payload: AlertPayload): Promise<AlertResponse> {
    const data = {
      ...payload,
      source: payload.source || this.defaultSource
    };

    const response = await this.client.post('/v2/alerts', data);
    return response.data;
  }

  async get(identifier: string, identifierType: 'id' | 'alias' | 'tiny' = 'id'): Promise<Alert> {
    const response = await this.client.get(`/v2/alerts/${identifier}`, {
      params: { identifierType }
    });
    return response.data.data;
  }

  async list(params?: {
    query?: string;
    searchIdentifier?: string;
    searchIdentifierType?: 'id' | 'name';
    offset?: number;
    limit?: number;
    sort?: 'createdAt' | 'updatedAt' | 'tinyId' | 'alias' | 'message' | 'status' | 'acknowledged' | 'isSeen' | 'snoozed' | 'count' | 'lastOccurredAt' | 'source' | 'owner' | 'integration.name' | 'integration.type' | 'report.ackTime' | 'report.closeTime' | 'report.acknowledgedBy' | 'report.closedBy';
    order?: 'asc' | 'desc';
  }): Promise<ListAlertsResponse> {
    const response = await this.client.get('/v2/alerts', { params });
    return response.data;
  }

  async close(
    identifier: string,
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.post(
      `/v2/alerts/${identifier}/close`,
      payload || {},
      { params: { identifierType } }
    );
    return response.data;
  }

  async acknowledge(
    identifier: string,
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.post(
      `/v2/alerts/${identifier}/acknowledge`,
      payload || {},
      { params: { identifierType } }
    );
    return response.data;
  }

  async unacknowledge(
    identifier: string,
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.post(
      `/v2/alerts/${identifier}/unacknowledge`,
      payload || {},
      { params: { identifierType } }
    );
    return response.data;
  }

  async snooze(
    identifier: string,
    endTime: Date,
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.post(
      `/v2/alerts/${identifier}/snooze`,
      { ...payload, endTime: endTime.toISOString() },
      { params: { identifierType } }
    );
    return response.data;
  }

  async escalate(
    identifier: string,
    escalation: { id?: string; name?: string },
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.post(
      `/v2/alerts/${identifier}/escalate`,
      { ...payload, escalation },
      { params: { identifierType } }
    );
    return response.data;
  }

  async assign(
    identifier: string,
    owner: { id?: string; username?: string },
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.post(
      `/v2/alerts/${identifier}/assign`,
      { ...payload, owner },
      { params: { identifierType } }
    );
    return response.data;
  }

  async addTeam(
    identifier: string,
    team: { id?: string; name?: string },
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.post(
      `/v2/alerts/${identifier}/teams`,
      { ...payload, team },
      { params: { identifierType } }
    );
    return response.data;
  }

  async addNote(
    identifier: string,
    note: string,
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.post(
      `/v2/alerts/${identifier}/notes`,
      { ...payload, note },
      { params: { identifierType } }
    );
    return response.data;
  }

  async addTags(
    identifier: string,
    tags: string[],
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.post(
      `/v2/alerts/${identifier}/tags`,
      { ...payload, tags },
      { params: { identifierType } }
    );
    return response.data;
  }

  async removeTags(
    identifier: string,
    tags: string[],
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.delete(
      `/v2/alerts/${identifier}/tags`,
      {
        params: { identifierType, tags: tags.join(',') },
        data: payload
      }
    );
    return response.data;
  }

  async addDetails(
    identifier: string,
    details: Record<string, string>,
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.post(
      `/v2/alerts/${identifier}/details`,
      { ...payload, details },
      { params: { identifierType } }
    );
    return response.data;
  }

  async removeDetails(
    identifier: string,
    keys: string[],
    identifierType: 'id' | 'alias' | 'tiny' = 'id',
    payload?: { user?: string; source?: string; note?: string }
  ): Promise<AlertResponse> {
    const response = await this.client.delete(
      `/v2/alerts/${identifier}/details`,
      {
        params: { identifierType, keys: keys.join(',') },
        data: payload
      }
    );
    return response.data;
  }

  async delete(identifier: string, identifierType: 'id' | 'alias' | 'tiny' = 'id'): Promise<AlertResponse> {
    const response = await this.client.delete(`/v2/alerts/${identifier}`, {
      params: { identifierType }
    });
    return response.data;
  }

  async count(query?: string): Promise<number> {
    const response = await this.client.get('/v2/alerts/count', {
      params: { query }
    });
    return response.data.data.count;
  }
}

export { OpsGenieAlertClient, AlertPayload, Alert, Priority };
```

### Incident Management Client
```typescript
// lib/opsgenie/incident-client.ts
import axios, { AxiosInstance } from 'axios';

type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
type IncidentStatus = 'open' | 'resolved' | 'closed';

interface IncidentPayload {
  message: string;
  description?: string;
  responders?: Array<{
    type: 'team' | 'user';
    id?: string;
    name?: string;
    username?: string;
  }>;
  tags?: string[];
  details?: Record<string, string>;
  priority?: IncidentPriority;
  impactedServices?: string[];
  statusPageEntry?: {
    title: string;
    detail?: string;
  };
  notifyStakeholders?: boolean;
}

interface Incident {
  id: string;
  tinyId: string;
  message: string;
  status: IncidentStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  priority: IncidentPriority;
  ownerTeam: string;
  responders: Array<{ type: string; id: string }>;
  extraProperties: Record<string, string>;
  impactedServices: string[];
  impactStartDate: string;
  impactEndDate?: string;
}

interface TimelineEntry {
  id: string;
  group: string;
  type: string;
  eventTime: string;
  hidden: boolean;
  actor: {
    name: string;
    type: string;
  };
  description: {
    name: string;
    type: string;
  };
  lastEdit?: {
    editTime: string;
    actor: { name: string; type: string };
  };
}

class OpsGenieIncidentClient {
  private client: AxiosInstance;

  constructor(config: { apiKey: string; apiUrl?: string }) {
    const baseURL = config.apiUrl ||
      (process.env.OPSGENIE_EU_INSTANCE === 'true'
        ? 'https://api.eu.opsgenie.com'
        : 'https://api.opsgenie.com');

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `GenieKey ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async create(payload: IncidentPayload): Promise<{ result: string; requestId: string }> {
    const response = await this.client.post('/v1/incidents/create', payload);
    return response.data;
  }

  async get(identifier: string, identifierType: 'id' | 'tiny' = 'id'): Promise<Incident> {
    const response = await this.client.get(`/v1/incidents/${identifier}`, {
      params: { identifierType }
    });
    return response.data.data;
  }

  async list(params?: {
    query?: string;
    offset?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<{ data: Incident[]; paging?: { next?: string } }> {
    const response = await this.client.get('/v1/incidents', { params });
    return response.data;
  }

  async resolve(
    identifier: string,
    identifierType: 'id' | 'tiny' = 'id',
    payload?: { note?: string }
  ): Promise<{ result: string; requestId: string }> {
    const response = await this.client.post(
      `/v1/incidents/${identifier}/resolve`,
      payload || {},
      { params: { identifierType } }
    );
    return response.data;
  }

  async close(
    identifier: string,
    identifierType: 'id' | 'tiny' = 'id',
    payload?: { note?: string }
  ): Promise<{ result: string; requestId: string }> {
    const response = await this.client.post(
      `/v1/incidents/${identifier}/close`,
      payload || {},
      { params: { identifierType } }
    );
    return response.data;
  }

  async addResponder(
    identifier: string,
    responder: { type: 'team' | 'user'; id?: string; name?: string; username?: string },
    identifierType: 'id' | 'tiny' = 'id'
  ): Promise<{ result: string; requestId: string }> {
    const response = await this.client.post(
      `/v1/incidents/${identifier}/responders`,
      { responder },
      { params: { identifierType } }
    );
    return response.data;
  }

  async getTimeline(
    identifier: string,
    identifierType: 'id' | 'tiny' = 'id',
    params?: { offset?: number; limit?: number; order?: 'asc' | 'desc' }
  ): Promise<{ data: TimelineEntry[] }> {
    const response = await this.client.get(
      `/v1/incidents/${identifier}/timeline`,
      { params: { identifierType, ...params } }
    );
    return response.data;
  }

  async addTimelineEntry(
    identifier: string,
    content: string,
    displayDate?: Date,
    identifierType: 'id' | 'tiny' = 'id'
  ): Promise<{ result: string; requestId: string }> {
    const response = await this.client.post(
      `/v1/incidents/${identifier}/timeline`,
      {
        content,
        displayDate: displayDate?.toISOString()
      },
      { params: { identifierType } }
    );
    return response.data;
  }

  async delete(identifier: string, identifierType: 'id' | 'tiny' = 'id'): Promise<{ result: string }> {
    const response = await this.client.delete(`/v1/incidents/${identifier}`, {
      params: { identifierType }
    });
    return response.data;
  }
}

export { OpsGenieIncidentClient, IncidentPayload, Incident, TimelineEntry };
```

### Schedule and On-Call Client
```typescript
// lib/opsgenie/oncall-client.ts
import axios, { AxiosInstance } from 'axios';

interface Schedule {
  id: string;
  name: string;
  description?: string;
  timezone: string;
  enabled: boolean;
  ownerTeam: { id: string; name: string };
  rotations: Rotation[];
}

interface Rotation {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  type: 'daily' | 'weekly' | 'hourly';
  length: number;
  participants: Array<{
    type: 'user' | 'team' | 'escalation' | 'none';
    id?: string;
    username?: string;
    name?: string;
  }>;
  timeRestriction?: {
    type: 'time-of-day' | 'weekday-and-time-of-day';
    restrictions: Array<{
      startHour: number;
      startMin: number;
      endHour: number;
      endMin: number;
      startDay?: string;
      endDay?: string;
    }>;
  };
}

interface OnCallParticipant {
  id: string;
  name: string;
  type: 'user' | 'team' | 'escalation';
  onCallRecipientType: string;
  escalationTime?: number;
  notifyType?: string;
}

interface WhoIsOnCall {
  _parent: {
    id: string;
    name: string;
    enabled: boolean;
  };
  onCallParticipants: OnCallParticipant[];
  onCallRecipients: string[];
}

class OpsGenieOnCallClient {
  private client: AxiosInstance;

  constructor(config: { apiKey: string; apiUrl?: string }) {
    const baseURL = config.apiUrl ||
      (process.env.OPSGENIE_EU_INSTANCE === 'true'
        ? 'https://api.eu.opsgenie.com'
        : 'https://api.opsgenie.com');

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `GenieKey ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  // Schedule Management
  async listSchedules(): Promise<{ data: Schedule[] }> {
    const response = await this.client.get('/v2/schedules');
    return response.data;
  }

  async getSchedule(identifier: string, identifierType: 'id' | 'name' = 'id'): Promise<Schedule> {
    const response = await this.client.get(`/v2/schedules/${identifier}`, {
      params: { identifierType }
    });
    return response.data.data;
  }

  async createSchedule(payload: {
    name: string;
    description?: string;
    timezone: string;
    enabled?: boolean;
    ownerTeam: { id?: string; name?: string };
    rotations?: Omit<Rotation, 'id'>[];
  }): Promise<{ result: string; data: { id: string; name: string } }> {
    const response = await this.client.post('/v2/schedules', payload);
    return response.data;
  }

  async updateSchedule(
    identifier: string,
    payload: Partial<{
      name: string;
      description: string;
      timezone: string;
      enabled: boolean;
      ownerTeam: { id?: string; name?: string };
      rotations: Omit<Rotation, 'id'>[];
    }>,
    identifierType: 'id' | 'name' = 'id'
  ): Promise<{ result: string }> {
    const response = await this.client.patch(
      `/v2/schedules/${identifier}`,
      payload,
      { params: { identifierType } }
    );
    return response.data;
  }

  async deleteSchedule(identifier: string, identifierType: 'id' | 'name' = 'id'): Promise<{ result: string }> {
    const response = await this.client.delete(`/v2/schedules/${identifier}`, {
      params: { identifierType }
    });
    return response.data;
  }

  // On-Call Queries
  async whoIsOnCall(
    identifier: string,
    identifierType: 'id' | 'name' = 'id',
    params?: {
      flat?: boolean;
      date?: string;
    }
  ): Promise<WhoIsOnCall> {
    const response = await this.client.get(
      `/v2/schedules/${identifier}/on-calls`,
      { params: { identifierType, ...params } }
    );
    return response.data.data;
  }

  async getNextOnCalls(
    identifier: string,
    identifierType: 'id' | 'name' = 'id',
    params?: {
      flat?: boolean;
      date?: string;
    }
  ): Promise<WhoIsOnCall[]> {
    const response = await this.client.get(
      `/v2/schedules/${identifier}/next-on-calls`,
      { params: { identifierType, ...params } }
    );
    return response.data.data;
  }

  // Schedule Overrides
  async createOverride(
    scheduleIdentifier: string,
    payload: {
      user: { id?: string; username?: string };
      startDate: Date;
      endDate: Date;
      rotations?: Array<{ id?: string; name?: string }>;
    },
    identifierType: 'id' | 'name' = 'id'
  ): Promise<{ result: string; data: { alias: string } }> {
    const response = await this.client.post(
      `/v2/schedules/${scheduleIdentifier}/overrides`,
      {
        ...payload,
        startDate: payload.startDate.toISOString(),
        endDate: payload.endDate.toISOString()
      },
      { params: { identifierType } }
    );
    return response.data;
  }

  async listOverrides(
    scheduleIdentifier: string,
    identifierType: 'id' | 'name' = 'id'
  ): Promise<{ data: Array<{ alias: string; user: { id: string; username: string }; startDate: string; endDate: string }> }> {
    const response = await this.client.get(
      `/v2/schedules/${scheduleIdentifier}/overrides`,
      { params: { identifierType } }
    );
    return response.data;
  }

  async deleteOverride(
    scheduleIdentifier: string,
    overrideAlias: string,
    identifierType: 'id' | 'name' = 'id'
  ): Promise<{ result: string }> {
    const response = await this.client.delete(
      `/v2/schedules/${scheduleIdentifier}/overrides/${overrideAlias}`,
      { params: { identifierType } }
    );
    return response.data;
  }

  // Timeline export
  async exportScheduleTimeline(
    identifier: string,
    params: {
      intervalUnit: 'days' | 'weeks' | 'months';
      intervalCount: number;
      date?: string;
    },
    identifierType: 'id' | 'name' = 'id'
  ): Promise<{
    data: {
      timeline: {
        rotations: Array<{
          id: string;
          name: string;
          order: number;
          periods: Array<{
            startDate: string;
            endDate: string;
            type: string;
            recipient: { type: string; id: string; name: string };
            flattenedRecipients: Array<{ type: string; id: string; name: string }>;
          }>;
        }>;
        finalTimeline: {
          periods: Array<{
            startDate: string;
            endDate: string;
            recipient: { type: string; id: string; name: string };
            flattenedRecipients: Array<{ type: string; id: string; name: string }>;
          }>;
        };
      };
    };
  }> {
    const response = await this.client.get(
      `/v2/schedules/${identifier}/timeline`,
      { params: { identifierType, ...params } }
    );
    return response.data;
  }
}

export { OpsGenieOnCallClient, Schedule, Rotation, WhoIsOnCall, OnCallParticipant };
```

### Alert Manager
```typescript
// lib/opsgenie/alert-manager.ts
import { OpsGenieAlertClient, AlertPayload, Priority } from './alert-client';
import { createHash } from 'crypto';

interface AlertManagerConfig {
  apiKey: string;
  defaultSource: string;
  defaultTeam?: string;
  defaultPriority?: Priority;
  aliasPrefix?: string;
}

interface ManagedAlert {
  alias: string;
  message: string;
  priority: Priority;
  createdAt: Date;
  acknowledgedAt?: Date;
  closedAt?: Date;
}

class OpsGenieAlertManager {
  private client: OpsGenieAlertClient;
  private config: AlertManagerConfig;
  private activeAlerts: Map<string, ManagedAlert> = new Map();

  constructor(config: AlertManagerConfig) {
    this.config = config;
    this.client = new OpsGenieAlertClient({
      apiKey: config.apiKey,
      defaultSource: config.defaultSource
    });
  }

  private generateAlias(params: {
    component?: string;
    alertType: string;
    identifier?: string;
  }): string {
    const parts = [
      this.config.aliasPrefix || 'alert',
      params.component,
      params.alertType,
      params.identifier
    ].filter(Boolean);

    return createHash('sha256')
      .update(parts.join(':'))
      .digest('hex')
      .substring(0, 32);
  }

  async alert(params: {
    message: string;
    priority?: Priority;
    component?: string;
    alertType: string;
    identifier?: string;
    description?: string;
    details?: Record<string, string>;
    tags?: string[];
    actions?: string[];
  }): Promise<string> {
    const alias = this.generateAlias({
      component: params.component,
      alertType: params.alertType,
      identifier: params.identifier
    });

    // Check if alert already exists
    const existingAlert = this.activeAlerts.get(alias);
    if (existingAlert && !existingAlert.closedAt) {
      console.log(`Alert already active: ${alias}`);
      return alias;
    }

    const priority = params.priority || this.config.defaultPriority || 'P3';

    const payload: AlertPayload = {
      message: params.message,
      alias,
      description: params.description,
      priority,
      tags: params.tags,
      actions: params.actions,
      details: {
        alert_type: params.alertType,
        component: params.component || 'unknown',
        ...params.details
      }
    };

    if (this.config.defaultTeam) {
      payload.responders = [{ type: 'team', name: this.config.defaultTeam }];
    }

    await this.client.create(payload);

    this.activeAlerts.set(alias, {
      alias,
      message: params.message,
      priority,
      createdAt: new Date()
    });

    return alias;
  }

  async acknowledge(alias: string, note?: string): Promise<void> {
    const alert = this.activeAlerts.get(alias);

    await this.client.acknowledge(alias, 'alias', { note });

    if (alert) {
      alert.acknowledgedAt = new Date();
    }
  }

  async close(alias: string, note?: string): Promise<void> {
    await this.client.close(alias, 'alias', { note });

    const alert = this.activeAlerts.get(alias);
    if (alert) {
      alert.closedAt = new Date();
    }
  }

  async escalate(alias: string, escalationName: string, note?: string): Promise<void> {
    await this.client.escalate(
      alias,
      { name: escalationName },
      'alias',
      { note }
    );
  }

  getActiveAlerts(): ManagedAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(a => !a.closedAt);
  }

  getAlert(alias: string): ManagedAlert | undefined {
    return this.activeAlerts.get(alias);
  }

  // Convenience methods
  async criticalAlert(message: string, details?: Record<string, string>): Promise<string> {
    return this.alert({
      message,
      priority: 'P1',
      alertType: 'critical',
      details
    });
  }

  async highAlert(message: string, details?: Record<string, string>): Promise<string> {
    return this.alert({
      message,
      priority: 'P2',
      alertType: 'high',
      details
    });
  }

  async mediumAlert(message: string, details?: Record<string, string>): Promise<string> {
    return this.alert({
      message,
      priority: 'P3',
      alertType: 'medium',
      details
    });
  }

  async lowAlert(message: string, details?: Record<string, string>): Promise<string> {
    return this.alert({
      message,
      priority: 'P4',
      alertType: 'low',
      details
    });
  }
}

export { OpsGenieAlertManager, AlertManagerConfig, ManagedAlert };
```

## Express.js Integration

### Error Handler and Middleware
```typescript
// middleware/opsgenie.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { OpsGenieAlertManager } from '../lib/opsgenie/alert-manager';

const alertManager = new OpsGenieAlertManager({
  apiKey: process.env.OPSGENIE_API_KEY!,
  defaultSource: process.env.APP_NAME || 'api-server',
  defaultTeam: process.env.OPSGENIE_DEFAULT_TEAM,
  defaultPriority: 'P3',
  aliasPrefix: process.env.NODE_ENV || 'production'
});

// Error handler middleware
export const opsgenieErrorHandler: ErrorRequestHandler = async (
  error: Error & { statusCode?: number; context?: Record<string, any> },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;

  // Only alert on 5xx errors
  if (statusCode >= 500) {
    try {
      await alertManager.alert({
        message: `[${statusCode}] ${error.message} - ${req.method} ${req.path}`,
        priority: statusCode === 500 ? 'P2' : 'P3',
        component: 'api',
        alertType: 'http_error',
        identifier: `${req.method}_${req.path}`.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        description: `Error occurred while processing ${req.method} ${req.path}`,
        details: {
          error_name: error.name,
          error_message: error.message,
          method: req.method,
          path: req.path,
          query: JSON.stringify(req.query),
          user_agent: req.headers['user-agent'] || 'unknown',
          request_id: (req.headers['x-request-id'] as string) || 'unknown'
        },
        tags: ['api', 'error', `status-${statusCode}`]
      });
    } catch (alertError) {
      console.error('Failed to send OpsGenie alert:', alertError);
    }
  }

  res.status(statusCode).json({
    error: error.message,
    requestId: req.headers['x-request-id']
  });
};

// Health check alert factory
export function createHealthCheckAlert(checkName: string, check: () => Promise<boolean>) {
  let lastStatus = true;
  let currentAlias: string | null = null;

  return async function performHealthCheck(): Promise<boolean> {
    try {
      const isHealthy = await check();

      if (!isHealthy && lastStatus) {
        // Service became unhealthy
        currentAlias = await alertManager.alert({
          message: `Health check failed: ${checkName}`,
          priority: 'P2',
          component: 'health',
          alertType: 'health_check_failure',
          identifier: checkName.toLowerCase().replace(/\s+/g, '_'),
          description: `Health check "${checkName}" is failing`,
          tags: ['health', 'automated']
        });
      } else if (isHealthy && !lastStatus && currentAlias) {
        // Service recovered
        await alertManager.close(
          currentAlias,
          `Health check "${checkName}" recovered`
        );
        currentAlias = null;
      }

      lastStatus = isHealthy;
      return isHealthy;
    } catch (error) {
      if (lastStatus) {
        currentAlias = await alertManager.alert({
          message: `Health check error: ${checkName}`,
          priority: 'P1',
          component: 'health',
          alertType: 'health_check_error',
          identifier: checkName.toLowerCase().replace(/\s+/g, '_'),
          details: {
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          tags: ['health', 'error', 'automated']
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
// routes/opsgenie-webhooks.ts
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

interface OpsGenieWebhookPayload {
  action: string;
  integrationId: string;
  integrationName: string;
  source: {
    name: string;
    type: string;
  };
  alert?: {
    alertId: string;
    message: string;
    tags: string[];
    tinyId: string;
    alias: string;
    createdAt: number;
    updatedAt: number;
    username: string;
    userId: string;
    status: string;
    isSeen: boolean;
    acknowledged: boolean;
    priority: string;
    source: string;
    team: string;
    teams: string[];
    owner: string;
    responders: Array<{ type: string; id: string; name: string }>;
    details: Record<string, string>;
    description: string;
  };
  incident?: {
    id: string;
    tinyId: string;
    message: string;
    status: string;
    priority: string;
    tags: string[];
    details: Record<string, string>;
    responders: Array<{ type: string; id: string; name: string }>;
  };
  escalation?: {
    id: string;
    name: string;
  };
}

// Optional: Signature verification
function verifySignature(secret: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const signature = req.headers['x-opsgenie-signature'] as string;

    if (!signature || !secret) {
      // Skip verification if no secret configured
      return next();
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  };
}

router.use(express.json());

// Apply signature verification if configured
if (process.env.OPSGENIE_WEBHOOK_SECRET) {
  router.use(verifySignature(process.env.OPSGENIE_WEBHOOK_SECRET));
}

router.post('/webhook', async (req, res) => {
  const payload = req.body as OpsGenieWebhookPayload;

  console.log(`OpsGenie webhook: ${payload.action}`, {
    integrationName: payload.integrationName,
    alertId: payload.alert?.alertId,
    incidentId: payload.incident?.id
  });

  try {
    switch (payload.action) {
      // Alert actions
      case 'Create':
        await handleAlertCreated(payload);
        break;
      case 'Acknowledge':
        await handleAlertAcknowledged(payload);
        break;
      case 'UnAcknowledge':
        await handleAlertUnacknowledged(payload);
        break;
      case 'Close':
        await handleAlertClosed(payload);
        break;
      case 'Delete':
        await handleAlertDeleted(payload);
        break;
      case 'Escalate':
        await handleAlertEscalated(payload);
        break;
      case 'AssignOwnership':
        await handleAlertAssigned(payload);
        break;
      case 'AddNote':
        await handleNoteAdded(payload);
        break;
      case 'AddTags':
      case 'RemoveTags':
        await handleTagsChanged(payload);
        break;
      case 'AddRecipient':
      case 'AddTeam':
        await handleResponderAdded(payload);
        break;

      // Incident actions
      case 'incident.created':
        await handleIncidentCreated(payload);
        break;
      case 'incident.resolved':
        await handleIncidentResolved(payload);
        break;
      case 'incident.closed':
        await handleIncidentClosed(payload);
        break;

      default:
        console.log(`Unhandled action: ${payload.action}`);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Alert handlers
async function handleAlertCreated(payload: OpsGenieWebhookPayload) {
  const alert = payload.alert!;
  console.log('Alert created:', alert.message);

  // Create incident record in database
  // Post to Slack
  // Update status page
}

async function handleAlertAcknowledged(payload: OpsGenieWebhookPayload) {
  const alert = payload.alert!;
  console.log('Alert acknowledged by:', alert.username);

  // Update incident record
  // Notify stakeholders
}

async function handleAlertUnacknowledged(payload: OpsGenieWebhookPayload) {
  const alert = payload.alert!;
  console.log('Alert unacknowledged:', alert.message);
}

async function handleAlertClosed(payload: OpsGenieWebhookPayload) {
  const alert = payload.alert!;
  console.log('Alert closed:', alert.message);

  // Update incident record
  // Generate post-incident report
  // Update status page
}

async function handleAlertDeleted(payload: OpsGenieWebhookPayload) {
  console.log('Alert deleted:', payload.alert?.alertId);
}

async function handleAlertEscalated(payload: OpsGenieWebhookPayload) {
  console.log('Alert escalated to:', payload.escalation?.name);

  // Notify escalation targets
  // Update incident timeline
}

async function handleAlertAssigned(payload: OpsGenieWebhookPayload) {
  const alert = payload.alert!;
  console.log('Alert assigned to:', alert.owner);
}

async function handleNoteAdded(payload: OpsGenieWebhookPayload) {
  console.log('Note added to alert:', payload.alert?.alertId);
}

async function handleTagsChanged(payload: OpsGenieWebhookPayload) {
  const alert = payload.alert!;
  console.log('Tags changed:', alert.tags);
}

async function handleResponderAdded(payload: OpsGenieWebhookPayload) {
  console.log('Responder added to alert:', payload.alert?.alertId);
}

// Incident handlers
async function handleIncidentCreated(payload: OpsGenieWebhookPayload) {
  const incident = payload.incident!;
  console.log('Incident created:', incident.message);

  // Create incident record
  // Notify stakeholders
  // Start incident timer
}

async function handleIncidentResolved(payload: OpsGenieWebhookPayload) {
  const incident = payload.incident!;
  console.log('Incident resolved:', incident.message);

  // Stop incident timer
  // Calculate metrics
}

async function handleIncidentClosed(payload: OpsGenieWebhookPayload) {
  const incident = payload.incident!;
  console.log('Incident closed:', incident.message);

  // Finalize incident record
  // Generate post-mortem template
}

export default router;
```

## Python Integration

### Alert Client
```python
# opsgenie/alerts.py
import os
import hashlib
import httpx
from typing import Optional, Dict, Any, List, Literal
from dataclasses import dataclass, field
from datetime import datetime

Priority = Literal["P1", "P2", "P3", "P4", "P5"]

@dataclass
class AlertPayload:
    message: str
    alias: Optional[str] = None
    description: Optional[str] = None
    responders: Optional[List[Dict[str, str]]] = None
    visible_to: Optional[List[Dict[str, str]]] = None
    actions: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    details: Optional[Dict[str, str]] = None
    entity: Optional[str] = None
    source: Optional[str] = None
    priority: Optional[Priority] = None
    user: Optional[str] = None
    note: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        data = {"message": self.message}

        if self.alias:
            data["alias"] = self.alias
        if self.description:
            data["description"] = self.description
        if self.responders:
            data["responders"] = self.responders
        if self.visible_to:
            data["visibleTo"] = self.visible_to
        if self.actions:
            data["actions"] = self.actions
        if self.tags:
            data["tags"] = self.tags
        if self.details:
            data["details"] = self.details
        if self.entity:
            data["entity"] = self.entity
        if self.source:
            data["source"] = self.source
        if self.priority:
            data["priority"] = self.priority
        if self.user:
            data["user"] = self.user
        if self.note:
            data["note"] = self.note

        return data

@dataclass
class AlertResponse:
    result: str
    took: float
    request_id: str

class OpsGenieAlertClient:
    def __init__(
        self,
        api_key: str,
        default_source: str = "application",
        api_url: Optional[str] = None
    ):
        if api_url:
            self.base_url = api_url
        elif os.environ.get("OPSGENIE_EU_INSTANCE") == "true":
            self.base_url = "https://api.eu.opsgenie.com"
        else:
            self.base_url = "https://api.opsgenie.com"

        self.default_source = default_source
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"GenieKey {api_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )

    async def create(self, payload: AlertPayload) -> AlertResponse:
        data = payload.to_dict()
        if not data.get("source"):
            data["source"] = self.default_source

        response = await self.client.post(
            f"{self.base_url}/v2/alerts",
            json=data
        )
        response.raise_for_status()
        result = response.json()

        return AlertResponse(
            result=result["result"],
            took=result["took"],
            request_id=result["requestId"]
        )

    async def get(
        self,
        identifier: str,
        identifier_type: Literal["id", "alias", "tiny"] = "id"
    ) -> Dict[str, Any]:
        response = await self.client.get(
            f"{self.base_url}/v2/alerts/{identifier}",
            params={"identifierType": identifier_type}
        )
        response.raise_for_status()
        return response.json()["data"]

    async def list_alerts(
        self,
        query: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
        sort: str = "createdAt",
        order: Literal["asc", "desc"] = "desc"
    ) -> List[Dict[str, Any]]:
        params = {
            "offset": offset,
            "limit": limit,
            "sort": sort,
            "order": order
        }
        if query:
            params["query"] = query

        response = await self.client.get(
            f"{self.base_url}/v2/alerts",
            params=params
        )
        response.raise_for_status()
        return response.json()["data"]

    async def close(
        self,
        identifier: str,
        identifier_type: Literal["id", "alias", "tiny"] = "id",
        user: Optional[str] = None,
        source: Optional[str] = None,
        note: Optional[str] = None
    ) -> AlertResponse:
        data = {}
        if user:
            data["user"] = user
        if source:
            data["source"] = source
        if note:
            data["note"] = note

        response = await self.client.post(
            f"{self.base_url}/v2/alerts/{identifier}/close",
            params={"identifierType": identifier_type},
            json=data
        )
        response.raise_for_status()
        result = response.json()

        return AlertResponse(
            result=result["result"],
            took=result["took"],
            request_id=result["requestId"]
        )

    async def acknowledge(
        self,
        identifier: str,
        identifier_type: Literal["id", "alias", "tiny"] = "id",
        user: Optional[str] = None,
        source: Optional[str] = None,
        note: Optional[str] = None
    ) -> AlertResponse:
        data = {}
        if user:
            data["user"] = user
        if source:
            data["source"] = source
        if note:
            data["note"] = note

        response = await self.client.post(
            f"{self.base_url}/v2/alerts/{identifier}/acknowledge",
            params={"identifierType": identifier_type},
            json=data
        )
        response.raise_for_status()
        result = response.json()

        return AlertResponse(
            result=result["result"],
            took=result["took"],
            request_id=result["requestId"]
        )

    async def add_note(
        self,
        identifier: str,
        note: str,
        identifier_type: Literal["id", "alias", "tiny"] = "id",
        user: Optional[str] = None
    ) -> AlertResponse:
        data = {"note": note}
        if user:
            data["user"] = user

        response = await self.client.post(
            f"{self.base_url}/v2/alerts/{identifier}/notes",
            params={"identifierType": identifier_type},
            json=data
        )
        response.raise_for_status()
        result = response.json()

        return AlertResponse(
            result=result["result"],
            took=result["took"],
            request_id=result["requestId"]
        )

    async def escalate(
        self,
        identifier: str,
        escalation_name: str,
        identifier_type: Literal["id", "alias", "tiny"] = "id",
        user: Optional[str] = None,
        note: Optional[str] = None
    ) -> AlertResponse:
        data = {"escalation": {"name": escalation_name}}
        if user:
            data["user"] = user
        if note:
            data["note"] = note

        response = await self.client.post(
            f"{self.base_url}/v2/alerts/{identifier}/escalate",
            params={"identifierType": identifier_type},
            json=data
        )
        response.raise_for_status()
        result = response.json()

        return AlertResponse(
            result=result["result"],
            took=result["took"],
            request_id=result["requestId"]
        )

    async def close(self):
        await self.client.aclose()
```

### FastAPI Integration
```python
# fastapi_opsgenie.py
import os
import traceback
import hashlib
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from opsgenie.alerts import OpsGenieAlertClient, AlertPayload

# Global client
opsgenie_client: OpsGenieAlertClient = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global opsgenie_client
    opsgenie_client = OpsGenieAlertClient(
        api_key=os.environ["OPSGENIE_API_KEY"],
        default_source=os.environ.get("APP_NAME", "api")
    )
    yield
    await opsgenie_client.close()

app = FastAPI(lifespan=lifespan)

def generate_alias(method: str, path: str) -> str:
    """Generate deterministic alias for deduplication."""
    key = f"api_error_{method}_{path}".lower()
    return hashlib.sha256(key.encode()).hexdigest()[:32]

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    status_code = exc.status_code if isinstance(exc, HTTPException) else 500

    # Alert on 500 errors
    if status_code >= 500:
        try:
            alias = generate_alias(request.method, request.url.path)

            payload = AlertPayload(
                message=f"[{status_code}] {str(exc)} - {request.method} {request.url.path}",
                alias=alias,
                description=f"Error occurred while processing {request.method} {request.url.path}",
                priority="P2" if status_code == 500 else "P3",
                tags=["api", "error", f"status-{status_code}"],
                details={
                    "error_type": type(exc).__name__,
                    "error_message": str(exc),
                    "traceback": "\n".join(traceback.format_exc().split("\n")[:10]),
                    "method": request.method,
                    "path": request.url.path,
                    "query": str(request.query_params),
                    "client": request.client.host if request.client else "unknown"
                }
            )

            await opsgenie_client.create(payload)
        except Exception as alert_error:
            print(f"Failed to send OpsGenie alert: {alert_error}")

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
            alias = f"slow_request_{request.method}_{request.url.path}".lower()
            alias = hashlib.sha256(alias.encode()).hexdigest()[:32]

            payload = AlertPayload(
                message=f"Slow request: {request.method} {request.url.path} ({duration_ms:.0f}ms)",
                alias=alias,
                priority="P4",
                tags=["performance", "slow-request"],
                details={
                    "duration_ms": str(int(duration_ms)),
                    "threshold_ms": str(self.threshold_ms),
                    "method": request.method,
                    "path": request.url.path
                }
            )

            try:
                await opsgenie_client.create(payload)
            except Exception as e:
                print(f"Failed to send slow request alert: {e}")

        return response

app.add_middleware(SlowRequestAlertMiddleware, threshold_ms=5000)
```

## Go Integration

```go
// opsgenie/client.go
package opsgenie

import (
    "context"
    "os"

    "github.com/opsgenie/opsgenie-go-sdk-v2/alert"
    "github.com/opsgenie/opsgenie-go-sdk-v2/client"
    "github.com/opsgenie/opsgenie-go-sdk-v2/incident"
    "github.com/opsgenie/opsgenie-go-sdk-v2/schedule"
)

type Client struct {
    alertClient    *alert.Client
    incidentClient *incident.Client
    scheduleClient *schedule.Client
    defaultSource  string
}

type Config struct {
    APIKey        string
    DefaultSource string
    UseEUInstance bool
}

func NewClient(config Config) (*Client, error) {
    cfg := &client.Config{
        ApiKey: config.APIKey,
    }

    if config.UseEUInstance || os.Getenv("OPSGENIE_EU_INSTANCE") == "true" {
        cfg.OpsGenieAPIURL = client.API_URL_EU
    }

    alertClient, err := alert.NewClient(cfg)
    if err != nil {
        return nil, err
    }

    incidentClient, err := incident.NewClient(cfg)
    if err != nil {
        return nil, err
    }

    scheduleClient, err := schedule.NewClient(cfg)
    if err != nil {
        return nil, err
    }

    return &Client{
        alertClient:    alertClient,
        incidentClient: incidentClient,
        scheduleClient: scheduleClient,
        defaultSource:  config.DefaultSource,
    }, nil
}

// Alert methods
func (c *Client) CreateAlert(ctx context.Context, req *alert.CreateAlertRequest) (*alert.AsyncAlertResult, error) {
    if req.Source == "" {
        req.Source = c.defaultSource
    }
    return c.alertClient.Create(ctx, req)
}

func (c *Client) GetAlert(ctx context.Context, identifier string) (*alert.GetAlertResult, error) {
    return c.alertClient.Get(ctx, &alert.GetAlertRequest{
        IdentifierType:  alert.ALERTID,
        IdentifierValue: identifier,
    })
}

func (c *Client) CloseAlert(ctx context.Context, identifier string, note string) (*alert.AsyncAlertResult, error) {
    return c.alertClient.Close(ctx, &alert.CloseAlertRequest{
        IdentifierType:  alert.ALERTID,
        IdentifierValue: identifier,
        Note:            note,
        Source:          c.defaultSource,
    })
}

func (c *Client) AcknowledgeAlert(ctx context.Context, identifier string, note string) (*alert.AsyncAlertResult, error) {
    return c.alertClient.Acknowledge(ctx, &alert.AcknowledgeAlertRequest{
        IdentifierType:  alert.ALERTID,
        IdentifierValue: identifier,
        Note:            note,
        Source:          c.defaultSource,
    })
}

func (c *Client) AddNote(ctx context.Context, identifier string, note string) (*alert.AsyncAlertResult, error) {
    return c.alertClient.AddNote(ctx, &alert.AddNoteRequest{
        IdentifierType:  alert.ALERTID,
        IdentifierValue: identifier,
        Note:            note,
        Source:          c.defaultSource,
    })
}

// Incident methods
func (c *Client) CreateIncident(ctx context.Context, req *incident.CreateRequest) (*incident.AsyncResult, error) {
    return c.incidentClient.Create(ctx, req)
}

func (c *Client) GetIncident(ctx context.Context, identifier string) (*incident.GetResult, error) {
    return c.incidentClient.Get(ctx, &incident.GetRequest{
        Id: identifier,
    })
}

func (c *Client) ResolveIncident(ctx context.Context, identifier string, note string) (*incident.AsyncResult, error) {
    return c.incidentClient.Resolve(ctx, &incident.ResolveRequest{
        Id:   identifier,
        Note: note,
    })
}

func (c *Client) CloseIncident(ctx context.Context, identifier string, note string) (*incident.AsyncResult, error) {
    return c.incidentClient.Close(ctx, &incident.CloseRequest{
        Id:   identifier,
        Note: note,
    })
}

// Schedule methods
func (c *Client) GetOnCall(ctx context.Context, scheduleName string) (*schedule.GetOnCallsResult, error) {
    return c.scheduleClient.GetOnCalls(ctx, &schedule.GetOnCallsRequest{
        ScheduleIdentifierType:  schedule.Name,
        ScheduleIdentifierValue: scheduleName,
        Flat:                    true,
    })
}

func (c *Client) ListSchedules(ctx context.Context) (*schedule.ListResult, error) {
    return c.scheduleClient.List(ctx, &schedule.ListRequest{})
}
```

### Gin Middleware
```go
// middleware/opsgenie.go
package middleware

import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "runtime/debug"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/opsgenie/opsgenie-go-sdk-v2/alert"
    og "yourapp/opsgenie"
)

func generateAlias(method, path string) string {
    key := fmt.Sprintf("api_error_%s_%s", strings.ToLower(method), strings.ToLower(path))
    hash := sha256.Sum256([]byte(key))
    return hex.EncodeToString(hash[:])[:32]
}

func OpsGenieRecovery(client *og.Client) gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                stack := string(debug.Stack())

                alias := generateAlias(c.Request.Method, c.Request.URL.Path)

                _, alertErr := client.CreateAlert(c.Request.Context(), &alert.CreateAlertRequest{
                    Message:     fmt.Sprintf("[PANIC] %v - %s %s", err, c.Request.Method, c.Request.URL.Path),
                    Alias:       alias,
                    Description: fmt.Sprintf("Panic recovered in %s %s", c.Request.Method, c.Request.URL.Path),
                    Priority:    alert.P1,
                    Tags:        []string{"api", "panic", "critical"},
                    Details: map[string]string{
                        "error":     fmt.Sprintf("%v", err),
                        "stack":     stack[:min(len(stack), 500)],
                        "method":    c.Request.Method,
                        "path":      c.Request.URL.Path,
                        "client_ip": c.ClientIP(),
                    },
                })

                if alertErr != nil {
                    fmt.Printf("Failed to send OpsGenie alert: %v\n", alertErr)
                }

                c.AbortWithStatusJSON(500, gin.H{"error": "Internal server error"})
            }
        }()

        c.Next()
    }
}

func OpsGenieLatencyAlert(client *og.Client, thresholdMs int64) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        c.Next()

        durationMs := time.Since(start).Milliseconds()

        if durationMs > thresholdMs {
            alias := generateAlias("slow", c.Request.URL.Path)

            _, _ = client.CreateAlert(c.Request.Context(), &alert.CreateAlertRequest{
                Message:  fmt.Sprintf("Slow request: %s %s (%dms)", c.Request.Method, c.Request.URL.Path, durationMs),
                Alias:    alias,
                Priority: alert.P4,
                Tags:     []string{"performance", "slow-request"},
                Details: map[string]string{
                    "duration_ms":  fmt.Sprintf("%d", durationMs),
                    "threshold_ms": fmt.Sprintf("%d", thresholdMs),
                    "method":       c.Request.Method,
                    "path":         c.Request.URL.Path,
                    "status_code":  fmt.Sprintf("%d", c.Writer.Status()),
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
// __tests__/opsgenie.test.ts
import { OpsGenieAlertClient, AlertPayload } from '../lib/opsgenie/alert-client';
import { OpsGenieAlertManager } from '../lib/opsgenie/alert-manager';
import nock from 'nock';

describe('OpsGenieAlertClient', () => {
  let client: OpsGenieAlertClient;

  beforeEach(() => {
    client = new OpsGenieAlertClient({
      apiKey: 'test-api-key',
      defaultSource: 'test-app'
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should create an alert', async () => {
    const scope = nock('https://api.opsgenie.com')
      .post('/v2/alerts', (body) => {
        return body.message === 'Test alert' &&
               body.source === 'test-app';
      })
      .reply(200, {
        result: 'Request will be processed',
        took: 0.333,
        requestId: 'test-request-id'
      });

    const response = await client.create({
      message: 'Test alert',
      priority: 'P2'
    });

    expect(response.result).toBe('Request will be processed');
    expect(scope.isDone()).toBe(true);
  });

  it('should close an alert', async () => {
    const scope = nock('https://api.opsgenie.com')
      .post('/v2/alerts/test-alias/close')
      .query({ identifierType: 'alias' })
      .reply(200, {
        result: 'Request will be processed',
        took: 0.333,
        requestId: 'test-request-id'
      });

    await client.close('test-alias', 'alias', { note: 'Resolved' });
    expect(scope.isDone()).toBe(true);
  });

  it('should acknowledge an alert', async () => {
    const scope = nock('https://api.opsgenie.com')
      .post('/v2/alerts/test-id/acknowledge')
      .query({ identifierType: 'id' })
      .reply(200, {
        result: 'Request will be processed',
        took: 0.333,
        requestId: 'test-request-id'
      });

    await client.acknowledge('test-id');
    expect(scope.isDone()).toBe(true);
  });
});

describe('OpsGenieAlertManager', () => {
  let manager: OpsGenieAlertManager;

  beforeEach(() => {
    manager = new OpsGenieAlertManager({
      apiKey: 'test-key',
      defaultSource: 'test-app',
      defaultTeam: 'test-team',
      aliasPrefix: 'test'
    });
  });

  it('should track active alerts', async () => {
    nock('https://api.opsgenie.com')
      .post('/v2/alerts')
      .reply(200, {
        result: 'Request will be processed',
        took: 0.333,
        requestId: 'test-request-id'
      });

    await manager.alert({
      message: 'Test alert',
      alertType: 'test'
    });

    const activeAlerts = manager.getActiveAlerts();
    expect(activeAlerts).toHaveLength(1);
    expect(activeAlerts[0].message).toBe('Test alert');
  });

  it('should use correct priority for convenience methods', async () => {
    let capturedPriority: string | undefined;

    nock('https://api.opsgenie.com')
      .post('/v2/alerts', (body) => {
        capturedPriority = body.priority;
        return true;
      })
      .times(4)
      .reply(200, {
        result: 'Request will be processed',
        took: 0.333,
        requestId: 'test-request-id'
      });

    await manager.criticalAlert('Critical');
    expect(capturedPriority).toBe('P1');

    await manager.highAlert('High');
    expect(capturedPriority).toBe('P2');

    await manager.mediumAlert('Medium');
    expect(capturedPriority).toBe('P3');

    await manager.lowAlert('Low');
    expect(capturedPriority).toBe('P4');
  });
});
```

## CLAUDE.md Integration

```markdown
# OpsGenie Integration

## Quick Reference

### Create Alert
```bash
curl -X POST 'https://api.opsgenie.com/v2/alerts' \
  -H 'Authorization: GenieKey YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Alert message",
    "alias": "unique-alert-alias",
    "priority": "P2",
    "tags": ["api", "production"]
  }'
```

### Close Alert
```bash
curl -X POST 'https://api.opsgenie.com/v2/alerts/ALERT_ALIAS/close?identifierType=alias' \
  -H 'Authorization: GenieKey YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"note": "Issue resolved"}'
```

### Get On-Call
```bash
curl 'https://api.opsgenie.com/v2/schedules/SCHEDULE_NAME/on-calls?flat=true&scheduleIdentifierType=name' \
  -H 'Authorization: GenieKey YOUR_API_KEY'
```

## Configuration
- API Key: Stored in OPSGENIE_API_KEY
- Default Team: DevOps
- EU Instance: false

## Priority Guidelines
- **P1**: Critical - System down, data at risk
- **P2**: High - Major feature broken
- **P3**: Medium - Significant but not urgent
- **P4**: Low - Minor issues
- **P5**: Informational - No immediate action
```

## AI Suggestions

1. **Smart Alert Routing** - Implement ML-based alert routing that learns from past assignments and escalation patterns
2. **Noise Reduction** - Automatically group and deduplicate similar alerts to reduce alert fatigue
3. **Contextual Runbooks** - Auto-attach relevant runbooks and documentation based on alert content and tags
4. **Predictive Escalation** - Analyze alert patterns to predict when incidents need escalation before SLA breach
5. **Impact Assessment** - Automatically calculate and display business impact based on affected services and user segments
6. **Schedule Optimization** - Analyze on-call patterns to suggest schedule improvements and prevent burnout
7. **Cross-Service Correlation** - Correlate alerts across services to identify root causes and reduce mean time to resolution
8. **Automated Diagnostics** - Trigger automated diagnostic scripts when specific alert types fire
9. **Post-Incident Automation** - Auto-generate post-mortem templates with timeline, affected services, and action items
10. **Integration Health Monitoring** - Monitor alert integration health and notify when integrations stop sending alerts
