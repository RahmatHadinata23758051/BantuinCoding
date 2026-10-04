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
    <Panel className="overflow-hidden border border-slate-200/80 bg-white shadow-sm rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors',
          isConfigured ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-amber-50/50 hover:bg-amber-50',
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm',
            isConfigured ? 'border-emerald-200 bg-emerald-100/70 text-emerald-800' : 'border-amber-200 bg-amber-100/70 text-amber-800',
          )}>
            {isConfigured ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <KeyRound size={18} strokeWidth={2.5} />}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-900">AI Provider Vault</span>
              <StatusBadge tone={isConfigured ? 'success' : 'pending'}>
                {isConfigured ? 'Active & Ready' : 'Key Required'}
              </StatusBadge>
            </span>
            <span className="mt-0.5 block truncate font-mono text-xs text-slate-500">
              {isConfigured && meta?.provider
                ? `${meta.provider} / ${meta.model}`
                : 'Save multiple provider profiles and switch seamlessly.'}
            </span>
          </span>
        </span>
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {message && (
        <div
          role={message.type === 'err' ? 'alert' : 'status'}
          className={cn(
            'flex items-center gap-2.5 border-t px-5 py-2.5 text-xs font-semibold',
            message.type === 'ok' ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-rose-100 bg-rose-50 text-rose-800',
          )}
        >
          {message.type === 'ok' ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertTriangle size={15} className="shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-6">
          {/* Saved Keys Vault Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Saved Provider Keys</h3>
              <p className="text-xs text-slate-500">Manage multiple keys across providers and switch anytime.</p>
            </div>
            <Button
              type="button"
              variant={showAddForm ? 'neutral' : 'secondary'}
              size="sm"
              onClick={() => setShowAddForm((v) => !v)}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus size={14} className={cn('transition-transform', showAddForm && 'rotate-45')} />
              {showAddForm ? 'Cancel' : 'Add New Key'}
            </Button>
          </div>

          {/* Saved Keys List */}
          {savedKeys.length > 0 ? (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-slate-50/50 overflow-hidden">
              {savedKeys.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors',
                    item.isActive ? 'bg-emerald-50/60' : 'hover:bg-white',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleActivateKey(item.id)}
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                        item.isActive
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-400 bg-white',
                      )}
                      title={item.isActive ? 'Active Key' : 'Click to activate this key'}
                    >
                      {item.isActive && <Check size={12} strokeWidth={3} />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">{item.name}</span>
                        {item.isActive && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-800">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                        <span className="font-semibold text-slate-700">{item.provider}</span>
                        <span>•</span>
                        <span className="text-indigo-600 font-medium">{item.model}</span>
                        {item.baseUrl && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 truncate max-w-[180px]">{item.baseUrl}</span>
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
                        className="text-xs h-7 px-2.5 font-medium"
                      >
                        Activate
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteKey(item.id, item.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete key"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !loadingKeys && (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              No API keys saved in your vault yet. Add one below to get started.
            </div>
          )}

          {/* Add Key Form (Collapsible or toggle) */}
          {(showAddForm || savedKeys.length === 0) && (
            <form onSubmit={handleSaveToVault} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Add Key to Vault</span>
                <span className="text-xs text-slate-400 font-mono">Encrypted with AES-256</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="keyName" className="text-xs font-bold text-slate-700">Profile / Key Name</label>
                  <Input
                    id="keyName"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. 9Router Local, OpenRouter Free"
                    className="text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="provider" className="text-xs font-bold text-slate-700">Provider</label>
                  <Select
                    id="provider"
                    value={provider}
                    onChange={(e) => {
                      const next = e.target.value as Provider
                      setProvider(next)
                      setModel(DEFAULT_MODELS[next])
                    }}
                    className="text-xs bg-white"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="apiKey" className="text-xs font-bold text-slate-700">API Key</label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                    placeholder="Paste provider key"
                    className="text-xs font-mono bg-white"
                  />
                  {autoTestStatus !== 'idle' && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {autoTestStatus === 'testing' && <LoaderCircle size={14} className="animate-spin text-slate-400" />}
                      {autoTestStatus === 'valid' && <CheckCircle2 size={14} className="text-emerald-600" />}
                      {autoTestStatus === 'invalid' && <AlertTriangle size={14} className="text-rose-600" />}
                    </span>
                  )}
                </div>
              </div>

              {CUSTOM_URL_PROVIDERS.has(provider) && (
                <div className="space-y-1">
                  <label htmlFor="baseUrl" className="text-xs font-bold text-slate-700">Custom Base URL (optional)</label>
                  <Input
                    id="baseUrl"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="e.g. http://127.0.0.1:20128/v1"
                    className="text-xs font-mono bg-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="model" className="text-xs font-bold text-slate-700">Model</label>
                {showModelSelect ? (
                  <div className="space-y-1.5">
                    <Input
                      type="search"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="Search models..."
                      className="text-xs bg-white font-mono"
                    />
                    <Select
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="text-xs bg-white font-mono"
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
                    className="text-xs bg-white font-mono"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testing || !apiKey}
                  className="text-xs"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !apiKey}
                  className="text-xs font-semibold"
                >
                  {loading ? 'Saving...' : 'Save & Encrypt to Vault'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Panel>
  )
}
