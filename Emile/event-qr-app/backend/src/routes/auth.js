const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { userService } = require('../services/firebaseService');

const router = express.Router();

/**
 * POST /api/auth/sync
 * Sync Firebase user with backend database
 * Called after Firebase Auth login/register on frontend
 * Requires Firebase ID token in Authorization header
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const { role } = req.body; // Optional: allow setting role on first sync
    
    // User already exists (created by auth middleware if needed)
    let user = req.user;
    
    // If role is provided and user is new, update role
    if (role && ['user', 'organizer'].includes(role)) {
      user = await userService.update(req.userId, { role });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id || user.uid,
          name: user.name,
          email: user.email,
          role: user.role,
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
        role: req.user.role,
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

module.exports = router;
