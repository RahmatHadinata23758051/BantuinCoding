import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { getProjectWorkspaceData } from '@/lib/projects/workspace-service'
import { ProjectWorkspaceContainer } from '@/app/components/ProjectWorkspaceContainer'
import { redirect, notFound } from 'next/navigation'

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

  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--paper)] p-8 text-sm font-bold">Loading project workspace…</div>}>
      <ProjectWorkspaceContainer initialData={workspaceData} />
    </Suspense>
  )
}
