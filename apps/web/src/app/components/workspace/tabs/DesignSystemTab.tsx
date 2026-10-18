import { Loader2, Network, RefreshCw } from 'lucide-react'
import type { SystemGraphData } from '@repo/types'
import { DesignSystemGraph } from '@/app/components/DesignSystemGraph'
import { EmptyState } from '../components/EmptyState'
import { BUTTON_FOCUS_CLASS } from '../constants'
import type { WorkspaceArtifactItem } from '@/app/components/MarkdownWorkspace'

export interface DesignSystemTabProps {
  active: boolean
  systemGraph: SystemGraphData | null
  artifacts: WorkspaceArtifactItem[]
  systemGraphError: string | null
  isRepairingSystemGraph: boolean
  isGenerating: boolean
  onRepairSystemGraph: () => void | Promise<void>
  t: (key: string) => string
  tCommon: (key: string) => string
}

export function DesignSystemTab({
  active,
  systemGraph,
  artifacts,
  systemGraphError,
  isRepairingSystemGraph,
  isGenerating,
  onRepairSystemGraph,
  t,
  tCommon,
}: DesignSystemTabProps) {
  const hasDesignSystemGraph = Boolean(systemGraph?.nodes?.length)
  const hasArchitectureReady = artifacts.some(
    (artifact) => artifact.type === 'ARCHITECTURE' && ['READY', 'MODIFIED'].includes(artifact.status),
  )

  return (
    <div className={active ? 'space-y-6' : 'hidden'}>
      {hasDesignSystemGraph && systemGraph ? (
        <DesignSystemGraph graph={systemGraph} />
      ) : (
        <EmptyState
          icon={Network}
          title={t('noGraphData')}
          description={
            hasArchitectureReady
              ? t('noGraphDataReadyArchitectureDesc')
              : t('noGraphDataDesc')
          }
          action={
            <div className="space-y-3">
              {systemGraphError && <p className="text-sm font-medium text-red-700">{systemGraphError}</p>}
              {hasArchitectureReady && (
                <button
                  type="button"
                  onClick={() => void onRepairSystemGraph()}
                  disabled={isRepairingSystemGraph || isGenerating}
                  className={`inline-flex min-h-11 items-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                >
                  {isRepairingSystemGraph ? (
                    <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="size-4" aria-hidden="true" />
                  )}
                  {isRepairingSystemGraph ? tCommon('loading') : t('buildSystemMap')}
                </button>
              )}
            </div>
          }
        />
      )}
    </div>
  )
}
