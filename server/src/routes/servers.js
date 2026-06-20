const express = require('express');
const Server = require('../models/Server');
const Channel = require('../models/Channel');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const servers = await Server.findByUser(req.user.userId);
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, icon_color } = req.body;
    const serverId = await Server.create({ 
      name, 
      icon_color: icon_color || '#6C63FF', 
      owner_id: req.user.userId 
    });
    
    const servers = await Server.findByUser(req.user.userId);
    const newServer = servers.find(s => s.id === serverId);
    
    res.status(201).json(newServer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/channels', async (req, res) => {
  try {
    const channels = await Channel.findByServer(req.params.id);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/channels', async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const channelId = await Channel.create({
      server_id: req.params.id,
      name,
      description,
      category
    });
    const newChannel = await Channel.findById(channelId);
    res.status(201).json(newChannel);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const members = await Server.getMembers(req.params.id);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
