const { admin } = require('../config/firebase');
const { userService } = require('../services/firebaseService');

/**
 * Firebase Auth Middleware
 * Verifies Firebase ID tokens and attaches user info to request
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth: No token provided');
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const idToken = authHeader.replace('Bearer ', '');
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('Auth: Firebase Admin not initialized');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
    }
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Auth: Token verified for user:', decodedToken.uid);
    
    // Get user from database (source of truth for roles)
    const user = await userService.findById(decodedToken.uid);
    
    // SECURITY: Do NOT auto-create users here
    // Users must be created via /auth/register endpoint
    // This ensures role is only set during registration
    
    // Attach user info to request
    req.userId = decodedToken.uid;
    req.user = user ? {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: user.role || 'user',
      ...user,
    } : {
      // User not in DB yet (will be created via /auth/register)
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Usuario',
      role: 'user', // Default until registered
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.code || error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

/**
 * Optional Auth Middleware
 * Attaches user info if token is valid, but doesn't block if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.replace('Bearer ', '');
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      let user = await userService.findById(decodedToken.uid);
      
      if (!user) {
        user = await userService.createFromFirebase({
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Usuario',
        });
      }
      
      req.userId = decodedToken.uid;
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: user.role || 'user',
        ...user,
      };
    }
    next();
  } catch (error) {
    // Token invalid or expired, continue without auth
    next();
  }
};

/**
 * Role-based authorization middleware
 * Use after auth middleware to check user roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }
    
    next();
  };
};

module.exports = { auth, optionalAuth, requireRole };
