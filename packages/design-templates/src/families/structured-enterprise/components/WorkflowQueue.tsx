'use client'

import React from 'react'
import { Truck, CheckCircle2, ArrowRight } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { Button } from './Button'
import { InboundWorkflow } from '../fixtures'

export interface WorkflowQueueProps {
  workflows: InboundWorkflow[]
  onProcessWorkflow?: (wf: InboundWorkflow) => void
  className?: string
}

export function WorkflowQueue({
  workflows,
  onProcessWorkflow,
  className = '',
}: WorkflowQueueProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#17222D] font-heading">
            Inbound Intake & Inspection Queue
          </h2>
          <p className="text-xs text-[#546575]">
            Dock assignments and active receiving workflows for today
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-[#E9EEF2] text-[#245E84] rounded">
          {workflows.length} active
        </span>
      </div>

      <div className="divide-y divide-[#D5DFE7] bg-white border border-[#D5DFE7] rounded-[8px] overflow-hidden shadow-xs">
        {workflows.map((wf) => {
          const isUrgent = wf.priority === 'urgent'

          return (
            <div
              key={wf.id}
              className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isUrgent ? 'bg-[#FFF9F9]' : 'hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-[6px] shrink-0 border ${
                    isUrgent
                      ? 'bg-[#FCECEE] text-[#B83C49] border-[#F7C6CB]'
                      : 'bg-[#F4F6F8] text-[#245E84] border-[#D5DFE7]'
                  }`}
                >
                  <Truck className="size-4" aria-hidden="true" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#17222D]">
                      {wf.shipmentCode}
                    </span>
                    <StatusBadge status={wf.status} />
                    {isUrgent && <StatusBadge status="urgent" label="EXPEDITE" />}
                  </div>

                  <p className="text-xs font-medium text-[#17222D] mt-0.5">
                    {wf.supplier}{' '}
                    <span className="text-[#546575] font-normal">
                      via {wf.carrier}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-[#546575]">
                    <span>
                      ETA:{' '}
                      <strong className="text-[#17222D]">{wf.expectedArrival}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Dock:{' '}
                      <strong className="text-[#17222D] font-mono">{wf.dockBay}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Items:{' '}
                      <strong className="text-[#17222D] font-mono tabular-nums">
                        {wf.itemCount} units
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Inspector:{' '}
                      <strong className="text-[#17222D]">{wf.inspector}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {wf.status === 'cleared' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#20755D] font-semibold">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    Complete
                  </span>
                ) : (
                  <Button
                    variant={isUrgent ? 'primary' : 'secondary'}
                    size="sm"
                    icon={<ArrowRight className="size-3" />}
                    onClick={() => onProcessWorkflow?.(wf)}
                  >
                    Process Intake
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
