import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to verify admin privileges
 * This should be used after the authMiddleware to ensure user is authenticated
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
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