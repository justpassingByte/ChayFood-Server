"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user-controller");
const router = express_1.default.Router();
// Profile routes
router.get('/profile', auth_1.authenticateToken, user_controller_1.getUserProfile);
router.put('/profile', auth_1.authenticateToken, user_controller_1.updateUserProfile);
// Address routes
router.get('/addresses', auth_1.authenticateToken, user_controller_1.getUserAddresses);
router.post('/addresses', auth_1.authenticateToken, user_controller_1.addUserAddress);
router.put('/addresses/:addressId', auth_1.authenticateToken, user_controller_1.updateUserAddress);
router.delete('/addresses/:addressId', auth_1.authenticateToken, user_controller_1.deleteUserAddress);
router.patch('/addresses/:addressId/default', auth_1.authenticateToken, user_controller_1.setDefaultAddress);
exports.default = router;
