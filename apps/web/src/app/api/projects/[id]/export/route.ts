import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { exportProjectZip } from '@/lib/export/export-service'

// ============================================================
// GET /api/projects/[id]/export — Download Project Bootstrap Pack ZIP
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

  try {
    const { filename, buffer } = await exportProjectZip({
      userId: session.user.id,
      projectId: id,
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
