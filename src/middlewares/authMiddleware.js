const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET não foi configurado."
  );
}

function authMiddleware(req, res, next) {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token não informado.",
      });
    }

    const [scheme, token] =
      authHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      return res.status(401).json({
        message:
          "Formato do token inválido.",
      });
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = decoded;

    return next();
  } catch (error) {
    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Token expirado.",
      });
    }

    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Token inválido.",
      });
    }

    console.error(
      "Erro no authMiddleware:",
      error
    );

    return res.status(500).json({
      message:
        "Erro interno de autenticação.",
    });
  }
}

module.exports = authMiddleware;