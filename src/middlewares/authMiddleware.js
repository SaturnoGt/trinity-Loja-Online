const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token não informado.",
      });
    }

    const [, token] = authHeader.split(" ");

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "chave_secreta_padrao_trinity"
    );

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Token inválido.",
    });
  }
};

module.exports = authMiddleware;