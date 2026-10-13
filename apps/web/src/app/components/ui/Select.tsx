'use client'

import { Check, ChevronDown } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Children, isValidElement, useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react'

import { cn } from '@/lib/ui'

interface OptionItem {
  value: string
  label: string
  disabled?: boolean
}

export interface CustomSelectProps {
  id?: string
  value?: string
  defaultValue?: string
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  children?: ReactNode
  className?: string
  disabled?: boolean
  name?: string
  required?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
}

function readOptions(children: ReactNode): OptionItem[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== 'option') return []
    const props = child.props as { value?: string; children?: ReactNode; disabled?: boolean }
    return [{
      value: props.value ?? '',
      label: typeof props.children === 'string' ? props.children : String(props.children ?? ''),
      disabled: props.disabled,
    }]
  })
}

export function Select({
  id,
  value,
  defaultValue,
  onChange,
  children,
  className,
  disabled,
  name,
  required,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: CustomSelectProps) {
  const options = readOptions(children)
  const generatedId = useId()
  const menuId = `${id ?? generatedId}-menu`
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [open, setOpen] = useState(false)
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? options[0]?.value ?? '')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const selectedValue = value ?? uncontrolledValue
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue))
  const firstEnabledIndex = Math.max(0, options.findIndex((option) => !option.disabled))
  const selectedOption = options[selectedIndex]
  const highlightedOption = options[highlightedIndex]
  const initialHighlightIndex = selectedOption?.disabled ? firstEnabledIndex : selectedIndex

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return

    const menu = menuRef.current
    const trigger = triggerRef.current
    if (!menu || !trigger) return

    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect()
      const viewportPadding = 8
      const gap = 6
      const availableAbove = Math.max(0, rect.top - gap - viewportPadding)
      const availableBelow = Math.max(0, window.innerHeight - rect.bottom - gap - viewportPadding)
      const preferredHeight = Math.min(256, Math.max(96, window.innerHeight - viewportPadding * 2))
      const openAbove = availableBelow < Math.min(preferredHeight, 160) && availableAbove > availableBelow
      const availableSpace = openAbove ? availableAbove : availableBelow
      const maxHeight = Math.max(80, Math.min(preferredHeight, availableSpace))
      const width = Math.min(Math.max(rect.width, 180), window.innerWidth - viewportPadding * 2)
      const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding)
      const top = openAbove
        ? Math.max(viewportPadding, rect.top - gap - maxHeight)
        : Math.min(window.innerHeight - viewportPadding, rect.bottom + gap)

      menu.style.top = `${top}px`
      menu.style.left = `${left}px`
      menu.style.width = `${width}px`
      menu.style.maxHeight = `${maxHeight}px`
      menu.style.visibility = 'visible'
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    document.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, open])

  const emitChange = (nextValue: string) => {
    setUncontrolledValue(nextValue)
    if (onChange) {
      const event = { target: { value: nextValue }, currentTarget: { value: nextValue } } as ChangeEvent<HTMLSelectElement>
      onChange(event)
    }
    setOpen(false)
  }

  const moveHighlight = (direction: 1 | -1) => {
    if (options.length === 0) return
    let next = highlightedIndex
    for (let step = 0; step < options.length; step += 1) {
      next = (next + direction + options.length) % options.length
      if (!options[next].disabled) {
        setHighlightedIndex(next)
        return
      }
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'Tab' && open) {
      setOpen(false)
      return
    }
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      setHighlightedIndex(initialHighlightIndex)
      setOpen(true)
      return
    }
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveHighlight(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveHighlight(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setHighlightedIndex(firstEnabledIndex)
    } else if (event.key === 'End') {
      event.preventDefault()
      setHighlightedIndex(Math.max(0, options.findLastIndex((option) => !option.disabled)))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (highlightedOption && !highlightedOption.disabled) emitChange(highlightedOption.value)
    }
  }

  const menu = open ? (
    <div
      ref={menuRef}
      id={menuId}
      role="listbox"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className="fixed z-[1000] overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--color-pure-white)] p-1.5 shadow-[0_18px_40px_rgba(38,32,27,0.14)]"
      style={{ top: 0, left: 0, visibility: 'hidden' }}
    >
      {options.length > 0 ? options.map((option, index) => {
        const selected = option.value === selectedValue
        const highlighted = index === highlightedIndex
        const optionId = `${menuId}-option-${index}`
        return (
          <div
            key={option.value}
            id={optionId}
            ref={(node) => { optionRefs.current[index] = node }}
            role="option"
            aria-selected={selected}
            aria-disabled={option.disabled || undefined}
            onMouseEnter={() => {
              if (!option.disabled) setHighlightedIndex(index)
            }}
            onClick={() => {
              if (!option.disabled) emitChange(option.value)
            }}
            className={cn(
              'flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors',
              highlighted ? 'bg-[var(--color-paper-warmth)]' : 'bg-transparent',
              selected ? 'font-semibold text-[var(--color-ink-black)]' : 'text-[var(--color-body-text)]',
              'cursor-pointer select-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
            )}
          >
            <span className="min-w-0 truncate">{option.label}</span>
            {selected && <Check size={14} className="shrink-0 text-[var(--workspace-primary,#a85e3c)]" aria-hidden="true" />}
          </div>
        )
      }) : (
        <p className="px-3 py-2 text-xs text-[var(--color-body-text)]">No options</p>
      )}
    </div>
  ) : null

  return (
    <div ref={rootRef} className="relative w-full">
      <input type="hidden" name={name} value={selectedValue} required={required} disabled={disabled} />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-activedescendant={open && highlightedOption && !highlightedOption.disabled ? `${menuId}-option-${highlightedIndex}` : undefined}
        onClick={() => {
          setHighlightedIndex(initialHighlightIndex)
          setOpen((current) => !current)
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-3 rounded-[var(--radius-buttons)] border border-[var(--border-default)] bg-[var(--color-pure-white)] px-3 py-2.5 text-left text-sm text-[var(--color-ink-black)] transition-colors',
          'hover:border-[var(--border-hi)] focus-visible:border-[var(--color-sun-orange)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-sun-orange)]',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
      >
        <span className={cn('min-w-0 truncate', !selectedOption && 'text-[var(--color-faint-text)]')}>
          {selectedOption?.label ?? '—'}
        </span>
        <ChevronDown size={16} className={cn('shrink-0 text-[var(--color-body-text)] transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
    </div>
  )
}
