import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding development database...')

  // Dev user
  const passwordHash = await hash('devpassword123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'dev@bantuin.local' },
    update: {},
    create: {
      email: 'dev@bantuin.local',
      password: passwordHash,
      name: 'Dev User',
    },
  })
  console.log(`✅ User: ${user.email}`)

  // Sample project
  const project = await prisma.project.upsert({
    where: { id: 'seed-project-001' },
    update: {},
    create: {
      id: 'seed-project-001',
      userId: user.id,
      name: 'Sample SaaS App',
      rawIdea:
        'A multi-tenant SaaS app for team task management with AI-powered prioritization',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'DRAFT',
    },
  })
  console.log(`✅ Project: ${project.name}`)

  console.log('🌱 Seed complete.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
