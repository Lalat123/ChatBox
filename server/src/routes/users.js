const express = require('express');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/database');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, avatar_color, real_avatar_url, status FROM users');
    res.json(result.rows);
  } catch(e) {
    res.status(500).json({error: 'Server error'});
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me/profile', upload.single('avatar'), async (req, res) => {
  try {
    const { bio } = req.body;
    let real_avatar_url = undefined;

    if (req.file) {
      real_avatar_url = req.file.path; // Cloudinary URL
    }

    if (bio !== undefined && real_avatar_url !== undefined) {
      await db.query('UPDATE users SET bio = $1, real_avatar_url = $2 WHERE id = $3', [bio, real_avatar_url, req.user.userId]);
    } else if (bio !== undefined) {
      await db.query('UPDATE users SET bio = $1 WHERE id = $2', [bio, req.user.userId]);
    } else if (real_avatar_url !== undefined) {
      await db.query('UPDATE users SET real_avatar_url = $1 WHERE id = $2', [real_avatar_url, req.user.userId]);
    }

    const updatedUser = await User.findById(req.user.userId);
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
