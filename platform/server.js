require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/chat', require('./routes/chat'));
app.use('/api/products', require('./routes/products'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/conversations', require('./routes/conversations'));

app.get('/', (_req, res) => res.redirect('/dashboard/'));

app.listen(PORT, () => {
  console.log(`ChatPod platform → http://localhost:${PORT}`);
});
