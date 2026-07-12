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
      return res.status(400).json({ error: "E-mail, senha e código de verificação são obrigatórios." });
    }

    // Busca o registro de validação no banco
    const verification = await prisma.emailVerification.findUnique({
      where: { email }
    });

    console.log("========== REGISTER ==========");
    console.log("Email recebido:", email);
    console.log("Código recebido:", code);
    console.log("Registro encontrado:", verification);

    if (!verification) {
      return res.status(400).json({ error: "Nenhum código encontrado para este e-mail." });
    }

    if (String(verification.code).trim() !== String(code).trim()) {
      return res.status(400).json({ error: "Código incorreto." });
    }

    // Validação de janela de expiração temporal
    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: "Este código já expirou. Solicite um novo código." });
    }

    // Criptografa a senha com bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Cria o usuário como CLIENTE por padrão
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "CLIENTE"
      }
    });

    // Remove o registro de verificação para evitar reuso
    await prisma.emailVerification.delete({ where: { email } });

    res.status(201).json({ 
      message: "Identidade verificada! Usuário registrado com sucesso.", 
      user: { id: newUser.id, email: newUser.email, role: newUser.role } 
    });

  } catch (error) {
    console.error("Erro na validação do registro:", error);
    res.status(500).json({ error: "Erro interno ao processar a validação do cadastro." });
  }
};

// ==========================================
// 3. LOGIN SISTÊMICO (AUTENTICAÇÃO JWT)
// ==========================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Geração do token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'chave_secreta_padrao_trinity',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.status(200).json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error("Erro no processamento do login:", error);
    res.status(500).json({ error: "Erro interno ao processar o login." });
  }
};

// Adicione esta linha temporária de teste pedida pelo ChatGPT:
// 1. O teste do console.log que o ChatGPT pediu para ver no terminal
console.log({
  requestEmailVerification,
  register,
  login
});

// 2. A exportação única e correta das funções
module.exports = {
  requestEmailVerification,
  register,
  login
};