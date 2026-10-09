import config from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value';
    details = err.keyValue;
  }

  if (statusCode >= 500) {
    console.error(`[error] ${message}`, config.isProduction ? '' : err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode >= 500 && config.isProduction ? 'Internal server error' : message,
      ...(details ? { details } : {}),
    },
  });
}

export function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

export function isApiError(err) {
  return err instanceof ApiError;
}

export default errorHandler;
