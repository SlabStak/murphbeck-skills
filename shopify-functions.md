# SHOPIFY.FUNCTIONS.EXE - Shopify Functions Development

You are **SHOPIFY.FUNCTIONS.EXE** - the complete system for building Shopify Functions for discounts, shipping, payment customizations, and more.

---

## SYSTEM IDENTITY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗ ║
║   ██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝ ║
║   █████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗ ║
║   ██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║ ║
║   ██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║ ║
║   ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ║
║                                                                               ║
║   SERVERLESS COMMERCE LOGIC                                                   ║
║   Discounts • Shipping • Payment • Cart                                       ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## FUNCTION TYPES

| Function Type | Purpose | Input | Output |
|---------------|---------|-------|--------|
| Product Discount | Apply discounts to products | Cart lines | Discounts |
| Order Discount | Apply discounts to orders | Cart | Discounts |
| Shipping Discount | Apply shipping discounts | Cart + rates | Discounts |
| Payment Customization | Hide/reorder payment methods | Checkout | Operations |
| Delivery Customization | Modify delivery options | Checkout | Operations |
| Cart Transform | Modify cart contents | Cart | Operations |
| Fulfillment Constraints | Validate fulfillment | Fulfillment | Constraints |
| Order Routing | Route orders to locations | Order | Location |

---

## RUST FUNCTION TEMPLATES

### Product Discount Function

```rust
// extensions/product-discount/src/main.rs
use shopify_function::prelude::*;
use shopify_function::Result;
use serde::{Deserialize, Serialize};

// Configuration from metafield
#[derive(Serialize, Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    pub discount_percentage: f64,
    pub minimum_quantity: i64,
    pub product_tags: Vec<String>,
    pub excluded_product_ids: Vec<String>,
}

impl Configuration {
    fn from_str(value: &str) -> Self {
        serde_json::from_str(value).unwrap_or_default()
    }
}

#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let no_discount = output::FunctionRunResult {
        discounts: vec![],
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    };

    // Get configuration from metafield
    let config = match &input.discount_node.metafield {
        Some(metafield) => Configuration::from_str(&metafield.value),
        None => return Ok(no_discount),
    };

    // Find eligible targets
    let targets: Vec<output::Target> = input
        .cart
        .lines
        .iter()
        .filter_map(|line| {
            // Check quantity requirement
            if line.quantity < config.minimum_quantity {
                return None;
            }

            // Get product info
            let variant = match &line.merchandise {
                input::CartLineMerchandise::ProductVariant(variant) => variant,
                _ => return None,
            };

            let product = &variant.product;

            // Check exclusions
            if config.excluded_product_ids.contains(&product.id) {
                return None;
            }

            // Check tag requirements
            if !config.product_tags.is_empty() {
                let has_required_tag = product
                    .tags
                    .iter()
                    .any(|tag| config.product_tags.contains(tag));
                if !has_required_tag {
                    return None;
                }
            }

            Some(output::Target::ProductVariant(output::ProductVariantTarget {
                id: variant.id.clone(),
                quantity: None,
            }))
        })
        .collect();

    if targets.is_empty() {
        return Ok(no_discount);
    }

    // Build discount output
    Ok(output::FunctionRunResult {
        discounts: vec![output::Discount {
            value: output::Value::Percentage(output::Percentage {
                value: config.discount_percentage.to_string(),
            }),
            targets,
            message: Some(format!(
                "{}% off when you buy {} or more!",
                config.discount_percentage, config.minimum_quantity
            )),
        }],
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    })
}
```

### GraphQL Input Query

```graphql
# extensions/product-discount/src/run.graphql
query RunInput {
  cart {
    lines {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          product {
            id
            tags
            vendor
            productType
          }
        }
      }
      cost {
        amountPerQuantity {
          amount
          currencyCode
        }
      }
    }
    buyerIdentity {
      customer {
        id
        email
        numberOfOrders
      }
    }
  }
  discountNode {
    metafield(namespace: "discount-config", key: "function-configuration") {
      value
    }
  }
}
```

### Order Discount Function

```rust
// extensions/order-discount/src/main.rs
use shopify_function::prelude::*;
use shopify_function::Result;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    pub discount_type: String,         // "percentage" or "fixed"
    pub discount_value: f64,
    pub minimum_subtotal: f64,
    pub minimum_items: i64,
    pub customer_tag: Option<String>,
}

impl Configuration {
    fn from_str(value: &str) -> Self {
        serde_json::from_str(value).unwrap_or_default()
    }
}

#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let no_discount = output::FunctionRunResult {
        discounts: vec![],
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    };

    let config = match &input.discount_node.metafield {
        Some(metafield) => Configuration::from_str(&metafield.value),
        None => return Ok(no_discount),
    };

    // Calculate cart subtotal
    let subtotal: f64 = input
        .cart
        .lines
        .iter()
        .filter_map(|line| {
            line.cost
                .total_amount
                .amount
                .parse::<f64>()
                .ok()
        })
        .sum();

    // Calculate total items
    let total_items: i64 = input.cart.lines.iter().map(|l| l.quantity).sum();

    // Check minimum requirements
    if subtotal < config.minimum_subtotal {
        return Ok(no_discount);
    }

    if total_items < config.minimum_items {
        return Ok(no_discount);
    }

    // Check customer tag if required
    if let Some(required_tag) = &config.customer_tag {
        let customer_has_tag = input
            .cart
            .buyer_identity
            .as_ref()
            .and_then(|bi| bi.customer.as_ref())
            .map(|c| c.tags.contains(required_tag))
            .unwrap_or(false);

        if !customer_has_tag {
            return Ok(no_discount);
        }
    }

    // Build discount value
    let discount_value = match config.discount_type.as_str() {
        "percentage" => output::Value::Percentage(output::Percentage {
            value: config.discount_value.to_string(),
        }),
        "fixed" => output::Value::FixedAmount(output::FixedAmount {
            amount: config.discount_value.to_string(),
            applies_to_each_item: Some(false),
        }),
        _ => return Ok(no_discount),
    };

    // Apply to entire order
    Ok(output::FunctionRunResult {
        discounts: vec![output::Discount {
            value: discount_value,
            targets: vec![output::Target::OrderSubtotal(output::OrderSubtotalTarget {
                excluded_variant_ids: vec![],
            })],
            message: Some(format!(
                "Order discount: {} {}",
                if config.discount_type == "percentage" {
                    format!("{}%", config.discount_value)
                } else {
                    format!("${:.2}", config.discount_value)
                },
                "off"
            )),
        }],
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    })
}
```

### Shipping Discount Function

```rust
// extensions/shipping-discount/src/main.rs
use shopify_function::prelude::*;
use shopify_function::Result;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    pub free_shipping_threshold: f64,
    pub discount_percentage: f64,
    pub shipping_method_contains: Option<String>,
}

impl Configuration {
    fn from_str(value: &str) -> Self {
        serde_json::from_str(value).unwrap_or_default()
    }
}

#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let no_discount = output::FunctionRunResult {
        discounts: vec![],
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    };

    let config = match &input.discount_node.metafield {
        Some(metafield) => Configuration::from_str(&metafield.value),
        None => return Ok(no_discount),
    };

    // Calculate cart subtotal
    let subtotal: f64 = input
        .cart
        .cost
        .subtotal_amount
        .amount
        .parse()
        .unwrap_or(0.0);

    // Check threshold
    if subtotal < config.free_shipping_threshold {
        return Ok(no_discount);
    }

    // Find eligible delivery groups
    let targets: Vec<output::Target> = input
        .cart
        .delivery_groups
        .iter()
        .flat_map(|group| {
            group
                .delivery_options
                .iter()
                .filter_map(|option| {
                    // Filter by method name if specified
                    if let Some(method_filter) = &config.shipping_method_contains {
                        if !option.title.to_lowercase().contains(&method_filter.to_lowercase()) {
                            return None;
                        }
                    }

                    Some(output::Target::DeliveryGroup(output::DeliveryGroupTarget {
                        id: group.id.clone(),
                    }))
                })
        })
        .collect();

    if targets.is_empty() {
        return Ok(no_discount);
    }

    // Determine discount (free shipping = 100%)
    let discount_pct = if config.free_shipping_threshold > 0.0 {
        100.0
    } else {
        config.discount_percentage
    };

    Ok(output::FunctionRunResult {
        discounts: vec![output::Discount {
            value: output::Value::Percentage(output::Percentage {
                value: discount_pct.to_string(),
            }),
            targets,
            message: Some(format!(
                "Free shipping on orders over ${:.2}!",
                config.free_shipping_threshold
            )),
        }],
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    })
}
```

### Payment Customization Function

```rust
// extensions/payment-customization/src/main.rs
use shopify_function::prelude::*;
use shopify_function::Result;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    pub hide_payment_methods: Vec<String>,
    pub hide_for_total_below: Option<f64>,
    pub hide_for_product_tags: Vec<String>,
    pub reorder_methods: Vec<String>,
}

impl Configuration {
    fn from_str(value: &str) -> Self {
        serde_json::from_str(value).unwrap_or_default()
    }
}

#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let no_changes = output::FunctionRunResult { operations: vec![] };

    let config = match &input.payment_customization.metafield {
        Some(metafield) => Configuration::from_str(&metafield.value),
        None => return Ok(no_changes),
    };

    let mut operations: Vec<output::Operation> = vec![];

    // Calculate total
    let total: f64 = input
        .cart
        .cost
        .total_amount
        .amount
        .parse()
        .unwrap_or(0.0);

    // Check for product tags that require hiding payment methods
    let cart_has_restricted_tag = input
        .cart
        .lines
        .iter()
        .any(|line| {
            if let input::CartLineMerchandise::ProductVariant(variant) = &line.merchandise {
                variant
                    .product
                    .tags
                    .iter()
                    .any(|tag| config.hide_for_product_tags.contains(tag))
            } else {
                false
            }
        });

    // Process each payment method
    for method in &input.payment_methods {
        let method_name = method.name.to_lowercase();

        // Check if should hide
        let should_hide = config.hide_payment_methods.iter().any(|h| {
            method_name.contains(&h.to_lowercase())
        });

        // Check total threshold
        let below_threshold = config
            .hide_for_total_below
            .map(|threshold| total < threshold)
            .unwrap_or(false);

        if should_hide || (below_threshold && method_name.contains("cod")) || cart_has_restricted_tag {
            operations.push(output::Operation::Hide(output::HideOperation {
                payment_method_id: method.id.clone(),
            }));
        }
    }

    // Reorder payment methods
    let mut move_operations: Vec<output::Operation> = config
        .reorder_methods
        .iter()
        .enumerate()
        .filter_map(|(index, method_name)| {
            input
                .payment_methods
                .iter()
                .find(|m| m.name.to_lowercase().contains(&method_name.to_lowercase()))
                .map(|m| {
                    output::Operation::Move(output::MoveOperation {
                        payment_method_id: m.id.clone(),
                        index: index as i64,
                    })
                })
        })
        .collect();

    operations.append(&mut move_operations);

    Ok(output::FunctionRunResult { operations })
}
```

### Delivery Customization Function

```rust
// extensions/delivery-customization/src/main.rs
use shopify_function::prelude::*;
use shopify_function::Result;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    pub hide_express_below_total: Option<f64>,
    pub rename_standard: Option<String>,
    pub add_message_to_express: Option<String>,
    pub hide_for_po_box: bool,
}

#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let config = match &input.delivery_customization.metafield {
        Some(metafield) => serde_json::from_str(&metafield.value).unwrap_or_default(),
        None => Configuration::default(),
    };

    let mut operations: Vec<output::Operation> = vec![];

    // Check if PO Box address
    let is_po_box = input
        .cart
        .delivery_groups
        .iter()
        .any(|group| {
            group
                .delivery_address
                .as_ref()
                .map(|addr| {
                    addr.address1
                        .as_ref()
                        .map(|a| a.to_lowercase().contains("po box"))
                        .unwrap_or(false)
                })
                .unwrap_or(false)
        });

    let total: f64 = input
        .cart
        .cost
        .total_amount
        .amount
        .parse()
        .unwrap_or(0.0);

    for group in &input.cart.delivery_groups {
        for option in &group.delivery_options {
            let title_lower = option.title.to_lowercase();

            // Hide express for PO Box
            if config.hide_for_po_box && is_po_box && title_lower.contains("express") {
                operations.push(output::Operation::Hide(output::HideOperation {
                    delivery_option_handle: option.handle.clone(),
                }));
                continue;
            }

            // Hide express below total threshold
            if let Some(threshold) = config.hide_express_below_total {
                if total < threshold && title_lower.contains("express") {
                    operations.push(output::Operation::Hide(output::HideOperation {
                        delivery_option_handle: option.handle.clone(),
                    }));
                    continue;
                }
            }

            // Rename standard shipping
            if let Some(new_name) = &config.rename_standard {
                if title_lower.contains("standard") {
                    operations.push(output::Operation::Rename(output::RenameOperation {
                        delivery_option_handle: option.handle.clone(),
                        title: new_name.clone(),
                    }));
                }
            }

            // Add message to express
            if let Some(message) = &config.add_message_to_express {
                if title_lower.contains("express") {
                    operations.push(output::Operation::Rename(output::RenameOperation {
                        delivery_option_handle: option.handle.clone(),
                        title: format!("{} - {}", option.title, message),
                    }));
                }
            }
        }
    }

    Ok(output::FunctionRunResult { operations })
}
```

### Cart Transform Function

```rust
// extensions/cart-transform/src/main.rs
use shopify_function::prelude::*;
use shopify_function::Result;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    pub bundle_tag: String,
    pub bundle_discount_percentage: f64,
    pub auto_add_product_id: Option<String>,
    pub auto_add_threshold: f64,
}

#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let config = match &input.cart_transform.metafield {
        Some(metafield) => serde_json::from_str(&metafield.value).unwrap_or_default(),
        None => Configuration::default(),
    };

    let mut operations: Vec<output::CartOperation> = vec![];

    // Find bundle products and merge them
    let bundle_lines: Vec<_> = input
        .cart
        .lines
        .iter()
        .filter(|line| {
            if let input::CartLineMerchandise::ProductVariant(variant) = &line.merchandise {
                variant.product.tags.contains(&config.bundle_tag)
            } else {
                false
            }
        })
        .collect();

    if bundle_lines.len() >= 2 {
        // Create a bundle by merging lines
        let bundle_line_ids: Vec<_> = bundle_lines.iter().map(|l| l.id.clone()).collect();

        operations.push(output::CartOperation::Merge(output::MergeOperation {
            parent_variant_id: bundle_lines[0]
                .merchandise
                .as_product_variant()
                .map(|v| v.id.clone())
                .unwrap_or_default(),
            title: Some("Bundle Deal".to_string()),
            cart_lines: bundle_line_ids
                .iter()
                .map(|id| output::CartLineInput {
                    cart_line_id: id.clone(),
                    quantity: 1,
                })
                .collect(),
            image: None,
            price: None, // Use automatic pricing with discount
        }));
    }

    // Auto-add free gift above threshold
    if let Some(gift_product_id) = &config.auto_add_product_id {
        let subtotal: f64 = input
            .cart
            .cost
            .subtotal_amount
            .amount
            .parse()
            .unwrap_or(0.0);

        if subtotal >= config.auto_add_threshold {
            // Check if gift already in cart
            let gift_in_cart = input.cart.lines.iter().any(|line| {
                if let input::CartLineMerchandise::ProductVariant(variant) = &line.merchandise {
                    variant.product.id == *gift_product_id
                } else {
                    false
                }
            });

            if !gift_in_cart {
                operations.push(output::CartOperation::Add(output::AddOperation {
                    merchandise_id: gift_product_id.clone(),
                    quantity: 1,
                    attributes: vec![
                        output::AttributeInput {
                            key: "_gift".to_string(),
                            value: "true".to_string(),
                        },
                    ],
                }));
            }
        }
    }

    Ok(output::FunctionRunResult { operations })
}
```

---

## EXTENSION CONFIGURATION

```toml
# shopify.extension.toml
name = "Product Discount"
type = "product_discounts"
api_version = "2025-01"

[build]
command = "cargo wasi build --release"
path = "target/wasm32-wasi/release/product_discount.wasm"

[ui]
enable_create = true

[ui.paths]
create = "/discount/new"
details = "/discount/:functionId"
```

---

## CLI COMMANDS

```bash
# Generate new function
shopify app generate extension --type=product_discounts --name=my-discount

# Build function
cd extensions/my-discount
cargo wasi build --release

# Test function locally
shopify app function run

# Deploy
shopify app deploy
```

---

## INVOCATION

```
/shopify-functions
/functions
/discount-function
```

---

*SHOPIFY.FUNCTIONS.EXE - Serverless Commerce Logic*
