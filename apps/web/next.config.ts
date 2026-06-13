import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const nextConfig: NextConfig = {
  output: "standalone",
  // Standalone output traces from the monorepo root so the server bundle picks
  // up workspace deps; the Dockerfile COPY paths assume this layout.
  outputFileTracingRoot: rootDir,
  // @shifahub/trpc + @shifahub/db are TYPE-only imports in the web app (server
  // code never ships to the browser), so they are intentionally NOT transpiled.
  transpilePackages: ["@shifahub/ui", "@shifahub/shared"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.shifahub.app" }],
  },
};

export default nextConfig;
