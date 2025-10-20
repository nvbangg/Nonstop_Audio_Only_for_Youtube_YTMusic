const injectionEvent = new Event("injection_script_communication");

const CSS = `.html5-video-player,ytmusic-player{background-color:black!important;border-radius:10px!important}.html5-video-player video{opacity:0!important}.html5-video-player .html5-video-container .webgl,.html5-video-player .ytp-webgl-spherical-control{display:none!important}.html5-video-player video[disableremoteplayback=""]{display:block!important}#song-image img{display:none!important}`;

function injectElement(tag, id, attrs = {}) {
  if (document.getElementById(id)) return;
  const el = document.createElement(tag);
  el.id = id;
  Object.assign(el, attrs);
  document.documentElement.appendChild(el);
}

function toggleFeature(enabled) {
  sessionStorage.setItem("youtube_nonstop_video_blocked", enabled);
  if (enabled) {
    injectElement("script", "youtube_nonstop_video_handler", {
      src: chrome.runtime.getURL("video_handler.js"),
    });
    injectElement("style", "youtube_nonstop_video_styles", {
      textContent: CSS,
    });
  } else {
    [
      "youtube_nonstop_video_styles",
      "youtube_nonstop_player_background",
    ].forEach((id) => document.getElementById(id)?.remove());
  }
  document.dispatchEvent(injectionEvent);
}

async function apply() {
  try {
    const response = await chrome.runtime.sendMessage({ funct: 0 });
    if (!response) return;

    const isYTMusic = location.hostname.includes("music.youtube.com");
    chrome.runtime.sendMessage(
      { funct: 1, isYTMusic },
      () => chrome.runtime.lastError
    );

    const values = await chrome.storage.local.get(null);
    const defaultEnabled = isYTMusic
      ? values.youtube_music_video
      : values.youtube_video;
    const enabled = values.sstabs?.[response.id]?.enabled ?? defaultEnabled;

    toggleFeature(enabled);

    const nonstop = isYTMusic
      ? values.youtube_music_nonstop
      : values.youtube_nonstop;
    if (nonstop) {
      injectElement("script", "youtube_nonstop_inject", {
        src: chrome.runtime.getURL("nonstop_inject.js"),
      });
    }
  } catch {}
}

chrome.runtime.onMessage.addListener(() => apply());
apply();
