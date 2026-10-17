'use client'

import React, { useState } from 'react'
import { RefreshCw, Filter, FileText } from 'lucide-react'
import { CommandBand } from '../components/CommandBand'
import { StatRail, StatItem } from '../components/StatRail'
import { WorkflowQueue } from '../components/WorkflowQueue'
import { Button } from '../components/Button'
import {
  NORTHLINE_WORKFLOWS,
  NORTHLINE_AUDIT_LOGS,
  InboundWorkflow,
  AuditLogEntry,
} from '../fixtures'

export function ManagementOverviewScreen() {
  const [workflows, setWorkflows] = useState<InboundWorkflow[]>(NORTHLINE_WORKFLOWS)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(NORTHLINE_AUDIT_LOGS)

  const overviewStats: StatItem[] = [
    {
      id: 'stat-skus',
      label: 'Monitored SKUs',
      value: 1240,
      unit: 'items',
      context: 'Across Plant 01 & 02 facilities',
      status: 'normal',
    },
    {
      id: 'stat-low',
      label: 'Buffer Depletion',
      value: 14,
      unit: 'SKUs',
      context: 'Below safety reorder threshold',
      status: 'warning',
    },
    {
      id: 'stat-urgent',
      label: 'Active Expedited',
      value: 2,
      unit: 'inbound',
      context: 'Dock bay inspection priority',
      status: 'danger',
    },
    {
      id: 'stat-audits',
      label: 'Cycle Counts (7d)',
      value: 98.4,
      unit: '%',
      context: 'Audit variance within tolerance',
      status: 'normal',
    },
  ]

  const handleProcessWorkflow = (wf: InboundWorkflow) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === wf.id ? { ...w, status: 'cleared' } : w))
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Command Band */}
      <CommandBand
        title="Plant Operations & Dock Management"
        subtitle="Northline Central Facility • Shift B Operational Cockpit"
        breadcrumbs={[{ label: 'Management' }, { label: 'Operations Overview' }]}
        primaryAction={{
          label: 'Run Cycle Count',
          icon: <RefreshCw className="size-3.5" />,
          onClick: () => alert('Demo: Starting new cycle count batch'),
        }}
        secondaryActions={[
          {
            label: 'Shift Report',
            icon: <FileText className="size-3.5" />,
            onClick: () => alert('Demo: Generating shift PDF report'),
          },
        ]}
      />

      {/* Borderless KPI Stat-Rail */}
      <section aria-label="Facility Metrics">
        <StatRail stats={overviewStats} />
      </section>

      {/* Inbound Priority Workflow Queue */}
      <section aria-label="Inbound Intake Queue">
        <WorkflowQueue
          workflows={workflows}
          onProcessWorkflow={handleProcessWorkflow}
        />
      </section>

      {/* Recent Audit Ledger Section */}
      <section aria-label="Recent Audit Ledger" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#17222D] font-heading">
              Recent Inventory Adjustments & Audit Records
            </h2>
            <p className="text-xs text-[#546575]">
              Real-time discrepancy and receiving log recorded by facility operators
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<Filter className="size-3" />}
            onClick={() => {}}
          >
            Filter Logs
          </Button>
        </div>

        <div className="bg-white border border-[#D5DFE7] rounded-[8px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E9EEF2] border-b border-[#D5DFE7] text-[#546575] font-semibold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3 text-right">Delta</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                  <th className="py-2.5 px-3">Recorded Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D5DFE7]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2 px-3 font-mono text-[#546575] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-2 px-3 font-medium text-[#17222D] whitespace-nowrap">
                      {log.operator}
                    </td>
                    <td className="py-2 px-3 font-mono text-[#245E84] font-semibold whitespace-nowrap">
                      {log.sku}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F4F6F8] border border-[#D5DFE7] text-[#546575]">
                        {log.action}
                      </span>
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap ${
                        log.delta > 0
                          ? 'text-[#20755D]'
                          : log.delta < 0
                          ? 'text-[#B83C49]'
                          : 'text-[#546575]'
                      }`}
                    >
                      {log.delta > 0 ? `+${log.delta}` : log.delta}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-[#17222D] tabular-nums whitespace-nowrap">
                      {log.balanceAfter.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-[#546575] max-w-sm truncate">
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
