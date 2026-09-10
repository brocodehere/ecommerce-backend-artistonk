const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: 'Conflict',
          message: 'A record with this information already exists'
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Referenced record does not exist'
        });
      case '23502': // Not null violation
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Required field is missing'
        });
      default:
        return res.status(500).json({
          error: 'Database Error',
          message: 'An error occurred while processing your request'
        });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token expired'
    });
  }

  // Custom errors with status
  if (err.status) {
    const statusLabels = {
      400: 'Bad Request',
      401: 'Unauthorized',
      404: 'Not Found',
      409: 'Conflict'
    };

    return res.status(err.status).json({
      error: statusLabels[err.status] || 'Error',
      message: err.message || 'An error occurred',
      ...(err.details && { details: err.details })
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
};

module.exports = errorHandler;
