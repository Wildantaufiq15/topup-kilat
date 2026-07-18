import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output for Docker container
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Handle Node.js modules that might be imported on client
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle Node.js modules on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      }
    }
    return config
  },
}

export default nextConfig
