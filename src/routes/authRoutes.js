const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validation');
const { validateRegister, validateLogin } = require('../utils/validators');

router.post('/register', validateRequest(validateRegister), register);
router.post('/login', validateRequest(validateLogin), login);

module.exports = router;