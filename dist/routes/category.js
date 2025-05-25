"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const category_controller_1 = require("../controllers/category-controller");
const router = express_1.default.Router();
// Get all categories
router.get('/', category_controller_1.getAllCategories);
// Get category by ID
router.get('/:id', category_controller_1.getCategoryById);
// Create new category (admin only)
router.post('/', auth_1.authenticateToken, category_controller_1.createCategory);
// Update category (admin only)
router.put('/:id', auth_1.authenticateToken, category_controller_1.updateCategory);
// Delete category (admin only)
router.delete('/:id', auth_1.authenticateToken, category_controller_1.deleteCategory);
exports.default = router;
