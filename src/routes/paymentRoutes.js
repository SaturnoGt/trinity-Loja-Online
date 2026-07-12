const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  createPreference,
} = require("../controllers/paymentController");

router.post(
  "/create-preference",
  authMiddleware,
  createPreference
);

module.exports = router;