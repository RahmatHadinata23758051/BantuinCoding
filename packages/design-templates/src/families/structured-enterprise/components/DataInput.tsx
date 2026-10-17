'use client'

import React from 'react'
import { Search, X } from 'lucide-react'

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search by SKU, name, or location...',
  className = '',
  ...props
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className="absolute left-2.5 size-4 text-[#546575] pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-9 pl-8 pr-8 text-sm bg-white text-[#17222D] placeholder-[#8898AA] border border-[#D5DFE7] rounded-[6px] focus:outline-none focus:border-[#245E84] focus:ring-1 focus:ring-[#245E84] transition-colors"
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 p-0.5 text-[#546575] hover:text-[#17222D] rounded focus:outline-none"
          aria-label="Clear search"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export interface SelectInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  label?: string
}

export function SelectInput({
  options,
  label,
  className = '',
  ...props
}: SelectInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold text-[#546575]">{label}</label>
      )}
      <select
        className={`h-9 px-3 text-sm bg-white text-[#17222D] border border-[#D5DFE7] rounded-[6px] focus:outline-none focus:border-[#245E84] focus:ring-1 focus:ring-[#245E84] transition-colors ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function TextInput({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}: TextInputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#546575]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`h-9 px-3 text-sm bg-white text-[#17222D] placeholder-[#8898AA] border ${
          error ? 'border-[#B83C49] focus:ring-[#B83C49]' : 'border-[#D5DFE7] focus:border-[#245E84] focus:ring-[#245E84]'
        } rounded-[6px] focus:outline-none focus:ring-1 transition-colors ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[#B83C49] font-medium">{error}</span>}
      {!error && hint && <span className="text-xs text-[#8898AA]">{hint}</span>}
    </div>
  )
}
