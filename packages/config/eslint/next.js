import { baseConfig } from "./base.js";

/** ESLint flat config for Next.js apps (extends the shared base). */
export const nextConfig = [
  ...baseConfig,
  {
    rules: {
      // React 19 / Next 16 App Router specific overrides can go here.
    },
  },
];

export default nextConfig;
