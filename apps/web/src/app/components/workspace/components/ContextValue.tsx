import { Check, Circle, ShieldCheck } from 'lucide-react'
import { formatLabel, isSensitiveContextValue } from '../helpers'
import { SENSITIVE_CONTEXT_KEY } from '../constants'

export function SensitiveContextValue({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[var(--workspace-muted)]">
      <ShieldCheck aria-hidden="true" className="size-4" />
      {label}
    </span>
  )
}

export function ContextValue({
  value,
  depth = 0,
  locale,
  emptyLabel,
  yesLabel,
  noLabel,
  entryLabel,
  noFieldsLabel,
  sensitiveLabel,
}: {
  value: unknown
  depth?: number
  locale: string
  emptyLabel: string
  yesLabel: string
  noLabel: string
  entryLabel: (index: number) => string
  noFieldsLabel: string
  sensitiveLabel: string
}) {
  if (value === null || value === undefined) {
    return <span className="text-[var(--workspace-faint)]">{emptyLabel}</span>
  }

  if (typeof value === 'boolean') {
    return (
      <span className="inline-flex items-center gap-2">
        {value ? (
          <Check aria-hidden="true" className="size-4 text-[var(--workspace-ink)]" />
        ) : (
          <Circle aria-hidden="true" className="size-4 text-[var(--workspace-faint)]" />
        )}
        {value ? yesLabel : noLabel}
      </span>
    )
  }

  if (typeof value === 'string') {
    const isProvenance = ['confirmed', 'assumed', 'unknown'].includes(value.toLowerCase())

    if (isProvenance) {
      return (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 font-sans text-xs font-semibold ${
            value.toLowerCase() === 'confirmed'
              ? 'bg-[var(--workspace-mint-soft)] text-emerald-800'
              : value.toLowerCase() === 'assumed'
                ? 'bg-[var(--workspace-yellow-soft)] text-amber-800'
                : 'bg-black/[0.04] text-[var(--workspace-ink)]'
          }`}
        >
          {formatLabel(value)}
        </span>
      )
    }

    return <span className="whitespace-pre-wrap break-words">{value}</span>
  }

  if (typeof value === 'number') {
    return <span>{value.toLocaleString(locale)}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-[var(--workspace-faint)]">{emptyLabel}</span>
    }

    const primitivesOnly = value.every((item) => item === null || typeof item !== 'object')

    if (primitivesOnly) {
      return (
        <ul className="space-y-2">
          {value.map((item, index) => (
            <li key={`${String(item)}-${index}`} className="flex gap-2">
              <span
                aria-hidden="true"
                className="mt-2.5 size-2 shrink-0 border border-[var(--workspace-ink)] bg-[var(--workspace-primary)]"
              />
              <ContextValue
                value={item}
                depth={depth + 1}
                locale={locale}
                emptyLabel={emptyLabel}
                yesLabel={yesLabel}
                noLabel={noLabel}
                entryLabel={entryLabel}
                noFieldsLabel={noFieldsLabel}
                sensitiveLabel={sensitiveLabel}
              />
            </li>
          ))}
        </ul>
      )
    }

    return (
      <ol className="space-y-3">
        {value.map((item, index) => (
          <li key={index} className="border-l border-[var(--workspace-border-muted)] pl-3">
            <span className="mb-2 block font-sans text-xs font-semibold text-[var(--workspace-muted)]">
              {entryLabel(index + 1)}
            </span>
            <ContextValue
              value={item}
              depth={depth + 1}
              locale={locale}
              emptyLabel={emptyLabel}
              yesLabel={yesLabel}
              noLabel={noLabel}
              entryLabel={entryLabel}
              noFieldsLabel={noFieldsLabel}
              sensitiveLabel={sensitiveLabel}
            />
          </li>
        ))}
      </ol>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)

    if (entries.length === 0) {
      return <span className="text-[var(--workspace-faint)]">{noFieldsLabel}</span>
    }

    return (
      <dl className={depth > 1 ? 'space-y-3' : 'divide-y divide-[var(--workspace-border)]'}>
        {entries.map(([key, nestedValue]) => (
          <div
            key={key}
            className={
              depth > 1
                ? 'grid gap-1 sm:grid-cols-[minmax(8rem,0.35fr)_1fr] sm:gap-4'
                : 'grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(10rem,0.35fr)_1fr] sm:gap-6'
            }
          >
            <dt className="font-sans text-xs font-semibold text-[var(--workspace-muted)]">
              {formatLabel(key)}
            </dt>
            <dd className="min-w-0 text-sm font-medium leading-6 text-[var(--workspace-ink)]">
              {SENSITIVE_CONTEXT_KEY.test(key) || isSensitiveContextValue(nestedValue) ? (
                <SensitiveContextValue label={sensitiveLabel} />
              ) : (
                <ContextValue
                  value={nestedValue}
                  depth={depth + 1}
                  locale={locale}
                  emptyLabel={emptyLabel}
                  yesLabel={yesLabel}
                  noLabel={noLabel}
                  entryLabel={entryLabel}
                  noFieldsLabel={noFieldsLabel}
                  sensitiveLabel={sensitiveLabel}
                />
              )}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return <span>{String(value)}</span>
}
