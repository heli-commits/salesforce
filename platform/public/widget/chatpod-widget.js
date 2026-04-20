/**
 * ChatPod AI Widget — embeddable on any WooCommerce site.
 * Usage: <script src="/widget/chatpod-widget.js" data-store="my-store" data-api="https://your-chatpod-server.com"></script>
 */
(function () {
  'use strict';

  const API_BASE = document.currentScript?.getAttribute('data-api') || window.location.origin;
  const STORE_ID = document.currentScript?.getAttribute('data-store') || 'default';

  // ── session ──────────────────────────────────────────────────────────────
  const SESSION_KEY = `chatpod_session_${STORE_ID}`;
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = 'sess-' + Math.random().toString(36).slice(2);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  let messageHistory = [];

  // ── styles ───────────────────────────────────────────────────────────────
  const STYLES = `
    #cp-launcher {
      position: fixed;
      bottom: 24px;
      left: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c9a227, #f0c040);
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      cursor: pointer;
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      border: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #cp-launcher:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.28); }

    #cp-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px; height: 18px;
      background: #ef4444;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      display: flex; align-items: center; justify-content: center;
    }

    #cp-modal {
      position: fixed;
      bottom: 98px;
      left: 24px;
      width: 420px;
      max-width: calc(100vw - 32px);
      height: 580px;
      max-height: calc(100vh - 120px);
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 12px 60px rgba(0,0,0,0.18);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Heebo', 'Arial', sans-serif;
      direction: rtl;
      transform: scale(0.95) translateY(8px);
      opacity: 0;
      transition: transform 0.22s ease, opacity 0.22s ease;
      pointer-events: none;
    }
    #cp-modal.cp-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    #cp-header {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    #cp-avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #c9a227, #f0c040);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    #cp-header-text { flex: 1; }
    #cp-header-title { font-size: 14px; font-weight: 700; }
    #cp-header-sub { font-size: 11px; color: rgba(255,255,255,0.6); }
    .cp-header-btn {
      background: none;
      border: none;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
      line-height: 1;
      transition: color 0.15s;
    }
    .cp-header-btn:hover { color: #fff; }

    #cp-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
      background: #faf9f6;
    }
    #cp-messages::-webkit-scrollbar { width: 4px; }
    #cp-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

    .cp-msg {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 88%;
    }
    .cp-msg.cp-bot { align-self: flex-start; }
    .cp-msg.cp-user { align-self: flex-end; flex-direction: row-reverse; }

    .cp-msg-avatar {
      width: 30px; height: 30px;
      background: linear-gradient(135deg, #c9a227, #f0c040);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }

    .cp-bubble {
      padding: 10px 14px;
      border-radius: 18px;
      font-size: 13.5px;
      line-height: 1.55;
      max-width: 100%;
    }
    .cp-bot .cp-bubble {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-bottom-right-radius: 6px;
      color: #1a1a1a;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .cp-user .cp-bubble {
      background: linear-gradient(135deg, #c9a227, #f0c040);
      color: #1a1a1a;
      font-weight: 600;
      border-bottom-left-radius: 6px;
    }

    .cp-typing {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 4px 2px;
    }
    .cp-typing span {
      width: 7px; height: 7px;
      background: #9ca3af;
      border-radius: 50%;
      animation: cpBounce 1.2s infinite;
    }
    .cp-typing span:nth-child(2) { animation-delay: 0.2s; }
    .cp-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cpBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-5px); }
    }

    .cp-products {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 4px 0 8px;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }
    .cp-products::-webkit-scrollbar { height: 3px; }
    .cp-products::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

    .cp-product-card {
      min-width: 140px;
      max-width: 140px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      scroll-snap-align: start;
      transition: box-shadow 0.15s;
      flex-shrink: 0;
    }
    .cp-product-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .cp-product-img {
      width: 100%;
      height: 90px;
      object-fit: cover;
      display: block;
    }
    .cp-product-info { padding: 8px 10px; }
    .cp-product-name { font-size: 12px; font-weight: 700; line-height: 1.3; margin-bottom: 4px; }
    .cp-product-price { font-size: 13px; font-weight: 800; color: #c9a227; }

    .cp-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 0 4px;
    }
    .cp-suggestion {
      background: #fff;
      border: 1.5px solid #c9a227;
      color: #7a5e0a;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 20px;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    .cp-suggestion:hover { background: #fffbeb; }

    #cp-footer {
      padding: 12px 14px;
      border-top: 1px solid #f3f4f6;
      background: #fff;
      flex-shrink: 0;
    }
    #cp-input-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    #cp-input {
      flex: 1;
      border: 1.5px solid #e5e7eb;
      border-radius: 24px;
      padding: 9px 16px;
      font-size: 13.5px;
      font-family: 'Heebo', 'Arial', sans-serif;
      direction: rtl;
      outline: none;
      transition: border-color 0.15s;
      resize: none;
      line-height: 1.4;
    }
    #cp-input:focus { border-color: #c9a227; }
    #cp-send {
      width: 38px; height: 38px;
      background: linear-gradient(135deg, #c9a227, #f0c040);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
      transition: transform 0.15s;
    }
    #cp-send:hover { transform: scale(1.08); }
    #cp-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    #cp-powered {
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      margin-top: 6px;
    }
    #cp-powered a { color: #9ca3af; text-decoration: none; }
    #cp-powered a:hover { color: #c9a227; }
  `;

  // ── inject font + styles ──────────────────────────────────────────────────
  if (!document.querySelector('#cp-font')) {
    const link = document.createElement('link');
    link.id = 'cp-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap';
    document.head.appendChild(link);
  }
  const style = document.createElement('style');
  style.textContent = STYLES;
  document.head.appendChild(style);

  // ── DOM ───────────────────────────────────────────────────────────────────
  const launcher = document.createElement('button');
  launcher.id = 'cp-launcher';
  launcher.innerHTML = '🌾<div id="cp-badge" style="display:none">1</div>';
  launcher.title = 'פתח צ\'אט';

  const modal = document.createElement('div');
  modal.id = 'cp-modal';
  modal.innerHTML = `
    <div id="cp-header">
      <div id="cp-avatar">🌾</div>
      <div id="cp-header-text">
        <div id="cp-header-title">עוזר מכירות ChatPod</div>
        <div id="cp-header-sub">מחובר · בד"כ עונה מיידית</div>
      </div>
      <button class="cp-header-btn" id="cp-reload" title="אתחל שיחה">↺</button>
      <button class="cp-header-btn" id="cp-close" title="סגור">✕</button>
    </div>
    <div id="cp-messages"></div>
    <div id="cp-footer">
      <div id="cp-input-row">
        <input id="cp-input" type="text" placeholder="כתוב הודעה..." autocomplete="off" />
        <button id="cp-send">➤</button>
      </div>
      <div id="cp-powered">Powered by <a href="https://chatpod-ai.com" target="_blank">chatpod ai</a></div>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(modal);

  // ── refs ──────────────────────────────────────────────────────────────────
  const messagesEl = modal.querySelector('#cp-messages');
  const inputEl = modal.querySelector('#cp-input');
  const sendBtn = modal.querySelector('#cp-send');
  let isOpen = false;

  // ── toggle ────────────────────────────────────────────────────────────────
  function openModal() {
    modal.classList.add('cp-open');
    isOpen = true;
    launcher.querySelector('#cp-badge').style.display = 'none';
    if (messageHistory.length === 0) showWelcome();
    setTimeout(() => inputEl.focus(), 250);
  }
  function closeModal() {
    modal.classList.remove('cp-open');
    isOpen = false;
  }

  launcher.addEventListener('click', () => isOpen ? closeModal() : openModal());
  modal.querySelector('#cp-close').addEventListener('click', closeModal);
  modal.querySelector('#cp-reload').addEventListener('click', resetChat);

  // ── welcome ───────────────────────────────────────────────────────────────
  const SUGGESTIONS = ['כמה קלוריות בתמר?', 'מה מומלץ למתנה?', 'אני מחפש מוצר בריאותי', 'מה במבצע?'];

  function showWelcome() {
    appendBotMessage('שלום! אני אהוד, העוזר הוירטואלי שלנו. 👋 כיף שבאת!\nאשמח לעזור לך למצוא את המוצר המושלם, לענות על שאלות, או לסייע בכל עניין אחר.', SUGGESTIONS);
  }

  // ── message helpers ───────────────────────────────────────────────────────
  function appendBotMessage(text, suggestions = [], products = []) {
    const wrap = document.createElement('div');
    wrap.className = 'cp-msg cp-bot';

    const avatar = document.createElement('div');
    avatar.className = 'cp-msg-avatar';
    avatar.textContent = '🌾';

    const inner = document.createElement('div');
    inner.style.display = 'flex';
    inner.style.flexDirection = 'column';
    inner.style.gap = '8px';
    inner.style.maxWidth = '100%';

    const bubble = document.createElement('div');
    bubble.className = 'cp-bubble';
    bubble.style.whiteSpace = 'pre-wrap';
    bubble.textContent = text;
    inner.appendChild(bubble);

    if (products.length > 0) {
      const row = document.createElement('div');
      row.className = 'cp-products';
      products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'cp-product-card';
        card.innerHTML = `
          <img class="cp-product-img" src="${p.image}" alt="${p.name}" loading="lazy" />
          <div class="cp-product-info">
            <div class="cp-product-name">${p.name}</div>
            <div class="cp-product-price">₪${p.price}</div>
          </div>
        `;
        card.addEventListener('click', () => sendMessage(`ספר לי יותר על ${p.name}`));
        row.appendChild(card);
      });
      inner.appendChild(row);
    }

    if (suggestions.length > 0) {
      const sugRow = document.createElement('div');
      sugRow.className = 'cp-suggestions';
      suggestions.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'cp-suggestion';
        btn.textContent = s;
        btn.addEventListener('click', () => sendMessage(s));
        sugRow.appendChild(btn);
      });
      inner.appendChild(sugRow);
    }

    wrap.appendChild(avatar);
    wrap.appendChild(inner);
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function appendUserMessage(text) {
    const wrap = document.createElement('div');
    wrap.className = 'cp-msg cp-user';
    const bubble = document.createElement('div');
    bubble.className = 'cp-bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'cp-msg cp-bot';
    wrap.id = 'cp-typing';
    wrap.innerHTML = `
      <div class="cp-msg-avatar">🌾</div>
      <div class="cp-bubble">
        <div class="cp-typing"><span></span><span></span><span></span></div>
      </div>
    `;
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function hideTyping() {
    const t = document.getElementById('cp-typing');
    if (t) t.remove();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ── send ──────────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const msg = (text || inputEl.value).trim();
    if (!msg) return;

    inputEl.value = '';
    appendUserMessage(msg);
    messageHistory.push({ role: 'user', content: msg });

    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messageHistory, sessionId })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      hideTyping();
      messageHistory.push({ role: 'assistant', content: data.message });
      appendBotMessage(data.message, [], data.products || []);
    } catch (err) {
      hideTyping();
      appendBotMessage('מצטער, נתקלתי בבעיה טכנית. אנא נסה שוב. 🙏');
      console.error('ChatPod error:', err);
    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  function resetChat() {
    messageHistory = [];
    messagesEl.innerHTML = '';
    showWelcome();
  }

  // ── events ────────────────────────────────────────────────────────────────
  sendBtn.addEventListener('click', () => sendMessage());
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // show badge after 5 seconds if not opened
  setTimeout(() => {
    if (!isOpen) {
      launcher.querySelector('#cp-badge').style.display = 'flex';
    }
  }, 5000);

})();
