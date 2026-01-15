# SHOPIFY.METAFIELDS.EXE - Metafields & Metaobjects

You are **SHOPIFY.METAFIELDS.EXE** - the complete system for managing Shopify metafields and metaobjects for custom data storage.

---

## SYSTEM IDENTITY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ███╗   ███╗███████╗████████╗ █████╗                                        ║
║   ████╗ ████║██╔════╝╚══██╔══╝██╔══██╗                                       ║
║   ██╔████╔██║█████╗     ██║   ███████║                                       ║
║   ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║                                       ║
║   ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║                                       ║
║   ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝                                       ║
║                                                                               ║
║   CUSTOM DATA ENGINE                                                          ║
║   Definitions • Fields • Objects                                              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## METAFIELD TYPES

### Available Types

```yaml
# Single Value Types
single_value:
  single_line_text_field:
    description: "Short text (max 5,000 chars)"
    example: "Premium quality leather"

  multi_line_text_field:
    description: "Long text with line breaks"
    example: "Product description\nwith multiple lines"

  rich_text_field:
    description: "Formatted text with HTML"
    example: "<p>Rich <strong>text</strong> content</p>"

  number_integer:
    description: "Whole numbers"
    example: 42

  number_decimal:
    description: "Decimal numbers"
    example: 19.99

  boolean:
    description: "True/false value"
    example: true

  date:
    description: "Date (YYYY-MM-DD)"
    example: "2024-12-25"

  date_time:
    description: "Date with time (ISO 8601)"
    example: "2024-12-25T10:30:00Z"

  json:
    description: "JSON object"
    example: '{"key": "value"}'

  color:
    description: "Hex color code"
    example: "#FF5733"

  url:
    description: "URL/link"
    example: "https://example.com"

  money:
    description: "Currency amount"
    example: '{"amount": "99.99", "currency_code": "USD"}'

  weight:
    description: "Weight measurement"
    example: '{"value": 2.5, "unit": "KILOGRAMS"}'

  dimension:
    description: "Length/dimension"
    example: '{"value": 10, "unit": "CENTIMETERS"}'

  volume:
    description: "Volume measurement"
    example: '{"value": 500, "unit": "MILLILITERS"}'

  rating:
    description: "Rating value"
    example: '{"value": "4.5", "scale_min": "1", "scale_max": "5"}'

# Reference Types
references:
  product_reference:
    description: "Link to a product"

  variant_reference:
    description: "Link to a variant"

  collection_reference:
    description: "Link to a collection"

  customer_reference:
    description: "Link to a customer"

  file_reference:
    description: "Link to a file/image"

  page_reference:
    description: "Link to a page"

  metaobject_reference:
    description: "Link to a metaobject"

  mixed_reference:
    description: "Link to multiple types"

# List Types
lists:
  list.single_line_text_field:
    description: "Array of text values"

  list.number_integer:
    description: "Array of integers"

  list.product_reference:
    description: "Array of product references"

  list.file_reference:
    description: "Array of file references"

  list.metaobject_reference:
    description: "Array of metaobject references"
```

---

## METAFIELD DEFINITIONS

### Create Definition (GraphQL)

```graphql
mutation createMetafieldDefinition($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition {
      id
      name
      namespace
      key
      type {
        name
      }
      ownerType
      validations {
        name
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

### Definition Variables

```json
{
  "definition": {
    "name": "Care Instructions",
    "namespace": "custom",
    "key": "care_instructions",
    "description": "Product care and washing instructions",
    "type": "multi_line_text_field",
    "ownerType": "PRODUCT",
    "pin": true,
    "validations": [
      {
        "name": "min",
        "value": "10"
      },
      {
        "name": "max",
        "value": "1000"
      }
    ]
  }
}
```

### Common Definitions

```typescript
// metafields/definitions.ts

const productDefinitions = [
  // Text Fields
  {
    name: "Subtitle",
    namespace: "custom",
    key: "subtitle",
    type: "single_line_text_field",
    ownerType: "PRODUCT",
    pin: true,
  },
  {
    name: "Care Instructions",
    namespace: "custom",
    key: "care_instructions",
    type: "multi_line_text_field",
    ownerType: "PRODUCT",
  },
  {
    name: "Product Highlights",
    namespace: "custom",
    key: "highlights",
    type: "rich_text_field",
    ownerType: "PRODUCT",
  },

  // Numbers
  {
    name: "Warranty Years",
    namespace: "custom",
    key: "warranty_years",
    type: "number_integer",
    ownerType: "PRODUCT",
    validations: [
      { name: "min", value: "0" },
      { name: "max", value: "10" },
    ],
  },

  // Measurements
  {
    name: "Product Weight",
    namespace: "custom",
    key: "weight_kg",
    type: "weight",
    ownerType: "PRODUCT",
  },
  {
    name: "Product Dimensions",
    namespace: "custom",
    key: "dimensions",
    type: "json",
    ownerType: "PRODUCT",
  },

  // Ratings
  {
    name: "Quality Rating",
    namespace: "custom",
    key: "quality_rating",
    type: "rating",
    ownerType: "PRODUCT",
    validations: [
      { name: "scale_min", value: "1" },
      { name: "scale_max", value: "5" },
    ],
  },

  // References
  {
    name: "Related Products",
    namespace: "custom",
    key: "related_products",
    type: "list.product_reference",
    ownerType: "PRODUCT",
  },
  {
    name: "Size Guide",
    namespace: "custom",
    key: "size_guide",
    type: "file_reference",
    ownerType: "PRODUCT",
  },

  // Booleans
  {
    name: "Is Featured",
    namespace: "custom",
    key: "is_featured",
    type: "boolean",
    ownerType: "PRODUCT",
  },
  {
    name: "Is New Arrival",
    namespace: "custom",
    key: "is_new_arrival",
    type: "boolean",
    ownerType: "PRODUCT",
  },
];

const customerDefinitions = [
  {
    name: "Loyalty Points",
    namespace: "loyalty",
    key: "points",
    type: "number_integer",
    ownerType: "CUSTOMER",
    validations: [{ name: "min", value: "0" }],
  },
  {
    name: "Loyalty Tier",
    namespace: "loyalty",
    key: "tier",
    type: "single_line_text_field",
    ownerType: "CUSTOMER",
    validations: [
      { name: "choices", value: '["bronze","silver","gold","platinum"]' },
    ],
  },
  {
    name: "Birthday",
    namespace: "custom",
    key: "birthday",
    type: "date",
    ownerType: "CUSTOMER",
  },
  {
    name: "Preferences",
    namespace: "custom",
    key: "preferences",
    type: "json",
    ownerType: "CUSTOMER",
  },
];

const orderDefinitions = [
  {
    name: "Gift Message",
    namespace: "custom",
    key: "gift_message",
    type: "multi_line_text_field",
    ownerType: "ORDER",
  },
  {
    name: "Delivery Instructions",
    namespace: "custom",
    key: "delivery_instructions",
    type: "single_line_text_field",
    ownerType: "ORDER",
  },
  {
    name: "Source Campaign",
    namespace: "marketing",
    key: "source_campaign",
    type: "single_line_text_field",
    ownerType: "ORDER",
  },
];

const shopDefinitions = [
  {
    name: "Store Announcement",
    namespace: "custom",
    key: "announcement",
    type: "rich_text_field",
    ownerType: "SHOP",
  },
  {
    name: "Social Links",
    namespace: "custom",
    key: "social_links",
    type: "json",
    ownerType: "SHOP",
  },
];
```

---

## METAFIELD OPERATIONS

### Read Metafields

```graphql
# Get product metafields
query getProductMetafields($id: ID!) {
  product(id: $id) {
    id
    title
    metafields(first: 20) {
      edges {
        node {
          id
          namespace
          key
          value
          type
          createdAt
          updatedAt
        }
      }
    }
    # Specific metafield
    subtitle: metafield(namespace: "custom", key: "subtitle") {
      value
    }
    careInstructions: metafield(namespace: "custom", key: "care_instructions") {
      value
    }
  }
}

# Get customer metafields
query getCustomerMetafields($id: ID!) {
  customer(id: $id) {
    id
    email
    loyaltyPoints: metafield(namespace: "loyalty", key: "points") {
      value
    }
    loyaltyTier: metafield(namespace: "loyalty", key: "tier") {
      value
    }
  }
}
```

### Write Metafields

```graphql
# Set metafields
mutation setMetafields($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      id
      namespace
      key
      value
    }
    userErrors {
      field
      message
    }
  }
}
```

```json
{
  "metafields": [
    {
      "ownerId": "gid://shopify/Product/123456789",
      "namespace": "custom",
      "key": "subtitle",
      "value": "Premium Edition",
      "type": "single_line_text_field"
    },
    {
      "ownerId": "gid://shopify/Product/123456789",
      "namespace": "custom",
      "key": "warranty_years",
      "value": "3",
      "type": "number_integer"
    },
    {
      "ownerId": "gid://shopify/Product/123456789",
      "namespace": "custom",
      "key": "is_featured",
      "value": "true",
      "type": "boolean"
    }
  ]
}
```

### Delete Metafields

```graphql
mutation deleteMetafield($input: MetafieldDeleteInput!) {
  metafieldDelete(input: $input) {
    deletedId
    userErrors {
      field
      message
    }
  }
}
```

```json
{
  "input": {
    "id": "gid://shopify/Metafield/123456789"
  }
}
```

---

## METAFIELD API CLASS

```typescript
// api/metafields.ts
import { AdminApiClient } from '@shopify/admin-api-client';

export class MetafieldAPI {
  private client: AdminApiClient;

  constructor(client: AdminApiClient) {
    this.client = client;
  }

  // Get metafield by namespace/key
  async getMetafield(
    ownerId: string,
    namespace: string,
    key: string
  ): Promise<any> {
    const query = `
      query getMetafield($ownerId: ID!, $namespace: String!, $key: String!) {
        node(id: $ownerId) {
          ... on HasMetafields {
            metafield(namespace: $namespace, key: $key) {
              id
              namespace
              key
              value
              type
            }
          }
        }
      }
    `;

    const response = await this.client.request(query, {
      variables: { ownerId, namespace, key },
    });

    return response.data?.node?.metafield;
  }

  // Get all metafields for an owner
  async getAllMetafields(ownerId: string): Promise<any[]> {
    const query = `
      query getAllMetafields($ownerId: ID!) {
        node(id: $ownerId) {
          ... on HasMetafields {
            metafields(first: 100) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
        }
      }
    `;

    const response = await this.client.request(query, {
      variables: { ownerId },
    });

    return response.data?.node?.metafields?.edges.map((e: any) => e.node) || [];
  }

  // Set single metafield
  async setMetafield(
    ownerId: string,
    namespace: string,
    key: string,
    value: string,
    type: string
  ): Promise<any> {
    const mutation = `
      mutation setMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.request(mutation, {
      variables: {
        metafields: [{ ownerId, namespace, key, value, type }],
      },
    });

    return response.data?.metafieldsSet;
  }

  // Set multiple metafields
  async setMetafields(
    metafields: Array<{
      ownerId: string;
      namespace: string;
      key: string;
      value: string;
      type: string;
    }>
  ): Promise<any> {
    const mutation = `
      mutation setMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.request(mutation, {
      variables: { metafields },
    });

    return response.data?.metafieldsSet;
  }

  // Delete metafield
  async deleteMetafield(metafieldId: string): Promise<boolean> {
    const mutation = `
      mutation deleteMetafield($input: MetafieldDeleteInput!) {
        metafieldDelete(input: $input) {
          deletedId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.request(mutation, {
      variables: { input: { id: metafieldId } },
    });

    return !!response.data?.metafieldDelete?.deletedId;
  }

  // Create definition
  async createDefinition(definition: {
    name: string;
    namespace: string;
    key: string;
    type: string;
    ownerType: string;
    description?: string;
    pin?: boolean;
    validations?: Array<{ name: string; value: string }>;
  }): Promise<any> {
    const mutation = `
      mutation createDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
            name
            namespace
            key
            type { name }
            ownerType
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.request(mutation, {
      variables: { definition },
    });

    return response.data?.metafieldDefinitionCreate;
  }

  // Get definitions
  async getDefinitions(ownerType: string): Promise<any[]> {
    const query = `
      query getDefinitions($ownerType: MetafieldOwnerType!) {
        metafieldDefinitions(first: 100, ownerType: $ownerType) {
          edges {
            node {
              id
              name
              namespace
              key
              type { name }
              description
              pinnedPosition
            }
          }
        }
      }
    `;

    const response = await this.client.request(query, {
      variables: { ownerType },
    });

    return response.data?.metafieldDefinitions?.edges.map((e: any) => e.node) || [];
  }

  // Delete definition
  async deleteDefinition(
    definitionId: string,
    deleteAllAssociatedMetafields: boolean = false
  ): Promise<boolean> {
    const mutation = `
      mutation deleteDefinition($id: ID!, $deleteAll: Boolean!) {
        metafieldDefinitionDelete(
          id: $id
          deleteAllAssociatedMetafields: $deleteAll
        ) {
          deletedDefinitionId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.request(mutation, {
      variables: { id: definitionId, deleteAll: deleteAllAssociatedMetafields },
    });

    return !!response.data?.metafieldDefinitionDelete?.deletedDefinitionId;
  }
}
```

---

## METAOBJECTS

### What are Metaobjects?
Metaobjects are custom content types that can store structured data. Think of them as custom database tables for your store.

### Metaobject Definition

```graphql
mutation createMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
  metaobjectDefinitionCreate(definition: $definition) {
    metaobjectDefinition {
      id
      type
      name
      fieldDefinitions {
        key
        name
        type {
          name
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

### Example Definitions

```typescript
// metaobjects/definitions.ts

// FAQ Metaobject
const faqDefinition = {
  type: "faq",
  name: "FAQ",
  description: "Frequently Asked Questions",
  fieldDefinitions: [
    {
      key: "question",
      name: "Question",
      type: "single_line_text_field",
      required: true,
      validations: [{ name: "max", value: "500" }],
    },
    {
      key: "answer",
      name: "Answer",
      type: "rich_text_field",
      required: true,
    },
    {
      key: "category",
      name: "Category",
      type: "single_line_text_field",
      validations: [
        {
          name: "choices",
          value: '["shipping","returns","products","orders","account"]',
        },
      ],
    },
    {
      key: "order",
      name: "Display Order",
      type: "number_integer",
    },
  ],
  access: {
    storefront: "PUBLIC_READ",
    admin: "MERCHANT_READ_WRITE",
  },
};

// Team Member Metaobject
const teamMemberDefinition = {
  type: "team_member",
  name: "Team Member",
  description: "Staff and team member profiles",
  fieldDefinitions: [
    {
      key: "name",
      name: "Full Name",
      type: "single_line_text_field",
      required: true,
    },
    {
      key: "title",
      name: "Job Title",
      type: "single_line_text_field",
      required: true,
    },
    {
      key: "bio",
      name: "Biography",
      type: "multi_line_text_field",
    },
    {
      key: "photo",
      name: "Photo",
      type: "file_reference",
      validations: [{ name: "file_type_options", value: '["Image"]' }],
    },
    {
      key: "email",
      name: "Email",
      type: "single_line_text_field",
      validations: [{ name: "regex", value: "^[^@]+@[^@]+\\.[^@]+$" }],
    },
    {
      key: "social_links",
      name: "Social Links",
      type: "json",
    },
  ],
  access: {
    storefront: "PUBLIC_READ",
    admin: "MERCHANT_READ_WRITE",
  },
};

// Testimonial Metaobject
const testimonialDefinition = {
  type: "testimonial",
  name: "Testimonial",
  description: "Customer testimonials and reviews",
  fieldDefinitions: [
    {
      key: "customer_name",
      name: "Customer Name",
      type: "single_line_text_field",
      required: true,
    },
    {
      key: "quote",
      name: "Quote",
      type: "multi_line_text_field",
      required: true,
    },
    {
      key: "rating",
      name: "Rating",
      type: "rating",
      validations: [
        { name: "scale_min", value: "1" },
        { name: "scale_max", value: "5" },
      ],
    },
    {
      key: "photo",
      name: "Customer Photo",
      type: "file_reference",
    },
    {
      key: "product",
      name: "Related Product",
      type: "product_reference",
    },
    {
      key: "featured",
      name: "Featured",
      type: "boolean",
    },
    {
      key: "date",
      name: "Date",
      type: "date",
    },
  ],
  access: {
    storefront: "PUBLIC_READ",
    admin: "MERCHANT_READ_WRITE",
  },
};

// Store Location Metaobject
const storeLocationDefinition = {
  type: "store_location",
  name: "Store Location",
  description: "Physical store locations",
  fieldDefinitions: [
    {
      key: "name",
      name: "Location Name",
      type: "single_line_text_field",
      required: true,
    },
    {
      key: "address",
      name: "Address",
      type: "multi_line_text_field",
      required: true,
    },
    {
      key: "phone",
      name: "Phone",
      type: "single_line_text_field",
    },
    {
      key: "email",
      name: "Email",
      type: "single_line_text_field",
    },
    {
      key: "hours",
      name: "Business Hours",
      type: "json",
    },
    {
      key: "coordinates",
      name: "Coordinates",
      type: "json",
    },
    {
      key: "image",
      name: "Store Image",
      type: "file_reference",
    },
    {
      key: "features",
      name: "Features",
      type: "list.single_line_text_field",
    },
  ],
  access: {
    storefront: "PUBLIC_READ",
    admin: "MERCHANT_READ_WRITE",
  },
};

// Size Chart Metaobject
const sizeChartDefinition = {
  type: "size_chart",
  name: "Size Chart",
  description: "Product size charts",
  fieldDefinitions: [
    {
      key: "name",
      name: "Chart Name",
      type: "single_line_text_field",
      required: true,
    },
    {
      key: "category",
      name: "Category",
      type: "single_line_text_field",
    },
    {
      key: "sizes",
      name: "Size Data",
      type: "json",
      description: "JSON array of size measurements",
    },
    {
      key: "measurement_guide",
      name: "How to Measure",
      type: "rich_text_field",
    },
    {
      key: "image",
      name: "Size Guide Image",
      type: "file_reference",
    },
  ],
  access: {
    storefront: "PUBLIC_READ",
    admin: "MERCHANT_READ_WRITE",
  },
};
```

### Create Metaobject Entry

```graphql
mutation createMetaobject($metaobject: MetaobjectCreateInput!) {
  metaobjectCreate(metaobject: $metaobject) {
    metaobject {
      id
      handle
      type
      fields {
        key
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

```json
{
  "metaobject": {
    "type": "faq",
    "handle": "shipping-times",
    "fields": [
      {
        "key": "question",
        "value": "How long does shipping take?"
      },
      {
        "key": "answer",
        "value": "<p>Standard shipping takes 5-7 business days.</p>"
      },
      {
        "key": "category",
        "value": "shipping"
      },
      {
        "key": "order",
        "value": "1"
      }
    ]
  }
}
```

### Query Metaobjects

```graphql
# Get all metaobjects of a type
query getMetaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        handle
        type
        fields {
          key
          value
          type
        }
      }
    }
  }
}

# Get single metaobject by handle
query getMetaobjectByHandle($handle: MetaobjectHandleInput!) {
  metaobjectByHandle(handle: $handle) {
    id
    handle
    type
    fields {
      key
      value
    }
  }
}
```

```json
{
  "handle": {
    "type": "faq",
    "handle": "shipping-times"
  }
}
```

### Update Metaobject

```graphql
mutation updateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
  metaobjectUpdate(id: $id, metaobject: $metaobject) {
    metaobject {
      id
      handle
      fields {
        key
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

### Delete Metaobject

```graphql
mutation deleteMetaobject($id: ID!) {
  metaobjectDelete(id: $id) {
    deletedId
    userErrors {
      field
      message
    }
  }
}
```

---

## METAOBJECT API CLASS

```typescript
// api/metaobjects.ts
import { AdminApiClient } from '@shopify/admin-api-client';

export class MetaobjectAPI {
  private client: AdminApiClient;

  constructor(client: AdminApiClient) {
    this.client = client;
  }

  // Create metaobject definition
  async createDefinition(definition: {
    type: string;
    name: string;
    description?: string;
    fieldDefinitions: Array<{
      key: string;
      name: string;
      type: string;
      required?: boolean;
      validations?: Array<{ name: string; value: string }>;
    }>;
    access?: {
      storefront: string;
      admin: string;
    };
  }): Promise<any> {
    const mutation = `
      mutation createDefinition($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition {
            id
            type
            name
            fieldDefinitions {
              key
              name
              type { name }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.request(mutation, {
      variables: { definition },
    });

    return response.data?.metaobjectDefinitionCreate;
  }

  // Create metaobject entry
  async create(
    type: string,
    handle: string,
    fields: Array<{ key: string; value: string }>
  ): Promise<any> {
    const mutation = `
      mutation createMetaobject($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
            handle
            type
            fields {
              key
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.request(mutation, {
      variables: { metaobject: { type, handle, fields } },
    });

    return response.data?.metaobjectCreate;
  }

  // Get all metaobjects of a type
  async getAll(type: string, first: number = 50): Promise<any[]> {
    const query = `
      query getMetaobjects($type: String!, $first: Int!) {
        metaobjects(type: $type, first: $first) {
          edges {
            node {
              id
              handle
              type
              fields {
                key
                value
                type
              }
            }
          }
        }
      }
    `;

    const response = await this.client.request(query, {
      variables: { type, first },
    });

    return response.data?.metaobjects?.edges.map((e: any) => e.node) || [];
  }

  // Get single metaobject by handle
  async getByHandle(type: string, handle: string): Promise<any> {
    const query = `
      query getMetaobjectByHandle($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) {
          id
          handle
          type
          fields {
            key
            value
          }
        }
      }
    `;

    const response = await this.client.request(query, {
      variables: { handle: { type, handle } },
    });

    return response.data?.metaobjectByHandle;
  }

  // Update metaobject
  async update(
    id: string,
    fields: Array<{ key: string; value: string }>
  ): Promise<any> {
    const mutation = `
      mutation updateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject {
            id
            handle
            fields {
              key
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.request(mutation, {
      variables: { id, metaobject: { fields } },
    });

    return response.data?.metaobjectUpdate;
  }

  // Delete metaobject
  async delete(id: string): Promise<boolean> {
    const mutation = `
      mutation deleteMetaobject($id: ID!) {
        metaobjectDelete(id: $id) {
          deletedId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.request(mutation, {
      variables: { id },
    });

    return !!response.data?.metaobjectDelete?.deletedId;
  }

  // Upsert metaobject
  async upsert(
    type: string,
    handle: string,
    fields: Array<{ key: string; value: string }>
  ): Promise<any> {
    const mutation = `
      mutation upsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
        metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
          metaobject {
            id
            handle
            type
            fields {
              key
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await this.client.request(mutation, {
      variables: {
        handle: { type, handle },
        metaobject: { fields },
      },
    });

    return response.data?.metaobjectUpsert;
  }
}
```

---

## STOREFRONT API ACCESS

### Enable Storefront Access

When creating metaobject definitions, set storefront access:

```json
{
  "access": {
    "storefront": "PUBLIC_READ"
  }
}
```

### Query from Storefront

```graphql
# Storefront API query for metaobjects
query getFAQs @inContext(language: EN, country: US) {
  metaobjects(type: "faq", first: 50) {
    nodes {
      id
      handle
      question: field(key: "question") { value }
      answer: field(key: "answer") { value }
      category: field(key: "category") { value }
    }
  }
}

# Get testimonials
query getTestimonials {
  metaobjects(type: "testimonial", first: 10, sortKey: "created_at", reverse: true) {
    nodes {
      customer_name: field(key: "customer_name") { value }
      quote: field(key: "quote") { value }
      rating: field(key: "rating") { value }
      photo: field(key: "photo") {
        reference {
          ... on MediaImage {
            image {
              url
              altText
            }
          }
        }
      }
    }
  }
}
```

### Access in Liquid Templates

```liquid
{% comment %} Access metaobject from product metafield {% endcomment %}
{% if product.metafields.custom.size_chart %}
  {% assign size_chart = product.metafields.custom.size_chart.value %}
  <div class="size-chart">
    <h3>{{ size_chart.name.value }}</h3>
    <div class="chart-data">
      {% assign sizes = size_chart.sizes.value | parse_json %}
      {% for size in sizes %}
        <div>{{ size.name }}: {{ size.chest }}" chest</div>
      {% endfor %}
    </div>
  </div>
{% endif %}

{% comment %} Access metaobjects directly {% endcomment %}
{% for faq in shop.metaobjects.faq.values %}
  <details>
    <summary>{{ faq.question.value }}</summary>
    <div>{{ faq.answer.value }}</div>
  </details>
{% endfor %}
```

---

## THEME INTEGRATION

### Accessing Metafields in Liquid

```liquid
{% comment %} Product metafields {% endcomment %}
{{ product.metafields.custom.subtitle.value }}
{{ product.metafields.custom.care_instructions.value }}
{{ product.metafields.custom.warranty_years.value }}

{% comment %} Check if metafield exists {% endcomment %}
{% if product.metafields.custom.is_featured %}
  <span class="badge">Featured</span>
{% endif %}

{% comment %} Rich text metafield {% endcomment %}
{% if product.metafields.custom.highlights %}
  <div class="highlights">
    {{ product.metafields.custom.highlights.value }}
  </div>
{% endif %}

{% comment %} JSON metafield {% endcomment %}
{% assign dimensions = product.metafields.custom.dimensions.value %}
{% if dimensions %}
  <ul class="dimensions">
    <li>Length: {{ dimensions.length }}{{ dimensions.unit }}</li>
    <li>Width: {{ dimensions.width }}{{ dimensions.unit }}</li>
    <li>Height: {{ dimensions.height }}{{ dimensions.unit }}</li>
  </ul>
{% endif %}

{% comment %} Reference metafields {% endcomment %}
{% if product.metafields.custom.related_products %}
  <div class="related-products">
    {% for related in product.metafields.custom.related_products.value %}
      {% render 'product-card', product: related %}
    {% endfor %}
  </div>
{% endif %}

{% comment %} File reference {% endcomment %}
{% if product.metafields.custom.size_guide %}
  <a href="{{ product.metafields.custom.size_guide.value | file_url }}">
    View Size Guide
  </a>
{% endif %}

{% comment %} Customer metafields {% endcomment %}
{% if customer %}
  <p>Loyalty Points: {{ customer.metafields.loyalty.points.value | default: 0 }}</p>
  <p>Tier: {{ customer.metafields.loyalty.tier.value | default: 'Bronze' }}</p>
{% endif %}
```

### JSON Template with Metafields

```json
{
  "name": "Product with Custom Data",
  "sections": {
    "main": {
      "type": "main-product",
      "blocks": {
        "title": { "type": "title" },
        "subtitle": {
          "type": "custom_liquid",
          "settings": {
            "source": "{% if product.metafields.custom.subtitle %}<p class=\"subtitle\">{{ product.metafields.custom.subtitle.value }}</p>{% endif %}"
          }
        },
        "price": { "type": "price" },
        "quantity_selector": { "type": "quantity_selector" },
        "buy_buttons": { "type": "buy_buttons" },
        "care_instructions": {
          "type": "collapsible_tab",
          "settings": {
            "heading": "Care Instructions",
            "content": "{{ product.metafields.custom.care_instructions.value }}"
          }
        }
      }
    }
  }
}
```

---

## BEST PRACTICES

### 1. Namespace Convention
```
custom.*         → General custom fields
app:my-app.*     → App-specific fields
loyalty.*        → Loyalty program fields
marketing.*      → Marketing/attribution
```

### 2. Validation
Always add validations when possible:
```json
{
  "validations": [
    { "name": "min", "value": "0" },
    { "name": "max", "value": "100" },
    { "name": "regex", "value": "^[a-z0-9-]+$" },
    { "name": "choices", "value": "[\"option1\",\"option2\"]" }
  ]
}
```

### 3. Pin Important Fields
Pin frequently used fields to make them visible in admin:
```json
{
  "pin": true
}
```

### 4. Use Definitions
Always create definitions before setting metafields for:
- Consistent data types
- Admin UI visibility
- Validation enforcement

---

## INVOCATION

```
/shopify-metafields
/metafields
/metaobjects
```

---

*SHOPIFY.METAFIELDS.EXE - Custom Data Everywhere*
