const { Prisma } = require("@prisma/client");

const prisma = require("../config/prisma");

const PRODUCT_INCLUDE = {
  images: {
    orderBy: [
      {
        isMain: "desc",
      },
      {
        id: "asc",
      },
    ],
  },

  variations: {
    orderBy: [
      {
        size: "asc",
      },
      {
        color: "asc",
      },
    ],
  },
};

const VALID_CATEGORIES = [
  "Camisetas",
  "Oversized",
  "Moletons",
  "Acessórios",
];

class ProductError extends Error {
  constructor(message, statusCode = 400) {
    super(message);

    this.name = "ProductError";
    this.statusCode = statusCode;
  }
}

function sendServerError(
  res,
  message = "Erro interno do servidor."
) {
  return res.status(500).json({
    message,
  });
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeCategory(value) {
  const category = normalizeText(value);

  const matchedCategory = VALID_CATEGORIES.find(
    (validCategory) =>
      validCategory.toLocaleLowerCase("pt-BR") ===
      category.toLocaleLowerCase("pt-BR")
  );

  return matchedCategory || "";
}

function normalizePrice(value) {
  if (
    typeof value === "string" &&
    value.trim().includes(",")
  ) {
    value = value.trim().replace(",", ".");
  }

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    throw new ProductError("Preço inválido.");
  }

  return price;
}

function normalizeImages(images) {
  if (images === undefined || images === null) {
    return [];
  }

  if (!Array.isArray(images)) {
    throw new ProductError(
      "A lista de imagens é inválida."
    );
  }

  const normalizedImages = images.map(
    (image, index) => {
      const imageUrl = normalizeText(
        image?.imageUrl
      );

      if (!imageUrl) {
        throw new ProductError(
          `A imagem ${index + 1} possui uma URL inválida.`
        );
      }

      return {
        imageUrl,
        isMain: Boolean(image?.isMain),
      };
    }
  );

  if (normalizedImages.length === 0) {
    return [];
  }

  const selectedMainIndex =
    normalizedImages.findIndex(
      (image) => image.isMain
    );

  const mainIndex =
    selectedMainIndex >= 0
      ? selectedMainIndex
      : 0;

  return normalizedImages.map(
    (image, index) => ({
      ...image,
      isMain: index === mainIndex,
    })
  );
}

function normalizeVariations(variations) {
  if (
    variations === undefined ||
    variations === null
  ) {
    return [];
  }

  if (!Array.isArray(variations)) {
    throw new ProductError(
      "A lista de variações é inválida."
    );
  }

  const uniqueVariations = new Set();

  return variations.map((variation, index) => {
    const size = normalizeText(
      variation?.size
    );

    const color = normalizeText(
      variation?.color
    );

    const stock = Number(variation?.stock);

    if (!size) {
      throw new ProductError(
        `O tamanho da variação ${index + 1} é obrigatório.`
      );
    }

    if (!color) {
      throw new ProductError(
        `A cor da variação ${index + 1} é obrigatória.`
      );
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      throw new ProductError(
        `O estoque da variação ${index + 1} é inválido.`
      );
    }

    const variationKey = `${size.toLocaleLowerCase(
      "pt-BR"
    )}:${color.toLocaleLowerCase("pt-BR")}`;

    if (uniqueVariations.has(variationKey)) {
      throw new ProductError(
        `A variação de tamanho ${size} e cor ${color} está duplicada.`
      );
    }

    uniqueVariations.add(variationKey);

    return {
      size,
      color,
      stock,
    };
  });
}

function normalizeProductData(body = {}) {
  const name = normalizeText(body.name);

  const description = normalizeText(
    body.description
  );

  const category = normalizeCategory(
    body.category
  );

  if (!name) {
    throw new ProductError(
      "O nome do produto é obrigatório."
    );
  }

  if (name.length < 2) {
    throw new ProductError(
      "O nome do produto precisa ter pelo menos 2 caracteres."
    );
  }

  if (!description) {
    throw new ProductError(
      "A descrição do produto é obrigatória."
    );
  }

  if (!category) {
    throw new ProductError(
      `Categoria inválida. Utilize uma destas categorias: ${VALID_CATEGORIES.join(
        ", "
      )}.`
    );
  }

  const price = normalizePrice(body.price);
  const images = normalizeImages(body.images);
  const variations = normalizeVariations(
    body.variations
  );

  return {
    name,
    price,
    description,
    category,
    images,
    variations,
  };
}

function parseProductId(value) {
  const productId = Number(value);

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    throw new ProductError(
      "ID de produto inválido."
    );
  }

  return productId;
}

function handlePrismaError(error, res, action) {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message:
          "Já existe um produto com esses dados.",
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        message:
          "Não foi possível concluir a operação porque o produto ou alguma variação possui registros vinculados.",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Produto não encontrado.",
      });
    }
  }

  console.error(
    `Erro ao ${action} produto:`,
    error
  );

  return sendServerError(
    res,
    `Erro ao ${action} produto.`
  );
}

// =====================
// LISTAR E BUSCAR PRODUTOS
// =====================

const getAllProducts = async (req, res) => {
  try {
    const search = normalizeText(
      req.query?.search
    );

    const requestedCategory = normalizeText(
      req.query?.category
    );

    const category = requestedCategory
      ? normalizeCategory(requestedCategory)
      : "";

    if (requestedCategory && !category) {
      return res.status(400).json({
        message: "Categoria inválida.",
      });
    }

    const products =
      await prisma.product.findMany({
        where: {
          ...(search
            ? {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    description: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    category: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),

          ...(category
            ? {
                category,
              }
            : {}),
        },

        include: PRODUCT_INCLUDE,

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json(products);
  } catch (error) {
    console.error(
      "Erro ao buscar produtos:",
      error
    );

    return sendServerError(
      res,
      "Erro ao buscar produtos."
    );
  }
};

// =====================
// BUSCAR PRODUTO POR ID
// =====================

const getProductById = async (req, res) => {
  try {
    const productId = parseProductId(
      req.params?.id
    );

    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },

        include: PRODUCT_INCLUDE,
      });

    if (!product) {
      return res.status(404).json({
        message: "Produto não encontrado.",
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    if (error instanceof ProductError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error(
      "Erro ao buscar produto:",
      error
    );

    return sendServerError(
      res,
      "Erro ao buscar produto."
    );
  }
};

// =====================
// CRIAR PRODUTO
// =====================

const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      images,
      variations,
    } = normalizeProductData(req.body);

    const product =
      await prisma.product.create({
        data: {
          name,
          price,
          description,
          category,

          ...(images.length > 0
            ? {
                images: {
                  create: images,
                },
              }
            : {}),

          ...(variations.length > 0
            ? {
                variations: {
                  create: variations,
                },
              }
            : {}),
        },

        include: PRODUCT_INCLUDE,
      });

    return res.status(201).json(product);
  } catch (error) {
    if (error instanceof ProductError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return handlePrismaError(
      error,
      res,
      "criar"
    );
  }
};

// =====================
// ATUALIZAR PRODUTO
// =====================

const updateProduct = async (req, res) => {
  try {
    const productId = parseProductId(
      req.params?.id
    );

    const {
      name,
      price,
      description,
      category,
      images,
      variations,
    } = normalizeProductData(req.body);

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },

        select: {
          id: true,
        },
      });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Produto não encontrado.",
      });
    }

    const updatedProduct =
      await prisma.$transaction(
        async (transaction) => {
          return transaction.product.update({
            where: {
              id: productId,
            },

            data: {
              name,
              price,
              description,
              category,

              images: {
                deleteMany: {},
                create: images,
              },

              variations: {
                deleteMany: {},
                create: variations,
              },
            },

            include: PRODUCT_INCLUDE,
          });
        }
      );

    return res
      .status(200)
      .json(updatedProduct);
  } catch (error) {
    if (error instanceof ProductError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return handlePrismaError(
      error,
      res,
      "atualizar"
    );
  }
};

// =====================
// EXCLUIR PRODUTO
// =====================

const deleteProduct = async (req, res) => {
  try {
    const productId = parseProductId(
      req.params?.id
    );

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },

        select: {
          id: true,
          name: true,
        },
      });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Produto não encontrado.",
      });
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return res.status(200).json({
      message: "Produto removido com sucesso.",
    });
  } catch (error) {
    if (error instanceof ProductError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return handlePrismaError(
      error,
      res,
      "remover"
    );
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};