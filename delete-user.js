const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const emailTarget = 'guzanutto98@gmail.com';
    
    const deletado = await prisma.user.delete({
      where: { email: emailTarget },
    });
    
    console.log(`✅ Usuário ${deletado.email} deletado com sucesso do banco!`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('❌ Usuário não encontrado no banco de dados (já deve ter sido deletado).');
    } else {
      console.error('💥 Erro ao deletar:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();