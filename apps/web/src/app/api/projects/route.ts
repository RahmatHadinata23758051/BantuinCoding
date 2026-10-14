import { after, NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  createProject,
  getUserProjects,
  CreateProjectSchema,
} from '@/lib/projects/project-service'

// ============================================================
// GET /api/projects — List user's projects
// ============================================================

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projects = await getUserProjects(session.user.id)
  return NextResponse.json({ projects })
}

// ============================================================
// POST /api/projects — Create a new project (status: DRAFT)
// ============================================================

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const userId = session.user.id
  const project = await createProject(userId, parsed.data)
  after(async () => {
    const { classifyProject } = await import('@/lib/projects/classifier-service')
    await classifyProject({ userId, projectId: project.id })
  })
  return NextResponse.json({ project }, { status: 201 })
}
