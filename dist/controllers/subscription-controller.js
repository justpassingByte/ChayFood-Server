"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailablePlans = getAvailablePlans;
exports.createSubscription = createSubscription;
exports.getUserSubscriptions = getUserSubscriptions;
exports.getSubscriptionById = getSubscriptionById;
exports.updateMenuSelections = updateMenuSelections;
exports.cancelSubscription = cancelSubscription;
const Subscription_1 = require("../models/Subscription");
const Plan_1 = require("../models/Plan");
/**
 * Get available subscription plans
 */
async function getAvailablePlans(req, res) {
    try {
        const plans = await Plan_1.Plan.find({ isActive: true });
        res.json({
            status: 'success',
            message: 'Retrieved available subscription plans',
            data: plans
        });
    }
    catch (error) {
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
async function createSubscription(req, res) {
    var _a, _b;
    try {
        // Debug request information
        console.log('--- CREATE SUBSCRIPTION DEBUG ---');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('User ID:', (_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        console.log('----------------------------');
        // Check if user is authenticated
        if (!req.user || !((_b = req.user) === null || _b === void 0 ? void 0 : _b._id)) {
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
        const plan = await Plan_1.Plan.findById(planId);
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
        const subscription = new Subscription_1.Subscription({
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
    }
    catch (error) {
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
async function getUserSubscriptions(req, res) {
    var _a;
    try {
        // Check if user is authenticated
        if (!req.user || !((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
                error: 'User must be logged in to view subscriptions'
            });
            return;
        }
        const subscriptions = await Subscription_1.Subscription.find({
            user: req.user._id
        }).populate('plan').sort({ createdAt: -1 });
        res.json({
            status: 'success',
            message: `Retrieved ${subscriptions.length} subscriptions`,
            data: subscriptions
        });
    }
    catch (error) {
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
async function getSubscriptionById(req, res) {
    var _a, _b, _c;
    try {
        // Check if user is authenticated
        if (!req.user || !((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
                error: 'User must be logged in to view subscription details'
            });
            return;
        }
        const subscription = await Subscription_1.Subscription.findById(req.params.id)
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
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin' && subscription.user.toString() !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c._id.toString())) {
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
    }
    catch (error) {
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
async function updateMenuSelections(req, res) {
    var _a, _b, _c;
    try {
        // Check if user is authenticated
        if (!req.user || !((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
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
        const subscription = await Subscription_1.Subscription.findById(req.params.id).populate('plan');
        if (!subscription) {
            res.status(404).json({
                status: 'error',
                message: 'Subscription not found'
            });
            return;
        }
        // Verify user has access to this subscription
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin' && subscription.user.toString() !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c._id.toString())) {
            res.status(403).json({
                status: 'error',
                message: 'Not authorized',
                error: 'You do not have permission to modify this subscription'
            });
            return;
        }
        // Get the plan details for validation
        const plan = subscription.plan;
        // Count meals and snacks by day
        const mealsByDay = {};
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
            }
            else {
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
    }
    catch (error) {
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
async function cancelSubscription(req, res) {
    var _a, _b, _c;
    try {
        // Check if user is authenticated
        if (!req.user || !((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required',
                error: 'User must be logged in to cancel subscription'
            });
            return;
        }
        // Get the subscription
        const subscription = await Subscription_1.Subscription.findById(req.params.id);
        if (!subscription) {
            res.status(404).json({
                status: 'error',
                message: 'Subscription not found'
            });
            return;
        }
        // Verify user has access to this subscription
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin' && subscription.user.toString() !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c._id.toString())) {
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
    }
    catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error cancelling subscription',
            error: error.message
        });
    }
}
