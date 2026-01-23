import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Image optimization for Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // Experimental features for Next.js 16
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },

  // Note: cacheComponents (formerly PPR) requires Suspense boundaries around all data fetches
  // Enable this when pages are refactored with proper Suspense patterns
  // cacheComponents: true,

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
