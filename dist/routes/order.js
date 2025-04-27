"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const order_controller_1 = require("../controllers/order-controller");
const userPreferenceMiddleware_1 = require("../middleware/userPreferenceMiddleware");
const router = express_1.default.Router();
// Legacy route - Get all orders (admin) or user's orders based on role
router.get('/', auth_1.authenticateToken, order_controller_1.getOrders);
// Admin route - Get all orders in the system
router.get('/admin/all', auth_1.authenticateToken, order_controller_1.getAllOrders);
// User route - Get only the user's own orders
router.get('/user/my-orders', auth_1.authenticateToken, order_controller_1.getUserOrders);
// Get order by ID
router.get('/:id', auth_1.authenticateToken, order_controller_1.getOrderById);
// Create order - add tracking middleware after order creation
router.post('/', auth_1.authenticateToken, order_controller_1.createOrder, userPreferenceMiddleware_1.trackOrderCreation);
// Reorder a previous order (quick reorder)
router.post('/reorder/:orderId', auth_1.authenticateToken, order_controller_1.reorderPreviousOrder);
// Update order status (admin only)
router.patch('/:id/status', auth_1.authenticateToken, order_controller_1.updateOrderStatus);
// Cancel order
router.patch('/:id/cancel', auth_1.authenticateToken, order_controller_1.cancelOrder);
// Confirm order delivery (user)
router.patch('/:id/user/confirm-delivery', auth_1.authenticateToken, order_controller_1.confirmDelivery);
exports.default = router;
