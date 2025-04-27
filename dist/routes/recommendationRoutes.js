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
const RecommendationController = __importStar(require("../controllers/RecommendationController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * @route GET /recommendation/personalized
 * @description Get AI-powered personalized menu recommendations based on user's order history and preferences
 * @access Private (requires authentication)
 */
router.get('/personalized', auth_1.authenticateToken, RecommendationController.getPersonalizedRecommendations);
/**
 * @route GET /recommendation/special-occasion
 * @description Filter menu items by special occasion (birthday, party, diet, healthy)
 * @access Public
 */
router.get('/special-occasion', RecommendationController.getSpecialOccasionItems);
/**
 * @route GET /recommendation/combos
 * @description Get smart combo suggestions based on trending orders or popular combinations
 * @access Public
 */
router.get('/combos', RecommendationController.getSmartCombos);
exports.default = router;
