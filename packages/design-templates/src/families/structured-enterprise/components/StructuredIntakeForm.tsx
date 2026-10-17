'use client'

import React, { useState } from 'react'
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from './Button'
import { TextInput, SelectInput } from './DataInput'

export interface IntakeFormData {
  shipmentCode: string
  supplier: string
  sku: string
  lotNumber: string
  quantity: number
  unitCost: number
  condition: 'PRISTINE' | 'INSPECT_REQUIRED' | 'DAMAGED'
  dockBay: string
  inspectorNotes: string
}

export interface StructuredIntakeFormProps {
  onSuccess?: (data: IntakeFormData) => void
  onCancel?: () => void
  initialShipmentCode?: string
}

export function StructuredIntakeForm({
  onSuccess,
  onCancel,
  initialShipmentCode = 'SHP-2026-8801',
}: StructuredIntakeFormProps) {
  const [formData, setFormData] = useState<IntakeFormData>({
    shipmentCode: initialShipmentCode,
    supplier: 'Semicon Matrix Corp',
    sku: 'NL-ELEC-4109',
    lotNumber: 'LOT-2026-X99',
    quantity: 120,
    unitCost: 42.0,
    condition: 'PRISTINE',
    dockBay: 'Bay 03 / Bin C-12',
    inspectorNotes: 'Passed exterior package thermal inspection. No breach detected.',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof IntakeFormData, string>>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof IntakeFormData, string>> = {}
    if (!formData.lotNumber.trim()) {
      newErrors.lotNumber = 'Lot identifier is required for tracking compliance.'
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than zero.'
    }
    if (!formData.dockBay.trim()) {
      newErrors.dockBay = 'Designated warehouse dock or bin is required.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitted(true)
    onSuccess?.(formData)
  }

  const totalValue = formData.quantity * formData.unitCost

  if (isSubmitted) {
    return (
      <div className="bg-white border border-[#D5DFE7] rounded-[8px] p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="size-12 mx-auto rounded-full bg-[#E9F5F1] text-[#20755D] flex items-center justify-center">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#17222D] font-heading">
            Intake Manifest Verified & Staged
          </h2>
          <p className="text-xs text-[#546575] max-w-md mx-auto mt-1">
            Lot <strong>{formData.lotNumber}</strong> containing{' '}
            <strong>{formData.quantity} units</strong> has been recorded in the local
            staging ledger for <strong>{formData.dockBay}</strong>.
          </p>
        </div>

        <div className="bg-[#F4F6F8] p-4 rounded-[6px] max-w-sm mx-auto text-left text-xs font-mono border border-[#D5DFE7] space-y-1">
          <div className="flex justify-between">
            <span className="text-[#546575]">Shipment:</span>
            <span className="font-semibold text-[#17222D]">{formData.shipmentCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#546575]">SKU:</span>
            <span className="font-semibold text-[#17222D]">{formData.sku}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#546575]">Estimated Value:</span>
            <span className="font-semibold text-[#20755D]">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsSubmitted(false)
              onCancel?.()
            }}
          >
            Return to Ledger
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setIsSubmitted(false)
              setFormData((prev) => ({
                ...prev,
                lotNumber: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
                quantity: 50,
              }))
            }}
          >
            Stage Another Lot
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-6"
    >
      {/* Form Fields */}
      <div className="bg-white border border-[#D5DFE7] rounded-[8px] p-5 space-y-4 shadow-xs">
        <div className="border-b border-[#D5DFE7] pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#17222D] font-heading">
              Inbound Receiving & Inspection Voucher
            </h2>
            <p className="text-xs text-[#546575]">
              Verify physical package integrity before updating ERP inventory levels
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-[#546575] bg-[#F4F6F8] px-2 py-1 rounded border border-[#D5DFE7]">
            Step 2 of 3
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            label="Shipment Code"
            value={formData.shipmentCode}
            disabled
            className="bg-[#F4F6F8] font-mono"
          />

          <TextInput
            label="Supplier / Vendor"
            value={formData.supplier}
            disabled
            className="bg-[#F4F6F8]"
          />

          <SelectInput
            label="Target Inventory SKU"
            options={[
              { value: 'NL-ELEC-4109', label: 'NL-ELEC-4109 — Hall Effect Sensor ±50A' },
              { value: 'NL-FAST-8821', label: 'NL-FAST-8821 — M8 Flange Hex Bolt' },
              { value: 'NL-FLUD-9204', label: 'NL-FLUD-9204 — Viton O-Ring Seal Kit' },
              { value: 'NL-RAWM-1250', label: 'NL-RAWM-1250 — Aluminum Rail 40x40' },
            ]}
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          />

          <TextInput
            label="Manufacturer Lot / Batch #"
            value={formData.lotNumber}
            onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
            error={errors.lotNumber}
            placeholder="e.g. LOT-2026-X99"
            required
          />

          <TextInput
            label="Physical Count Received (units)"
            type="number"
            min={1}
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
            }
            error={errors.quantity}
            required
          />

          <TextInput
            label="Designated Warehouse Location / Bin"
            value={formData.dockBay}
            onChange={(e) => setFormData({ ...formData, dockBay: e.target.value })}
            error={errors.dockBay}
            placeholder="e.g. Bay 03 / Shelf C-12"
            required
          />
        </div>

        <SelectInput
          label="Packaging Integrity & Quarantine Assessment"
          options={[
            { value: 'PRISTINE', label: 'Pristine — Factory Seals Intact, Zero Defect' },
            {
              value: 'INSPECT_REQUIRED',
              label: 'Minor Discrepancy — Secondary QA Audit Required',
            },
            {
              value: 'DAMAGED',
              label: 'Visible Damage — Immediate Quarantine Hold',
            },
          ]}
          value={formData.condition}
          onChange={(e) =>
            setFormData({
              ...formData,
              condition: e.target.value as IntakeFormData['condition'],
            })
          }
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#546575]">
            Receiving Inspector Notes & Observations
          </label>
          <textarea
            rows={3}
            value={formData.inspectorNotes}
            onChange={(e) =>
              setFormData({ ...formData, inspectorNotes: e.target.value })
            }
            className="w-full p-2.5 text-xs bg-white text-[#17222D] border border-[#D5DFE7] rounded-[6px] focus:outline-none focus:border-[#245E84] focus:ring-1 focus:ring-[#245E84]"
            placeholder="Document seal conditions, courier signature notes, or temperature readings..."
          />
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-[#D5DFE7]">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="size-3.5" />}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="ml-auto"
            icon={<CheckCircle2 className="size-4" />}
          >
            Authorize & Stage Receipt
          </Button>
        </div>
      </div>

      {/* Persistent Summary Panel */}
      <aside
        aria-label="Intake Summary Ledger"
        className="bg-[#F8FAFC] border border-[#D5DFE7] rounded-[8px] p-4 flex flex-col justify-between shadow-xs"
      >
        <div className="space-y-4">
          <div className="border-b border-[#D5DFE7] pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#546575]">
              Receipt Summary
            </span>
            <p className="text-xs text-[#546575] mt-0.5">
              Live calculation of staged shipment allocation
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#546575]">SKU Target:</span>
              <span className="font-mono font-medium text-[#17222D]">{formData.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#546575]">Lot Code:</span>
              <span className="font-mono text-[#17222D]">{formData.lotNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#546575]">Quantity:</span>
              <span className="font-mono font-bold text-[#17222D] tabular-nums">
                {formData.quantity.toLocaleString()} units
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#546575]">Unit Cost:</span>
              <span className="font-mono text-[#17222D] tabular-nums">
                ${formData.unitCost.toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-[#D5DFE7] flex justify-between items-baseline">
              <span className="font-bold text-[#17222D]">Total Asset Value:</span>
              <span className="font-mono text-base font-bold text-[#20755D] tabular-nums">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white border border-[#D5DFE7] rounded-[6px] space-y-1.5 text-xs">
            <span className="font-semibold text-[#17222D] flex items-center gap-1.5">
              <AlertCircle className="size-3.5 text-[#245E84]" aria-hidden="true" />
              Routing Directive
            </span>
            <p className="text-[11px] text-[#546575] leading-relaxed">
              Upon approval, this lot will be routed directly to{' '}
              <strong className="text-[#17222D]">{formData.dockBay}</strong>. Barcode
              labels will be queued at Terminal 04.
            </p>
          </div>
        </div>

        <div className="pt-4 text-[11px] text-[#8898AA] text-center border-t border-[#D5DFE7] mt-6">
          Deterministic local staging • Northline ERP
        </div>
      </aside>
    </form>
  )
}
