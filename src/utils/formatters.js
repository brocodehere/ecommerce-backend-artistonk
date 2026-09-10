const formatProduct = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: parseFloat(row.price),
  stockQuantity: row.stock_quantity,
  category: row.category,
  createdAt: row.created_at
});

const formatOrderItem = (row) => ({
  id: row.id,
  productId: row.product_id,
  productName: row.product_name,
  quantity: row.quantity,
  priceAtOrder: parseFloat(row.price_at_order)
});

const formatOrder = (row, items = []) => ({
  id: row.id,
  userId: row.user_id,
  totalAmount: parseFloat(row.total_amount),
  status: row.status,
  createdAt: row.created_at,
  items
});

module.exports = { formatProduct, formatOrder, formatOrderItem };
