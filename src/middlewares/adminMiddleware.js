module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Não autenticado.",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Acesso negado.",
    });
  }

  next();
};