const pool = require('../config/database');
const { createError } = require('../utils/errors');
const { formatProduct } = require('../utils/formatters');

const createProduct = async (req, res, next) => {
  const { name, description, price, stockQuantity, category } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock_quantity, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, price, stockQuantity, category]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: formatProduct(result.rows[0])
    });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  const { search, category, inStock, page, limit } = req.query;

  try {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`name ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (inStock === true) {
      conditions.push('stock_quantity > 0');
    } else if (inStock === false) {
      conditions.push('stock_quantity = 0');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT * FROM products ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      products: result.rows.map(formatProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return next(createError(404, 'Product not found'));
    }

    res.json({ product: formatProduct(result.rows[0]) });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, price, stockQuantity, category } = req.body;

  try {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (price !== undefined) {
      fields.push(`price = $${paramIndex++}`);
      params.push(price);
    }
    if (stockQuantity !== undefined) {
      fields.push(`stock_quantity = $${paramIndex++}`);
      params.push(stockQuantity);
    }
    if (category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      params.push(category);
    }

    if (fields.length === 0) {
      return next(createError(400, 'At least one field must be provided for update'));
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return next(createError(404, 'Product not found'));
    }

    res.json({
      message: 'Product updated successfully',
      product: formatProduct(result.rows[0])
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return next(createError(404, 'Product not found'));
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
