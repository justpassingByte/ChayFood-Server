import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { MenuItem } from '../models/MenuItem';
import mongoose from 'mongoose';

// Helper function to parse date range based on timeRange parameter
const getDateRange = (timeRange: string, startDate?: string, endDate?: string) => {
  const now = new Date();
  
  // If custom date range is provided
  if (timeRange === 'custom' && startDate && endDate) {
    try {
      console.log('Using custom date range:', { startDate, endDate });
      
      // Parse dates and validate them
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid date format provided for custom range, using fallback');
        // Fallback to last 7 days
        const fallbackStart = new Date(now);
        fallbackStart.setDate(fallbackStart.getDate() - 7);
        return { start: fallbackStart, end: now };
      }
      
      // Ensure end date is not in the future
      if (end > now) {
        console.log('End date is in the future, adjusting to current time');
        return { start, end: now };
      }
      
      return { start, end };
    } catch (error) {
      console.error('Error parsing custom date range:', error);
      // Fallback to last 7 days on error
      const fallbackStart = new Date(now);
      fallbackStart.setDate(fallbackStart.getDate() - 7);
      return { start: fallbackStart, end: now };
    }
  }
  
  // Default date ranges
  const start = new Date(now);
  
  console.log('Using predefined date range for:', timeRange);
  
  switch (timeRange) {
    case 'day':
      // Today (last 24 hours)
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    
    case 'week':
      // This week
      start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    
    case 'month':
      // This month
      start.setDate(1); // First day of month
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    
    case 'quarter':
      // This quarter
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(quarterMonth, 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    
    case 'year':
      // This year
      start.setMonth(0, 1); // January 1st
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    
    default:
      // Default to last 30 days if invalid timeRange
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
  }
};

// Helper to get previous period date range (for comparison)
const getPreviousPeriodRange = (currentStart: Date, currentEnd: Date) => {
  const duration = currentEnd.getTime() - currentStart.getTime();
  const prevEnd = new Date(currentStart.getTime());
  const prevStart = new Date(prevEnd.getTime() - duration);
  
  return { start: prevStart, end: prevEnd };
};

// Get region from address
const getRegionFromAddress = (state: string): string => {
  // Simplified Vietnamese regions
  const northRegions = [
    'Hà Nội', 'Hải Phòng', 'Bắc Ninh', 'Hà Nam', 'Ninh Bình', 'Nam Định',
    'Thái Bình', 'Vĩnh Phúc', 'Hải Dương', 'Hưng Yên', 'Bắc Giang', 'Phú Thọ',
    'Thái Nguyên', 'Tuyên Quang', 'Lạng Sơn', 'Cao Bằng', 'Bắc Kạn', 'Lào Cai',
    'Yên Bái', 'Điện Biên', 'Lai Châu', 'Sơn La', 'Hòa Bình', 'Hà Giang', 'Quảng Ninh'
  ];
  
  const centralRegions = [
    'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế',
    'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa',
    'Ninh Thuận', 'Bình Thuận', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng'
  ];
  
  const southRegions = [
    'Hồ Chí Minh', 'Bà Rịa - Vũng Tàu', 'Bình Dương', 'Bình Phước', 'Đồng Nai', 'Tây Ninh',
    'Long An', 'Đồng Tháp', 'Tiền Giang', 'An Giang', 'Bến Tre', 'Vĩnh Long', 'Trà Vinh',
    'Hậu Giang', 'Kiên Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau', 'Cần Thơ'
  ];
  
  if (northRegions.some(r => state.includes(r))) return 'North';
  if (centralRegions.some(r => state.includes(r))) return 'Central';
  if (southRegions.some(r => state.includes(r))) return 'South';
  
  return 'Other';
};

// ======================= CONTROLLER FUNCTIONS =======================

/**
 * Get order statistics
 */
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters
    const { timeRange = 'month', region, category } = req.query;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // Get date range based on timeRange
    const { start, end } = getDateRange(timeRange as string, startDate, endDate);
    
    // Get previous period for comparison
    const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(start, end);
    
    // Base query for orders in current period
    let query: any = {
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' } // Exclude cancelled orders from total count
    };
    
    // Base query for orders in previous period
    let prevQuery: any = {
      createdAt: { $gte: prevStart, $lte: prevEnd },
      status: { $ne: 'cancelled' }
    };
    
    // Additional filters
    if (region && region !== 'all') {
      // For region filtering, we need to get orders from users in that region
      const usersInRegion = await User.find({
        'addresses.state': { $regex: new RegExp(region as string, 'i') }
      }).select('_id');
      
      const userIds = usersInRegion.map(user => user._id);
      query.user = { $in: userIds };
      prevQuery.user = { $in: userIds };
    }
    
    if (category && category !== 'all') {
      // For category filtering, we need to get menu items in that category
      const menuItemsInCategory = await MenuItem.find({
        category: category as string
      }).select('_id');
      
      const menuItemIds = menuItemsInCategory.map(item => item._id);
      query['items.menuItem'] = { $in: menuItemIds };
      prevQuery['items.menuItem'] = { $in: menuItemIds };
    }
    
    // Execute the queries
    const [currentOrders, previousOrders, cancelledOrders] = await Promise.all([
      Order.find({ ...query }).exec(),
      Order.find({ ...prevQuery }).exec(),
      Order.find({ 
        createdAt: { $gte: start, $lte: end },
        status: 'cancelled'
      }).exec()
    ]);
    
    // Calculate statistics
    const totalOrders = currentOrders.length;
    const totalRevenue = currentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = currentOrders.filter(o => 
      ['delivered', 'ready'].includes(o.status)).length;
    const cancelledOrdersCount = cancelledOrders.length;
    
    // Previous period statistics for comparison
    const prevTotalOrders = previousOrders.length;
    const prevTotalRevenue = previousOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const prevAverageOrderValue = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;
    
    // Calculate percentage changes
    const orderChange = prevTotalOrders > 0 
      ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 
      : 0;
    
    const revenueChange = prevTotalRevenue > 0 
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 
      : 0;
    
    const aovChange = prevAverageOrderValue > 0 
      ? ((averageOrderValue - prevAverageOrderValue) / prevAverageOrderValue) * 100 
      : 0;
    
    return res.json({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      completedOrders,
      cancelledOrders: cancelledOrdersCount,
      percentChange: {
        orders: parseFloat(orderChange.toFixed(1)),
        revenue: parseFloat(revenueChange.toFixed(1)),
        aov: parseFloat(aovChange.toFixed(1))
      }
    });
    
  } catch (error) {
    console.error('Error getting order statistics:', error);
    return res.status(500).json({
      message: 'Failed to get order statistics'
    });
  }
};

/**
 * Get customer statistics
 */
export const getCustomerStats = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters
    const { timeRange = 'month', region } = req.query;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // Get date range based on timeRange
    const { start, end } = getDateRange(timeRange as string, startDate, endDate);
    
    // Get previous period for comparison
    const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(start, end);
    
    // Base query for users
    let regionQuery = {};
    if (region && region !== 'all') {
      regionQuery = {
        'addresses.state': { $regex: new RegExp(region as string, 'i') }
      };
    }
    
    // Get all users that match region filter
    const allUsers = await User.find(regionQuery).select('_id createdAt');
    
    // Get users created in current period (new users)
    const newUsers = allUsers.filter(user => 
      user.createdAt >= start && user.createdAt <= end
    );
    
    // Get users created in previous period
    const prevNewUsers = allUsers.filter(user => 
      user.createdAt >= prevStart && user.createdAt <= prevEnd
    );
    
    // Find users who placed orders in current period
    const ordersInPeriod = await Order.find({
      createdAt: { $gte: start, $lte: end }
    }).select('user').distinct('user');
    
    // Find users who placed orders in previous period
    const ordersInPrevPeriod = await Order.find({
      createdAt: { $gte: prevStart, $lte: prevEnd }
    }).select('user').distinct('user');
    
    // Calculate repeat customers (users who ordered before current period and during current period)
    const activeUserIdsInPeriod = ordersInPeriod.map(id => id.toString());
    
    const repeatCustomers = activeUserIdsInPeriod.filter(userId => {
      const user = allUsers.find(u => u._id.toString() === userId);
      return user && user.createdAt < start;
    }).length;
    
    // Calculate repeat customers in previous period for comparison
    const activeUserIdsInPrevPeriod = ordersInPrevPeriod.map(id => id.toString());
    
    const prevRepeatCustomers = activeUserIdsInPrevPeriod.filter(userId => {
      const user = allUsers.find(u => u._id.toString() === userId);
      return user && user.createdAt < prevStart;
    }).length;
    
    // Calculate total active customers in each period
    const totalCustomers = activeUserIdsInPeriod.length;
    const prevTotalCustomers = activeUserIdsInPrevPeriod.length;
    
    // Calculate percentage changes
    const totalChange = prevTotalCustomers > 0 
      ? ((totalCustomers - prevTotalCustomers) / prevTotalCustomers) * 100 
      : 0;
    
    const newChange = prevNewUsers.length > 0 
      ? ((newUsers.length - prevNewUsers.length) / prevNewUsers.length) * 100 
      : 0;
    
    const repeatChange = prevRepeatCustomers > 0 
      ? ((repeatCustomers - prevRepeatCustomers) / prevRepeatCustomers) * 100 
      : 0;
    
    return res.json({
      totalCustomers,
      newCustomers: newUsers.length,
      repeatCustomers,
      percentChange: {
        total: parseFloat(totalChange.toFixed(1)),
        new: parseFloat(newChange.toFixed(1)),
        repeat: parseFloat(repeatChange.toFixed(1))
      }
    });
    
  } catch (error) {
    console.error('Error getting customer statistics:', error);
    return res.status(500).json({
      message: 'Failed to get customer statistics'
    });
  }
};

/**
 * Get popular dishes
 */
export const getPopularDishes = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters
    const { timeRange = 'month', region, category } = req.query;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // Get date range based on timeRange
    const { start, end } = getDateRange(timeRange as string, startDate, endDate);
    
    // Base query for orders
    let orderQuery: any = {
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' } // Exclude cancelled orders
    };
    
    // Apply region filter if specified
    if (region && region !== 'all') {
      // Get users from the specified region
      const usersInRegion = await User.find({
        'addresses.state': { $regex: new RegExp(region as string, 'i') }
      }).select('_id');
      
      const userIds = usersInRegion.map(user => user._id);
      orderQuery.user = { $in: userIds };
    }
    
    // Apply category filter at the menu item level
    let menuItemQuery = {};
    if (category && category !== 'all') {
      menuItemQuery = { category: category as string };
    }
    
    // Get all menu items
    const menuItems = await MenuItem.find(menuItemQuery).select('_id name price category');
    const menuItemMap = new Map(menuItems.map(item => [item._id.toString(), item]));
    
    // Get orders that match the query
    const orders = await Order.find(orderQuery)
      .populate('items.menuItem', 'name price')
      .select('items totalAmount');
    
    // Calculate popularity of dishes
    const dishPopularity: { [key: string]: { count: number, revenue: number, name: string } } = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const menuItemId = item.menuItem instanceof mongoose.Types.ObjectId 
          ? item.menuItem.toString()
          : (item.menuItem as any)._id.toString();
        
        const menuItem = menuItemMap.get(menuItemId);
        if (!menuItem) return; // Skip if menu item not found
        
        if (!dishPopularity[menuItemId]) {
          dishPopularity[menuItemId] = {
            count: 0,
            revenue: 0,
            name: (item.menuItem as any).name || menuItem.name
          };
        }
        
        dishPopularity[menuItemId].count += item.quantity;
        dishPopularity[menuItemId].revenue += item.price * item.quantity;
      });
    });
    
    // Convert to array and sort by count (most popular first)
    const popularDishes = Object.entries(dishPopularity).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count,
      revenue: data.revenue
    })).sort((a, b) => b.count - a.count);
    
    return res.json(popularDishes);
    
  } catch (error) {
    console.error('Error getting popular dishes:', error);
    return res.status(500).json({
      message: 'Failed to get popular dishes'
    });
  }
};

/**
 * Get order trends
 */
export const getOrderTrends = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters
    const { timeRange = 'month', region, category } = req.query;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // Get date range based on timeRange
    const { start, end } = getDateRange(timeRange as string, startDate, endDate);
    
    // Base query for orders
    let orderQuery: any = {
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' } // Exclude cancelled orders
    };
    
    // Apply region filter if specified
    if (region && region !== 'all') {
      // Get users from the specified region
      const usersInRegion = await User.find({
        'addresses.state': { $regex: new RegExp(region as string, 'i') }
      }).select('_id');
      
      const userIds = usersInRegion.map(user => user._id);
      orderQuery.user = { $in: userIds };
    }
    
    // Apply category filter if specified
    if (category && category !== 'all') {
      // Get menu items in the specified category
      const menuItemsInCategory = await MenuItem.find({
        category: category as string
      }).select('_id');
      
      const menuItemIds = menuItemsInCategory.map(item => item._id);
      orderQuery['items.menuItem'] = { $in: menuItemIds };
    }
    
    // Get orders that match the query
    const orders = await Order.find(orderQuery)
      .select('createdAt totalAmount')
      .sort('createdAt');
    
    // Determine the grouping interval based on timeRange
    let interval: 'day' | 'week' | 'month';
    
    if (timeRange === 'day') {
      interval = 'day'; // Group by hour, but simplified to day
    } else if (['week', 'month'].includes(timeRange as string)) {
      interval = 'day'; // Group by day
    } else {
      interval = 'week'; // Group by week for quarter and year
    }
    
    // Group orders by date interval
    const trendsMap = new Map<string, { orders: number, revenue: number }>();
    
    // Create date entries for all intervals in the range
    let current = new Date(start);
    
    while (current <= end) {
      const dateKey = current.toISOString().split('T')[0]; // YYYY-MM-DD
      trendsMap.set(dateKey, { orders: 0, revenue: 0 });
      
      // Increment date based on interval
      if (interval === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (interval === 'week') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    // Populate with actual data
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      
      if (trendsMap.has(dateKey)) {
        const data = trendsMap.get(dateKey)!;
        data.orders += 1;
        data.revenue += order.totalAmount;
      }
    });
    
    // Convert map to array
    const trends = Array.from(trendsMap.entries()).map(([date, data]) => ({
      date,
      orders: data.orders,
      revenue: data.revenue
    }));
    
    return res.json(trends);
    
  } catch (error) {
    console.error('Error getting order trends:', error);
    return res.status(500).json({
      message: 'Failed to get order trends'
    });
  }
};

/**
 * Get regional orders
 */
export const getRegionalOrders = async (req: Request, res: Response) => {
  try {
    // Extract filter parameters
    const { timeRange = 'month', category } = req.query;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // Get date range based on timeRange
    const { start, end } = getDateRange(timeRange as string, startDate, endDate);
    
    // Base query for orders
    let orderQuery: any = {
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' } // Exclude cancelled orders
    };
    
    // Apply category filter if specified
    if (category && category !== 'all') {
      // Get menu items in the specified category
      const menuItemsInCategory = await MenuItem.find({
        category: category as string
      }).select('_id');
      
      const menuItemIds = menuItemsInCategory.map(item => item._id);
      orderQuery['items.menuItem'] = { $in: menuItemIds };
    }
    
    // Get orders with user details for regional data
    const orders = await Order.find(orderQuery)
      .populate('user', 'addresses')
      .select('totalAmount deliveryAddress');
    
    // Initialize regional stats
    const regionalStats: { [key: string]: { count: number, revenue: number } } = {
      'North': { count: 0, revenue: 0 },
      'Central': { count: 0, revenue: 0 },
      'South': { count: 0, revenue: 0 }
    };
    
    // Count orders and revenue by region
    orders.forEach(order => {
      // Determine region from order's delivery address
      let region = 'Other';
      
      if (order.deliveryAddress && order.deliveryAddress.state) {
        region = getRegionFromAddress(order.deliveryAddress.state);
      } else if (order.user && (order.user as any).addresses && (order.user as any).addresses.length > 0) {
        // Fallback to user's default address state
        const defaultAddress = (order.user as any).addresses.find((addr: any) => addr.isDefault) || 
                               (order.user as any).addresses[0];
        if (defaultAddress && defaultAddress.state) {
          region = getRegionFromAddress(defaultAddress.state);
        }
      }
      
      // Increment stats for the region
      if (regionalStats[region]) {
        regionalStats[region].count += 1;
        regionalStats[region].revenue += order.totalAmount;
      } else {
        // If region is "Other", create an entry
        regionalStats[region] = { count: 1, revenue: order.totalAmount };
      }
    });
    
    // Convert to array format
    const regionalData = Object.entries(regionalStats).map(([region, data]) => ({
      region,
      count: data.count,
      revenue: data.revenue
    })).sort((a, b) => b.count - a.count); // Sort by count (highest first)
    
    return res.json(regionalData);
    
  } catch (error) {
    console.error('Error getting regional orders:', error);
    return res.status(500).json({
      message: 'Failed to get regional orders'
    });
  }
}; 