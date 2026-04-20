const express = require('express');
const router = express.Router();
const products = require('../data/products.json');

router.get('/', (_req, res) => res.json(products));

router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

router.get('/search/:query', (req, res) => {
  const q = req.params.query.toLowerCase();
  const results = products.filter(p =>
    p.name.includes(q) || p.description.includes(q) || p.tags.some(t => t.includes(q))
  );
  res.json(results);
});

module.exports = router;
