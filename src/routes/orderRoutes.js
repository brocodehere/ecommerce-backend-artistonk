const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById } = require('../controllers/orderController');
const authenticate = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { validateOrder } = require('../utils/validators');
const validateId = require('../middleware/validateId');

router.use(authenticate);

router.post('/', validateRequest(validateOrder), createOrder);
router.get('/', getOrders);
router.get('/:id', validateId, getOrderById);

module.exports = router;
