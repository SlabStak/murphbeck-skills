import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  IndexTable,
  Thumbnail,
  Badge,
  Pagination,
  TextField,
  InlineStack,
  Button,
  EmptyState,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";

const PRODUCTS_PER_PAGE = 10;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const direction = url.searchParams.get("direction") || "next";
  const search = url.searchParams.get("search") || "";

  const query = search ? `title:*${search}*` : "";

  const paginationArgs =
    direction === "prev"
      ? `last: ${PRODUCTS_PER_PAGE}, before: "${cursor}"`
      : cursor
        ? `first: ${PRODUCTS_PER_PAGE}, after: "${cursor}"`
        : `first: ${PRODUCTS_PER_PAGE}`;

  const response = await admin.graphql(`
    query getProducts {
      products(${paginationArgs}${query ? `, query: "${query}"` : ""}) {
        edges {
          cursor
          node {
            id
            title
            status
            totalInventory
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            featuredImage {
              url
              altText
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `);

  const { data } = await response.json();

  return json({
    products: data.products.edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      status: edge.node.status,
      inventory: edge.node.totalInventory,
      price: edge.node.priceRangeV2.minVariantPrice,
      image: edge.node.featuredImage,
      cursor: edge.cursor,
    })),
    pageInfo: data.products.pageInfo,
    search,
  });
};

export default function Products() {
  const { products, pageInfo, search: initialSearch } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialSearch);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("cursor");
    params.delete("direction");
    if (searchValue) {
      params.set("search", searchValue);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  }, [searchValue, searchParams, setSearchParams]);

  const handlePagination = useCallback(
    (direction: "next" | "prev") => {
      const params = new URLSearchParams(searchParams);
      params.set("direction", direction);
      params.set(
        "cursor",
        direction === "next" ? pageInfo.endCursor : pageInfo.startCursor
      );
      setSearchParams(params);
    },
    [pageInfo, searchParams, setSearchParams]
  );

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const rowMarkup = products.map((product: any, index: number) => (
    <IndexTable.Row id={product.id} key={product.id} position={index}>
      <IndexTable.Cell>
        <Thumbnail
          source={product.image?.url || ""}
          alt={product.image?.altText || product.title}
          size="small"
        />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {product.title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={product.status === "ACTIVE" ? "success" : "info"}>
          {product.status}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {product.inventory?.toLocaleString() ?? "N/A"}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {product.price?.currencyCode} {product.price?.amount}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page title="Products" backAction={{ content: "Dashboard", url: "/app" }}>
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="400">
            <InlineStack gap="300" blockAlign="end">
              <div style={{ flex: 1 }}>
                <TextField
                  label="Search products"
                  labelHidden
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="Search by title..."
                  autoComplete="off"
                  clearButton
                  onClearButtonClick={() => {
                    setSearchValue("");
                    const params = new URLSearchParams(searchParams);
                    params.delete("search");
                    params.delete("cursor");
                    setSearchParams(params);
                  }}
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card padding="0">
          {products.length === 0 ? (
            <EmptyState
              heading="No products found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>
                {initialSearch
                  ? "Try adjusting your search terms"
                  : "This store doesn't have any products yet"}
              </p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={resourceName}
              itemCount={products.length}
              headings={[
                { title: "Image" },
                { title: "Title" },
                { title: "Status" },
                { title: "Inventory" },
                { title: "Price" },
              ]}
              selectable={false}
            >
              {rowMarkup}
            </IndexTable>
          )}
        </Card>

        {(pageInfo.hasNextPage || pageInfo.hasPreviousPage) && (
          <InlineStack align="center">
            <Pagination
              hasPrevious={pageInfo.hasPreviousPage}
              onPrevious={() => handlePagination("prev")}
              hasNext={pageInfo.hasNextPage}
              onNext={() => handlePagination("next")}
            />
          </InlineStack>
        )}
      </BlockStack>
    </Page>
  );
}
