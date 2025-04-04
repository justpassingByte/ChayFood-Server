import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';

/**
 * Register a new user with email and password
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'User with this email already exists',
      });
      return;
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate token
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '7d' }
    );

    // Return response
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: (error as Error).message,
    });
  }
}

/**
 * Login with email and password
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
      return;
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
      return;
    }

    // Check password
    if (!user.password) {
      res.status(401).json({
        status: 'error',
        message: 'Please login with your social account',
      });
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword!(password);
    if (!isMatch) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '7d' }
    );

    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: (error as Error).message,
    });
  }
}

/**
 * Handle OAuth callback (Google, Facebook, etc.)
 */
export function handleOAuthCallback(req: Request, res: Response): void {
  const user = req.user as IUser;
  
  if (!user) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=Authentication%20failed`);
    return;
  }
  
  const token = jwt.sign(
    { _id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'default_jwt_secret',
    { expiresIn: '7d' }
  );

  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
}

/**
 * Check authentication status
 */
export function checkAuthStatus(req: Request, res: Response): void {
  if (req.user) {
    res.json({ 
      isAuthenticated: true, 
      user: {
        _id: (req.user as IUser)._id,
        name: (req.user as IUser).name,
        email: (req.user as IUser).email,
        role: (req.user as IUser).role,
        picture: (req.user as IUser).picture
      } 
    });
  } else {
    res.json({ isAuthenticated: false });
  }
}

/**
 * Logout user
 */
export function logout(req: Request, res: Response): void {
  if (req.logout) {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Logout failed', 
          error: err.message 
        });
      }
      res.json({ status: 'success', message: 'Logged out successfully' });
    });
  } else {
    // If we're not using sessions
    res.json({ status: 'success', message: 'Logged out successfully' });
  }
} 