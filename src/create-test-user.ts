/**
 * Create a test user for notification testing
 * 
 * This script creates a test user in the database that can be used
 * for notification system testing
 */

import mongoose from 'mongoose';
import { User } from './models/User';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chayfood')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Helper function to hash password
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists with ID:', existingUser._id);
      return existingUser;
    }

    console.log('Creating new test user...');
    
    // Create a test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      phone: '0901234567',
      password: hashPassword('test12345'), // In production, use a proper bcrypt/argon2 hash
      googleId: 'test_google_id',
      picture: 'https://example.com/profile.jpg',
      addresses: [{
        name: 'Home',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        isDefault: true
      }],
      dietaryPreferences: ['vegetarian']
    });

    await testUser.save();
    console.log('Test user created successfully with ID:', testUser._id);
    return testUser;
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createTestUser(); 