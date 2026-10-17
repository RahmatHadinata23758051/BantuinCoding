'use client'

import React, { useState, useMemo } from 'react'
import { Plus, SlidersHorizontal, Download } from 'lucide-react'
import { CommandBand } from '../components/CommandBand'
import { DenseTable, SortDirection } from '../components/DenseTable'
import { InspectorDrawer } from '../components/InspectorDrawer'
import { SearchInput, SelectInput } from '../components/DataInput'
import { Button } from '../components/Button'
import { NORTHLINE_INVENTORY, InventoryItem } from '../fixtures'

export function OperationalWorkspaceScreen() {
  const [items, setItems] = useState<InventoryItem[]>(NORTHLINE_INVENTORY)
  const [selectedItemId, setSelectedItemId] = useState<string | null>('inv-102')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortKey, setSortKey] = useState<keyof InventoryItem>('sku')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)

  // Filter & Sort
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesQuery =
          searchQuery === '' ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory =
          categoryFilter === 'ALL' || item.category === categoryFilter

        const matchesStatus =
          statusFilter === 'ALL' || item.status === statusFilter

        return matchesQuery && matchesCategory && matchesStatus
      })
      .sort((a, b) => {
        if (!sortDirection) return 0
        const valA = a[sortKey]
        const valB = b[sortKey]

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA
        }

        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA))
      })
  }, [items, searchQuery, categoryFilter, statusFilter, sortKey, sortDirection])

  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) ?? null
  }, [items, selectedItemId])

  const handleSort = (key: keyof InventoryItem) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else if (sortDirection === 'desc') setSortDirection(null)
      else setSortDirection('asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItemId(item.id)
    setIsInspectorOpen(true)
  }

  return (
    <div className="w-full space-y-4">
      {/* Page Command Band */}
      <CommandBand
        title="Inventory Ledger & Asset Allocation"
        subtitle="Northline Central Facility • Plant 02 • Real-time operational staging"
        breadcrumbs={[
          { label: 'Operations' },
          { label: 'Warehousing' },
          { label: 'Inventory' },
        ]}
        primaryAction={{
          label: 'Inbound Receipt',
          icon: <Plus className="size-4" />,
          onClick: () => alert('Demo: Route to Transactional Intake Archetype'),
        }}
        secondaryActions={[
          {
            label: 'Export Ledger',
            icon: <Download className="size-3.5" />,
            onClick: () => alert('Demo: Exporting CSV format'),
          },
        ]}
      >
        {/* Filter controls row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex-1 max-w-sm">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SelectInput
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'Fasteners', label: 'Fasteners' },
                { value: 'Electronics', label: 'Electronics' },
                { value: 'Fluid Control', label: 'Fluid Control' },
                { value: 'Raw Materials', label: 'Raw Materials' },
              ]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />

            <SelectInput
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'in-stock', label: 'In Stock' },
                { value: 'low-stock', label: 'Low Stock' },
                { value: 'depleted', label: 'Depleted' },
                { value: 'quarantined', label: 'Quarantined' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />

            <Button
              variant={isInspectorOpen ? 'secondary' : 'ghost'}
              size="sm"
              icon={<SlidersHorizontal className="size-3.5" />}
              onClick={() => setIsInspectorOpen(!isInspectorOpen)}
              aria-expanded={isInspectorOpen}
            >
              Inspector {isInspectorOpen ? 'On' : 'Off'}
            </Button>
          </div>
        </div>
      </CommandBand>

      {/* Main Workspace Layout (Dense Table + Split Drawer) */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        <main className="flex-1 min-w-0 w-full">
          <DenseTable
            items={filteredItems}
            selectedId={selectedItemId}
            onSelectItem={handleSelectItem}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </main>

        {isInspectorOpen && (
          <InspectorDrawer
            item={selectedItem}
            isOpen={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
            onQuickAdjust={(item) => {
              setItems((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, inStock: i.inStock + 50 } : i
                )
              )
            }}
          />
        )}
      </div>
    </div>
  )
}
