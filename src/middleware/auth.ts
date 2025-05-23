import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

// Define interface for JWT payload
interface JwtUserPayload {
  _id: string;
  email: string;
  role: string;
}

// Main authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, jwtSecret) as JwtUserPayload;
    
    console.log('Token verification successful, decoded payload:', {
      _id: decoded._id,
      email: decoded.email,
      role: decoded.role
    });
    
    // Assign the decoded payload to req.user
    req.user = decoded as any;
    next();
  } catch (error: any) {
    // Provide more specific error messages based on the JWT error
    let errorMessage = 'Authentication failed: Invalid token';
    let errorDetails = '';

    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Authentication failed: Token expired';
      errorDetails = 'Please log in again to get a new token';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Authentication failed: Invalid token format';
      errorDetails = error.message;
    } else if (error.name === 'NotBeforeError') {
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

// For backward compatibility
export const authenticateToken = authenticate;

// Admin role check middleware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user exists in request (set by auth middleware)
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        error: 'You must be logged in to access this resource'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        error: 'You do not have the necessary permissions to access this resource'
      });
    }

    // If user is admin, proceed to the next middleware/controller
    next();
  } catch (error: any) {
    console.error('Error in admin middleware:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Error verifying admin privileges',
      error: error.message
    });
  }
}; 