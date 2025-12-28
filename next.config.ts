import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to complete even if there are TypeScript errors.
    // This is temporary until the @as-integrations/next package is updated for Next.js 15.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
