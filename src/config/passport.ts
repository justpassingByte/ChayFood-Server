import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { User, IUser } from '../models/User';

// Configure Passport strategies
export default function configurePassport() {
  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, (user as IUser)._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Kiểm tra xem các giá trị OAuth có được cấu hình không
  const googleClientID = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Chỉ cấu hình Google OAuth nếu có đủ thông tin
  if (googleClientID && googleClientSecret) {
    // Google OAuth Strategy
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientID,
          clientSecret: googleClientSecret,
          callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/auth/google/callback`,
          scope: ['profile', 'email']
        },
        async (
          accessToken: string, 
          refreshToken: string, 
          profile: GoogleProfile, 
          done: (error: Error | null, user?: IUser | false) => void
        ) => {
          try {
            // Check if user already exists
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
              // User exists, update profile data if needed
              if (profile.photos && profile.photos[0]?.value && user.picture !== profile.photos[0].value) {
                user.picture = profile.photos[0].value;
                await user.save();
              }
              return done(null, user);
            }

            // User doesn't exist, create new user
            const email = profile.emails && profile.emails[0]?.value;
            if (!email) {
              return done(new Error('Email not provided by Google OAuth'));
            }

            // Check if user with email already exists (but without Google ID)
            user = await User.findOne({ email });
            
            if (user) {
              // Link Google ID to existing user
              user.googleId = profile.id;
              if (profile.photos && profile.photos[0]?.value) {
                user.picture = profile.photos[0].value;
              }
              await user.save();
              return done(null, user);
            }

            // Create new user
            const newUser = await User.create({
              googleId: profile.id,
              email,
              name: profile.displayName || (profile.name ? `${profile.name.givenName} ${profile.name.familyName}` : 'Google User'),
              picture: profile.photos && profile.photos[0]?.value
            });

            return done(null, newUser);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  } else {
    console.log('Google OAuth credentials not found. Google authentication is disabled.');
  }

  // Kiểm tra xem các giá trị Facebook OAuth có được cấu hình không
  const facebookAppID = process.env.FACEBOOK_APP_ID;
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;

  // Chỉ cấu hình Facebook OAuth nếu có đủ thông tin
  if (facebookAppID && facebookAppSecret) {
    // Facebook OAuth Strategy
    passport.use(
      new FacebookStrategy(
        {
          clientID: facebookAppID,
          clientSecret: facebookAppSecret,
          callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/auth/facebook/callback`,
          profileFields: ['id', 'displayName', 'photos', 'email']
        },
        async (
          accessToken: string, 
          refreshToken: string, 
          profile: FacebookProfile, 
          done: (error: Error | null, user?: IUser | false) => void
        ) => {
          try {
            // Check if user already exists
            let user = await User.findOne({ facebookId: profile.id });

            if (user) {
              // User exists, update profile data if needed
              if (profile.photos && profile.photos[0]?.value && user.picture !== profile.photos[0].value) {
                user.picture = profile.photos[0].value;
                await user.save();
              }
              return done(null, user);
            }

            // User doesn't exist, create new user
            const email = profile.emails && profile.emails[0]?.value;
            if (!email) {
              return done(new Error('Email not provided by Facebook OAuth'));
            }

            // Check if user with email already exists (but without Facebook ID)
            user = await User.findOne({ email });
            
            if (user) {
              // Link Facebook ID to existing user
              user.facebookId = profile.id;
              if (profile.photos && profile.photos[0]?.value) {
                user.picture = profile.photos[0].value;
              }
              await user.save();
              return done(null, user);
            }

            // Create new user
            const newUser = await User.create({
              facebookId: profile.id,
              email,
              name: profile.displayName || 'Facebook User',
              picture: profile.photos && profile.photos[0]?.value
            });

            return done(null, newUser);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  } else {
    console.log('Facebook OAuth credentials not found. Facebook authentication is disabled.');
  }
} 