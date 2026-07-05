import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Exclude apps/api from Next.js build to avoid conflicts with NestJS
  onDemandEntries: {
    // Exclude api folder from page serving
  },
  typescript: {
    // Ignore errors from apps folder
    ignoreBuildErrors: false,
  },
}

export default nextConfig
