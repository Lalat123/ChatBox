const express = require('express');
const Message = require('../models/Message');
const Reaction = require('../models/Reaction');
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();
router.use(authMiddleware);

router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;
    const result = await db.query('UPDATE messages SET content = $1, edited = true WHERE id = $2 AND user_id = $3', [content, req.params.id, req.user.userId]);
    
    if (result.rowCount === 0) return res.status(403).json({ error: 'Unauthorized or not found' });
    
    const updatedMessage = await Message.findById(req.params.id);
    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM messages WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    if (result.rowCount === 0) return res.status(403).json({ error: 'Unauthorized or not found' });
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/reactions', async (req, res) => {
  try {
    const { emoji } = req.body;
    const reactions = await Reaction.add(req.params.id, req.user.userId, emoji);
    res.json(reactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/reactions/:emoji', async (req, res) => {
  try {
    const reactions = await Reaction.remove(req.params.id, req.user.userId, req.params.emoji);
    res.json(reactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
