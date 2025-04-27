"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.handleOAuthCallback = handleOAuthCallback;
exports.checkAuthStatus = checkAuthStatus;
exports.logout = logout;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
/**
 * Register a new user with email and password
 */
async function register(req, res) {
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
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                status: 'error',
                message: 'User with this email already exists',
            });
            return;
        }
        // Create new user
        const user = await User_1.User.create({
            name,
            email,
            password,
        });
        // Generate token
        const token = jsonwebtoken_1.default.sign({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default_jwt_secret', { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Registration failed',
            error: error.message,
        });
    }
}
/**
 * Login with email and password
 */
async function login(req, res) {
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
        const user = await User_1.User.findOne({ email });
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
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid credentials',
            });
            return;
        }
        // Generate token
        const token = jsonwebtoken_1.default.sign({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default_jwt_secret', { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Login failed',
            error: error.message,
        });
    }
}
/**
 * Handle OAuth callback (Google, Facebook, etc.)
 */
function handleOAuthCallback(req, res) {
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
        const token = jsonwebtoken_1.default.sign({
            _id: user._id,
            email: user.email,
            // Include role if available, default to 'user'
            role: user.role || 'user'
        }, process.env.JWT_SECRET || 'default_jwt_secret', { expiresIn: '7d' });
        // Log successful authentication
        console.log(`OAuth login successful for user: ${user.email}`);
        // Redirect to the frontend callback page with the token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    }
    catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=server_error`);
    }
}
/**
 * Check authentication status
 */
function checkAuthStatus(req, res) {
    var _a;
    console.log('Auth status check - req.user:', req.user ? {
        _id: req.user._id,
        email: req.user.email,
        role: req.user.role
    } : 'No user');
    if (req.user) {
        // Create a minimal user object that includes all necessary fields
        const userResponse = {
            _id: req.user._id,
            email: req.user.email,
            name: req.user.name || ((_a = req.user.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || 'User',
            role: req.user.role || 'user',
            picture: req.user.picture || null
        };
        console.log('Responding with user:', userResponse);
        res.json({
            isAuthenticated: true,
            user: userResponse
        });
    }
    else {
        res.json({ isAuthenticated: false });
    }
}
/**
 * Logout user
 */
function logout(req, res) {
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
    }
    else {
        // If we're not using sessions
        res.json({ status: 'success', message: 'Logged out successfully' });
    }
}
