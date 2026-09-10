const validateRequest = (validator) => {
  return (req, res, next) => {
    const { error, value } = validator(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error
      });
    }
    
    req.body = value;
    next();
  };
};

const validateQuery = (validator) => {
  return (req, res, next) => {
    const { error, value } = validator(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: error
      });
    }
    
    req.query = value;
    next();
  };
};

module.exports = { validateRequest, validateQuery };
