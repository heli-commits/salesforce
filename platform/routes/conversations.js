const express = require('express');
const router = express.Router();
const conversations = require('../data/conversations.json');

router.get('/', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const start = (page - 1) * limit;
  const sessions = conversations.sessions.slice(start, start + Number(limit));
  res.json({ sessions, total: conversations.sessions.length });
});

router.get('/:id', (req, res) => {
  const session = conversations.sessions.find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });
  res.json(session);
});

module.exports = router;
