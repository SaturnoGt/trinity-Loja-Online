const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Altere para o e-mail que deseja remover do banco antes de testar
  const emailParaDeletar = 'guzanutto98@gmail.com'; 
  
  try {
    const deletado = await prisma.user.deleteMany({
      where: { email: emailParaDeletar }
    });
    console.log(`Sucesso! Registros deletados: ${deletado.count}`);
  } catch (error) {
    console.error("Erro ao deletar:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();