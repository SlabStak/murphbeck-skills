# Alerting System Template

## Overview
Comprehensive alerting system with multi-channel notifications, alert routing, escalation policies, and incident management integration.

## Installation

```bash
npm install @slack/web-api nodemailer axios
npm install --save-dev @types/nodemailer
```

## Environment Variables

```env
# Alert Channels
SLACK_BOT_TOKEN=xoxb-xxx
SLACK_ALERT_CHANNEL=#alerts
SLACK_ONCALL_CHANNEL=#oncall

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASS=xxx
ALERT_EMAIL_FROM=alerts@example.com
ALERT_EMAIL_TO=oncall@example.com

# PagerDuty
PAGERDUTY_ROUTING_KEY=xxx
PAGERDUTY_API_KEY=xxx

# OpsGenie
OPSGENIE_API_KEY=xxx

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx

# Webhook
ALERT_WEBHOOK_URL=https://api.example.com/alerts

# Configuration
ALERT_DEDUP_WINDOW=300
ALERT_THROTTLE_LIMIT=10
ALERT_THROTTLE_WINDOW=60
```

## Project Structure

```
lib/
├── alerting/
│   ├── index.ts
│   ├── manager.ts
│   ├── types.ts
│   ├── channels/
│   │   ├── slack.ts
│   │   ├── email.ts
│   │   ├── pagerduty.ts
│   │   ├── opsgenie.ts
│   │   ├── discord.ts
│   │   └── webhook.ts
│   ├── rules/
│   │   ├── parser.ts
│   │   ├── evaluator.ts
│   │   └── templates.ts
│   ├── routing/
│   │   ├── router.ts
│   │   ├── escalation.ts
│   │   └── schedule.ts
│   └── storage/
│       ├── dedup.ts
│       ├── history.ts
│       └── silences.ts
```

## Type Definitions

```typescript
// lib/alerting/types.ts

export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info';
export type AlertStatus = 'firing' | 'resolved' | 'acknowledged' | 'silenced';
export type ChannelType = 'slack' | 'email' | 'pagerduty' | 'opsgenie' | 'discord' | 'webhook';

export interface Alert {
  id: string;
  name: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  description?: string;
  labels: Record<string, string>;
  annotations?: Record<string, string>;
  source: string;
  timestamp: Date;
  resolvedAt?: Date;
  fingerprint: string;
  generatorURL?: string;
  runbookURL?: string;
  dashboardURL?: string;
}

export interface AlertRule {
  name: string;
  condition: string | ((metrics: any) => boolean);
  severity: AlertSeverity;
  for?: string; // Duration before firing
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  runbook?: string;
  channels?: ChannelType[];
}

export interface AlertConfig {
  channels: ChannelConfig[];
  routes: AlertRoute[];
  inhibitRules?: InhibitRule[];
  silences?: Silence[];
  defaultReceiver: string;
  groupBy?: string[];
  groupWait?: number;
  groupInterval?: number;
  repeatInterval?: number;
}

export interface ChannelConfig {
  name: string;
  type: ChannelType;
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertRoute {
  match?: Record<string, string>;
  matchRegex?: Record<string, string>;
  receiver: string;
  continue?: boolean;
  groupBy?: string[];
  muteTimeIntervals?: string[];
}

export interface InhibitRule {
  sourceMatch: Record<string, string>;
  targetMatch: Record<string, string>;
  equal?: string[];
}

export interface Silence {
  id: string;
  matchers: AlertMatcher[];
  startsAt: Date;
  endsAt: Date;
  createdBy: string;
  comment: string;
}

export interface AlertMatcher {
  name: string;
  value: string;
  isRegex?: boolean;
  isEqual?: boolean;
}

export interface EscalationPolicy {
  name: string;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  waitMinutes: number;
  receivers: string[];
  repeatMinutes?: number;
}

export interface NotificationResult {
  channel: string;
  success: boolean;
  error?: string;
  messageId?: string;
}
```

## Alert Manager

```typescript
// lib/alerting/manager.ts

import {
  Alert,
  AlertConfig,
  AlertSeverity,
  AlertStatus,
  NotificationResult,
} from './types';
import { AlertRouter } from './routing/router';
import { DeduplicationStore } from './storage/dedup';
import { AlertHistory } from './storage/history';
import { SilenceManager } from './storage/silences';
import { getChannel } from './channels';

export class AlertManager {
  private config: AlertConfig;
  private router: AlertRouter;
  private dedup: DeduplicationStore;
  private history: AlertHistory;
  private silences: SilenceManager;
  private activeAlerts: Map<string, Alert>;
  private throttleCount: Map<string, number>;

  constructor(config: AlertConfig) {
    this.config = config;
    this.router = new AlertRouter(config.routes, config.defaultReceiver);
    this.dedup = new DeduplicationStore();
    this.history = new AlertHistory();
    this.silences = new SilenceManager(config.silences || []);
    this.activeAlerts = new Map();
    this.throttleCount = new Map();
  }

  async fire(alert: Omit<Alert, 'id' | 'fingerprint' | 'status'>): Promise<Alert> {
    const fullAlert: Alert = {
      ...alert,
      id: this.generateId(),
      fingerprint: this.generateFingerprint(alert),
      status: 'firing',
    };

    // Check if silenced
    if (this.silences.isSilenced(fullAlert)) {
      fullAlert.status = 'silenced';
      this.history.add(fullAlert);
      return fullAlert;
    }

    // Check deduplication
    if (this.dedup.isDuplicate(fullAlert.fingerprint)) {
      return this.activeAlerts.get(fullAlert.fingerprint) || fullAlert;
    }

    // Check throttling
    if (this.isThrottled(fullAlert.source)) {
      console.warn(`Alert throttled from source: ${fullAlert.source}`);
      return fullAlert;
    }

    // Store active alert
    this.activeAlerts.set(fullAlert.fingerprint, fullAlert);
    this.dedup.add(fullAlert.fingerprint);
    this.history.add(fullAlert);

    // Route and send
    const receivers = this.router.route(fullAlert);
    await this.sendToReceivers(fullAlert, receivers);

    return fullAlert;
  }

  async resolve(fingerprint: string): Promise<Alert | null> {
    const alert = this.activeAlerts.get(fingerprint);
    if (!alert) return null;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    this.activeAlerts.delete(fingerprint);
    this.dedup.remove(fingerprint);
    this.history.update(alert);

    // Send resolution notification
    const receivers = this.router.route(alert);
    await this.sendToReceivers(alert, receivers);

    return alert;
  }

  async acknowledge(fingerprint: string, by: string): Promise<Alert | null> {
    const alert = this.activeAlerts.get(fingerprint);
    if (!alert) return null;

    alert.status = 'acknowledged';
    alert.annotations = {
      ...alert.annotations,
      acknowledgedBy: by,
      acknowledgedAt: new Date().toISOString(),
    };

    this.history.update(alert);
    return alert;
  }

  private async sendToReceivers(
    alert: Alert,
    receivers: string[]
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const receiverName of receivers) {
      const channelConfig = this.config.channels.find(
        (c) => c.name === receiverName
      );

      if (!channelConfig || !channelConfig.enabled) continue;

      try {
        const channel = getChannel(channelConfig.type);
        const result = await channel.send(alert, channelConfig.config);
        results.push({
          channel: receiverName,
          success: true,
          messageId: result.messageId,
        });
      } catch (error) {
        results.push({
          channel: receiverName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private generateId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateFingerprint(alert: Omit<Alert, 'id' | 'fingerprint' | 'status'>): string {
    const parts = [alert.name, alert.source, ...Object.entries(alert.labels).sort()];
    return Buffer.from(parts.join('|')).toString('base64').substring(0, 32);
  }

  private isThrottled(source: string): boolean {
    const limit = parseInt(process.env.ALERT_THROTTLE_LIMIT || '10', 10);
    const window = parseInt(process.env.ALERT_THROTTLE_WINDOW || '60', 10) * 1000;

    const count = this.throttleCount.get(source) || 0;
    if (count >= limit) return true;

    this.throttleCount.set(source, count + 1);
    setTimeout(() => {
      this.throttleCount.set(source, (this.throttleCount.get(source) || 1) - 1);
    }, window);

    return false;
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit: number = 100): Alert[] {
    return this.history.getRecent(limit);
  }
}

// Singleton instance
let alertManager: AlertManager | null = null;

export function getAlertManager(config?: AlertConfig): AlertManager {
  if (!alertManager && config) {
    alertManager = new AlertManager(config);
  }
  if (!alertManager) {
    throw new Error('AlertManager not initialized');
  }
  return alertManager;
}
```

## Slack Channel

```typescript
// lib/alerting/channels/slack.ts

import { WebClient } from '@slack/web-api';
import { Alert } from '../types';

interface SlackConfig {
  channel: string;
  botToken?: string;
  webhookUrl?: string;
  mentionUsers?: string[];
  mentionGroups?: string[];
}

export async function sendSlackAlert(
  alert: Alert,
  config: SlackConfig
): Promise<{ messageId?: string }> {
  const botToken = config.botToken || process.env.SLACK_BOT_TOKEN;

  if (botToken) {
    return sendWithWebAPI(alert, config, botToken);
  }

  if (config.webhookUrl) {
    return sendWithWebhook(alert, config.webhookUrl);
  }

  throw new Error('No Slack credentials configured');
}

async function sendWithWebAPI(
  alert: Alert,
  config: SlackConfig,
  token: string
): Promise<{ messageId?: string }> {
  const client = new WebClient(token);

  const message = formatSlackMessage(alert, config);

  const result = await client.chat.postMessage({
    channel: config.channel,
    ...message,
  });

  return { messageId: result.ts };
}

async function sendWithWebhook(
  alert: Alert,
  webhookUrl: string
): Promise<{ messageId?: string }> {
  const message = formatSlackMessage(alert, {});

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  return {};
}

function formatSlackMessage(alert: Alert, config: SlackConfig) {
  const severityEmoji: Record<string, string> = {
    critical: '🔴',
    error: '🟠',
    warning: '🟡',
    info: '🔵',
  };

  const statusEmoji: Record<string, string> = {
    firing: '🚨',
    resolved: '✅',
    acknowledged: '👀',
    silenced: '🔇',
  };

  const mentions: string[] = [];
  if (alert.severity === 'critical' || alert.severity === 'error') {
    if (config.mentionGroups) {
      mentions.push(...config.mentionGroups.map((g) => `<!subteam^${g}>`));
    }
    if (config.mentionUsers) {
      mentions.push(...config.mentionUsers.map((u) => `<@${u}>`));
    }
  }

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${statusEmoji[alert.status]} ${alert.status === 'resolved' ? 'RESOLVED' : 'ALERT'}: ${alert.name}`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Severity:* ${severityEmoji[alert.severity]} ${alert.severity.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Source:* ${alert.source}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Message:*\n${alert.message}`,
      },
    },
  ];

  // Add labels
  if (Object.keys(alert.labels).length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Labels:*\n${Object.entries(alert.labels)
          .map(([k, v]) => `• ${k}: \`${v}\``)
          .join('\n')}`,
      },
    });
  }

  // Add links
  const links: string[] = [];
  if (alert.runbookURL) links.push(`<${alert.runbookURL}|📖 Runbook>`);
  if (alert.dashboardURL) links.push(`<${alert.dashboardURL}|📊 Dashboard>`);
  if (alert.generatorURL) links.push(`<${alert.generatorURL}|🔍 Source>`);

  if (links.length > 0) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: links.join(' | '),
        },
      ],
    });
  }

  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Alert ID: \`${alert.id}\` | Fired: <!date^${Math.floor(alert.timestamp.getTime() / 1000)}^{date_short_pretty} at {time}|${alert.timestamp.toISOString()}>`,
      },
    ],
  });

  return {
    text: `${alert.status === 'resolved' ? 'RESOLVED' : 'ALERT'}: ${alert.name}`,
    blocks,
    ...(mentions.length > 0 && { text: mentions.join(' ') }),
  };
}
```

## PagerDuty Channel

```typescript
// lib/alerting/channels/pagerduty.ts

import { Alert } from '../types';

interface PagerDutyConfig {
  routingKey: string;
  dedupKey?: string;
}

interface PagerDutyEvent {
  routing_key: string;
  event_action: 'trigger' | 'acknowledge' | 'resolve';
  dedup_key?: string;
  payload: {
    summary: string;
    source: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    timestamp?: string;
    component?: string;
    group?: string;
    class?: string;
    custom_details?: Record<string, unknown>;
  };
  links?: Array<{ href: string; text: string }>;
  images?: Array<{ src: string; href?: string; alt?: string }>;
}

export async function sendPagerDutyAlert(
  alert: Alert,
  config: PagerDutyConfig
): Promise<{ messageId?: string }> {
  const routingKey = config.routingKey || process.env.PAGERDUTY_ROUTING_KEY;
  if (!routingKey) {
    throw new Error('PagerDuty routing key not configured');
  }

  const eventAction: 'trigger' | 'acknowledge' | 'resolve' =
    alert.status === 'resolved'
      ? 'resolve'
      : alert.status === 'acknowledged'
      ? 'acknowledge'
      : 'trigger';

  const event: PagerDutyEvent = {
    routing_key: routingKey,
    event_action: eventAction,
    dedup_key: config.dedupKey || alert.fingerprint,
    payload: {
      summary: `[${alert.severity.toUpperCase()}] ${alert.name}: ${alert.message}`,
      source: alert.source,
      severity: alert.severity,
      timestamp: alert.timestamp.toISOString(),
      component: alert.labels.component,
      group: alert.labels.group,
      class: alert.labels.class,
      custom_details: {
        ...alert.labels,
        description: alert.description,
        alert_id: alert.id,
      },
    },
    links: [],
  };

  // Add links
  if (alert.runbookURL) {
    event.links!.push({ href: alert.runbookURL, text: 'Runbook' });
  }
  if (alert.dashboardURL) {
    event.links!.push({ href: alert.dashboardURL, text: 'Dashboard' });
  }

  const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PagerDuty API error: ${error}`);
  }

  const result = await response.json();
  return { messageId: result.dedup_key };
}
```

## Email Channel

```typescript
// lib/alerting/channels/email.ts

import nodemailer from 'nodemailer';
import { Alert } from '../types';

interface EmailConfig {
  to: string | string[];
  from?: string;
  subject?: string;
  smtp?: {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
}

export async function sendEmailAlert(
  alert: Alert,
  config: EmailConfig
): Promise<{ messageId?: string }> {
  const smtpConfig = config.smtp || {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  };

  const transporter = nodemailer.createTransport(smtpConfig);

  const severityColors: Record<string, string> = {
    critical: '#dc2626',
    error: '#ea580c',
    warning: '#ca8a04',
    info: '#2563eb',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${severityColors[alert.severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .label { display: inline-block; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; margin: 2px; }
        .meta { color: #64748b; font-size: 12px; margin-top: 20px; }
        a { color: ${severityColors[alert.severity]}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${alert.status === 'resolved' ? '✅ RESOLVED' : '🚨 ALERT'}: ${alert.name}</h1>
          <p style="margin: 10px 0 0;">Severity: ${alert.severity.toUpperCase()}</p>
        </div>
        <div class="content">
          <p><strong>Message:</strong></p>
          <p>${alert.message}</p>

          ${alert.description ? `<p><strong>Description:</strong></p><p>${alert.description}</p>` : ''}

          <p><strong>Labels:</strong></p>
          <p>
            ${Object.entries(alert.labels)
              .map(([k, v]) => `<span class="label">${k}: ${v}</span>`)
              .join(' ')}
          </p>

          <p><strong>Links:</strong></p>
          <p>
            ${alert.runbookURL ? `<a href="${alert.runbookURL}">📖 Runbook</a> | ` : ''}
            ${alert.dashboardURL ? `<a href="${alert.dashboardURL}">📊 Dashboard</a>` : ''}
          </p>

          <div class="meta">
            <p>Alert ID: ${alert.id}</p>
            <p>Source: ${alert.source}</p>
            <p>Time: ${alert.timestamp.toISOString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject =
    config.subject ||
    `[${alert.severity.toUpperCase()}] ${alert.status === 'resolved' ? 'RESOLVED: ' : ''}${alert.name}`;

  const result = await transporter.sendMail({
    from: config.from || process.env.ALERT_EMAIL_FROM,
    to: Array.isArray(config.to) ? config.to.join(', ') : config.to,
    subject,
    html,
    text: `${alert.status === 'resolved' ? 'RESOLVED: ' : 'ALERT: '}${alert.name}\n\n${alert.message}\n\nSeverity: ${alert.severity}\nSource: ${alert.source}\nTime: ${alert.timestamp.toISOString()}`,
  });

  return { messageId: result.messageId };
}
```

## Alert Router

```typescript
// lib/alerting/routing/router.ts

import { Alert, AlertRoute } from '../types';

export class AlertRouter {
  private routes: AlertRoute[];
  private defaultReceiver: string;

  constructor(routes: AlertRoute[], defaultReceiver: string) {
    this.routes = routes;
    this.defaultReceiver = defaultReceiver;
  }

  route(alert: Alert): string[] {
    const receivers: string[] = [];

    for (const route of this.routes) {
      if (this.matchesRoute(alert, route)) {
        receivers.push(route.receiver);

        if (!route.continue) {
          return receivers;
        }
      }
    }

    if (receivers.length === 0) {
      receivers.push(this.defaultReceiver);
    }

    return [...new Set(receivers)];
  }

  private matchesRoute(alert: Alert, route: AlertRoute): boolean {
    // Check exact matches
    if (route.match) {
      for (const [key, value] of Object.entries(route.match)) {
        const alertValue = this.getLabelValue(alert, key);
        if (alertValue !== value) return false;
      }
    }

    // Check regex matches
    if (route.matchRegex) {
      for (const [key, pattern] of Object.entries(route.matchRegex)) {
        const alertValue = this.getLabelValue(alert, key);
        if (!alertValue || !new RegExp(pattern).test(alertValue)) return false;
      }
    }

    return true;
  }

  private getLabelValue(alert: Alert, key: string): string | undefined {
    // Check special fields first
    if (key === 'severity') return alert.severity;
    if (key === 'source') return alert.source;
    if (key === 'name') return alert.name;

    // Check labels
    return alert.labels[key];
  }
}
```

## Alert API Endpoints

```typescript
// app/api/alerts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAlertManager } from '@/lib/alerting/manager';

export async function POST(req: NextRequest) {
  const alertManager = getAlertManager();
  const body = await req.json();

  const alert = await alertManager.fire({
    name: body.name,
    severity: body.severity || 'warning',
    message: body.message,
    description: body.description,
    labels: body.labels || {},
    annotations: body.annotations,
    source: body.source || 'api',
    timestamp: new Date(),
    runbookURL: body.runbook_url,
    dashboardURL: body.dashboard_url,
  });

  return NextResponse.json(alert, { status: 201 });
}

export async function GET(req: NextRequest) {
  const alertManager = getAlertManager();
  const alerts = alertManager.getActiveAlerts();

  return NextResponse.json({ alerts, count: alerts.length });
}

// app/api/alerts/[fingerprint]/resolve/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { fingerprint: string } }
) {
  const alertManager = getAlertManager();
  const alert = await alertManager.resolve(params.fingerprint);

  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  return NextResponse.json(alert);
}
```

## Usage Examples

```typescript
// Initialize alert manager

import { AlertManager } from '@/lib/alerting/manager';

const alertManager = new AlertManager({
  channels: [
    {
      name: 'slack-critical',
      type: 'slack',
      config: { channel: '#critical-alerts', mentionGroups: ['oncall'] },
      enabled: true,
    },
    {
      name: 'slack-warnings',
      type: 'slack',
      config: { channel: '#alerts' },
      enabled: true,
    },
    {
      name: 'pagerduty',
      type: 'pagerduty',
      config: { routingKey: process.env.PAGERDUTY_ROUTING_KEY },
      enabled: true,
    },
    {
      name: 'email-oncall',
      type: 'email',
      config: { to: 'oncall@example.com' },
      enabled: true,
    },
  ],
  routes: [
    {
      match: { severity: 'critical' },
      receiver: 'slack-critical',
      continue: true,
    },
    {
      match: { severity: 'critical' },
      receiver: 'pagerduty',
    },
    {
      matchRegex: { source: 'payment.*' },
      receiver: 'slack-critical',
    },
  ],
  defaultReceiver: 'slack-warnings',
  groupBy: ['alertname', 'severity'],
  groupWait: 30,
  groupInterval: 300,
  repeatInterval: 3600,
});

// Fire an alert
await alertManager.fire({
  name: 'High Error Rate',
  severity: 'critical',
  message: 'Error rate exceeded 5% for the past 5 minutes',
  labels: {
    service: 'api',
    environment: 'production',
  },
  source: 'prometheus',
  timestamp: new Date(),
  runbookURL: 'https://wiki.example.com/runbooks/high-error-rate',
  dashboardURL: 'https://grafana.example.com/d/errors',
});
```

## CLAUDE.md Integration

```markdown
## Alerting Guidelines

### Firing Alerts
- Use `alertManager.fire()` for new alerts
- Include descriptive names and messages
- Add relevant labels for routing
- Include runbook and dashboard URLs

### Severity Levels
- **critical**: Immediate action required, pages on-call
- **error**: Requires attention soon
- **warning**: Something to watch
- **info**: Informational only

### Best Practices
- Use consistent label names
- Always include source
- Provide actionable messages
- Link to runbooks and dashboards
```

## AI Suggestions

1. **Implement alert correlation** - Group related alerts into incidents
2. **Add on-call scheduling** - Integrate with schedule for proper routing
3. **Implement alert aggregation** - Reduce noise by aggregating similar alerts
4. **Add maintenance windows** - Suppress alerts during planned maintenance
5. **Implement smart escalation** - Escalate based on acknowledgment status
6. **Add alert analytics** - Track MTTA, MTTR, and alert frequency
7. **Implement runbook automation** - Auto-execute runbook steps
8. **Add feedback loops** - Learn from false positives
9. **Implement alert dependencies** - Suppress downstream alerts
10. **Add multi-tenant support** - Route alerts by tenant/team
