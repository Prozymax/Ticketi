import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Reduce font preload warnings
  experimental: {
    optimizePackageImports: ["@next/font"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "6001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "ticketi.xyz",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "testnet.ticketi.xyz",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "backend.mainnet.ticketi.xyz",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "backend.testnet.ticketi.xyz",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "cdn.filestackcontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
