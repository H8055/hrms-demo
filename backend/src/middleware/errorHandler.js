export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (error?.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation failed', errors: error.errors });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ message: 'Duplicate record detected' });
  }

  return res.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error'
  });
}
