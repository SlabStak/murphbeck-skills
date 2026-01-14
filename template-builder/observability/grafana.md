# Grafana Dashboard Template

## Overview
Complete Grafana integration with programmatic dashboard creation, provisioning, alerting, and annotation support for comprehensive visualization.

## Installation

```bash
npm install axios
npm install --save-dev @types/node
```

## Environment Variables

```env
# Grafana Configuration
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=your_api_key
GRAFANA_SERVICE_ACCOUNT_TOKEN=your_token
GRAFANA_ORG_ID=1

# Data Sources
PROMETHEUS_URL=http://prometheus:9090
LOKI_URL=http://loki:3100

# Dashboard Settings
GRAFANA_FOLDER_UID=app-dashboards
GRAFANA_DEFAULT_DATASOURCE=prometheus
```

## Project Structure

```
lib/
├── grafana/
│   ├── index.ts
│   ├── client.ts
│   ├── types.ts
│   ├── dashboards/
│   │   ├── builder.ts
│   │   ├── panels/
│   │   │   ├── timeseries.ts
│   │   │   ├── stat.ts
│   │   │   ├── gauge.ts
│   │   │   ├── table.ts
│   │   │   ├── logs.ts
│   │   │   └── alert-list.ts
│   │   └── templates/
│   │       ├── http.ts
│   │       ├── database.ts
│   │       └── business.ts
│   ├── provisioning/
│   │   ├── datasources.ts
│   │   ├── dashboards.ts
│   │   └── alerting.ts
│   └── annotations/
│       └── client.ts
grafana/
├── provisioning/
│   ├── datasources/
│   │   └── datasources.yaml
│   ├── dashboards/
│   │   └── dashboards.yaml
│   └── alerting/
│       └── alerts.yaml
└── dashboards/
    ├── application.json
    ├── infrastructure.json
    └── business.json
```

## Type Definitions

```typescript
// lib/grafana/types.ts

export interface Dashboard {
  id?: number;
  uid?: string;
  title: string;
  description?: string;
  tags?: string[];
  timezone?: string;
  editable?: boolean;
  refresh?: string;
  time?: TimeRange;
  templating?: Templating;
  panels: Panel[];
  annotations?: Annotations;
  links?: DashboardLink[];
  version?: number;
}

export interface TimeRange {
  from: string;
  to: string;
}

export interface Templating {
  list: Variable[];
}

export interface Variable {
  name: string;
  label?: string;
  type: 'query' | 'custom' | 'constant' | 'datasource' | 'interval';
  query?: string;
  datasource?: DataSourceRef;
  refresh?: number;
  options?: VariableOption[];
  current?: VariableOption;
  multi?: boolean;
  includeAll?: boolean;
  allValue?: string;
  hide?: number;
}

export interface VariableOption {
  text: string;
  value: string;
  selected?: boolean;
}

export interface DataSourceRef {
  type?: string;
  uid?: string;
}

export interface Panel {
  id: number;
  title: string;
  type: PanelType;
  gridPos: GridPosition;
  datasource?: DataSourceRef;
  targets?: Target[];
  options?: Record<string, unknown>;
  fieldConfig?: FieldConfig;
  transparent?: boolean;
  description?: string;
  links?: PanelLink[];
  alert?: PanelAlert;
}

export type PanelType =
  | 'timeseries'
  | 'stat'
  | 'gauge'
  | 'bargauge'
  | 'table'
  | 'logs'
  | 'alertlist'
  | 'text'
  | 'row'
  | 'heatmap'
  | 'piechart';

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Target {
  refId: string;
  expr?: string;
  legendFormat?: string;
  datasource?: DataSourceRef;
  format?: string;
  instant?: boolean;
  range?: boolean;
  interval?: string;
}

export interface FieldConfig {
  defaults: FieldConfigDefaults;
  overrides?: FieldConfigOverride[];
}

export interface FieldConfigDefaults {
  unit?: string;
  min?: number;
  max?: number;
  decimals?: number;
  color?: ColorConfig;
  thresholds?: ThresholdConfig;
  mappings?: ValueMapping[];
  custom?: Record<string, unknown>;
}

export interface ColorConfig {
  mode: 'palette-classic' | 'fixed' | 'thresholds' | 'continuous-GrYlRd';
  fixedColor?: string;
}

export interface ThresholdConfig {
  mode: 'absolute' | 'percentage';
  steps: ThresholdStep[];
}

export interface ThresholdStep {
  value: number | null;
  color: string;
}

export interface ValueMapping {
  type: 'value' | 'range' | 'special';
  options: Record<string, unknown>;
}

export interface FieldConfigOverride {
  matcher: { id: string; options: unknown };
  properties: Array<{ id: string; value: unknown }>;
}

export interface PanelLink {
  title: string;
  url: string;
  targetBlank?: boolean;
}

export interface PanelAlert {
  name: string;
  conditions: AlertCondition[];
  executionErrorState: 'alerting' | 'keep_state';
  for: string;
  frequency: string;
  handler: number;
  message: string;
  noDataState: 'alerting' | 'no_data' | 'keep_state' | 'ok';
  notifications: AlertNotification[];
}

export interface AlertCondition {
  evaluator: { params: number[]; type: string };
  operator: { type: string };
  query: { params: string[] };
  reducer: { params: unknown[]; type: string };
  type: string;
}

export interface AlertNotification {
  uid: string;
}

export interface Annotations {
  list: AnnotationQuery[];
}

export interface AnnotationQuery {
  name: string;
  datasource: DataSourceRef;
  enable: boolean;
  expr?: string;
  iconColor?: string;
  tagKeys?: string;
  titleFormat?: string;
  textFormat?: string;
}

export interface DashboardLink {
  title: string;
  type: 'link' | 'dashboards';
  url?: string;
  tags?: string[];
  targetBlank?: boolean;
  icon?: string;
}

export interface Annotation {
  dashboardUID: string;
  panelId?: number;
  time: number;
  timeEnd?: number;
  tags: string[];
  text: string;
}
```

## Grafana API Client

```typescript
// lib/grafana/client.ts

import { Dashboard, Annotation } from './types';

interface GrafanaConfig {
  url: string;
  apiKey?: string;
  serviceAccountToken?: string;
  orgId?: number;
}

export class GrafanaClient {
  private config: GrafanaConfig;
  private headers: Record<string, string>;

  constructor(config?: Partial<GrafanaConfig>) {
    this.config = {
      url: config?.url || process.env.GRAFANA_URL || 'http://localhost:3000',
      apiKey: config?.apiKey || process.env.GRAFANA_API_KEY,
      serviceAccountToken: config?.serviceAccountToken || process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN,
      orgId: config?.orgId || parseInt(process.env.GRAFANA_ORG_ID || '1', 10),
    };

    const authToken = this.config.serviceAccountToken || this.config.apiKey;
    this.headers = {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    };
  }

  // Dashboard operations
  async createDashboard(
    dashboard: Dashboard,
    folderUid?: string,
    overwrite: boolean = false
  ): Promise<{ uid: string; url: string }> {
    const response = await this.request('/api/dashboards/db', {
      method: 'POST',
      body: JSON.stringify({
        dashboard: {
          ...dashboard,
          id: null, // New dashboard
        },
        folderUid: folderUid || process.env.GRAFANA_FOLDER_UID,
        overwrite,
        message: 'Dashboard created via API',
      }),
    });

    return {
      uid: response.uid,
      url: `${this.config.url}${response.url}`,
    };
  }

  async updateDashboard(
    uid: string,
    dashboard: Dashboard,
    message?: string
  ): Promise<void> {
    await this.request('/api/dashboards/db', {
      method: 'POST',
      body: JSON.stringify({
        dashboard: {
          ...dashboard,
          uid,
        },
        overwrite: true,
        message: message || 'Dashboard updated via API',
      }),
    });
  }

  async getDashboard(uid: string): Promise<Dashboard> {
    const response = await this.request(`/api/dashboards/uid/${uid}`);
    return response.dashboard;
  }

  async deleteDashboard(uid: string): Promise<void> {
    await this.request(`/api/dashboards/uid/${uid}`, {
      method: 'DELETE',
    });
  }

  async searchDashboards(query?: string, tags?: string[]): Promise<any[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (tags) tags.forEach((tag) => params.append('tag', tag));

    return this.request(`/api/search?${params}`);
  }

  // Folder operations
  async createFolder(
    title: string,
    uid?: string
  ): Promise<{ uid: string; id: number }> {
    return this.request('/api/folders', {
      method: 'POST',
      body: JSON.stringify({ title, uid }),
    });
  }

  async getFolders(): Promise<any[]> {
    return this.request('/api/folders');
  }

  // Annotation operations
  async createAnnotation(annotation: Annotation): Promise<{ id: number }> {
    return this.request('/api/annotations', {
      method: 'POST',
      body: JSON.stringify(annotation),
    });
  }

  async getAnnotations(
    dashboardUID?: string,
    from?: number,
    to?: number,
    tags?: string[]
  ): Promise<Annotation[]> {
    const params = new URLSearchParams();
    if (dashboardUID) params.append('dashboardUID', dashboardUID);
    if (from) params.append('from', from.toString());
    if (to) params.append('to', to.toString());
    if (tags) tags.forEach((tag) => params.append('tags', tag));

    return this.request(`/api/annotations?${params}`);
  }

  async deleteAnnotation(id: number): Promise<void> {
    await this.request(`/api/annotations/${id}`, {
      method: 'DELETE',
    });
  }

  // Alert operations
  async getAlertRules(): Promise<any[]> {
    return this.request('/api/v1/provisioning/alert-rules');
  }

  async createAlertRule(rule: any): Promise<any> {
    return this.request('/api/v1/provisioning/alert-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  // Data source operations
  async getDataSources(): Promise<any[]> {
    return this.request('/api/datasources');
  }

  async getDataSourceByName(name: string): Promise<any> {
    return this.request(`/api/datasources/name/${name}`);
  }

  // Health check
  async health(): Promise<{ database: string; version: string }> {
    return this.request('/api/health');
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.url}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grafana API error: ${response.status} - ${error}`);
    }

    return response.json();
  }
}

// Singleton instance
let grafanaClient: GrafanaClient | null = null;

export function getGrafanaClient(): GrafanaClient {
  if (!grafanaClient) {
    grafanaClient = new GrafanaClient();
  }
  return grafanaClient;
}
```

## Dashboard Builder

```typescript
// lib/grafana/dashboards/builder.ts

import {
  Dashboard,
  Panel,
  Variable,
  GridPosition,
  Target,
  ThresholdConfig,
  FieldConfig,
} from '../types';

export class DashboardBuilder {
  private dashboard: Dashboard;
  private currentPanelId: number = 1;
  private currentY: number = 0;

  constructor(title: string) {
    this.dashboard = {
      title,
      tags: [],
      timezone: 'browser',
      editable: true,
      refresh: '30s',
      time: { from: 'now-1h', to: 'now' },
      templating: { list: [] },
      panels: [],
      annotations: { list: [] },
    };
  }

  description(description: string): this {
    this.dashboard.description = description;
    return this;
  }

  tags(...tags: string[]): this {
    this.dashboard.tags = tags;
    return this;
  }

  refresh(interval: string): this {
    this.dashboard.refresh = interval;
    return this;
  }

  timeRange(from: string, to: string): this {
    this.dashboard.time = { from, to };
    return this;
  }

  variable(variable: Variable): this {
    this.dashboard.templating!.list.push(variable);
    return this;
  }

  // Common variable presets
  envVariable(): this {
    return this.variable({
      name: 'environment',
      label: 'Environment',
      type: 'custom',
      options: [
        { text: 'Production', value: 'production', selected: true },
        { text: 'Staging', value: 'staging' },
        { text: 'Development', value: 'development' },
      ],
      current: { text: 'Production', value: 'production' },
    });
  }

  serviceVariable(labelQuery: string = 'label_values(up, service)'): this {
    return this.variable({
      name: 'service',
      label: 'Service',
      type: 'query',
      query: labelQuery,
      datasource: { type: 'prometheus' },
      refresh: 1,
      multi: true,
      includeAll: true,
      allValue: '.*',
    });
  }

  intervalVariable(): this {
    return this.variable({
      name: 'interval',
      label: 'Interval',
      type: 'interval',
      query: '1m,5m,10m,30m,1h,6h,12h,1d',
      current: { text: '5m', value: '5m' },
    });
  }

  row(title: string, collapsed: boolean = false): this {
    this.dashboard.panels.push({
      id: this.currentPanelId++,
      title,
      type: 'row',
      gridPos: { x: 0, y: this.currentY, w: 24, h: 1 },
      options: { collapsed },
    } as Panel);
    this.currentY += 1;
    return this;
  }

  panel(panel: Omit<Panel, 'id' | 'gridPos'>, gridPos?: Partial<GridPosition>): this {
    const defaultGridPos: GridPosition = {
      x: 0,
      y: this.currentY,
      w: 12,
      h: 8,
    };

    const finalGridPos = { ...defaultGridPos, ...gridPos };

    this.dashboard.panels.push({
      ...panel,
      id: this.currentPanelId++,
      gridPos: finalGridPos,
    } as Panel);

    // Update currentY if this panel extends beyond
    const panelBottom = finalGridPos.y + finalGridPos.h;
    if (panelBottom > this.currentY) {
      this.currentY = panelBottom;
    }

    return this;
  }

  // Panel presets
  statPanel(
    title: string,
    expr: string,
    options?: {
      unit?: string;
      thresholds?: ThresholdConfig;
      gridPos?: Partial<GridPosition>;
    }
  ): this {
    return this.panel(
      {
        title,
        type: 'stat',
        targets: [{ refId: 'A', expr, instant: true }],
        options: {
          reduceOptions: {
            values: false,
            calcs: ['lastNotNull'],
            fields: '',
          },
          orientation: 'auto',
          textMode: 'auto',
          colorMode: 'value',
          graphMode: 'none',
        },
        fieldConfig: {
          defaults: {
            unit: options?.unit,
            thresholds: options?.thresholds || {
              mode: 'absolute',
              steps: [
                { value: null, color: 'green' },
                { value: 80, color: 'yellow' },
                { value: 90, color: 'red' },
              ],
            },
          },
        },
      },
      options?.gridPos || { w: 6, h: 4 }
    );
  }

  timeseriesPanel(
    title: string,
    targets: Array<{ expr: string; legend?: string }>,
    options?: {
      unit?: string;
      gridPos?: Partial<GridPosition>;
    }
  ): this {
    return this.panel(
      {
        title,
        type: 'timeseries',
        targets: targets.map((t, i) => ({
          refId: String.fromCharCode(65 + i),
          expr: t.expr,
          legendFormat: t.legend || '',
        })),
        options: {
          legend: { displayMode: 'list', placement: 'bottom' },
          tooltip: { mode: 'multi', sort: 'none' },
        },
        fieldConfig: {
          defaults: {
            unit: options?.unit,
            custom: {
              lineWidth: 1,
              fillOpacity: 10,
              spanNulls: false,
              showPoints: 'never',
            },
          },
        },
      },
      options?.gridPos
    );
  }

  gaugePanel(
    title: string,
    expr: string,
    options?: {
      unit?: string;
      min?: number;
      max?: number;
      thresholds?: ThresholdConfig;
      gridPos?: Partial<GridPosition>;
    }
  ): this {
    return this.panel(
      {
        title,
        type: 'gauge',
        targets: [{ refId: 'A', expr, instant: true }],
        options: {
          reduceOptions: { calcs: ['lastNotNull'] },
          showThresholdLabels: false,
          showThresholdMarkers: true,
        },
        fieldConfig: {
          defaults: {
            unit: options?.unit,
            min: options?.min || 0,
            max: options?.max || 100,
            thresholds: options?.thresholds || {
              mode: 'absolute',
              steps: [
                { value: null, color: 'green' },
                { value: 70, color: 'yellow' },
                { value: 90, color: 'red' },
              ],
            },
          },
        },
      },
      options?.gridPos || { w: 6, h: 6 }
    );
  }

  tablePanel(
    title: string,
    targets: Target[],
    options?: {
      gridPos?: Partial<GridPosition>;
    }
  ): this {
    return this.panel(
      {
        title,
        type: 'table',
        targets,
        options: {
          showHeader: true,
          sortBy: [],
        },
        fieldConfig: {
          defaults: {},
          overrides: [],
        },
      },
      options?.gridPos
    );
  }

  logsPanel(
    title: string,
    expr: string,
    options?: {
      datasource?: string;
      gridPos?: Partial<GridPosition>;
    }
  ): this {
    return this.panel(
      {
        title,
        type: 'logs',
        datasource: { type: 'loki', uid: options?.datasource },
        targets: [{ refId: 'A', expr }],
        options: {
          showTime: true,
          showLabels: true,
          wrapLogMessage: true,
          sortOrder: 'Descending',
          dedupStrategy: 'none',
          enableLogDetails: true,
        },
      },
      options?.gridPos || { w: 24, h: 10 }
    );
  }

  build(): Dashboard {
    return this.dashboard;
  }
}
```

## Dashboard Templates

```typescript
// lib/grafana/dashboards/templates/http.ts

import { DashboardBuilder } from '../builder';
import { Dashboard } from '../../types';

export function createHTTPDashboard(serviceName: string): Dashboard {
  return new DashboardBuilder(`${serviceName} - HTTP Metrics`)
    .description('HTTP request metrics and performance')
    .tags('http', 'api', serviceName)
    .envVariable()
    .serviceVariable()
    .intervalVariable()

    // Summary Row
    .row('Summary')
    .statPanel('Request Rate', 'sum(rate(http_requests_total{service=~"$service"}[$interval]))', {
      unit: 'reqps',
      gridPos: { x: 0, y: 1, w: 6, h: 4 },
    })
    .statPanel('Error Rate', '100 * sum(rate(http_requests_total{service=~"$service",status_code=~"5.."}[$interval])) / sum(rate(http_requests_total{service=~"$service"}[$interval]))', {
      unit: 'percent',
      thresholds: {
        mode: 'absolute',
        steps: [
          { value: null, color: 'green' },
          { value: 1, color: 'yellow' },
          { value: 5, color: 'red' },
        ],
      },
      gridPos: { x: 6, y: 1, w: 6, h: 4 },
    })
    .statPanel('P95 Latency', 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=~"$service"}[$interval])) by (le))', {
      unit: 's',
      thresholds: {
        mode: 'absolute',
        steps: [
          { value: null, color: 'green' },
          { value: 0.5, color: 'yellow' },
          { value: 1, color: 'red' },
        ],
      },
      gridPos: { x: 12, y: 1, w: 6, h: 4 },
    })
    .statPanel('Active Requests', 'sum(http_requests_in_flight{service=~"$service"})', {
      unit: 'none',
      gridPos: { x: 18, y: 1, w: 6, h: 4 },
    })

    // Request Rate Row
    .row('Request Rate')
    .timeseriesPanel('Requests per Second', [
      { expr: 'sum(rate(http_requests_total{service=~"$service"}[$interval])) by (route)', legend: '{{route}}' },
    ], {
      unit: 'reqps',
      gridPos: { x: 0, y: 6, w: 12, h: 8 },
    })
    .timeseriesPanel('Requests by Status Code', [
      { expr: 'sum(rate(http_requests_total{service=~"$service"}[$interval])) by (status_code)', legend: '{{status_code}}' },
    ], {
      unit: 'reqps',
      gridPos: { x: 12, y: 6, w: 12, h: 8 },
    })

    // Latency Row
    .row('Latency')
    .timeseriesPanel('Response Time Percentiles', [
      { expr: 'histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket{service=~"$service"}[$interval])) by (le))', legend: 'p50' },
      { expr: 'histogram_quantile(0.90, sum(rate(http_request_duration_seconds_bucket{service=~"$service"}[$interval])) by (le))', legend: 'p90' },
      { expr: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=~"$service"}[$interval])) by (le))', legend: 'p95' },
      { expr: 'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service=~"$service"}[$interval])) by (le))', legend: 'p99' },
    ], {
      unit: 's',
      gridPos: { x: 0, y: 15, w: 12, h: 8 },
    })
    .timeseriesPanel('Latency by Route', [
      { expr: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=~"$service"}[$interval])) by (route, le))', legend: '{{route}}' },
    ], {
      unit: 's',
      gridPos: { x: 12, y: 15, w: 12, h: 8 },
    })

    // Errors Row
    .row('Errors')
    .timeseriesPanel('Error Rate', [
      { expr: 'sum(rate(http_requests_total{service=~"$service",status_code=~"5.."}[$interval])) by (route)', legend: '{{route}}' },
    ], {
      unit: 'reqps',
      gridPos: { x: 0, y: 24, w: 12, h: 8 },
    })
    .timeseriesPanel('Error Types', [
      { expr: 'sum(rate(http_requests_total{service=~"$service",status_code=~"5.."}[$interval])) by (status_code)', legend: '{{status_code}}' },
    ], {
      unit: 'reqps',
      gridPos: { x: 12, y: 24, w: 12, h: 8 },
    })

    .build();
}

// lib/grafana/dashboards/templates/business.ts

export function createBusinessDashboard(serviceName: string): Dashboard {
  return new DashboardBuilder(`${serviceName} - Business Metrics`)
    .description('Business KPIs and metrics')
    .tags('business', 'kpi', serviceName)
    .envVariable()
    .intervalVariable()

    .row('Key Metrics')
    .statPanel('Active Users', 'sum(users_active_total)', {
      unit: 'none',
      gridPos: { x: 0, y: 1, w: 6, h: 4 },
    })
    .statPanel('Orders Today', 'increase(orders_created_total[24h])', {
      unit: 'none',
      gridPos: { x: 6, y: 1, w: 6, h: 4 },
    })
    .statPanel('Revenue Today', 'increase(revenue_total_dollars[24h])', {
      unit: 'currencyUSD',
      gridPos: { x: 12, y: 1, w: 6, h: 4 },
    })
    .statPanel('Conversion Rate', '100 * sum(rate(orders_completed_total[$interval])) / sum(rate(orders_created_total[$interval]))', {
      unit: 'percent',
      gridPos: { x: 18, y: 1, w: 6, h: 4 },
    })

    .row('Trends')
    .timeseriesPanel('Orders Over Time', [
      { expr: 'sum(rate(orders_created_total[$interval]))', legend: 'Created' },
      { expr: 'sum(rate(orders_completed_total[$interval]))', legend: 'Completed' },
    ], {
      unit: 'ops',
      gridPos: { x: 0, y: 6, w: 12, h: 8 },
    })
    .timeseriesPanel('Revenue Over Time', [
      { expr: 'sum(rate(revenue_total_dollars[$interval])) * 60', legend: 'Revenue/min' },
    ], {
      unit: 'currencyUSD',
      gridPos: { x: 12, y: 6, w: 12, h: 8 },
    })

    .row('User Activity')
    .timeseriesPanel('User Registrations', [
      { expr: 'sum(rate(users_registered_total[$interval])) by (source)', legend: '{{source}}' },
    ], {
      gridPos: { x: 0, y: 15, w: 12, h: 8 },
    })
    .timeseriesPanel('User Logins', [
      { expr: 'sum(rate(user_logins_total[$interval])) by (method)', legend: '{{method}}' },
    ], {
      gridPos: { x: 12, y: 15, w: 12, h: 8 },
    })

    .build();
}
```

## Provisioning Configuration

```yaml
# grafana/provisioning/datasources/datasources.yaml

apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: ${PROMETHEUS_URL}
    isDefault: true
    editable: false
    jsonData:
      timeInterval: "15s"
      httpMethod: POST

  - name: Loki
    type: loki
    access: proxy
    url: ${LOKI_URL}
    editable: false
    jsonData:
      maxLines: 1000

  - name: Tempo
    type: tempo
    access: proxy
    url: ${TEMPO_URL}
    editable: false
    jsonData:
      tracesToLogs:
        datasourceUid: loki
        tags: ['service']
      serviceMap:
        datasourceUid: prometheus
```

```yaml
# grafana/provisioning/dashboards/dashboards.yaml

apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: 'Application'
    folderUid: 'app-dashboards'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /etc/grafana/dashboards
```

## Usage Examples

```typescript
// Create and deploy dashboard

import { GrafanaClient } from '@/lib/grafana/client';
import { DashboardBuilder } from '@/lib/grafana/dashboards/builder';
import { createHTTPDashboard } from '@/lib/grafana/dashboards/templates/http';

const grafana = new GrafanaClient();

// Create folder
const folder = await grafana.createFolder('Application Dashboards', 'app-dashboards');

// Create HTTP dashboard from template
const httpDashboard = createHTTPDashboard('my-api');
const result = await grafana.createDashboard(httpDashboard, folder.uid);
console.log('Dashboard URL:', result.url);

// Create custom dashboard
const customDashboard = new DashboardBuilder('Custom Dashboard')
  .tags('custom', 'api')
  .envVariable()
  .statPanel('Total Requests', 'sum(http_requests_total)', { unit: 'none' })
  .timeseriesPanel('Request Rate', [
    { expr: 'rate(http_requests_total[5m])', legend: 'Requests' },
  ])
  .build();

await grafana.createDashboard(customDashboard, folder.uid);

// Create annotation for deployment
await grafana.createAnnotation({
  dashboardUID: result.uid,
  time: Date.now(),
  tags: ['deployment'],
  text: 'Deployed version 1.2.3',
});
```

## CLAUDE.md Integration

```markdown
## Grafana Guidelines

### Creating Dashboards
- Use `DashboardBuilder` for programmatic dashboard creation
- Use templates for common dashboard patterns (HTTP, Business)
- Include variables for filtering (environment, service, interval)

### Panel Types
- **stat**: Single value metrics (requests, errors, latency)
- **timeseries**: Time-based data visualization
- **gauge**: Values with thresholds (CPU, memory)
- **table**: Tabular data display
- **logs**: Log viewing (requires Loki)

### Best Practices
- Group related panels into rows
- Use consistent time intervals via variables
- Set appropriate thresholds for gauges
- Include links to runbooks and related dashboards
```

## AI Suggestions

1. **Implement dashboard versioning** - Track dashboard changes with git integration
2. **Add dashboard templates library** - Create reusable templates for common use cases
3. **Implement dynamic dashboard generation** - Generate dashboards from service discovery
4. **Add dashboard validation** - Validate dashboards before deployment
5. **Implement dashboard variables from metrics** - Auto-populate variables from metric labels
6. **Add dashboard testing** - Test dashboards with synthetic data
7. **Implement cross-dashboard linking** - Smart linking between related dashboards
8. **Add annotation automation** - Auto-create annotations from CI/CD events
9. **Implement dashboard optimization** - Analyze and optimize query performance
10. **Add dashboard documentation** - Generate documentation from dashboard definitions
