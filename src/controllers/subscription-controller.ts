import { Request, Response } from 'express';
import { Subscription } from '../models/Subscription';
import { Plan } from '../models/Plan';
import { MenuItem } from '../models/MenuItem';

/**
 * Get available subscription plans
 */
export async function getAvailablePlans(req: Request, res: Response): Promise<void> {
  try {
    const plans = await Plan.find({ isActive: true });
    
    res.json({
      status: 'success',
      message: 'Retrieved available subscription plans',
      data: plans
    });
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching subscription plans',
      error: error.message
    });
  }
}

/**
 * Subscribe to a meal plan
 */
export async function createSubscription(req: Request, res: Response): Promise<void> {
  try {
    // Debug request information
    console.log('--- CREATE SUBSCRIPTION DEBUG ---');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user?._id);
    console.log('----------------------------');

    // Check if user is authenticated
    if (!req.user || !req.user?._id) {
      console.log('User not authenticated or missing ID');
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to create a subscription'
      });
      return;
    }

    // Basic validation
    const { planId, startDate, deliveryAddress, paymentMethod, selectedMenuItems, specialInstructions } = req.body;
    
    if (!planId || !startDate || !deliveryAddress || !paymentMethod) {
      res.status(400).json({ 
        status: 'error',
        message: 'Missing required fields',
        error: 'Plan ID, start date, delivery address and payment method are required'
      });
      return;
    }

    // Get the plan to validate it exists and calculate end date
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({ 
        status: 'error',
        message: 'Plan not found',
        error: 'The specified plan does not exist'
      });
      return;
    }
    
    // Calculate end date based on plan duration
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + plan.duration);

    // Create the subscription
    const subscription = new Subscription({
      user: req.user._id,
      plan: planId,
      startDate: start,
      endDate: end,
      deliveryAddress,
      paymentMethod,
      selectedMenuItems: selectedMenuItems || [],
      totalAmount: plan.price,
      specialInstructions: specialInstructions || '',
      isActive: true,
      paymentStatus: 'pending'
    });

    // Save the subscription
    await subscription.save();
    
    // Return the created subscription
    res.status(201).json({
      status: 'success',
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error creating subscription',
      error: error.message
    });
  }
}

/**
 * Get user's subscriptions
 */
export async function getUserSubscriptions(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user?._id) {
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to view subscriptions'
      });
      return;
    }

    const subscriptions = await Subscription.find({ 
      user: req.user._id 
    }).populate('plan').sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      message: `Retrieved ${subscriptions.length} subscriptions`,
      data: subscriptions
    });
  } catch (error: any) {
    console.error('Error fetching user subscriptions:', error);
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user?._id) {
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to view subscription details'
      });
      return;
    }

    const subscription = await Subscription.findById(req.params.id)
      .populate('plan')
      .populate('selectedMenuItems.menuItemId');
    
    if (!subscription) {
      res.status(404).json({ 
        status: 'error',
        message: 'Subscription not found'
      });
      return;
    }

    // Verify user has access to this subscription
    if (req.user?.role !== 'admin' && subscription.user.toString() !== req.user?._id.toString()) {
      res.status(403).json({ 
        status: 'error',
        message: 'Not authorized',
        error: 'You do not have permission to access this subscription'
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'Subscription retrieved successfully',
      data: subscription
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching subscription',
      error: error.message
    });
  }
}

/**
 * Update subscription menu selections
 */
export async function updateMenuSelections(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user?._id) {
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to update menu selections'
      });
      return;
    }

    const { selectedMenuItems } = req.body;
    
    if (!selectedMenuItems || !Array.isArray(selectedMenuItems)) {
      res.status(400).json({ 
        status: 'error',
        message: 'Invalid menu selections',
        error: 'Selected menu items must be an array'
      });
      return;
    }

    // Get the subscription
    const subscription = await Subscription.findById(req.params.id).populate('plan');
    
    if (!subscription) {
      res.status(404).json({ 
        status: 'error',
        message: 'Subscription not found'
      });
      return;
    }

    // Verify user has access to this subscription
    if (req.user?.role !== 'admin' && subscription.user.toString() !== req.user?._id.toString()) {
      res.status(403).json({ 
        status: 'error',
        message: 'Not authorized',
        error: 'You do not have permission to modify this subscription'
      });
      return;
    }

    // Get the plan details for validation
    const plan = subscription.plan as any;
    
    // Count meals and snacks by day
    const mealsByDay: Record<number, { meals: number, snacks: number }> = {};
    for (let i = 0; i < 7; i++) {
      mealsByDay[i] = { meals: 0, snacks: 0 };
    }
    
    for (const item of selectedMenuItems) {
      if (!item.dayOfWeek && item.dayOfWeek !== 0) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid menu selection',
          error: 'Each item must have a dayOfWeek (0-6)'
        });
        return;
      }
      
      if (!item.mealType) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid menu selection',
          error: 'Each item must have a mealType (breakfast, lunch, dinner, snack)'
        });
        return;
      }
      
      // Increment the appropriate counter
      if (item.mealType === 'snack') {
        mealsByDay[item.dayOfWeek].snacks += item.quantity || 1;
      } else {
        mealsByDay[item.dayOfWeek].meals += item.quantity || 1;
      }
    }
    
    // Validate against plan limits
    for (let day = 0; day < 7; day++) {
      if (mealsByDay[day].meals > plan.mealsPerDay) {
        res.status(400).json({
          status: 'error',
          message: 'Plan limit exceeded',
          error: `Day ${day} has ${mealsByDay[day].meals} meals, but your plan allows only ${plan.mealsPerDay} meals per day`
        });
        return;
      }
      
      if (mealsByDay[day].snacks > plan.snacksPerDay) {
        res.status(400).json({
          status: 'error',
          message: 'Plan limit exceeded',
          error: `Day ${day} has ${mealsByDay[day].snacks} snacks, but your plan allows only ${plan.snacksPerDay} snacks per day`
        });
        return;
      }
    }

    // Update the subscription
    subscription.selectedMenuItems = selectedMenuItems;
    await subscription.save();
    
    res.json({
      status: 'success',
      message: 'Menu selections updated successfully',
      data: subscription
    });
  } catch (error: any) {
    console.error('Error updating menu selections:', error);
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error updating menu selections',
      error: error.message
    });
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user?._id) {
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to cancel subscription'
      });
      return;
    }

    // Get the subscription
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      res.status(404).json({ 
        status: 'error',
        message: 'Subscription not found'
      });
      return;
    }

    // Verify user has access to this subscription
    if (req.user?.role !== 'admin' && subscription.user.toString() !== req.user?._id.toString()) {
      res.status(403).json({ 
        status: 'error',
        message: 'Not authorized',
        error: 'You do not have permission to cancel this subscription'
      });
      return;
    }

    // Update subscription status
    subscription.isActive = false;
    await subscription.save();
    
    res.json({
      status: 'success',
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
} 