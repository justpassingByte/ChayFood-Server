import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { User } from '../models/User';

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
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user?._id);
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
    const { items, deliveryAddress, paymentMethod, specialInstructions } = req.body;
    
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