const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = require("../config/prisma");
const transporter = require("../config/mail");
function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function generateVerificationCode() {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

function getVerificationExpiration() {
  return new Date(
    Date.now() + 10 * 60 * 1000
  );
}

const profileSelect = {
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
};

// ==========================================
// 1. SOLICITAR CÓDIGO DE VERIFICAÇÃO
// ==========================================

const requestEmailVerification = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        error: "O campo e-mail é obrigatório.",
      });
    }

    const userExists =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (userExists) {
      return res.status(400).json({
        error:
          "Este e-mail já possui um cadastro ativo.",
      });
    }

    const verificationCode =
      generateVerificationCode();

    const expiresAt =
      getVerificationExpiration();

    await prisma.emailVerification.upsert({
      where: {
        email,
      },
      update: {
        code: verificationCode,
        expiresAt,
      },
      create: {
        email,
        code: verificationCode,
        expiresAt,
      },
    });

    await transporter.sendMail({
      from: `"Trinity <${process.env.MAIL_USER}>"`,
      to: email,
      subject:
        "CÓDIGO DE VERIFICAÇÃO - TRINITY",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #333; background: #111; color: #fff; border-radius: 12px;">
          <h2 style="text-align: center; border-bottom: 1px solid #333; padding-bottom: 16px;">
            TRINITY
          </h2>

          <p>
            Você solicitou a criação de uma conta na Trinity.
          </p>

          <p>
            Use o código abaixo para confirmar seu e-mail:
          </p>

          <div style="background: #222; border: 1px dashed #fff; padding: 18px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 24px 0; border-radius: 8px;">
            ${verificationCode}
          </div>

          <p style="font-size: 13px; color: #999; text-align: center;">
            Este código expira em 10 minutos. Se você não solicitou este cadastro, ignore esta mensagem.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message:
        "Código de segurança enviado para seu e-mail.",
    });
  } catch (error) {
    console.error(
      "Erro ao enviar código de verificação:",
      error
    );

    return res.status(500).json({
      error:
        "Falha interna no serviço de envio de e-mails.",
    });
  }
};

// ==========================================
// 2. REGISTRAR USUÁRIO
// ==========================================

const register = async (req, res) => {
  try {
    const name = String(
      req.body.name || ""
    ).trim();

    const email = normalizeEmail(req.body.email);

    const password = String(
      req.body.password || ""
    );

    const code = String(
      req.body.code || ""
    ).trim();

    if (!name || !email || !password || !code) {
      return res.status(400).json({
        error:
          "Nome, e-mail, senha e código de verificação são obrigatórios.",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        error:
          "O nome precisa ter pelo menos 2 caracteres.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error:
          "A senha precisa ter pelo menos 6 caracteres.",
      });
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      return res.status(400).json({
        error:
          "Este e-mail já possui uma conta.",
      });
    }

    const verification =
      await prisma.emailVerification.findUnique({
        where: {
          email,
        },
      });

    if (!verification) {
      return res.status(400).json({
        error:
          "Nenhum código encontrado para este e-mail.",
      });
    }

    if (
      String(verification.code).trim() !== code
    ) {
      return res.status(400).json({
        error: "Código incorreto.",
      });
    }

    if (
      new Date() >
      new Date(verification.expiresAt)
    ) {
      await prisma.emailVerification.delete({
        where: {
          email,
        },
      });

      return res.status(400).json({
        error:
          "Este código expirou. Solicite um novo código.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const newUser =
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "CLIENTE",
          isVerified: true,
        },
      });

    await prisma.emailVerification.delete({
      where: {
        email,
      },
    });

    return res.status(201).json({
      message:
        "Usuário registrado com sucesso.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao registrar usuário:",
      error
    );

    return res.status(500).json({
      error:
        "Erro interno ao processar o cadastro.",
    });
  }
};

// ==========================================
// 3. LOGIN
// ==========================================

const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    const password = String(
      req.body.password || ""
    );

    if (!email || !password) {
      return res.status(400).json({
        error:
          "E-mail e senha são obrigatórios.",
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      return res.status(401).json({
        error: "Credenciais inválidas.",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Credenciais inválidas.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET ||
        "chave_secreta_padrao_trinity",
      {
        expiresIn:
          process.env.JWT_EXPIRES_IN ||
          "15m",
      }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Erro no processamento do login:",
      error
    );

    return res.status(500).json({
      error:
        "Erro interno ao processar o login.",
    });
  }
};

// ==========================================
// 4. BUSCAR PERFIL
// ==========================================

const getProfile = async (req, res) => {
  try {
    const user =
      await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
        select: profileSelect,
      });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado.",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(
      "Erro ao buscar perfil:",
      error
    );

    return res.status(500).json({
      error:
        "Erro interno ao buscar perfil.",
    });
  }
};

// ==========================================
// 5. ATUALIZAR PERFIL
// ==========================================

const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      cpf,
      birthDate,
      avatarUrl,
      zipCode,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
    } = req.body;

    const normalizedCpf = cpf
      ? String(cpf).replace(/\D/g, "")
      : null;

    if (
      normalizedCpf &&
      normalizedCpf.length !== 11
    ) {
      return res.status(400).json({
        error:
          "O CPF precisa ter 11 números.",
      });
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          name:
            String(name || "").trim() ||
            null,

          phone: phone
            ? String(phone).replace(
                /\D/g,
                ""
              )
            : null,

          cpf: normalizedCpf,

          birthDate: birthDate
            ? new Date(birthDate)
            : null,

          avatarUrl:
            String(
              avatarUrl || ""
            ).trim() || null,

          zipCode: zipCode
            ? String(zipCode).replace(
                /\D/g,
                ""
              )
            : null,

          street:
            String(street || "").trim() ||
            null,

          number:
            String(number || "").trim() ||
            null,

          complement:
            String(
              complement || ""
            ).trim() || null,

          neighborhood:
            String(
              neighborhood || ""
            ).trim() || null,

          city:
            String(city || "").trim() ||
            null,

          state:
            String(state || "")
              .trim()
              .toUpperCase() || null,
        },
        select: profileSelect,
      });

    return res.status(200).json({
      message:
        "Perfil atualizado com sucesso.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar perfil:",
      error
    );

    if (error?.code === "P2002") {
      return res.status(409).json({
        error:
          "Este CPF já está sendo utilizado por outra conta.",
      });
    }

    return res.status(500).json({
      error:
        "Erro interno ao atualizar perfil.",
    });
  }
};

// ==========================================
// 6. SOLICITAR REDEFINIÇÃO DE SENHA
// ==========================================

const requestPasswordReset = async (
  req,
  res
) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        error: "O e-mail é obrigatório.",
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      return res.status(404).json({
        error:
          "Nenhuma conta foi encontrada com este e-mail.",
      });
    }

    const resetCode =
      generateVerificationCode();

    const expiresAt =
      getVerificationExpiration();

    await prisma.emailVerification.upsert({
      where: {
        email,
      },
      update: {
        code: resetCode,
        expiresAt,
      },
      create: {
        email,
        code: resetCode,
        expiresAt,
      },
    });

    await transporter.sendMail({
      from: `"Trinity <${process.env.MAIL_USER}>"`,
      to: email,
      subject:
        "REDEFINIÇÃO DE SENHA - TRINITY",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #111; color: #fff; border: 1px solid #333; border-radius: 12px;">
          <h2 style="text-align: center; margin-bottom: 24px;">
            TRINITY
          </h2>

          <p>
            Recebemos uma solicitação para redefinir sua senha.
          </p>

          <p>
            Use o código abaixo:
          </p>

          <div style="margin: 24px 0; padding: 18px; text-align: center; background: #222; border: 1px dashed #fff; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px;">
            ${resetCode}
          </div>

          <p style="font-size: 13px; color: #aaa;">
            O código expira em 10 minutos. Se você não solicitou esta alteração, ignore este e-mail.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message:
        "Código de redefinição enviado para seu e-mail.",
    });
  } catch (error) {
    console.error(
      "Erro ao solicitar redefinição de senha:",
      error
    );

    return res.status(500).json({
      error:
        "Erro interno ao enviar o código de redefinição.",
    });
  }
};

// ==========================================
// 7. REDEFINIR SENHA
// ==========================================

const resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    const code = String(
      req.body.code || ""
    ).trim();

    const password = String(
      req.body.password || ""
    );

    if (!email || !code || !password) {
      return res.status(400).json({
        error:
          "E-mail, código e nova senha são obrigatórios.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error:
          "A nova senha precisa ter pelo menos 6 caracteres.",
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado.",
      });
    }

    const verification =
      await prisma.emailVerification.findUnique({
        where: {
          email,
        },
      });

    if (!verification) {
      return res.status(400).json({
        error:
          "Nenhum código de redefinição foi encontrado.",
      });
    }

    if (
      String(verification.code).trim() !== code
    ) {
      return res.status(400).json({
        error: "Código inválido.",
      });
    }

    if (
      new Date() >
      new Date(verification.expiresAt)
    ) {
      await prisma.emailVerification.delete({
        where: {
          email,
        },
      });

      return res.status(400).json({
        error:
          "O código expirou. Solicite um novo.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        email,
      },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.emailVerification.delete({
      where: {
        email,
      },
    });

    return res.status(200).json({
      message:
        "Senha redefinida com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao redefinir senha:",
      error
    );

    return res.status(500).json({
      error:
        "Erro interno ao redefinir a senha.",
    });
  }
};

// ==========================================
// EXPORTAÇÕES
// ==========================================

module.exports = {
  requestEmailVerification,
  register,
  login,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword,
};