const express = require("express");

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require(
  "../controllers/favoriteController"
);

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  getFavorites
);

router.post(
  "/:productId",
  authMiddleware,
  addFavorite
);

router.delete(
  "/:productId",
  authMiddleware,
  removeFavorite
);

module.exports = router;