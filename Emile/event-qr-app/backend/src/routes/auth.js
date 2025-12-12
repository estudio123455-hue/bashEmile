const express = require('express');
const { auth } = require('../middleware/auth');
const { userService } = require('../services/firebaseService');

const router = express.Router();

// Helper to format user response with premium status
const formatUserResponse = (user, premiumStatus) => ({
  id: user.id || user.uid,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  premium: user.premium || null,
  premiumStatus: premiumStatus || { status: 'none', daysRemaining: 0, canPublish: false },
});

/**
 * POST /api/auth/register
 * Register a new user (all users start with 10-day free trial)
 */
router.post('/register', auth, async (req, res) => {
  try {
    const existingUser = await userService.findById(req.userId);
    
    if (existingUser) {
      return res.json({
        success: true,
        data: {
          user: formatUserResponse(existingUser, req.user.premiumStatus),
        },
        message: 'User already registered',
      });
    }
    
    // New user gets 10-day free trial
    const newUser = await userService.createFromFirebase({
      uid: req.userId,
      email: req.user.email,
      name: req.user.name || req.user.email?.split('@')[0] || 'Usuario',
    });
    
    // Calculate premium status for new user
    const premiumStatus = userService.getPremiumStatus(newUser);
    
    res.status(201).json({
      success: true,
      data: {
        user: formatUserResponse(newUser, premiumStatus),
      },
      message: 'User registered successfully. You have a 10-day free trial!',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Error registering user',
    });
  }
});

/**
 * POST /api/auth/sync
 * Sync Firebase user with backend database
 * Returns current premium status calculated by backend
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user: formatUserResponse(user, user.premiumStatus),
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Error syncing user',
    });
  }
});

// GET /api/auth/me - Get current user profile with premium status
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: formatUserResponse(req.user, req.user.premiumStatus),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching user',
    });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await userService.update(req.userId, updateData);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const premiumStatus = userService.getPremiumStatus(user);

    res.json({
      success: true,
      data: formatUserResponse(user, premiumStatus),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating profile',
    });
  }
});

/**
 * POST /api/auth/activate-premium
 * Activate premium for current user (called after payment verification)
 * Changes status from trial/expired to active (permanent)
 */
router.post('/activate-premium', auth, async (req, res) => {
  try {
    const updatedUser = await userService.activatePremium(req.userId);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        user: formatUserResponse(updatedUser, { status: 'active', daysRemaining: null, canPublish: true }),
      },
      message: 'Premium activated successfully',
    });
  } catch (error) {
    console.error('Activate premium error:', error);
    res.status(500).json({
      success: false,
      error: 'Error activating premium',
    });
  }
});

module.exports = router;
