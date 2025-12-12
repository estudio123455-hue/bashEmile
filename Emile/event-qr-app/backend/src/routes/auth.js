const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { userService } = require('../services/firebaseService');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with a specific role
 * Called ONLY during registration - role is immutable after this
 * Requires Firebase ID token in Authorization header
 */
router.post('/register', auth, async (req, res) => {
  try {
    const { role } = req.body;
    
    // Check if user already exists in database
    const existingUser = await userService.findById(req.userId);
    
    if (existingUser) {
      // User already registered - return existing data, DO NOT modify role
      console.log('Register: User already exists, returning existing data. Role:', existingUser.role);
      return res.json({
        success: true,
        data: {
          user: {
            id: existingUser.id || req.userId,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            avatar: existingUser.avatar,
          },
        },
        message: 'User already registered',
      });
    }
    
    // New user - create with specified role (only time role can be set)
    const validRole = ['user', 'organizer'].includes(role) ? role : 'user';
    
    const newUser = await userService.createFromFirebase({
      uid: req.userId,
      email: req.user.email,
      name: req.user.name || req.user.email?.split('@')[0] || 'Usuario',
      role: validRole, // Role is set ONLY here, during registration
    });
    
    console.log('Register: New user created with role:', validRole);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id || req.userId,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
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
 * Called after Firebase Auth login on frontend
 * NEVER modifies role - only reads existing user data
 * Requires Firebase ID token in Authorization header
 */
router.post('/sync', auth, async (req, res) => {
  try {
    // SECURITY: Ignore any role sent from frontend
    // Role is ONLY set during registration via /auth/register
    
    const user = req.user;
    
    console.log('Sync: User', req.userId, 'role:', user?.role);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id || user.uid || req.userId,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
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
