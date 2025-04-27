import mongoose from 'mongoose';
import { Referral, IReferral } from '../models/Referral';
import { User } from '../models/User';
import { createNotification } from './notification-service';
import crypto from 'crypto';

/**
 * Generate a unique referral code for a user
 */
const generateReferralCode = async (userId: string): Promise<string> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Generate a code based on username and random string
  const username = user.name || user.email.split('@')[0];
  const randomString = crypto.randomBytes(3).toString('hex').toUpperCase();
  const code = `${username.substring(0, 5).toUpperCase()}-${randomString}`;
  
  // Ensure code is unique
  const existingCode = await Referral.findOne({ code });
  if (existingCode) {
    return generateReferralCode(userId); // Try again with a new code
  }
  
  return code;
};

/**
 * Create a new referral
 */
export const createReferral = async (
  referrerId: mongoose.Types.ObjectId | string,
  referredEmail: string
): Promise<IReferral> => {
  try {
    // Check if referred email already exists
    const existingUser = await User.findOne({ email: referredEmail });
    if (existingUser) {
      throw new Error('User is already registered');
    }
    
    // Check if referral already exists
    const existingReferral = await Referral.findOne({
      referrer: referrerId,
      referredEmail: referredEmail,
    });
    if (existingReferral) {
      throw new Error('Referral already exists for this email');
    }
    
    // Generate referral code
    const code = await generateReferralCode(referrerId.toString());
    
    // Create referral
    const referral = new Referral({
      referrer: referrerId,
      referredEmail,
      code,
      status: 'pending',
    });
    
    await referral.save();
    
    // Send notification to referrer
    await createNotification(
      referrerId,
      'Referral Created',
      `Your referral code for ${referredEmail} is ${code}`,
      'referral',
      {
        channels: ['email', 'in_app'],
        related: { type: 'referral', id: referral._id },
      }
    );
    
    return referral;
  } catch (error) {
    console.error('Error creating referral:', error);
    throw error;
  }
};

/**
 * Complete a referral when referred user signs up
 */
export const completeReferral = async (
  code: string,
  referredUserId: mongoose.Types.ObjectId | string
): Promise<IReferral> => {
  try {
    const referral = await Referral.findOne({ code });
    if (!referral) {
      throw new Error('Invalid referral code');
    }
    
    if (referral.status !== 'pending') {
      throw new Error('Referral is not pending');
    }
    
    // Update referral status
    referral.status = 'completed';
    referral.referredUser = referredUserId;
    referral.completedAt = new Date();
    await referral.save();
    
    // Send notification to referrer
    await createNotification(
      referral.referrer,
      'Referral Completed',
      'Your referral was successful! The bonus will be applied soon.',
      'referral',
      {
        channels: ['email', 'in_app'],
        related: { type: 'referral', id: referral._id },
      }
    );
    
    return referral;
  } catch (error) {
    console.error('Error completing referral:', error);
    throw error;
  }
};

/**
 * Apply bonus for completed referral
 */
export const applyReferralBonus = async (referralId: mongoose.Types.ObjectId | string): Promise<IReferral> => {
  try {
    const referral = await Referral.findById(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }
    
    if (referral.status !== 'completed') {
      throw new Error('Referral is not completed');
    }
    
    if (referral.bonusApplied) {
      throw new Error('Bonus already applied');
    }
    
    // Apply bonus logic here (e.g., add points, credits, etc.)
    // This will depend on your specific bonus system
    // For example:
    // await User.findByIdAndUpdate(referral.referrer, { $inc: { points: 1000 } });
    // await User.findByIdAndUpdate(referral.referredUser, { $inc: { points: 500 } });
    
    // Update referral
    referral.bonusApplied = true;
    referral.bonusAppliedAt = new Date();
    await referral.save();
    
    // Notify both users
    await createNotification(
      referral.referrer,
      'Referral Bonus Applied',
      'Your referral bonus has been credited to your account!',
      'referral',
      {
        channels: ['email', 'in_app'],
        related: { type: 'referral', id: referral._id },
      }
    );
    
    await createNotification(
      referral.referredUser!,
      'Welcome Bonus Applied',
      'Your signup bonus has been credited to your account!',
      'referral',
      {
        channels: ['email', 'in_app'],
        related: { type: 'referral', id: referral._id },
      }
    );
    
    return referral;
  } catch (error) {
    console.error('Error applying referral bonus:', error);
    throw error;
  }
};

/**
 * Get user's referrals
 */
export const getUserReferrals = async (
  userId: mongoose.Types.ObjectId | string,
  status?: 'pending' | 'completed',
  page = 1,
  limit = 20
): Promise<{
  referrals: IReferral[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}> => {
  try {
    const query: any = { referrer: userId };
    if (status) {
      query.status = status;
    }
    
    const totalCount = await Referral.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    
    const referrals = await Referral.find(query)
      .populate('referredUser', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return {
      referrals,
      totalCount,
      currentPage: page,
      totalPages,
    };
  } catch (error) {
    console.error('Error getting user referrals:', error);
    throw error;
  }
}; 