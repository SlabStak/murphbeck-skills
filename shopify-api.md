# SHOPIFY.API.EXE - Admin & Storefront API Integration

You are **SHOPIFY.API.EXE** - the comprehensive system for integrating with Shopify's GraphQL Admin API and Storefront API.

---

## SYSTEM IDENTITY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║    █████╗ ██████╗ ██╗    ██████╗  █████╗ ████████╗ █████╗                     ║
║   ██╔══██╗██╔══██╗██║    ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗                    ║
║   ███████║██████╔╝██║    ██║  ██║███████║   ██║   ███████║                    ║
║   ██╔══██║██╔═══╝ ██║    ██║  ██║██╔══██║   ██║   ██╔══██║                    ║
║   ██║  ██║██║     ██║    ██████╔╝██║  ██║   ██║   ██║  ██║                    ║
║   ╚═╝  ╚═╝╚═╝     ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝                    ║
║                                                                               ║
║   API INTEGRATION ENGINE                                                      ║
║   Admin API • Storefront API • GraphQL                                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## CORE CAPABILITIES

### Admin API
- **Products**: CRUD operations, variants, inventory
- **Orders**: Management, fulfillment, refunds
- **Customers**: Accounts, segments, metafields
- **Inventory**: Levels, adjustments, locations

### Storefront API
- **Cart**: Create, update, checkout
- **Products**: Query for storefront display
- **Collections**: Browse and filter
- **Customer**: Authentication and account

---

## API CLIENT SETUP

```typescript
/**
 * Shopify API Client - Complete Integration Library
 */

import { createAdminApiClient, createStorefrontApiClient } from '@shopify/admin-api-client';

// ============================================
// CONFIGURATION
// ============================================

interface ShopifyConfig {
  shopDomain: string;
  adminAccessToken: string;
  storefrontAccessToken: string;
  apiVersion: string;
}

const config: ShopifyConfig = {
  shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
  adminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
  storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
  apiVersion: '2025-01',
};

// ============================================
// ADMIN API CLIENT
// ============================================

const adminClient = createAdminApiClient({
  storeDomain: config.shopDomain,
  apiVersion: config.apiVersion,
  accessToken: config.adminAccessToken,
});

// ============================================
// STOREFRONT API CLIENT
// ============================================

const storefrontClient = createStorefrontApiClient({
  storeDomain: config.shopDomain,
  apiVersion: config.apiVersion,
  publicAccessToken: config.storefrontAccessToken,
});

// ============================================
// PRODUCT OPERATIONS
// ============================================

class ProductAPI {
  /**
   * Get all products with pagination
   */
  static async listProducts(first: number = 50, after?: string) {
    const query = `
      query ListProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              handle
              status
              vendor
              productType
              totalInventory
              tracksInventory
              createdAt
              updatedAt
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              featuredImage {
                url
                altText
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    sku
                    price
                    compareAtPrice
                    inventoryQuantity
                    inventoryPolicy
                  }
                }
              }
              options {
                id
                name
                values
              }
              tags
            }
          }
        }
      }
    `;

    const response = await adminClient.request(query, {
      variables: { first, after },
    });

    return response.data.products;
  }

  /**
   * Get product by ID
   */
  static async getProduct(id: string) {
    const query = `
      query GetProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          descriptionHtml
          status
          vendor
          productType
          totalInventory
          tags
          options {
            id
            name
            values
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                price
                compareAtPrice
                inventoryQuantity
                selectedOptions {
                  name
                  value
                }
                image {
                  url
                  altText
                }
              }
            }
          }
          images(first: 20) {
            edges {
              node {
                id
                url
                altText
                width
                height
              }
            }
          }
          metafields(first: 20) {
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
    `;

    const response = await adminClient.request(query, {
      variables: { id },
    });

    return response.data.product;
  }

  /**
   * Create a new product
   */
  static async createProduct(input: ProductCreateInput) {
    const mutation = `
      mutation ProductCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { input },
    });

    if (response.data.productCreate.userErrors.length > 0) {
      throw new Error(response.data.productCreate.userErrors[0].message);
    }

    return response.data.productCreate.product;
  }

  /**
   * Update an existing product
   */
  static async updateProduct(input: ProductUpdateInput) {
    const mutation = `
      mutation ProductUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            handle
            status
            updatedAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { input },
    });

    if (response.data.productUpdate.userErrors.length > 0) {
      throw new Error(response.data.productUpdate.userErrors[0].message);
    }

    return response.data.productUpdate.product;
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: string) {
    const mutation = `
      mutation ProductDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { input: { id } },
    });

    if (response.data.productDelete.userErrors.length > 0) {
      throw new Error(response.data.productDelete.userErrors[0].message);
    }

    return response.data.productDelete.deletedProductId;
  }

  /**
   * Create product variants
   */
  static async createVariants(productId: string, variants: VariantInput[]) {
    const mutation = `
      mutation ProductVariantsBulkCreate(
        $productId: ID!
        $variants: [ProductVariantsBulkInput!]!
      ) {
        productVariantsBulkCreate(productId: $productId, variants: $variants) {
          productVariants {
            id
            title
            sku
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { productId, variants },
    });

    return response.data.productVariantsBulkCreate;
  }

  /**
   * Update product images
   */
  static async updateProductImages(productId: string, images: ImageInput[]) {
    const mutation = `
      mutation ProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media {
            ... on MediaImage {
              id
              image {
                url
              }
            }
          }
          mediaUserErrors {
            field
            message
          }
        }
      }
    `;

    const mediaInput = images.map(img => ({
      originalSource: img.src,
      mediaContentType: 'IMAGE',
      alt: img.altText,
    }));

    const response = await adminClient.request(mutation, {
      variables: { productId, media: mediaInput },
    });

    return response.data.productCreateMedia;
  }
}

// ============================================
// ORDER OPERATIONS
// ============================================

class OrderAPI {
  /**
   * Get all orders with pagination
   */
  static async listOrders(first: number = 50, query?: string) {
    const gqlQuery = `
      query ListOrders($first: Int!, $query: String) {
        orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              name
              email
              createdAt
              processedAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              subtotalPriceSet {
                shopMoney {
                  amount
                }
              }
              totalShippingPriceSet {
                shopMoney {
                  amount
                }
              }
              totalTaxSet {
                shopMoney {
                  amount
                }
              }
              customer {
                id
                firstName
                lastName
                email
              }
              lineItems(first: 50) {
                edges {
                  node {
                    id
                    title
                    quantity
                    sku
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                    variant {
                      id
                      title
                    }
                    product {
                      id
                      title
                    }
                  }
                }
              }
              shippingAddress {
                address1
                address2
                city
                province
                country
                zip
                phone
              }
              fulfillments {
                id
                status
                trackingInfo {
                  company
                  number
                  url
                }
              }
            }
          }
        }
      }
    `;

    const response = await adminClient.request(gqlQuery, {
      variables: { first, query },
    });

    return response.data.orders;
  }

  /**
   * Get order by ID
   */
  static async getOrder(id: string) {
    const query = `
      query GetOrder($id: ID!) {
        order(id: $id) {
          id
          name
          email
          phone
          createdAt
          processedAt
          closedAt
          cancelledAt
          displayFinancialStatus
          displayFulfillmentStatus
          note
          tags
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          subtotalPriceSet {
            shopMoney {
              amount
            }
          }
          totalShippingPriceSet {
            shopMoney {
              amount
            }
          }
          totalTaxSet {
            shopMoney {
              amount
            }
          }
          totalDiscountsSet {
            shopMoney {
              amount
            }
          }
          customer {
            id
            firstName
            lastName
            email
            phone
            numberOfOrders
          }
          shippingAddress {
            name
            address1
            address2
            city
            province
            provinceCode
            country
            countryCodeV2
            zip
            phone
          }
          billingAddress {
            name
            address1
            address2
            city
            province
            country
            zip
          }
          lineItems(first: 100) {
            edges {
              node {
                id
                title
                quantity
                sku
                variantTitle
                originalUnitPriceSet {
                  shopMoney {
                    amount
                  }
                }
                discountedUnitPriceSet {
                  shopMoney {
                    amount
                  }
                }
                variant {
                  id
                  title
                  sku
                  product {
                    id
                    title
                  }
                }
              }
            }
          }
          fulfillments {
            id
            status
            createdAt
            updatedAt
            deliveredAt
            trackingInfo {
              company
              number
              url
            }
            fulfillmentLineItems(first: 50) {
              edges {
                node {
                  id
                  quantity
                  lineItem {
                    id
                    title
                  }
                }
              }
            }
          }
          transactions {
            id
            kind
            status
            gateway
            amountSet {
              shopMoney {
                amount
              }
            }
          }
          refunds {
            id
            createdAt
            note
            refundLineItems(first: 20) {
              edges {
                node {
                  quantity
                  lineItem {
                    id
                    title
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await adminClient.request(query, {
      variables: { id },
    });

    return response.data.order;
  }

  /**
   * Create fulfillment
   */
  static async createFulfillment(input: FulfillmentInput) {
    const mutation = `
      mutation FulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
        fulfillmentCreateV2(fulfillment: $fulfillment) {
          fulfillment {
            id
            status
            trackingInfo {
              company
              number
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { fulfillment: input },
    });

    return response.data.fulfillmentCreateV2;
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string, reason: string = 'OTHER') {
    const mutation = `
      mutation OrderCancel($orderId: ID!, $reason: OrderCancelReason!, $refund: Boolean!, $restock: Boolean!) {
        orderCancel(orderId: $orderId, reason: $reason, refund: $refund, restock: $restock) {
          job {
            id
            done
          }
          orderCancelUserErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: {
        orderId,
        reason,
        refund: true,
        restock: true,
      },
    });

    return response.data.orderCancel;
  }

  /**
   * Add order note
   */
  static async updateOrderNote(id: string, note: string) {
    const mutation = `
      mutation OrderUpdate($input: OrderInput!) {
        orderUpdate(input: $input) {
          order {
            id
            note
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { input: { id, note } },
    });

    return response.data.orderUpdate;
  }
}

// ============================================
// CUSTOMER OPERATIONS
// ============================================

class CustomerAPI {
  /**
   * List customers
   */
  static async listCustomers(first: number = 50, query?: string) {
    const gqlQuery = `
      query ListCustomers($first: Int!, $query: String) {
        customers(first: $first, query: $query) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              firstName
              lastName
              email
              phone
              createdAt
              updatedAt
              numberOfOrders
              amountSpent {
                amount
                currencyCode
              }
              defaultAddress {
                address1
                city
                province
                country
                zip
              }
              tags
              taxExempt
              state
              verifiedEmail
            }
          }
        }
      }
    `;

    const response = await adminClient.request(gqlQuery, {
      variables: { first, query },
    });

    return response.data.customers;
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(id: string) {
    const query = `
      query GetCustomer($id: ID!) {
        customer(id: $id) {
          id
          firstName
          lastName
          email
          phone
          createdAt
          updatedAt
          numberOfOrders
          amountSpent {
            amount
            currencyCode
          }
          addresses {
            id
            address1
            address2
            city
            province
            country
            zip
            phone
          }
          defaultAddress {
            id
            address1
            city
            province
            country
            zip
          }
          tags
          note
          taxExempt
          state
          verifiedEmail
          acceptsMarketing
          acceptsMarketingUpdatedAt
          metafields(first: 20) {
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
          orders(first: 10) {
            edges {
              node {
                id
                name
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                displayFulfillmentStatus
                displayFinancialStatus
              }
            }
          }
        }
      }
    `;

    const response = await adminClient.request(query, {
      variables: { id },
    });

    return response.data.customer;
  }

  /**
   * Create customer
   */
  static async createCustomer(input: CustomerCreateInput) {
    const mutation = `
      mutation CustomerCreate($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer {
            id
            firstName
            lastName
            email
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { input },
    });

    return response.data.customerCreate;
  }

  /**
   * Update customer
   */
  static async updateCustomer(input: CustomerUpdateInput) {
    const mutation = `
      mutation CustomerUpdate($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            firstName
            lastName
            email
            updatedAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { input },
    });

    return response.data.customerUpdate;
  }
}

// ============================================
// INVENTORY OPERATIONS
// ============================================

class InventoryAPI {
  /**
   * Get inventory levels for a product
   */
  static async getInventoryLevels(inventoryItemId: string) {
    const query = `
      query GetInventoryLevels($inventoryItemId: ID!) {
        inventoryItem(id: $inventoryItemId) {
          id
          sku
          tracked
          inventoryLevels(first: 20) {
            edges {
              node {
                id
                available
                location {
                  id
                  name
                  address {
                    city
                    country
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await adminClient.request(query, {
      variables: { inventoryItemId },
    });

    return response.data.inventoryItem;
  }

  /**
   * Adjust inventory quantity
   */
  static async adjustInventory(input: InventoryAdjustInput) {
    const mutation = `
      mutation InventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) {
          inventoryAdjustmentGroup {
            createdAt
            reason
            changes {
              name
              delta
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { input },
    });

    return response.data.inventoryAdjustQuantities;
  }

  /**
   * Set inventory level
   */
  static async setInventoryLevel(
    inventoryItemId: string,
    locationId: string,
    available: number
  ) {
    const mutation = `
      mutation InventorySetOnHandQuantities($input: InventorySetOnHandQuantitiesInput!) {
        inventorySetOnHandQuantities(input: $input) {
          inventoryAdjustmentGroup {
            createdAt
            reason
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: {
        input: {
          reason: 'correction',
          setQuantities: [
            {
              inventoryItemId,
              locationId,
              quantity: available,
            },
          ],
        },
      },
    });

    return response.data.inventorySetOnHandQuantities;
  }

  /**
   * Get locations
   */
  static async getLocations() {
    const query = `
      query GetLocations {
        locations(first: 20) {
          edges {
            node {
              id
              name
              isActive
              fulfillsOnlineOrders
              address {
                address1
                city
                province
                country
                zip
              }
            }
          }
        }
      }
    `;

    const response = await adminClient.request(query);
    return response.data.locations;
  }
}

// ============================================
// COLLECTION OPERATIONS
// ============================================

class CollectionAPI {
  /**
   * List collections
   */
  static async listCollections(first: number = 50) {
    const query = `
      query ListCollections($first: Int!) {
        collections(first: $first) {
          edges {
            node {
              id
              title
              handle
              descriptionHtml
              productsCount
              sortOrder
              image {
                url
                altText
              }
              ruleSet {
                appliedDisjunctively
                rules {
                  column
                  relation
                  condition
                }
              }
            }
          }
        }
      }
    `;

    const response = await adminClient.request(query, {
      variables: { first },
    });

    return response.data.collections;
  }

  /**
   * Create manual collection
   */
  static async createCollection(input: CollectionCreateInput) {
    const mutation = `
      mutation CollectionCreate($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection {
            id
            title
            handle
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { input },
    });

    return response.data.collectionCreate;
  }

  /**
   * Add products to collection
   */
  static async addProductsToCollection(collectionId: string, productIds: string[]) {
    const mutation = `
      mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          collection {
            id
            title
            productsCount
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { id: collectionId, productIds },
    });

    return response.data.collectionAddProducts;
  }
}

// ============================================
// STOREFRONT API OPERATIONS
// ============================================

class StorefrontAPI {
  /**
   * Get products for storefront
   */
  static async getProducts(first: number = 20) {
    const query = `
      query GetProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              availableForSale
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                    width
                    height
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    price {
                      amount
                      currencyCode
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await storefrontClient.request(query, {
      variables: { first },
    });

    return response.data.products;
  }

  /**
   * Create cart
   */
  static async createCart(lines?: CartLineInput[]) {
    const mutation = `
      mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 100) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        title
                        handle
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await storefrontClient.request(mutation, {
      variables: {
        input: { lines: lines || [] },
      },
    });

    return response.data.cartCreate;
  }

  /**
   * Add items to cart
   */
  static async addToCart(cartId: string, lines: CartLineInput[]) {
    const mutation = `
      mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await storefrontClient.request(mutation, {
      variables: { cartId, lines },
    });

    return response.data.cartLinesAdd;
  }

  /**
   * Update cart lines
   */
  static async updateCartLines(cartId: string, lines: CartLineUpdateInput[]) {
    const mutation = `
      mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            id
            totalQuantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await storefrontClient.request(mutation, {
      variables: { cartId, lines },
    });

    return response.data.cartLinesUpdate;
  }

  /**
   * Customer login
   */
  static async customerLogin(email: string, password: string) {
    const mutation = `
      mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            field
            message
          }
        }
      }
    `;

    const response = await storefrontClient.request(mutation, {
      variables: { input: { email, password } },
    });

    return response.data.customerAccessTokenCreate;
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

class BulkOperationsAPI {
  /**
   * Run bulk query
   */
  static async runBulkQuery(query: string) {
    const mutation = `
      mutation BulkOperationRunQuery($query: String!) {
        bulkOperationRunQuery(query: $query) {
          bulkOperation {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await adminClient.request(mutation, {
      variables: { query },
    });

    return response.data.bulkOperationRunQuery;
  }

  /**
   * Check bulk operation status
   */
  static async getBulkOperationStatus() {
    const query = `
      query CurrentBulkOperation {
        currentBulkOperation {
          id
          status
          errorCode
          createdAt
          completedAt
          objectCount
          fileSize
          url
          partialDataUrl
        }
      }
    `;

    const response = await adminClient.request(query);
    return response.data.currentBulkOperation;
  }

  /**
   * Poll until bulk operation completes
   */
  static async waitForBulkOperation(pollInterval: number = 5000): Promise<BulkOperation> {
    while (true) {
      const operation = await this.getBulkOperationStatus();

      if (!operation) {
        throw new Error('No bulk operation found');
      }

      if (operation.status === 'COMPLETED') {
        return operation;
      }

      if (operation.status === 'FAILED') {
        throw new Error(`Bulk operation failed: ${operation.errorCode}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Export all products
   */
  static async exportAllProducts() {
    const bulkQuery = `
      {
        products {
          edges {
            node {
              id
              title
              handle
              status
              totalInventory
              variants {
                edges {
                  node {
                    id
                    sku
                    price
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
      }
    `;

    await this.runBulkQuery(bulkQuery);
    return this.waitForBulkOperation();
  }

  /**
   * Export all orders
   */
  static async exportAllOrders(query?: string) {
    const bulkQuery = `
      {
        orders${query ? `(query: "${query}")` : ''} {
          edges {
            node {
              id
              name
              email
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              lineItems {
                edges {
                  node {
                    id
                    title
                    quantity
                    sku
                  }
                }
              }
            }
          }
        }
      }
    `;

    await this.runBulkQuery(bulkQuery);
    return this.waitForBulkOperation();
  }
}

// Export all API classes
export {
  ProductAPI,
  OrderAPI,
  CustomerAPI,
  InventoryAPI,
  CollectionAPI,
  StorefrontAPI,
  BulkOperationsAPI,
};
```

---

## TYPE DEFINITIONS

```typescript
// Product types
interface ProductCreateInput {
  title: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  options?: string[];
  variants?: VariantInput[];
  images?: ImageInput[];
  metafields?: MetafieldInput[];
}

interface ProductUpdateInput extends ProductCreateInput {
  id: string;
}

interface VariantInput {
  price: string;
  sku?: string;
  barcode?: string;
  compareAtPrice?: string;
  options?: string[];
  inventoryPolicy?: 'DENY' | 'CONTINUE';
  inventoryQuantities?: InventoryQuantityInput[];
}

interface ImageInput {
  src: string;
  altText?: string;
}

// Customer types
interface CustomerCreateInput {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  addresses?: AddressInput[];
  tags?: string[];
  note?: string;
  acceptsMarketing?: boolean;
  metafields?: MetafieldInput[];
}

interface CustomerUpdateInput extends CustomerCreateInput {
  id: string;
}

// Inventory types
interface InventoryAdjustInput {
  reason: string;
  name: string;
  changes: InventoryChangeInput[];
}

interface InventoryChangeInput {
  delta: number;
  inventoryItemId: string;
  locationId: string;
}

// Collection types
interface CollectionCreateInput {
  title: string;
  descriptionHtml?: string;
  image?: ImageInput;
  products?: string[];
  ruleSet?: CollectionRuleSetInput;
}

// Cart types
interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes?: AttributeInput[];
}

interface CartLineUpdateInput {
  id: string;
  quantity: number;
}

// Metafield types
interface MetafieldInput {
  namespace: string;
  key: string;
  value: string;
  type: string;
}
```

---

## INVOCATION

```
/shopify-api
/shopify-graphql
/admin-api
```

---

*SHOPIFY.API.EXE - Complete API Integration*
