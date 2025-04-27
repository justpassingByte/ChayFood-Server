"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const auth_controller_1 = require("../controllers/auth-controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Email/password authentication
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
// Google OAuth2 routes
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login?error=google_auth_failed' }), auth_controller_1.handleOAuthCallback);
// Facebook OAuth routes
router.get('/facebook', passport_1.default.authenticate('facebook', { scope: ['email', 'public_profile'] }));
router.get('/facebook/callback', passport_1.default.authenticate('facebook', { session: false, failureRedirect: '/login?error=facebook_auth_failed' }), auth_controller_1.handleOAuthCallback);
// Check authentication status
router.get('/status', auth_1.authenticateToken, auth_controller_1.checkAuthStatus);
// Logout
router.get('/logout', auth_controller_1.logout);
exports.default = router;
