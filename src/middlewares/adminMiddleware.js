function adminMiddleware(
  req,
  res,
  next
) {
  try {
    if (
      !req.user ||
      !req.user.id
    ) {
      return res
        .status(401)
        .json({
          message:
            "Usuário não autenticado.",
        });
    }

    const role =
      String(
        req.user.role || ""
      )
        .trim()
        .toUpperCase();

    if (
      role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({
          message:
            "Acesso permitido apenas para administradores.",
        });
    }

    return next();
  } catch (error) {
    console.error(
      "Erro no adminMiddleware:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Erro interno ao validar administrador.",
      });
  }
}

module.exports =
  adminMiddleware;