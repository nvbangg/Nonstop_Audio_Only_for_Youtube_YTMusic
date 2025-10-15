let intervalId;
let blockVideo =
  sessionStorage.getItem("youtube_nonstop_video_blocked") === "true";

const isYTMusic = () => location.hostname.includes("music.youtube.com");
const getVal = (key) => sessionStorage.getItem(key) === "true";
const getPlayer = () => findVideo()?.parentNode?.parentNode;

function findVideo() {
  const videos = document.querySelectorAll("video");
  if (!isYTMusic()) {
    for (let v of videos) {
      const rect = v.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return v;
    }
  }
  return videos[0];
}

async function getThumbnail() {
  try {
    return (
      getPlayer()
        ?.getPlayerResponse()
        .videoDetails.thumbnail.thumbnails.slice(-1)[0].url + "?noblocking=true"
    );
  } catch {}

  const videoId = new URL(location.href).searchParams.get("v");
  if (!videoId) return "";
  const base = isYTMusic()
    ? `https://i1.ytimg.com/vi/${videoId}/maxresdefault.jpg?noblocking=true`
    : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg?noblocking=true`;
  try {
    const res = await fetch(base, { method: "HEAD" });
    return res.ok ? base : base.replace("maxresdefault", "hqdefault");
  } catch {
    return base.replace("maxresdefault", "hqdefault");
  }
}

async function updateBackground() {
  let style = document.getElementById("youtube_nonstop_player_background");
  if (!style) {
    style = document.createElement("style");
    style.id = "youtube_nonstop_player_background";
    document.documentElement.appendChild(style);
  }
  style.textContent = blockVideo
    ? `
    .html5-video-player, ytmusic-player {
      background-image: url('${await getThumbnail()}') !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
      background-size: contain !important;
    }
  `
    : "";
}

function restoreVideo() {
  const video = findVideo();
  if (!video || !video.src.includes("mime=audio")) return;

  delete video.dataset.musicurl;
  const time = video.currentTime || 0;
  video.removeAttribute("src");
  video.load();
  setTimeout(() => {
    getPlayer()?.playVideo();
    if (time) video.currentTime = time;
  }, 0);
}

function init() {
  blockVideo = getVal("youtube_nonstop_video_blocked");
  updateBackground();
  if (!blockVideo) restoreVideo();

  const continuePrompt = getVal("youtube_nonstop_continue_prompt");
  if (continuePrompt && !intervalId) {
    intervalId = setInterval(
      () => getPlayer()?.updateLastActiveTime(),
      5 * 60 * 1000
    );
  } else if (!continuePrompt && intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

document.addEventListener("injection_script_communication", init);
init();

const origOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
  if (blockVideo && url.includes("mime=audio")) handleAudio(url);
  return origOpen.apply(this, arguments);
};

const origFetch = window.fetch;
window.fetch = async (...args) => {
  if (blockVideo) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    if (url.includes("mime=audio")) {
      handleAudio(url);
    } else if (url.includes("mime=video")) {
      return new Response("", { status: 204 });
    }
  }
  return origFetch(...args);
};

function handleAudio(url) {
  const video = findVideo();
  if (!video) return;

  const player = getPlayer();
  if (player) {
    const rate = player.getPlaybackRate();
    player.setPlaybackRate(1);
    player.setPlaybackRate(rate);
  }

  if (video.src.includes("youtube.com")) setAudioSrc(video, url);
}

function setAudioSrc(video, url) {
  const [base, query] = url.split("?");
  if (!query) return;

  const params = query
    .split(/[&;]/g)
    .filter(
      (p) => !["rn", "rbuf", "range", "ump"].some((k) => p.startsWith(k + "="))
    );
  const newUrl = `${base}?${params.join("&")}`;

  if (video.src === newUrl || !blockVideo) return;

  updateBackground();
  video.dataset.musicurl = newUrl;
  video.dataset.originalurl = video.src;

  const time = video.currentTime || 0;
  if (!video.paused) video.pause();

  new MutationObserver((mutations) => {
    for (let m of mutations) {
      if (
        m.target.nodeName === "VIDEO" &&
        (!m.target.src || m.target.src === "")
      )
        retryPlay();
    }
  }).observe(video, { attributes: true, attributeFilter: ["src"] });

  video.addEventListener("stalled", retryPlay);
  video.src = newUrl;
  video.load();
  video.currentTime = time;
  getPlayer()?.playVideo();
}

function retryPlay() {
  const video = findVideo();
  if (!video) return setTimeout(retryPlay, 5000);

  if (
    video.offsetTop < 0 &&
    video.parentNode?.parentNode?.id !== "inline-preview-player"
  ) {
    setTimeout(() => {
      const v = findVideo();
      if (v && !v.src) getPlayer()?.playVideo();
    }, 1000);
  }
}
