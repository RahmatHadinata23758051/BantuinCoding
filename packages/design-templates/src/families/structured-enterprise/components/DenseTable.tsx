'use client'

import React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { InventoryItem } from '../fixtures'

export type SortDirection = 'asc' | 'desc' | null

export interface DenseTableProps {
  items: InventoryItem[]
  selectedId: string | null
  onSelectItem: (item: InventoryItem) => void
  sortKey: keyof InventoryItem
  sortDirection: SortDirection
  onSort: (key: keyof InventoryItem) => void
  isLoading?: boolean
  error?: string
}

export function DenseTable({
  items,
  selectedId,
  onSelectItem,
  sortKey,
  sortDirection,
  onSort,
  isLoading = false,
  error,
}: DenseTableProps) {
  const renderSortIcon = (key: keyof InventoryItem) => {
    if (sortKey !== key || !sortDirection) {
      return <ArrowUpDown className="size-3 text-[#8898AA]" aria-hidden="true" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="size-3 text-[#245E84]" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-3 text-[#245E84]" aria-hidden="true" />
    )
  }

  if (isLoading) {
    return (
      <div className="w-full bg-white border border-[#D5DFE7] rounded-[8px] p-8 text-center text-sm text-[#546575]">
        <div className="inline-block size-6 border-2 border-[#245E84] border-t-transparent rounded-full animate-spin mb-2" />
        <p>Loading inventory ledger...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full bg-[#FCECEE] border border-[#F7C6CB] rounded-[8px] p-6 text-center text-sm text-[#B83C49]">
        <p className="font-semibold">Unable to load records</p>
        <p className="mt-1 text-xs">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="w-full bg-white border border-[#D5DFE7] rounded-[8px] p-12 text-center text-sm text-[#546575]">
        <p className="font-semibold text-[#17222D]">No matching inventory items</p>
        <p className="mt-1 text-xs text-[#8898AA]">
          Try adjusting your search criteria or clearing filters.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full bg-white border border-[#D5DFE7] rounded-[8px] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#E9EEF2] border-b border-[#D5DFE7] text-[#546575] font-semibold select-none">
              <th className="py-2.5 px-3 w-10 text-center">
                <span className="sr-only">Row Select</span>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-[#17222D]"
                onClick={() => onSort('sku')}
              >
                <div className="flex items-center gap-1">
                  <span>SKU / Code</span>
                  {renderSortIcon('sku')}
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-[#17222D]"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-1">
                  <span>Item Description</span>
                  {renderSortIcon('name')}
                </div>
              </th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Location</th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[#17222D]"
                onClick={() => onSort('inStock')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>In Stock</span>
                  {renderSortIcon('inStock')}
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Reserved</th>
              <th className="py-2.5 px-3 text-right">Available</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D5DFE7]">
            {items.map((item) => {
              const isSelected = selectedId === item.id
              const available = Math.max(0, item.inStock - item.reserved)

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#E7EFF5] hover:bg-[#DCE7EF]'
                      : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <td className="py-2 px-3 text-center">
                    <input
                      type="radio"
                      name="selected-inventory-item"
                      checked={isSelected}
                      onChange={() => onSelectItem(item)}
                      aria-label={`Select ${item.sku}`}
                      className="size-3.5 text-[#245E84] focus:ring-[#245E84]"
                    />
                  </td>
                  <td className="py-2 px-3 font-mono font-medium text-[#17222D] whitespace-nowrap">
                    {item.sku}
                  </td>
                  <td className="py-2 px-3 font-medium text-[#17222D] max-w-xs truncate">
                    {item.name}
                  </td>
                  <td className="py-2 px-3 text-[#546575] whitespace-nowrap">
                    {item.category}
                  </td>
                  <td className="py-2 px-3 text-[#546575] font-mono whitespace-nowrap">
                    {item.location}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#17222D] tabular-nums whitespace-nowrap">
                    {item.inStock.toLocaleString()}{' '}
                    <span className="font-normal text-[11px] text-[#8898AA]">
                      {item.unit}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[#546575] tabular-nums whitespace-nowrap">
                    {item.reserved > 0 ? item.reserved.toLocaleString() : '—'}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                      available === 0 ? 'text-[#B83C49]' : 'text-[#20755D]'
                    }`}
                  >
                    {available.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 bg-[#F4F6F8] border-t border-[#D5DFE7] flex items-center justify-between text-xs text-[#546575]">
        <span>
          Showing <strong className="text-[#17222D]">{items.length}</strong> catalog items
        </span>
        <span className="font-mono text-[11px] text-[#8898AA]">
          Tabular ledger • Click row to inspect
        </span>
      </div>
    </div>
  )
}
