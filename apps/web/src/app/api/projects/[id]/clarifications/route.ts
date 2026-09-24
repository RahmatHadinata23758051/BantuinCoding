import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  generateClarificationRound,
  submitClarificationAnswers,
} from '@/lib/engine/clarification-engine'
import { db } from '@repo/db'
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
  const questions = await db.clarificationQuestion.findMany({
    where: { projectId: id },
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

    const result = await submitClarificationAnswers({
      userId: session.user.id,
      projectId: id,
      answers: parsed.data.answers,
    })

    return NextResponse.json(result)
  }

  // Generate action
  let body: { analysis?: unknown } = {}
  try {
    body = (await req.json()) as { analysis?: unknown }
  } catch {
    // optional body
  }

  const analysis = (body.analysis ?? {
    known_facts: [],
    missing_information: [],
    ambiguities: [],
    important_decisions: [],
    optional_decisions: [],
    risk_flags: [],
  }) as never

  try {
    const roundResult = await generateClarificationRound({
      userId: session.user.id,
      projectId: id,
      analysis,
    })

    return NextResponse.json(roundResult)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
