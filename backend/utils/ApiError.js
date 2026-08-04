/**
 * Standard application error. Controllers throw this (or call next(new ApiError(...)))
 * and the central error handler in middleware/errorHandler.js turns it into a
 * consistent JSON response with the right HTTP status code.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
