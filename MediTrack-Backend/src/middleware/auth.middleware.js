// src/middleware/auth.middleware.js — Role-Based Access Simulation
// In production: replace with JWT verification (jsonwebtoken library).
// Currently simulates auth via X-Role and X-User-Id request headers.

const { createError } = require('./errorHandler');

/**
 * Simulated role lookup — in production this would decode a JWT token.
 * Returns a user object if the "token" (role header) is valid.
 */
const simulateTokenDecode = (req) => {
    const role = req.headers['x-role'];
    const userId = req.headers['x-user-id'];

    if (!role || !userId) return null;

    const validRoles = ['admin', 'doctor', 'patient'];
    if (!validRoles.includes(role.toLowerCase())) return null;

    return { id: userId, role: role.toLowerCase() };
};

/**
 * requireAuth — Ensures a request carries valid auth headers.
 * Returns 401 if no credentials, 403 if role doesn't match.
 *
 * @param {...string} allowedRoles - Roles permitted to access the route
 */
const requireAuth = (...allowedRoles) => {
    return (req, res, next) => {
        const user = simulateTokenDecode(req);

        // 401 — No credentials provided
        if (!user) {
            return next(createError(401, 'Unauthorized: Please provide valid authentication headers (X-Role, X-User-Id).'));
        }

        // 403 — Credentials valid but role lacks permission
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            return next(createError(403, `Forbidden: '${user.role}' role does not have access to this resource. Required: [${allowedRoles.join(', ')}].`));
        }

        // Attach user to request for use in controllers
        req.user = user;
        next();
    };
};

module.exports = { requireAuth };
