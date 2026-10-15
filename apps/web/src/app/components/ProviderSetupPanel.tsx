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
import type { AIProviderType, VerifiedProviderIdentity } from '@repo/types'

import { cn } from '@/lib/ui'
import { ProviderLogo } from './icons/ProviderLogos'
import { Button, Input, Select, StatusBadge } from './ui'

const PRIMARY_PROVIDERS = ['ANTHROPIC', 'OPENAI', 'GEMINI', 'OPENROUTER'] as const satisfies readonly AIProviderType[]
const SECONDARY_PROVIDERS = ['DEEPSEEK', 'GROQ', 'MISTRAL', 'XAI', 'OLLAMA'] as const satisfies readonly AIProviderType[]
const PROVIDERS = [...PRIMARY_PROVIDERS, ...SECONDARY_PROVIDERS] as const
type Provider = (typeof PROVIDERS)[number]

const providerLogoBackgrounds: Record<Provider, string> = {
  ANTHROPIC: 'bg-[#f3e8df] text-[#8d4d34]',
  OPENAI: 'bg-[#e8f1ee] text-[#176b52]',
  GEMINI: 'bg-[#eee9fb] text-[#624b9b]',
  OPENROUTER: 'bg-[#f1ece6] text-[#5e5147]',
  DEEPSEEK: 'bg-[#e6f1f7] text-[#216b8f]',
  GROQ: 'bg-[#fff0d6] text-[#9b5a00]',
  MISTRAL: 'bg-[#f8e8df] text-[#a4462c]',
  XAI: 'bg-[#e8e8e8] text-[#161616]',
  OLLAMA: 'bg-[#e6eee8] text-[#356248]',
}

const warmFocusClass = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-sun-orange)]'

const ghostButtonClass = 'border-0 bg-transparent text-[var(--color-body-text)] hover:bg-[var(--color-paper-warmth)] hover:text-[var(--color-ink-black)]'
const neutralButtonClass = 'border-[var(--border-subtle)] bg-[var(--color-pure-white)] text-[var(--color-ink-black)] hover:bg-[var(--color-paper-warmth)]'
const primaryButtonClass = 'bg-[var(--color-ink-black)] text-white hover:bg-[#2b2723]'

function ProviderMark({ provider, size = 22 }: { provider: Provider; size?: number }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full', providerLogoBackgrounds[provider])} style={{ width: size + 14, height: size + 14 }}>
      <ProviderLogo provider={provider} size={size} />
    </span>
  )
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
  status?: string
  message?: string
  error?: string
  models?: ModelInfo[]
  identity?: VerifiedProviderIdentity
}

const DEFAULT_MODELS: Record<Provider, string> = {
  ANTHROPIC: 'claude-opus-4-5',
  OPENAI: 'gpt-4o',
  GEMINI: 'gemini-2.0-flash',
  OPENROUTER: 'openai/gpt-4o-mini',
  DEEPSEEK: 'deepseek-chat',
  GROQ: 'llama-3.3-70b-versatile',
  MISTRAL: 'mistral-large-latest',
  XAI: 'grok-2-latest',
  OLLAMA: 'llama3.2',
}

const CUSTOM_URL_PROVIDERS: ReadonlySet<Provider> = new Set<Provider>([
  'OPENAI',
  'OPENROUTER',
  'DEEPSEEK',
  'GROQ',
  'MISTRAL',
  'XAI',
  'OLLAMA',
])

const OLLAMA_DEFAULT_URL = 'http://localhost:11434/v1'

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
  const [showAllProviders, setShowAllProviders] = useState(false)

  const [keyName, setKeyName] = useState('')
  const [provider, setProvider] = useState<Provider>('ANTHROPIC')
  const [model, setModel] = useState(DEFAULT_MODELS.ANTHROPIC)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [autoTestStatus, setAutoTestStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle')
  const [autoTestError, setAutoTestError] = useState<string | null>(null)
  const [verifiedIdentity, setVerifiedIdentity] = useState<VerifiedProviderIdentity | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTestRequestRef = useRef(0)
  const autoTestAbortRef = useRef<AbortController | null>(null)

  const selectedKey = savedKeys.find((item) => item.id === selectedKeyId) ?? null
  const providerKeys = savedKeys.filter((item) => item.provider === selectedProvider)
  const activeOrSelectedSecondary = SECONDARY_PROVIDERS.includes(selectedProvider as (typeof SECONDARY_PROVIDERS)[number])
    || savedKeys.some((item) => item.isActive && SECONDARY_PROVIDERS.includes(item.provider as (typeof SECONDARY_PROVIDERS)[number]))
  const effectiveShowAllProviders = showAllProviders || activeOrSelectedSecondary
  const visibleProviders = effectiveShowAllProviders ? PROVIDERS : PRIMARY_PROVIDERS

  const providerName = (value: Provider) => t(`provider${value}` as 'providerANTHROPIC')
  const providerDescription = (value: Provider) => t(`provider${value}Desc` as 'providerANTHROPICDesc')

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
      if (activeKey && isProvider(activeKey.provider)) {
        setSelectedProvider(activeKey.provider)
        if (SECONDARY_PROVIDERS.includes(activeKey.provider as (typeof SECONDARY_PROVIDERS)[number])) {
          setShowAllProviders(true)
        }
      }
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
      setAutoTestStatus('idle')
      setAutoTestError(null)
      setVerifiedIdentity(null)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [selectedKey, selectedProvider])

  const selectProvider = (nextProvider: Provider) => {
    const nextKey = savedKeys.find((item) => item.provider === nextProvider && item.isActive)
      ?? savedKeys.find((item) => item.provider === nextProvider)
    setSelectedProvider(nextProvider)
    setSelectedKeyId(nextKey?.id ?? null)
    setVerifiedIdentity(null)
    setAutoTestError(null)
    setMessage(null)
  }

  const startNewProfile = () => {
    setSelectedProvider('ANTHROPIC')
    setSelectedKeyId(null)
    setVerifiedIdentity(null)
    setAutoTestError(null)
    setMessage(null)
  }

  const handleToggleProviders = () => {
    if (effectiveShowAllProviders) {
      if (SECONDARY_PROVIDERS.includes(selectedProvider as (typeof SECONDARY_PROVIDERS)[number])) {
        const activePrimary = savedKeys.find(
          (item) => item.isActive && PRIMARY_PROVIDERS.includes(item.provider as (typeof PRIMARY_PROVIDERS)[number]),
        )
        const targetPrimary = activePrimary && isProvider(activePrimary.provider) ? activePrimary.provider : 'ANTHROPIC'
        selectProvider(targetPrimary)
      }
      setShowAllProviders(false)
    } else {
      setShowAllProviders(true)
    }
  }

  const runAutoTest = useCallback(async (
    requestId: number,
    signal: AbortSignal,
    key: string,
    providerNameValue: Provider,
    modelValue: string,
    customUrl?: string,
  ) => {
    if (signal.aborted || autoTestRequestRef.current !== requestId) return

    setAutoTestStatus('testing')
    setAutoTestError(null)
    setAvailableModels([])
    setVerifiedIdentity(null)
    setMessage(null)

    try {
      const modelsResponse = await fetch('/api/provider/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerNameValue, apiKey: key, baseUrl: customUrl || undefined }),
        signal,
      })
      const modelsData = (await modelsResponse.json()) as { models?: ModelInfo[]; error?: string; message?: string }

      if (signal.aborted || autoTestRequestRef.current !== requestId) return

      if (!modelsResponse.ok && !modelsData.models?.length) {
        setAvailableModels([])
        setVerifiedIdentity(null)
        setAutoTestStatus('invalid')
        setAutoTestError(modelsData.message || modelsData.error || t('testFailed'))
        return
      }

      if (modelsData.models && modelsData.models.length > 0) {
        setAvailableModels(modelsData.models)
      }

      const testResponse = await fetch('/api/provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerNameValue,
          model: modelValue || DEFAULT_MODELS[providerNameValue],
          apiKey: key,
          baseUrl: customUrl || undefined,
        }),
        signal,
      })
      const testData = (await testResponse.json()) as TestResult

      if (signal.aborted || autoTestRequestRef.current !== requestId) return

      if (testData.status === 'VALID') {
        if (testData.models?.length) {
          setAvailableModels(testData.models)
        }
        setVerifiedIdentity(testData.identity ?? null)
        setAutoTestStatus('valid')
        setAutoTestError(null)
      } else {
        setAvailableModels([])
        setVerifiedIdentity(null)
        setAutoTestStatus('invalid')
        setAutoTestError(testData.message || testData.error || t('testFailed'))
      }
    } catch {
      if (signal.aborted || autoTestRequestRef.current !== requestId) return
      setAvailableModels([])
      setVerifiedIdentity(null)
      setAutoTestStatus('invalid')
      setAutoTestError(t('networkError'))
    }
  }, [t])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    autoTestAbortRef.current?.abort()
    autoTestAbortRef.current = null
    const requestId = ++autoTestRequestRef.current

    if (provider !== 'OLLAMA' && apiKey.length < 8) return

    debounceRef.current = setTimeout(() => {
      const controller = new AbortController()
      autoTestAbortRef.current = controller
      void runAutoTest(requestId, controller.signal, apiKey, provider, model, baseUrl)
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

      const connectionSucceeded = response.ok && (
        selectedKey && !replacingKey ? Boolean(data.identity) : data.status === 'VALID'
      )

      if (!connectionSucceeded) {
        setVerifiedIdentity(null)
        setAutoTestStatus('invalid')
        setAutoTestError(data.message || data.error || t('testFailed'))
        setMessage({ type: 'err', text: data.message || data.error || t('testFailed') })
        return
      }

      setMessage({ type: 'ok', text: t('connectionSuccess', { provider: providerName(provider) }) })
      setVerifiedIdentity(data.identity ?? null)
      setAutoTestStatus('valid')
      setAutoTestError(null)
      setAvailableModels(data.models ?? [])
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
        const data = (await response.json()) as { key?: SavedKeyItem; message?: string; error?: string; identity?: VerifiedProviderIdentity }
        if (!response.ok) {
          setMessage({ type: 'err', text: data.message || data.error || t('saveFailed') })
          return
        }
        setVerifiedIdentity(data.identity ?? null)
        setMessage({ type: 'ok', text: t('changesSaved') })
        await loadSavedKeys()
        return
      }

      if (provider !== 'OLLAMA' && !apiKey) {
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
      const data = (await response.json()) as { key?: SavedKeyItem; message?: string; error?: string; identity?: VerifiedProviderIdentity }
      if (!response.ok || !data.key) {
        setMessage({ type: 'err', text: data.message || data.error || t('saveFailed') })
        return
      }

      setVerifiedIdentity(data.identity ?? null)

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
    setAutoTestStatus('idle')
    setAutoTestError(null)
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
              {visibleProviders.map((providerOption) => {
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
'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                      warmFocusClass,
                      isSelected
                        ? 'border-[var(--color-ink-black)] bg-[var(--color-pure-white)]'
                        : 'border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--color-pure-white)]/70',
                    )}
                  >
                    <span className="flex items-start gap-2.5">
                      <ProviderMark provider={providerOption} size={17} />
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
              {SECONDARY_PROVIDERS.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleProviders}
                  aria-expanded={effectiveShowAllProviders}
                  className={cn(
                    'w-full rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-2.5 text-left text-xs font-semibold text-[var(--color-body-text)] transition-colors hover:border-[var(--color-ink-black)] hover:bg-[var(--color-pure-white)]',
                    warmFocusClass,
                  )}
                >
                  {effectiveShowAllProviders
                    ? t('showFewerProviders')
                    : t('showMoreProviders', { count: SECONDARY_PROVIDERS.length })}
                </button>
              )}
              <button
                type="button"
                onClick={startNewProfile}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-3 text-left text-xs font-semibold text-[var(--color-ink-black)] transition-colors hover:border-[var(--color-ink-black)] hover:bg-[var(--color-pure-white)]',
                  warmFocusClass,
                )}
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
              <ProviderMark provider={provider} size={24} />
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
                <label htmlFor="providerApiKey" className="text-xs font-semibold text-[var(--color-ink-black)]">
                  {t('apiKey')}
                  {provider === 'OLLAMA' && (
                    <span className="ml-1 text-[11px] font-normal text-[var(--color-faint-text)]">
                      ({t('ollamaKeyOptional')})
                    </span>
                  )}
                </label>
                {selectedKey && !replacingKey ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-buttons)] border border-[var(--border-default)] bg-[var(--color-paper-warmth)] px-3 font-mono text-xs text-[var(--color-body-text)]">
                      <KeyRound size={14} className="shrink-0 text-[var(--color-faint-text)]" aria-hidden="true" />
                      <span className="truncate">{selectedKey.keyHint ?? t('maskedKey')}</span>
                    </div>
                    <Button type="button" variant="neutral" size="sm" className={cn(neutralButtonClass, warmFocusClass)} onClick={() => { setReplacingKey(true); setApiKey(''); setMessage(null) }}>
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
                      onChange={(event) => { setApiKey(event.target.value); setVerifiedIdentity(null); setAutoTestError(null) }}
                      required={provider !== 'OLLAMA'}
                      aria-invalid={autoTestStatus === 'invalid'}
                      aria-describedby={autoTestError ? 'providerApiKeyError' : undefined}
                      placeholder={provider === 'OLLAMA' ? t('ollamaKeyOptional') : t('pasteKeyPlaceholder')}
                      className="pl-9 pr-10 font-mono text-xs"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label={t(`autoTest${autoTestStatus === 'testing' ? 'Testing' : autoTestStatus === 'valid' ? 'Valid' : 'Invalid'}` as 'autoTestTesting' | 'autoTestValid' | 'autoTestInvalid')}>
                      {renderAutoTestStatus()}
                    </span>
                  </div>
                )}
                {(!selectedKey || replacingKey) && autoTestStatus === 'invalid' && autoTestError && (
                  <p
                    id="providerApiKeyError"
                    role="alert"
                    className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-[var(--color-vermillion)]"
                  >
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{autoTestError}</span>
                  </p>
                )}
                {replacingKey && <p className="text-[11px] leading-5 text-[var(--color-body-text)]">{t('changeKeyHint')}</p>}
                {provider === 'OLLAMA' && (
                  <p className="text-[11px] leading-5 text-[var(--color-body-text)]">{t('ollamaLocalNote')}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="providerModel" className="text-xs font-semibold text-[var(--color-ink-black)]">{t('model')}</label>
                <div className="space-y-2">
                  <Input
                    id="providerModel"
                    list="provider-model-options"
                    value={model}
                    onChange={(event) => { setModel(event.target.value); setVerifiedIdentity(null) }}
                    className="font-mono text-xs"
                    required
                  />
                  {availableModels.length > 0 && (
                    <datalist id="provider-model-options">
                      {availableModels.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </datalist>
                  )}
                  {availableModels.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-[var(--color-faint-text)]">{t('suggestedModels')}:</span>
                      {availableModels.slice(0, 6).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setModel(m.id)}
                          className={cn(
                            'rounded-md border px-1.5 py-0.5 font-mono text-[10px] transition-colors',
                            model === m.id
                              ? 'border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white'
                              : 'border-[var(--border-subtle)] bg-[var(--color-paper-warmth)] text-[var(--color-body-text)] hover:border-[var(--border-default)]',
                          )}
                        >
                          {m.id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[11px] leading-5 text-[var(--color-body-text)]">{t('modelHint')}</p>
              </div>

              {CUSTOM_URL_PROVIDERS.has(provider) && (
                <div className="space-y-1.5">
                  <label htmlFor="providerBaseUrl" className="text-xs font-semibold text-[var(--color-ink-black)]">{t('customBaseUrl')}</label>
                  <Input
                    id="providerBaseUrl"
                    value={baseUrl}
                    onChange={(event) => { setBaseUrl(event.target.value); setVerifiedIdentity(null) }}
                    placeholder={provider === 'OLLAMA' ? OLLAMA_DEFAULT_URL : t('customBaseUrlPlaceholder')}
                    className="font-mono text-xs"
                  />
                </div>
              )}

              {verifiedIdentity && (
                <div className="rounded-xl border border-[#b8dfce] bg-[#f2faf5] p-3 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-[#237452]">
                    <CheckCircle2 size={15} aria-hidden="true" />
                    <span>{t('verifiedIdentityTitle')}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-[11px]">
                    <div>
                      <span className="text-[var(--color-faint-text)]">{t('verifiedModel')}: </span>
                      <span className="font-mono font-medium text-[var(--color-ink-black)]">{verifiedIdentity.model}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-faint-text)]">{t('verifiedKey')}: </span>
                      <span className="font-mono text-[var(--color-ink-black)]">{verifiedIdentity.maskedKey ?? '••••••••'}</span>
                    </div>
                    {verifiedIdentity.baseUrl && (
                      <div className="sm:col-span-2 truncate">
                        <span className="text-[var(--color-faint-text)]">{t('verifiedEndpoint')}: </span>
                        <span className="font-mono text-[var(--color-ink-black)]">{verifiedIdentity.baseUrl}</span>
                      </div>
                    )}
                    <div className="sm:col-span-2 text-[10px] text-[var(--color-faint-text)]">
                      {t('verifiedAt')}: {new Date(verifiedIdentity.verifiedAt).toLocaleString()}
                    </div>
                  </div>
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
                  <Button type="button" variant="neutral" size="sm" className={cn(neutralButtonClass, warmFocusClass)} onClick={() => void handleActivateKey(selectedKey.id)}>{t('activate')}</Button>
                )}
                {selectedKey && (
                  <Button type="button" variant="neutral" size="sm" className={cn(neutralButtonClass, warmFocusClass, 'hover:bg-[#fff1ee] hover:text-[var(--color-vermillion)]')} onClick={() => void handleDeleteKey(selectedKey.id, selectedKey.name)} aria-label={t('deleteKey')}>
                    <Trash2 size={14} aria-hidden="true" />
                  </Button>
                )}
                <Button type="button" variant="neutral" size="sm" className={cn(ghostButtonClass, warmFocusClass)} onClick={handleCancel}>{t('cancel')}</Button>
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  className={cn(neutralButtonClass, warmFocusClass)}
                  onClick={() => void handleTestConnection()}
                  disabled={testing || (provider !== 'OLLAMA' && ((!selectedKey && !apiKey) || (selectedKey !== null && replacingKey && !apiKey)))}
                >
                  {testing ? t('testing') : t('testConnection')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className={cn(primaryButtonClass, warmFocusClass)}
                  disabled={loading || (provider !== 'OLLAMA' && ((!selectedKey && !apiKey) || (selectedKey !== null && replacingKey && !apiKey)))}
                >
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
