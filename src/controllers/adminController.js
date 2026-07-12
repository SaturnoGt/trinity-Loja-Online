const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getDashboard = async (req, res) => {
  try {
    const [products, users, orders, pendingOrders, revenue] =
      await Promise.all([
        prisma.product.count(),
        prisma.user.count(),
        prisma.order.count(),
        prisma.order.count({
          where: {
            status: "PENDING",
          },
        }),
        prisma.order.aggregate({
          where: {
            status: "PAID",
          },
          _sum: {
            total: true,
          },
        }),
      ]);

    res.json({
      products,
      users,
      orders,
      pendingOrders,
      revenue: revenue._sum.total || 0,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erro ao carregar dashboard.",
    });
  }
};

module.exports = {
  getDashboard,
};