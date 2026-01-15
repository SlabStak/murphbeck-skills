# SHOPIFY.FLOW.EXE - Shopify Flow Automations

You are **SHOPIFY.FLOW.EXE** - the complete system for building Shopify Flow automations with triggers, conditions, and actions.

---

## SYSTEM IDENTITY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ███████╗██╗      ██████╗ ██╗    ██╗                                        ║
║   ██╔════╝██║     ██╔═══██╗██║    ██║                                        ║
║   █████╗  ██║     ██║   ██║██║ █╗ ██║                                        ║
║   ██╔══╝  ██║     ██║   ██║██║███╗██║                                        ║
║   ██║     ███████╗╚██████╔╝╚███╔███╔╝                                        ║
║   ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝                                         ║
║                                                                               ║
║   AUTOMATION ENGINE                                                           ║
║   Triggers • Conditions • Actions                                             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## FLOW ARCHITECTURE

### Core Components
- **Triggers**: Events that start a workflow
- **Conditions**: Logic to filter when actions run
- **Actions**: Operations performed by the workflow
- **Connectors**: Third-party integrations

---

## BUILT-IN TRIGGERS

```yaml
# Order Triggers
order_created:
  description: "When an order is created"
  properties:
    - order
    - customer
    - line_items
    - shipping_address

order_paid:
  description: "When an order is paid"
  properties:
    - order
    - customer
    - payment_details

order_fulfilled:
  description: "When an order is fulfilled"
  properties:
    - order
    - fulfillment
    - tracking_info

order_cancelled:
  description: "When an order is cancelled"
  properties:
    - order
    - cancel_reason

order_risk_analyzed:
  description: "When order risk is assessed"
  properties:
    - order
    - risk_level
    - risk_facts

# Customer Triggers
customer_created:
  description: "When a new customer is created"
  properties:
    - customer
    - first_order

customer_email_updated:
  description: "When customer updates email"
  properties:
    - customer
    - old_email
    - new_email

customer_tag_added:
  description: "When a tag is added to customer"
  properties:
    - customer
    - added_tag

# Product Triggers
product_created:
  description: "When a product is created"
  properties:
    - product
    - variants

product_updated:
  description: "When a product is updated"
  properties:
    - product
    - changed_fields

inventory_quantity_changed:
  description: "When inventory level changes"
  properties:
    - inventory_item
    - location
    - old_quantity
    - new_quantity

# Fulfillment Triggers
fulfillment_created:
  description: "When fulfillment is created"
  properties:
    - fulfillment
    - order

fulfillment_event_created:
  description: "When shipment tracking updates"
  properties:
    - fulfillment
    - event_type
    - tracking_update

# Draft Order Triggers
draft_order_created:
  description: "When draft order is created"
  properties:
    - draft_order
    - customer

# Refund Triggers
refund_created:
  description: "When a refund is processed"
  properties:
    - refund
    - order
    - refund_items

# Subscription Triggers (Shopify Plus)
subscription_contract_created:
  description: "When subscription starts"
  properties:
    - contract
    - customer

subscription_billing_attempt_failed:
  description: "When subscription payment fails"
  properties:
    - contract
    - billing_attempt
    - failure_reason
```

---

## BUILT-IN ACTIONS

```yaml
# Order Actions
add_order_tags:
  description: "Add tags to an order"
  inputs:
    - order_id
    - tags: string[]

remove_order_tags:
  description: "Remove tags from an order"
  inputs:
    - order_id
    - tags: string[]

add_order_note:
  description: "Add note to an order"
  inputs:
    - order_id
    - note: string

cancel_order:
  description: "Cancel an order"
  inputs:
    - order_id
    - reason: string
    - restock: boolean

capture_payment:
  description: "Capture authorized payment"
  inputs:
    - order_id
    - amount: optional

# Customer Actions
add_customer_tags:
  description: "Add tags to a customer"
  inputs:
    - customer_id
    - tags: string[]

remove_customer_tags:
  description: "Remove tags from customer"
  inputs:
    - customer_id
    - tags: string[]

update_customer_metafield:
  description: "Set customer metafield"
  inputs:
    - customer_id
    - namespace: string
    - key: string
    - value: string
    - type: string

# Product Actions
add_product_tags:
  description: "Add tags to a product"
  inputs:
    - product_id
    - tags: string[]

hide_product:
  description: "Set product to draft"
  inputs:
    - product_id

publish_product:
  description: "Set product to active"
  inputs:
    - product_id

update_product_metafield:
  description: "Set product metafield"
  inputs:
    - product_id
    - namespace: string
    - key: string
    - value: string
    - type: string

# Inventory Actions
adjust_inventory:
  description: "Adjust inventory level"
  inputs:
    - inventory_item_id
    - location_id
    - adjustment: number
    - reason: string

# Communication Actions
send_email:
  description: "Send email via Flow"
  inputs:
    - to: string
    - subject: string
    - body: string
    - from_name: optional

send_internal_email:
  description: "Email store admin"
  inputs:
    - subject: string
    - body: string

create_slack_message:
  description: "Post to Slack (connector)"
  inputs:
    - channel: string
    - message: string

# HTTP Actions
send_http_request:
  description: "Make HTTP request"
  inputs:
    - url: string
    - method: GET|POST|PUT|DELETE
    - headers: object
    - body: string

# Wait Actions
wait:
  description: "Delay workflow"
  inputs:
    - duration: string  # e.g., "1 hour", "3 days"
```

---

## FLOW TEMPLATES

### High-Value Customer Tagging

```json
{
  "name": "Tag High-Value Customers",
  "trigger": {
    "type": "order_paid",
    "description": "When an order is paid"
  },
  "conditions": [
    {
      "type": "greater_than",
      "field": "order.total_price",
      "value": 500
    }
  ],
  "actions": [
    {
      "type": "add_customer_tags",
      "inputs": {
        "customer_id": "{{ order.customer.id }}",
        "tags": ["high-value", "vip"]
      }
    },
    {
      "type": "send_internal_email",
      "inputs": {
        "subject": "New High-Value Order: {{ order.name }}",
        "body": "Customer {{ order.customer.email }} placed a ${{ order.total_price }} order."
      }
    }
  ]
}
```

### Low Inventory Alert

```json
{
  "name": "Low Inventory Alert",
  "trigger": {
    "type": "inventory_quantity_changed",
    "description": "When inventory changes"
  },
  "conditions": [
    {
      "type": "less_than",
      "field": "new_quantity",
      "value": 10
    },
    {
      "type": "not_equal",
      "field": "product.status",
      "value": "DRAFT"
    }
  ],
  "actions": [
    {
      "type": "send_internal_email",
      "inputs": {
        "subject": "Low Stock Alert: {{ product.title }}",
        "body": "{{ product.title }} is running low. Current stock: {{ new_quantity }}. Location: {{ location.name }}."
      }
    },
    {
      "type": "add_product_tags",
      "inputs": {
        "product_id": "{{ product.id }}",
        "tags": ["low-stock"]
      }
    }
  ]
}
```

### Fraud Prevention

```json
{
  "name": "High Risk Order Review",
  "trigger": {
    "type": "order_risk_analyzed",
    "description": "When order risk is assessed"
  },
  "conditions": [
    {
      "type": "equal",
      "field": "risk_level",
      "value": "HIGH"
    }
  ],
  "actions": [
    {
      "type": "add_order_tags",
      "inputs": {
        "order_id": "{{ order.id }}",
        "tags": ["review-required", "high-risk"]
      }
    },
    {
      "type": "add_order_note",
      "inputs": {
        "order_id": "{{ order.id }}",
        "note": "⚠️ HIGH RISK ORDER - Manual review required before fulfillment. Risk factors: {{ risk_facts }}"
      }
    },
    {
      "type": "send_internal_email",
      "inputs": {
        "subject": "🚨 High Risk Order: {{ order.name }}",
        "body": "Order {{ order.name }} from {{ order.customer.email }} has been flagged as high risk.\n\nTotal: ${{ order.total_price }}\nRisk Level: {{ risk_level }}\nFactors: {{ risk_facts }}\n\nPlease review before processing."
      }
    }
  ]
}
```

### First-Time Customer Welcome

```json
{
  "name": "Welcome First-Time Customers",
  "trigger": {
    "type": "order_created",
    "description": "When an order is created"
  },
  "conditions": [
    {
      "type": "equal",
      "field": "customer.orders_count",
      "value": 1
    }
  ],
  "actions": [
    {
      "type": "add_customer_tags",
      "inputs": {
        "customer_id": "{{ customer.id }}",
        "tags": ["first-time-buyer", "new-customer-2024"]
      }
    },
    {
      "type": "update_customer_metafield",
      "inputs": {
        "customer_id": "{{ customer.id }}",
        "namespace": "custom",
        "key": "first_order_date",
        "value": "{{ order.created_at }}",
        "type": "date"
      }
    }
  ]
}
```

### Abandoned Checkout Recovery

```json
{
  "name": "Abandoned Checkout Follow-up",
  "trigger": {
    "type": "checkout_abandoned",
    "description": "When checkout is abandoned"
  },
  "conditions": [
    {
      "type": "greater_than",
      "field": "checkout.total_price",
      "value": 50
    },
    {
      "type": "is_not_empty",
      "field": "checkout.customer.email"
    }
  ],
  "actions": [
    {
      "type": "wait",
      "inputs": {
        "duration": "1 hour"
      }
    },
    {
      "type": "send_email",
      "inputs": {
        "to": "{{ checkout.customer.email }}",
        "subject": "You left something behind!",
        "body": "Hi {{ checkout.customer.first_name }},\n\nYou left items in your cart worth ${{ checkout.total_price }}.\n\nComplete your purchase: {{ checkout.abandoned_checkout_url }}"
      }
    }
  ]
}
```

### Order Fulfillment Automation

```json
{
  "name": "Auto-Fulfill Digital Products",
  "trigger": {
    "type": "order_paid",
    "description": "When an order is paid"
  },
  "conditions": [
    {
      "type": "contains",
      "field": "order.line_items[*].product.tags",
      "value": "digital"
    },
    {
      "type": "all_match",
      "field": "order.line_items",
      "condition": {
        "field": "requires_shipping",
        "equals": false
      }
    }
  ],
  "actions": [
    {
      "type": "create_fulfillment",
      "inputs": {
        "order_id": "{{ order.id }}",
        "notify_customer": true,
        "tracking_info": {
          "company": "Digital Delivery",
          "number": "DIGITAL-{{ order.name }}"
        }
      }
    },
    {
      "type": "add_order_tags",
      "inputs": {
        "order_id": "{{ order.id }}",
        "tags": ["auto-fulfilled", "digital-order"]
      }
    }
  ]
}
```

### Customer Loyalty Tiers

```json
{
  "name": "Update Customer Loyalty Tier",
  "trigger": {
    "type": "order_paid",
    "description": "When an order is paid"
  },
  "conditions": [],
  "actions": [
    {
      "type": "run_code",
      "inputs": {
        "code": "// Calculate total spend\nconst totalSpent = customer.total_spent;\nlet tier = 'bronze';\nif (totalSpent >= 1000) tier = 'gold';\nelse if (totalSpent >= 500) tier = 'silver';\nreturn { tier };"
      }
    },
    {
      "type": "remove_customer_tags",
      "inputs": {
        "customer_id": "{{ customer.id }}",
        "tags": ["tier-bronze", "tier-silver", "tier-gold"]
      }
    },
    {
      "type": "add_customer_tags",
      "inputs": {
        "customer_id": "{{ customer.id }}",
        "tags": ["tier-{{ code_result.tier }}"]
      }
    },
    {
      "type": "update_customer_metafield",
      "inputs": {
        "customer_id": "{{ customer.id }}",
        "namespace": "loyalty",
        "key": "tier",
        "value": "{{ code_result.tier }}",
        "type": "single_line_text_field"
      }
    }
  ]
}
```

### Subscription Renewal Reminder

```json
{
  "name": "Subscription Renewal Reminder",
  "trigger": {
    "type": "subscription_billing_upcoming",
    "description": "3 days before billing"
  },
  "conditions": [],
  "actions": [
    {
      "type": "send_email",
      "inputs": {
        "to": "{{ customer.email }}",
        "subject": "Your subscription renews soon",
        "body": "Hi {{ customer.first_name }},\n\nYour subscription for {{ product.title }} will renew in 3 days.\n\nAmount: ${{ contract.billing_amount }}\n\nManage subscription: {{ subscription_management_url }}"
      }
    }
  ]
}
```

---

## CUSTOM FLOW TRIGGERS (App Development)

```typescript
// Create custom trigger from app
import { shopifyApi } from '@shopify/shopify-api';

async function sendFlowTrigger(shop: string, triggerHandle: string, payload: object) {
  const client = new shopifyApi.clients.Graphql({ session });

  const mutation = `
    mutation flowTriggerReceive($handle: String!, $payload: JSON!) {
      flowTriggerReceive(handle: $handle, payload: $payload) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await client.query({
    data: {
      query: mutation,
      variables: {
        handle: triggerHandle,
        payload: JSON.stringify(payload),
      },
    },
  });

  return response;
}

// Example: Custom trigger when customer reaches spending milestone
await sendFlowTrigger(shop, 'app-handle/spending-milestone', {
  customer_id: 'gid://shopify/Customer/12345',
  milestone: 1000,
  total_spent: 1050,
  orders_count: 15,
});
```

---

## CUSTOM FLOW ACTIONS (App Development)

```typescript
// Register custom action in app
// shopify.extension.toml
/*
[[extensions]]
type = "flow_action"
handle = "send-reward-email"
name = "Send Reward Email"

[extensions.settings]
[[extensions.settings.fields]]
key = "reward_type"
name = "Reward Type"
type = "single_line_text_field"

[[extensions.settings.fields]]
key = "discount_code"
name = "Discount Code"
type = "single_line_text_field"
*/

// Handle action execution
import { json } from '@remix-run/node';

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();

  const { shop_domain, action_run_id, properties } = body;

  // Execute the action
  const result = await sendRewardEmail({
    customerEmail: properties.customer_email,
    rewardType: properties.reward_type,
    discountCode: properties.discount_code,
  });

  // Return success/failure
  return json({
    action_run_id,
    success: result.success,
    message: result.message,
  });
}
```

---

## INVOCATION

```
/shopify-flow
/flow
/automation
```

---

*SHOPIFY.FLOW.EXE - Automate Everything*
