'use client'

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  LoaderCircle,
  Plus,
  Trash2,
} from 'lucide-react'
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

interface SavedKeyItem {
  id: string
  name: string
  provider: string
  model: string
  baseUrl?: string | null
  isActive: boolean
  lastValidated?: string | null
  keyHint?: string
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

const CUSTOM_URL_PROVIDERS: ReadonlySet<Provider> = new Set<Provider>(['OPENAI', 'OPENROUTER'])

export function ProviderSetupPanel() {
  const [meta, setMeta] = useState<ProviderMeta | null>(null)
  const [savedKeys, setSavedKeys] = useState<SavedKeyItem[]>([])
  const [loadingKeys, setLoadingKeys] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [keyName, setKeyName] = useState('')
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

  const loadSavedKeys = async () => {
    setLoadingKeys(true)
    try {
      const res = await fetch('/api/provider/keys')
      if (res.ok) {
        const data = (await res.json()) as { keys?: SavedKeyItem[] }
        setSavedKeys(data.keys || [])
        const activeKey = data.keys?.find((k) => k.isActive)
        if (activeKey) {
          setMeta({
            configured: true,
            provider: activeKey.provider,
            model: activeKey.model,
            configuredAt: activeKey.lastValidated || undefined,
          })
        }
      }
    } catch {} finally {
      setLoadingKeys(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSavedKeys()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const runAutoTest = async (key: string, providerName: Provider, customUrl?: string) => {
    if (!key || key.length < 8) {
      setAvailableModels([])
      setModelsLoaded(false)
      setAutoTestStatus('idle')
      return
    }

    setAutoTestStatus('testing')
    setMessage(null)

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

  const handleActivateKey = async (keyId: string) => {
    try {
      const res = await fetch(`/api/provider/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      if (res.ok) {
        const data = (await res.json()) as { key: SavedKeyItem }
        setMessage({ type: 'ok', text: `Switched active provider to ${data.key.name} (${data.key.provider} / ${data.key.model})` })
        await loadSavedKeys()
      }
    } catch {
      setMessage({ type: 'err', text: 'Failed to switch provider key.' })
    }
  }

  const handleDeleteKey = async (keyId: string, name: string) => {
    if (!confirm(`Delete key "${name}" from vault?`)) return
    try {
      const res = await fetch(`/api/provider/keys/${keyId}`, { method: 'DELETE' })
      if (res.ok) {
        await loadSavedKeys()
      }
    } catch {}
  }

  const handleTestConnection = async () => {
    if (!apiKey) return
    setTesting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey, baseUrl: baseUrl || undefined }),
      })
      const data = (await response.json()) as TestResult

      if (!response.ok) {
        setMessage({ type: 'err', text: data.message ?? 'Connection test failed.' })
        return
      }

      if (data.status === 'VALID') {
        setMessage({ type: 'ok', text: `Connection successful: ${provider}` })
        setAvailableModels(data.models ?? [])
        setModelsLoaded(true)
      } else {
        setMessage({ type: 'err', text: data.message ?? 'Connection failed.' })
      }
    } catch {
      setMessage({ type: 'err', text: 'Network error. Check connection.' })
    } finally {
      setTesting(false)
    }
  }

  const handleSaveToVault = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const nameToUse = keyName.trim() || `${provider} - ${model}`

    try {
      const res = await fetch('/api/provider/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameToUse,
          provider,
          model,
          apiKey,
          baseUrl: baseUrl || undefined,
        }),
      })

      const data = (await res.json()) as { key?: SavedKeyItem; error?: string; message?: string }
      if (!res.ok) {
        setMessage({ type: 'err', text: data.error || data.message || 'Failed to save key.' })
        return
      }

      setMessage({ type: 'ok', text: `Key "${nameToUse}" saved and activated successfully!` })
      setApiKey('')
      setKeyName('')
      setShowAddForm(false)
      await loadSavedKeys()
    } catch {
      setMessage({ type: 'err', text: 'Network error saving key.' })
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
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between gap-4 border-b-2 border-[var(--ink)] px-4 py-4 text-left transition-colors sm:px-5',
          isConfigured ? 'bg-[var(--mint)] hover:bg-[var(--mint-dim)]' : 'bg-[var(--electric-yellow)] hover:bg-[var(--electric-yellow-dim)]',
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={cn(
            'flex size-10 shrink-0 items-center justify-center border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-xs)]',
            isConfigured ? 'text-[var(--ink)]' : 'text-[var(--ink)]',
          )}>
            {isConfigured ? <CheckCircle2 size={20} strokeWidth={2.5} /> : <KeyRound size={20} strokeWidth={2.5} />}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-[var(--ink)]">AI Provider Vault</span>
              <StatusBadge tone={isConfigured ? 'success' : 'pending'}>
                {isConfigured ? 'Active & Ready' : 'Key Required'}
              </StatusBadge>
            </span>
            <span className="mt-0.5 block truncate font-mono text-xs font-bold text-[var(--ink)]">
              {isConfigured && meta?.provider
                ? `${meta.provider} / ${meta.model}`
                : 'Save multiple provider profiles and switch seamlessly.'}
            </span>
          </span>
        </span>

        <ChevronDown
          size={22}
          className={cn('shrink-0 text-[var(--ink)] transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {message && (
        <div
          role={message.type === 'err' ? 'alert' : 'status'}
          className={cn(
            'flex items-center gap-2.5 border-t-2 border-[var(--ink)] px-5 py-2.5 text-xs font-bold text-[var(--ink)]',
            message.type === 'ok' ? 'bg-[var(--mint-dim)]' : 'bg-[var(--action-red-dim)]',
          )}
        >
          {message.type === 'ok' ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertTriangle size={15} className="shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {open && (
        <div className="border-t-2 border-[var(--ink)] bg-[var(--paper-raised)] p-5 space-y-6">
          {/* Saved Keys Vault Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[var(--ink)]">Saved Provider Keys</h3>
              <p className="text-xs font-semibold text-[var(--paper-muted)]">Manage multiple keys across providers and switch anytime.</p>
            </div>
            <Button
              type="button"
              variant={showAddForm ? 'neutral' : 'secondary'}
              size="sm"
              onClick={() => setShowAddForm((v) => !v)}
              className="gap-1.5 text-xs font-bold uppercase tracking-wider"
            >
              <Plus size={14} className={cn('transition-transform', showAddForm && 'rotate-45')} />
              {showAddForm ? 'Cancel' : 'Add New Key'}
            </Button>
          </div>

          {/* Saved Keys List */}
          {savedKeys.length > 0 ? (
            <div className="divide-y-2 divide-[var(--ink)] rounded-[4px] border-2 border-[var(--ink)] bg-[var(--paper)] shadow-[var(--shadow-sm)] overflow-hidden">
              {savedKeys.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors',
                    item.isActive ? 'bg-[var(--mint-dim)]' : 'hover:bg-[var(--paper-raised)]',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleActivateKey(item.id)}
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        item.isActive
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-raised)]'
                          : 'border-[var(--ink)] bg-[var(--paper-raised)] hover:bg-[var(--electric-yellow)]',
                      )}
                      title={item.isActive ? 'Active Key' : 'Click to activate this key'}
                    >
                      {item.isActive && <Check size={12} strokeWidth={4} />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[var(--ink)] truncate">{item.name}</span>
                        {item.isActive && (
                          <span className="rounded-[3px] border-2 border-[var(--ink)] bg-[var(--mint)] px-1.5 py-0.5 text-[0.6rem] font-bold text-[var(--ink)] uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[var(--paper-muted)] font-mono font-bold">
                        <span className="text-[var(--ink)]">{item.provider}</span>
                        <span>•</span>
                        <span className="text-[var(--cobalt)]">{item.model}</span>
                        {item.baseUrl && (
                          <>
                            <span>•</span>
                            <span className="text-[var(--paper-faint)] truncate max-w-[180px]">{item.baseUrl}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!item.isActive && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleActivateKey(item.id)}
                        className="text-[0.65rem] h-7 px-2.5 font-bold uppercase tracking-wider"
                      >
                        Activate
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteKey(item.id, item.name)}
                      className="nb-button-press p-1.5 border-2 border-transparent text-[var(--ink-soft)] hover:border-[var(--ink)] hover:bg-[var(--action-red)] hover:text-[var(--ink)] hover:shadow-[var(--shadow-xs)] rounded-[3px] transition-all"
                      title="Delete key"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !loadingKeys && (
            <div className="rounded-[4px] border-2 border-dashed border-[var(--ink)] p-6 text-center text-xs font-bold text-[var(--paper-muted)]">
              No API keys saved in your vault yet. Add one below to get started.
            </div>
          )}

          {/* Add Key Form (Collapsible or toggle) */}
          {(showAddForm || savedKeys.length === 0) && (
            <form onSubmit={handleSaveToVault} className="space-y-4 rounded-[4px] border-2 border-[var(--ink)] bg-[var(--paper)] p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between border-b-2 border-[var(--ink)] pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--ink)]">Add Key to Vault</span>
                <span className="text-[10px] font-bold text-[var(--paper-muted)] font-mono uppercase tracking-wider">AES-256 Encrypted</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="keyName" className="text-xs font-bold text-[var(--ink)]">Profile / Key Name</label>
                  <Input
                    id="keyName"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. 9Router Local, OpenRouter Free"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="provider" className="text-xs font-bold text-[var(--ink)]">Provider</label>
                  <Select
                    id="provider"
                    value={provider}
                    onChange={(e) => {
                      const next = e.target.value as Provider
                      setProvider(next)
                      setModel(DEFAULT_MODELS[next])
                    }}
                    className="text-xs"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="apiKey" className="text-xs font-bold text-[var(--ink)]">API Key</label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                    placeholder="Paste provider key"
                    className="text-xs font-mono"
                  />
                  {autoTestStatus !== 'idle' && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white px-1">
                      {autoTestStatus === 'testing' && <LoaderCircle size={16} strokeWidth={2.5} className="animate-spin text-[var(--ink-soft)]" />}
                      {autoTestStatus === 'valid' && <CheckCircle2 size={16} strokeWidth={2.5} className="text-[var(--mint)]" />}
                      {autoTestStatus === 'invalid' && <AlertTriangle size={16} strokeWidth={2.5} className="text-[var(--action-red)]" />}
                    </span>
                  )}
                </div>
              </div>

              {CUSTOM_URL_PROVIDERS.has(provider) && (
                <div className="space-y-1.5">
                  <label htmlFor="baseUrl" className="text-xs font-bold text-[var(--ink)]">Custom Base URL (optional)</label>
                  <Input
                    id="baseUrl"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="e.g. http://127.0.0.1:20128/v1"
                    className="text-xs font-mono"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="model" className="text-xs font-bold text-[var(--ink)]">Model</label>
                {showModelSelect ? (
                  <div className="space-y-2">
                    <Input
                      type="search"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="Search models..."
                      className="text-xs font-mono"
                    />
                    <Select
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="text-xs font-mono"
                    >
                      {availableModels
                        .filter((m) =>
                          m.id === model ||
                          m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                          m.id.toLowerCase().includes(modelSearch.toLowerCase()),
                        )
                        .map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </Select>
                  </div>
                ) : (
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="text-xs font-mono"
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testing || !apiKey}
                  className="text-[0.7rem] uppercase tracking-wider"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading || !apiKey}
                  className="text-[0.7rem] uppercase tracking-wider"
                >
                  {loading ? 'Saving...' : 'Save & Encrypt'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Panel>
  )
}
