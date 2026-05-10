/**
 * ══════════════════════════════════════════════════
 *  Twitch OAuth Redirect Server — Static Overlay
 *  Запуск: node server.js
 *  Потрібен: Node.js (будь-яка версія >= 14)
 * ══════════════════════════════════════════════════
 *
 *  В Twitch Dev Console вкажи Redirect URL:
 *    http://localhost:3000/oauth
 *
 *  В settings.html вкажи те саме:
 *    http://localhost:3000/oauth
 */

const http = require('http');
const PORT = 3000;

// HTML сторінка яка повертає токен назад у settings.html через postMessage
const REDIRECT_PAGE = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Twitch OAuth — Redirect</title>
<style>
  body { background: #06090f; color: #dde6f0; font-family: monospace;
         display: flex; align-items: center; justify-content: center;
         height: 100vh; margin: 0; flex-direction: column; gap: 12px; }
  .box { background: #0d1522; border: 1px solid #162035; border-radius: 10px;
         padding: 28px 36px; text-align: center; max-width: 420px; }
  .ok  { color: #22c55e; font-size: 32px; }
  .err { color: #ef4444; font-size: 32px; }
  .title { font-size: 13px; letter-spacing: 3px; color: #06b6d4; margin: 10px 0 6px; }
  .sub   { font-size: 11px; color: #3d5470; }
</style>
</head>
<body>
<div class="box" id="box">
  <div id="icon">⏳</div>
  <div class="title" id="title">ОБРОБКА...</div>
  <div class="sub"   id="sub">Зачекай секунду</div>
</div>
<script>
  // Twitch повертає токен у фрагменті (#access_token=...) або query (?code=...)
  // Implicit flow (token) — у фрагменті
  var hash   = window.location.hash.slice(1);   // без #
  var search = window.location.search.slice(1); // без ?
  var raw    = hash || search;
  var params = {};
  raw.split('&').forEach(function(p){
    var kv = p.split('=');
    params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
  });

  var token = params['access_token'] || '';
  var error = params['error']        || '';

  if (token) {
    document.getElementById('icon').textContent  = '✅';
    document.getElementById('title').textContent = 'АВТОРИЗАЦІЯ УСПІШНА';
    document.getElementById('sub').textContent   = 'Передаємо токен у Settings... Вікно закриється автоматично.';
    // Передаємо токен у батьківське вікно (settings.html)
    if (window.opener) {
      window.opener.postMessage({ type: 'TWITCH_TOKEN', access_token: token }, '*');
    }
    setTimeout(function(){ window.close(); }, 1500);
  } else if (error) {
    document.getElementById('icon').textContent  = '❌';
    document.getElementById('title').textContent = 'ПОМИЛКА';
    document.getElementById('sub').textContent   = 'Причина: ' + (params['error_description'] || error);
    if (window.opener) {
      window.opener.postMessage({ type: 'TWITCH_ERROR', error: error, description: params['error_description'] || '' }, '*');
    }
    setTimeout(function(){ window.close(); }, 3000);
  } else {
    document.getElementById('icon').textContent  = '⚠';
    document.getElementById('title').textContent = 'ПОРОЖНЯ ВІДПОВІДЬ';
    document.getElementById('sub').textContent   = 'Токен не знайдено у URL. Спробуй ще раз.';
  }
</script>
</body>
</html>`;

// Проста HTML сторінка-заглушка для кореня /
const ROOT_PAGE = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>OAuth Server</title>
<style>body{background:#06090f;color:#dde6f0;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
.box{background:#0d1522;border:1px solid #162035;border-radius:10px;padding:28px 36px;text-align:center;}
code{background:#101c2e;padding:3px 8px;border-radius:4px;color:#06b6d4;font-size:12px;}</style>
</head>
<body>
<div class="box">
  <div style="font-size:24px;margin-bottom:10px">🤖</div>
  <div style="font-size:12px;letter-spacing:3px;color:#06b6d4;margin-bottom:8px">OAUTH SERVER</div>
  <div style="font-size:11px;color:#3d5470">Сервер запущено на порту <code>${PORT}</code><br>
  Redirect endpoint: <code>http://localhost:${PORT}/oauth</code></div>
</div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0].split('#')[0];

  // ── /oauth  — Twitch redirect сюди ──
  if (url === '/oauth' || url === '/oauth/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(REDIRECT_PAGE);
    return;
  }

  // ── /        — просто статус ──
  if (url === '/' || url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(ROOT_PAGE);
    return;
  }

  // ── 404 ──
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════╗');
  console.log('  ║   Twitch OAuth Server — запущено!      ║');
  console.log('  ╠════════════════════════════════════════╣');
  console.log(`  ║  Адреса:  http://localhost:${PORT}         ║`);
  console.log(`  ║  Redirect: http://localhost:${PORT}/oauth  ║`);
  console.log('  ╠════════════════════════════════════════╣');
  console.log('  ║  В Twitch Dev Console вкажи:           ║');
  console.log(`  ║  http://localhost:${PORT}/oauth            ║`);
  console.log('  ║  В settings.html теж це саме           ║');
  console.log('  ╚════════════════════════════════════════╝');
  console.log('');
  console.log('  Зупинити: Ctrl+C');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ⚠ Порт ${PORT} вже зайнятий!`);
    console.error(`  Спробуй змінити PORT у server.js на інший (напр. 3001)\n`);
  } else {
    console.error('  Помилка сервера:', err.message);
  }
  process.exit(1);
});
