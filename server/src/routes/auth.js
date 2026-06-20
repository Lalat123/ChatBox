const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

const generateColor = () => {
  const colors = ['#6C63FF', '#FF6584', '#00D4AA', '#F9A826', '#43E0B1', '#FF9F43'];
  return colors[Math.floor(Math.random() * colors.length)];
};

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const avatar_color = generateColor();

    const userId = await User.create({ username, email, password_hash, avatar_color });
    const token = jwt.sign({ userId, username, email }, JWT_SECRET, { expiresIn: '7d' });

    // Save user details to a text file
    const logFilePath = path.join(__dirname, '../../registered_users.txt');
    const logEntry = `[${new Date().toISOString()}] Username: ${username}, Email: ${email}\n`;
    fs.appendFile(logFilePath, logEntry, (err) => {
      if (err) console.error('Failed to log user to file:', err);
    });

    res.status(201).json({ token, user: { id: userId, username, email, avatar_color } });
  } catch (error) {
    if (error.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar_color: user.avatar_color, real_avatar_url: user.real_avatar_url, bio: user.bio } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
