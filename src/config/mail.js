const nodemailer = require("nodemailer");

const mailPort =
  Number(process.env.MAIL_PORT) || 587;

const transporter = nodemailer.createTransport({
  host:
    process.env.MAIL_HOST ||
    "smtp.gmail.com",

  port: mailPort,

  secure: mailPort === 465,

  family: 4,

  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

module.exports = transporter;