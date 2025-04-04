import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} from '../controllers/plan-controller';

const router = express.Router();

// Get all plans (public)
router.get('/', getAllPlans);

// Get plan by ID (public)
router.get('/:id', getPlanById);

// Create plan (admin only)
router.post('/', authenticateToken, createPlan);

// Update plan (admin only)
router.put('/:id', authenticateToken, updatePlan);

// Delete plan (admin only)
router.delete('/:id', authenticateToken, deletePlan);

export default router; 