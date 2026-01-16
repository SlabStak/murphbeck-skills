import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the host to be 'localhost' during dev
if (
  process.env.NODE_ENV === "development" &&
  process.env.SHOPIFY_APP_URL?.includes("localhost")
) {
  process.env.SHOPIFY_APP_URL = process.env.SHOPIFY_APP_URL.replace(
    "localhost",
    "127.0.0.1"
  );
}

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  server: {
    port: Number(process.env.PORT) || 3000,
    host: "localhost",
    hmr: {
      protocol: "ws",
      host: "localhost",
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
});
