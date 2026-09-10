const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value || !emailRegex.test(value)) {
      return 'Valid email is required';
    }
    return null;
  },
  
  password: (value) => {
    if (!value || value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  },
  
  required: (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  },
  
  number: (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    if (isNaN(Number(value))) {
      return `${fieldName} must be a number`;
    }
    return null;
  },
  
  positiveNumber: (value, fieldName) => {
    const numError = validators.number(value, fieldName);
    if (numError) return numError;
    if (Number(value) <= 0) {
      return `${fieldName} must be positive`;
    }
    return null;
  },
  
  nonNegativeNumber: (value, fieldName) => {
    const numError = validators.number(value, fieldName);
    if (numError) return numError;
    if (Number(value) < 0) {
      return `${fieldName} must be non-negative`;
    }
    return null;
  },
  
  string: (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    if (typeof value !== 'string') {
      return `${fieldName} must be a string`;
    }
    return null;
  }
};

const validateRegister = (data) => {
  const errors = [];
  
  const emailError = validators.email(data.email);
  if (emailError) errors.push({ field: 'email', message: emailError });
  
  const passwordError = validators.password(data.password);
  if (passwordError) errors.push({ field: 'password', message: passwordError });
  
  if (errors.length > 0) {
    return { error: errors };
  }
  return { value: { email: data.email, password: data.password } };
};

const validateLogin = (data) => {
  return validateRegister(data);
};

const validateProduct = (data) => {
  const errors = [];
  
  const nameError = validators.string(data.name, 'name');
  if (nameError) errors.push({ field: 'name', message: nameError });
  
  const priceError = validators.positiveNumber(data.price, 'price');
  if (priceError) errors.push({ field: 'price', message: priceError });
  
  const stockError = validators.nonNegativeNumber(data.stockQuantity, 'stockQuantity');
  if (stockError) errors.push({ field: 'stockQuantity', message: stockError });
  
  if (errors.length > 0) {
    return { error: errors };
  }
  
  return {
    value: {
      name: data.name,
      description: data.description || null,
      price: Number(data.price),
      stockQuantity: Number(data.stockQuantity),
      category: data.category || null
    }
  };
};

const validateOrder = (data) => {
  const errors = [];
  
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push({ field: 'items', message: 'Items array is required and must not be empty' });
  } else {
    data.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push({ field: `items[${index}].productId`, message: 'Product ID is required' });
      }
      if (item.quantity === undefined || item.quantity === null || item.quantity === '') {
        errors.push({ field: `items[${index}].quantity`, message: 'Quantity is required' });
      } else if (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
        errors.push({ field: `items[${index}].quantity`, message: 'Quantity must be a positive number' });
      }
    });
  }
  
  if (errors.length > 0) {
    return { error: errors };
  }
  
  return {
    value: {
      items: data.items.map(item => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity)
      }))
    }
  };
};

const validateProductUpdate = (data) => {
  const errors = [];
  const hasField = ['name', 'description', 'price', 'stockQuantity', 'category'].some(
    (field) => data[field] !== undefined
  );

  if (!hasField) {
    errors.push({ field: 'body', message: 'At least one field must be provided for update' });
  }

  if (data.name !== undefined) {
    const nameError = validators.string(data.name, 'name');
    if (nameError) errors.push({ field: 'name', message: nameError });
  }

  if (data.price !== undefined) {
    const priceError = validators.positiveNumber(data.price, 'price');
    if (priceError) errors.push({ field: 'price', message: priceError });
  }

  if (data.stockQuantity !== undefined) {
    const stockError = validators.nonNegativeNumber(data.stockQuantity, 'stockQuantity');
    if (stockError) errors.push({ field: 'stockQuantity', message: stockError });
  }

  if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
    errors.push({ field: 'description', message: 'description must be a string' });
  }

  if (data.category !== undefined && data.category !== null && typeof data.category !== 'string') {
    errors.push({ field: 'category', message: 'category must be a string' });
  }

  if (errors.length > 0) {
    return { error: errors };
  }

  const value = {};
  if (data.name !== undefined) value.name = data.name;
  if (data.description !== undefined) value.description = data.description;
  if (data.price !== undefined) value.price = Number(data.price);
  if (data.stockQuantity !== undefined) value.stockQuantity = Number(data.stockQuantity);
  if (data.category !== undefined) value.category = data.category;

  return { value };
};

const validateProductQuery = (data) => {
  const errors = [];
  
  if (data.page !== undefined) {
    const pageError = validators.positiveNumber(data.page, 'page');
    if (pageError) errors.push({ field: 'page', message: pageError });
  }
  
  if (data.limit !== undefined) {
    const limitError = validators.positiveNumber(data.limit, 'limit');
    if (limitError) errors.push({ field: 'limit', message: limitError });
  }
  
  if (data.inStock !== undefined && data.inStock !== 'true' && data.inStock !== 'false') {
    errors.push({ field: 'inStock', message: 'inStock must be true or false' });
  }
  
  if (errors.length > 0) {
    return { error: errors };
  }
  
  return {
    value: {
      search: data.search || null,
      category: data.category || null,
      inStock: data.inStock === 'true' ? true : data.inStock === 'false' ? false : null,
      page: data.page ? Number(data.page) : 1,
      limit: data.limit ? Number(data.limit) : 10
    }
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validateProductUpdate,
  validateOrder,
  validateProductQuery
};
