const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const connectPg = require('connect-pg-simple');
const { storage } = require('./storage');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Session configuration
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'session-secret-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

// JWT Token functions
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}

function verifyToken(token, secret = JWT_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

// Passport Local Strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await storage.getUserByEmail(profile.emails[0].value);
      
      if (!user) {
        // Create new user from Google profile
        user = await storage.createUser({
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          profileImageUrl: profile.photos[0].value,
          googleId: profile.id,
          isVerified: true
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'access') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.userId = decoded.userId;
  next();
};

// Optional authentication (allows both authenticated and guest users)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.type === 'access') {
      req.userId = decoded.userId;
    }
  }
  
  next();
};

// Setup authentication routes
function setupAuth(app) {
  // Session middleware
  app.use(getSession());
  
  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Register route
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isVerified: false
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Login route
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || 'Authentication failed' });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        accessToken,
        refreshToken
      });
    })(req, res, next);
  });

  // Google OAuth routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login' }),
      (req, res) => {
        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(req.user.id);
        
        // Redirect with tokens (in production, use secure cookies or redirect to frontend with tokens)
        res.redirect(`/?accessToken=${accessToken}&refreshToken=${refreshToken}`);
      }
    );
  }

  // Refresh token route
  app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = verifyToken(refreshToken, JWT_REFRESH_SECRET);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(decoded.userId);
    
    res.json(tokens);
  });

  // Get current user route
  app.get('/api/auth/user', authenticateJWT, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });
}

module.exports = {
  setupAuth,
  authenticateJWT,
  optionalAuth,
  generateTokens,
  verifyToken
};