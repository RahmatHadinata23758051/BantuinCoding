const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const artifact = await prisma.artifact.findFirst({
    where: { projectId: 'a5111783-fd57-4bc5-b80a-24146b6ec446', type: 'SRS' }
  });
  if (artifact) {
    console.log('ID:', artifact.id);
    console.log('Length:', artifact.content.length);
    console.log('TAIL:');
    console.log(artifact.content.slice(-700));
  } else {
    console.log('SRS not found');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
