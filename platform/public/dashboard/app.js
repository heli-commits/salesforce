const ORANGE = '#f97316';
const ORANGE_BG = 'rgba(249,115,22,0.12)';

function buildChart(canvasId, labels, values, label) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: ORANGE,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => items[0].label,
            label: item => `${label}: ${item.raw.toLocaleString('he-IL')}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Heebo', size: 11 }, color: '#9ca3af', maxRotation: 45 }
        },
        y: {
          grid: { color: '#f3f4f6' },
          ticks: { font: { family: 'Heebo', size: 11 }, color: '#9ca3af' }
        }
      }
    }
  });
}

async function loadDashboard() {
  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();

    // KPIs
    document.getElementById('totalCartAdds').textContent = data.totals.cartAdds.toLocaleString('he-IL');
    document.getElementById('totalPurchases').textContent = data.totals.purchases.toLocaleString('he-IL');
    document.getElementById('totalClicks').textContent = data.totals.clicks.toLocaleString('he-IL');
    document.getElementById('totalConversations').textContent = data.totals.conversations.toLocaleString('he-IL');

    // Chart totals
    document.getElementById('cartAddsTotal').textContent = `סה"כ: ${data.totals.cartAdds.toLocaleString('he-IL')}`;
    document.getElementById('purchasesTotal').textContent = `סה"כ: ${data.totals.purchases.toLocaleString('he-IL')}`;
    document.getElementById('clicksTotal').textContent = `סה"כ: ${data.totals.clicks.toLocaleString('he-IL')}`;

    const labels = data.series.cartAdds.map(d => d.label);
    buildChart('cartAddsChart', labels, data.series.cartAdds.map(d => d.value), 'מוצרים לעגלה');
    buildChart('purchasesChart', labels, data.series.purchases.map(d => d.value), 'רכישות');
    buildChart('clicksChart', labels, data.series.clicks.map(d => d.value), 'קליקים');
  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
}

loadDashboard();
