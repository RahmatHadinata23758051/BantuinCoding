const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const artifact = await prisma.artifact.findFirst({
    where: { projectId: 'a5111783-fd57-4bc5-b80a-24146b6ec446', type: 'DESIGN' }
  });
  if (artifact) {
    console.log('ID:', artifact.id);
    console.log('Length:', artifact.content.length);
    console.log('Tail:', artifact.content.slice(-500));
  } else {
    console.log('Artifact not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
