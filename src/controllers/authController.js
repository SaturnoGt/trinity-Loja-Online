const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = require('../config/mail');
const prisma = new PrismaClient();

// ==========================================
// 1. SOLICITAR CÓDIGO DE VERIFICAÇÃO POR E-MAIL
// ==========================================
const requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "O campo e-mail é obrigatório." });
    }

    // Evita duplicidade de conta ativa
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: "Este e-mail já possui um cadastro ativo." });
    }

    // Gera um código seguro de 6 dígitos (OTP)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Define tempo de expiração estrito: 10 minutos a partir de agora
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Salva ou atualiza o código temporário no banco
    await prisma.emailVerification.upsert({
      where: { email },
      update: { code: verificationCode, expiresAt },
      create: { email, code: verificationCode, expiresAt }
    });

    // Envia o e-mail de forma assíncrona
    const mailOptions = {
      from: '"Trinity Corp Security" <security@trinitycorp.com>',
      to: email,
      subject: "CÓDIGO DE VERIFICAÇÃO - TRINITY CORP",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #333; background-color: #111; color: #fff; border-radius: 8px;">
          <h2 style="color: #00ff66; text-align: center; border-bottom: 1px solid #333; padding-bottom: 10px;">TRINITY CORP SYSTEMS</h2>
          <p>Você solicitou a criação de credenciais no ecossistema de dados da Trinity Corp.</p>
          <p>Use o código de autorização abaixo para confirmar sua identidade:</p>
          <div style="background-color: #222; border: 1px dashed #00ff66; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #00ff66; margin: 20px 0; border-radius: 4px;">
            ${verificationCode}
          </div>
          <p style="font-size: 12px; color: #888; text-align: center;">Este token expira em 10 minutos. Se você não solicitou este cadastro, ignore este e-mail imediatamente.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Código de segurança enviado com sucesso para o e-mail fornecido." });

  } catch (error) {
    console.error("Erro no envio do token por e-mail:", error);
    res.status(500).json({ error: "Falha interna no serviço de envio de e-mails." });
  }
};

// ==========================================
// 2. REGISTRO DEFINITIVO (CONFIRMAÇÃO DO CÓDIGO)
// ==========================================
const register = async (req, res) => {
  try {
    const { email, password, code } = req.body;

    if (!email || !password || !code) {
      return res.status(400).json({
        error: "E-mail, senha e código de verificação são obrigatórios.",
      });
    }

    const verification = await prisma.emailVerification.findUnique({
      where: {
        email,
      },
    });

    if (!verification) {
      return res.status(400).json({
        error: "Nenhum código encontrado para este e-mail.",
      });
    }

    if (String(verification.code).trim() !== String(code).trim()) {
      return res.status(400).json({
        error: "Código incorreto.",
      });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({
        error: "Este código já expirou. Solicite um novo código.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "CLIENTE",
      },
    });

    await prisma.emailVerification.delete({
      where: {
        email,
      },
    });

    return res.status(201).json({
      message: "Identidade verificada! Usuário registrado com sucesso.",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Erro na validação do registro:", error);

    return res.status(500).json({
      error: "Erro interno ao processar a validação do cadastro.",
    });
  }
};

// ==========================================
// 3. LOGIN SISTÊMICO (AUTENTICAÇÃO JWT)
// ==========================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "E-mail e senha são obrigatórios.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Credenciais inválidas.",
      });
    }

    const passwordMatch = await bcrypt.compare(
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
      process.env.JWT_SECRET || "chave_secreta_padrao_trinity",
      {
        expiresIn:
          process.env.JWT_EXPIRES_IN || "15m",
      }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erro no processamento do login:", error);

    return res.status(500).json({
      error: "Erro interno ao processar o login.",
    });
  }
};
// ==========================================
// 4. BUSCAR PERFIL DO USUÁRIO
// ==========================================
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
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
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado.",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);

    return res.status(500).json({
      error: "Erro interno ao buscar perfil.",
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

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        name: name || null,
        phone: phone || null,
        cpf: cpf ? cpf.replace(/\D/g, "") : null,
        birthDate: birthDate ? new Date(birthDate) : null,
        avatarUrl: avatarUrl || null,
        zipCode: zipCode || null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
      },
      select: {
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
      },
    });

    return res.status(200).json({
      message: "Perfil atualizado com sucesso.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);

    return res.status(500).json({
      error: "Erro interno ao atualizar perfil.",
    });
  }
};// ==========================================
// 6. SOLICITAR REDEFINIÇÃO DE SENHA
// ==========================================
const requestPasswordReset = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        error: "O e-mail é obrigatório.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        error: "Nenhuma conta foi encontrada com este e-mail.",
      });
    }

    const resetCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await prisma.emailVerification.upsert({
      where: { email },
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
      from: '"Trinity Corp Security" <security@trinitycorp.com>',
      to: email,
      subject: "REDEFINIÇÃO DE SENHA - TRINITY",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #111; color: #fff; border: 1px solid #333; border-radius: 12px;">
          <h2 style="text-align: center; margin-bottom: 24px;">
            TRINITY
          </h2>

          <p>Recebemos uma solicitação para redefinir sua senha.</p>

          <p>Use o código abaixo:</p>

          <div style="margin: 24px 0; padding: 18px; text-align: center; background: #222; border: 1px dashed #fff; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px;">
            ${resetCode}
          </div>

          <p style="font-size: 13px; color: #aaa;">
            O código expira em 10 minutos.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "Código de redefinição enviado para seu e-mail.",
    });
  } catch (error) {
    console.error(
      "Erro ao solicitar redefinição de senha:",
      error
    );

    return res.status(500).json({
      error: "Erro interno ao enviar o código de redefinição.",
    });
  }
};

// ==========================================
// 7. REDEFINIR SENHA
// ==========================================
const resetPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const code = String(req.body.code || "").trim();
    const password = String(req.body.password || "");

    if (!email || !code || !password) {
      return res.status(400).json({
        error: "E-mail, código e nova senha são obrigatórios.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "A nova senha precisa ter pelo menos 6 caracteres.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado.",
      });
    }

    const verification =
      await prisma.emailVerification.findUnique({
        where: { email },
      });

    if (!verification) {
      return res.status(400).json({
        error: "Nenhum código de redefinição foi encontrado.",
      });
    }

    if (
      String(verification.code).trim() !== code
    ) {
      return res.status(400).json({
        error: "Código inválido.",
      });
    }

    if (new Date() > verification.expiresAt) {
      await prisma.emailVerification.delete({
        where: { email },
      });

      return res.status(400).json({
        error: "O código expirou. Solicite um novo.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.emailVerification.delete({
      where: { email },
    });

    return res.status(200).json({
      message: "Senha redefinida com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);

    return res.status(500).json({
      error: "Erro interno ao redefinir a senha.",
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