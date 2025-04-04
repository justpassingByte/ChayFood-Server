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
  try {
    // The user should already be attached to the request by Passport.js
    const user = req.user;
    
    if (!user) {
      console.error('OAuth callback: No user found in request');
      return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=authentication_failed`);
    }
    
    // Make sure we have a valid user object with _id
    if (!user._id) {
      console.error('OAuth callback: Invalid user object', user);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=server_error`);
    }
    
    // Generate JWT token for the authenticated user
    const token = jwt.sign(
      { 
        _id: user._id, 
        email: user.email,
        // Include role if available, default to 'user'
        role: user.role || 'user'
      },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '7d' }
    );
    
    // Log successful authentication
    console.log(`OAuth login successful for user: ${user.email}`);
    
    // Redirect to the frontend callback page with the token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=server_error`);
  }
}

/**
 * Check authentication status
 */
export function checkAuthStatus(req: Request, res: Response): void {
  console.log('Auth status check - req.user:', req.user ? {
    _id: (req.user as IUser)._id,
    email: (req.user as IUser).email,
    role: (req.user as IUser).role
  } : 'No user');
  
  if (req.user) {
    // Create a minimal user object that includes all necessary fields
    const userResponse = {
      _id: (req.user as any)._id,
      email: (req.user as any).email,
      name: (req.user as any).name || (req.user as any).email?.split('@')[0] || 'User',
      role: (req.user as any).role || 'user',
      picture: (req.user as any).picture || null
    };
    
    console.log('Responding with user:', userResponse);
    
    res.json({ 
      isAuthenticated: true, 
      user: userResponse
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