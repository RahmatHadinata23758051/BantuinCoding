'use client'

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/ui'
import { Button, Input, Select, StatusBadge } from './ui'

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
  status?: string
  message?: string
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

function isProvider(value: string): value is Provider {
  return PROVIDERS.includes(value as Provider)
}

export function ProviderSetupPanel() {
  const t = useTranslations('ProviderSetup')
  const [savedKeys, setSavedKeys] = useState<SavedKeyItem[]>([])
  const [loadingKeys, setLoadingKeys] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider>('ANTHROPIC')
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [replacingKey, setReplacingKey] = useState(false)

  const [keyName, setKeyName] = useState('')
  const [provider, setProvider] = useState<Provider>('ANTHROPIC')
  const [model, setModel] = useState(DEFAULT_MODELS.ANTHROPIC)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [autoTestStatus, setAutoTestStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle')
  const [modelSearch, setModelSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTestRequestRef = useRef(0)
  const autoTestAbortRef = useRef<AbortController | null>(null)

  const selectedKey = savedKeys.find((item) => item.id === selectedKeyId) ?? null
  const providerKeys = savedKeys.filter((item) => item.provider === selectedProvider)
  const showModelSelect = modelsLoaded && availableModels.length > 0

  const providerName = (value: Provider) => t(`provider${value}` as 'providerANTHROPIC' | 'providerOPENAI' | 'providerGEMINI' | 'providerOPENROUTER')
  const providerDescription = (value: Provider) => t(`provider${value}Desc` as 'providerANTHROPICDesc' | 'providerOPENAIDesc' | 'providerGEMINIDesc' | 'providerOPENROUTERDesc')

  const loadSavedKeys = async () => {
    setLoadingKeys(true)
    setLoadError(false)
    try {
      const res = await fetch('/api/provider/keys')
      if (!res.ok) {
        setLoadError(true)
        return
      }
      const data = (await res.json()) as { keys?: SavedKeyItem[] }
      const nextKeys = data.keys || []
      setSavedKeys(nextKeys)
      setSelectedKeyId((current) => {
        if (current && nextKeys.some((item) => item.id === current)) return current
        return nextKeys.find((item) => item.isActive)?.id ?? nextKeys[0]?.id ?? null
      })
      const activeKey = nextKeys.find((item) => item.isActive)
      if (activeKey && isProvider(activeKey.provider)) setSelectedProvider(activeKey.provider)
    } catch {
      setLoadError(true)
    } finally {
      setLoadingKeys(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSavedKeys()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (selectedKey) {
        const selectedKeyProvider = isProvider(selectedKey.provider) ? selectedKey.provider : selectedProvider
        setSelectedProvider(selectedKeyProvider)
        setProvider(selectedKeyProvider)
        setKeyName(selectedKey.name)
        setModel(selectedKey.model)
        setBaseUrl(selectedKey.baseUrl ?? '')
        setApiKey('')
        setReplacingKey(false)
      } else {
        setProvider(selectedProvider)
        setKeyName('')
        setModel(DEFAULT_MODELS[selectedProvider])
        setBaseUrl('')
        setApiKey('')
        setReplacingKey(false)
      }
      setAvailableModels([])
      setModelsLoaded(false)
      setModelSearch('')
      setAutoTestStatus('idle')
    }, 0)

    return () => window.clearTimeout(timer)
  }, [selectedKey, selectedProvider])

  const selectProvider = (nextProvider: Provider) => {
    const nextKey = savedKeys.find((item) => item.provider === nextProvider && item.isActive)
      ?? savedKeys.find((item) => item.provider === nextProvider)
    setSelectedProvider(nextProvider)
    setSelectedKeyId(nextKey?.id ?? null)
    setMessage(null)
  }

  const startNewProfile = () => {
    setSelectedProvider('ANTHROPIC')
    setSelectedKeyId(null)
    setMessage(null)
  }

  const runAutoTest = useCallback(async (
    requestId: number,
    signal: AbortSignal,
    key: string,
    providerNameValue: Provider,
    customUrl?: string,
  ) => {
    if (signal.aborted || autoTestRequestRef.current !== requestId) return

    setAutoTestStatus('testing')
    setAvailableModels([])
    setModelsLoaded(false)
    setMessage(null)

    try {
      const modelsResponse = await fetch('/api/provider/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerNameValue, apiKey: key, baseUrl: customUrl || undefined }),
        signal,
      })
      const modelsData = (await modelsResponse.json()) as { models?: ModelInfo[] }

      if (signal.aborted || autoTestRequestRef.current !== requestId) return

      if (modelsData.models && modelsData.models.length > 0) {
        setAvailableModels(modelsData.models)
        setModelsLoaded(true)
        setAutoTestStatus('valid')
        return
      }

      const testResponse = await fetch('/api/provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerNameValue,
          model: model || DEFAULT_MODELS[providerNameValue],
          apiKey: key,
          baseUrl: customUrl || undefined,
        }),
        signal,
      })
      const testData = (await testResponse.json()) as TestResult

      if (signal.aborted || autoTestRequestRef.current !== requestId) return

      if (testData.status === 'VALID') {
        setAvailableModels(testData.models ?? [])
        setModelsLoaded(Boolean(testData.models?.length))
        setAutoTestStatus('valid')
      } else {
        setAvailableModels([])
        setModelsLoaded(false)
        setAutoTestStatus('invalid')
      }
    } catch {
      if (signal.aborted || autoTestRequestRef.current !== requestId) return
      setAvailableModels([])
      setModelsLoaded(false)
      setAutoTestStatus('invalid')
    }
  }, [model])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    autoTestAbortRef.current?.abort()
    autoTestAbortRef.current = null
    const requestId = ++autoTestRequestRef.current

    if (apiKey.length < 8) return

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController()
      autoTestAbortRef.current = controller
      void runAutoTest(requestId, controller.signal, apiKey, provider, baseUrl)
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      autoTestAbortRef.current?.abort()
      autoTestAbortRef.current = null
      autoTestRequestRef.current += 1
    }
  }, [apiKey, provider, baseUrl, model, runAutoTest])

  const handleActivateKey = async (keyId: string) => {
    setMessage(null)
    try {
      const res = await fetch(`/api/provider/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      if (!res.ok) {
        setMessage({ type: 'err', text: t('switchFailed') })
        return
      }
      const data = (await res.json()) as { key: SavedKeyItem }
      setMessage({ type: 'ok', text: t('switchedActive', { name: data.key.name, provider: data.key.provider, model: data.key.model }) })
      await loadSavedKeys()
    } catch {
      setMessage({ type: 'err', text: t('switchFailed') })
    }
  }

  const handleDeleteKey = async (keyId: string, name: string) => {
    if (!confirm(t('deleteConfirm', { name }))) return
    setMessage(null)
    try {
      const res = await fetch(`/api/provider/keys/${keyId}`, { method: 'DELETE' })
      if (!res.ok) {
        setMessage({ type: 'err', text: t('deleteFailed') })
        return
      }
      setMessage({ type: 'ok', text: t('deleteSuccess') })
      setSelectedKeyId(null)
      await loadSavedKeys()
    } catch {
      setMessage({ type: 'err', text: t('deleteFailed') })
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setMessage(null)

    try {
      const response = selectedKey && !replacingKey
        ? await fetch(`/api/provider/keys/${selectedKey.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            baseUrl: baseUrl || null,
            testConnection: true,
          }),
        })
        : await fetch('/api/provider/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, model, apiKey, baseUrl: baseUrl || undefined }),
        })
      const data = (await response.json()) as TestResult

      const connectionSucceeded = selectedKey && !replacingKey
        ? response.ok
        : response.ok && data.status === 'VALID'

      if (!connectionSucceeded) {
        setMessage({ type: 'err', text: data.message ?? t('testFailed') })
        return
      }

      setMessage({ type: 'ok', text: t('connectionSuccess', { provider: providerName(provider) }) })
      setAvailableModels(data.models ?? [])
      setModelsLoaded(Boolean(data.models?.length))
      if (selectedKey && !replacingKey) await loadSavedKeys()
    } catch {
      setMessage({ type: 'err', text: t('networkError') })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (selectedKey && !replacingKey) {
        const response = await fetch(`/api/provider/keys/${selectedKey.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: keyName.trim() || selectedKey.name,
            model,
            baseUrl: baseUrl || null,
            isActive: true,
            testConnection: true,
          }),
        })
        const data = (await response.json()) as { key?: SavedKeyItem; message?: string }
        if (!response.ok) {
          setMessage({ type: 'err', text: data.message ?? t('saveFailed') })
          return
        }
        setMessage({ type: 'ok', text: t('changesSaved') })
        await loadSavedKeys()
        return
      }

      if (!apiKey) {
        setMessage({ type: 'err', text: t('keyRequiredForSave') })
        return
      }

      const nameToUse = keyName.trim() || `${provider} · ${model}`
      const response = await fetch('/api/provider/keys', {
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
      const data = (await response.json()) as { key?: SavedKeyItem; message?: string }
      if (!response.ok || !data.key) {
        setMessage({ type: 'err', text: data.message ?? t('saveFailed') })
        return
      }

      if (!data.key.isActive) {
        const activateResponse = await fetch(`/api/provider/keys/${data.key.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true }),
        })
        if (!activateResponse.ok) {
          setMessage({ type: 'err', text: t('activationAfterSaveFailed') })
          await loadSavedKeys()
          return
        }
      }

      setMessage({ type: 'ok', text: replacingKey ? t('keyReplacedSuccess') : t('keySavedSuccess', { name: nameToUse }) })
      setSelectedProvider(provider)
      setSelectedKeyId(data.key.id)
      setApiKey('')
      setReplacingKey(false)
      await loadSavedKeys()
    } catch {
      setMessage({ type: 'err', text: t('networkErrorSaving') })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (selectedKey) {
      setProvider(isProvider(selectedKey.provider) ? selectedKey.provider : selectedProvider)
      setKeyName(selectedKey.name)
      setModel(selectedKey.model)
      setBaseUrl(selectedKey.baseUrl ?? '')
      setApiKey('')
      setReplacingKey(false)
    } else {
      setKeyName('')
      setModel(DEFAULT_MODELS[selectedProvider])
      setBaseUrl('')
      setApiKey('')
    }
    setMessage(null)
    setAvailableModels([])
    setModelsLoaded(false)
    setAutoTestStatus('idle')
  }

  const renderAutoTestStatus = () => {
    if (autoTestStatus === 'testing') return <LoaderCircle size={15} className="animate-spin text-[var(--color-body-text)]" aria-hidden="true" />
    if (autoTestStatus === 'valid') return <CheckCircle2 size={15} className="text-[#237452]" aria-hidden="true" />
    if (autoTestStatus === 'invalid') return <AlertTriangle size={15} className="text-[var(--color-vermillion)]" aria-hidden="true" />
    return null
  }

  return (
    <section aria-labelledby="provider-setup-heading" className="overflow-hidden rounded-[var(--radius-cards)] border border-[var(--border-subtle)] bg-[var(--color-pure-white)]">
      <div className="grid lg:grid-cols-[minmax(12rem,15rem)_minmax(0,1fr)]">
        <aside className="border-b border-[var(--border-subtle)] bg-[var(--color-paper-warmth)] p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-black)]">{t('yourProviders')}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-body-text)]">{t('chooseProvider')}</p>
            </div>
            <span className="font-mono text-[10px] text-[var(--color-faint-text)]">{PROVIDERS.length}</span>
          </div>

          {loadingKeys ? (
            <div className="mt-5 flex items-center gap-2 text-xs text-[var(--color-body-text)]" role="status">
              <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
              {t('loadingKeys')}
            </div>
          ) : loadError ? (
            <div className="mt-5 space-y-3 text-xs leading-5 text-[var(--color-body-text)]" role="alert">
              <p>{t('loadFailed')}</p>
              <Button type="button" variant="neutral" size="sm" onClick={() => void loadSavedKeys()}>{t('retryLoad')}</Button>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {PROVIDERS.map((providerOption) => {
                const keys = savedKeys.filter((item) => item.provider === providerOption)
                const preview = keys.find((item) => item.isActive) ?? keys[0]
                const isSelected = selectedProvider === providerOption
                return (
                  <button
                    key={providerOption}
                    type="button"
                    onClick={() => selectProvider(providerOption)}
                    aria-pressed={isSelected}
                    className={cn(
                      'w-full rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-sun-orange)]',
                      isSelected
                        ? 'border-[var(--color-ink-black)] bg-[var(--color-pure-white)]'
                        : 'border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--color-pure-white)]/70',
                    )}
                  >
                    <span className="flex items-start gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f8d9c7] text-xs font-semibold text-[var(--workspace-primary,#a85e3c)]" aria-hidden="true">
                        {providerOption.slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-[var(--color-ink-black)]">{providerName(providerOption)}</span>
                          {preview?.isActive && <Check size={13} className="shrink-0 text-[#237452]" aria-hidden="true" />}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-[var(--color-body-text)]">{providerDescription(providerOption)}</span>
                        <span className={cn('mt-1 block text-[10px] font-medium', preview?.isActive ? 'text-[#237452]' : 'text-[var(--color-faint-text)]')}>
                          {preview?.isActive ? t('connected') : preview ? t('saved') : t('notConnected')}
                          {keys.length > 1 && ` · ${keys.length}`}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={startNewProfile}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-3 text-left text-xs font-semibold text-[var(--color-ink-black)] transition-colors hover:border-[var(--color-ink-black)] hover:bg-[var(--color-pure-white)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-sun-orange)]"
              >
                <Plus size={15} aria-hidden="true" />
                {t('addProvider')}
              </button>
            </div>
          )}
        </aside>

        <div className="min-w-0">
          <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7 sm:py-6">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f8d9c7] text-sm font-semibold text-[var(--workspace-primary,#a85e3c)]" aria-hidden="true">
                {provider.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <h2 id="provider-setup-heading" className="truncate text-xl font-semibold tracking-[-0.04em] text-[var(--color-ink-black)] sm:text-2xl">
                  {providerName(provider)}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-body-text)] sm:text-sm">{providerDescription(provider)}</p>
              </div>
            </div>
            <StatusBadge tone={selectedKey?.isActive ? 'success' : selectedKey ? 'neutral' : 'pending'}>
              {selectedKey?.isActive ? <Check size={13} aria-hidden="true" /> : null}
              {selectedKey?.isActive ? t('connectedReady') : selectedKey ? t('saved') : t('notConnected')}
            </StatusBadge>
          </div>

          {message && (
            <div
              role={message.type === 'err' ? 'alert' : 'status'}
              className={cn(
                'flex items-center gap-2 border-b border-[var(--border-subtle)] px-5 py-3 text-xs leading-5 sm:px-7',
                message.type === 'ok' ? 'bg-[#eef8f2] text-[#237452]' : 'bg-[#fff1ee] text-[var(--color-vermillion)]',
              )}
            >
              {message.type === 'ok' ? <CheckCircle2 size={15} className="shrink-0" aria-hidden="true" /> : <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="space-y-5 p-5 sm:p-7">
              {providerKeys.length > 1 && (
                <div className="space-y-1.5">
                  <label htmlFor="providerProfile" className="text-xs font-semibold text-[var(--color-ink-black)]">{t('providerProfile')}</label>
                  <Select
                    id="providerProfile"
                    value={selectedKeyId ?? ''}
                    onChange={(event) => setSelectedKeyId(event.target.value || null)}
                    className="text-xs"
                  >
                    {providerKeys.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.model}</option>)}
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="providerApiKey" className="text-xs font-semibold text-[var(--color-ink-black)]">{t('apiKey')}</label>
                {selectedKey && !replacingKey ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-buttons)] border border-[var(--border-default)] bg-[var(--color-paper-warmth)] px-3 font-mono text-xs text-[var(--color-body-text)]">
                      <KeyRound size={14} className="shrink-0 text-[var(--color-faint-text)]" aria-hidden="true" />
                      <span className="truncate">{selectedKey.keyHint ?? t('maskedKey')}</span>
                    </div>
                    <Button type="button" variant="neutral" size="sm" onClick={() => { setReplacingKey(true); setApiKey(''); setMessage(null) }}>
                      {t('changeKey')}
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <KeyRound size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint-text)]" aria-hidden="true" />
                    <Input
                      id="providerApiKey"
                      type="password"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      required
                      placeholder={t('pasteKeyPlaceholder')}
                      className="pl-9 pr-10 font-mono text-xs"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label={t(`autoTest${autoTestStatus === 'testing' ? 'Testing' : autoTestStatus === 'valid' ? 'Valid' : 'Invalid'}` as 'autoTestTesting' | 'autoTestValid' | 'autoTestInvalid')}>
                      {renderAutoTestStatus()}
                    </span>
                  </div>
                )}
                {replacingKey && <p className="text-[11px] leading-5 text-[var(--color-body-text)]">{t('changeKeyHint')}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="providerModel" className="text-xs font-semibold text-[var(--color-ink-black)]">{t('model')}</label>
                {showModelSelect ? (
                  <div className="space-y-2">
                    <Input
                      type="search"
                      value={modelSearch}
                      onChange={(event) => setModelSearch(event.target.value)}
                      placeholder={t('searchModels')}
                      className="text-xs"
                    />
                    <Select id="providerModel" value={model} onChange={(event) => setModel(event.target.value)} className="font-mono text-xs">
                      {availableModels
                        .filter((item) => item.id === model || item.name.toLowerCase().includes(modelSearch.toLowerCase()) || item.id.toLowerCase().includes(modelSearch.toLowerCase()))
                        .map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}
                    </Select>
                  </div>
                ) : (
                  <Input id="providerModel" value={model} onChange={(event) => setModel(event.target.value)} className="font-mono text-xs" required />
                )}
                <p className="text-[11px] leading-5 text-[var(--color-body-text)]">{t('modelHint')}</p>
              </div>

              {CUSTOM_URL_PROVIDERS.has(provider) && (
                <div className="space-y-1.5">
                  <label htmlFor="providerBaseUrl" className="text-xs font-semibold text-[var(--color-ink-black)]">{t('customBaseUrl')}</label>
                  <Input id="providerBaseUrl" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder={t('customBaseUrlPlaceholder')} className="font-mono text-xs" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 border-t border-[var(--border-subtle)] bg-[var(--color-paper-warmth)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex min-w-0 items-start gap-2 text-[11px] leading-5 text-[var(--color-body-text)]">
                <LockKeyhole size={14} className="mt-0.5 shrink-0 text-[var(--workspace-primary,#a85e3c)]" aria-hidden="true" />
                <span>{t('detailSecurityNote')}</span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {selectedKey && !selectedKey.isActive && !replacingKey && (
                  <Button type="button" variant="neutral" size="sm" onClick={() => void handleActivateKey(selectedKey.id)}>{t('activate')}</Button>
                )}
                {selectedKey && (
                  <Button type="button" variant="neutral" size="sm" onClick={() => void handleDeleteKey(selectedKey.id, selectedKey.name)} aria-label={t('deleteKey')}>
                    <Trash2 size={14} aria-hidden="true" />
                  </Button>
                )}
                <Button type="button" variant="neutral" size="sm" onClick={handleCancel}>{t('cancel')}</Button>
                <Button type="button" variant="neutral" size="sm" onClick={() => void handleTestConnection()} disabled={testing || (!selectedKey && !apiKey) || (selectedKey !== null && replacingKey && !apiKey)}>
                  {testing ? t('testing') : t('testConnection')}
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={loading || (!selectedKey && !apiKey) || (selectedKey !== null && replacingKey && !apiKey)}>
                  {loading ? t('saving') : selectedKey && !replacingKey ? t('saveChanges') : t('saveEncrypt')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
