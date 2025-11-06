import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  experimental: {
    optimizeCss: true,
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

