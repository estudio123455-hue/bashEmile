const { admin } = require('../config/firebase');
const { userService } = require('../services/firebaseService');

// Calculate premium status from user data
const calculatePremiumStatus = (user) => {
  if (!user) return { status: 'none', daysRemaining: 0, canPublish: false };
  
  // If user has active premium (paid)
  if (user.premium?.status === 'active') {
    return { status: 'active', daysRemaining: null, canPublish: true };
  }
  
  // If user is on trial
  if (user.premium?.status === 'trial' && user.premium?.trialEndsAt) {
    const now = new Date();
    const trialEnd = new Date(user.premium.trialEndsAt);
    const diffMs = trialEnd - now;
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 0) {
      return { status: 'trial', daysRemaining, canPublish: true };
    } else {
      return { status: 'expired', daysRemaining: 0, canPublish: false };
    }
  }
  
  // Legacy: check old isPremium flag
  if (user.isPremium === true) {
    return { status: 'active', daysRemaining: null, canPublish: true };
  }
  
  return { status: 'expired', daysRemaining: 0, canPublish: false };
};

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
    
    // Calculate premium status from database
    const premiumStatus = calculatePremiumStatus(user);
    
    // Attach user info to request
    req.userId = decodedToken.uid;
    req.user = user ? {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...user,
      premiumStatus, // { status, daysRemaining, canPublish }
    } : {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Usuario',
      premiumStatus: { status: 'none', daysRemaining: 0, canPublish: false },
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
      
      const premiumStatus = calculatePremiumStatus(user);
      
      req.userId = decodedToken.uid;
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        ...user,
        premiumStatus,
      };
    }
    next();
  } catch (error) {
    // Token invalid or expired, continue without auth
    next();
  }
};

/**
 * Premium authorization middleware
 * Use after auth middleware to check if user can publish events
 * Allows: trial (with days remaining) or active (paid)
 * Blocks: expired or none
 */
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }
  
  // SECURITY: Premium status is calculated from database, never from frontend
  const { status, daysRemaining, canPublish } = req.user.premiumStatus || {};
  
  if (!canPublish) {
    let errorMessage = 'Premium subscription required to publish events';
    
    if (status === 'expired') {
      errorMessage = 'Your trial has expired. Please upgrade to Premium to continue publishing events.';
    }
    
    return res.status(403).json({
      success: false,
      error: errorMessage,
      code: 'PREMIUM_REQUIRED',
      premiumStatus: { status, daysRemaining },
    });
  }
  
  next();
};

module.exports = { auth, optionalAuth, requirePremium };
