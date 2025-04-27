import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getUserLoyaltyPoints, 
  usePointsForDiscount 
} from '../services/loyalty-service';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * Get user's loyalty points
 */
router.get('/points', authenticateToken, async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const pointsData = await getUserLoyaltyPoints(req.user._id);
    
    res.json({
      status: 'success',
      message: 'Loyalty points retrieved successfully',
      data: pointsData
    });
  } catch (error: any) {
    console.error('Error getting loyalty points:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting loyalty points',
      error: error.message
    });
  }
});

/**
 * Use points for a discount
 */
router.post('/redeem', authenticateToken, async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const { points, orderId } = req.body;
    
    if (!points || isNaN(points) || points <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid points amount required'
      });
    }

    // Convert string orderId to ObjectId if provided
    let orderObjectId: mongoose.Types.ObjectId | undefined;
    if (orderId) {
      orderObjectId = new mongoose.Types.ObjectId(orderId);
    }

    const success = await usePointsForDiscount(
      req.user._id, 
      points, 
      orderObjectId
    );
    
    if (!success) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient points or invalid redemption'
      });
    }

    res.json({
      status: 'success',
      message: `Successfully redeemed ${points} points`,
      data: { pointsRedeemed: points }
    });
  } catch (error: any) {
    console.error('Error redeeming points:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error redeeming points',
      error: error.message
    });
  }
});

export default router; 