const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

const PORT = process.env.PORT || 3001;

// ==========================================
// SEGURANÇA E OTIMIZAÇÃO
// ==========================================

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(compression());

// Limite geral da API:
// até 300 requisições por IP a cada 15 minutos.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message:
      "Muitas requisições realizadas. Tente novamente em alguns minutos.",
  },
});

// Limite mais rígido para autenticação:
// até 20 tentativas por IP a cada 15 minutos.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message:
      "Muitas tentativas de autenticação. Aguarde alguns minutos e tente novamente.",
  },
});

// ==========================================
// CORS
// ==========================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite Postman, Render, Mercado Pago
      // e outras requisições sem Origin.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Origem não permitida pelo CORS.")
      );
    },

    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Signature",
      "X-Request-Id",
    ],

    optionsSuccessStatus: 204,
  })
);

// ==========================================
// PARSERS
// ==========================================

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

// Limite geral aplicado às rotas da API.
app.use("/api", apiLimiter);

// ==========================================
// ROTAS DA API
// ==========================================

// Rate limit mais restrito para login,
// cadastro e recuperação de senha.
app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/payment",
  paymentRoutes
);

app.use(
  "/api/webhook",
  webhookRoutes
);

app.use(
  "/api/favorites",
  favoriteRoutes
);

app.use(
  "/api/users",
  userRoutes
);

// ==========================================
// ROTA DE TESTE
// ==========================================

app.get("/", (req, res) => {
  return res.status(200).json({
    message:
      "API da Trinity Corp está rodando com sucesso!",
    environment:
      process.env.NODE_ENV || "development",
  });
});

// ==========================================
// ROTA NÃO ENCONTRADA
// ==========================================

app.use((req, res) => {
  return res.status(404).json({
    message: "Rota não encontrada.",
  });
});

// ==========================================
// TRATAMENTO GLOBAL DE ERROS
// ==========================================

app.use((error, req, res, next) => {
  console.error("Erro interno da API:", error);

  if (
    error.message ===
    "Origem não permitida pelo CORS."
  ) {
    return res.status(403).json({
      message: error.message,
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      message:
        "O conteúdo enviado ultrapassa o limite permitido.",
    });
  }

  return res.status(500).json({
    message: "Erro interno do servidor.",
  });
});

// ==========================================
// START SERVER
// ==========================================

const server = app.listen(PORT, () => {
  console.log(
    `Servidor Trinity rodando na porta ${PORT}`
  );
});

// ==========================================
// ENCERRAMENTO SEGURO
// ==========================================

function shutdown(signal) {
  console.log(
    `${signal} recebido. Encerrando servidor...`
  );

  server.close(() => {
    console.log("Servidor encerrado com sucesso.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      "Encerramento forçado após tempo limite."
    );

    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});