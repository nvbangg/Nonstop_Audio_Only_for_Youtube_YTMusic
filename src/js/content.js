const event = new Event("injection_script_communication");

function isYoutubeMusic() {
  return window.location.hostname.indexOf("music.youtube.com") !== -1;
}

function insertVideoHandler() {
  if (!document.getElementById("youtube_nonstop_video_handler")) {
    let script = document.createElement("script");
    script.src = chrome.runtime.getURL("js/video_handler.js");
    script.id = "youtube_nonstop_video_handler";
    document.documentElement.appendChild(script);
  }
}

function insertStylesheet() {
  if (!document.getElementById("youtube_nonstop_video_styles")) {
    let link = document.createElement("link");
    link.href = chrome.runtime.getURL("style.css");
    link.id = "youtube_nonstop_video_styles";
    link.type = "text/css";
    link.rel = "stylesheet";
    document.documentElement.appendChild(link);
  }
}

function removeStylesheet() {
  let elem = document.getElementById("youtube_nonstop_video_styles");
  if (elem) elem.remove();
  elem = document.getElementById("youtube_nonstop_player_background");
  if (elem) elem.remove();
}

function saveState(enabled) {
  sessionStorage.setItem("youtube_nonstop_video_blocked", enabled ? "true" : "false");
}

function restoreVideo() {
  let youtubeURLpattern = /(www\.youtube\.com|music\.youtube\.com)/;
  let video = document.querySelector("video");

  if (video && video.src !== "" && !youtubeURLpattern.test(video.src)) {
    if (video.dataset.musicurl && video.dataset.musicurl === video.src && video.dataset.originalurl) {
      let paused = video.paused;
      video.pause();
      let currentTime = video.currentTime;

      video.src = video.dataset.originalurl;
      video.load();
      checkAndFixVideoError(video, currentTime, paused);
      video.currentTime = currentTime;

      if (!paused) {
        try {
          video.parentNode.parentNode.playVideo();
        } catch (error) {}
      }

      delete video.dataset.originalurl;
      delete video.dataset.musicurl;
    }
  }
}

function checkAndFixVideoError(video, currentTime, paused) {
  setTimeout(() => {
    if (document.querySelector(".ytp-error")) {
      let errorRect = document.querySelector(".ytp-error").getBoundingClientRect();
      if (errorRect.width > 0 && errorRect.height > 0) {
        try {
          video.parentNode.parentNode.loadVideoById(video.parentNode.parentNode.getVideoData().video_id);
          video.currentTime = currentTime;
          if (paused) video.pause();
        } catch (error) {}
      }
    }
  }, 1000);
}

function urlMatchesTokens(url, tokens) {
  if (!tokens.length) return false;
  let lower = String(url).toLowerCase();
  let normalized = lower.replace(/&/g, "?");
  let stripped = lower.replace(/^https?:\/\//, "").replace(/^www\./, "");
  let strippedNorm = normalized.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return tokens.some((raw) => {
    let p = String(raw).trim().toLowerCase();
    if (!p) return false;
    return lower.includes(p) || normalized.includes(p) || stripped.includes(p) || strippedNorm.includes(p);
  });
}

function applyOptions(mustReload) {
  chrome.runtime.sendMessage({ funct: 0 }, (response) => {
    chrome.runtime.lastError;
    if (!response) return;
    let tabId = response.id;
    let isMusic = isYoutubeMusic();

    chrome.storage.local.get(null, (values) => {
      let sstabs = values.sstabs || {};

      let siteKey = isMusic ? "youtube_music_video" : "youtube_video";
      let siteEnabled = values[siteKey] !== false;

      let defaultEnabled = siteEnabled;
      if (!siteEnabled) {
        let tokens = (values.audio_only_tokens || []).filter(Boolean);
        if (tokens.length) {
          defaultEnabled = urlMatchesTokens(location.href, tokens);
        }
      }

      let enabled = sstabs[tabId] !== undefined ? sstabs[tabId].enabled : defaultEnabled;

      let wasBlocking = sessionStorage.getItem("youtube_nonstop_video_blocked") === "true";
      saveState(enabled);

      if (enabled) {
        insertVideoHandler();
        insertStylesheet();
        document.dispatchEvent(event);
      } else {
        removeStylesheet();
        if (wasBlocking && mustReload === 1) {
          restoreVideo();
        }
        document.dispatchEvent(event);
      }

      let nonstopKey = isMusic ? "youtube_music_nonstop" : "youtube_nonstop";
      if (values[nonstopKey]) {
        if (!document.getElementById("youtube_nonstop_inject")) {
          let script = document.createElement("script");
          script.src = chrome.runtime.getURL("js/nonstop_inject.js");
          script.id = "youtube_nonstop_inject";
          document.documentElement.appendChild(script);
        }
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request) => {
  applyOptions(request.data);
});

applyOptions(0);
