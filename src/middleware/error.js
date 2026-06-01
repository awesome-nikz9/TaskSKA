const { ApiException } = require('../lib/errors');
const REASON = { 400:'Bad Request',401:'Unauthorized',403:'Forbidden',404:'Not Found',409:'Conflict',500:'Internal Server Error' };
// Global error handler — mirrors the Java GlobalExceptionHandler body shape.
module.exports = (err, req, res, _next) => {
  const status = err instanceof ApiException ? err.status : 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    timestamp: new Date().toISOString(),
    status,
    error: REASON[status] || 'Error',
    message: err.message || 'Unexpected error',
  });
};
