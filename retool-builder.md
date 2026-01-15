# RETOOL.BUILDER.EXE - Internal Tools Builder

> Production-ready internal tool generator for building admin panels, dashboards, and CRUD apps

## Quick Commands

```bash
# Generate admin dashboard
python retool_builder.py dashboard --name "User Admin" --datasource postgres

# Create CRUD app
python retool_builder.py crud --resource users --datasource supabase

# Build workflow automation
python retool_builder.py workflow --trigger webhook --actions query,transform,notify

# Generate form builder
python retool_builder.py form --schema ./user-schema.json --output react
```

---

## System Prompt

```
You are RETOOL.BUILDER.EXE — the internal tools architect for building admin panels, dashboards, and CRUD applications.

IDENTITY
You create production-ready internal tools that connect to databases, APIs, and services. You understand low-code patterns and generate clean, maintainable code for React-based admin interfaces.

CAPABILITIES
- DataSourceArchitect: Configure database and API connections
- ComponentDesigner: Build UI with tables, forms, charts, modals
- WorkflowBuilder: Create multi-step automations and triggers
- PermissionManager: Implement RBAC and row-level security
- QueryOptimizer: Write efficient database queries with caching
```

---

## Implementation

```python
#!/usr/bin/env python3
"""
RETOOL.BUILDER.EXE - Internal Tools Builder
Build admin panels, dashboards, and CRUD apps with database connections
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
import json
import argparse


# =============================================================================
# ENUMS - Data Sources & Components
# =============================================================================

class DataSourceType(Enum):
    """Supported data source types"""
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MONGODB = "mongodb"
    SUPABASE = "supabase"
    FIREBASE = "firebase"
    REST_API = "rest_api"
    GRAPHQL = "graphql"
    AIRTABLE = "airtable"
    GOOGLE_SHEETS = "google_sheets"

    @property
    def connection_template(self) -> str:
        templates = {
            "postgresql": "postgresql://{user}:{password}@{host}:{port}/{database}",
            "mysql": "mysql://{user}:{password}@{host}:{port}/{database}",
            "mongodb": "mongodb+srv://{user}:{password}@{host}/{database}",
            "supabase": "https://{project_id}.supabase.co",
            "firebase": "https://{project_id}.firebaseio.com",
            "rest_api": "{base_url}",
            "graphql": "{endpoint}",
            "airtable": "https://api.airtable.com/v0/{base_id}",
            "google_sheets": "https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}"
        }
        return templates.get(self.value, "{base_url}")

    @property
    def requires_auth(self) -> bool:
        return self.value not in ["google_sheets"]

    @property
    def supports_realtime(self) -> bool:
        return self.value in ["supabase", "firebase", "mongodb"]


class ComponentType(Enum):
    """UI component types for internal tools"""
    TABLE = "table"
    FORM = "form"
    CHART = "chart"
    BUTTON = "button"
    MODAL = "modal"
    TABS = "tabs"
    CARD = "card"
    STATS = "stats"
    TEXT_INPUT = "text_input"
    SELECT = "select"
    DATE_PICKER = "date_picker"
    FILE_UPLOAD = "file_upload"
    RICH_TEXT = "rich_text"
    JSON_EDITOR = "json_editor"
    CODE_EDITOR = "code_editor"

    @property
    def category(self) -> str:
        categories = {
            "table": "data_display",
            "form": "input",
            "chart": "data_display",
            "button": "action",
            "modal": "container",
            "tabs": "container",
            "card": "container",
            "stats": "data_display",
            "text_input": "input",
            "select": "input",
            "date_picker": "input",
            "file_upload": "input",
            "rich_text": "input",
            "json_editor": "input",
            "code_editor": "input"
        }
        return categories.get(self.value, "other")

    @property
    def supports_binding(self) -> bool:
        """Whether component supports data binding"""
        return self.value in ["table", "form", "chart", "select", "stats"]


class ChartType(Enum):
    """Chart visualization types"""
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    AREA = "area"
    SCATTER = "scatter"
    DONUT = "donut"
    GAUGE = "gauge"
    FUNNEL = "funnel"

    @property
    def recharts_component(self) -> str:
        mapping = {
            "bar": "BarChart",
            "line": "LineChart",
            "pie": "PieChart",
            "area": "AreaChart",
            "scatter": "ScatterChart",
            "donut": "PieChart",
            "gauge": "RadialBarChart",
            "funnel": "FunnelChart"
        }
        return mapping.get(self.value, "BarChart")


class ActionType(Enum):
    """Workflow action types"""
    QUERY = "query"
    TRANSFORM = "transform"
    CONDITION = "condition"
    LOOP = "loop"
    WEBHOOK = "webhook"
    EMAIL = "email"
    SLACK = "slack"
    SCRIPT = "script"
    DELAY = "delay"

    @property
    def has_output(self) -> bool:
        return self.value in ["query", "transform", "script", "webhook"]


class TriggerType(Enum):
    """Workflow trigger types"""
    MANUAL = "manual"
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    DATABASE = "database"
    ROW_CHANGE = "row_change"
    FORM_SUBMIT = "form_submit"

    @property
    def requires_config(self) -> bool:
        return self.value in ["schedule", "webhook", "database"]


class FieldType(Enum):
    """Form field types with validation"""
    TEXT = "text"
    EMAIL = "email"
    PASSWORD = "password"
    NUMBER = "number"
    PHONE = "phone"
    URL = "url"
    TEXTAREA = "textarea"
    SELECT = "select"
    MULTISELECT = "multiselect"
    CHECKBOX = "checkbox"
    RADIO = "radio"
    DATE = "date"
    DATETIME = "datetime"
    FILE = "file"
    JSON = "json"

    @property
    def html_input_type(self) -> str:
        mapping = {
            "text": "text",
            "email": "email",
            "password": "password",
            "number": "number",
            "phone": "tel",
            "url": "url",
            "textarea": "textarea",
            "date": "date",
            "datetime": "datetime-local",
            "file": "file"
        }
        return mapping.get(self.value, "text")

    @property
    def default_validation(self) -> dict:
        validations = {
            "email": {"pattern": r"^[^\s@]+@[^\s@]+\.[^\s@]+$"},
            "phone": {"pattern": r"^\+?[\d\s-]{10,}$"},
            "url": {"pattern": r"^https?://"},
            "number": {"type": "number"}
        }
        return validations.get(self.value, {})


# =============================================================================
# DATA CLASSES - Configuration & Schema
# =============================================================================

@dataclass
class DataSourceConfig:
    """Data source connection configuration"""
    name: str
    type: DataSourceType
    connection_string: str = ""
    api_key: str = ""
    headers: dict = field(default_factory=dict)
    timeout: int = 30000
    ssl: bool = True
    pool_size: int = 10

    @classmethod
    def postgres(cls, host: str, database: str, user: str = "postgres",
                 port: int = 5432) -> "DataSourceConfig":
        return cls(
            name="postgres_main",
            type=DataSourceType.POSTGRESQL,
            connection_string=f"postgresql://{user}:${{DB_PASSWORD}}@{host}:{port}/{database}",
            ssl=True,
            pool_size=20
        )

    @classmethod
    def supabase(cls, project_id: str) -> "DataSourceConfig":
        return cls(
            name="supabase_main",
            type=DataSourceType.SUPABASE,
            connection_string=f"https://{project_id}.supabase.co",
            headers={"apikey": "${SUPABASE_ANON_KEY}"},
            timeout=30000
        )

    @classmethod
    def rest_api(cls, name: str, base_url: str, auth_header: str = "") -> "DataSourceConfig":
        headers = {}
        if auth_header:
            headers["Authorization"] = auth_header
        return cls(
            name=name,
            type=DataSourceType.REST_API,
            connection_string=base_url,
            headers=headers
        )

    def to_env_config(self) -> str:
        """Generate environment variable configuration"""
        lines = [f"# {self.name} - {self.type.value}"]
        if self.type == DataSourceType.POSTGRESQL:
            lines.append(f"{self.name.upper()}_URL={self.connection_string}")
            lines.append(f"{self.name.upper()}_POOL_SIZE={self.pool_size}")
        elif self.type == DataSourceType.SUPABASE:
            lines.append(f"SUPABASE_URL={self.connection_string}")
            lines.append("SUPABASE_ANON_KEY=your-anon-key")
            lines.append("SUPABASE_SERVICE_KEY=your-service-key")
        elif self.type == DataSourceType.REST_API:
            lines.append(f"{self.name.upper()}_BASE_URL={self.connection_string}")
            if "Authorization" in self.headers:
                lines.append(f"{self.name.upper()}_API_KEY=your-api-key")
        return "\n".join(lines)


@dataclass
class ColumnConfig:
    """Table column configuration"""
    key: str
    label: str
    type: str = "text"
    sortable: bool = True
    filterable: bool = True
    editable: bool = False
    width: Optional[int] = None
    render: Optional[str] = None  # Custom render function

    def to_tanstack_column(self) -> dict:
        col = {
            "accessorKey": self.key,
            "header": self.label,
            "enableSorting": self.sortable,
            "enableColumnFilter": self.filterable,
        }
        if self.width:
            col["size"] = self.width
        return col


@dataclass
class TableConfig:
    """Table component configuration"""
    name: str
    datasource: str
    query: str
    columns: list[ColumnConfig] = field(default_factory=list)
    page_size: int = 25
    enable_search: bool = True
    enable_export: bool = True
    enable_selection: bool = False
    row_actions: list[str] = field(default_factory=list)

    @classmethod
    def users_table(cls, datasource: str) -> "TableConfig":
        return cls(
            name="users_table",
            datasource=datasource,
            query="SELECT id, email, name, role, created_at, status FROM users ORDER BY created_at DESC",
            columns=[
                ColumnConfig("id", "ID", width=80),
                ColumnConfig("email", "Email", filterable=True),
                ColumnConfig("name", "Name", editable=True),
                ColumnConfig("role", "Role", type="badge"),
                ColumnConfig("created_at", "Created", type="date"),
                ColumnConfig("status", "Status", type="status")
            ],
            row_actions=["edit", "delete", "impersonate"]
        )

    @classmethod
    def orders_table(cls, datasource: str) -> "TableConfig":
        return cls(
            name="orders_table",
            datasource=datasource,
            query="""
                SELECT o.id, o.order_number, u.email as customer,
                       o.total, o.status, o.created_at
                FROM orders o
                JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
            """,
            columns=[
                ColumnConfig("order_number", "Order #", width=120),
                ColumnConfig("customer", "Customer"),
                ColumnConfig("total", "Total", type="currency"),
                ColumnConfig("status", "Status", type="status"),
                ColumnConfig("created_at", "Date", type="date")
            ],
            row_actions=["view", "refund", "resend_email"]
        )


@dataclass
class FormField:
    """Form field configuration"""
    name: str
    label: str
    type: FieldType
    required: bool = False
    placeholder: str = ""
    default_value: str = ""
    options: list[dict] = field(default_factory=list)  # For select/radio
    validation: dict = field(default_factory=dict)
    depends_on: Optional[str] = None  # Conditional display

    def to_react_hook_form(self) -> str:
        """Generate React Hook Form field"""
        validation_rules = []
        if self.required:
            validation_rules.append('required: "This field is required"')
        if self.validation:
            if "pattern" in self.validation:
                validation_rules.append(f'pattern: {{ value: /{self.validation["pattern"]}/, message: "Invalid format" }}')
            if "min" in self.validation:
                validation_rules.append(f'min: {{ value: {self.validation["min"]}, message: "Minimum value is {self.validation["min"]}" }}')
            if "max" in self.validation:
                validation_rules.append(f'max: {{ value: {self.validation["max"]}, message: "Maximum value is {self.validation["max"]}" }}')

        rules = ", ".join(validation_rules)
        return f'{{...register("{self.name}", {{ {rules} }})}}'


@dataclass
class FormConfig:
    """Form component configuration"""
    name: str
    title: str
    fields: list[FormField] = field(default_factory=list)
    submit_action: str = "insert"  # insert, update, api_call
    datasource: Optional[str] = None
    table: Optional[str] = None
    success_message: str = "Saved successfully"
    redirect_after: Optional[str] = None

    @classmethod
    def user_form(cls) -> "FormConfig":
        return cls(
            name="user_form",
            title="Create User",
            fields=[
                FormField("email", "Email", FieldType.EMAIL, required=True),
                FormField("name", "Full Name", FieldType.TEXT, required=True),
                FormField("password", "Password", FieldType.PASSWORD, required=True,
                         validation={"min": 8}),
                FormField("role", "Role", FieldType.SELECT, required=True,
                         options=[
                             {"value": "user", "label": "User"},
                             {"value": "admin", "label": "Admin"},
                             {"value": "moderator", "label": "Moderator"}
                         ]),
                FormField("send_welcome", "Send Welcome Email", FieldType.CHECKBOX,
                         default_value="true")
            ],
            submit_action="insert",
            table="users"
        )

    @classmethod
    def settings_form(cls) -> "FormConfig":
        return cls(
            name="settings_form",
            title="App Settings",
            fields=[
                FormField("app_name", "Application Name", FieldType.TEXT, required=True),
                FormField("support_email", "Support Email", FieldType.EMAIL),
                FormField("timezone", "Timezone", FieldType.SELECT,
                         options=[
                             {"value": "UTC", "label": "UTC"},
                             {"value": "America/New_York", "label": "Eastern Time"},
                             {"value": "America/Los_Angeles", "label": "Pacific Time"},
                             {"value": "Europe/London", "label": "London"}
                         ]),
                FormField("maintenance_mode", "Maintenance Mode", FieldType.CHECKBOX),
                FormField("custom_css", "Custom CSS", FieldType.TEXTAREA)
            ],
            submit_action="api_call"
        )


@dataclass
class ChartConfig:
    """Chart component configuration"""
    name: str
    type: ChartType
    datasource: str
    query: str
    x_axis: str
    y_axis: str
    series: list[str] = field(default_factory=list)
    title: str = ""
    colors: list[str] = field(default_factory=lambda: ["#8884d8", "#82ca9d", "#ffc658"])

    @classmethod
    def revenue_chart(cls, datasource: str) -> "ChartConfig":
        return cls(
            name="revenue_chart",
            type=ChartType.AREA,
            datasource=datasource,
            query="""
                SELECT DATE_TRUNC('day', created_at) as date,
                       SUM(total) as revenue,
                       COUNT(*) as orders
                FROM orders
                WHERE created_at > NOW() - INTERVAL '30 days'
                GROUP BY DATE_TRUNC('day', created_at)
                ORDER BY date
            """,
            x_axis="date",
            y_axis="revenue",
            series=["revenue", "orders"],
            title="Revenue (Last 30 Days)"
        )

    @classmethod
    def user_growth_chart(cls, datasource: str) -> "ChartConfig":
        return cls(
            name="user_growth",
            type=ChartType.LINE,
            datasource=datasource,
            query="""
                SELECT DATE_TRUNC('week', created_at) as week,
                       COUNT(*) as new_users,
                       SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('week', created_at)) as total_users
                FROM users
                GROUP BY DATE_TRUNC('week', created_at)
                ORDER BY week
            """,
            x_axis="week",
            y_axis="total_users",
            series=["new_users", "total_users"],
            title="User Growth"
        )


@dataclass
class WorkflowStep:
    """Workflow step configuration"""
    id: str
    type: ActionType
    name: str
    config: dict = field(default_factory=dict)
    condition: Optional[str] = None
    on_error: str = "stop"  # stop, continue, retry

    @classmethod
    def query_step(cls, id: str, datasource: str, query: str) -> "WorkflowStep":
        return cls(
            id=id,
            type=ActionType.QUERY,
            name="Execute Query",
            config={"datasource": datasource, "query": query}
        )

    @classmethod
    def transform_step(cls, id: str, code: str) -> "WorkflowStep":
        return cls(
            id=id,
            type=ActionType.TRANSFORM,
            name="Transform Data",
            config={"code": code}
        )

    @classmethod
    def email_step(cls, id: str, to: str, subject: str, body: str) -> "WorkflowStep":
        return cls(
            id=id,
            type=ActionType.EMAIL,
            name="Send Email",
            config={"to": to, "subject": subject, "body": body}
        )

    @classmethod
    def slack_step(cls, id: str, channel: str, message: str) -> "WorkflowStep":
        return cls(
            id=id,
            type=ActionType.SLACK,
            name="Send Slack Message",
            config={"channel": channel, "message": message}
        )


@dataclass
class WorkflowConfig:
    """Workflow automation configuration"""
    name: str
    trigger: TriggerType
    trigger_config: dict = field(default_factory=dict)
    steps: list[WorkflowStep] = field(default_factory=list)
    enabled: bool = True

    @classmethod
    def new_user_workflow(cls, datasource: str) -> "WorkflowConfig":
        return cls(
            name="new_user_onboarding",
            trigger=TriggerType.ROW_CHANGE,
            trigger_config={"table": "users", "event": "INSERT"},
            steps=[
                WorkflowStep.query_step(
                    "get_user",
                    datasource,
                    "SELECT * FROM users WHERE id = {{trigger.row.id}}"
                ),
                WorkflowStep.email_step(
                    "welcome_email",
                    "{{steps.get_user.data.email}}",
                    "Welcome to Our Platform!",
                    "Hi {{steps.get_user.data.name}}, welcome aboard!"
                ),
                WorkflowStep.slack_step(
                    "notify_team",
                    "#new-users",
                    "New user signed up: {{steps.get_user.data.email}}"
                )
            ]
        )

    @classmethod
    def daily_report_workflow(cls, datasource: str) -> "WorkflowConfig":
        return cls(
            name="daily_metrics_report",
            trigger=TriggerType.SCHEDULE,
            trigger_config={"cron": "0 9 * * *"},  # 9 AM daily
            steps=[
                WorkflowStep.query_step(
                    "get_metrics",
                    datasource,
                    """
                    SELECT
                        COUNT(*) as total_orders,
                        SUM(total) as revenue,
                        COUNT(DISTINCT user_id) as unique_customers
                    FROM orders
                    WHERE created_at > NOW() - INTERVAL '24 hours'
                    """
                ),
                WorkflowStep.transform_step(
                    "format_report",
                    """
                    return {
                        summary: `Orders: ${data.total_orders}, Revenue: $${data.revenue.toFixed(2)}`
                    }
                    """
                ),
                WorkflowStep.slack_step(
                    "send_report",
                    "#daily-metrics",
                    "📊 Daily Report: {{steps.format_report.data.summary}}"
                )
            ]
        )


@dataclass
class PageConfig:
    """Admin page configuration"""
    name: str
    path: str
    title: str
    icon: str = "LayoutDashboard"
    components: list[dict] = field(default_factory=list)
    permissions: list[str] = field(default_factory=lambda: ["admin"])

    @classmethod
    def dashboard_page(cls) -> "PageConfig":
        return cls(
            name="dashboard",
            path="/",
            title="Dashboard",
            icon="LayoutDashboard",
            components=[
                {"type": "stats", "config": {"datasource": "main", "query": "stats_query"}},
                {"type": "chart", "config": {"name": "revenue_chart"}},
                {"type": "table", "config": {"name": "recent_orders", "limit": 5}}
            ],
            permissions=["admin", "analyst"]
        )

    @classmethod
    def users_page(cls) -> "PageConfig":
        return cls(
            name="users",
            path="/users",
            title="Users",
            icon="Users",
            components=[
                {"type": "button", "config": {"label": "Add User", "action": "openModal", "modal": "user_form"}},
                {"type": "table", "config": {"name": "users_table"}}
            ],
            permissions=["admin"]
        )


@dataclass
class AppConfig:
    """Complete internal tool application configuration"""
    name: str
    description: str = ""
    datasources: list[DataSourceConfig] = field(default_factory=list)
    pages: list[PageConfig] = field(default_factory=list)
    tables: list[TableConfig] = field(default_factory=list)
    forms: list[FormConfig] = field(default_factory=list)
    charts: list[ChartConfig] = field(default_factory=list)
    workflows: list[WorkflowConfig] = field(default_factory=list)
    theme: dict = field(default_factory=lambda: {"primaryColor": "#6366f1", "mode": "light"})

    @classmethod
    def admin_dashboard(cls, project_name: str, datasource_type: str = "supabase") -> "AppConfig":
        if datasource_type == "supabase":
            ds = DataSourceConfig.supabase("your-project-id")
        else:
            ds = DataSourceConfig.postgres("localhost", project_name)

        return cls(
            name=f"{project_name}_admin",
            description=f"Admin dashboard for {project_name}",
            datasources=[ds],
            pages=[
                PageConfig.dashboard_page(),
                PageConfig.users_page(),
                PageConfig(
                    name="settings",
                    path="/settings",
                    title="Settings",
                    icon="Settings",
                    components=[{"type": "form", "config": {"name": "settings_form"}}]
                )
            ],
            tables=[TableConfig.users_table(ds.name)],
            forms=[FormConfig.user_form(), FormConfig.settings_form()],
            charts=[ChartConfig.revenue_chart(ds.name)],
            workflows=[WorkflowConfig.new_user_workflow(ds.name)]
        )

    @classmethod
    def ecommerce_admin(cls) -> "AppConfig":
        ds = DataSourceConfig.postgres("localhost", "ecommerce")

        return cls(
            name="ecommerce_admin",
            description="E-commerce admin panel",
            datasources=[ds],
            pages=[
                PageConfig.dashboard_page(),
                PageConfig(
                    name="orders",
                    path="/orders",
                    title="Orders",
                    icon="ShoppingCart",
                    components=[
                        {"type": "stats", "config": {"type": "order_stats"}},
                        {"type": "table", "config": {"name": "orders_table"}}
                    ]
                ),
                PageConfig.users_page(),
                PageConfig(
                    name="products",
                    path="/products",
                    title="Products",
                    icon="Package",
                    components=[
                        {"type": "button", "config": {"label": "Add Product", "action": "openModal"}},
                        {"type": "table", "config": {"name": "products_table"}}
                    ]
                )
            ],
            tables=[
                TableConfig.users_table(ds.name),
                TableConfig.orders_table(ds.name)
            ],
            forms=[FormConfig.user_form()],
            charts=[
                ChartConfig.revenue_chart(ds.name),
                ChartConfig.user_growth_chart(ds.name)
            ],
            workflows=[
                WorkflowConfig.new_user_workflow(ds.name),
                WorkflowConfig.daily_report_workflow(ds.name)
            ]
        )


# =============================================================================
# CODE GENERATORS
# =============================================================================

class DataSourceGenerator:
    """Generate data source connection code"""

    @staticmethod
    def generate_postgres_client() -> str:
        return '''
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query<T>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function execute(text: string, params?: any[]): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}

export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
'''

    @staticmethod
    def generate_supabase_client() -> str:
        return '''
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role
export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Typed query helper
export async function queryTable<T>(
  table: string,
  options?: {
    select?: string;
    filters?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }
): Promise<T[]> {
  let query = supabase.from(table).select(options?.select || '*');

  if (options?.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (options?.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as T[];
}

// Real-time subscription helper
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}
'''

    @staticmethod
    def generate_api_client() -> str:
        return '''
// lib/api-client.ts
const BASE_URL = process.env.API_BASE_URL;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

class APIClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, params } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      url += '?' + new URLSearchParams(params).toString();
    }

    const response = await fetch(url, {
      method,
      headers: { ...this.defaultHeaders, ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, params?: Record<string, string>) {
    return this.request<T>(endpoint, { params });
  }

  post<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  put<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  patch<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new APIClient(BASE_URL!, {
  'Authorization': `Bearer ${process.env.API_KEY}`
});
'''


class ComponentGenerator:
    """Generate React components for internal tools"""

    @staticmethod
    def generate_data_table(config: TableConfig) -> str:
        columns_json = json.dumps([col.to_tanstack_column() for col in config.columns], indent=2)

        return f'''
// components/tables/{config.name}.tsx
"use client";

import {{ useState }} from 'react';
import {{
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
}} from '@tanstack/react-table';
import {{ useQuery }} from '@tanstack/react-query';
import {{
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
}} from '@/components/ui/table';
import {{ Button }} from '@/components/ui/button';
import {{ Input }} from '@/components/ui/input';
import {{
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search
}} from 'lucide-react';

interface {config.name.title().replace("_", "")}Data {{
  {chr(10).join(f"  {col.key}: any;" for col in config.columns)}
}}

const columns: ColumnDef<{config.name.title().replace("_", "")}Data>[] = {columns_json};

export function {config.name.title().replace("_", "")}() {{
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const {{ data, isLoading, error }} = useQuery({{
    queryKey: ['{config.name}'],
    queryFn: async () => {{
      const res = await fetch('/api/{config.name.replace("_", "-")}');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }},
  }});

  const table = useReactTable({{
    data: data || [],
    columns,
    state: {{ sorting, globalFilter }},
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {{ pagination: {{ pageSize: {config.page_size} }} }},
  }});

  if (isLoading) return <div className="animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-500">Error loading data</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {f'''<div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={{globalFilter}}
            onChange={{(e) => setGlobalFilter(e.target.value)}}
            className="w-64"
          />
        </div>''' if config.enable_search else ""}

        {f'''<Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>''' if config.enable_export else ""}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {{table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={{headerGroup.id}}>
                {{headerGroup.headers.map((header) => (
                  <TableHead key={{header.id}}>
                    {{header.isPlaceholder ? null : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}}
                  </TableHead>
                ))}}
              </TableRow>
            ))}}
          </TableHeader>
          <TableBody>
            {{table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={{row.id}}>
                  {{row.getVisibleCells().map((cell) => (
                    <TableCell key={{cell.id}}>
                      {{flexRender(cell.column.columnDef.cell, cell.getContext())}}
                    </TableCell>
                  ))}}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={{columns.length}} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {{table.getState().pagination.pageIndex + 1}} of {{table.getPageCount()}}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={{() => table.setPageIndex(0)}}
            disabled={{!table.getCanPreviousPage()}}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={{() => table.previousPage()}}
            disabled={{!table.getCanPreviousPage()}}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={{() => table.nextPage()}}
            disabled={{!table.getCanNextPage()}}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={{() => table.setPageIndex(table.getPageCount() - 1)}}
            disabled={{!table.getCanNextPage()}}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}}
'''

    @staticmethod
    def generate_form(config: FormConfig) -> str:
        field_imports = []
        field_components = []

        for f in config.fields:
            if f.type == FieldType.SELECT:
                field_components.append(f'''
        <div className="space-y-2">
          <Label htmlFor="{f.name}">{f.label}</Label>
          <Controller
            name="{f.name}"
            control={{control}}
            rules={{{{ required: {str(f.required).lower()} }}}}
            render={{({{ field }}) => (
              <Select onValueChange={{field.onChange}} defaultValue={{field.value}}>
                <SelectTrigger>
                  <SelectValue placeholder="Select {f.label.lower()}" />
                </SelectTrigger>
                <SelectContent>
                  {chr(10).join(f'                  <SelectItem value="{opt["value"]}">{opt["label"]}</SelectItem>' for opt in f.options)}
                </SelectContent>
              </Select>
            )}}
          />
          {{errors.{f.name} && <p className="text-sm text-red-500">{{errors.{f.name}?.message}}</p>}}
        </div>''')
            elif f.type == FieldType.CHECKBOX:
                field_components.append(f'''
        <div className="flex items-center space-x-2">
          <Checkbox id="{f.name}" {{...register("{f.name}")}} />
          <Label htmlFor="{f.name}">{f.label}</Label>
        </div>''')
            elif f.type == FieldType.TEXTAREA:
                field_components.append(f'''
        <div className="space-y-2">
          <Label htmlFor="{f.name}">{f.label}</Label>
          <Textarea
            id="{f.name}"
            placeholder="{f.placeholder}"
            {{...register("{f.name}", {{ required: {str(f.required).lower()} }})}}
          />
          {{errors.{f.name} && <p className="text-sm text-red-500">{{errors.{f.name}?.message}}</p>}}
        </div>''')
            else:
                field_components.append(f'''
        <div className="space-y-2">
          <Label htmlFor="{f.name}">{f.label}</Label>
          <Input
            id="{f.name}"
            type="{f.type.html_input_type}"
            placeholder="{f.placeholder}"
            {{...register("{f.name}", {{ required: {str(f.required).lower()} }})}}
          />
          {{errors.{f.name} && <p className="text-sm text-red-500">{{errors.{f.name}?.message}}</p>}}
        </div>''')

        return f'''
// components/forms/{config.name}.tsx
"use client";

import {{ useForm, Controller }} from 'react-hook-form';
import {{ useMutation, useQueryClient }} from '@tanstack/react-query';
import {{ Button }} from '@/components/ui/button';
import {{ Input }} from '@/components/ui/input';
import {{ Label }} from '@/components/ui/label';
import {{ Textarea }} from '@/components/ui/textarea';
import {{ Checkbox }} from '@/components/ui/checkbox';
import {{
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
}} from '@/components/ui/select';
import {{ toast }} from 'sonner';
import {{ Loader2 }} from 'lucide-react';

interface {config.name.title().replace("_", "")}Data {{
  {chr(10).join(f"  {f.name}: {('boolean' if f.type == FieldType.CHECKBOX else 'string')};" for f in config.fields)}
}}

interface {config.name.title().replace("_", "")}Props {{
  onSuccess?: () => void;
  defaultValues?: Partial<{config.name.title().replace("_", "")}Data>;
}}

export function {config.name.title().replace("_", "")}({{ onSuccess, defaultValues }}: {config.name.title().replace("_", "")}Props) {{
  const queryClient = useQueryClient();

  const {{
    register,
    control,
    handleSubmit,
    formState: {{ errors, isSubmitting }},
    reset
  }} = useForm<{config.name.title().replace("_", "")}Data>({{
    defaultValues
  }});

  const mutation = useMutation({{
    mutationFn: async (data: {config.name.title().replace("_", "")}Data) => {{
      const res = await fetch('/api/{config.name.replace("_", "-")}', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify(data),
      }});
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    }},
    onSuccess: () => {{
      toast.success('{config.success_message}');
      queryClient.invalidateQueries({{ queryKey: ['{config.table or config.name}'] }});
      reset();
      onSuccess?.();
    }},
    onError: (error) => {{
      toast.error(error.message || 'Something went wrong');
    }},
  }});

  return (
    <form onSubmit={{handleSubmit((data) => mutation.mutate(data))}} className="space-y-4">
      <h2 className="text-lg font-semibold">{config.title}</h2>

      {chr(10).join(field_components)}

      <Button type="submit" disabled={{isSubmitting || mutation.isPending}}>
        {{(isSubmitting || mutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}}
        Save
      </Button>
    </form>
  );
}}
'''

    @staticmethod
    def generate_chart(config: ChartConfig) -> str:
        component = config.type.recharts_component

        return f'''
// components/charts/{config.name}.tsx
"use client";

import {{ useQuery }} from '@tanstack/react-query';
import {{
  {component},
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  {"Area," if config.type == ChartType.AREA else ""}
  {"Line," if config.type == ChartType.LINE else ""}
  {"Bar," if config.type == ChartType.BAR else ""}
  {"Pie, Cell," if config.type in [ChartType.PIE, ChartType.DONUT] else ""}
}} from 'recharts';
import {{ Card, CardContent, CardHeader, CardTitle }} from '@/components/ui/card';

const COLORS = {json.dumps(config.colors)};

export function {config.name.title().replace("_", "")}() {{
  const {{ data, isLoading }} = useQuery({{
    queryKey: ['{config.name}'],
    queryFn: async () => {{
      const res = await fetch('/api/charts/{config.name.replace("_", "-")}');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }},
  }});

  if (isLoading) {{
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.title or config.name}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }}

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.title or config.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={{300}}>
          <{component} data={{data}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="{config.x_axis}" />
            <YAxis />
            <Tooltip />
            <Legend />
            {chr(10).join(f'            <{"Area" if config.type == ChartType.AREA else "Line" if config.type == ChartType.LINE else "Bar"} type="monotone" dataKey="{series}" stroke="{{COLORS[{i}]}}" fill="{{COLORS[{i}]}}" />' for i, series in enumerate(config.series))}
          </{component}>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}}
'''

    @staticmethod
    def generate_stats_card() -> str:
        return '''
// components/stats-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  loading
}: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={cn(
            "text-xs flex items-center gap-1",
            isPositive && "text-green-600",
            isNegative && "text-red-600",
            !isPositive && !isNegative && "text-muted-foreground"
          )}>
            {isPositive && <ArrowUp className="w-3 h-3" />}
            {isNegative && <ArrowDown className="w-3 h-3" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}% {changeLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
'''


class PageGenerator:
    """Generate page layouts and navigation"""

    @staticmethod
    def generate_layout(app_config: AppConfig) -> str:
        nav_items = []
        for page in app_config.pages:
            nav_items.append(f'''
          <NavItem href="{page.path}" icon={{{page.icon}}}>
            {page.title}
          </NavItem>''')

        return f'''
// app/admin/layout.tsx
"use client";

import {{ useState }} from 'react';
import Link from 'next/link';
import {{ usePathname }} from 'next/navigation';
import {{
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Settings,
  Menu,
  X,
  LogOut
}} from 'lucide-react';
import {{ cn }} from '@/lib/utils';
import {{ Button }} from '@/components/ui/button';
import {{ Avatar, AvatarFallback }} from '@/components/ui/avatar';
import {{
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
}} from '@/components/ui/dropdown-menu';

const iconMap = {{
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Settings
}};

function NavItem({{
  href,
  icon: Icon,
  children
}}: {{
  href: string;
  icon: keyof typeof iconMap;
  children: React.ReactNode
}}) {{
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
  const IconComponent = iconMap[Icon] || LayoutDashboard;

  return (
    <Link
      href={{href}}
      className={{cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}}
    >
      <IconComponent className="h-4 w-4" />
      {{children}}
    </Link>
  );
}}

export default function AdminLayout({{
  children,
}}: {{
  children: React.ReactNode;
}}) {{
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {{/* Mobile sidebar toggle */}}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={{() => setSidebarOpen(!sidebarOpen)}}
      >
        {{sidebarOpen ? <X /> : <Menu />}}
      </Button>

      {{/* Sidebar */}}
      <aside className={{cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform bg-card border-r transition-transform duration-200 ease-in-out md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <LayoutDashboard className="h-6 w-6" />
              <span>{app_config.name}</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {chr(10).join(nav_items)}
          </nav>

          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Admin User</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {{/* Main content */}}
      <main className="flex-1 md:ml-64">
        <div className="container py-6 px-4 md:px-6">
          {{children}}
        </div>
      </main>

      {{/* Mobile overlay */}}
      {{sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={{() => setSidebarOpen(false)}}
        />
      )}}
    </div>
  );
}}
'''

    @staticmethod
    def generate_dashboard_page(app_config: AppConfig) -> str:
        return f'''
// app/admin/page.tsx
"use client";

import {{ useQuery }} from '@tanstack/react-query';
import {{ StatsCard }} from '@/components/stats-card';
import {{ {", ".join(c.name.title().replace("_", "") for c in app_config.charts)} }} from '@/components/charts';
import {{ DollarSign, Users, ShoppingCart, TrendingUp }} from 'lucide-react';

export default function DashboardPage() {{
  const {{ data: stats, isLoading }} = useQuery({{
    queryKey: ['dashboard-stats'],
    queryFn: async () => {{
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }},
  }});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to {app_config.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={{stats?.revenue ? `${{stats.revenue.toLocaleString()}}` : '-'}}
          change={{stats?.revenueChange}}
          icon={{<DollarSign className="h-4 w-4 text-muted-foreground" />}}
          loading={{isLoading}}
        />
        <StatsCard
          title="Total Users"
          value={{stats?.users?.toLocaleString() || '-'}}
          change={{stats?.usersChange}}
          icon={{<Users className="h-4 w-4 text-muted-foreground" />}}
          loading={{isLoading}}
        />
        <StatsCard
          title="Total Orders"
          value={{stats?.orders?.toLocaleString() || '-'}}
          change={{stats?.ordersChange}}
          icon={{<ShoppingCart className="h-4 w-4 text-muted-foreground" />}}
          loading={{isLoading}}
        />
        <StatsCard
          title="Conversion Rate"
          value={{stats?.conversionRate ? `${{stats.conversionRate.toFixed(1)}}%` : '-'}}
          change={{stats?.conversionChange}}
          icon={{<TrendingUp className="h-4 w-4 text-muted-foreground" />}}
          loading={{isLoading}}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {chr(10).join(f"        <{c.name.title().replace('_', '')} />" for c in app_config.charts)}
      </div>
    </div>
  );
}}
'''


class APIRouteGenerator:
    """Generate Next.js API routes"""

    @staticmethod
    def generate_table_route(config: TableConfig) -> str:
        return f'''
// app/api/{config.name.replace("_", "-")}/route.ts
import {{ NextRequest, NextResponse }} from 'next/server';
import {{ query }} from '@/lib/db';

export async function GET(request: NextRequest) {{
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '{config.page_size}');
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const offset = (page - 1) * limit;

  try {{
    // Get total count
    const countResult = await query<{{ count: string }}>(
      `SELECT COUNT(*) as count FROM ({config.query}) as subquery`
    );
    const total = parseInt(countResult[0].count);

    // Get paginated data
    const data = await query(
      `{config.query}
       ORDER BY ${{sortBy}} ${{sortOrder === 'desc' ? 'DESC' : 'ASC'}}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return NextResponse.json({{
      data,
      pagination: {{
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }}
    }});
  }} catch (error) {{
    console.error('Query error:', error);
    return NextResponse.json(
      {{ error: 'Failed to fetch data' }},
      {{ status: 500 }}
    );
  }}
}}
'''

    @staticmethod
    def generate_form_route(config: FormConfig) -> str:
        return f'''
// app/api/{config.name.replace("_", "-")}/route.ts
import {{ NextRequest, NextResponse }} from 'next/server';
import {{ query, execute }} from '@/lib/db';
import {{ z }} from 'zod';

const schema = z.object({{
  {chr(10).join(f"  {f.name}: z.{('boolean()' if f.type == FieldType.CHECKBOX else 'string()')}{'.optional()' if not f.required else ''}," for f in config.fields)}
}});

export async function POST(request: NextRequest) {{
  try {{
    const body = await request.json();
    const validated = schema.parse(body);

    {f'''const columns = Object.keys(validated);
    const values = Object.values(validated);
    const placeholders = values.map((_, i) => `${{i + 1}}`).join(', ');

    const result = await execute(
      `INSERT INTO {config.table} (${{columns.join(', ')}}) VALUES (${{placeholders}}) RETURNING *`,
      values
    );''' if config.submit_action == "insert" else '''// Custom API call logic here
    const result = validated;'''}

    return NextResponse.json({{ success: true, data: result }});
  }} catch (error) {{
    if (error instanceof z.ZodError) {{
      return NextResponse.json(
        {{ error: 'Validation failed', details: error.errors }},
        {{ status: 400 }}
      );
    }}
    console.error('Save error:', error);
    return NextResponse.json(
      {{ error: 'Failed to save' }},
      {{ status: 500 }}
    );
  }}
}}
'''

    @staticmethod
    def generate_stats_route() -> str:
        return '''
// app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Current period stats
    const [current] = await query<{
      revenue: number;
      orders: number;
      users: number;
    }>(`
      SELECT
        COALESCE(SUM(o.total), 0) as revenue,
        COUNT(DISTINCT o.id) as orders,
        COUNT(DISTINCT u.id) as users
      FROM orders o
      FULL OUTER JOIN users u ON 1=1
      WHERE o.created_at > NOW() - INTERVAL '30 days'
         OR u.created_at > NOW() - INTERVAL '30 days'
    `);

    // Previous period stats for comparison
    const [previous] = await query<{
      revenue: number;
      orders: number;
      users: number;
    }>(`
      SELECT
        COALESCE(SUM(o.total), 0) as revenue,
        COUNT(DISTINCT o.id) as orders,
        COUNT(DISTINCT u.id) as users
      FROM orders o
      FULL OUTER JOIN users u ON 1=1
      WHERE (o.created_at > NOW() - INTERVAL '60 days' AND o.created_at <= NOW() - INTERVAL '30 days')
         OR (u.created_at > NOW() - INTERVAL '60 days' AND u.created_at <= NOW() - INTERVAL '30 days')
    `);

    const calcChange = (curr: number, prev: number) =>
      prev > 0 ? ((curr - prev) / prev) * 100 : 0;

    return NextResponse.json({
      revenue: current.revenue,
      revenueChange: calcChange(current.revenue, previous.revenue),
      orders: current.orders,
      ordersChange: calcChange(current.orders, previous.orders),
      users: current.users,
      usersChange: calcChange(current.users, previous.users),
      conversionRate: current.users > 0 ? (current.orders / current.users) * 100 : 0,
      conversionChange: 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
'''


class WorkflowGenerator:
    """Generate workflow automation code"""

    @staticmethod
    def generate_workflow_engine() -> str:
        return '''
// lib/workflow-engine.ts
import { z } from 'zod';

interface WorkflowContext {
  trigger: any;
  steps: Record<string, any>;
  variables: Record<string, any>;
}

type StepExecutor = (context: WorkflowContext, config: any) => Promise<any>;

const stepExecutors: Record<string, StepExecutor> = {
  query: async (ctx, config) => {
    const { query } = await import('@/lib/db');
    const interpolatedQuery = interpolate(config.query, ctx);
    return query(interpolatedQuery);
  },

  transform: async (ctx, config) => {
    const fn = new Function('data', 'ctx', config.code);
    return fn(ctx.steps[config.inputStep]?.data, ctx);
  },

  email: async (ctx, config) => {
    const { sendEmail } = await import('@/lib/email');
    return sendEmail({
      to: interpolate(config.to, ctx),
      subject: interpolate(config.subject, ctx),
      body: interpolate(config.body, ctx),
    });
  },

  slack: async (ctx, config) => {
    const { sendSlackMessage } = await import('@/lib/slack');
    return sendSlackMessage(
      config.channel,
      interpolate(config.message, ctx)
    );
  },

  webhook: async (ctx, config) => {
    const response = await fetch(interpolate(config.url, ctx), {
      method: config.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interpolate(config.body, ctx)),
    });
    return response.json();
  },

  delay: async (ctx, config) => {
    await new Promise(resolve => setTimeout(resolve, config.ms));
    return { delayed: config.ms };
  },

  condition: async (ctx, config) => {
    const fn = new Function('ctx', `return ${config.expression}`);
    return { result: fn(ctx) };
  },
};

function interpolate(template: string | object, ctx: WorkflowContext): any {
  if (typeof template !== 'string') {
    return JSON.parse(interpolate(JSON.stringify(template), ctx));
  }

  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const value = path.trim().split('.').reduce((obj: any, key: string) => obj?.[key], ctx);
    return value !== undefined ? value : '';
  });
}

export async function executeWorkflow(
  workflow: any,
  triggerData: any
): Promise<{ success: boolean; results: Record<string, any>; error?: string }> {
  const context: WorkflowContext = {
    trigger: triggerData,
    steps: {},
    variables: {},
  };

  try {
    for (const step of workflow.steps) {
      // Check condition if present
      if (step.condition) {
        const conditionResult = await stepExecutors.condition(context, { expression: step.condition });
        if (!conditionResult.result) {
          context.steps[step.id] = { skipped: true };
          continue;
        }
      }

      const executor = stepExecutors[step.type];
      if (!executor) {
        throw new Error(`Unknown step type: ${step.type}`);
      }

      try {
        const result = await executor(context, step.config);
        context.steps[step.id] = { data: result, success: true };
      } catch (stepError) {
        if (step.on_error === 'continue') {
          context.steps[step.id] = { error: stepError, success: false };
          continue;
        } else if (step.on_error === 'retry') {
          // Simple retry logic
          for (let i = 0; i < 3; i++) {
            try {
              const result = await executor(context, step.config);
              context.steps[step.id] = { data: result, success: true };
              break;
            } catch {
              if (i === 2) throw stepError;
              await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            }
          }
        } else {
          throw stepError;
        }
      }
    }

    return { success: true, results: context.steps };
  } catch (error) {
    return {
      success: false,
      results: context.steps,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
'''

    @staticmethod
    def generate_workflow_trigger_api() -> str:
        return '''
// app/api/workflows/[id]/trigger/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeWorkflow } from '@/lib/workflow-engine';
import { getWorkflowById } from '@/lib/workflows';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = await getWorkflowById(params.id);

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (!workflow.enabled) {
      return NextResponse.json(
        { error: 'Workflow is disabled' },
        { status: 400 }
      );
    }

    const triggerData = await request.json();
    const result = await executeWorkflow(workflow, triggerData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Workflow trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
'''


# =============================================================================
# MAIN ENGINE
# =============================================================================

class RetoolBuilderEngine:
    """Main engine for generating internal tools"""

    def __init__(self, config: AppConfig):
        self.config = config
        self.ds_gen = DataSourceGenerator()
        self.comp_gen = ComponentGenerator()
        self.page_gen = PageGenerator()
        self.api_gen = APIRouteGenerator()
        self.wf_gen = WorkflowGenerator()

    def generate_all(self) -> dict[str, str]:
        """Generate all files for the internal tool"""
        files = {}

        # Data source clients
        for ds in self.config.datasources:
            if ds.type == DataSourceType.POSTGRESQL:
                files["lib/db.ts"] = self.ds_gen.generate_postgres_client()
            elif ds.type == DataSourceType.SUPABASE:
                files["lib/supabase.ts"] = self.ds_gen.generate_supabase_client()
            elif ds.type == DataSourceType.REST_API:
                files["lib/api-client.ts"] = self.ds_gen.generate_api_client()

        # Components
        files["components/stats-card.tsx"] = self.comp_gen.generate_stats_card()

        for table in self.config.tables:
            files[f"components/tables/{table.name}.tsx"] = self.comp_gen.generate_data_table(table)

        for form in self.config.forms:
            files[f"components/forms/{form.name}.tsx"] = self.comp_gen.generate_form(form)

        for chart in self.config.charts:
            files[f"components/charts/{chart.name}.tsx"] = self.comp_gen.generate_chart(chart)

        # Layout and pages
        files["app/admin/layout.tsx"] = self.page_gen.generate_layout(self.config)
        files["app/admin/page.tsx"] = self.page_gen.generate_dashboard_page(self.config)

        # API routes
        files["app/api/stats/route.ts"] = self.api_gen.generate_stats_route()

        for table in self.config.tables:
            files[f"app/api/{table.name.replace('_', '-')}/route.ts"] = self.api_gen.generate_table_route(table)

        for form in self.config.forms:
            files[f"app/api/{form.name.replace('_', '-')}/route.ts"] = self.api_gen.generate_form_route(form)

        # Workflow engine
        if self.config.workflows:
            files["lib/workflow-engine.ts"] = self.wf_gen.generate_workflow_engine()
            files["app/api/workflows/[id]/trigger/route.ts"] = self.wf_gen.generate_workflow_trigger_api()

        # Environment config
        env_lines = ["# Internal Tool Configuration", ""]
        for ds in self.config.datasources:
            env_lines.append(ds.to_env_config())
            env_lines.append("")
        files[".env.example"] = "\n".join(env_lines)

        return files

    def generate_package_json(self) -> str:
        return json.dumps({
            "name": self.config.name,
            "version": "1.0.0",
            "private": True,
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start",
                "lint": "next lint"
            },
            "dependencies": {
                "next": "^14.0.0",
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "@tanstack/react-query": "^5.0.0",
                "@tanstack/react-table": "^8.10.0",
                "react-hook-form": "^7.48.0",
                "zod": "^3.22.0",
                "@hookform/resolvers": "^3.3.0",
                "recharts": "^2.10.0",
                "lucide-react": "^0.294.0",
                "sonner": "^1.2.0",
                "class-variance-authority": "^0.7.0",
                "clsx": "^2.0.0",
                "tailwind-merge": "^2.0.0",
                "pg": "^8.11.0" if any(ds.type == DataSourceType.POSTGRESQL for ds in self.config.datasources) else None,
                "@supabase/supabase-js": "^2.38.0" if any(ds.type == DataSourceType.SUPABASE for ds in self.config.datasources) else None
            },
            "devDependencies": {
                "typescript": "^5.0.0",
                "@types/node": "^20.0.0",
                "@types/react": "^18.2.0",
                "@types/pg": "^8.10.0",
                "tailwindcss": "^3.3.0",
                "autoprefixer": "^10.4.0",
                "postcss": "^8.4.0"
            }
        }, indent=2)


# =============================================================================
# REPORTER
# =============================================================================

class RetoolBuilderReporter:
    """Generate ASCII dashboard for build status"""

    @staticmethod
    def generate_report(config: AppConfig, files: dict[str, str]) -> str:
        total_lines = sum(f.count('\n') + 1 for f in files.values())

        report = f'''
╔══════════════════════════════════════════════════════════════════╗
║                    RETOOL.BUILDER.EXE                            ║
║               Internal Tools Generator Report                     ║
╠══════════════════════════════════════════════════════════════════╣
║  App Name: {config.name:<52} ║
║  Description: {(config.description or "N/A"):<49} ║
╠══════════════════════════════════════════════════════════════════╣
║  DATA SOURCES                                                    ║
'''
        for ds in config.datasources:
            report += f"║    • {ds.name}: {ds.type.value:<45} ║\n"

        report += '''╠══════════════════════════════════════════════════════════════════╣
║  PAGES                                                           ║
'''
        for page in config.pages:
            report += f"║    • {page.title} ({page.path}){' ' * (50 - len(page.title) - len(page.path))}║\n"

        report += '''╠══════════════════════════════════════════════════════════════════╣
║  COMPONENTS                                                      ║
'''
        report += f"║    Tables: {len(config.tables):<54} ║\n"
        report += f"║    Forms: {len(config.forms):<55} ║\n"
        report += f"║    Charts: {len(config.charts):<54} ║\n"

        report += '''╠══════════════════════════════════════════════════════════════════╣
║  WORKFLOWS                                                       ║
'''
        if config.workflows:
            for wf in config.workflows:
                report += f"║    • {wf.name}: {wf.trigger.value} trigger{' ' * (40 - len(wf.name))}║\n"
        else:
            report += "║    No workflows configured                                       ║\n"

        report += f'''╠══════════════════════════════════════════════════════════════════╣
║  GENERATED OUTPUT                                                ║
║    Total Files: {len(files):<50} ║
║    Total Lines: {total_lines:<50} ║
╠══════════════════════════════════════════════════════════════════╣
║  FILES GENERATED                                                 ║
'''
        for filepath in sorted(files.keys())[:15]:
            lines = files[filepath].count('\n') + 1
            report += f"║    {filepath:<45} ({lines:>4} lines) ║\n"

        if len(files) > 15:
            report += f"║    ... and {len(files) - 15} more files{' ' * 40}║\n"

        report += '''╠══════════════════════════════════════════════════════════════════╣
║  NEXT STEPS                                                      ║
║    1. npm install                                                ║
║    2. Configure .env with your credentials                       ║
║    3. npm run dev                                                ║
║    4. Open http://localhost:3000/admin                           ║
╚══════════════════════════════════════════════════════════════════╝
'''
        return report


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="RETOOL.BUILDER.EXE - Internal Tools Generator"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Dashboard command
    dash_parser = subparsers.add_parser("dashboard", help="Generate admin dashboard")
    dash_parser.add_argument("--name", required=True, help="Project name")
    dash_parser.add_argument("--datasource", choices=["postgres", "supabase", "mysql"],
                           default="supabase", help="Primary data source")
    dash_parser.add_argument("--output", "-o", default="./admin-app", help="Output directory")

    # CRUD command
    crud_parser = subparsers.add_parser("crud", help="Generate CRUD interface")
    crud_parser.add_argument("--resource", required=True, help="Resource name (e.g., users)")
    crud_parser.add_argument("--datasource", default="supabase", help="Data source")
    crud_parser.add_argument("--output", "-o", default="./", help="Output directory")

    # Workflow command
    wf_parser = subparsers.add_parser("workflow", help="Generate workflow automation")
    wf_parser.add_argument("--trigger", choices=["manual", "schedule", "webhook", "database"],
                          default="manual", help="Trigger type")
    wf_parser.add_argument("--actions", help="Comma-separated actions")
    wf_parser.add_argument("--output", "-o", default="./", help="Output directory")

    # Form command
    form_parser = subparsers.add_parser("form", help="Generate form from schema")
    form_parser.add_argument("--schema", required=True, help="JSON schema file")
    form_parser.add_argument("--output", choices=["react", "vue", "svelte"], default="react")

    # Preset command
    preset_parser = subparsers.add_parser("preset", help="Use a preset configuration")
    preset_parser.add_argument("--type", choices=["ecommerce", "saas", "crm", "cms"],
                              required=True, help="Preset type")
    preset_parser.add_argument("--output", "-o", default="./admin-app", help="Output directory")

    args = parser.parse_args()

    if args.command == "dashboard":
        config = AppConfig.admin_dashboard(args.name, args.datasource)
    elif args.command == "preset":
        if args.type == "ecommerce":
            config = AppConfig.ecommerce_admin()
        else:
            config = AppConfig.admin_dashboard(args.type)
    else:
        print("Use: retool_builder.py dashboard --name <name> --datasource <type>")
        print("     retool_builder.py preset --type ecommerce")
        return

    engine = RetoolBuilderEngine(config)
    files = engine.generate_all()
    files["package.json"] = engine.generate_package_json()

    report = RetoolBuilderReporter.generate_report(config, files)
    print(report)

    # Output file list
    print("\nGenerated files:")
    for filepath in sorted(files.keys()):
        print(f"  {filepath}")


if __name__ == "__main__":
    main()
```

---

## Usage Examples

### Generate E-commerce Admin
```bash
python retool_builder.py preset --type ecommerce --output ./ecommerce-admin
```

### Generate SaaS Dashboard
```bash
python retool_builder.py dashboard --name "acme_saas" --datasource supabase
```

### Create Users CRUD
```bash
python retool_builder.py crud --resource users --datasource postgres
```

### Setup Workflow Automation
```bash
python retool_builder.py workflow --trigger webhook --actions query,transform,slack
```

---

## Template Presets

| Preset | Tables | Forms | Charts | Workflows |
|--------|--------|-------|--------|-----------|
| E-commerce | Orders, Users, Products | User, Product | Revenue, Growth | New user, Daily report |
| SaaS | Users, Subscriptions | User, Settings | MRR, Churn | Onboarding, Billing |
| CRM | Contacts, Deals, Tasks | Contact, Deal | Pipeline, Won | Lead scoring |
| CMS | Posts, Pages, Media | Post, Page | Traffic, Engagement | Publish |

---

## Component Library

### Data Display
- **Table** - Sortable, filterable, paginated data tables
- **Chart** - Bar, line, area, pie charts with Recharts
- **Stats Card** - KPI cards with change indicators

### Input
- **Form** - React Hook Form with validation
- **Select** - Single and multi-select dropdowns
- **Date Picker** - Date and datetime inputs
- **File Upload** - Drag-and-drop file uploads

### Containers
- **Modal** - Dialog overlays for forms
- **Tabs** - Tabbed content sections
- **Card** - Content containers

### Actions
- **Button** - Primary, secondary, destructive buttons
- **Dropdown Menu** - Context menus and actions

---

## Tags
`internal-tools` `admin-panel` `dashboard` `crud` `low-code` `react` `nextjs` `retool-alternative`
