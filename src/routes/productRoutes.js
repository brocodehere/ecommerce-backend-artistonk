const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { validateRequest, validateQuery } = require('../middleware/validation');
const {
  validateProduct,
  validateProductUpdate,
  validateProductQuery
} = require('../utils/validators');
const validateId = require('../middleware/validateId');

router.post('/', validateRequest(validateProduct), createProduct);
router.get('/', validateQuery(validateProductQuery), getProducts);
router.get('/:id', validateId, getProductById);
router.patch('/:id', validateId, validateRequest(validateProductUpdate), updateProduct);
router.delete('/:id', validateId, deleteProduct);

module.exports = router;
