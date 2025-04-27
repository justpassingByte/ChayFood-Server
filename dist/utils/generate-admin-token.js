"use strict";
/**
 * Utility to generate an admin JWT token for testing admin-only endpoints
 *
 * Run this script with:
 * npx ts-node src/utils/generate-admin-token.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generateAdminToken = () => {
    // Use the same secret as in the authentication middleware
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    // Create an admin user payload
    const adminUser = {
        _id: '123456789012345678901234', // Changed from id to _id to match controller expectations
        email: 'admin@example.com',
        role: 'admin', // Admin role grants access to protected endpoints
    };
    // Generate a token with 1 day expiration
    const token = jsonwebtoken_1.default.sign(adminUser, jwtSecret, { expiresIn: '1d' });
    console.log('=== ADMIN JWT TOKEN ===');
    console.log('Use this token for testing admin-only endpoints');
    console.log('\nJWT Token:');
    console.log(token);
    console.log('\nAuthorization Header:');
    console.log(`Bearer ${token}`);
    console.log('\nTo use in Postman:');
    console.log('1. Add a header with key "Authorization"');
    console.log(`2. Set the value to "Bearer ${token}"`);
    console.log('\nToken Payload:');
    console.log(adminUser);
    console.log('\nExpires: In 1 day');
};
// Execute the function when the script is run directly
if (require.main === module) {
    generateAdminToken();
}
exports.default = generateAdminToken;
