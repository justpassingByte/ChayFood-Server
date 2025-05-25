import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Cấu hình Nodemailer - Điều chỉnh theo cấu hình email server thực tế
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME || 'nhockuteg2003@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'gwjg txqw oxno hipe',
  },
});

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

/**
 * Forgot password - send reset password email
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        status: 'error',
        message: 'Email is required',
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Không tiết lộ nếu email tồn tại hoặc không vì lý do bảo mật
      res.status(200).json({
        status: 'success',
        message: 'If the email exists, a password reset link has been sent',
      });
      return;
    }

    // Tạo reset token ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Đặt reset token và thời gian hết hạn (1 giờ)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 giờ
    await user.save();

    // Tạo URL reset password
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Gửi email
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_FROM || 'nhockuteg2003@gmail.com',
      subject: 'Đặt lại mật khẩu ChayFood',
      text: `Bạn đang nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\n
        Vui lòng nhấp vào liên kết sau hoặc dán nó vào trình duyệt của bạn để hoàn tất quy trình:\n\n
        ${resetURL}\n\n
        Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.\n`,
      html: `
        <h2>Đặt lại mật khẩu ChayFood</h2>
        <p>Bạn đang nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Vui lòng nhấp vào liên kết sau để hoàn tất quy trình:</p>
        <a href="${resetURL}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
        <p>Hoặc dán URL sau vào trình duyệt của bạn:</p>
        <p>${resetURL}</p>
        <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.</p>
      `,
    };

    // Gửi email (bất đồng bộ, không chờ)
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('Send email error:', err);
      }
    });

    // Phản hồi cho client
    res.status(200).json({
      status: 'success',
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process the request',
      error: (error as Error).message,
    });
  }
}

/**
 * Reset password using token
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        status: 'error',
        message: 'Token and new password are required',
      });
      return;
    }

    // Validate newPassword length
    if (newPassword.length < 6) {
      res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Find user with valid reset token and not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        status: 'error',
        message: 'Password reset token is invalid or has expired',
      });
      return;
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Gửi email xác nhận
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_FROM || 'noreply@chayfood.com',
      subject: 'Mật khẩu của bạn đã được thay đổi',
      text: `Xin chào,\n\n
        Đây là xác nhận rằng mật khẩu cho tài khoản ${user.email} của bạn vừa được thay đổi.\n`,
      html: `
        <h2>Thay đổi mật khẩu thành công</h2>
        <p>Xin chào,</p>
        <p>Đây là xác nhận rằng mật khẩu cho tài khoản ${user.email} của bạn vừa được thay đổi.</p>
      `,
    };

    // Gửi email (bất đồng bộ, không chờ)
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('Send confirmation email error:', err);
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password',
      error: (error as Error).message,
    });
  }
} 