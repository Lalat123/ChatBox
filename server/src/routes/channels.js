const express = require('express');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/:id/messages', async (req, res) => {
  try {
    const { cursor } = req.query;
    const messages = await Message.getByChannel(req.params.id, cursor ? parseInt(cursor) : 0);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Channel.delete(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedChannel = await Channel.update(req.params.id, { name: req.body.name });
    res.json(updatedChannel);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
