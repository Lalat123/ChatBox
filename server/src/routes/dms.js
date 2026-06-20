const express = require('express');
const { DMChannel, DMMessage } = require('../models/DM');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const { upload } = require('../config/cloudinary');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const dms = await DMChannel.findByUser(req.user.userId);
    res.json(dms);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:userId', async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);
    if (otherUserId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot DM yourself' });
    }
    
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) return res.status(404).json({ error: 'User not found' });

    const channelId = await DMChannel.findOrCreate(req.user.userId, otherUserId);
    
    res.json({
      id: channelId,
      other_user_id: otherUser.id,
      other_username: otherUser.username,
      avatar_color: otherUser.avatar_color,
      real_avatar_url: otherUser.real_avatar_url,
      status: otherUser.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await DMMessage.getByChannel(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const message = await DMMessage.create({
      dm_channel_id: req.params.id,
      user_id: req.user.userId,
      content: req.body.content || '',
      attachment_url: req.file.path,
      attachment_type: req.file.mimetype
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
