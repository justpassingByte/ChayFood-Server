import express from 'express';
import * as RecommendationController from '../controllers/RecommendationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /recommendation/personalized
 * @description Get AI-powered personalized menu recommendations based on user's order history and preferences
 * @access Private (requires authentication)
 */
router.get('/personalized', authenticateToken, RecommendationController.getPersonalizedRecommendations);

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

export default router; 