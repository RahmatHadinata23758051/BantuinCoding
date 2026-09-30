'use client'

import { AlertTriangle, CheckCircle2, ChevronDown, KeyRound, LoaderCircle, Search, Server, ShieldCheck, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/ui'

import { Button, Input, Panel, Select, StatusBadge } from './ui'

interface ProviderMeta {
  configured: boolean
  provider?: string
  model?: string
  configuredAt?: string
  status?: string
  message?: string
  error?: string
}

interface ModelInfo {
  id: string
  name: string
  contextWindow?: number
}

interface TestResult {
  status: string
  message: string
  models?: ModelInfo[]
}

const PROVIDERS = ['ANTHROPIC', 'OPENAI', 'GEMINI', 'OPENROUTER'] as const
type Provider = (typeof PROVIDERS)[number]

const DEFAULT_MODELS: Record<Provider, string> = {
  ANTHROPIC: 'claude-opus-5-5',
  OPENAI: 'gpt-5',
  GEMINI: 'gemini-2.5-pro',
  OPENROUTER: 'anthropic/claude-opus-5-5',
}

// Providers that support custom base URL (OpenAI-compatible)
const CUSTOM_URL_PROVIDERS: ReadonlySet<Provider> = new Set<Provider>(['OPENAI', 'OPENROUTER'])

export function ProviderSetupPanel() {
  const [meta, setMeta] = useState<ProviderMeta | null>(null)
  const [provider, setProvider] = useState<Provider>('ANTHROPIC')
  const [model, setModel] = useState(DEFAULT_MODELS.ANTHROPIC)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [autoTestStatus, setAutoTestStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle')
  const [modelSearch, setModelSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runAutoTest = async (key: string, providerName: Provider, customUrl?: string) => {
    if (!key || key.length < 8) {
      setAvailableModels([])
      setModelsLoaded(false)
      setAutoTestStatus('idle')
      return
    }

    setAutoTestStatus('testing')
    // Clear stale error banner from previous failed tests
    setMessage(null)

    // First: fetch available models without requiring a specific model
    try {
      const modelsResponse = await fetch('/api/provider/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerName,
          apiKey: key,
          baseUrl: customUrl || undefined,
        }),
      })
      const modelsData = (await modelsResponse.json()) as { models?: ModelInfo[]; error?: string }

      if (modelsData.models && modelsData.models.length > 0) {
        setAvailableModels(modelsData.models)
        setModelsLoaded(true)
        setAutoTestStatus('valid')
        setModel(modelsData.models[0].id)
        return
      }

      // Fallback: if provider doesn't support model listing, try test connection
      const testResponse = await fetch('/api/provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerName,
          model: DEFAULT_MODELS[providerName],
          apiKey: key,
          baseUrl: customUrl || undefined,
        }),
      })
      const testData = (await testResponse.json()) as TestResult

      if (testData.status === 'VALID' && testData.models && testData.models.length > 0) {
        setAvailableModels(testData.models)
        setModelsLoaded(true)
        setAutoTestStatus('valid')
        setModel(testData.models[0].id)
      } else {
        setAvailableModels([])
        setModelsLoaded(false)
        setAutoTestStatus('invalid')
      }
    } catch {
      setAvailableModels([])
      setModelsLoaded(false)
      setAutoTestStatus('invalid')
    }
  }

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      try {
        const response = await fetch('/api/provider/configure')
        const data = (await response.json()) as ProviderMeta

        if (data.configured) {
          if (active) setMeta(data)
          return
        }

        // Server in-memory session was lost (e.g. server rebuild/restart).
        // Check if current browser tab has session-scoped credentials to restore.
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const stored = window.sessionStorage.getItem('byok_session')
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as {
                provider?: Provider
                model?: string
                apiKey?: string
                baseUrl?: string
              }
              if (parsed.apiKey && parsed.provider && parsed.model) {
                const res = await fetch('/api/provider/configure', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(parsed),
                })
                if (res.ok) {
                  const restoredMeta = (await res.json()) as ProviderMeta
                  if (active) {
                    setMeta(restoredMeta)
                    setProvider(parsed.provider)
                    setModel(parsed.model)
                    if (parsed.baseUrl) setBaseUrl(parsed.baseUrl)
                    // Trigger loading models for the restored provider
                    void runAutoTest(parsed.apiKey, parsed.provider, parsed.baseUrl)
                  }
                  return
                }
              }
            } catch {}
          }
        }

        if (active) setMeta({ configured: false })
      } catch {
        if (active) setMeta({ configured: false })
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [])

  // Auto-test on API key or base URL change with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (apiKey.length < 8) {
      setTimeout(() => {
        setAvailableModels([])
        setModelsLoaded(false)
        setAutoTestStatus('idle')
      }, 0)
      return
    }

    debounceRef.current = setTimeout(() => {
      void runAutoTest(apiKey, provider, baseUrl)
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [apiKey, provider, baseUrl])

  async function handleTestConnection() {
    if (!apiKey) return

    setTesting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model,
          apiKey,
          baseUrl: baseUrl || undefined,
        }),
      })
      const data = (await response.json()) as TestResult

      if (!response.ok) {
        setMessage({
          type: 'err',
          text: data.message ?? 'Connection test failed.',
        })
        return
      }

      if (data.status === 'VALID') {
        setMessage({ type: 'ok', text: `Connection successful: ${provider}` })
        setAvailableModels(data.models ?? [])
        setModelsLoaded(true)
        if (data.models && data.models.length > 0 && !data.models.some((m) => m.id === model)) {
          setModel(data.models[0].id)
        }
      } else {
        const errText = data.message ?? 'Connection failed.'
        // If models are already loaded, show model-specific error without wiping the list
        if (modelsLoaded) {
          setMessage({ type: 'err', text: `Model "${model}" unavailable: ${errText}. Try another model.` })
        } else {
          setMessage({ type: 'err', text: errText })
          setAvailableModels([])
          setModelsLoaded(false)
        }
      }
    } catch {
      if (!modelsLoaded) {
        setMessage({ type: 'err', text: 'Network error. Check your connection and retry.' })
        setAvailableModels([])
        setModelsLoaded(false)
      } else {
        setMessage({ type: 'err', text: 'Network error. Your saved models are still available.' })
      }
    } finally {
      setTesting(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/provider/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model,
          apiKey,
          baseUrl: baseUrl || undefined,
        }),
      })
      const data = (await response.json()) as ProviderMeta

      if (!response.ok) {
        setMessage({
          type: 'err',
          text: data.error ?? 'Provider configuration could not be saved.',
        })
        return
      }

      if (data.status === 'VALID') {
        setMessage({ type: 'ok', text: `Connected: ${data.provider} / ${data.model}` })
        setMeta({
          configured: true,
          provider: data.provider,
          model: data.model,
          configuredAt: data.configuredAt,
        })
        // Save session-scoped credentials in current browser tab to survive dev server rebuilds
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(
            'byok_session',
            JSON.stringify({
              provider,
              model,
              apiKey,
              baseUrl: baseUrl || undefined,
            }),
          )
        }
        setApiKey('')
        setOpen(false)
      } else {
        setMessage({ type: 'err', text: data.message ?? 'Connection failed.' })
      }
    } catch {
      setMessage({ type: 'err', text: 'Network error. Check your connection and retry.' })
    } finally {
      setLoading(false)
    }
  }

  const isConfigured = meta?.configured === true
  const showModelSelect = modelsLoaded && availableModels.length > 0

  return (
    <Panel className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="provider-setup-content"
        className={cn(
          'flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5',
          isConfigured ? 'bg-[var(--mint)]' : 'bg-[var(--electric-yellow)]',
        )}
      >
        <span className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-xs)]">
            {isConfigured ? (
              <CheckCircle2 size={20} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <KeyRound size={20} strokeWidth={2.5} aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black">AI provider</span>
              <StatusBadge tone={isConfigured ? 'success' : 'pending'}>
                {isConfigured ? 'configured' : 'action required'}
              </StatusBadge>
            </span>
            <span className="mt-1 block truncate font-mono text-xs font-bold">
              {isConfigured && meta?.provider
                ? `${meta.provider} / ${meta.model}`
                : 'Add a session key before analysis and generation.'}
            </span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          size={22}
          className={cn('shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      <div aria-live="polite">
        {message && (
          <div
            role={message.type === 'err' ? 'alert' : 'status'}
            className={cn(
              'flex items-start gap-3 border-t-2 border-[var(--ink)] px-4 py-3 text-sm font-bold sm:px-5',
              message.type === 'ok' ? 'bg-[var(--mint-dim)]' : 'bg-[var(--action-red-dim)]',
            )}
          >
            {message.type === 'ok' ? (
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {open && (
        <div id="provider-setup-content" className="border-t-2 border-[var(--ink)] bg-[var(--paper-raised)] p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="grid gap-5" aria-busy={loading}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="provider" className="text-sm font-black">
                  Provider
                </label>
                <Select
                  id="provider"
                  value={provider}
                  onChange={(event) => {
                    const nextProvider = event.target.value as Provider
                    setProvider(nextProvider)
                    setModel(DEFAULT_MODELS[nextProvider])
                    setAvailableModels([])
                    setModelsLoaded(false)
                  }}
                >
                  {PROVIDERS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="model" className="text-sm font-black">
                  Model
                </label>
                {showModelSelect ? (
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Input
                        id="model-search"
                        type="search"
                        value={modelSearch}
                        onChange={(event) => setModelSearch(event.target.value)}
                        placeholder="Search models..."
                        className="font-mono pr-10"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--paper-muted)]" size={16} aria-hidden="true" />
                    </div>
                    <Select
                      id="model"
                      value={model}
                      onChange={(event) => {
                        setModel(event.target.value)
                        setMessage(null)
                      }}
                      required
                    >
                      {availableModels
                        .filter((m) =>
                          m.id === model ||
                          m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                          m.id.toLowerCase().includes(modelSearch.toLowerCase()),
                        )
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.contextWindow && `(${m.contextWindow.toLocaleString()} ctx)`}
                          </option>
                        ))}
                    </Select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id="model"
                      type="text"
                      value={model}
                      onChange={(event) => setModel(event.target.value)}
                      required
                      className="font-mono flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testing || !apiKey}
                      className="shrink-0"
                      aria-label="Test connection and fetch models"
                    >
                      {testing ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="apiKey" className="text-sm font-black">
                API key
              </label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Paste a provider key for this server session"
                  className="font-mono"
                />
                {autoTestStatus !== 'idle' && (
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-mono font-bold"
                    aria-live="polite"
                  >
                    {autoTestStatus === 'testing' && (
                      <LoaderCircle className="animate-spin text-[var(--cobalt)]" size={16} aria-hidden="true" />
                    )}
                    {autoTestStatus === 'valid' && (
                      <CheckCircle2 className="text-[var(--pass-teal)]" size={16} aria-hidden="true" />
                    )}
                    {autoTestStatus === 'invalid' && (
                      <AlertTriangle className="text-[var(--action-red)]" size={16} aria-hidden="true" />
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-start gap-2 text-xs leading-5 text-[var(--paper-muted)]">
                <ShieldCheck className="mt-0.5 shrink-0 text-[var(--pass-teal)]" size={16} aria-hidden="true" />
                <p>
                  Session-scoped only. The full key is never returned, logged, stored in the database,
                  added to generated Markdown, or included in a ZIP.
                </p>
                {autoTestStatus === 'valid' && (
                  <span className="text-[var(--pass-teal)]">Auto-validated — models loaded</span>
                )}
                {autoTestStatus === 'invalid' && (
                  <span className="text-[var(--action-red)]">Invalid key or no models found</span>
                )}
              </div>
            </div>

            {CUSTOM_URL_PROVIDERS.has(provider) && (
              <div className="flex flex-col gap-2">
                <label htmlFor="baseUrl" className="text-sm font-black">
                  Custom Base URL <span className="text-[var(--paper-muted)] font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--paper-muted)]" size={16} aria-hidden="true" />
                  <Input
                    id="baseUrl"
                    type="url"
                    value={baseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                    placeholder="e.g. http://127.0.0.1:20128/v1"
                    className="font-mono pl-10"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <p className="text-xs leading-5 text-[var(--paper-muted)]">
                  Use a custom endpoint for OpenAI-compatible providers (e.g. 9router local at <code className="font-mono">http://127.0.0.1:20128/v1</code>).
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestConnection}
                disabled={testing || !apiKey}
                className="w-full sm:w-auto"
              >
                {testing && <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />}
                {testing ? 'Testing…' : 'Test Connection'}
              </Button>
              <Button type="submit" disabled={loading || !apiKey} className="w-full sm:w-auto">
                {loading && <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />}
                {loading ? 'Testing connection…' : 'Test and Save'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Panel>
  )
}
