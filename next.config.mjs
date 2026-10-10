import { fileURLToPath } from "node:url";
export default {
  poweredByHeader: false,
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  experimental: { serverActions: { bodySizeLimit: "7mb" } },
};
