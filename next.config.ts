import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: [],
  },
  webpack: (config, { dev, isServer }) => {
    // Suppress the webpack cache strategy warning
    config.infrastructureLogging = {
      level: 'error',
    };
    
    // Reduce webpack cache warnings
    if (config.cache && typeof config.cache === 'object') {
      config.cache.compression = 'gzip';
    }
    
    return config;
  },
  // Suppress webpack warnings in console
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;

