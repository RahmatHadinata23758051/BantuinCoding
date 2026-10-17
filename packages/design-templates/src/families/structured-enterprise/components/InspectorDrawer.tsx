'use client'

import React from 'react'
import { X, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { StatusBadge } from './StatusBadge'
import { InventoryItem } from '../fixtures'

export interface InspectorDrawerProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onQuickAdjust?: (item: InventoryItem) => void
}

export function InspectorDrawer({
  item,
  isOpen,
  onClose,
  onQuickAdjust,
}: InspectorDrawerProps) {
  if (!isOpen || !item) return null

  const available = Math.max(0, item.inStock - item.reserved)
  const isBelowReorder = item.inStock <= item.reorderPoint

  return (
    <aside
      aria-label="Item Inspector"
      className="w-full lg:w-88 shrink-0 bg-white border border-[#D5DFE7] rounded-[8px] flex flex-col shadow-xs"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#D5DFE7] flex items-start justify-between gap-2 bg-[#F8FAFC] rounded-t-[8px]">
        <div>
          <span className="font-mono text-xs font-semibold text-[#245E84]">
            {item.sku}
          </span>
          <h2 className="text-sm font-bold text-[#17222D] leading-snug mt-0.5 font-heading">
            {item.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-[#546575] hover:text-[#17222D] hover:bg-[#E9EEF2] rounded focus:outline-none focus:ring-1 focus:ring-[#245E84]"
          aria-label="Close inspector panel"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Body content */}
      <div className="p-4 space-y-5 text-xs text-[#17222D] overflow-y-auto max-h-[70vh]">
        {/* Status & Reorder Alert */}
        <div className="flex items-center justify-between">
          <span className="text-[#546575] font-semibold">Inventory Status</span>
          <StatusBadge status={item.status} />
        </div>

        {isBelowReorder && (
          <div className="p-2.5 bg-[#FDF4E7] border border-[#F8DDB7] rounded-[6px] flex items-start gap-2 text-[#A05C08]">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold">Reorder Threshold Reached</p>
              <p className="text-[11px] mt-0.5">
                Current stock ({item.inStock}) is at or below minimum buffer ({item.reorderPoint}).
              </p>
            </div>
          </div>
        )}

        {/* Quantities breakdown */}
        <div className="bg-[#F4F6F8] p-3 rounded-[6px] space-y-2 border border-[#D5DFE7]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#546575]">
            Stock Allocation Ledger
          </span>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
            <div className="bg-white p-2 rounded border border-[#D5DFE7]">
              <span className="block text-[10px] text-[#546575]">In Stock</span>
              <strong className="text-sm font-bold text-[#17222D] tabular-nums">
                {item.inStock}
              </strong>
            </div>
            <div className="bg-white p-2 rounded border border-[#D5DFE7]">
              <span className="block text-[10px] text-[#546575]">Reserved</span>
              <strong className="text-sm font-bold text-[#546575] tabular-nums">
                {item.reserved}
              </strong>
            </div>
            <div className="bg-white p-2 rounded border border-[#D5DFE7]">
              <span className="block text-[10px] text-[#546575]">Available</span>
              <strong
                className={`text-sm font-bold tabular-nums ${
                  available === 0 ? 'text-[#B83C49]' : 'text-[#20755D]'
                }`}
              >
                {available}
              </strong>
            </div>
          </div>
        </div>

        {/* Technical specifications */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#546575]">
            Operational Parameters
          </span>
          <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs pt-1 border-t border-[#D5DFE7]">
            <dt className="text-[#546575]">Category</dt>
            <dd className="font-medium text-right text-[#17222D]">{item.category}</dd>

            <dt className="text-[#546575]">Warehouse Bin</dt>
            <dd className="font-mono text-right text-[#17222D]">{item.location}</dd>

            <dt className="text-[#546575]">Unit Cost</dt>
            <dd className="font-mono text-right text-[#17222D]">
              ${item.unitCost.toFixed(2)} / {item.unit}
            </dd>

            <dt className="text-[#546575]">Lead Time</dt>
            <dd className="font-mono text-right text-[#17222D]">{item.leadTimeDays} days</dd>

            <dt className="text-[#546575]">Primary Supplier</dt>
            <dd className="text-right truncate text-[#17222D]" title={item.supplier}>
              {item.supplier}
            </dd>

            <dt className="text-[#546575]">Last Verified Audit</dt>
            <dd className="font-mono text-right text-[#546575]">{item.lastAudited}</dd>
          </dl>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#D5DFE7] bg-[#F8FAFC] rounded-b-[8px] flex items-center gap-2 mt-auto">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          icon={<RefreshCw className="size-3.5" />}
          onClick={() => onQuickAdjust?.(item)}
        >
          Quick Adjust
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<ExternalLink className="size-3.5" />}
          onClick={() => {}}
        >
          History
        </Button>
      </div>
    </aside>
  )
}
