import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // @shifahub/trpc + @shifahub/db are TYPE-only imports in the web app (server
  // code never ships to the browser), so they are intentionally NOT transpiled.
  transpilePackages: ["@shifahub/ui", "@shifahub/shared"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.shifahub.app" }],
  },
};

export default nextConfig;
