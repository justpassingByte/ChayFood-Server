import { Request, Response } from 'express';
import { Promotion } from '../models/Promotion';
import mongoose from 'mongoose';
import { notifyAllUsersAboutPromotion, notifyAboutFlashSale } from '../services/notification-service';

/**
 * Get all promotions with pagination and filters
 */
export async function getAllPromotions(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filter parameters
    const type = req.query.type as string;
    const isActive = req.query.isActive === 'true';
    const promotionType = req.query.promotionType as string;

    // Build query
    const query: any = {};
    if (type) query.type = type;
    if (req.query.isActive !== undefined) query.isActive = isActive;
    if (promotionType) query.promotionType = promotionType;

    // Get current date
    const now = new Date();
    
    // Active promotions filter
    if (req.query.status === 'active') {
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
      query.isActive = true;
    }
    
    // Upcoming promotions filter
    if (req.query.status === 'upcoming') {
      query.startDate = { $gt: now };
      query.isActive = true;
    }
    
    // Expired promotions filter
    if (req.query.status === 'expired') {
      query.endDate = { $lt: now };
    }

    // Find promotions with filters and pagination
    const promotions = await Promotion.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Promotion.countDocuments(query);
    
    res.json({
      status: 'success',
      message: `Retrieved ${promotions.length} promotions`,
      data: {
        promotions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasMore: skip + promotions.length < totalCount
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching promotions:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Error fetching promotions',
      error: error.message
    });
  }
}

/**
 * Get promotion by ID
 */
export async function getPromotionById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid promotion ID format'
      });
      return;
    }
    
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      res.status(404).json({
        status: 'error',
        message: 'Promotion not found'
      });
      return;
    }
    
    res.json({
      status: 'success',
      message: 'Promotion retrieved successfully',
      data: promotion
    });
  } catch (error: any) {
    console.error('Error fetching promotion:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Error fetching promotion',
      error: error.message
    });
  }
}

/**
 * Create a new promotion
 */
export async function createPromotion(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }
    
    const {
      name,
      description,
      code,
      type,
      value,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      totalCodes,
      isActive,
      promotionType
    } = req.body;
    
    // Validate code uniqueness
    const existingPromotion = await Promotion.findOne({ code });
    if (existingPromotion) {
      res.status(400).json({
        status: 'error',
        message: 'Promotion code already exists. Please use a unique code.'
      });
      return;
    }
    
    // Create promotion
    const promotion = new Promotion({
      name,
      description,
      code,
      type,
      value,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      totalCodes,
      usedCodes: 0,
      isActive: isActive || true,
      promotionType: promotionType || 'regular'
    });
    
    await promotion.save();
    
    // Send notification if promotion is active and immediate
    if (isActive && new Date(startDate) <= new Date()) {
      await notifyAllUsersAboutPromotion(
        `New Promotion: ${name}`,
        `${description}. Use code ${code} to get ${type === 'percentage' ? value + '%' : value + ' VND'} off your order.`,
        {
          related: { type: 'promotion', id: promotion._id }
        }
      );
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Promotion created successfully',
      data: promotion
    });
  } catch (error: any) {
    console.error('Error creating promotion:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Error creating promotion',
      error: error.message
    });
  }
}

/**
 * Create a flash sale
 */
export async function createFlashSale(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }
    
    const {
      name,
      description,
      code,
      type,
      value,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      totalCodes,
      isActive,
      shouldNotify
    } = req.body;
    
    // Validate code uniqueness
    const existingPromotion = await Promotion.findOne({ code });
    if (existingPromotion) {
      res.status(400).json({
        status: 'error',
        message: 'Promotion code already exists. Please use a unique code.'
      });
      return;
    }
    
    // Create flash sale
    const flashSale = new Promotion({
      name,
      description,
      code,
      type,
      value,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      totalCodes,
      usedCodes: 0,
      isActive: isActive || true,
      promotionType: 'flash_sale'
    });
    
    await flashSale.save();
    
    // Send notification immediately if specified
    if (shouldNotify) {
      await notifyAboutFlashSale(
        `Flash Sale: ${name}`,
        `${description}. Use code ${code} to get ${type === 'percentage' ? value + '%' : value + ' VND'} off your order.`,
        flashSale._id,
        new Date(startDate),
        new Date(endDate)
      );
      
      // Mark as notified
      flashSale.notificationSent = true;
      await flashSale.save();
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Flash sale created successfully',
      data: flashSale
    });
  } catch (error: any) {
    console.error('Error creating flash sale:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Error creating flash sale',
      error: error.message
    });
  }
}

/**
 * Update a promotion
 */
export async function updatePromotion(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }
    
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid promotion ID format'
      });
      return;
    }
    
    const {
      name,
      description,
      code,
      type,
      value,
      minOrderValue,
      maxDiscount,
      startDate,
      endDate,
      totalCodes,
      isActive,
      promotionType
    } = req.body;
    
    // Check if promotion exists
    const existingPromotion = await Promotion.findById(id);
    if (!existingPromotion) {
      res.status(404).json({
        status: 'error',
        message: 'Promotion not found'
      });
      return;
    }
    
    // If code is changing, validate uniqueness
    if (code && code !== existingPromotion.code) {
      const codeExists = await Promotion.findOne({ code, _id: { $ne: id } });
      if (codeExists) {
        res.status(400).json({
          status: 'error',
          message: 'Promotion code already exists. Please use a unique code.'
        });
        return;
      }
    }
    
    // Update promotion
    const updatedPromotion = await Promotion.findByIdAndUpdate(
      id,
      {
        name,
        description,
        code,
        type,
        value,
        minOrderValue,
        maxDiscount,
        startDate,
        endDate,
        totalCodes,
        isActive,
        promotionType
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedPromotion) {
      res.status(404).json({
        status: 'error',
        message: 'Promotion not found'
      });
      return;
    }
    
    res.json({
      status: 'success',
      message: 'Promotion updated successfully',
      data: updatedPromotion
    });
  } catch (error: any) {
    console.error('Error updating promotion:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Error updating promotion',
      error: error.message
    });
  }
}

/**
 * Delete a promotion
 */
export async function deletePromotion(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }
    
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid promotion ID format'
      });
      return;
    }
    
    const deletedPromotion = await Promotion.findByIdAndDelete(id);
    
    if (!deletedPromotion) {
      res.status(404).json({
        status: 'error',
        message: 'Promotion not found'
      });
      return;
    }
    
    res.json({
      status: 'success',
      message: 'Promotion deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting promotion:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Error deleting promotion',
      error: error.message
    });
  }
}

/**
 * Get active flash sales
 */
export async function getActiveFlashSales(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    
    const flashSales = await Promotion.find({
      promotionType: 'flash_sale',
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    res.json({
      status: 'success',
      message: `Retrieved ${flashSales.length} active flash sales`,
      data: flashSales
    });
  } catch (error: any) {
    console.error('Error fetching active flash sales:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Error fetching active flash sales',
      error: error.message
    });
  }
}

/**
 * Get promotion usage statistics
 */
export async function getPromotionStats(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }
    
    const { id } = req.params;
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid promotion ID format'
      });
      return;
    }
    
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      res.status(404).json({
        status: 'error',
        message: 'Promotion not found'
      });
      return;
    }
    
    // Calculate statistics
    const stats = {
      totalCodes: promotion.totalCodes,
      usedCodes: promotion.usedCodes,
      remainingCodes: promotion.totalCodes - promotion.usedCodes,
      usagePercentage: ((promotion.usedCodes / promotion.totalCodes) * 100).toFixed(2) + '%',
      isActive: promotion.isActive,
      isExpired: new Date() > new Date(promotion.endDate),
      daysRemaining: Math.max(0, Math.ceil((new Date(promotion.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    };
    
    res.json({
      status: 'success',
      message: 'Promotion statistics retrieved successfully',
      data: {
        promotion,
        stats
      }
    });
  } catch (error: any) {
    console.error('Error getting promotion statistics:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Error getting promotion statistics',
      error: error.message
    });
  }
} 