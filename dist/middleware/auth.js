"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication failed: No token provided',
            error: 'Please include the token in the Authorization header as "Bearer <token>"'
        });
    }
    try {
        const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        console.log('Token verification successful, decoded payload:', {
            _id: decoded._id,
            email: decoded.email,
            role: decoded.role
        });
        // Assign the decoded payload to req.user
        req.user = decoded;
        next();
    }
    catch (error) {
        // Provide more specific error messages based on the JWT error
        let errorMessage = 'Authentication failed: Invalid token';
        let errorDetails = '';
        if (error.name === 'TokenExpiredError') {
            errorMessage = 'Authentication failed: Token expired';
            errorDetails = 'Please log in again to get a new token';
        }
        else if (error.name === 'JsonWebTokenError') {
            errorMessage = 'Authentication failed: Invalid token format';
            errorDetails = error.message;
        }
        else if (error.name === 'NotBeforeError') {
            errorMessage = 'Authentication failed: Token not active';
            errorDetails = 'Token cannot be used before its activation time';
        }
        console.log('Token verification failed:', error.message);
        return res.status(403).json({
            status: 'error',
            message: errorMessage,
            error: errorDetails
        });
    }
};
exports.authenticateToken = authenticateToken;
