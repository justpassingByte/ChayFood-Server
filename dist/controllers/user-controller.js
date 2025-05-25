"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomersList = getCustomersList;
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.getUserAddresses = getUserAddresses;
exports.addUserAddress = addUserAddress;
exports.updateUserAddress = updateUserAddress;
exports.deleteUserAddress = deleteUserAddress;
exports.setDefaultAddress = setDefaultAddress;
exports.getCustomerById = getCustomerById;
exports.getFullUserProfile = getFullUserProfile;
const User_1 = require("../models/User");
const Order_1 = require("../models/Order");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Get list of all customers (for admin use)
 * Supports pagination, filtering, and sorting
 */
async function getCustomersList(req, res) {
    try {
        // Check if user is admin
        if (!req.user || req.user.role !== 'admin') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Filtering options
        const search = req.query.search;
        const role = req.query.role || 'user'; // Default to showing only customers
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        // Build query
        const query = {};
        // Add role filter (default to user)
        if (role) {
            query.role = role;
        }
        // Add search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        // Build sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder;
        // Execute query with pagination
        const customers = await User_1.User.find(query)
            .select('_id name email phone createdAt picture')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);
        // Get total count for pagination
        const totalCount = await User_1.User.countDocuments(query);
        // Fetch additional data for each customer
        const customerData = await Promise.all(customers.map(async (customer) => {
            // Get order count
            const orderCount = await Order_1.Order.countDocuments({ user: customer._id });
            // Get total spending
            const orders = await Order_1.Order.find({
                user: customer._id,
                status: { $nin: ['cancelled', 'pending'] } // Exclude cancelled and pending orders
            });
            const totalSpending = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            // Use type assertion to include createdAt
            const customerDoc = customer.toJSON();
            // Format the customer data
            return {
                _id: customerDoc._id,
                name: customerDoc.name,
                email: customerDoc.email,
                joinDate: customerDoc.createdAt,
                picture: customerDoc.picture,
                orderCount,
                totalSpending
            };
        }));
        res.json({
            status: 'success',
            message: 'Customers retrieved successfully',
            data: {
                customers: customerData,
                pagination: {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                    hasMore: page * limit < totalCount
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting customers list:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error getting customers list',
            error: error.message
        });
    }
}
/**
 * Get user profile
 */
async function getUserProfile(req, res) {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
            return;
        }
        const user = await User_1.User.findById(req.user._id)
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
    }
    catch (error) {
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
async function updateUserProfile(req, res) {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
            return;
        }
        const { name, phone, dietaryPreferences } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (phone)
            updateData.phone = phone;
        if (dietaryPreferences)
            updateData.dietaryPreferences = dietaryPreferences;
        const user = await User_1.User.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true, runValidators: true }).select('name email phone dietaryPreferences picture');
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
    }
    catch (error) {
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
async function getUserAddresses(req, res) {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
            return;
        }
        const user = await User_1.User.findById(req.user._id)
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
    }
    catch (error) {
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
async function addUserAddress(req, res) {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
            return;
        }
        const { name, street, city, state, postalCode, additionalInfo, isDefault, phone } = req.body;
        // Validate required fields
        if (!name || !street || !city || !state || !postalCode || !phone) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required address fields'
            });
            return;
        }
        const newAddress = {
            _id: new mongoose_1.default.Types.ObjectId(),
            name: String(name),
            street: String(street),
            city: String(city),
            state: String(state),
            postalCode: String(postalCode),
            phone: String(phone),
            additionalInfo: additionalInfo || '',
            isDefault: isDefault || false
        };
        const user = await User_1.User.findById(req.user._id);
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
    }
    catch (error) {
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
async function updateUserAddress(req, res) {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
            return;
        }
        const { addressId } = req.params;
        const { name, street, city, state, postalCode, additionalInfo, isDefault, phone } = req.body;
        if (!addressId) {
            res.status(400).json({
                status: 'error',
                message: 'Address ID is required'
            });
            return;
        }
        const user = await User_1.User.findById(req.user._id);
        if (!user || !user.addresses) {
            res.status(404).json({
                status: 'error',
                message: 'User or addresses not found'
            });
            return;
        }
        // Find the address to update
        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            res.status(404).json({
                status: 'error',
                message: 'Address not found'
            });
            return;
        }
        // Update address fields
        const updatedAddress = user.addresses[addressIndex];
        if (name)
            updatedAddress.name = name;
        if (street)
            updatedAddress.street = street;
        if (city)
            updatedAddress.city = city;
        if (state)
            updatedAddress.state = state;
        if (postalCode)
            updatedAddress.postalCode = postalCode;
        if (additionalInfo !== undefined)
            updatedAddress.additionalInfo = additionalInfo;
        if (phone)
            updatedAddress.phone = phone;
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
    }
    catch (error) {
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
async function deleteUserAddress(req, res) {
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
        const user = await User_1.User.findById(req.user._id);
        if (!user || !user.addresses) {
            res.status(404).json({
                status: 'error',
                message: 'User or addresses not found'
            });
            return;
        }
        // Find the address index
        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
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
    }
    catch (error) {
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
async function setDefaultAddress(req, res) {
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
        const user = await User_1.User.findById(req.user._id);
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
    }
    catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error setting default address',
            error: error.message
        });
    }
}
/**
 * Get a single customer by ID (for admin use)
 */
async function getCustomerById(req, res) {
    try {
        // Check if user is admin
        if (!req.user || req.user.role !== 'admin') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid customer ID format'
            });
            return;
        }
        // Get basic customer info
        const customer = await User_1.User.findById(id)
            .select('-password'); // Exclude password field
        if (!customer) {
            res.status(404).json({
                status: 'error',
                message: 'Customer not found'
            });
            return;
        }
        // Get order statistics
        const allOrders = await Order_1.Order.find({ user: id });
        const completedOrders = allOrders.filter(order => !['cancelled', 'pending'].includes(order.status));
        // Calculate statistics
        const orderCount = allOrders.length;
        const totalSpending = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = orderCount > 0 ? totalSpending / completedOrders.length : 0;
        // Get last 5 orders
        const recentOrders = await Order_1.Order.find({ user: id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('items.menuItem', 'name price image');
        // Use toJSON to get all properties including timestamps
        const customerObj = customer.toJSON();
        const recentOrdersObj = recentOrders.map(order => order.toJSON());
        // Find first and last order dates
        let firstOrderDate = null;
        let lastOrderDate = null;
        if (allOrders.length > 0) {
            // Sort orders by date
            const sortedOrders = [...allOrders].sort((a, b) => {
                const dateA = a.toJSON().createdAt;
                const dateB = b.toJSON().createdAt;
                return new Date(dateA).getTime() - new Date(dateB).getTime();
            });
            firstOrderDate = sortedOrders[0].toJSON().createdAt;
            lastOrderDate = sortedOrders[sortedOrders.length - 1].toJSON().createdAt;
        }
        // Format response with all required data
        const customerData = Object.assign(Object.assign({}, customerObj), { statistics: {
                orderCount,
                totalSpending,
                averageOrderValue,
                firstOrderDate,
                lastOrderDate
            }, recentOrders: recentOrdersObj });
        res.json({
            status: 'success',
            message: 'Customer details retrieved successfully',
            data: customerData
        });
    }
    catch (error) {
        console.error('Error getting customer details:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error getting customer details',
            error: error.message
        });
    }
}
/**
 * Get full user profile (all info in one response)
 */
async function getFullUserProfile(req, res) {
    try {
        if (!req.user || !req.user._id) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
            return;
        }
        // Lấy user với đầy đủ các trường cần thiết
        const user = await User_1.User.findById(req.user._id)
            .select('-password') // loại bỏ password
            .lean();
        if (!user) {
            res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
            return;
        }
        // Có thể lấy thêm các thông tin liên quan ở đây nếu cần
        // Ví dụ: tổng số đơn hàng, tổng chi tiêu, v.v.
        // const orders = await Order.find({ user: req.user._id });
        // const totalOrders = orders.length;
        // const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        res.json({
            status: 'success',
            message: 'Full user profile retrieved successfully',
            data: user
            // Có thể bổ sung các trường khác nếu cần
            // totalOrders,
            // totalSpent
        });
    }
    catch (error) {
        console.error('Error getting full user profile:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error getting full user profile',
            error: error.message
        });
    }
}
