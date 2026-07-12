const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const { getDashboard } = require("../controllers/adminController");

router.get(
  "/dashboard",
  authMiddleware,
  getDashboard
);

module.exports = router;