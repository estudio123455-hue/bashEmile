const express = require('express');
const { auth } = require('../middleware/auth');
const { userService } = require('../services/firebaseService');

const router = express.Router();

/**
 * NEW BUSINESS MODEL: Commission-based monetization
 * - No Premium subscriptions
 * - All users can publish events for FREE
 * - Platform earns commission on ticket sales (8-10%)
 */

// Helper to format user response (simplified - no premium)
const formatUserResponse = (user) => ({
  id: user.id || user.uid,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', auth, async (req, res) => {
  try {
    const existingUser = await userService.findById(req.userId);
    
    if (existingUser) {
      return res.json({
        success: true,
        data: {
          user: formatUserResponse(existingUser),
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
        user: formatUserResponse(newUser),
      },
      message: 'Welcome to EventQR! You can now publish events for free.',
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
        user: formatUserResponse(user),
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
      data: formatUserResponse(req.user),
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
      data: formatUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating profile',
    });
  }
});

module.exports = router;
