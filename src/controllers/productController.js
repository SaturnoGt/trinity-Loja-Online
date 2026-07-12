const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Buscar todos os produtos
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: true,
        variations: true,
      },
    });

    const formatted = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      createdAt: product.createdAt,

      images: product.images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        isMain: img.isMain,
      })),

      variations: product.variations.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao buscar produtos",
      error: error.message,
    });
  }
};

// Buscar produto por ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        images: true,
        variations: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Produto não encontrado",
      });
    }

    const formatted = {
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      createdAt: product.createdAt,

      images: product.images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        isMain: img.isMain,
      })),

      variations: product.variations.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
    };

    return res.status(200).json(formatted);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao buscar produto",
      error: error.message,
    });
  }
};

// Criar produto
const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      images,
      variations,
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        description,
        category,

        images: {
          create:
            images?.map((img) => ({
              imageUrl: img.imageUrl,
              isMain: img.isMain || false,
            })) || [],
        },

        variations: {
          create:
            variations?.map((v) => ({
              size: v.size,
              color: v.color,
              stock: Number(v.stock),
            })) || [],
        },
      },

      include: {
        images: true,
        variations: true,
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao criar produto",
      error: error.message,
    });
  }
};

// Atualizar produto
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      price,
      description,
      category,
    } = req.body;

    const product = await prisma.product.update({
      where: {
        id: Number(id),
      },

      data: {
        name,
        price: Number(price),
        description,
        category,
      },
    });

    return res.json(product);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao atualizar produto",
      error: error.message,
    });
  }
};

// Excluir produto
const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.json({
      message: "Produto removido com sucesso",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao remover produto",
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,

  createProduct,
  updateProduct,
  deleteProduct,
};