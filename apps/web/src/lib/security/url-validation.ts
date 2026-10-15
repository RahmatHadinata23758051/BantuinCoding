import type { AIProviderType } from '@repo/types'

/**
 * Validates custom provider base URLs to prevent SSRF and unsafe protocols.
 * Remote providers require HTTPS and cannot target private/loopback/cloud-metadata networks.
 * Local Ollama allows localhost/127.0.0.1 loopback but forbids cloud metadata addresses.
 */

const CLOUD_METADATA_IPS = new Set([
  '169.254.169.254',
  'fd00:ec2::254',
  'metadata.google.internal',
])

function isPrivateOrLoopbackIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number.parseInt(p, 10))
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return false
  }

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true
  // 0.0.0.0/8
  if (parts[0] === 0) return true
  // 10.0.0.0/8 (Private)
  if (parts[0] === 10) return true
  // 172.16.0.0/12 (Private: 172.16.0.0 – 172.31.255.255)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  // 192.168.0.0/16 (Private)
  if (parts[0] === 192 && parts[1] === 168) return true
  // 169.254.0.0/16 (Link-local / Cloud metadata)
  if (parts[0] === 169 && parts[1] === 254) return true

  return false
}

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim()

  if (lower === 'localhost' || lower === '::1' || lower === '[::1]' || lower.endsWith('.localhost')) {
    return true
  }

  if (CLOUD_METADATA_IPS.has(lower)) {
    return true
  }

  // Check IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(lower)) {
    return isPrivateOrLoopbackIPv4(lower)
  }

  // Check IPv6 loopback and private unique local (fc00::/7) or link-local (fe80::/10)
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb') || lower.startsWith('fc') || lower.startsWith('fd')) {
    return true
  }

  return false
}

export interface UrlValidationResult {
  valid: boolean
  error?: string
  normalizedUrl?: string
}

export function validateProviderBaseUrl(
  rawUrl: string | undefined | null,
  provider: AIProviderType,
): UrlValidationResult {
  if (!rawUrl || rawUrl.trim() === '') {
    return { valid: true }
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl.trim())
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  // Disallow embedded user info in URL
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'Base URL must not contain credentials' }
  }

  const protocol = parsed.protocol.toLowerCase()
  if (protocol !== 'http:' && protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' }
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')

  // Cloud metadata is forbidden for all providers without exception
  if (CLOUD_METADATA_IPS.has(hostname) || (hostname === '169.254.169.254')) {
    return { valid: false, error: 'Access to cloud metadata endpoints is prohibited' }
  }

  if (provider === 'OLLAMA') {
    const isLoopback = hostname === 'localhost'
      || hostname === '::1'
      || /^127(?:\.\d{1,3}){3}$/.test(hostname)

    if (!isLoopback) {
      return {
        valid: false,
        error: 'Ollama endpoints must use localhost or loopback addresses',
      }
    }

    return {
      valid: true,
      normalizedUrl: parsed.origin + parsed.pathname.replace(/\/+$/, ''),
    }
  }

  // For remote hosted providers:
  // Must use HTTPS in production, or HTTP is only allowed if not targeting private/loopback IP
  if (process.env.NODE_ENV === 'production' && protocol !== 'https:') {
    return { valid: false, error: 'Remote providers must use HTTPS' }
  }

  if (isPrivateOrLoopbackHost(hostname)) {
    return {
      valid: false,
      error: 'Remote providers cannot point to localhost or private network addresses',
    }
  }

  return {
    valid: true,
    normalizedUrl: parsed.origin + parsed.pathname.replace(/\/+$/, ''),
  }
}
