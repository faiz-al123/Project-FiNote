function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'Terjadi kesalahan pada server.';

  if (!err.isOperational) {
    console.error('Unexpected error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}

module.exports = errorMiddleware;
