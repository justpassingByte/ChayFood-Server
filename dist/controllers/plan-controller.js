"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPlans = getAllPlans;
exports.getPlanById = getPlanById;
exports.createPlan = createPlan;
exports.updatePlan = updatePlan;
exports.deletePlan = deletePlan;
const Plan_1 = require("../models/Plan");
/**
 * Get all available subscription plans
 */
async function getAllPlans(req, res) {
    try {
        const plans = await Plan_1.Plan.find({ isActive: true });
        res.json({
            status: 'success',
            message: `Retrieved ${plans.length} subscription plans`,
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
 * Get a specific plan by ID
 */
async function getPlanById(req, res) {
    try {
        const plan = await Plan_1.Plan.findById(req.params.id);
        if (!plan) {
            res.status(404).json({
                status: 'error',
                message: 'Subscription plan not found'
            });
            return;
        }
        res.json({
            status: 'success',
            message: 'Plan retrieved successfully',
            data: plan
        });
    }
    catch (error) {
        console.error('Error fetching subscription plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching subscription plan',
            error: error.message
        });
    }
}
/**
 * Create a new subscription plan (admin only)
 */
async function createPlan(req, res) {
    var _a;
    try {
        // Debug request information
        console.log('--- CREATE PLAN DEBUG ---');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('User role:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        console.log('--------------------------');
        // Check if user is authenticated and is admin
        if (!req.user || req.user.role !== 'admin') {
            console.log('Access denied - non-admin attempted to create plan');
            res.status(403).json({
                status: 'error',
                message: 'Admin access required',
                error: 'Only administrators can create subscription plans'
            });
            return;
        }
        // Basic validation
        const { name, code, price, duration, description, mealsPerDay, snacksPerDay, features } = req.body;
        if (!name || !code || !price || !description || !mealsPerDay || !features) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields',
                error: 'All required fields must be provided'
            });
            return;
        }
        // Check if plan code already exists
        const existingPlan = await Plan_1.Plan.findOne({ code });
        if (existingPlan) {
            res.status(400).json({
                status: 'error',
                message: 'Plan code already exists',
                error: `A plan with code "${code}" already exists`
            });
            return;
        }
        // Create the plan
        const plan = new Plan_1.Plan({
            name,
            code,
            price,
            duration: duration || 7,
            description,
            mealsPerDay,
            snacksPerDay: snacksPerDay || 0,
            features,
            isRecommended: req.body.isRecommended || false,
            isPremiumMenu: req.body.isPremiumMenu || false,
            hasDietitianSupport: req.body.hasDietitianSupport || false,
            hasCustomization: req.body.hasCustomization || false,
            hasPriorityDelivery: req.body.hasPriorityDelivery || false,
            has24HrSupport: req.body.has24HrSupport || false,
            isActive: true
        });
        // Save the plan
        await plan.save();
        // Return the created plan
        res.status(201).json({
            status: 'success',
            message: 'Subscription plan created successfully',
            data: plan
        });
    }
    catch (error) {
        console.error('Error creating subscription plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating subscription plan',
            error: error.message
        });
    }
}
/**
 * Update an existing subscription plan (admin only)
 */
async function updatePlan(req, res) {
    try {
        // Check if user is authenticated and is admin
        if (!req.user || req.user.role !== 'admin') {
            res.status(403).json({
                status: 'error',
                message: 'Admin access required',
                error: 'Only administrators can update subscription plans'
            });
            return;
        }
        // Get the plan
        const plan = await Plan_1.Plan.findById(req.params.id);
        if (!plan) {
            res.status(404).json({
                status: 'error',
                message: 'Subscription plan not found'
            });
            return;
        }
        // Update fields
        const updateFields = [
            'name', 'price', 'duration', 'description', 'mealsPerDay',
            'snacksPerDay', 'features', 'isRecommended', 'isPremiumMenu',
            'hasDietitianSupport', 'hasCustomization', 'hasPriorityDelivery',
            'has24HrSupport', 'isActive'
        ];
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                plan[field] = req.body[field];
            }
        });
        // Save the updated plan
        await plan.save();
        res.json({
            status: 'success',
            message: 'Subscription plan updated successfully',
            data: plan
        });
    }
    catch (error) {
        console.error('Error updating subscription plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating subscription plan',
            error: error.message
        });
    }
}
/**
 * Delete a subscription plan (admin only)
 */
async function deletePlan(req, res) {
    try {
        // Check if user is authenticated and is admin
        if (!req.user || req.user.role !== 'admin') {
            res.status(403).json({
                status: 'error',
                message: 'Admin access required',
                error: 'Only administrators can delete subscription plans'
            });
            return;
        }
        // Delete the plan
        const result = await Plan_1.Plan.findByIdAndDelete(req.params.id);
        if (!result) {
            res.status(404).json({
                status: 'error',
                message: 'Subscription plan not found'
            });
            return;
        }
        res.json({
            status: 'success',
            message: 'Subscription plan deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting subscription plan:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting subscription plan',
            error: error.message
        });
    }
}
