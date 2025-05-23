import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

// Middleware to authenticate user
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    // For simplicity in this demo, we just check if the user exists
    // In a real app, you would verify the JWT token and get the user ID from it
    const userId = 'mockedUserId'; // Replace with actual user ID from token
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user info to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Middleware to authenticate admin
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In development mode, skip admin authentication
    if (process.env.NODE_ENV === 'development') {
      // Add a mock admin user to request
      req.user = { role: 'admin' } as any;
      return next();
    }

    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    // Verify token and get user
    // For simplicity in this demo, we just check if the user exists and is an admin
    const userId = 'mockedUserId'; // Replace with actual user ID from token
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Add user info to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}; 