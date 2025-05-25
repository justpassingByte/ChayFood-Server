"use strict";
/**
 * Utility to generate a test JWT token for development purposes
 *
 * Run this script with:
 * npx ts-node src/utils/generate-test-token.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generateTestToken = () => {
    // Use the same secret as in the authentication middleware
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    // Create a test user payload
    const testUser = {
        _id: '680ddea659097f00bc0a9e35', // Changed from id to _id to match controller expectations
        email: 'test@example.com',
        role: 'user', // Change to 'admin' for admin access
    };
    // Generate a token with 1 day expiration
    const token = jsonwebtoken_1.default.sign(testUser, jwtSecret, { expiresIn: '1d' });
    console.log('=== TEST JWT TOKEN ===');
    console.log('Use this token for testing API endpoints that require authentication');
    console.log('\nJWT Token:');
    console.log(token);
    console.log('\nAuthorization Header:');
    console.log(`Bearer ${token}`);
    console.log('\nTo use in Postman:');
    console.log('1. Add a header with key "Authorization"');
    console.log(`2. Set the value to "Bearer ${token}"`);
    console.log('\nToken Payload:');
    console.log(testUser);
    console.log('\nExpires: In 1 day');
};
// Execute the function when the script is run directly
if (require.main === module) {
    generateTestToken();
}
exports.default = generateTestToken;
