import { Request, Response } from 'express';
import { User } from '../models/User';
import mongoose from 'mongoose';

/**
 * Get user profile
 */
export async function getUserProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const user = await User.findById(req.user._id)
      .select('name email phone addresses dietaryPreferences picture');

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'User profile retrieved successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting user profile',
      error: error.message
    });
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const { name, phone, dietaryPreferences } = req.body;
    const updateData: Record<string, any> = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (dietaryPreferences) updateData.dietaryPreferences = dietaryPreferences;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('name email phone dietaryPreferences picture');

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'User profile updated successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user profile',
      error: error.message
    });
  }
}

/**
 * Get user addresses
 */
export async function getUserAddresses(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const user = await User.findById(req.user._id)
      .select('addresses');

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'User addresses retrieved successfully',
      data: user.addresses || []
    });
  } catch (error: any) {
    console.error('Error getting user addresses:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting user addresses',
      error: error.message
    });
  }
}

/**
 * Add a new delivery address
 */
export async function addUserAddress(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const { name, street, city, state, postalCode, additionalInfo, isDefault } = req.body;

    // Validate required fields
    if (!name || !street || !city || !state || !postalCode) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required address fields'
      });
      return;
    }

    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      name,
      street,
      city,
      state,
      postalCode,
      additionalInfo: additionalInfo || '',
      isDefault: isDefault || false
    };

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // If this is the first address or isDefault is true, unset default for all other addresses
    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      newAddress.isDefault = true;
    }

    // Add new address
    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      status: 'success',
      message: 'Address added successfully',
      data: newAddress
    });
  } catch (error: any) {
    console.error('Error adding user address:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error adding user address',
      error: error.message
    });
  }
}

/**
 * Update an existing delivery address
 */
export async function updateUserAddress(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const { addressId } = req.params;
    const { name, street, city, state, postalCode, additionalInfo, isDefault } = req.body;

    if (!addressId) {
      res.status(400).json({
        status: 'error',
        message: 'Address ID is required'
      });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.addresses) {
      res.status(404).json({
        status: 'error',
        message: 'User or addresses not found'
      });
      return;
    }

    // Find the address to update
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
      return;
    }

    // Update address fields
    const updatedAddress = user.addresses[addressIndex];
    if (name) updatedAddress.name = name;
    if (street) updatedAddress.street = street;
    if (city) updatedAddress.city = city;
    if (state) updatedAddress.state = state;
    if (postalCode) updatedAddress.postalCode = postalCode;
    if (additionalInfo !== undefined) updatedAddress.additionalInfo = additionalInfo;

    // Handle default address
    if (isDefault) {
      // Unset default for all other addresses
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      updatedAddress.isDefault = true;
    }

    // Save changes
    await user.save();

    res.json({
      status: 'success',
      message: 'Address updated successfully',
      data: updatedAddress
    });
  } catch (error: any) {
    console.error('Error updating user address:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user address',
      error: error.message
    });
  }
}

/**
 * Delete a delivery address
 */
export async function deleteUserAddress(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const { addressId } = req.params;

    if (!addressId) {
      res.status(400).json({
        status: 'error',
        message: 'Address ID is required'
      });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.addresses) {
      res.status(404).json({
        status: 'error',
        message: 'User or addresses not found'
      });
      return;
    }

    // Find the address index
    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
      return;
    }

    // Check if this is the default address
    const isDefault = user.addresses[addressIndex].isDefault;

    // Remove the address
    user.addresses.splice(addressIndex, 1);

    // If the deleted address was the default and other addresses exist, make the first one default
    if (isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      status: 'success',
      message: 'Address deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user address:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user address',
      error: error.message
    });
  }
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user._id) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const { addressId } = req.params;

    if (!addressId) {
      res.status(400).json({
        status: 'error',
        message: 'Address ID is required'
      });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.addresses) {
      res.status(404).json({
        status: 'error',
        message: 'User or addresses not found'
      });
      return;
    }

    // Check if the address exists
    const addressExists = user.addresses.some(addr => addr._id.toString() === addressId);

    if (!addressExists) {
      res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
      return;
    }

    // Update all addresses (set isDefault to false)
    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    res.json({
      status: 'success',
      message: 'Default address updated successfully'
    });
  } catch (error: any) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error setting default address',
      error: error.message
    });
  }
} 