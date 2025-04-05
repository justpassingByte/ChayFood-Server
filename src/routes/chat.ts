import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getChatHistory, getChatById, handleChat, deleteChat } from '../controllers/chat-controller';
const router = express.Router();

// Chat routes
router.get('/', getChatHistory);
router.get('/:chatId', getChatById);
router.post('/', handleChat);
router.delete('/:chatId', deleteChat);

export default router;