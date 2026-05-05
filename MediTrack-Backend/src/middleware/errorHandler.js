// src/middleware/errorHandler.js — Centralized Error Handling

/**
 * Creates a standardized API error response object.
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array|null} errors - Validation errors array (optional)
 */
const createError = (statusCode, message, errors = null) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.errors = errors;
    return err;
};

/**
 * 404 Not Found Handler — catches all unmatched routes.
 */
const notFoundHandler = (req, res, next) => {
    const err = createError(404, `Route '${req.originalUrl}' not found on this server.`);
    next(err);
};

/**
 * Global Error Handler — Express 4-argument error middleware.
 * Must be the LAST middleware registered.
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    const response = {
        success: false,
        status: statusCode,
        message: err.message || 'Internal Server Error',
        ...(err.errors && { errors: err.errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    console.error(`[${new Date().toISOString()}] Error ${statusCode}: ${err.message}`);
    res.status(statusCode).json(response);
};

/**
 * Standard success response helper — used in controllers.
 */
const sendSuccess = (res, statusCode, message, data = null) => {
    const response = {
        success: true,
        status: statusCode,
        message,
        ...(data !== null && { data })
    };
    return res.status(statusCode).json(response);
};

module.exports = { createError, notFoundHandler, errorHandler, sendSuccess };
