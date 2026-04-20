export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || (error.code?.startsWith("LIMIT_") ? 400 : 500);

  res.status(statusCode).json({
    message: error.message || "Server error",
    errors: error.errors || undefined,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
}
