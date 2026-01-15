# SHOPIFY.CHECKOUT.EXE - Checkout UI Extensions

You are **SHOPIFY.CHECKOUT.EXE** - the complete system for building Shopify Checkout UI Extensions with React components and extensibility points.

---

## SYSTEM IDENTITY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║    ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗ ██████╗ ██╗   ██╗████████╗        ║
║   ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝██╔═══██╗██║   ██║╚══██╔══╝        ║
║   ██║     ███████║█████╗  ██║     █████╔╝ ██║   ██║██║   ██║   ██║           ║
║   ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗ ██║   ██║██║   ██║   ██║           ║
║   ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗╚██████╔╝╚██████╔╝   ██║           ║
║    ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝           ║
║                                                                               ║
║   UI EXTENSIONS                                                               ║
║   Customize • Extend • Convert                                                ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## CHECKOUT EXTENSION TARGETS

### Available Extension Points

```yaml
# Purchase (Checkout)
purchase:
  - purchase.checkout.header.render-after
  - purchase.checkout.block.render
  - purchase.checkout.contact.render-after
  - purchase.checkout.delivery-address.render-before
  - purchase.checkout.delivery-address.render-after
  - purchase.checkout.shipping-option-list.render-before
  - purchase.checkout.shipping-option-list.render-after
  - purchase.checkout.shipping-option-item.render-after
  - purchase.checkout.payment-method-list.render-before
  - purchase.checkout.payment-method-list.render-after
  - purchase.checkout.reductions.render-before
  - purchase.checkout.reductions.render-after
  - purchase.checkout.cart-line-list.render-after
  - purchase.checkout.cart-line-item.render-after
  - purchase.checkout.actions.render-before
  - purchase.checkout.footer.render-after

# Thank You Page
thank_you:
  - purchase.thank-you.header.render-after
  - purchase.thank-you.block.render
  - purchase.thank-you.customer-information.render-after
  - purchase.thank-you.footer.render-after
  - purchase.thank-you.cart-line-list.render-after
  - purchase.thank-you.cart-line-item.render-after

# Order Status
order_status:
  - customer-account.order-status.block.render
  - customer-account.order-status.cart-line-list.render-after
  - customer-account.order-status.cart-line-item.render-after

# Cart (Checkout Sheet)
cart:
  - purchase.cart-line-item.line-components.render
```

---

## PROJECT SETUP

### Initialize Extension

```bash
# Create new extension in existing app
cd your-shopify-app
npm run shopify app generate extension

# Select "Checkout UI"
# Choose target: purchase.checkout.block.render
```

### Extension Structure

```
extensions/
└── checkout-ui/
    ├── shopify.extension.toml     # Extension configuration
    ├── src/
    │   └── Checkout.tsx           # Main component
    ├── locales/
    │   ├── en.default.json        # English strings
    │   └── es.json                # Spanish strings
    └── package.json
```

### Configuration (shopify.extension.toml)

```toml
api_version = "2024-01"

[[extensions]]
type = "ui_extension"
name = "Custom Checkout Block"
handle = "checkout-block"

[[extensions.targeting]]
module = "./src/Checkout.tsx"
target = "purchase.checkout.block.render"

[extensions.capabilities]
api_access = true
network_access = true
block_progress = true

[extensions.settings]
[[extensions.settings.fields]]
key = "banner_title"
type = "single_line_text_field"
name = "Banner Title"
description = "Title displayed in the banner"

[[extensions.settings.fields]]
key = "show_timer"
type = "boolean"
name = "Show Countdown Timer"
description = "Display a countdown timer"

[[extensions.settings.fields]]
key = "timer_minutes"
type = "number_integer"
name = "Timer Duration (minutes)"
description = "Duration of the countdown timer"
```

---

## CHECKOUT UI COMPONENTS

### Basic Extension

```tsx
// src/Checkout.tsx
import {
  reactExtension,
  Banner,
  useSettings,
  useApi,
  useCartLines,
  useTotalAmount,
} from "@shopify/ui-extensions-react/checkout";

// Define the extension target
export default reactExtension(
  "purchase.checkout.block.render",
  () => <CheckoutBlock />
);

function CheckoutBlock() {
  // Get extension settings
  const { banner_title, show_timer, timer_minutes } = useSettings();

  // Get checkout API
  const { extension } = useApi();

  // Get cart data
  const cartLines = useCartLines();
  const totalAmount = useTotalAmount();

  return (
    <Banner title={banner_title || "Special Offer!"}>
      You have {cartLines.length} items in your cart.
      Total: {totalAmount.currencyCode} {totalAmount.amount}
    </Banner>
  );
}
```

### Trust Badges Extension

```tsx
// src/TrustBadges.tsx
import {
  reactExtension,
  BlockStack,
  InlineStack,
  Image,
  Text,
  Icon,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension(
  "purchase.checkout.footer.render-after",
  () => <TrustBadges />
);

function TrustBadges() {
  return (
    <BlockStack spacing="loose" padding="base">
      <Text size="small" appearance="subdued">
        Secure Checkout
      </Text>
      <InlineStack spacing="loose" blockAlignment="center">
        <InlineStack spacing="extraTight" blockAlignment="center">
          <Icon source="lock" size="small" />
          <Text size="small">SSL Encrypted</Text>
        </InlineStack>
        <InlineStack spacing="extraTight" blockAlignment="center">
          <Icon source="checkCircle" size="small" />
          <Text size="small">Money-Back Guarantee</Text>
        </InlineStack>
        <InlineStack spacing="extraTight" blockAlignment="center">
          <Icon source="delivered" size="small" />
          <Text size="small">Free Shipping</Text>
        </InlineStack>
      </InlineStack>
    </BlockStack>
  );
}
```

### Upsell Extension

```tsx
// src/Upsell.tsx
import {
  reactExtension,
  BlockStack,
  InlineStack,
  Image,
  Text,
  Button,
  Heading,
  useApi,
  useCartLines,
  useApplyCartLinesChange,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useEffect } from "react";

export default reactExtension(
  "purchase.checkout.cart-line-list.render-after",
  () => <UpsellBlock />
);

interface UpsellProduct {
  id: string;
  variantId: string;
  title: string;
  price: string;
  image: string;
  compareAtPrice?: string;
}

function UpsellBlock() {
  const { query } = useApi();
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Get product IDs in cart
  const cartProductIds = cartLines.map((line) => line.merchandise.product.id);

  // Fetch upsell products
  useEffect(() => {
    async function fetchUpsells() {
      const response = await query<{
        products: { nodes: any[] };
      }>(
        `query getUpsells($first: Int!) {
          products(first: $first, query: "tag:upsell") {
            nodes {
              id
              title
              featuredImage {
                url
              }
              variants(first: 1) {
                nodes {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                  }
                }
              }
            }
          }
        }`,
        { variables: { first: 4 } }
      );

      if (response.data?.products.nodes) {
        const products = response.data.products.nodes
          .filter((p) => !cartProductIds.includes(p.id))
          .map((p) => ({
            id: p.id,
            variantId: p.variants.nodes[0].id,
            title: p.title,
            price: `${p.variants.nodes[0].price.currencyCode} ${p.variants.nodes[0].price.amount}`,
            image: p.featuredImage?.url,
            compareAtPrice: p.variants.nodes[0].compareAtPrice?.amount,
          }));
        setUpsellProducts(products.slice(0, 2));
      }
      setLoading(false);
    }
    fetchUpsells();
  }, [query, cartProductIds]);

  async function addToCart(variantId: string) {
    const result = await applyCartLinesChange({
      type: "addCartLine",
      merchandiseId: variantId,
      quantity: 1,
    });

    if (result.type === "error") {
      console.error("Failed to add item:", result.message);
    }
  }

  if (loading || upsellProducts.length === 0) {
    return null;
  }

  return (
    <BlockStack spacing="loose" padding="base">
      <Heading level={2}>You might also like</Heading>
      {upsellProducts.map((product) => (
        <InlineStack
          key={product.id}
          spacing="base"
          blockAlignment="center"
          columns={["auto", "fill", "auto"]}
        >
          {product.image && (
            <Image
              source={product.image}
              accessibilityDescription={product.title}
              cornerRadius="base"
              aspectRatio={1}
              fit="cover"
            />
          )}
          <BlockStack spacing="none">
            <Text size="base" emphasis="bold">
              {product.title}
            </Text>
            <InlineStack spacing="tight">
              <Text size="small">{product.price}</Text>
              {product.compareAtPrice && (
                <Text
                  size="small"
                  appearance="subdued"
                  accessibilityRole="deletion"
                >
                  ${product.compareAtPrice}
                </Text>
              )}
            </InlineStack>
          </BlockStack>
          <Button
            kind="secondary"
            onPress={() => addToCart(product.variantId)}
          >
            Add
          </Button>
        </InlineStack>
      ))}
    </BlockStack>
  );
}
```

### Custom Field Extension

```tsx
// src/CustomField.tsx
import {
  reactExtension,
  BlockStack,
  TextField,
  Checkbox,
  useApplyMetafieldsChange,
  useMetafield,
} from "@shopify/ui-extensions-react/checkout";
import { useState } from "react";

export default reactExtension(
  "purchase.checkout.delivery-address.render-after",
  () => <DeliveryInstructions />
);

function DeliveryInstructions() {
  const applyMetafieldsChange = useApplyMetafieldsChange();

  // Read existing metafield value
  const deliveryNote = useMetafield({
    namespace: "custom",
    key: "delivery_instructions",
  });

  const [instructions, setInstructions] = useState(
    deliveryNote?.value || ""
  );
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);

  async function handleInstructionsChange(value: string) {
    setInstructions(value);
    await applyMetafieldsChange({
      type: "updateMetafield",
      namespace: "custom",
      key: "delivery_instructions",
      valueType: "string",
      value,
    });
  }

  async function handleLeaveAtDoorChange(checked: boolean) {
    setLeaveAtDoor(checked);
    await applyMetafieldsChange({
      type: "updateMetafield",
      namespace: "custom",
      key: "leave_at_door",
      valueType: "boolean",
      value: String(checked),
    });
  }

  return (
    <BlockStack spacing="base">
      <TextField
        label="Delivery instructions"
        value={instructions}
        onChange={handleInstructionsChange}
        multiline={3}
        maxLength={200}
      />
      <Checkbox
        checked={leaveAtDoor}
        onChange={handleLeaveAtDoorChange}
      >
        Leave package at door if no one is home
      </Checkbox>
    </BlockStack>
  );
}
```

### Gift Message Extension

```tsx
// src/GiftMessage.tsx
import {
  reactExtension,
  BlockStack,
  TextField,
  Checkbox,
  Disclosure,
  View,
  useApplyAttributeChange,
  useAttributeValues,
} from "@shopify/ui-extensions-react/checkout";
import { useState } from "react";

export default reactExtension(
  "purchase.checkout.cart-line-list.render-after",
  () => <GiftOptions />
);

function GiftOptions() {
  const applyAttributeChange = useApplyAttributeChange();
  const [isGift, giftMessage] = useAttributeValues(["_is_gift", "_gift_message"]);

  const [showGiftOptions, setShowGiftOptions] = useState(isGift === "true");
  const [message, setMessage] = useState(giftMessage || "");

  async function handleIsGiftChange(checked: boolean) {
    setShowGiftOptions(checked);
    await applyAttributeChange({
      type: "updateAttribute",
      key: "_is_gift",
      value: String(checked),
    });
  }

  async function handleMessageChange(value: string) {
    setMessage(value);
    await applyAttributeChange({
      type: "updateAttribute",
      key: "_gift_message",
      value,
    });
  }

  return (
    <BlockStack spacing="base">
      <Checkbox
        checked={showGiftOptions}
        onChange={handleIsGiftChange}
      >
        This is a gift
      </Checkbox>

      <Disclosure open={showGiftOptions}>
        <View padding={["none", "none", "base", "none"]}>
          <TextField
            label="Gift message"
            value={message}
            onChange={handleMessageChange}
            multiline={3}
            maxLength={500}
          />
        </View>
      </Disclosure>
    </BlockStack>
  );
}
```

### Loyalty Points Display

```tsx
// src/LoyaltyPoints.tsx
import {
  reactExtension,
  BlockStack,
  InlineStack,
  Text,
  Icon,
  Banner,
  useCustomer,
  useTotalAmount,
  useApi,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useEffect } from "react";

export default reactExtension(
  "purchase.checkout.reductions.render-before",
  () => <LoyaltyPoints />
);

function LoyaltyPoints() {
  const customer = useCustomer();
  const totalAmount = useTotalAmount();
  const { query } = useApi();
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [pointsToEarn, setPointsToEarn] = useState(0);

  useEffect(() => {
    async function fetchLoyaltyPoints() {
      if (!customer?.id) return;

      const response = await query<{
        customer: {
          metafield: { value: string } | null;
        };
      }>(
        `query getCustomerPoints($id: ID!) {
          customer(id: $id) {
            metafield(namespace: "loyalty", key: "points") {
              value
            }
          }
        }`,
        { variables: { id: customer.id } }
      );

      if (response.data?.customer?.metafield?.value) {
        setLoyaltyPoints(parseInt(response.data.customer.metafield.value));
      }
    }
    fetchLoyaltyPoints();
  }, [customer?.id, query]);

  // Calculate points to earn (1 point per dollar)
  useEffect(() => {
    const amount = parseFloat(totalAmount.amount);
    setPointsToEarn(Math.floor(amount));
  }, [totalAmount]);

  if (!customer) return null;

  return (
    <Banner status="info">
      <BlockStack spacing="tight">
        <InlineStack spacing="tight" blockAlignment="center">
          <Icon source="star" />
          <Text emphasis="bold">Loyalty Rewards</Text>
        </InlineStack>
        {loyaltyPoints !== null && (
          <Text size="small">
            Current balance: {loyaltyPoints.toLocaleString()} points
          </Text>
        )}
        <Text size="small" appearance="success">
          You'll earn {pointsToEarn.toLocaleString()} points with this purchase!
        </Text>
      </BlockStack>
    </Banner>
  );
}
```

### Order Deadline Extension

```tsx
// src/OrderDeadline.tsx
import {
  reactExtension,
  Banner,
  Text,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useEffect } from "react";

export default reactExtension(
  "purchase.checkout.header.render-after",
  () => <OrderDeadline />
);

function OrderDeadline() {
  const { deadline_hour = 14, shipping_day = "tomorrow" } = useSettings<{
    deadline_hour: number;
    shipping_day: string;
  }>();

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date();
      const deadline = new Date();
      deadline.setHours(deadline_hour, 0, 0, 0);

      if (now > deadline) {
        return null; // Past deadline
      }

      const diff = deadline.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes} minutes`;
    }

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline_hour]);

  if (!timeLeft) return null;

  return (
    <Banner status="warning" title="Limited Time!">
      <Text>
        Order within {timeLeft} for {shipping_day} shipping!
      </Text>
    </Banner>
  );
}
```

---

## CHECKOUT HOOKS

### Available Hooks

```tsx
// Cart & Lines
import {
  useCartLines,           // Get all cart line items
  useCartLineTarget,      // Get targeted cart line (in line-item extensions)
  useTotalAmount,         // Get cart total
  useSubtotalAmount,      // Get subtotal
  useTotalShippingAmount, // Get shipping total
  useTotalTaxAmount,      // Get tax total
  useDiscountCodes,       // Get applied discount codes
  useDiscountAllocations, // Get discount allocations
} from "@shopify/ui-extensions-react/checkout";

// Customer
import {
  useCustomer,           // Get logged-in customer
  useEmail,              // Get/set customer email
  usePhone,              // Get/set customer phone
} from "@shopify/ui-extensions-react/checkout";

// Addresses
import {
  useShippingAddress,    // Get shipping address
  useBillingAddress,     // Get billing address
} from "@shopify/ui-extensions-react/checkout";

// Shipping
import {
  useShippingOptionTarget,     // Get targeted shipping option
  useSelectedDeliveryOptions,  // Get selected delivery options
} from "@shopify/ui-extensions-react/checkout";

// Payment
import {
  useSelectedPaymentOptions,  // Get selected payment method
} from "@shopify/ui-extensions-react/checkout";

// Metafields & Attributes
import {
  useMetafield,               // Read a metafield
  useMetafields,              // Read multiple metafields
  useApplyMetafieldsChange,   // Update metafields
  useAttributeValues,         // Read cart attributes
  useApplyAttributeChange,    // Update cart attributes
} from "@shopify/ui-extensions-react/checkout";

// Cart Changes
import {
  useApplyCartLinesChange,    // Add/remove/update cart lines
  useApplyDiscountCodeChange, // Apply/remove discount codes
} from "@shopify/ui-extensions-react/checkout";

// API
import {
  useApi,                    // Access extension API
  useSettings,               // Get extension settings
  useLanguage,               // Get current language
  useCurrency,               // Get currency info
  useTimezone,               // Get shop timezone
} from "@shopify/ui-extensions-react/checkout";

// Navigation & Progress
import {
  useExtensionCapability,    // Check if capability is available
  useBuyerJourneyIntercept,  // Block checkout progress
} from "@shopify/ui-extensions-react/checkout";
```

### Using Buyer Journey Intercept

```tsx
// src/AgeVerification.tsx
import {
  reactExtension,
  BlockStack,
  Checkbox,
  Text,
  useBuyerJourneyIntercept,
} from "@shopify/ui-extensions-react/checkout";
import { useState } from "react";

export default reactExtension(
  "purchase.checkout.block.render",
  () => <AgeVerification />
);

function AgeVerification() {
  const [confirmed, setConfirmed] = useState(false);

  // Block checkout if age not confirmed
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (canBlockProgress && !confirmed) {
      return {
        behavior: "block",
        reason: "Age verification required",
        errors: [
          {
            message: "Please confirm you are 21 or older to purchase these items.",
          },
        ],
      };
    }
    return { behavior: "allow" };
  });

  return (
    <BlockStack spacing="tight">
      <Text emphasis="bold">Age Verification Required</Text>
      <Checkbox checked={confirmed} onChange={setConfirmed}>
        I confirm I am 21 years of age or older
      </Checkbox>
    </BlockStack>
  );
}
```

---

## UI COMPONENTS REFERENCE

### Layout Components

```tsx
import {
  // Layout
  BlockStack,      // Vertical stack
  InlineStack,     // Horizontal stack
  Grid,            // CSS Grid layout
  View,            // Generic container
  Divider,         // Horizontal line

  // Typography
  Text,            // Text content
  Heading,         // Headings (h1-h3)
  TextBlock,       // Block-level text

  // Interactive
  Button,          // Buttons
  Link,            // Links
  Pressable,       // Pressable areas

  // Forms
  TextField,       // Text input
  Checkbox,        // Checkbox
  ChoiceList,      // Radio/checkbox groups
  Select,          // Dropdown
  DatePicker,      // Date selector

  // Feedback
  Banner,          // Notices/alerts
  SkeletonImage,   // Loading placeholder
  SkeletonText,    // Loading placeholder
  Spinner,         // Loading spinner

  // Media
  Image,           // Images
  Icon,            // Icons

  // Disclosure
  Disclosure,      // Collapsible content
  Modal,           // Modal dialog
  Popover,         // Popover
  Tooltip,         // Tooltips

  // Data Display
  ProductThumbnail,// Product image thumbnail
  Tag,             // Tag/chip
  Badge,           // Status badge
} from "@shopify/ui-extensions-react/checkout";
```

### Example: Complete Component Usage

```tsx
// src/CompleteExample.tsx
import {
  reactExtension,
  BlockStack,
  InlineStack,
  View,
  Text,
  Heading,
  Button,
  TextField,
  Checkbox,
  Select,
  Banner,
  Image,
  Icon,
  Divider,
  Badge,
  ChoiceList,
  useApi,
  useCartLines,
  useTotalAmount,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";
import { useState } from "react";

export default reactExtension(
  "purchase.checkout.block.render",
  () => <CompleteExample />
);

function CompleteExample() {
  const { banner_text } = useSettings<{ banner_text: string }>();
  const cartLines = useCartLines();
  const totalAmount = useTotalAmount();

  const [selectedOption, setSelectedOption] = useState("standard");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <BlockStack spacing="loose">
      {/* Banner */}
      <Banner title="Special Offer" status="success">
        <Text>{banner_text || "Free shipping on orders over $50!"}</Text>
      </Banner>

      {/* Heading with Badge */}
      <InlineStack spacing="tight" blockAlignment="center">
        <Heading level={2}>Order Summary</Heading>
        <Badge tone="info">{cartLines.length} items</Badge>
      </InlineStack>

      <Divider />

      {/* Product List */}
      <BlockStack spacing="base">
        {cartLines.slice(0, 3).map((line) => (
          <InlineStack
            key={line.id}
            columns={["auto", "fill", "auto"]}
            blockAlignment="center"
            spacing="base"
          >
            {line.merchandise.image && (
              <Image
                source={line.merchandise.image.url}
                accessibilityDescription={line.merchandise.title}
                aspectRatio={1}
                cornerRadius="base"
              />
            )}
            <BlockStack spacing="none">
              <Text emphasis="bold">{line.merchandise.title}</Text>
              <Text size="small" appearance="subdued">
                Qty: {line.quantity}
              </Text>
            </BlockStack>
            <Text>
              {line.cost.totalAmount.currencyCode} {line.cost.totalAmount.amount}
            </Text>
          </InlineStack>
        ))}
      </BlockStack>

      <Divider />

      {/* Total */}
      <InlineStack columns={["fill", "auto"]}>
        <Text emphasis="bold" size="large">Total</Text>
        <Text emphasis="bold" size="large">
          {totalAmount.currencyCode} {totalAmount.amount}
        </Text>
      </InlineStack>

      <Divider />

      {/* Form Fields */}
      <BlockStack spacing="base">
        <TextField
          label="Email for order updates"
          type="email"
          value={email}
          onChange={setEmail}
          icon={<Icon source="email" />}
        />

        <Select
          label="Delivery preference"
          value={selectedOption}
          onChange={setSelectedOption}
          options={[
            { value: "standard", label: "Standard Delivery" },
            { value: "express", label: "Express Delivery (+$10)" },
            { value: "pickup", label: "Store Pickup (Free)" },
          ]}
        />

        <ChoiceList
          name="gift_options"
          value={[]}
          onChange={() => {}}
          options={[
            { value: "wrap", label: "Gift wrap (+$5)" },
            { value: "message", label: "Include gift message" },
            { value: "receipt", label: "Hide prices on receipt" },
          ]}
        />

        <Checkbox
          checked={agreedToTerms}
          onChange={setAgreedToTerms}
        >
          I agree to the terms and conditions
        </Checkbox>
      </BlockStack>

      {/* Action Button */}
      <Button
        kind="primary"
        disabled={!agreedToTerms}
        onPress={() => console.log("Continue clicked")}
      >
        Continue to Payment
      </Button>
    </BlockStack>
  );
}
```

---

## THANK YOU PAGE EXTENSIONS

### Survey Extension

```tsx
// src/ThankYouSurvey.tsx
import {
  reactExtension,
  BlockStack,
  Heading,
  Text,
  Button,
  ChoiceList,
  TextField,
  Banner,
  useApi,
  useOrder,
} from "@shopify/ui-extensions-react/checkout";
import { useState } from "react";

export default reactExtension(
  "purchase.thank-you.block.render",
  () => <ThankYouSurvey />
);

function ThankYouSurvey() {
  const order = useOrder();
  const { sessionToken } = useApi();

  const [rating, setRating] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitSurvey() {
    setLoading(true);

    const token = await sessionToken.get();

    await fetch("https://your-app.com/api/survey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId: order?.id,
        rating: rating[0],
        feedback,
      }),
    });

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <Banner status="success" title="Thank you!">
        <Text>Your feedback helps us improve.</Text>
      </Banner>
    );
  }

  return (
    <BlockStack spacing="base" padding="base">
      <Heading level={2}>How was your experience?</Heading>
      <Text appearance="subdued">
        Help us improve by sharing your feedback
      </Text>

      <ChoiceList
        name="rating"
        value={rating}
        onChange={setRating}
        options={[
          { value: "5", label: "⭐⭐⭐⭐⭐ Excellent" },
          { value: "4", label: "⭐⭐⭐⭐ Good" },
          { value: "3", label: "⭐⭐⭐ Average" },
          { value: "2", label: "⭐⭐ Poor" },
          { value: "1", label: "⭐ Very Poor" },
        ]}
      />

      <TextField
        label="Additional feedback (optional)"
        value={feedback}
        onChange={setFeedback}
        multiline={3}
      />

      <Button
        kind="secondary"
        onPress={submitSurvey}
        loading={loading}
        disabled={rating.length === 0}
      >
        Submit Feedback
      </Button>
    </BlockStack>
  );
}
```

### Social Share Extension

```tsx
// src/SocialShare.tsx
import {
  reactExtension,
  BlockStack,
  InlineStack,
  Heading,
  Button,
  Text,
  useOrder,
  useShop,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension(
  "purchase.thank-you.footer.render-after",
  () => <SocialShare />
);

function SocialShare() {
  const order = useOrder();
  const shop = useShop();

  const shareText = encodeURIComponent(
    `Just ordered from ${shop.name}! 🛍️`
  );
  const shareUrl = encodeURIComponent(shop.storefrontUrl || "");

  const socialLinks = [
    {
      name: "Twitter",
      url: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
  ];

  return (
    <BlockStack spacing="base" padding="base">
      <Heading level={3}>Share the love!</Heading>
      <Text appearance="subdued">
        Let your friends know about your purchase
      </Text>
      <InlineStack spacing="base">
        {socialLinks.map((link) => (
          <Button
            key={link.name}
            kind="plain"
            to={link.url}
            external
          >
            Share on {link.name}
          </Button>
        ))}
      </InlineStack>
    </BlockStack>
  );
}
```

---

## LOCALIZATION

### Locale Files

```json
// locales/en.default.json
{
  "banner_title": "Special Offer!",
  "add_to_cart": "Add to Cart",
  "view_details": "View Details",
  "gift_message_label": "Gift Message",
  "gift_message_placeholder": "Enter your message here...",
  "delivery_instructions": "Delivery Instructions",
  "leave_at_door": "Leave package at door",
  "age_verification": "Age Verification Required",
  "age_confirm": "I confirm I am 21 years of age or older",
  "loyalty_points": "Loyalty Points",
  "points_earned": "You'll earn {{points}} points with this purchase!"
}
```

```json
// locales/es.json
{
  "banner_title": "¡Oferta Especial!",
  "add_to_cart": "Agregar al Carrito",
  "view_details": "Ver Detalles",
  "gift_message_label": "Mensaje de Regalo",
  "gift_message_placeholder": "Ingrese su mensaje aquí...",
  "delivery_instructions": "Instrucciones de Entrega",
  "leave_at_door": "Dejar paquete en la puerta",
  "age_verification": "Verificación de Edad Requerida",
  "age_confirm": "Confirmo que tengo 21 años de edad o más",
  "loyalty_points": "Puntos de Lealtad",
  "points_earned": "¡Ganarás {{points}} puntos con esta compra!"
}
```

### Using Translations

```tsx
import {
  reactExtension,
  useTranslate,
} from "@shopify/ui-extensions-react/checkout";

function MyExtension() {
  const translate = useTranslate();

  return (
    <Banner title={translate("banner_title")}>
      <Text>
        {translate("points_earned", { points: 100 })}
      </Text>
    </Banner>
  );
}
```

---

## TESTING & DEVELOPMENT

### Local Development

```bash
# Start development server
npm run dev

# The extension will hot-reload as you make changes
# Test at: https://your-store.myshopify.com/cart
```

### Extension Preview

```bash
# Generate preview URL
shopify app dev

# Preview specific extension
shopify app dev --extension=checkout-ui
```

---

## INVOCATION

```
/shopify-checkout
/checkout-extensions
/checkout-ui
```

---

*SHOPIFY.CHECKOUT.EXE - Customize Every Step*
