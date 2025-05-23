"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCart = getUserCart;
exports.addToCart = addToCart;
exports.updateCartItem = updateCartItem;
exports.removeFromCart = removeFromCart;
exports.clearCart = clearCart;
const Cart_1 = require("../models/Cart");
const MenuItem_1 = require("../models/MenuItem");
/**
 * Helper function to ensure menu items are properly populated
 */
async function ensureMenuItemsPopulated(cart) {
    var _a, _b, _c, _d, _e;
    if (!cart || !cart.items || !Array.isArray(cart.items))
        return;
    console.log('Checking cart items for proper population:', cart.items.length);
    // Check each item in the cart
    for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i];
        // Debug the specific item
        console.log(`Cart item ${i}:`, {
            id: (_a = item._id) === null || _a === void 0 ? void 0 : _a.toString(),
            menuItemRef: ((_b = item.menuItem) === null || _b === void 0 ? void 0 : _b.toString) ? item.menuItem.toString() : item.menuItem,
            menuItemType: typeof item.menuItem,
            menuItemName: (_c = item.menuItem) === null || _c === void 0 ? void 0 : _c.name
        });
        // If menuItem is missing or not fully populated
        if (!item.menuItem ||
            typeof item.menuItem === 'string' ||
            !item.menuItem.name ||
            item.menuItem.name === 'Unknown Item') {
            try {
                // Get the menuItem ID (handling both string ID and object reference)
                const menuItemId = typeof item.menuItem === 'object' && ((_d = item.menuItem) === null || _d === void 0 ? void 0 : _d._id)
                    ? item.menuItem._id.toString()
                    : (_e = item.menuItem) === null || _e === void 0 ? void 0 : _e.toString();
                console.log(`Fetching menu item by ID: ${menuItemId}`);
                if (!menuItemId) {
                    console.error('No valid menuItemId found for cart item:', item);
                    continue;
                }
                // Fetch the real menu item directly from database
                const realMenuItem = await MenuItem_1.MenuItem.findById(menuItemId);
                if (realMenuItem) {
                    // Replace with the real menu item data
                    console.log(`Found real menu item: ${realMenuItem.name}`);
                    cart.items[i].menuItem = realMenuItem;
                }
                else {
                    console.warn(`Menu item with ID ${menuItemId} not found in database`);
                    // Set a placeholder with informative name
                    cart.items[i].menuItem = {
                        _id: menuItemId,
                        name: 'Món ăn đã bị xóa',
                        price: typeof item.menuItem === 'object' ? item.menuItem.price || 0 : 0,
                        image: '',
                        description: 'Món ăn này không còn tồn tại trong hệ thống.'
                    };
                }
            }
            catch (err) {
                console.error('Error fixing menu item data:', err);
            }
        }
    }
}
/**
 * Get user's cart
 */
async function getUserCart(req, res) {
    var _a;
    try {
        // Check if user is authenticated
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        // Find or create cart for the user with detailed population
        let cart = await Cart_1.Cart.findOne({ user: req.user._id })
            .populate({
            path: 'items.menuItem',
            model: 'MenuItem',
            select: '_id name price image description category isAvailable',
            options: { lean: true }
        });
        if (!cart) {
            cart = new Cart_1.Cart({ user: req.user._id, items: [] });
            await cart.save();
        }
        else {
            // Update last active time
            cart.lastActive = new Date();
            // Ensure all menu items are properly populated
            await ensureMenuItemsPopulated(cart);
            await cart.save();
        }
        // Explicitly log the cart items after population
        if (cart.items && cart.items.length > 0) {
            console.log('Cart items after population:');
            cart.items.forEach((item, index) => {
                var _a, _b, _c;
                console.log(`Item ${index}:`, {
                    id: item._id,
                    menuItemId: ((_a = item.menuItem) === null || _a === void 0 ? void 0 : _a._id) || item.menuItem,
                    name: ((_b = item.menuItem) === null || _b === void 0 ? void 0 : _b.name) || 'No name',
                    price: ((_c = item.menuItem) === null || _c === void 0 ? void 0 : _c.price) || 0
                });
            });
        }
        // Calculate total price
        const total = await cart.calculateTotal();
        res.json({
            cart,
            total
        });
    }
    catch (error) {
        console.error('Error fetching user cart:', error);
        res.status(500).json({ message: 'Error fetching cart' });
    }
}
/**
 * Add item to cart
 */
async function addToCart(req, res) {
    var _a;
    try {
        // Check if user is authenticated
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { menuItemId, quantity = 1, notes = '' } = req.body;
        // Validate menu item exists
        const menuItem = await MenuItem_1.MenuItem.findById(menuItemId);
        if (!menuItem) {
            res.status(404).json({ message: 'Menu item not found' });
            return;
        }
        // Check if item is available
        if (!menuItem.isAvailable) {
            res.status(400).json({ message: 'Menu item is not available' });
            return;
        }
        // Find or create cart
        let cart = await Cart_1.Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart_1.Cart({ user: req.user._id, items: [] });
        }
        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => item.menuItem.toString() === menuItemId);
        if (existingItemIndex > -1) {
            // Update existing item
            cart.items[existingItemIndex].quantity += Number(quantity);
            cart.items[existingItemIndex].notes = notes;
        }
        else {
            // Add new item
            cart.items.push({
                menuItem: menuItemId,
                quantity: Number(quantity),
                notes
            });
        }
        // Update last active time
        cart.lastActive = new Date();
        await cart.save();
        // Return updated cart with populated items
        const updatedCart = await Cart_1.Cart.findById(cart._id).populate({
            path: 'items.menuItem',
            model: 'MenuItem',
            select: '_id name price image description category isAvailable',
            options: { lean: true }
        });
        // Ensure all menu items are properly populated
        await ensureMenuItemsPopulated(updatedCart);
        // Explicitly log the cart items after population
        if (updatedCart && updatedCart.items && updatedCart.items.length > 0) {
            console.log('Cart items after update:');
            updatedCart.items.forEach((item, index) => {
                var _a, _b, _c;
                console.log(`Item ${index}:`, {
                    id: item._id,
                    menuItemId: ((_a = item.menuItem) === null || _a === void 0 ? void 0 : _a._id) || item.menuItem,
                    name: ((_b = item.menuItem) === null || _b === void 0 ? void 0 : _b.name) || 'No name',
                    price: ((_c = item.menuItem) === null || _c === void 0 ? void 0 : _c.price) || 0
                });
            });
        }
        // Calculate total price
        const total = await updatedCart.calculateTotal();
        res.status(200).json({
            message: 'Item added to cart',
            cart: updatedCart,
            total
        });
    }
    catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ message: 'Error adding item to cart' });
    }
}
/**
 * Update cart item
 */
async function updateCartItem(req, res) {
    var _a;
    try {
        // Check if user is authenticated
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { cartItemId } = req.params;
        const { quantity, notes } = req.body;
        // Find user's cart
        const cart = await Cart_1.Cart.findOne({ user: req.user._id });
        if (!cart) {
            res.status(404).json({ message: 'Cart not found' });
            return;
        }
        // Find the item in the cart
        const cartItem = cart.items.id(cartItemId);
        if (!cartItem) {
            res.status(404).json({ message: 'Cart item not found' });
            return;
        }
        // Update the item
        if (quantity !== undefined) {
            if (quantity <= 0) {
                // Remove item if quantity is 0 or negative
                cart.items.pull({ _id: cartItemId });
            }
            else {
                cartItem.quantity = quantity;
            }
        }
        if (notes !== undefined) {
            cartItem.notes = notes;
        }
        // Update last active time
        cart.lastActive = new Date();
        await cart.save();
        // Return updated cart with populated items
        const updatedCart = await Cart_1.Cart.findById(cart._id).populate({
            path: 'items.menuItem',
            model: 'MenuItem',
            select: '_id name price image description category isAvailable',
            options: { lean: true }
        });
        // Ensure all menu items are properly populated
        await ensureMenuItemsPopulated(updatedCart);
        // Explicitly log the cart items after population
        if (updatedCart && updatedCart.items && updatedCart.items.length > 0) {
            console.log('Cart items after update:');
            updatedCart.items.forEach((item, index) => {
                var _a, _b, _c;
                console.log(`Item ${index}:`, {
                    id: item._id,
                    menuItemId: ((_a = item.menuItem) === null || _a === void 0 ? void 0 : _a._id) || item.menuItem,
                    name: ((_b = item.menuItem) === null || _b === void 0 ? void 0 : _b.name) || 'No name',
                    price: ((_c = item.menuItem) === null || _c === void 0 ? void 0 : _c.price) || 0
                });
            });
        }
        // Calculate total price
        const total = await updatedCart.calculateTotal();
        res.status(200).json({
            message: 'Cart updated successfully',
            cart: updatedCart,
            total
        });
    }
    catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Error updating cart item' });
    }
}
/**
 * Remove item from cart
 */
async function removeFromCart(req, res) {
    var _a;
    try {
        // Check if user is authenticated
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { cartItemId } = req.params;
        // Find user's cart
        const cart = await Cart_1.Cart.findOne({ user: req.user._id });
        if (!cart) {
            res.status(404).json({ message: 'Cart not found' });
            return;
        }
        // Remove the item
        cart.items.pull({ _id: cartItemId });
        // Update last active time
        cart.lastActive = new Date();
        await cart.save();
        // Return updated cart with populated items
        const updatedCart = await Cart_1.Cart.findById(cart._id).populate({
            path: 'items.menuItem',
            model: 'MenuItem',
            select: '_id name price image description category isAvailable',
            options: { lean: true }
        });
        // Ensure all menu items are properly populated
        await ensureMenuItemsPopulated(updatedCart);
        // Explicitly log the cart items after population
        if (updatedCart && updatedCart.items && updatedCart.items.length > 0) {
            console.log('Cart items after update:');
            updatedCart.items.forEach((item, index) => {
                var _a, _b, _c;
                console.log(`Item ${index}:`, {
                    id: item._id,
                    menuItemId: ((_a = item.menuItem) === null || _a === void 0 ? void 0 : _a._id) || item.menuItem,
                    name: ((_b = item.menuItem) === null || _b === void 0 ? void 0 : _b.name) || 'No name',
                    price: ((_c = item.menuItem) === null || _c === void 0 ? void 0 : _c.price) || 0
                });
            });
        }
        // Calculate total price
        const total = await updatedCart.calculateTotal();
        res.status(200).json({
            message: 'Item removed from cart',
            cart: updatedCart,
            total
        });
    }
    catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ message: 'Error removing item from cart' });
    }
}
/**
 * Clear user's cart
 */
async function clearCart(req, res) {
    var _a;
    try {
        // Check if user is authenticated
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        // Find user's cart
        const cart = await Cart_1.Cart.findOne({ user: req.user._id });
        if (!cart) {
            res.status(404).json({ message: 'Cart not found' });
            return;
        }
        // Clear all items
        cart.items = [];
        // Update last active time
        cart.lastActive = new Date();
        await cart.save();
        res.status(200).json({
            message: 'Cart cleared successfully',
            cart,
            total: 0
        });
    }
    catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Error clearing cart' });
    }
}
