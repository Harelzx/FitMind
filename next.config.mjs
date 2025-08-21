import createNextIntlPlugin from 'next-intl/plugin'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    // Optimize webpack caching to reduce memory usage
    webpackBuildWorker: true,
  },
  webpack: (config, { dev }) => {
    // Optimize webpack cache strategy in development to reduce memory usage
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      }
      
      // Suppress webpack cache warnings
      config.ignoreWarnings = [
        /SerializingObject.toJSON/,
        /Serializing big strings/,
        /impacts deserialization performance/,
      ]
    }

    return config
  },
}

export default withNextIntl(nextConfig)