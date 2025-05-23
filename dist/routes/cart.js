"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const cart_controller_1 = require("../controllers/cart-controller");
const router = express_1.default.Router();
// All cart routes require authentication
router.use(auth_1.authenticateToken);
// Get user's cart
router.get('/', cart_controller_1.getUserCart);
// Add item to cart
router.post('/items', cart_controller_1.addToCart);
// Update cart item
router.put('/items/:cartItemId', cart_controller_1.updateCartItem);
// Remove item from cart
router.delete('/items/:cartItemId', cart_controller_1.removeFromCart);
// Clear cart
router.delete('/', cart_controller_1.clearCart);
exports.default = router;
