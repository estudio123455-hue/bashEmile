const express = require('express');
const { auth } = require('../middleware/auth');
const { userService } = require('../services/firebaseService');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user (all users start as free)
 */
router.post('/register', auth, async (req, res) => {
  try {
    const existingUser = await userService.findById(req.userId);
    
    if (existingUser) {
      return res.json({
        success: true,
        data: {
          user: {
            id: existingUser.id || req.userId,
            name: existingUser.name,
            email: existingUser.email,
            isPremium: existingUser.isPremium || false,
            avatar: existingUser.avatar,
          },
        },
        message: 'User already registered',
      });
    }
    
    const newUser = await userService.createFromFirebase({
      uid: req.userId,
      email: req.user.email,
      name: req.user.name || req.user.email?.split('@')[0] || 'Usuario',
    });
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id || req.userId,
          name: newUser.name,
          email: newUser.email,
          isPremium: newUser.isPremium || false,
          avatar: newUser.avatar,
        },
      },
      message: 'User registered successfully',
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
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id || user.uid || req.userId,
          name: user.name,
          email: user.email,
          isPremium: user.isPremium || false,
          avatar: user.avatar,
        },
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

// GET /api/auth/me - Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user.id || req.user.uid,
        name: req.user.name,
        email: req.user.email,
        isPremium: req.user.isPremium || false,
        avatar: req.user.avatar,
      },
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

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium || false,
        avatar: user.avatar,
      },
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
 * In production, this should be called from a webhook after payment confirmation
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
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          isPremium: true,
        },
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
