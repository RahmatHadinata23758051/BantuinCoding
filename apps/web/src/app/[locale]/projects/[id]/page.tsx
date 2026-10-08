import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { getProjectWorkspaceData } from '@/lib/projects/workspace-service'
import { ProjectWorkspaceContainer } from '@/app/components/ProjectWorkspaceContainer'
import { redirect, notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const { id } = await params
  const workspaceData = await getProjectWorkspaceData(session.user.id, id)

  if (!workspaceData) {
    notFound()
  }

  const t = await getTranslations('Common')

  return (
    <Suspense
      fallback={
        <main
          aria-busy="true"
          aria-describedby="project-workspace-loading-label"
          className="min-h-screen bg-[var(--paper)] p-8 text-sm font-bold"
        >
          <p id="project-workspace-loading-label" role="status" aria-live="polite">
            {t('loading')}
          </p>
        </main>
      }
    >
      <ProjectWorkspaceContainer initialData={workspaceData} />
    </Suspense>
  )
}
