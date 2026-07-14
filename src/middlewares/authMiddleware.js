const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token não informado.",
      });
    }

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer" ||
      !parts[1]
    ) {
      return res.status(401).json({
        message: "Formato do token inválido.",
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        "chave_secreta_padrao_trinity"
    );

    req.user = decoded;

    return next();
  } catch (error) {
    console.error(
      "Erro no authMiddleware:",
      error.message
    );

    return res.status(401).json({
      message: "Token inválido ou expirado.",
    });
  }
}

module.exports = authMiddleware;