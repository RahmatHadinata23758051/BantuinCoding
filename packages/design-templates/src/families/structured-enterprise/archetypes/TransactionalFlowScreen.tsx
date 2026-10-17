'use client'

import React from 'react'
import { CommandBand } from '../components/CommandBand'
import { StructuredIntakeForm } from '../components/StructuredIntakeForm'

export interface TransactionalFlowScreenProps {
  onReturnToLedger?: () => void
}

export function TransactionalFlowScreen({
  onReturnToLedger,
}: TransactionalFlowScreenProps) {
  return (
    <div className="w-full space-y-4">
      {/* Command Band */}
      <CommandBand
        title="Dock Receiving & Material Intake Voucher"
        subtitle="Northline Central Receiving • Physical audit & quarantine validation"
        breadcrumbs={[
          { label: 'Operations' },
          { label: 'Inbound Dock' },
          { label: 'Stage Receiving' },
        ]}
      />

      {/* Main Intake Form with Persistent Summary */}
      <StructuredIntakeForm onCancel={onReturnToLedger} />
    </div>
  )
}
