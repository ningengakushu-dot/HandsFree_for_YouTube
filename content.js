(() => {
  'use strict';

  // --- State ---
  let recognition = null;
  let isListening = false;
  let wasMutedByExtension = false;

  // --- YouTube Player Helpers ---

  function getVideo() {
    return document.querySelector('video.html5-main-video') || document.querySelector('video');
  }

  function getPlayer() {
    return document.getElementById('movie_player');
  }

  function play() {
    const v = getVideo();
    if (v && v.paused) v.play();
  }

  function pause() {
    const v = getVideo();
    if (v && !v.paused) v.pause();
  }

  function setSpeed(rate) {
    const v = getVideo();
    if (!v) return;
    v.playbackRate = rate;
    if (rate >= 3) {
      v.muted = true;
      wasMutedByExtension = true;
      showToast(`再生速度: ${rate}x（ミュート）`);
    } else {
      // 3倍速未満に戻したらミュート解除
      if (wasMutedByExtension) {
        v.muted = false;
        wasMutedByExtension = false;
      }
      showToast(`再生速度: ${rate}x`);
    }
  }

  function seek(seconds) {
    const v = getVideo();
    if (v) v.currentTime += seconds;
    if (seconds >= 60) {
      showToast(`${seconds / 60}分スキップしました`);
    } else if (seconds > 0) {
      showToast(`${seconds}秒スキップしました`);
    }
  }

  function skipAd() {
    const btn =
      document.querySelector('.ytp-skip-ad-button') ||
      document.querySelector('.ytp-ad-skip-button') ||
      document.querySelector('.ytp-ad-skip-button-modern') ||
      document.querySelector('[id^="skip-button"]') ||
      document.querySelector('.ytp-skip-ad');
    if (btn) {
      btn.click();
      showToast('広告をスキップしました');
    } else {
      showToast('スキップボタンが見つかりません');
    }
  }


  // --- Mute control ---
  // 3倍速以上の時のみミュート

  function muteForRecognition() {
    const v = getVideo();
    if (!v || v.muted) return;
    if (v.playbackRate >= 3) {
      wasMutedByExtension = true;
      v.muted = true;
    }
  }

  function restoreFromMute() {
    const v = getVideo();
    if (!v || !wasMutedByExtension) return;
    if (v.playbackRate < 3) {
      v.muted = false;
      wasMutedByExtension = false;
    }
  }

  // --- Command Parsing ---

  function normalizeTranscript(transcript) {
    let text = transcript.trim();

    // 1. 全角を半角に変換
    text = text.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
               .replace(/．/g, '.');

    // 2. 漢数字・ひらがな数字を算用数字に変換
    const numMap = { 
      '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
      'いち': '1', 'に': '2', 'さん': '3', 'よん': '4', 'ご': '5', 'ろく': '6', 'なな': '7', 'はち': '8', 'きゅう': '9', 'じゅう': '10'
    };
    Object.keys(numMap).forEach(key => {
      text = text.replace(new RegExp(key, 'g'), numMap[key]);
    });

    // 3. 記号の除去（小数点・中黒は一旦残す）
    text = text.replace(/[。、!?！？]/g, '');
    text = text.replace(/[,点てん・]/g, '.');

    // 4. 一般的な丁寧語・語尾の除去
    text = text.replace(/(ください|おねがい|します|だよ|だよな)$/, '');

    return text;
  }

  function processCommand(transcript) {
    const text = normalizeTranscript(transcript);

    // Play / Start
    if (/(再生|スタート)/.test(text)) { showToast(`🎙 「${text}」`); return play(); }

    // Pause / Stop
    if (/(停止|ストップ|一時停止|ポーズ)/.test(text)) { showToast(`🎙 「${text}」`); return pause(); }

    // Speed: "2倍", "1.5倍速", "2速" など
    // 数値の間にスペースが入るケースに対応するため、[\d. ]+ を使用
    const speedMatch = text.match(/([\d. ]+)\s*(倍|倍速|速)/);
    if (speedMatch) {
      const rateStr = speedMatch[1].replace(/\s+/g, ''); // 数値内のスペースを除去
      const rate = parseFloat(rateStr);
      if (!isNaN(rate) && rate > 0 && rate <= 10) { showToast(`🎙 「${text}」`); return setSpeed(rate); }
    }

    // Speed reset
    if (/(解除)/.test(text)) { showToast(`🎙 「${text}」`); return setSpeed(1); }

    // Skip: "XX秒スキップ", "XX分スキップ"
    const secSkipMatch = text.match(/([\d]+)\s*秒\s*スキップ/);
    if (secSkipMatch) { showToast(`🎙 「${text}」`); return seek(parseInt(secSkipMatch[1], 10)); }

    const minSkipMatch = text.match(/([\d]+)\s*分\s*スキップ/);
    if (minSkipMatch) { showToast(`🎙 「${text}」`); return seek(parseInt(minSkipMatch[1], 10) * 60); }

    // Ad skip
    if (/広告スキップ/.test(text)) { showToast(`🎙 「${text}」`); return skipAd(); }

    // コマンドに一致しない音声は無視（スピーカー音声対策）
  }

  // --- Toast Notification ---

  let toastTimeout = null;

  function showToast(message) {
    let el = document.getElementById('yvc-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'yvc-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('yvc-toast-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      el.classList.remove('yvc-toast-visible');
    }, 2500);
  }

  // --- Speech Recognition ---
  // マイクON → ミュート → 連続認識（音声コマンドだけで操作）
  // マイクOFF → 認識停止 → ミュート解除（3倍速以上は維持）

  function startRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('このブラウザは音声認識に対応していません');
      return;
    }

    if (recognition) {
      recognition.abort();
      recognition = null;
    }

    // スピーカー音声の誤認識を防ぐためミュート
    muteForRecognition();

    recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening = true;
      updateMicButton();
      showToast('🎙 音声認識ON');
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          processCommand(event.results[i][0].transcript);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      showToast(`音声認識エラー: ${event.error}`);
    };

    recognition.onend = () => {
      // isListening中ならブラウザが勝手に止めたので再開
      if (isListening) {
        try {
          recognition.start();
        } catch {
          isListening = false;
          restoreFromMute();
          updateMicButton();
        }
      }
    };

    try {
      recognition.start();
    } catch {
      restoreFromMute();
      showToast('音声認識の開始に失敗しました');
    }
  }

  function stopRecognition() {
    isListening = false;
    if (recognition) {
      recognition.abort();
      recognition = null;
    }
    restoreFromMute();
    updateMicButton();
    showToast('🎙 音声認識OFF');
  }

  function toggleRecognition() {
    isListening ? stopRecognition() : startRecognition();
  }

  // --- Floating Mic Button ---

  let micBtn = null;

  function createMicButton() {
    if (document.getElementById('yvc-mic-btn')) return;

    micBtn = document.createElement('button');
    micBtn.id = 'yvc-mic-btn';
    micBtn.title = '音声認識 ON/OFF';
    micBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>`;
    micBtn.addEventListener('click', toggleRecognition);
    document.body.appendChild(micBtn);
  }

  function updateMicButton() {
    if (!micBtn) return;
    micBtn.classList.toggle('yvc-mic-active', isListening);
  }

  // --- Message listener for popup ---

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'GET_STATUS') {
      sendResponse({ listening: isListening });
    }
  });

  // --- Init ---

  function init() {
    if (location.pathname === '/watch' || getVideo()) {
      createMicButton();
    }
  }

  const observer = new MutationObserver(() => {
    if (location.pathname === '/watch' || getVideo()) {
      createMicButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
