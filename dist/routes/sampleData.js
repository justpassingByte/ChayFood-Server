"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sample_data_controller_1 = require("../controllers/sample-data-controller");
const admin_middleware_1 = require("../middleware/admin-middleware");
const router = express_1.default.Router();
// All routes require admin authentication
router.use(admin_middleware_1.adminMiddleware);
// Generate sample menu items
router.post('/menu-items', sample_data_controller_1.generateMenuItems);
// Generate sample users
router.post('/users', sample_data_controller_1.generateUsers);
// Generate sample orders
router.post('/orders', sample_data_controller_1.generateOrders);
// Generate complete dataset
router.post('/generate-all', sample_data_controller_1.generateAll);
// Clear all sample data
router.delete('/clear', sample_data_controller_1.clearSampleData);
exports.default = router;
