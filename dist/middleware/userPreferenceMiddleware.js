"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackOrderCreation = exports.trackItemView = void 0;
const UserPreference_1 = require("../models/UserPreference");
const MenuItem_1 = require("../models/MenuItem");
/**
 * Middleware to track user item views and update preferences
 * This is used to improve recommendation quality over time
 */
const trackItemView = async (req, res, next) => {
    var _a;
    try {
        // Only track authenticated users
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            return next();
        }
        const itemId = req.params.id;
        if (!itemId) {
            return next();
        }
        // Get the item to extract category and ingredients
        const menuItem = await MenuItem_1.MenuItem.findById(itemId);
        if (!menuItem) {
            return next();
        }
        // Get or create user preferences
        let userPreference = await UserPreference_1.UserPreference.findOne({ user: req.user._id });
        if (!userPreference) {
            userPreference = new UserPreference_1.UserPreference({
                user: req.user._id,
                favoriteCategories: [],
                dislikedIngredients: [],
                preferredNutrition: {},
                dietaryRestrictions: [],
                favoriteItems: [],
                lastViewedItems: []
            });
        }
        // Update last viewed items (most recent first)
        userPreference.lastViewedItems = [itemId,
            ...userPreference.lastViewedItems
                .filter(id => id.toString() !== itemId)
        ].slice(0, 10); // Keep only last 10 viewed items
        // Update favorite categories based on views
        if (!userPreference.favoriteCategories.includes(menuItem.category)) {
            userPreference.favoriteCategories.push(menuItem.category);
            // Keep only the 3 most recent categories
            if (userPreference.favoriteCategories.length > 3) {
                userPreference.favoriteCategories.shift();
            }
        }
        await userPreference.save();
        next();
    }
    catch (error) {
        // Don't interrupt the request if tracking fails
        console.error('Error tracking user preferences:', error);
        next();
    }
};
exports.trackItemView = trackItemView;
/**
 * Middleware to track successful orders and update preferences
 */
const trackOrderCreation = async (req, res, next) => {
    var _a;
    try {
        // Only track authenticated users with successful order creation
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || res.statusCode !== 201) {
            return next();
        }
        // Get the order details from the response body
        const orderData = res.locals.orderData;
        if (!orderData || !orderData.items || !orderData.items.length) {
            return next();
        }
        // Get item IDs from the order
        const menuItemIds = orderData.items.map((item) => item.menuItem);
        // Get or create user preferences
        let userPreference = await UserPreference_1.UserPreference.findOne({ user: req.user._id });
        if (!userPreference) {
            userPreference = new UserPreference_1.UserPreference({
                user: req.user._id,
                favoriteCategories: [],
                dislikedIngredients: [],
                preferredNutrition: {},
                dietaryRestrictions: [],
                favoriteItems: [],
                lastViewedItems: []
            });
        }
        // Update favorite items (adding ordered items if not already present)
        menuItemIds.forEach((itemId) => {
            if (!userPreference.favoriteItems.includes(itemId)) {
                userPreference.favoriteItems.push(itemId);
            }
        });
        // Keep only the 10 most recent favorite items
        if (userPreference.favoriteItems.length > 10) {
            userPreference.favoriteItems = userPreference.favoriteItems.slice(-10);
        }
        await userPreference.save();
        next();
    }
    catch (error) {
        // Don't interrupt the request if tracking fails
        console.error('Error tracking order preferences:', error);
        next();
    }
};
exports.trackOrderCreation = trackOrderCreation;
exports.default = {
    trackItemView: exports.trackItemView,
    trackOrderCreation: exports.trackOrderCreation
};
