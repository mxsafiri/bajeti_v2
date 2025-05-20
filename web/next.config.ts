import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Allow server actions from our proxy
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:62107', 'malidaftari.netlify.app'],
    },
  },
  // Optimize for Netlify deployment
  output: 'standalone',
  // Disable ESLint during build to prevent deployment failures
  eslint: {
    // Only run ESLint in development, not during builds
    ignoreDuringBuilds: true,
  },
  // Enable image optimization
  images: {
    domains: ['ogsrcpvrlejmjsuhwtxt.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

// For middleware to access environment variables
export const middleware = {
  env: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
};

export default nextConfig;
