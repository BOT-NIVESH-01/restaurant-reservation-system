// Lightweight error class so controllers can do:
//   throw new ApiError(404, 'Reservation not found')
// and the centralized error handler will format it consistently.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;