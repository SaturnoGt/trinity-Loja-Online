const prisma = require("../config/prisma");

const getFavorites = async (req, res) => {
  try {
    const favoriteRecords =
      await prisma.favorite.findMany({
        where: {
          userId: req.user.id,
        },
        include: {
          product: {
            include: {
              images: true,
              variations: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    const favorites = favoriteRecords.map(
      (favorite) => favorite.product
    );

    return res.status(200).json({
      favorites,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar favoritos:",
      error
    );

    return res.status(500).json({
      error:
        "Erro interno ao buscar favoritos.",
    });
  }
};

const addFavorite = async (req, res) => {
  try {
    const productId = Number(
      req.params.productId
    );

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        error: "Produto inválido.",
      });
    }

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          images: true,
          variations: true,
        },
      });

    if (!product) {
      return res.status(404).json({
        error: "Produto não encontrado.",
      });
    }

    await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
      update: {},
      create: {
        userId: req.user.id,
        productId,
      },
    });

    return res.status(201).json({
      message:
        "Produto adicionado aos favoritos.",
      product,
    });
  } catch (error) {
    console.error(
      "Erro ao adicionar favorito:",
      error
    );

    return res.status(500).json({
      error:
        "Erro interno ao adicionar favorito.",
    });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const productId = Number(
      req.params.productId
    );

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        error: "Produto inválido.",
      });
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
        productId,
      },
    });

    return res.status(200).json({
      message:
        "Produto removido dos favoritos.",
    });
  } catch (error) {
    console.error(
      "Erro ao remover favorito:",
      error
    );

    return res.status(500).json({
      error:
        "Erro interno ao remover favorito.",
    });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};