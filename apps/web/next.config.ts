import type { NextConfig } from 'next'
import path from 'path'

// Workaround for next-intl/plugin crashing due to @swc/core DACL issues on Windows
// `withNextIntl` internally just creates an alias for `next-intl/config` pointing to your request config.
// In Turbopack on Windows, absolute backslash paths fail with "windows imports are not implemented yet".
// We use relative path with forward slashes:
const i18nRequestPath = './src/i18n/request.ts'

const nextConfig: NextConfig = {
  webpack: (config) => {
    if (!config.resolve) config.resolve = {}
    if (!config.resolve.alias) config.resolve.alias = {}

    // Alias used by next-intl to load our request configuration
    config.resolve.alias['next-intl/config'] = path.resolve(__dirname, i18nRequestPath)
    return config
  },
  turbopack: {
    resolveAlias: {
      'next-intl/config': i18nRequestPath,
    },
  },
}

export default nextConfig

