"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const menu_controller_1 = require("../controllers/menu-controller");
const userPreferenceMiddleware_1 = require("../middleware/userPreferenceMiddleware");
const router = express_1.default.Router();
// Debug endpoint to check request body
router.post('/test', (req, res) => {
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    res.json({
        message: 'Request received',
        bodyReceived: req.body,
        contentType: req.headers['content-type'],
        bodyIsEmpty: Object.keys(req.body).length === 0
    });
});
// Get all menu items
router.get('/', menu_controller_1.getAllMenuItems);
// Search menu items
router.get('/search', menu_controller_1.searchMenuItems);
// Get menu items filtered by nutritional content (calories and protein)
router.get('/nutrition', menu_controller_1.getNutritionalMenuItems);
// Get menu item by ID (track view for authenticated users)
router.get('/:id', userPreferenceMiddleware_1.trackItemView, menu_controller_1.getMenuItemById);
// Create new menu item (admin only)
router.post('/', auth_1.authenticateToken, menu_controller_1.createMenuItem);
// Update menu item (admin only)
router.put('/:id', auth_1.authenticateToken, menu_controller_1.updateMenuItem);
// Delete menu item (admin only)
router.delete('/:id', auth_1.authenticateToken, menu_controller_1.deleteMenuItem);
exports.default = router;
