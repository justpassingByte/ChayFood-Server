"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promotionController = __importStar(require("../controllers/promotion-controller"));
const auth_1 = require("../middleware/auth");
const admin_middleware_1 = require("../middleware/admin-middleware");
const router = express_1.default.Router();
// Public routes
router.get('/active-flash-sales', promotionController.getActiveFlashSales);
// User routes (requires authentication)
router.get('/', auth_1.authenticateToken, promotionController.getAllPromotions);
router.get('/:id', auth_1.authenticateToken, promotionController.getPromotionById);
// Admin routes (requires admin privileges)
router.post('/', auth_1.authenticateToken, admin_middleware_1.adminMiddleware, promotionController.createPromotion);
router.post('/flash-sale', auth_1.authenticateToken, admin_middleware_1.adminMiddleware, promotionController.createFlashSale);
router.put('/:id', auth_1.authenticateToken, admin_middleware_1.adminMiddleware, promotionController.updatePromotion);
router.delete('/:id', auth_1.authenticateToken, admin_middleware_1.adminMiddleware, promotionController.deletePromotion);
router.get('/:id/stats', auth_1.authenticateToken, admin_middleware_1.adminMiddleware, promotionController.getPromotionStats);
exports.default = router;
