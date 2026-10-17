'use client'

import React, { useState } from 'react'
import {
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  LayoutGrid,
  FileCheck2,
} from 'lucide-react'
import { OperationalWorkspaceScreen } from './OperationalWorkspaceScreen'
import { ManagementOverviewScreen } from './ManagementOverviewScreen'
import { TransactionalFlowScreen } from './TransactionalFlowScreen'
import { ScreenArchetypeId } from '../../../types'

export type ViewportMode = 'desktop' | 'tablet' | 'mobile'

export interface StructuredEnterpriseShowcaseProps {
  initialArchetype?: ScreenArchetypeId
  showViewportControls?: boolean
}

export function StructuredEnterpriseShowcase({
  initialArchetype = 'operational-workspace',
  showViewportControls = true,
}: StructuredEnterpriseShowcaseProps) {
  const [activeArchetype, setActiveArchetype] =
    useState<ScreenArchetypeId>(initialArchetype)
  const [viewport, setViewport] = useState<ViewportMode>('desktop')

  const archetypeTabs: { id: ScreenArchetypeId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'operational-workspace',
      label: 'Operational Workspace',
      icon: <Layers className="size-3.5" />,
    },
    {
      id: 'management-overview',
      label: 'Management Overview',
      icon: <LayoutGrid className="size-3.5" />,
    },
    {
      id: 'transactional-flow',
      label: 'Transactional Flow',
      icon: <FileCheck2 className="size-3.5" />,
    },
  ]

  const viewportWidthClass = {
    desktop: 'w-full',
    tablet: 'max-w-[768px] mx-auto border-x border-[#D5DFE7] shadow-md',
    mobile: 'max-w-[375px] mx-auto border-x border-[#D5DFE7] shadow-lg',
  }[viewport]

  return (
    <div className="theme-structured-enterprise w-full min-h-screen bg-[#F4F6F8] text-[#17222D] flex flex-col">
      {/* Showcase Control Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#D5DFE7] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Archetype switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#E9EEF2] rounded-[6px]">
          {archetypeTabs.map((tab) => {
            const isActive = activeArchetype === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveArchetype(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[4px] transition-colors select-none ${
                  isActive
                    ? 'bg-white text-[#245E84] shadow-xs'
                    : 'text-[#546575] hover:text-[#17222D]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Viewport switchers */}
        {showViewportControls && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#546575] hidden md:inline">
              Viewport Test:
            </span>
            <div className="flex items-center gap-1 bg-[#E9EEF2] p-0.5 rounded-[6px]">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                title="Desktop Viewport (100%)"
                className={`p-1.5 rounded transition-colors ${
                  viewport === 'desktop'
                    ? 'bg-white text-[#245E84] shadow-xs'
                    : 'text-[#546575] hover:text-[#17222D]'
                }`}
              >
                <Monitor className="size-4" aria-hidden="true" />
                <span className="sr-only">Desktop Viewport</span>
              </button>
              <button
                type="button"
                onClick={() => setViewport('tablet')}
                title="Tablet Viewport (768px)"
                className={`p-1.5 rounded transition-colors ${
                  viewport === 'tablet'
                    ? 'bg-white text-[#245E84] shadow-xs'
                    : 'text-[#546575] hover:text-[#17222D]'
                }`}
              >
                <Tablet className="size-4" aria-hidden="true" />
                <span className="sr-only">Tablet Viewport</span>
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                title="Mobile Viewport (375px)"
                className={`p-1.5 rounded transition-colors ${
                  viewport === 'mobile'
                    ? 'bg-white text-[#245E84] shadow-xs'
                    : 'text-[#546575] hover:text-[#17222D]'
                }`}
              >
                <Smartphone className="size-4" aria-hidden="true" />
                <span className="sr-only">Mobile Viewport</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Screen Canvas Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div className={`transition-all duration-200 ${viewportWidthClass}`}>
          {activeArchetype === 'operational-workspace' && (
            <OperationalWorkspaceScreen />
          )}
          {activeArchetype === 'management-overview' && (
            <ManagementOverviewScreen />
          )}
          {activeArchetype === 'transactional-flow' && (
            <TransactionalFlowScreen
              onReturnToLedger={() => setActiveArchetype('operational-workspace')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
