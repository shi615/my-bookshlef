import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // Covers come from the Google Books catalogue, but users can also override a
    // book's cover with an arbitrary image URL, so allow any https host.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig
