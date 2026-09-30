import { NextRequest, NextResponse } from 'next/server'
import { getSafeApiErrorMessage } from '@/lib/api/errors'
import { auth } from '@/lib/auth'
import {
  generateClarificationRound,
  submitClarificationAnswers,
} from '@/lib/engine/clarification-engine'
import { db } from '@repo/db'
import { requireProjectAction } from '@/lib/projects/project-service'
import { z } from 'zod'

const SubmitAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string().min(1, 'Answer cannot be empty'),
    }),
  ),
})

// ============================================================
// GET /api/projects/[id]/clarifications — List all questions
// ============================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const questions = await db.clarificationQuestion.findMany({
    where: { projectId: project.id },
    orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json({ questions })
}

// ============================================================
// POST /api/projects/[id]/clarifications — Generate or Answer
// Query param: ?action=generate OR ?action=answer
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') ?? 'generate'

  try {
    await requireProjectAction(session.user.id, id, 'CLARIFY')
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Clarification is unavailable for this project.')
    const status = message === 'Project not found' ? 404 : 409
    return NextResponse.json({ error: message }, { status })
  }

  if (action === 'answer') {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = SubmitAnswersSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      )
    }

    try {
      const result = await submitClarificationAnswers({
        userId: session.user.id,
        projectId: id,
        answers: parsed.data.answers,
      })

      return NextResponse.json(result)
    } catch (err) {
      const message = getSafeApiErrorMessage(
        err,
        'Failed to submit clarification answers. Please retry.',
      )
      const status = message === 'Project not found' ? 404 : 400
      return NextResponse.json({ error: message }, { status })
    }
  }

  // Generate action uses the current persisted requirement analysis server-side.
  try {
    const roundResult = await generateClarificationRound({
      userId: session.user.id,
      projectId: id,
    })

    return NextResponse.json(roundResult)
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Clarification planning failed. Please retry.')
    const status = message === 'Project not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
