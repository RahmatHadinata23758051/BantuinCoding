'use client'

import { AlertTriangle, CheckCircle2, ChevronDown, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

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

const PROVIDERS = ['ANTHROPIC', 'OPENAI', 'GEMINI', 'OPENROUTER'] as const
type Provider = (typeof PROVIDERS)[number]

const DEFAULT_MODELS: Record<Provider, string> = {
  ANTHROPIC: 'claude-opus-5-5',
  OPENAI: 'gpt-5',
  GEMINI: 'gemini-2.5-pro',
  OPENROUTER: 'anthropic/claude-opus-5-5',
}

export function ProviderSetupPanel() {
  const [meta, setMeta] = useState<ProviderMeta | null>(null)
  const [provider, setProvider] = useState<Provider>('ANTHROPIC')
  const [model, setModel] = useState(DEFAULT_MODELS.ANTHROPIC)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true

    void fetch('/api/provider/configure')
      .then(async (response) => {
        const data = (await response.json()) as ProviderMeta
        if (!response.ok) {
          throw new Error(data.error ?? 'Unable to load provider status')
        }
        return data
      })
      .then((data) => {
        if (active) setMeta(data)
      })
      .catch(() => {
        if (active) setMeta({ configured: false })
      })

    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/provider/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey }),
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
                  Model ID
                </label>
                <Input
                  id="model"
                  type="text"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  required
                  className="font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="apiKey" className="text-sm font-black">
                API key
              </label>
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
              <div className="flex items-start gap-2 text-xs leading-5 text-[var(--paper-muted)]">
                <ShieldCheck className="mt-0.5 shrink-0 text-[var(--pass-teal)]" size={16} aria-hidden="true" />
                <p>
                  Session-scoped only. The full key is never returned, logged, stored in the database,
                  added to generated Markdown, or included in a ZIP.
                </p>
              </div>
            </div>

            <Button type="submit" disabled={loading || !apiKey} className="w-full sm:w-fit">
              {loading && <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />}
              {loading ? 'Testing connection…' : 'Test and save'}
            </Button>
          </form>
        </div>
      )}
    </Panel>
  )
}
