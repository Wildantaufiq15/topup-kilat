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
}

export default nextConfig
