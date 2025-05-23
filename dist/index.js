"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const passport_2 = __importDefault(require("./config/passport"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const menu_1 = __importDefault(require("./routes/menu"));
const order_1 = __importDefault(require("./routes/order"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const plan_1 = __importDefault(require("./routes/plan"));
const recommendationRoutes_1 = __importDefault(require("./routes/recommendationRoutes"));
const user_1 = __importDefault(require("./routes/user"));
const loyalty_1 = __importDefault(require("./routes/loyalty"));
const promotion_1 = __importDefault(require("./routes/promotion"));
const category_1 = __importDefault(require("./routes/category"));
const cart_1 = __importDefault(require("./routes/cart"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const review_1 = __importDefault(require("./routes/review"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
// Session configuration
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'chayfood_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
(0, passport_2.default)(); // Configure passport strategies
// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'ChayFood API is running',
        endpoints: {
            menu: '/menu',
            auth: '/auth',
            order: '/order',
            subscription: '/subscription',
            plan: '/plan',
            recommendation: '/recommendation',
            category: '/category',
            cart: '/cart',
            analytics: '/api/analytics'
        }
    });
});
// Routes - updated to match README documentation
app.use('/auth', auth_1.default);
app.use('/menu', menu_1.default);
app.use('/order', order_1.default);
app.use('/subscription', subscription_1.default);
app.use('/plan', plan_1.default);
app.use('/recommendation', recommendationRoutes_1.default);
app.use('/admin', user_1.default);
app.use('/loyalty', loyalty_1.default);
app.use('/promotion', promotion_1.default);
app.use('/category', category_1.default);
app.use('/cart', cart_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/review', review_1.default);
// 404 handler for undefined routes
app.use((req, res) => {
    console.log(`Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        path: req.path
    });
});
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chayfood';
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log('Connected to MongoDB');
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API available at: http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- Menu: http://localhost:' + PORT + '/menu');
    console.log('- Auth: http://localhost:' + PORT + '/auth');
    console.log('- Order: http://localhost:' + PORT + '/order');
    console.log('- Subscription: http://localhost:' + PORT + '/subscription');
    console.log('- Plan: http://localhost:' + PORT + '/plan');
    console.log('- Recommendation: http://localhost:' + PORT + '/recommendation');
    console.log('- User: http://localhost:' + PORT + '/user');
    console.log('- Loyalty: http://localhost:' + PORT + '/loyalty');
    console.log('- Promotion: http://localhost:' + PORT + '/promotion');
    console.log('- Category: http://localhost:' + PORT + '/category');
    console.log('- Cart: http://localhost:' + PORT + '/cart');
    console.log('- Analytics: http://localhost:' + PORT + '/api/analytics');
    console.log('- Review: http://localhost:' + PORT + '/review');
});
