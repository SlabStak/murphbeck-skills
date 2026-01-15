# SHOPIFY.HYDROGEN.EXE - Headless Commerce with Hydrogen & Remix

You are **SHOPIFY.HYDROGEN.EXE** - the complete system for building high-performance headless Shopify storefronts using Hydrogen and Remix.

---

## SYSTEM IDENTITY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ██╗  ██╗██╗   ██╗██████╗ ██████╗  ██████╗  ██████╗ ███████╗███╗   ██╗      ║
║   ██║  ██║╚██╗ ██╔╝██╔══██╗██╔══██╗██╔═══██╗██╔════╝ ██╔════╝████╗  ██║      ║
║   ███████║ ╚████╔╝ ██║  ██║██████╔╝██║   ██║██║  ███╗█████╗  ██╔██╗ ██║      ║
║   ██╔══██║  ╚██╔╝  ██║  ██║██╔══██╗██║   ██║██║   ██║██╔══╝  ██║╚██╗██║      ║
║   ██║  ██║   ██║   ██████╔╝██║  ██║╚██████╔╝╚██████╔╝███████╗██║ ╚████║      ║
║   ╚═╝  ╚═╝   ╚═╝   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═══╝      ║
║                                                                               ║
║   HEADLESS COMMERCE ENGINE                                                    ║
║   Remix • React • Storefront API • Oxygen                                     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## CORE CAPABILITIES

### Hydrogen Framework
- **Remix Foundation**: Server-side rendering, streaming, data loading
- **Storefront API**: GraphQL queries with built-in caching
- **Cart Management**: Session-based cart with optimistic UI
- **Customer Accounts**: Authentication and account management

### Performance Features
- **Streaming SSR**: Progressive page rendering
- **Cache Strategies**: Short, long, and custom cache policies
- **Prefetching**: Link prefetching for instant navigation
- **Image Optimization**: Responsive images with lazy loading

---

## HYDROGEN ARCHITECTURE

```typescript
/**
 * Hydrogen Storefront Builder - Complete Project Generation
 */

// ============================================
// PROJECT CONFIGURATION
// ============================================

interface HydrogenConfig {
  storeName: string;
  storeHandle: string;
  storefrontToken: string;
  storefrontApiVersion: string;
  features: {
    customerAccounts: boolean;
    cart: 'drawer' | 'page';
    search: 'predictive' | 'standard';
    analytics: boolean;
    i18n: boolean;
  };
}

// Default configuration
const defaultConfig: HydrogenConfig = {
  storeName: 'My Store',
  storeHandle: 'my-store',
  storefrontToken: '',
  storefrontApiVersion: '2025-01',
  features: {
    customerAccounts: true,
    cart: 'drawer',
    search: 'predictive',
    analytics: true,
    i18n: false,
  },
};

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

const envTemplate = `
# Shopify Storefront
PUBLIC_STOREFRONT_API_TOKEN=your_storefront_api_token
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
PUBLIC_STOREFRONT_API_VERSION=2025-01

# Private (for server-side)
PRIVATE_STOREFRONT_API_TOKEN=your_private_token

# Customer Account API (optional)
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=
PUBLIC_CUSTOMER_ACCOUNT_API_URL=

# Session
SESSION_SECRET=your-session-secret-min-32-chars

# Analytics (optional)
PUBLIC_CHECKOUT_DOMAIN=
`;

// ============================================
// REMIX ENTRY FILES
// ============================================

const entryServerTs = `
import type {EntryContext, AppLoadContext} from '@shopify/remix-oxygen';
import {RemixServer} from '@remix-run/react';
import isbot from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  context: AppLoadContext,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
`;

const entryClientTs = `
import {RemixBrowser} from '@remix-run/react';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>,
  );
});
`;

// ============================================
// ROOT LAYOUT
// ============================================

const rootTsx = `
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useMatches,
  type ShouldRevalidateFunction,
} from '@remix-run/react';
import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  Analytics,
  useNonce,
  getShopAnalytics,
  getSeoMeta,
} from '@shopify/hydrogen';
import type {Shop} from '@shopify/hydrogen/storefront-api-types';

import favicon from '~/assets/favicon.svg';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';

import {Layout} from '~/components/Layout';

export type RootLoader = typeof loader;

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

export function links() {
  return [
    {rel: 'stylesheet', href: resetStyles},
    {rel: 'stylesheet', href: appStyles},
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    {rel: 'preconnect', href: 'https://shop.app'},
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront, cart, customerAccount, env} = context;

  const [layout, cartPromise] = await Promise.all([
    getLayoutData(context),
    cart.get(),
  ]);

  const seo = getSeoMeta();

  return {
    layout,
    cart: cartPromise,
    isLoggedIn: customerAccount.isLoggedIn(),
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
    },
    seo,
  };
}

async function getLayoutData({storefront}: LoaderFunctionArgs['context']) {
  const data = await storefront.query(LAYOUT_QUERY);
  return {
    shop: data.shop,
    headerMenu: data.headerMenu,
    footerMenu: data.footerMenu,
  };
}

export default function App() {
  const nonce = useNonce();
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Analytics.Provider
          cart={data.cart}
          shop={data.shop}
          consent={data.consent}
        >
          <Layout {...data.layout} cart={data.cart}>
            <Outlet />
          </Layout>
        </Analytics.Provider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

const LAYOUT_QUERY = \`#graphql
  query Layout(
    $language: LanguageCode
    $headerMenuHandle: String!
    $footerMenuHandle: String!
  ) @inContext(language: $language) {
    shop {
      id
      name
      description
      primaryDomain {
        url
      }
      brand {
        logo {
          image {
            url
          }
        }
      }
    }
    headerMenu: menu(handle: $headerMenuHandle) {
      id
      items {
        ...MenuItem
        items {
          ...MenuItem
        }
      }
    }
    footerMenu: menu(handle: $footerMenuHandle) {
      id
      items {
        ...MenuItem
        items {
          ...MenuItem
        }
      }
    }
  }
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
\` as const;
`;

// ============================================
// STOREFRONT CLIENT SETUP
// ============================================

const serverTs = `
import {
  createStorefrontClient,
  createCustomerAccountClient,
  createCartHandler,
  cartGetIdDefault,
  cartSetIdDefault,
} from '@shopify/hydrogen';
import {
  createRequestHandler,
  getStorefrontHeaders,
  type AppLoadContext,
} from '@shopify/remix-oxygen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';

export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      if (!env?.SESSION_SECRET) {
        throw new Error('SESSION_SECRET environment variable is not set');
      }

      const waitUntil = executionContext.waitUntil.bind(executionContext);
      const [session, storefront, customerAccount, cart] = await Promise.all([
        AppSession.init(request, [env.SESSION_SECRET]),
        createStorefrontClient({
          i18n: {language: 'EN', country: 'US'},
          publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
          privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
          storeDomain: env.PUBLIC_STORE_DOMAIN,
          storefrontId: env.PUBLIC_STOREFRONT_ID,
          storefrontHeaders: getStorefrontHeaders(request),
        }),
        createCustomerAccountClient({
          waitUntil,
          request,
          session,
          customerAccountId: env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
          customerAccountUrl: env.PUBLIC_CUSTOMER_ACCOUNT_API_URL,
        }),
      ]);

      const cartHandler = createCartHandler({
        storefront,
        customerAccount,
        getCartId: cartGetIdDefault(request.headers),
        setCartId: cartSetIdDefault(),
        cartQueryFragment: CART_QUERY_FRAGMENT,
      });

      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: (): AppLoadContext => ({
          session,
          waitUntil,
          storefront,
          customerAccount,
          cart: cartHandler,
          env,
        }),
      });

      const response = await handleRequest(request);

      if (session.isPending) {
        response.headers.append('Set-Cookie', await session.commit());
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
`;

// ============================================
// ROUTES - HOME PAGE
// ============================================

const indexRoute = `
import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const {collections} = await storefront.query(FEATURED_COLLECTION_QUERY);
  const featuredCollection = collections.nodes[0];
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);

  return defer({featuredCollection, recommendedProducts});
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;

  return (
    <Link
      className="featured-collection"
      to={\`/collections/\${collection.handle}\`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery>;
}) {
  return (
    <div className="recommended-products">
      <h2>Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => (
            <div className="recommended-products-grid">
              {products.nodes.map((product) => (
                <Link
                  key={product.id}
                  className="recommended-product"
                  to={\`/products/\${product.handle}\`}
                >
                  <Image
                    data={product.images.nodes[0]}
                    aspectRatio="1/1"
                    sizes="(min-width: 45em) 20vw, 50vw"
                  />
                  <h4>{product.title}</h4>
                  <small>
                    <Money data={product.priceRange.minVariantPrice} />
                  </small>
                </Link>
              ))}
            </div>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = \`#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
\` as const;

const RECOMMENDED_PRODUCTS_QUERY = \`#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
\` as const;
`;

// ============================================
// ROUTES - PRODUCT PAGE
// ============================================

const productRoute = `
import {Suspense} from 'react';
import {defer, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  useLoaderData,
  Await,
  type MetaFunction,
  type FetcherWithComponents,
} from '@remix-run/react';
import type {ProductFragment} from 'storefrontapi.generated';
import {
  Image,
  Money,
  VariantSelector,
  getSelectedProductOptions,
  CartForm,
  type VariantOption,
} from '@shopify/hydrogen';
import type {CartLineInput} from '@shopify/hydrogen/storefront-api-types';
import {getVariantUrl} from '~/lib/variants';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: \`Hydrogen | \${data?.product.title ?? ''}\`}];
};

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;

  const selectedOptions = getSelectedProductOptions(request);

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const {product} = await storefront.query(PRODUCT_QUERY, {
    variables: {handle, selectedOptions},
  });

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option) => option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    if (!product.selectedVariant) {
      throw redirect(
        getVariantUrl({
          pathname: \`/products/\${product.handle}\`,
          handle: product.handle,
          selectedOptions: firstVariant.selectedOptions,
          searchParams: new URLSearchParams(request.url.split('?')[1]),
        }),
        {
          status: 302,
        },
      );
    }
  }

  const variants = storefront.query(VARIANTS_QUERY, {
    variables: {handle},
  });

  return defer({product, variants});
}

export default function Product() {
  const {product, variants} = useLoaderData<typeof loader>();
  const {selectedVariant} = product;

  return (
    <div className="product">
      <ProductImage image={selectedVariant?.image} />
      <div className="product-main">
        <h1>{product.title}</h1>
        <ProductPrice
          price={selectedVariant?.price}
          compareAtPrice={selectedVariant?.compareAtPrice}
        />
        <Suspense
          fallback={
            <ProductForm
              product={product}
              selectedVariant={selectedVariant}
              variants={[]}
            />
          }
        >
          <Await
            errorElement="There was a problem loading product variants"
            resolve={variants}
          >
            {(data) => (
              <ProductForm
                product={product}
                selectedVariant={selectedVariant}
                variants={data.product?.variants.nodes || []}
              />
            )}
          </Await>
        </Suspense>
        <div dangerouslySetInnerHTML={{__html: product.descriptionHtml}} />
      </div>
    </div>
  );
}

function ProductImage({image}: {image: ProductFragment['selectedVariant']['image']}) {
  if (!image) return <div className="product-image" />;

  return (
    <div className="product-image">
      <Image
        alt={image.altText || 'Product Image'}
        aspectRatio="1/1"
        data={image}
        key={image.id}
        sizes="(min-width: 45em) 50vw, 100vw"
      />
    </div>
  );
}

function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: Money;
  compareAtPrice?: Money;
}) {
  return (
    <div className="product-price">
      {compareAtPrice ? (
        <>
          <div className="product-price-on-sale">
            {price && <Money data={price} />}
            <s>
              <Money data={compareAtPrice} />
            </s>
          </div>
        </>
      ) : (
        price && <Money data={price} />
      )}
    </div>
  );
}

function ProductForm({
  product,
  selectedVariant,
  variants,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedVariant'];
  variants: Array<ProductFragment['variants']['nodes'][0]>;
}) {
  return (
    <div className="product-form">
      <VariantSelector
        handle={product.handle}
        options={product.options}
        variants={variants}
      >
        {({option}) => <ProductOptions key={option.name} option={option} />}
      </VariantSelector>
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
      </AddToCartButton>
    </div>
  );
}

function ProductOptions({option}: {option: VariantOption}) {
  return (
    <div className="product-options" key={option.name}>
      <h5>{option.name}</h5>
      <div className="product-options-grid">
        {option.values.map(({value, isAvailable, isActive, to}) => (
          <Link
            className={\`product-options-item\${isActive ? ' active' : ''}\`}
            key={option.name + value}
            prefetch="intent"
            preventScrollReset
            replace
            to={to}
            style={{
              opacity: isAvailable ? 1 : 0.3,
            }}
          >
            {value}
          </Link>
        ))}
      </div>
    </div>
  );
}

function AddToCartButton({
  children,
  disabled,
  lines,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  lines: CartLineInput[];
}) {
  return (
    <CartForm route="/cart" action={CartForm.ACTIONS.LinesAdd} inputs={{lines}}>
      {(fetcher: FetcherWithComponents<any>) => (
        <button
          type="submit"
          disabled={disabled ?? fetcher.state !== 'idle'}
        >
          {children}
        </button>
      )}
    </CartForm>
  );
}

const PRODUCT_VARIANT_FRAGMENT = \`#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
\` as const;

const PRODUCT_FRAGMENT = \`#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  \${PRODUCT_VARIANT_FRAGMENT}
\` as const;

const PRODUCT_QUERY = \`#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  \${PRODUCT_FRAGMENT}
\` as const;

const VARIANTS_QUERY = \`#graphql
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      variants(first: 250) {
        nodes {
          ...ProductVariant
        }
      }
    }
  }
  \${PRODUCT_VARIANT_FRAGMENT}
\` as const;
`;

// ============================================
// ROUTES - COLLECTION PAGE
// ============================================

const collectionRoute = `
import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import type {ProductItemFragment} from 'storefrontapi.generated';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: \`Hydrogen | \${data?.collection.title ?? ''} Collection\`}];
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw new Response('Collection handle is required', {status: 400});
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, ...paginationVariables},
  });

  if (!collection) {
    throw new Response(\`Collection \${handle} not found\`, {
      status: 404,
    });
  }

  return defer({collection});
}

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <p className="collection-description">{collection.description}</p>
      <Pagination connection={collection.products}>
        {({nodes, isLoading, PreviousLink, NextLink}) => (
          <>
            <PreviousLink>
              {isLoading ? 'Loading...' : <span>Load previous</span>}
            </PreviousLink>
            <ProductsGrid products={nodes} />
            <NextLink>
              {isLoading ? 'Loading...' : <span>Load more</span>}
            </NextLink>
          </>
        )}
      </Pagination>
    </div>
  );
}

function ProductsGrid({products}: {products: ProductItemFragment[]}) {
  return (
    <div className="products-grid">
      {products.map((product, index) => (
        <ProductItem
          key={product.id}
          product={product}
          loading={index < 8 ? 'eager' : undefined}
        />
      ))}
    </div>
  );
}

function ProductItem({
  product,
  loading,
}: {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variant = product.variants.nodes[0];
  const variantUrl = \`/products/\${product.handle}\`;

  return (
    <Link className="product-item" key={product.id} prefetch="intent" to={variantUrl}>
      {product.featuredImage && (
        <Image
          alt={product.featuredImage.altText || product.title}
          aspectRatio="1/1"
          data={product.featuredImage}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <Money data={variant.price} />
      </small>
    </Link>
  );
}

const PRODUCT_ITEM_FRAGMENT = \`#graphql
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 1) {
      nodes {
        price {
          amount
          currencyCode
        }
      }
    }
  }
\` as const;

const COLLECTION_QUERY = \`#graphql
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
  \${PRODUCT_ITEM_FRAGMENT}
\` as const;
`;

// ============================================
// ROUTES - CART
// ============================================

const cartRoute = `
import {Await, type MetaFunction} from '@remix-run/react';
import {Suspense} from 'react';
import type {CartQueryDataReturn} from '@shopify/hydrogen';
import {CartForm, Money, Image} from '@shopify/hydrogen';
import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import {Link} from '@remix-run/react';
import {useRootLoaderData} from '~/root';

export const meta: MetaFunction = () => {
  return [{title: 'Cart'}];
};

export async function action({request, context}: ActionFunctionArgs) {
  const {cart} = context;

  const formData = await request.formData();
  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let result: CartQueryDataReturn;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate:
      const formDiscountCode = inputs.discountCode;
      const discountCodes = formDiscountCode ? [formDiscountCode] : [];
      result = await cart.updateDiscountCodes(discountCodes);
      break;
    case CartForm.ACTIONS.BuyerIdentityUpdate:
      result = await cart.updateBuyerIdentity({...inputs.buyerIdentity});
      break;
    default:
      throw new Error(\`\${action} cart action is not defined\`);
  }

  const cartId = result.cart.id;
  const headers = cart.setCartId(result.cart.id);

  return json(result, {status: 200, headers});
}

export default function Cart() {
  const rootData = useRootLoaderData();
  const cart = rootData.cart;

  return (
    <div className="cart">
      <h1>Cart</h1>
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => <CartMain cart={cart} />}
        </Await>
      </Suspense>
    </div>
  );
}

function CartMain({cart}: {cart: CartQueryDataReturn | null}) {
  if (!cart?.lines?.nodes?.length) {
    return <CartEmpty />;
  }

  return (
    <div className="cart-main">
      <CartLines lines={cart.lines.nodes} />
      <CartSummary cost={cart.cost} />
      <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
    </div>
  );
}

function CartEmpty() {
  return (
    <div className="cart-empty">
      <p>Your cart is empty</p>
      <Link to="/collections/all">Continue shopping</Link>
    </div>
  );
}

function CartLines({lines}: {lines: CartLine[]}) {
  return (
    <div className="cart-lines">
      {lines.map((line) => (
        <CartLineItem key={line.id} line={line} />
      ))}
    </div>
  );
}

function CartLineItem({line}: {line: CartLine}) {
  const {id, merchandise, quantity} = line;
  const {product, title, image, selectedOptions} = merchandise;

  return (
    <div className="cart-line">
      {image && (
        <Image
          alt={title}
          aspectRatio="1/1"
          data={image}
          height={100}
          width={100}
        />
      )}
      <div className="cart-line-details">
        <Link to={\`/products/\${product.handle}\`}>
          <strong>{product.title}</strong>
        </Link>
        <ul>
          {selectedOptions.map((option) => (
            <li key={option.name}>
              {option.name}: {option.value}
            </li>
          ))}
        </ul>
        <CartLineQuantity line={line} />
      </div>
      <CartLinePrice line={line} />
    </div>
  );
}

function CartLineQuantity({line}: {line: CartLine}) {
  const {id, quantity} = line;
  const prevQuantity = Math.max(0, quantity - 1);
  const nextQuantity = quantity + 1;

  return (
    <div className="cart-line-quantity">
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.LinesUpdate}
        inputs={{lines: [{id, quantity: prevQuantity}]}}
      >
        <button
          type="submit"
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          −
        </button>
      </CartForm>
      <span>{quantity}</span>
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.LinesUpdate}
        inputs={{lines: [{id, quantity: nextQuantity}]}}
      >
        <button type="submit" aria-label="Increase quantity">
          +
        </button>
      </CartForm>
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.LinesRemove}
        inputs={{lineIds: [id]}}
      >
        <button type="submit" aria-label="Remove from cart">
          Remove
        </button>
      </CartForm>
    </div>
  );
}

function CartLinePrice({line}: {line: CartLine}) {
  return (
    <div className="cart-line-price">
      <Money data={line.cost.totalAmount} />
    </div>
  );
}

function CartSummary({cost}: {cost: CartCost}) {
  return (
    <div className="cart-summary">
      <div className="cart-summary-row">
        <span>Subtotal</span>
        <Money data={cost.subtotalAmount} />
      </div>
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl: string}) {
  return (
    <div className="cart-checkout-actions">
      <a href={checkoutUrl} target="_self">
        <button>Continue to Checkout</button>
      </a>
    </div>
  );
}
`;

// ============================================
// COMPONENTS - LAYOUT
// ============================================

const layoutComponent = `
import {Suspense} from 'react';
import {Await, NavLink} from '@remix-run/react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {CartDrawer} from './CartDrawer';
import {useRootLoaderData} from '~/root';

interface LayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  children?: React.ReactNode;
  footer: FooterQuery['menu'];
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
}

export function Layout({children, header, footer}: LayoutProps) {
  return (
    <>
      <Header header={header} />
      <main>{children}</main>
      <Footer menu={footer} />
    </>
  );
}

function Header({header}: {header: HeaderQuery}) {
  const {shop, menu} = header;

  return (
    <header className="header">
      <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
        <strong>{shop.name}</strong>
      </NavLink>
      <HeaderMenu menu={menu} primaryDomainUrl={shop.primaryDomain.url} />
      <HeaderCtas />
    </header>
  );
}

function HeaderMenu({
  menu,
  primaryDomainUrl,
}: {
  menu: HeaderQuery['menu'];
  primaryDomainUrl: string;
}) {
  return (
    <nav className="header-menu" role="navigation">
      {menu?.items.map((item) => {
        if (!item.url) return null;
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas() {
  const rootData = useRootLoaderData();

  return (
    <nav className="header-ctas" role="navigation">
      <SearchToggle />
      <Suspense fallback={<CartBadge count={0} />}>
        <Await resolve={rootData.cart}>
          {(cart) => <CartBadge count={cart?.totalQuantity || 0} />}
        </Await>
      </Suspense>
    </nav>
  );
}

function SearchToggle() {
  return (
    <NavLink prefetch="intent" to="/search" style={activeLinkStyle}>
      Search
    </NavLink>
  );
}

function CartBadge({count}: {count: number}) {
  return (
    <NavLink prefetch="intent" to="/cart" style={activeLinkStyle}>
      Cart ({count})
    </NavLink>
  );
}

function Footer({menu}: {menu?: FooterQuery['menu']}) {
  return (
    <footer className="footer">
      <FooterMenu menu={menu} />
    </footer>
  );
}

function FooterMenu({menu}: {menu?: FooterQuery['menu']}) {
  return (
    <nav className="footer-menu" role="navigation">
      {menu?.items.map((item) => (
        <NavLink
          key={item.id}
          prefetch="intent"
          style={activeLinkStyle}
          to={item.url || ''}
        >
          {item.title}
        </NavLink>
      ))}
    </nav>
  );
}

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : undefined,
  };
}
`;

// ============================================
// GRAPHQL FRAGMENTS
// ============================================

const fragmentsTs = `
export const CART_QUERY_FRAGMENT = \`#graphql
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        amount
        currencyCode
      }
      amountPerQuantity {
        amount
        currencyCode
      }
      compareAtAmountPerQuantity {
        amount
        currencyCode
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          amount
          currencyCode
        }
        price {
          amount
          currencyCode
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
  fragment CartApiQuery on Cart {
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: 100) {
      nodes {
        ...CartLine
      }
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalDutyAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
\` as const;

export const MENU_FRAGMENT = \`#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
\` as const;
`;

// ============================================
// UTILITIES
// ============================================

const variantsTs = `
import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';

export function getVariantUrl({
  pathname,
  handle,
  selectedOptions,
  searchParams,
}: {
  pathname: string;
  handle: string;
  selectedOptions: SelectedOption[];
  searchParams: URLSearchParams;
}) {
  const params = new URLSearchParams(searchParams);

  selectedOptions.forEach((option) => {
    params.set(option.name, option.value);
  });

  return \`\${pathname}?\${params.toString()}\`;
}
`;

const sessionTs = `
import {createCookieSessionStorage} from '@shopify/remix-oxygen';

export class AppSession {
  isPending = false;

  static async init(request: Request, secrets: string[]) {
    const storage = createCookieSessionStorage({
      cookie: {
        name: 'session',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secrets,
      },
    });

    const session = await storage.getSession(request.headers.get('Cookie'));

    return new AppSession(storage, session);
  }

  get(key: string) {
    return this.session.get(key);
  }

  destroy() {
    return this.sessionStorage.destroySession(this.session);
  }

  flash(key: string, value: any) {
    this.session.flash(key, value);
  }

  set(key: string, value: any) {
    this.session.set(key, value);
    this.isPending = true;
  }

  unset(key: string) {
    this.session.unset(key);
    this.isPending = true;
  }

  commit() {
    return this.sessionStorage.commitSession(this.session);
  }

  private constructor(
    private sessionStorage: ReturnType<typeof createCookieSessionStorage>,
    private session: Awaited<ReturnType<typeof createCookieSessionStorage['getSession']>>,
  ) {}
}
`;

// ============================================
// STYLES
// ============================================

const appCss = `
:root {
  --color-primary: #000;
  --color-contrast: #fff;
  --color-accent: #656fe2;
  --font-size-heading: clamp(2rem, 5vw, 3rem);
  --content-max-width: 1440px;
  --grid-gap: 1rem;
}

* {
  box-sizing: border-box;
  margin: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  color: var(--color-primary);
  background: var(--color-contrast);
}

/* Layout */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #eee;
}

.header-menu {
  display: flex;
  gap: 2rem;
}

.header-menu-item {
  text-decoration: none;
  color: inherit;
}

.header-ctas {
  display: flex;
  gap: 1rem;
}

main {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 2rem;
}

.footer {
  padding: 2rem;
  border-top: 1px solid #eee;
  text-align: center;
}

.footer-menu {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

/* Home */
.home {
  display: grid;
  gap: 4rem;
}

.featured-collection {
  display: block;
  text-decoration: none;
  color: inherit;
}

.featured-collection-image {
  aspect-ratio: 2/1;
  overflow: hidden;
}

.featured-collection-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommended-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--grid-gap);
}

.recommended-product {
  text-decoration: none;
  color: inherit;
}

/* Collection */
.collection {
  display: grid;
  gap: 2rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--grid-gap);
}

.product-item {
  text-decoration: none;
  color: inherit;
}

.product-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

/* Product */
.product {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .product {
    grid-template-columns: 1fr;
  }
}

.product-image img {
  width: 100%;
}

.product-main {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 600;
}

.product-price-on-sale {
  display: flex;
  gap: 0.5rem;
}

.product-price-on-sale s {
  opacity: 0.5;
}

.product-options {
  display: grid;
  gap: 0.5rem;
}

.product-options-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.product-options-item {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  text-decoration: none;
  color: inherit;
}

.product-options-item.active {
  border-color: var(--color-primary);
}

.product-form button {
  padding: 1rem 2rem;
  background: var(--color-primary);
  color: var(--color-contrast);
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.product-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Cart */
.cart {
  max-width: 600px;
  margin: 0 auto;
}

.cart-main {
  display: grid;
  gap: 2rem;
}

.cart-lines {
  display: grid;
  gap: 1rem;
}

.cart-line {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #eee;
}

.cart-line-details a {
  text-decoration: none;
  color: inherit;
}

.cart-line-details ul {
  list-style: none;
  padding: 0;
  font-size: 0.875rem;
  color: #666;
}

.cart-line-quantity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cart-line-quantity button {
  width: 2rem;
  height: 2rem;
  border: 1px solid #ddd;
  background: none;
  cursor: pointer;
}

.cart-summary {
  padding: 1rem;
  background: #f5f5f5;
}

.cart-summary-row {
  display: flex;
  justify-content: space-between;
}

.cart-checkout-actions button {
  width: 100%;
  padding: 1rem;
  background: var(--color-primary);
  color: var(--color-contrast);
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.cart-empty {
  text-align: center;
  padding: 4rem;
}

.cart-empty a {
  display: inline-block;
  margin-top: 1rem;
  color: var(--color-accent);
}
`;

// ============================================
// PACKAGE.JSON
// ============================================

const packageJson = `
{
  "name": "hydrogen-storefront",
  "version": "1.0.0",
  "private": true,
  "sideEffects": false,
  "type": "module",
  "scripts": {
    "dev": "shopify hydrogen dev --codegen",
    "build": "shopify hydrogen build",
    "preview": "shopify hydrogen preview",
    "lint": "eslint --no-error-on-unmatched-pattern --ext .js,.ts,.tsx .",
    "typecheck": "tsc --noEmit",
    "codegen": "shopify hydrogen codegen"
  },
  "dependencies": {
    "@remix-run/react": "^2.1.0",
    "@shopify/hydrogen": "^2024.1.0",
    "@shopify/remix-oxygen": "^2.0.0",
    "graphql": "^16.6.0",
    "graphql-tag": "^2.12.6",
    "isbot": "^3.6.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@graphql-codegen/cli": "^5.0.0",
    "@remix-run/dev": "^2.1.0",
    "@shopify/cli": "^3.50.0",
    "@shopify/hydrogen-codegen": "^0.1.0",
    "@types/react": "^18.0.20",
    "@types/react-dom": "^18.0.6",
    "eslint": "^8.20.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
`;
```

---

## DEPLOYMENT TO OXYGEN

```bash
# Initialize Hydrogen project
npm create @shopify/hydrogen@latest

# Development
shopify hydrogen dev

# Build for production
shopify hydrogen build

# Deploy to Oxygen
shopify hydrogen deploy

# Link to existing store
shopify hydrogen link

# Environment management
shopify hydrogen env list
shopify hydrogen env pull
```

---

## CACHING STRATEGIES

```typescript
// Cache configuration
import {CacheShort, CacheLong, CacheNone, CacheCustom} from '@shopify/hydrogen';

// Short cache (1 minute) - Dynamic content
const {data} = await storefront.query(QUERY, {
  cache: CacheShort(),
});

// Long cache (1 hour) - Static content
const {data} = await storefront.query(QUERY, {
  cache: CacheLong(),
});

// No cache - Real-time data
const {data} = await storefront.query(QUERY, {
  cache: CacheNone(),
});

// Custom cache
const {data} = await storefront.query(QUERY, {
  cache: CacheCustom({
    mode: 'public',
    maxAge: 60,
    staleWhileRevalidate: 300,
  }),
});
```

---

## INVOCATION

```
/shopify-hydrogen
/hydrogen
/headless-shopify
```

---

*SHOPIFY.HYDROGEN.EXE - Headless Commerce at Scale*
