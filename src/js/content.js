const SYNC_EVENT_NAME = "nao_runtime_sync";
const syncEvent = new Event(SYNC_EVENT_NAME);
const IS_MUSIC_SITE = location.hostname.includes("music.youtube.com");
const SITE_KEYS = IS_MUSIC_SITE
  ? { audio: "youtube_music_audio_only", nonstop: "youtube_music_nonstop" }
  : { audio: "youtube_audio_only", nonstop: "youtube_nonstop" };

function ensureAsset(id, kind, file) {
  if (document.getElementById(id)) return;
  const node = document.createElement(kind === "style" ? "link" : "script");
  node.id = id;
  if (kind === "style") {
    node.href = chrome.runtime.getURL(file);
    node.type = "text/css";
    node.rel = "stylesheet";
  } else {
    node.src = chrome.runtime.getURL(file);
  }
  document.documentElement.appendChild(node);
}

function applyRuntime() {
  chrome.runtime.sendMessage({ funct: 0 }, (meta) => {
    chrome.runtime.lastError;
    if (!meta) return;

    chrome.storage.local.get(null, (state) => {
      const overrides = state.sstabs || {};
      const defaultEnabled = state[SITE_KEYS.audio] === true;
      const audioOnly = overrides[meta.id] !== undefined ? !!overrides[meta.id].enabled : defaultEnabled;
      sessionStorage.setItem("youtube_nonstop_video_blocked", audioOnly ? "true" : "false");

      if (audioOnly) {
        ensureAsset("youtube_nonstop_video_handler", "script", "js/video_handler.js");
        ensureAsset("youtube_nonstop_video_styles", "style", "style.css");
      } else {
        const a = document.getElementById("youtube_nonstop_video_styles");
        const b = document.getElementById("youtube_nonstop_player_background");
        if (a) a.remove();
        if (b) b.remove();
      }

      if (state[SITE_KEYS.nonstop] === true) {
        ensureAsset("youtube_nonstop_inject", "script", "js/nonstop_inject.js");
      }

      document.dispatchEvent(syncEvent);
    });
  });
}

chrome.runtime.onMessage.addListener((request) => {
  if (request?.data !== 1 && request?.data !== 2) return;
  applyRuntime();
});

document.addEventListener("yt-navigate-finish", applyRuntime);
applyRuntime();
