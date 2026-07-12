const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Alimentando o banco com o estoque inicial da Trinity Store...");

  // Limpa o banco na ordem correta
  await prisma.variation.deleteMany();
  await prisma.image.deleteMany();
  await prisma.product.deleteMany();

  // Cria o produto
  await prisma.product.create({
    data: {
      name: "Camiseta Trinity Faith - Father, Son, Spirit",
      description:
        "Camiseta preta com estampa geométrica Trinity no peito e símbolos detalhados nas costas representando Father (Coroa), Son (Cruz) e Spirit (Pomba).",
      price: 79.99,
      category: "Camisas",

      images: {
        create: [
          {
            imageUrl: "https://i.ibb.co/L5rK5qK/trinity-shirt-mockup.png",
            isMain: true,
          },
        ],
      },

      variations: {
        create: [
          {
            size: "P",
            color: "Preto",
            stock: 1,
          },
          {
            size: "M",
            color: "Preto",
            stock: 12,
          },
          {
            size: "G",
            color: "Preto",
            stock: 13,
          },
          {
            size: "GG",
            color: "Preto",
            stock: 6,
          },
        ],
      },
    },
  });

  console.log("✅ Catálogo Trinity Store criado com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao rodar o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });