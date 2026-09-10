const pool = require('../config/database');
const { createError } = require('../utils/errors');
const { formatOrder, formatOrderItem } = require('../utils/formatters');

const createOrder = async (req, res, next) => {
  const { items } = req.body;
  const userId = req.userId;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const productResult = await client.query(
        `SELECT id, name, price, stock_quantity
         FROM products
         WHERE id = $1
         FOR UPDATE`,
        [item.productId]
      );

      if (productResult.rows.length === 0) {
        throw createError(404, `Product with id ${item.productId} not found`);
      }

      const product = productResult.rows[0];

      if (product.stock_quantity < item.quantity) {
        throw createError(
          400,
          `Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}, requested: ${item.quantity}`
        );
      }

      const updateResult = await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE id = $2 AND stock_quantity >= $1
         RETURNING stock_quantity`,
        [item.quantity, item.productId]
      );

      if (updateResult.rowCount === 0) {
        throw createError(400, `Insufficient stock for product "${product.name}"`);
      }

      const lineTotal = parseFloat(product.price) * item.quantity;
      totalAmount += lineTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        priceAtOrder: parseFloat(product.price)
      });
    }

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, status)
       VALUES ($1, $2, 'confirmed')
       RETURNING *`,
      [userId, totalAmount]
    );

    const order = orderResult.rows[0];
    const savedItems = [];

    for (const item of orderItems) {
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [order.id, item.productId, item.quantity, item.priceAtOrder]
      );

      savedItems.push(formatOrderItem({
        ...itemResult.rows[0],
        product_name: item.productName
      }));
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created successfully',
      order: formatOrder(order, savedItems)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const getOrders = async (req, res, next) => {
  const userId = req.userId;

  try {
    const ordersResult = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const orders = [];

    for (const orderRow of ordersResult.rows) {
      const itemsResult = await pool.query(
        `SELECT oi.*, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1`,
        [orderRow.id]
      );

      orders.push(formatOrder(orderRow, itemsResult.rows.map(formatOrderItem)));
    }

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (orderResult.rows.length === 0) {
      return next(createError(404, 'Order not found'));
    }

    const itemsResult = await pool.query(
      `SELECT oi.*, p.name AS product_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      order: formatOrder(orderResult.rows[0], itemsResult.rows.map(formatOrderItem))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getOrders, getOrderById };
