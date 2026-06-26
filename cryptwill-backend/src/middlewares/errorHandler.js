function errorResponse(res, statusCode, message, details = null) {
  const body = { success: false, error: message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

function successResponse(res, statusCode, data) {
  return res.status(statusCode).json({ success: true, data });
}

function errorHandler(err, req, res, next) {
  console.error('[Error]', err);
  if (err.name === 'ValidationError') {
    return errorResponse(res, 400, err.message);
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Invalid or expired token');
  }
  if (err.code === 'P2002') {
    return errorResponse(res, 409, 'A record with this value already exists');
  }
  return errorResponse(res, err.statusCode || 500, err.message || 'Internal server error');
}

module.exports = { errorResponse, successResponse, errorHandler };
