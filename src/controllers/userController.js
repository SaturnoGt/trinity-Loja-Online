const prisma = require("../config/prisma");

const VALID_ROLES = ["CLIENTE", "ADMIN"];

// =====================
// LISTAR TODOS OS USUÁRIOS
// =====================

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        phone: true,
        createdAt: true,

        _count: {
          select: {
            orders: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      phone: user.phone,
      createdAt: user.createdAt,
      ordersCount: user._count.orders,
    }));

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);

    return res.status(500).json({
      message: "Erro ao buscar usuários.",
      error: error.message,
    });
  }
};

// =====================
// BUSCAR USUÁRIO POR ID
// =====================

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,

        phone: true,
        cpf: true,
        birthDate: true,
        avatarUrl: true,

        zipCode: true,
        street: true,
        number: true,
        complement: true,
        neighborhood: true,
        city: true,
        state: true,

        createdAt: true,
        updatedAt: true,

        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    const ordersCount = user.orders.length;

    const totalSpent = user.orders.reduce(
      (total, order) =>
        total + Number(order.total || 0),
      0
    );

    return res.status(200).json({
      ...user,
      ordersCount,
      totalSpent,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      message: "Erro ao buscar usuário.",
      error: error.message,
    });
  }
};

// =====================
// ALTERAR CARGO DO USUÁRIO
// =====================

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        message: "Cargo inválido.",
      });
    }

    if (
      req.user?.id === id &&
      role !== "ADMIN"
    ) {
      return res.status(400).json({
        message:
          "Você não pode remover o próprio acesso de administrador.",
      });
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!existingUser) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id,
        },

        data: {
          role,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
          createdAt: true,

          _count: {
            select: {
              orders: true,
            },
          },
        },
      });

    return res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt,
      ordersCount: updatedUser._count.orders,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar cargo do usuário:",
      error
    );

    return res.status(500).json({
      message:
        "Erro ao atualizar cargo do usuário.",
      error: error.message,
    });
  }
};

// =====================
// EXCLUIR USUÁRIO
// =====================

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({
        message:
          "Você não pode excluir a própria conta pelo painel administrativo.",
      });
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!existingUser) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      message: "Usuário removido com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao remover usuário:",
      error
    );

    return res.status(500).json({
      message: "Erro ao remover usuário.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};