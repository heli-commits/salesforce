const express = require('express');
const router = express.Router();

function generateDailySeries(startDate, days, baseMin, baseMax, spikes) {
  const data = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString('he-IL', { day: '2-digit', month: 'short' });
    const spike = spikes && spikes[i] ? spikes[i] : 0;
    const val = spike || Math.floor(Math.random() * (baseMax - baseMin) + baseMin);
    data.push({ label, value: val, date: d.toISOString().split('T')[0] });
  }
  return data;
}

router.get('/', (_req, res) => {
  const start = new Date('2026-03-25');

  const cartAdds = generateDailySeries(start, 27, 370, 650, {
    1: 8602, 2: 6734, 3: 4109, 4: 4900, 5: 3395, 6: 997
  });

  const purchases = generateDailySeries(start, 27, 4, 30, {
    0: 209, 1: 122, 2: 30, 3: 6, 9: 665, 15: 4, 16: 25, 17: 11, 21: 10
  });

  const clicks = generateDailySeries(start, 27, 0, 3, {
    3: 1, 15: 9, 23: 1
  });

  res.json({
    totals: {
      cartAdds: cartAdds.reduce((s, d) => s + d.value, 0),
      purchases: purchases.reduce((s, d) => s + d.value, 0),
      clicks: clicks.reduce((s, d) => s + d.value, 0),
      conversations: 312
    },
    series: { cartAdds, purchases, clicks }
  });
});

module.exports = router;
