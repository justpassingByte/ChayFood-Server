"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmartCombos = exports.getSpecialOccasionItems = exports.getPersonalizedRecommendations = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MenuItem_1 = require("../models/MenuItem");
const Order_1 = require("../models/Order");
const UserPreference_1 = require("../models/UserPreference");
const MenuItemTag_1 = require("../models/MenuItemTag");
/**
 * Get personalized menu recommendations based on user's order history and preferences
 */
const getPersonalizedRecommendations = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const limit = parseInt(req.query.limit) || 5;
        // Get user preferences
        let userPreference = await UserPreference_1.UserPreference.findOne({ user: userId });
        // If no preferences exist yet, create default ones based on past orders
        if (!userPreference) {
            // Find user's past orders
            const pastOrders = await Order_1.Order.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('items.menuItem');
            // Extract menu items and ingredients from past orders
            const orderedItems = pastOrders.flatMap(order => order.items.map(item => ({
                menuItem: item.menuItem,
                quantity: item.quantity
            })));
            // Create default preferences
            userPreference = new UserPreference_1.UserPreference({
                user: userId,
                favoriteItems: orderedItems
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 5)
                    .map(item => item.menuItem),
                favoriteCategories: [],
                dislikedIngredients: [],
                preferredNutrition: {},
                dietaryRestrictions: [],
                lastViewedItems: []
            });
            await userPreference.save();
        }
        // Build recommendation algorithm based on user preferences
        let recommendations = [];
        // First strategy: Recommend items similar to favorites
        if (userPreference.favoriteItems.length > 0) {
            // Get items similar to user's favorites (based on category and ingredients)
            const favoriteItemDetails = await MenuItem_1.MenuItem.find({
                _id: { $in: userPreference.favoriteItems }
            });
            const favoriteCategories = [...new Set(favoriteItemDetails.map(item => item.category))];
            const favoriteIngredients = [...new Set(favoriteItemDetails.flatMap(item => item.ingredients))];
            const similarItems = await MenuItem_1.MenuItem.find({
                $or: [
                    { category: { $in: favoriteCategories } },
                    { ingredients: { $in: favoriteIngredients } }
                ],
                _id: { $nin: userPreference.favoriteItems } // Exclude already favorite items
            }).limit(limit);
            recommendations = recommendations.concat(similarItems);
        }
        // Second strategy: Recommend based on nutritional preferences
        if (recommendations.length < limit && userPreference.preferredNutrition) {
            const { minProtein, maxCalories } = userPreference.preferredNutrition;
            let nutritionQuery = {};
            if (minProtein)
                nutritionQuery['nutritionInfo.protein'] = { $gte: minProtein };
            if (maxCalories)
                nutritionQuery['nutritionInfo.calories'] = { $lte: maxCalories };
            if (Object.keys(nutritionQuery).length > 0) {
                const nutritionalItems = await MenuItem_1.MenuItem.find(Object.assign(Object.assign({}, nutritionQuery), { _id: { $nin: recommendations.map(r => r._id) } })).limit(limit - recommendations.length);
                recommendations = recommendations.concat(nutritionalItems);
            }
        }
        // Third strategy: Popular items if we still need more recommendations
        if (recommendations.length < limit) {
            // Get most ordered items
            const ordersAggregate = await Order_1.Order.aggregate([
                { $unwind: '$items' },
                { $group: {
                        _id: '$items.menuItem',
                        count: { $sum: 1 }
                    } },
                { $sort: { count: -1 } },
                { $limit: limit }
            ]);
            const popularItemIds = ordersAggregate.map(item => item._id);
            const popularItems = await MenuItem_1.MenuItem.find({
                _id: {
                    $in: popularItemIds,
                    $nin: recommendations.map(r => r._id)
                }
            }).limit(limit - recommendations.length);
            recommendations = recommendations.concat(popularItems);
        }
        // If we still need more recommendations, just get random items
        if (recommendations.length < limit) {
            const randomItems = await MenuItem_1.MenuItem.aggregate([
                { $match: { _id: { $nin: recommendations.map(r => r._id) } } },
                { $sample: { size: limit - recommendations.length } }
            ]);
            recommendations = recommendations.concat(randomItems);
        }
        // Update lastViewedItems in user preferences
        userPreference.lastViewedItems = recommendations
            .map(item => item._id)
            .concat(userPreference.lastViewedItems)
            .slice(0, 10); // Keep only last 10 viewed items
        await userPreference.save();
        return res.status(200).json({ recommendations });
    }
    catch (error) {
        console.error('Error getting personalized recommendations:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getPersonalizedRecommendations = getPersonalizedRecommendations;
/**
 * Filter menu items suitable for specific occasions
 */
const getSpecialOccasionItems = async (req, res) => {
    try {
        const occasion = req.query.occasion;
        if (!occasion) {
            return res.status(400).json({ message: 'Occasion parameter is required' });
        }
        const limit = parseInt(req.query.limit) || 10;
        // Find menu items tagged with the specific occasion
        const taggedItems = await MenuItemTag_1.MenuItemTag.find({
            occasionTags: occasion
        }).populate('menuItem');
        let recommendations = taggedItems.map(tag => tag.menuItem);
        // If we don't have enough recommendations, add items based on occasion-specific criteria
        if (recommendations.length < limit) {
            let occasionQuery = {};
            // Set criteria based on occasion type
            switch (occasion) {
                case 'birthday':
                    // For birthdays, include desserts
                    occasionQuery.category = 'dessert';
                    break;
                case 'party':
                    // For parties, include shareable items
                    occasionQuery.category = { $in: ['main', 'side'] };
                    break;
                case 'diet':
                    // For diets, include low-calorie items
                    occasionQuery['nutritionInfo.calories'] = { $lt: 400 };
                    break;
                case 'healthy':
                    // For healthy items, include high-protein, low-fat items
                    occasionQuery['nutritionInfo.protein'] = { $gt: 15 };
                    occasionQuery['nutritionInfo.fat'] = { $lt: 10 };
                    break;
                default:
                    break;
            }
            if (Object.keys(occasionQuery).length > 0) {
                // Exclude items we already have
                occasionQuery._id = {
                    $nin: recommendations.map(r => r._id)
                };
                const additionalItems = await MenuItem_1.MenuItem.find(occasionQuery)
                    .limit(limit - recommendations.length);
                recommendations = recommendations.concat(additionalItems);
            }
        }
        return res.status(200).json({
            occasion,
            items: recommendations.slice(0, limit)
        });
    }
    catch (error) {
        console.error('Error getting special occasion items:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getSpecialOccasionItems = getSpecialOccasionItems;
/**
 * Generate intelligent combo recommendations based on trending orders or popular combinations
 */
const getSmartCombos = async (req, res) => {
    try {
        const baseItemId = req.query.baseItem;
        const comboSize = parseInt(req.query.size) || 3;
        let recommendations = [];
        // If a base item is provided, find items commonly ordered with it
        if (baseItemId) {
            // Validate ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(baseItemId)) {
                return res.status(400).json({ message: 'Invalid baseItem ID' });
            }
            // First check if we have pre-computed recommended items
            const menuItemTag = await MenuItemTag_1.MenuItemTag.findOne({
                menuItem: baseItemId
            }).populate('recommendedWith');
            if (menuItemTag && menuItemTag.recommendedWith.length > 0) {
                recommendations = menuItemTag.recommendedWith;
            }
            // If we don't have enough pre-computed recommendations, find items commonly ordered together
            if (recommendations.length < comboSize - 1) {
                // Get orders containing the base item
                const ordersWithBaseItem = await Order_1.Order.find({
                    'items.menuItem': baseItemId
                });
                // Extract all other items from these orders
                const otherItems = ordersWithBaseItem.flatMap(order => order.items
                    .filter(item => item.menuItem.toString() !== baseItemId)
                    .map(item => item.menuItem));
                // Count frequency of each item
                const itemCounts = {};
                otherItems.forEach(itemId => {
                    const id = itemId.toString();
                    itemCounts[id] = (itemCounts[id] || 0) + 1;
                });
                // Sort by frequency
                const sortedItems = Object.entries(itemCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([id]) => id);
                // Get full items details
                const commonlyOrderedItems = await MenuItem_1.MenuItem.find({
                    _id: { $in: sortedItems }
                }).limit(comboSize - 1 - recommendations.length);
                recommendations = recommendations.concat(commonlyOrderedItems);
            }
            // Get the base item
            const baseItem = await MenuItem_1.MenuItem.findById(baseItemId);
            if (baseItem) {
                // Return the combo with the base item first
                return res.status(200).json({
                    combo: [baseItem, ...recommendations.slice(0, comboSize - 1)],
                    totalPrice: [baseItem, ...recommendations.slice(0, comboSize - 1)]
                        .reduce((sum, item) => sum + (item ? item.price : 0), 0)
                });
            }
        }
        // If no base item or base item not found, create a smart combo from popular categories
        if (recommendations.length === 0) {
            // Get one main dish, one side, and one beverage
            const mainDish = await MenuItem_1.MenuItem.findOne({ category: 'main' })
                .sort({ 'nutritionInfo.protein': -1 });
            const sideDish = await MenuItem_1.MenuItem.findOne({ category: 'side' });
            const beverage = await MenuItem_1.MenuItem.findOne({ category: 'beverage' });
            const dessert = await MenuItem_1.MenuItem.findOne({ category: 'dessert' });
            // Create combo based on available items and requested size
            const combo = [mainDish, sideDish, beverage, dessert]
                .filter(Boolean)
                .slice(0, comboSize);
            return res.status(200).json({
                combo,
                totalPrice: combo.reduce((sum, item) => sum + (item ? item.price : 0), 0)
            });
        }
        return res.status(200).json({
            message: 'No combo could be generated'
        });
    }
    catch (error) {
        console.error('Error getting smart combos:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getSmartCombos = getSmartCombos;
// Export all functions
exports.default = {
    getPersonalizedRecommendations: exports.getPersonalizedRecommendations,
    getSpecialOccasionItems: exports.getSpecialOccasionItems,
    getSmartCombos: exports.getSmartCombos
};
