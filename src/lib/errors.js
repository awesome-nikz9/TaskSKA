// ApiException equivalent + async route wrapper.
class ApiException extends Error {
  constructor(status, message) { super(message); this.status = status; }
  static badRequest(m) { return new ApiException(400, m); }
  static unauthorized(m) { return new ApiException(401, m); }
  static forbidden(m) { return new ApiException(403, m); }
  static notFound(m) { return new ApiException(404, m); }
  static conflict(m) { return new ApiException(409, m); }
}
// Wrap async handlers so thrown errors hit the global handler.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
module.exports = { ApiException, wrap };
