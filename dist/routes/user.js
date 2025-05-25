"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const admin_middleware_1 = require("../middleware/admin-middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const user_controller_1 = require("../controllers/user-controller");
const router = express_1.default.Router();
// Multer config for avatar upload
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(__dirname, '../../uploads/avatars'));
    },
    filename: function (req, file, cb) {
        const ext = path_1.default.extname(file.originalname);
        cb(null, Date.now() + '-' + file.fieldname + ext);
    }
});
const upload = (0, multer_1.default)({ storage });
// Admin routes
router.get('/customers', auth_1.authenticateToken, admin_middleware_1.adminMiddleware, user_controller_1.getCustomersList);
router.get('/customers/:id', auth_1.authenticateToken, admin_middleware_1.adminMiddleware, user_controller_1.getCustomerById);
// Profile routes
router.get('/profile', auth_1.authenticateToken, user_controller_1.getUserProfile);
router.get('/profile/full', auth_1.authenticateToken, user_controller_1.getFullUserProfile);
router.put('/profile', auth_1.authenticateToken, upload.single('picture'), user_controller_1.updateUserProfile);
// Address routes
router.get('/addresses', auth_1.authenticateToken, user_controller_1.getUserAddresses);
router.post('/addresses', auth_1.authenticateToken, user_controller_1.addUserAddress);
router.put('/addresses/:addressId', auth_1.authenticateToken, user_controller_1.updateUserAddress);
router.delete('/addresses/:addressId', auth_1.authenticateToken, user_controller_1.deleteUserAddress);
router.patch('/addresses/:addressId/default', auth_1.authenticateToken, user_controller_1.setDefaultAddress);
exports.default = router;
