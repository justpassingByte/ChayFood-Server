"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const analytics_controller_1 = require("../controllers/analytics-controller");
const router = (0, express_1.Router)();
// All analytics routes should be accessible only to admins
router.use(auth_1.authenticate, auth_1.isAdmin);
// Order statistics endpoint
router.get('/orders/stats', analytics_controller_1.getOrderStats);
// Customer statistics endpoint
router.get('/customers/stats', analytics_controller_1.getCustomerStats);
// Popular dishes endpoint
router.get('/dishes/popular', analytics_controller_1.getPopularDishes);
// Order trends endpoint
router.get('/orders/trends', analytics_controller_1.getOrderTrends);
// Regional orders endpoint
router.get('/orders/regional', analytics_controller_1.getRegionalOrders);
exports.default = router;
