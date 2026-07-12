const express = require('express');
const router = express.Router();

const {
  requestEmailVerification,
  register,
  login
} = require('../controllers/authController');

console.log({
  requestEmailVerification,
  register,
  login
});

router.post('/request-verification', requestEmailVerification);
router.post('/register', register);
router.post('/login', login);

module.exports = router;