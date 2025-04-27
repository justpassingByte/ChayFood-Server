"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const plan_controller_1 = require("../controllers/plan-controller");
const router = express_1.default.Router();
// Get all plans (public)
router.get('/', plan_controller_1.getAllPlans);
// Get plan by ID (public)
router.get('/:id', plan_controller_1.getPlanById);
// Create plan (admin only)
router.post('/', auth_1.authenticateToken, plan_controller_1.createPlan);
// Update plan (admin only)
router.put('/:id', auth_1.authenticateToken, plan_controller_1.updatePlan);
// Delete plan (admin only)
router.delete('/:id', auth_1.authenticateToken, plan_controller_1.deletePlan);
exports.default = router;
