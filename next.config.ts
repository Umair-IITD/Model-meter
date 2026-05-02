import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Ensure firebase-admin doesn't get bundled client-side
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
