const express = require('express');
const Message = require('../models/Message');
const { authMiddleware } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.use(authMiddleware);

router.post('/:id/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const message = await Message.create({
      channel_id: req.params.id,
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
