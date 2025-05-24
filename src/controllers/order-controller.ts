import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { awardPointsForOrder } from '../services/loyalty-service';

/**
 * Get all orders (admin only)
 */
export async function getAllOrders(req: Request, res: Response): Promise<void> {
  try {
    // Debug request information
    console.log('--- GET ALL ORDERS DEBUG ---');
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?._id);
    console.log('----------------------------');

    // Check if user is authenticated
    if (!req.user || !req.user?._id) {
      console.log('User not authenticated or missing ID');
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to view orders'
      });
      return;
    }

    // Check if user is admin
    if (req.user?.role !== 'admin') {
      console.log('Access denied - non-admin attempted to access all orders');
      res.status(403).json({ 
        status: 'error',
        message: 'Admin access required',
        error: 'Only administrators can view all orders'
      });
      return;
    }

    console.log('Fetching all orders (admin)');
    const orders = await Order.find()
      .populate('items.menuItem');
    
    console.log(`Found ${orders.length} orders`);
    
    res.json({
      status: 'success',
      message: `Retrieved ${orders.length} orders`,
      data: orders
    });
  } catch (error: any) {
    console.error('Error fetching all orders:', error);
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching orders',
      error: error.message
    });
  }
}

/**
 * Get user's own orders
 */
export async function getUserOrders(req: Request, res: Response): Promise<void> {
  try {
    // Debug request information
    console.log('--- GET USER ORDERS DEBUG ---');
    console.log('User ID:', req.user?._id);
    console.log('----------------------------');

    // Check if user is authenticated
    if (!req.user || !req.user?._id) {
      console.log('User not authenticated or missing ID');
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to view their orders'
      });
      return;
    }

    console.log(`Fetching orders for user: ${req.user?._id}`);
    const orders = await Order.find({ user: req.user?._id })
      .populate('items.menuItem');
    
    console.log(`Found ${orders.length} orders for user`);
    
    res.json({
      status: 'success',
      message: `Retrieved ${orders.length} orders`,
      data: orders
    });
  } catch (error: any) {
    console.error('Error fetching user orders:', error);
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching orders',
      error: error.message
    });
  }
}

/**
 * Legacy getOrders function for backward compatibility
 * Routes requests to the appropriate new function based on user role
 */
export async function getOrders(req: Request, res: Response): Promise<void> {
  if (req.user?.role === 'admin') {
    return getAllOrders(req, res);
  } else {
    return getUserOrders(req, res);
  }
}

/**
 * Get a specific order by ID
 */
export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    // Debug request information
    console.log('--- GET ORDER BY ID DEBUG ---');
    console.log('Order ID:', req.params.id);
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?._id);
    console.log('------------------------------');

    // Validate the order ID format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ 
        status: 'error',
        message: 'Invalid order ID format',
        error: 'Order ID must be a valid MongoDB ObjectId'
      });
      return;
    }

    // Check if user is authenticated
    if (!req.user || !req.user?._id) {
      console.log('User not authenticated or missing ID');
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to view order details'
      });
      return;
    }

    const order = await Order.findById(req.params.id)
      .populate('items.menuItem');
    
    if (!order) {
      console.log(`Order not found: ${req.params.id}`);
      res.status(404).json({ 
        status: 'error',
        message: 'Order not found',
        orderId: req.params.id
      });
      return;
    }

    // Verify user has access to this order
    if (req.user?.role !== 'admin' && order.user.toString() !== req.user?._id.toString()) {
      console.log('Access denied - user does not own this order');
      res.status(403).json({ 
        status: 'error',
        message: 'Not authorized',
        error: 'You do not have permission to access this order'
      });
      return;
    }

    console.log('Order found and returned successfully');
    res.json({
      status: 'success',
      message: 'Order retrieved successfully',
      data: order
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching order',
      error: error.message
    });
  }
}

/**
 * Create a new order
 */
export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    // Debug request information
    console.log('--- CREATE ORDER DEBUG ---');
    console.log('Request body:', req.body);
    console.log('--------------------------');

    // Check if user is authenticated
    if (!req.user || !req.user?._id) {
      console.log('User not authenticated or missing ID');
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to create an order'
      });
      return;
    }

    // Basic validation
    const { items, deliveryAddress, paymentMethod, specialInstructions, usePoints } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ 
        status: 'error',
        message: 'Invalid items data',
        error: 'Order must contain at least one item'
      });
      return;
    }

    if (!deliveryAddress || !paymentMethod) {
      res.status(400).json({ 
        status: 'error',
        message: 'Missing required fields',
        error: 'Delivery address and payment method are required'
      });
      return;
    }

    // Process and validate each item
    const processedItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
      // Basic item validation
      if (!item.menuItem || !item.quantity || !item.price) {
        res.status(400).json({ 
          status: 'error',
          message: 'Invalid item data',
          error: 'Each item must have menuItem, quantity, and price'
        });
        return;
      }

      const orderItem = {
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: item.price,
        specialInstructions: item.specialInstructions || '',
        isPackage: item.isPackage || false,
        packageItems: []
      };
      
      // If it's a package, include package items
      if (item.isPackage && item.packageItems && Array.isArray(item.packageItems)) {
        orderItem.packageItems = item.packageItems;
      }
      
      processedItems.push(orderItem);
      totalAmount += item.price * item.quantity;
    }

    // Apply loyalty points if requested
    if (usePoints && usePoints.points > 0) {
      // Check if user has enough points - implementation in loyalty service
      // This would be handled by another middleware or service
      // For now, just log that points would be used
      console.log(`User requested to use ${usePoints.points} loyalty points`);
    }

    // Create the order
    const order = new Order({
      user: req.user._id,
      items: processedItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      specialInstructions: specialInstructions || '',
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Save the order
    await order.save();
    
    // Award loyalty points for the order
    try {
      await awardPointsForOrder(req.user._id, order);
      console.log(`Awarded loyalty points for order ${order._id}`);
    } catch (pointsError) {
      console.error('Error awarding loyalty points:', pointsError);
      // Don't fail the order if points can't be awarded
    }
    
    // Store order data in res.locals for middleware access
    res.locals.orderData = order;
    
    // Return the created order
    console.log('Order created successfully');
    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: order
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    
    res.status(500).json({ 
      status: 'error',
      message: 'Error creating order',
      error: error.message
    });
  }
}

/**
 * Update order status (admin only)
 */
export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    // Debug request information
    console.log('--- UPDATE ORDER STATUS DEBUG ---');
    console.log('Order ID:', req.params.id);
    console.log('Requested status:', req.body.status);
    console.log('User role:', req.user?.role);
    console.log('-----------------------------------');

    // Check if user is admin
    if (req.user?.role !== 'admin') {
      console.log('Access denied - non-admin attempted to update order status');
      res.status(403).json({ 
        status: 'error',
        message: 'Admin access required',
        error: 'Only administrators can update order status'
      });
      return;
    }

    // Validate status value
    const allowedStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!req.body.status || !allowedStatuses.includes(req.body.status)) {
      res.status(400).json({ 
        status: 'error',
        message: 'Invalid status value',
        error: `Status must be one of: ${allowedStatuses.join(', ')}`
      });
      return;
    }

    // First get the current order
    const currentOrder = await Order.findById(req.params.id);
    if (!currentOrder) {
      res.status(404).json({ 
        status: 'error',
        message: 'Order not found',
        orderId: req.params.id
      });
      return;
    }

    // Check if order is already delivered
    if (currentOrder.status === 'delivered') {
      res.status(400).json({ 
        status: 'error',
        message: 'Cannot change status of delivered order',
        error: 'Orders that have been delivered cannot have their status changed'
      });
      return;
    }

    // Check if trying to revert from "ready" or "delivered" to earlier states
    const statusHierarchy: Record<string, number> = {
      'pending': 0,
      'confirmed': 1,
      'preparing': 2,
      'ready': 3,
      'delivered': 4,
      'cancelled': 99  // Special case, not in the normal flow
    };

    // Special case for cancelled status - can only cancel from pending or confirmed
    if (req.body.status === 'cancelled') {
      if (!['pending', 'confirmed'].includes(currentOrder.status)) {
        res.status(400).json({ 
          status: 'error',
          message: 'Cannot cancel order',
          error: 'Orders can only be cancelled when in pending or confirmed status'
        });
        return;
      }
    } 
    // Prevent reverting status for non-cancelled orders
    else if (
      statusHierarchy[currentOrder.status as keyof typeof statusHierarchy] >= statusHierarchy['ready'] && 
      statusHierarchy[req.body.status as keyof typeof statusHierarchy] < statusHierarchy[currentOrder.status as keyof typeof statusHierarchy]
    ) {
      res.status(400).json({ 
        status: 'error',
        message: 'Cannot revert order status',
        error: `Cannot change status from '${currentOrder.status}' to '${req.body.status}'. Orders in 'ready' or 'delivered' status cannot be reverted.`
      });
      return;
    }

    // Update the order status
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    console.log(`Order status updated to ${req.body.status}`);
    res.json({
      status: 'success',
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    
    res.status(400).json({ 
      status: 'error',
      message: 'Error updating order status',
      error: error.message
    });
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(req: Request, res: Response): Promise<void> {
  try {
    // Debug request information
    console.log('--- CANCEL ORDER DEBUG ---');
    console.log('Order ID:', req.params.id);
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?._id);
    console.log('---------------------------');

    // Check for authentication
    if (!req.user || !req.user?._id) {
      console.log('User not authenticated or missing ID');
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to cancel an order'
      });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log(`Order not found: ${req.params.id}`);
      res.status(404).json({ 
        status: 'error',
        message: 'Order not found',
        orderId: req.params.id
      });
      return;
    }

    // Check authorization - user can only cancel their own orders
    if (req.user?.role !== 'admin' && order.user.toString() !== req.user?._id.toString()) {
      console.log('Access denied - user does not own this order');
      res.status(403).json({ 
        status: 'error',
        message: 'Not authorized',
        error: 'You do not have permission to cancel this order'
      });
      return;
    }

    // Enhanced validation for order status
    if (order.status === 'cancelled') {
      res.status(400).json({ 
        status: 'error',
        message: 'Order already cancelled',
        error: 'This order has already been cancelled'
      });
      return;
    }

    // Validate order can be cancelled based on status
    if (!['pending', 'confirmed'].includes(order.status)) {
      res.status(400).json({ 
        status: 'error',
        message: 'Cannot cancel order',
        error: `Orders in '${order.status}' status cannot be cancelled. Only pending or confirmed orders can be cancelled.`
      });
      return;
    }

    order.status = 'cancelled';
    await order.save();
    
    console.log('Order cancelled successfully');
    
    res.json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    
    res.status(400).json({ 
      status: 'error',
      message: 'Error cancelling order',
      error: error.message
    });
  }
}

/**
 * Confirm order delivery (mark as received by user)
 */
export async function confirmDelivery(req: Request, res: Response): Promise<void> {
  try {
    // Debug request information
    console.log('--- CONFIRM DELIVERY DEBUG ---');
    console.log('Order ID:', req.params.id);
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?._id);
    console.log('Request body:', req.body);
    console.log('---------------------------');

    // Check for authentication
    if (!req.user || !req.user?._id) {
      console.log('User not authenticated or missing ID');
      res.status(401).json({ 
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to confirm order delivery'
      });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log(`Order not found: ${req.params.id}`);
      res.status(404).json({ 
        status: 'error',
        message: 'Order not found',
        orderId: req.params.id
      });
      return;
    }

    // Check authorization - user can only confirm their own orders
    if (req.user?.role !== 'admin' && order.user.toString() !== req.user?._id.toString()) {
      console.log('Access denied - user does not own this order');
      res.status(403).json({ 
        status: 'error',
        message: 'Not authorized',
        error: 'You do not have permission to confirm this order delivery'
      });
      return;
    }

    // Enhanced validation for order status
    if (order.status === 'delivered') {
      res.status(400).json({ 
        status: 'error',
        message: 'Order already delivered',
        error: 'This order has already been marked as delivered'
      });
      return;
    }

    if (order.status === 'cancelled') {
      res.status(400).json({ 
        status: 'error',
        message: 'Cannot confirm delivery of cancelled order',
        error: 'Cancelled orders cannot be marked as delivered'
      });
      return;
    }

    // Validate order can be marked as delivered based on status
    // Users can only confirm orders that are confirmed, ready, or out for delivery
    if (!['confirmed', 'ready', 'delivered'].includes(order.status)) {
      res.status(400).json({ 
        status: 'error',
        message: 'Cannot confirm delivery',
        error: `Orders in '${order.status}' status cannot be marked as delivered. Only confirmed, ready, or out for delivery orders can be marked as delivered.`
      });
      return;
    }

    // Extract feedback from request body if available
    const { feedback } = req.body;
    if (feedback) {
      console.log(`Received feedback for order ${req.params.id}:`, feedback);
      // Store feedback in a notes field or separate collection if needed
      // This is just logging it for now
    }

    // Just update the status to delivered, don't change paymentStatus
    order.status = 'delivered';
    await order.save();
    
    console.log('Order delivery confirmed successfully');
    
    res.json({
      status: 'success',
      message: 'Order delivery confirmed successfully',
      data: order
    });
  } catch (error: any) {
    console.error('Error confirming order delivery:', error);
    
    res.status(400).json({ 
      status: 'error',
      message: 'Error confirming order delivery',
      error: error.message
    });
  }
}

/**
 * Reorder a previous order (quick reorder)
 */
export async function reorderPreviousOrder(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user?._id) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        error: 'User must be logged in to reorder'
      });
      return;
    }

    // Get order ID from request
    const { orderId } = req.params;
    if (!orderId) {
      res.status(400).json({
        status: 'error',
        message: 'Order ID is required'
      });
      return;
    }

    // Find the original order
    const originalOrder = await Order.findById(orderId)
      .populate('items.menuItem');

    if (!originalOrder) {
      res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
      return;
    }

    // Verify user owns this order
    if (originalOrder.user.toString() !== req.user._id.toString()) {
      res.status(403).json({
        status: 'error',
        message: 'Not authorized',
        error: 'You do not have permission to reorder this order'
      });
      return;
    }

    // Create new order items, checking if items are still available
    const newItems = [];
    let totalAmount = 0;

    for (const item of originalOrder.items) {
      // Skip items that are no longer available
      if (!item.menuItem || !(item.menuItem as any).isAvailable) {
        continue;
      }

      newItems.push({
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: (item.menuItem as any).price, // Get current price
        specialInstructions: item.specialInstructions
      });

      totalAmount += (item.menuItem as any).price * item.quantity;
    }

    // If no valid items remain, return error
    if (newItems.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'No available items to reorder'
      });
      return;
    }

    // Get delivery address (either from request or from original order)
    const { deliveryAddress, paymentMethod, specialInstructions } = req.body;
    
    // Create the new order
    const newOrder = new Order({
      user: req.user._id,
      items: newItems,
      totalAmount,
      deliveryAddress: deliveryAddress || originalOrder.deliveryAddress,
      paymentMethod: paymentMethod || originalOrder.paymentMethod,
      specialInstructions: specialInstructions || originalOrder.specialInstructions,
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Save the new order
    await newOrder.save();
    
    // Award loyalty points for the order
    try {
      await awardPointsForOrder(req.user._id, newOrder);
    } catch (pointsError) {
      console.error('Error awarding loyalty points:', pointsError);
      // Don't fail the order if points can't be awarded
    }

    // Return the created order
    res.status(201).json({
      status: 'success',
      message: 'Reorder successful',
      data: newOrder
    });
  } catch (error: any) {
    console.error('Error reordering:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Error processing reorder',
      error: error.message
    });
  }
}

/**
 * Get order by Stripe session ID
 */
export async function getOrderBySessionId(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    console.log('Fetching order by session ID:', sessionId);
    
    if (!sessionId) {
      console.log('Missing sessionId parameter');
      res.status(400).json({ status: 'error', message: 'Missing sessionId' });
      return;
    }
    
    console.log('Looking for order with stripeSessionId:', sessionId);
    const order = await Order.findOne({ stripeSessionId: sessionId }).populate('items.menuItem');
    
    if (!order) {
      console.log('No order found with stripeSessionId:', sessionId);
      
      // For debugging: Check if any orders have stripeSessionId field
      const allOrders = await Order.find({ stripeSessionId: { $exists: true } });
      console.log('Orders with stripeSessionId field:', allOrders.length);
      if (allOrders.length > 0) {
        console.log('Sample stripeSessionId values:', allOrders.map(o => o.stripeSessionId));
      }
      
      // Fallback: Try to fetch the session from Stripe and create the order if webhook hasn't processed it yet
      try {
        console.log('Attempting to fetch session from Stripe as fallback');
        const stripe = require('../config/stripe').default;
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session && session.payment_status === 'paid') {
          console.log('Found paid session in Stripe, creating order as fallback');
          
          // Check if we have the necessary data in session metadata
          if (!session.metadata?.items) {
            console.error('Session metadata missing items');
            res.status(404).json({ status: 'error', message: 'Order not found and session metadata incomplete' });
            return;
          }
          
          try {
            // Parse metadata
            const items = JSON.parse(session.metadata.items);
            const deliveryAddress = JSON.parse(session.metadata.deliveryAddress);
            const paymentMethod = session.metadata.paymentMethod;
            const specialInstructions = session.metadata.specialInstructions;
            let userId;
            
            if (session.metadata.user) {
              const userData = JSON.parse(session.metadata.user);
              userId = userData._id;
            } else if (session.customer_details?.email) {
              // Try to find user by email if no user ID in metadata
              const User = require('../models/User').User;
              const user = await User.findOne({ email: session.customer_details.email });
              if (user) {
                userId = user._id;
              }
            }
            
            if (!userId) {
              // If we still can't determine the user, use the authenticated user
              if (req.user && req.user._id) {
                userId = req.user._id;
              } else {
                console.error('Could not determine user for order');
                res.status(404).json({ status: 'error', message: 'Order not found and user could not be determined' });
                return;
              }
            }
            
            // Create new order
            const newOrder = new Order({
              user: userId,
              items: items.map((item: any) => ({
                menuItem: item.menuItem,
                quantity: item.quantity,
                price: item.price,
                specialInstructions: item.specialInstructions || ''
              })),
              totalAmount: parseFloat(session.metadata.totalAmount),
              deliveryAddress,
              paymentMethod,
              specialInstructions,
              status: 'confirmed',
              paymentStatus: 'paid',
              stripePaymentId: session.payment_intent,
              stripeSessionId: session.id
            });
            
            await newOrder.save();
            console.log(`Created new order from session as fallback: ${newOrder._id}`);
            
            // Return the newly created order
            const populatedOrder = await Order.findById(newOrder._id).populate('items.menuItem');
            res.json({ status: 'success', data: populatedOrder });
            return;
          } catch (parseError) {
            console.error('Error parsing session metadata:', parseError);
          }
        } else {
          console.log('Session not paid or not found in Stripe');
        }
      } catch (stripeError) {
        console.error('Error fetching session from Stripe:', stripeError);
      }
      
      res.status(404).json({ status: 'error', message: 'Order not found' });
      return;
    }
    
    console.log('Found order with ID:', order._id);
    res.json({ status: 'success', data: order });
  } catch (error: any) {
    console.error('Error in getOrderBySessionId:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
} 