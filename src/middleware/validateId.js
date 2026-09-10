const validateId = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid ID parameter'
    });
  }

  req.params.id = id;
  next();
};

module.exports = validateId;
