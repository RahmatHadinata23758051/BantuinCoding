import type { NextConfig } from 'next'
import path from 'path'

// Workaround for next-intl/plugin crashing due to @swc/core DACL issues on Windows
// `withNextIntl` internally just creates an alias for `next-intl/config` pointing to your request config.
const i18nRequestPath = path.resolve(__dirname, './src/i18n/request.ts')

const nextConfig: NextConfig = {
  webpack: (config) => {
    if (!config.resolve) config.resolve = {}
    if (!config.resolve.alias) config.resolve.alias = {}

    // Alias used by next-intl to load our request configuration
    config.resolve.alias['next-intl/config'] = i18nRequestPath
    return config
  },
}

export default nextConfig

