"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = configurePassport;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const User_1 = require("../models/User");
// Configure Passport strategies
function configurePassport() {
    // Serialize user to session
    passport_1.default.serializeUser((user, done) => {
        done(null, user._id);
    });
    // Deserialize user from session
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await User_1.User.findById(id);
            done(null, user);
        }
        catch (error) {
            done(error, null);
        }
    });
    // Kiểm tra xem các giá trị OAuth có được cấu hình không
    const googleClientID = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // Chỉ cấu hình Google OAuth nếu có đủ thông tin
    if (googleClientID && googleClientSecret) {
        // Google OAuth Strategy
        passport_1.default.use(new passport_google_oauth20_1.Strategy({
            clientID: googleClientID,
            clientSecret: googleClientSecret,
            callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/auth/google/callback`,
            scope: ['profile', 'email']
        }, async (accessToken, refreshToken, profile, done) => {
            var _a, _b, _c, _d;
            try {
                // Check if user already exists
                let user = await User_1.User.findOne({ googleId: profile.id });
                if (user) {
                    // User exists, update profile data if needed
                    if (profile.photos && ((_a = profile.photos[0]) === null || _a === void 0 ? void 0 : _a.value) && user.picture !== profile.photos[0].value) {
                        user.picture = profile.photos[0].value;
                        await user.save();
                    }
                    return done(null, user);
                }
                // User doesn't exist, create new user
                const email = profile.emails && ((_b = profile.emails[0]) === null || _b === void 0 ? void 0 : _b.value);
                if (!email) {
                    return done(new Error('Email not provided by Google OAuth'));
                }
                // Check if user with email already exists (but without Google ID)
                user = await User_1.User.findOne({ email });
                if (user) {
                    // Link Google ID to existing user
                    user.googleId = profile.id;
                    if (profile.photos && ((_c = profile.photos[0]) === null || _c === void 0 ? void 0 : _c.value)) {
                        user.picture = profile.photos[0].value;
                    }
                    await user.save();
                    return done(null, user);
                }
                // Create new user
                const newUser = await User_1.User.create({
                    googleId: profile.id,
                    email,
                    name: profile.displayName || (profile.name ? `${profile.name.givenName} ${profile.name.familyName}` : 'Google User'),
                    picture: profile.photos && ((_d = profile.photos[0]) === null || _d === void 0 ? void 0 : _d.value)
                });
                return done(null, newUser);
            }
            catch (error) {
                return done(error);
            }
        }));
    }
    else {
        console.log('Google OAuth credentials not found. Google authentication is disabled.');
    }
    // Kiểm tra xem các giá trị Facebook OAuth có được cấu hình không
    const facebookAppID = process.env.FACEBOOK_APP_ID;
    const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
    // Chỉ cấu hình Facebook OAuth nếu có đủ thông tin
    if (facebookAppID && facebookAppSecret) {
        // Facebook OAuth Strategy
        passport_1.default.use(new passport_facebook_1.Strategy({
            clientID: facebookAppID,
            clientSecret: facebookAppSecret,
            callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/auth/facebook/callback`,
            profileFields: ['id', 'displayName', 'photos', 'email']
        }, async (accessToken, refreshToken, profile, done) => {
            var _a, _b, _c, _d;
            try {
                // Check if user already exists
                let user = await User_1.User.findOne({ facebookId: profile.id });
                if (user) {
                    // User exists, update profile data if needed
                    if (profile.photos && ((_a = profile.photos[0]) === null || _a === void 0 ? void 0 : _a.value) && user.picture !== profile.photos[0].value) {
                        user.picture = profile.photos[0].value;
                        await user.save();
                    }
                    return done(null, user);
                }
                // User doesn't exist, create new user
                const email = profile.emails && ((_b = profile.emails[0]) === null || _b === void 0 ? void 0 : _b.value);
                if (!email) {
                    return done(new Error('Email not provided by Facebook OAuth'));
                }
                // Check if user with email already exists (but without Facebook ID)
                user = await User_1.User.findOne({ email });
                if (user) {
                    // Link Facebook ID to existing user
                    user.facebookId = profile.id;
                    if (profile.photos && ((_c = profile.photos[0]) === null || _c === void 0 ? void 0 : _c.value)) {
                        user.picture = profile.photos[0].value;
                    }
                    await user.save();
                    return done(null, user);
                }
                // Create new user
                const newUser = await User_1.User.create({
                    facebookId: profile.id,
                    email,
                    name: profile.displayName || 'Facebook User',
                    picture: profile.photos && ((_d = profile.photos[0]) === null || _d === void 0 ? void 0 : _d.value)
                });
                return done(null, newUser);
            }
            catch (error) {
                return done(error);
            }
        }));
    }
    else {
        console.log('Facebook OAuth credentials not found. Facebook authentication is disabled.');
    }
}
