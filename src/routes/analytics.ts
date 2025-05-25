import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import { 
  getOrderStats, 
  getCustomerStats, 
  getPopularDishes, 
  getOrderTrends, 
  getRegionalOrders 
} from '../controllers/analytics-controller';

const router = Router();
// Popular dishes endpoint
router.get('/dishes/popular', getPopularDishes);
// All analytics routes should be accessible only to admins
router.use(authenticate, isAdmin);

// Order statistics endpoint
router.get('/orders/stats', getOrderStats);

// Customer statistics endpoint
router.get('/customers/stats', getCustomerStats);



// Order trends endpoint
router.get('/orders/trends', getOrderTrends);

// Regional orders endpoint
router.get('/orders/regional', getRegionalOrders);

export default router; 