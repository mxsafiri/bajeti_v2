import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Allow server actions from our proxy
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:62107'],
    },
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
