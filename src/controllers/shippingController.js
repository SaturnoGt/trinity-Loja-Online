const prisma = require("../config/prisma");

// ==========================================
// ERRO DE FRETE
// ==========================================

class ShippingError extends Error {
  constructor(
    message,
    statusCode = 400,
    code = null
  ) {
    super(message);

    this.name = "ShippingError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ==========================================
// HELPERS GERAIS
// ==========================================

function normalizeZipCode(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .trim();
}

function normalizePositiveNumber(
  value,
  fieldName
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    throw new ShippingError(
      `${fieldName} inválido.`,
      400,
      "INVALID_PRODUCT_DIMENSION"
    );
  }

  return number;
}

function normalizeItems(items) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new ShippingError(
      "Informe pelo menos um item para calcular o frete.",
      400,
      "EMPTY_SHIPPING_ITEMS"
    );
  }

  return items.map(
    (item, index) => {
      const productId =
        Number(item?.productId);

      const quantity =
        Number(item?.quantity);

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0 ||
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        throw new ShippingError(
          `O item ${index + 1} é inválido.`,
          400,
          "INVALID_SHIPPING_ITEM"
        );
      }

      return {
        productId,
        quantity,
      };
    }
  );
}

// ==========================================
// AMBIENTE MELHOR ENVIO
// ==========================================

function getMelhorEnvioEnvironment() {
  return String(
    process.env
      .MELHOR_ENVIO_ENVIRONMENT ||
      "sandbox"
  )
    .trim()
    .toLowerCase();
}

function getMelhorEnvioBaseUrl() {
  const environment =
    getMelhorEnvioEnvironment();

  if (
    environment ===
    "production"
  ) {
    return "https://melhorenvio.com.br";
  }

  return "https://sandbox.melhorenvio.com.br";
}

// ==========================================
// USER AGENT
// ==========================================

function getMelhorEnvioUserAgent() {
  return String(
    process.env
      .MELHOR_ENVIO_USER_AGENT ||
      "Trinity Wear (suporte@trinitywear.com)"
  ).trim();
}

// ==========================================
// CONFIGURAÇÃO OAUTH
// ==========================================

function getOAuthConfig() {
  const clientId =
    String(
      process.env
        .MELHOR_ENVIO_CLIENT_ID ||
        ""
    ).trim();

  const clientSecret =
    String(
      process.env
        .MELHOR_ENVIO_CLIENT_SECRET ||
        ""
    ).trim();

  const redirectUri =
    String(
      process.env
        .MELHOR_ENVIO_REDIRECT_URI ||
        ""
    ).trim();

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

function validateOAuthConfig() {
  const config =
    getOAuthConfig();

  if (!config.clientId) {
    throw new ShippingError(
      "MELHOR_ENVIO_CLIENT_ID não foi configurado.",
      503,
      "MELHOR_ENVIO_CLIENT_ID_MISSING"
    );
  }

  if (!config.clientSecret) {
    throw new ShippingError(
      "MELHOR_ENVIO_CLIENT_SECRET não foi configurado.",
      503,
      "MELHOR_ENVIO_CLIENT_SECRET_MISSING"
    );
  }

  if (!config.redirectUri) {
    throw new ShippingError(
      "MELHOR_ENVIO_REDIRECT_URI não foi configurado.",
      503,
      "MELHOR_ENVIO_REDIRECT_URI_MISSING"
    );
  }

  return config;
}

// ==========================================
// SCOPES
// ==========================================

function getMelhorEnvioScopes() {
  return [
    "shipping-calculate",
    "shipping-companies",
    "shipping-tracking",
  ];
}

// ==========================================
// GERAR URL DE AUTORIZAÇÃO
// ==========================================

function buildAuthorizationUrl() {
  const {
    clientId,
    redirectUri,
  } = validateOAuthConfig();

  const baseUrl =
    getMelhorEnvioBaseUrl();

  const params =
    new URLSearchParams();

  params.set(
    "client_id",
    clientId
  );

  params.set(
    "redirect_uri",
    redirectUri
  );

  params.set(
    "response_type",
    "code"
  );

  params.set(
    "scope",
    getMelhorEnvioScopes()
      .join(" ")
  );

  return (
    `${baseUrl}/oauth/authorize?` +
    params.toString()
  );
}

// ==========================================
// CREDENCIAIS PERSISTIDAS
// ==========================================

async function getStoredCredential() {
  return prisma
    .melhorEnvioCredential
    .findUnique({
      where: {
        id: "main",
      },
    });
}

function calculateExpirationDate(
  expiresInSeconds
) {
  const seconds =
    Number(
      expiresInSeconds
    );

  if (
    !Number.isFinite(
      seconds
    ) ||
    seconds <= 0
  ) {
    return null;
  }

  return new Date(
    Date.now() +
      seconds * 1000
  );
}

function calculateRefreshExpirationDate() {
  return new Date(
    Date.now() +
      45 *
        24 *
        60 *
        60 *
        1000
  );
}

async function saveCredential({
  accessToken,
  refreshToken,
  expiresIn,
}) {
  const normalizedAccessToken =
    String(
      accessToken || ""
    ).trim();

  const normalizedRefreshToken =
    String(
      refreshToken || ""
    ).trim();

  if (
    !normalizedAccessToken
  ) {
    throw new ShippingError(
      "Access token do Melhor Envio inválido.",
      500,
      "INVALID_ACCESS_TOKEN"
    );
  }

  const currentCredential =
    await getStoredCredential();

  const finalRefreshToken =
    normalizedRefreshToken ||
    currentCredential
      ?.refreshToken ||
    null;

  const accessTokenExpiresAt =
    calculateExpirationDate(
      expiresIn
    );

  const refreshTokenExpiresAt =
    finalRefreshToken
      ? calculateRefreshExpirationDate()
      : null;

  return prisma
    .melhorEnvioCredential
    .upsert({
      where: {
        id: "main",
      },

      create: {
        id: "main",

        accessToken:
          normalizedAccessToken,

        refreshToken:
          finalRefreshToken,

        accessTokenExpiresAt,

        refreshTokenExpiresAt,
      },

      update: {
        accessToken:
          normalizedAccessToken,

        refreshToken:
          finalRefreshToken,

        accessTokenExpiresAt,

        refreshTokenExpiresAt,
      },
    });
}

// ==========================================
// VERIFICAR EXPIRAÇÃO
// ==========================================

function isCredentialExpired(
  expiresAt,
  safetySeconds = 120
) {
  if (!expiresAt) {
    return true;
  }

  const expiration =
    new Date(
      expiresAt
    ).getTime();

  if (
    Number.isNaN(
      expiration
    )
  ) {
    return true;
  }

  return (
    expiration <=
    Date.now() +
      safetySeconds *
        1000
  );
}

// ==========================================
// NORMALIZAR OPÇÕES DE FRETE
// ==========================================

function normalizeShippingOptions(
  responseData
) {
  if (
    !Array.isArray(
      responseData
    )
  ) {
    return [];
  }

  return responseData
    .filter((option) => {
      return (
        option &&
        !option.error &&
        option.price !==
          undefined
      );
    })
    .map((option) => ({
      id:
        option.id !==
        undefined
          ? String(
              option.id
            )
          : null,

      name:
        option.name ||
        null,

      price:
        Number(
          option.price ||
            0
        ),

      customPrice:
        option.custom_price !==
        undefined
          ? Number(
              option.custom_price
            )
          : null,

      discount:
        option.discount !==
        undefined
          ? Number(
              option.discount
            )
          : null,

      currency:
        option.currency ||
        "R$",

      deliveryTime:
        option.delivery_time !==
        undefined
          ? Number(
              option.delivery_time
            )
          : null,

      customDeliveryTime:
        option.custom_delivery_time !==
        undefined
          ? Number(
              option.custom_delivery_time
            )
          : null,

      company:
        option.company
          ? {
              id:
                option
                  .company
                  .id !==
                undefined
                  ? String(
                      option
                        .company
                        .id
                    )
                  : null,

              name:
                option
                  .company
                  .name ||
                null,

              picture:
                option
                  .company
                  .picture ||
                null,
            }
          : null,
    }));
}

// ==========================================
// TROCAR CODE POR TOKEN
// ==========================================

async function exchangeAuthorizationCode(
  code
) {
  const {
    clientId,
    clientSecret,
    redirectUri,
  } = validateOAuthConfig();

  const normalizedCode =
    String(
      code || ""
    ).trim();

  if (
    !normalizedCode
  ) {
    throw new ShippingError(
      "Código de autorização não informado.",
      400,
      "AUTHORIZATION_CODE_MISSING"
    );
  }

  const baseUrl =
    getMelhorEnvioBaseUrl();

  // ========================================
  // CORPO OAUTH
  // ========================================

  const body =
    new URLSearchParams();

  body.set(
    "grant_type",
    "authorization_code"
  );

  body.set(
    "client_id",
    clientId
  );

  body.set(
    "client_secret",
    clientSecret
  );

  body.set(
    "redirect_uri",
    redirectUri
  );

  body.set(
    "code",
    normalizedCode
  );

  // ========================================
  // TROCAR CODE POR TOKEN
  // ========================================

  const response =
    await fetch(
      `${baseUrl}/oauth/token`,
      {
        method:
          "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/x-www-form-urlencoded",

          "User-Agent":
            getMelhorEnvioUserAgent(),
        },

        body:
          body.toString(),
      }
    );

  const data =
    await response
      .json()
      .catch(
        () => null
      );

  if (
    !response.ok
  ) {
    console.error(
      "Erro ao trocar código OAuth no Melhor Envio:",
      data
    );

    throw new ShippingError(
      data?.message ||
        "Não foi possível concluir a autorização do Melhor Envio.",
      response.status,
      "MELHOR_ENVIO_OAUTH_ERROR"
    );
  }

  if (
    !data?.access_token
  ) {
    throw new ShippingError(
      "O Melhor Envio não retornou um access token.",
      502,
      "ACCESS_TOKEN_MISSING"
    );
  }

  return {
    accessToken:
      String(
        data.access_token
      ),

    refreshToken:
      data.refresh_token
        ? String(
            data.refresh_token
          )
        : null,

    tokenType:
      data.token_type ||
      null,

    expiresIn:
      Number(
        data.expires_in ||
          0
      ),
  };
}
// ==========================================
// RENOVAR ACCESS TOKEN
// ==========================================

async function refreshMelhorEnvioAccessToken(
  refreshToken
) {
  const {
    clientId,
    clientSecret,
  } = validateOAuthConfig();

  const normalizedRefreshToken =
    String(
      refreshToken || ""
    ).trim();

  if (
    !normalizedRefreshToken
  ) {
    throw new ShippingError(
      "Refresh token não informado.",
      400,
      "REFRESH_TOKEN_MISSING"
    );
  }

  const baseUrl =
    getMelhorEnvioBaseUrl();

  // ========================================
  // CORPO OAUTH
  // ========================================

  const body =
    new URLSearchParams();

  body.set(
    "grant_type",
    "refresh_token"
  );

  body.set(
    "refresh_token",
    normalizedRefreshToken
  );

  body.set(
    "client_id",
    clientId
  );

  body.set(
    "client_secret",
    clientSecret
  );

  // ========================================
  // RENOVAR TOKEN
  // ========================================

  const response =
    await fetch(
      `${baseUrl}/oauth/token`,
      {
        method:
          "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/x-www-form-urlencoded",

          "User-Agent":
            getMelhorEnvioUserAgent(),
        },

        body:
          body.toString(),
      }
    );

  const data =
    await response
      .json()
      .catch(
        () => null
      );

  if (
    !response.ok
  ) {
    console.error(
      "Erro ao renovar token do Melhor Envio:",
      data
    );

    throw new ShippingError(
      data?.message ||
        "Não foi possível renovar o token do Melhor Envio.",
      response.status,
      "MELHOR_ENVIO_REFRESH_ERROR"
    );
  }

  if (
    !data?.access_token
  ) {
    throw new ShippingError(
      "O Melhor Envio não retornou um novo access token.",
      502,
      "ACCESS_TOKEN_MISSING"
    );
  }

  return {
    accessToken:
      String(
        data.access_token
      ),

    refreshToken:
      data.refresh_token
        ? String(
            data.refresh_token
          )
        : normalizedRefreshToken,

    tokenType:
      data.token_type ||
      null,

    expiresIn:
      Number(
        data.expires_in ||
          0
      ),
  };
}

// ==========================================
// OBTER TOKEN ATIVO
// ==========================================

async function getActiveAccessToken() {
  const credential =
    await getStoredCredential();

  // ========================================
  // SEM CREDENCIAL NO BANCO
  // ========================================

  if (!credential) {
    const envToken =
      String(
        process.env
          .MELHOR_ENVIO_TOKEN ||
          ""
      ).trim();

    return envToken || null;
  }

  // ========================================
  // TOKEN AINDA VÁLIDO
  // ========================================

  if (
    credential.accessToken &&
    !isCredentialExpired(
      credential
        .accessTokenExpiresAt
    )
  ) {
    return credential
      .accessToken;
  }

  // ========================================
  // TOKEN EXPIRADO
  // ========================================

  if (
    !credential.refreshToken
  ) {
    throw new ShippingError(
      "A autorização do Melhor Envio expirou e não possui refresh token.",
      503,
      "MELHOR_ENVIO_REAUTH_REQUIRED"
    );
  }

  if (
    credential
      .refreshTokenExpiresAt &&
    isCredentialExpired(
      credential
        .refreshTokenExpiresAt,
      0
    )
  ) {
    throw new ShippingError(
      "A autorização do Melhor Envio expirou. Autorize novamente a integração.",
      503,
      "MELHOR_ENVIO_REAUTH_REQUIRED"
    );
  }

  // ========================================
  // RENOVAR AUTOMATICAMENTE
  // ========================================

  const tokenData =
    await refreshMelhorEnvioAccessToken(
      credential.refreshToken
    );

  await saveCredential({
    accessToken:
      tokenData.accessToken,

    refreshToken:
      tokenData.refreshToken,

    expiresIn:
      tokenData.expiresIn,
  });

  return tokenData
    .accessToken;
}

// ==========================================
// CALCULAR FRETE
// ==========================================

const calculateShipping = async (
  req,
  res
) => {
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({
          message:
            "Usuário não autenticado.",
        });
    }

    // ======================================
    // CEP DE DESTINO
    // ======================================

    const zipCode =
      normalizeZipCode(
        req.body?.zipCode
      );

    if (
      zipCode.length !== 8
    ) {
      throw new ShippingError(
        "Informe um CEP válido com 8 números.",
        400,
        "INVALID_ZIP_CODE"
      );
    }

    // ======================================
    // ITENS RECEBIDOS
    // ======================================

    const requestItems =
      normalizeItems(
        req.body?.items
      );

    const productIds =
      Array.from(
        new Set(
          requestItems.map(
            (item) =>
              item.productId
          )
        )
      );

    // ======================================
    // BUSCAR PRODUTOS
    // ======================================

    const products =
      await prisma.product
        .findMany({
          where: {
            id: {
              in:
                productIds,
            },
          },

          select: {
            id: true,
            name: true,
            price: true,
            weight: true,
            width: true,
            height: true,
            length: true,
          },
        });

    const productMap =
      new Map(
        products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      );

    // ======================================
    // PREPARAR PRODUTOS
    // ======================================

    const shippingProducts =
      requestItems.map(
        (item) => {
          const product =
            productMap.get(
              item.productId
            );

          if (!product) {
            throw new ShippingError(
              `Produto ${item.productId} não encontrado.`,
              404,
              "PRODUCT_NOT_FOUND"
            );
          }

          const weight =
            normalizePositiveNumber(
              product.weight,
              `Peso do produto ${product.name}`
            );

          const width =
            normalizePositiveNumber(
              product.width,
              `Largura do produto ${product.name}`
            );

          const height =
            normalizePositiveNumber(
              product.height,
              `Altura do produto ${product.name}`
            );

          const length =
            normalizePositiveNumber(
              product.length,
              `Comprimento do produto ${product.name}`
            );

          const price =
            normalizePositiveNumber(
              product.price,
              `Preço do produto ${product.name}`
            );

          return {
            id:
              String(
                product.id
              ),

            width,
            height,
            length,
            weight,

            insurance_value:
              Number(
                price.toFixed(
                  2
                )
              ),

            quantity:
              item.quantity,
          };
        }
      );

    // ======================================
    // TOKEN ATIVO
    // ======================================

    const token =
      await getActiveAccessToken();

    if (!token) {
      return res
        .status(503)
        .json({
          message:
            "A integração com o Melhor Envio ainda não está autorizada.",

          code:
            "MELHOR_ENVIO_NOT_AUTHORIZED",

          ready:
            true,

          zipCode,

          items:
            shippingProducts,
        });
    }

    // ======================================
    // CEP DE ORIGEM
    // ======================================

    const originZipCode =
      normalizeZipCode(
        process.env
          .MELHOR_ENVIO_ORIGIN_ZIP_CODE
      );

    if (
      originZipCode.length !==
      8
    ) {
      throw new ShippingError(
        "O CEP de origem do Melhor Envio não está configurado corretamente.",
        500,
        "INVALID_ORIGIN_ZIP_CODE"
      );
    }

    // ======================================
    // REQUISIÇÃO MELHOR ENVIO
    // ======================================

    const baseUrl =
      getMelhorEnvioBaseUrl();

    const response =
      await fetch(
        `${baseUrl}/api/v2/me/shipment/calculate`,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,

            "User-Agent":
              getMelhorEnvioUserAgent(),
          },

          body:
            JSON.stringify({
              from: {
                postal_code:
                  originZipCode,
              },

              to: {
                postal_code:
                  zipCode,
              },

              products:
                shippingProducts,
            }),
        }
      );

    const data =
      await response
        .json()
        .catch(
          () => null
        );

    // ======================================
    // ERRO MELHOR ENVIO
    // ======================================

    if (!response.ok) {
      console.error(
        "Erro Melhor Envio:",
        data
      );

      return res
        .status(
          response.status
        )
        .json({
          message:
            data?.message ||
            "Não foi possível calcular o frete.",

          code:
            "MELHOR_ENVIO_ERROR",

          details:
            data,
        });
    }

    // ======================================
    // RESPOSTA NORMALIZADA
    // ======================================

    const options =
      normalizeShippingOptions(
        data
      );

    return res
      .status(200)
      .json({
        zipCode,
        options,
      });
  } catch (error) {
    if (
      error instanceof
      ShippingError
    ) {
      return res
        .status(
          error.statusCode
        )
        .json({
          message:
            error.message,

          ...(error.code
            ? {
                code:
                  error.code,
              }
            : {}),
        });
    }

    console.error(
      "Erro ao calcular frete:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Erro interno ao calcular frete.",
      });
  }
};
// ==========================================
// GERAR URL DE AUTORIZAÇÃO
// ==========================================

const getMelhorEnvioAuthorizationUrl =
  async (
    req,
    res
  ) => {
    try {
      if (!req.user?.id) {
        return res
          .status(401)
          .json({
            message:
              "Usuário não autenticado.",
          });
      }

      const authorizationUrl =
        buildAuthorizationUrl();

      return res
        .status(200)
        .json({
          authorizationUrl,

          environment:
            getMelhorEnvioEnvironment(),
        });
    } catch (error) {
      if (
        error instanceof
        ShippingError
      ) {
        return res
          .status(
            error.statusCode
          )
          .json({
            message:
              error.message,

            ...(error.code
              ? {
                  code:
                    error.code,
                }
              : {}),
          });
      }

      console.error(
        "Erro ao gerar URL de autorização do Melhor Envio:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Erro interno ao iniciar autorização do Melhor Envio.",
        });
    }
  };

// ==========================================
// CALLBACK OAUTH MELHOR ENVIO
// ==========================================

const melhorEnvioOAuthCallback =
  async (
    req,
    res
  ) => {
    try {
      const code =
        String(
          req.query?.code || ""
        ).trim();

      if (!code) {
        return res
          .status(400)
          .json({
            message:
              "Código de autorização do Melhor Envio não informado.",
          });
      }

      // ======================================
      // TROCAR CODE POR TOKENS
      // ======================================

      const tokenData =
        await exchangeAuthorizationCode(
          code
        );

      // ======================================
      // PERSISTIR NO BANCO
      // ======================================

      await saveCredential({
        accessToken:
          tokenData.accessToken,

        refreshToken:
          tokenData.refreshToken,

        expiresIn:
          tokenData.expiresIn,
      });

      console.log(
        "Melhor Envio autorizado e credenciais salvas com sucesso."
      );

      // ======================================
      // REDIRECIONAMENTO
      // ======================================

      const frontendUrl =
        String(
          process.env
            .FRONTEND_URL ||
            ""
        )
          .trim()
          .replace(
            /\/+$/,
            ""
          );

      if (frontendUrl) {
        return res.redirect(
          `${frontendUrl}/admin?melhorEnvio=authorized`
        );
      }

      return res
        .status(200)
        .json({
          message:
            "Melhor Envio autorizado com sucesso.",

          authorized:
            true,
        });
    } catch (error) {
      if (
        error instanceof
        ShippingError
      ) {
        console.error(
          "Erro OAuth Melhor Envio:",
          error.message
        );

        return res
          .status(
            error.statusCode
          )
          .json({
            message:
              error.message,

            ...(error.code
              ? {
                  code:
                    error.code,
                }
              : {}),
          });
      }

      console.error(
        "Erro no callback OAuth do Melhor Envio:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Erro interno ao autorizar o Melhor Envio.",
        });
    }
  };

// ==========================================
// REFRESH MANUAL DO TOKEN
// ==========================================

const refreshMelhorEnvioToken =
  async (
    req,
    res
  ) => {
    try {
      if (!req.user?.id) {
        return res
          .status(401)
          .json({
            message:
              "Usuário não autenticado.",
          });
      }

      const credential =
        await getStoredCredential();

      if (!credential) {
        return res
          .status(503)
          .json({
            message:
              "A integração com o Melhor Envio ainda não foi autorizada.",

            code:
              "MELHOR_ENVIO_NOT_AUTHORIZED",
          });
      }

      if (
        !credential
          .refreshToken
      ) {
        return res
          .status(503)
          .json({
            message:
              "A integração não possui refresh token. Autorize novamente o Melhor Envio.",

            code:
              "MELHOR_ENVIO_REAUTH_REQUIRED",
          });
      }

      if (
        credential
          .refreshTokenExpiresAt &&
        isCredentialExpired(
          credential
            .refreshTokenExpiresAt,
          0
        )
      ) {
        return res
          .status(503)
          .json({
            message:
              "O refresh token do Melhor Envio expirou. Autorize novamente a integração.",

            code:
              "MELHOR_ENVIO_REAUTH_REQUIRED",
          });
      }

      const tokenData =
        await refreshMelhorEnvioAccessToken(
          credential.refreshToken
        );

      await saveCredential({
        accessToken:
          tokenData.accessToken,

        refreshToken:
          tokenData.refreshToken,

        expiresIn:
          tokenData.expiresIn,
      });

      console.log(
        "Token do Melhor Envio renovado e salvo com sucesso."
      );

      return res
        .status(200)
        .json({
          message:
            "Token do Melhor Envio renovado com sucesso.",

          refreshed:
            true,

          expiresIn:
            tokenData.expiresIn ||
            null,
        });
    } catch (error) {
      if (
        error instanceof
        ShippingError
      ) {
        return res
          .status(
            error.statusCode
          )
          .json({
            message:
              error.message,

            ...(error.code
              ? {
                  code:
                    error.code,
                }
              : {}),
          });
      }

      console.error(
        "Erro ao renovar token do Melhor Envio:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Erro interno ao renovar token do Melhor Envio.",
        });
    }
  };

// ==========================================
// STATUS DA INTEGRAÇÃO
// ==========================================

const getMelhorEnvioStatus =
  async (
    req,
    res
  ) => {
    try {
      if (!req.user?.id) {
        return res
          .status(401)
          .json({
            message:
              "Usuário não autenticado.",
          });
      }

      const credential =
        await getStoredCredential();

      if (!credential) {
        return res
          .status(200)
          .json({
            authorized:
              false,

            environment:
              getMelhorEnvioEnvironment(),
          });
      }

      const accessTokenExpired =
        isCredentialExpired(
          credential
            .accessTokenExpiresAt
        );

      const refreshTokenExpired =
        credential
          .refreshTokenExpiresAt
          ? isCredentialExpired(
              credential
                .refreshTokenExpiresAt,
              0
            )
          : true;

      return res
        .status(200)
        .json({
          authorized:
            Boolean(
              credential
                .accessToken
            ),

          accessTokenExpired,

          hasRefreshToken:
            Boolean(
              credential
                .refreshToken
            ),

          refreshTokenExpired,

          environment:
            getMelhorEnvioEnvironment(),

          updatedAt:
            credential
              .updatedAt,
        });
    } catch (error) {
      console.error(
        "Erro ao verificar integração do Melhor Envio:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Erro interno ao verificar integração do Melhor Envio.",
        });
    }
  };

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  calculateShipping,
  getMelhorEnvioAuthorizationUrl,
  melhorEnvioOAuthCallback,
  refreshMelhorEnvioToken,
  getMelhorEnvioStatus,
};