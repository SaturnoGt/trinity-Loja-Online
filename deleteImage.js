const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.image.delete({
    where: {
      id: 1,
    },
  });

  console.log("Imagem removida!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());