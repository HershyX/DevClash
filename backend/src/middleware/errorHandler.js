/**
 * Centralized Express error-handling middleware.
 * Converts thrown ApiErrors, Mongoose validation errors and unexpected
 * failures into a consistent JSON envelope. Never leaks stack traces in prod
 * and never returns password hashes.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode ?? 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (!err.isOperational) {
    // Mongoose / generic errors — map common cases
    if (err.name === 'ValidationError') {
      statusCode = 422;
      message = Object.values(err.errors)
        .map((e) => e.message)
        .join('; ');
    } else if (err.name === 'CastError') {
      statusCode = 400;
      message = `Invalid id format: ${err.value}`;
    } else if (err.code === 11000) {
      statusCode = 409;
      const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
      message = `Duplicate value for ${field}`;
    } else if (statusCode === 500) {
      message = 'Internal server error';
    }
    details = undefined; // don't leak internals
  }

  if (!req.app.get('env') || req.app.get('env') !== 'production') {
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${statusCode}:`, err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
  });
}
