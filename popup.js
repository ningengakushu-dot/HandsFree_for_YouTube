(async () => {
  const statusEl = document.getElementById('status');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.includes('youtube.com')) {
    statusEl.className = 'status inactive';
    statusEl.textContent = 'YouTube ページを開いてください';
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
    if (response && response.listening) {
      statusEl.className = 'status active';
      statusEl.textContent = '🎙 音声認識中...';
    } else {
      statusEl.className = 'status inactive';
      statusEl.textContent = '待機中 — ページ上のマイクボタンで開始';
    }
  } catch {
    statusEl.className = 'status error';
    statusEl.textContent = 'ページを再読み込みしてください';
  }
})();
