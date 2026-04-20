const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const products = require('../data/products.json');
const conversations = require('../data/conversations.json');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `אתה עוזר מכירות AI עבור חנות WooCommerce ישראלית בשם "${process.env.STORE_NAME || 'שמחת הבקעה'}".
תפקידך לעזור ללקוחות למצוא מוצרים, לענות על שאלות, ולהמליץ על מוצרים רלוונטיים.

כללים:
- ענה תמיד בעברית
- היה ידידותי, מקצועי ואנרגטי
- כאשר מכיר מוצר רלוונטי מהקטלוג, המלץ עליו
- לציין מוצרים להמלצה, כלול בסוף התגובה תג: [PRODUCTS:מזהה1,מזהה2]
- אל תמציא מוצרים שאינם בקטלוג

קטלוג המוצרים הנוכחי:
${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, price: p.price, description: p.description, tags: p.tags })), null, 2)}`;

function parseProductTags(text) {
  const match = text.match(/\[PRODUCTS:([^\]]+)\]/);
  if (!match) return { message: text, productIds: [] };
  const productIds = match[1].split(',').map(s => s.trim());
  const message = text.replace(/\[PRODUCTS:[^\]]+\]/, '').trim();
  return { message, productIds };
}

router.post('/', async (req, res) => {
  const { messages, sessionId } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    });

    const raw = response.content[0].text;
    const { message, productIds } = parseProductTags(raw);
    const recommendedProducts = products.filter(p => productIds.includes(p.id));

    // Log conversation for analytics
    if (sessionId) {
      const existing = conversations.sessions.find(s => s.id === sessionId);
      if (existing) {
        existing.messageCount = (existing.messageCount || 0) + 2;
        existing.updatedAt = new Date().toISOString();
      }
    }

    res.json({ message, products: recommendedProducts });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'שגיאה בשירות ה-AI', details: err.message });
  }
});

module.exports = router;
