let audioOnly = sessionStorage.getItem("youtube_nonstop_video_blocked") === "true";

function isMusicSite() {
  return location.hostname.includes("music.youtube.com");
}

function getActiveVideo() {
  const list = document.querySelectorAll("video");
  for (const video of list) {
    const rect = video.getBoundingClientRect();
    if (isMusicSite() || (rect.width > 0 && rect.height > 0)) return video;
  }
  return null;
}

async function thumbnailUrl() {
  const player = getActiveVideo()?.parentNode?.parentNode || null;
  const thumbs = player?.getPlayerResponse?.()?.videoDetails?.thumbnail?.thumbnails;
  if (thumbs?.length) return `${thumbs[thumbs.length - 1].url}?noblocking=true`;

  const id = new URLSearchParams(location.search).get("v");
  if (!id) return "";

  const host = isMusicSite() ? "i1.ytimg.com" : "img.youtube.com";
  const hi = `https://${host}/vi/${id}/maxresdefault.jpg?noblocking=true`;
  try {
    const head = await fetch(hi, { method: "HEAD" });
    if (head.ok) return hi;
  } catch (err) {}
  return hi.replace("maxresdefault", "hqdefault");
}

async function renderBackground() {
  let style = document.getElementById("youtube_nonstop_player_background");
  if (!style) {
    style = document.createElement("style");
    style.id = "youtube_nonstop_player_background";
    document.documentElement.appendChild(style);
  }

  if (!audioOnly) {
    style.textContent = "";
    return;
  }

  const url = await thumbnailUrl();
  if (!url) {
    style.textContent = "";
    return;
  }

  style.textContent = `
    .nao-audio-player {
      background-image: url('${url}') !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
      background-size: contain !important;
    }
  `;
}

function refresh() {
  audioOnly = sessionStorage.getItem("youtube_nonstop_video_blocked") === "true";
  updateAudioOnlyClasses(audioOnly);
  renderBackground();
}

function updateAudioOnlyClasses(enabled) {
  document.querySelectorAll(".nao-audio-player").forEach((el) => el.classList.remove("nao-audio-player"));
  document.querySelectorAll(".nao-audio-video").forEach((el) => el.classList.remove("nao-audio-video"));

  if (!enabled) return;

  const video = getActiveVideo();
  const player = video?.parentNode?.parentNode || null;
  if (video) video.classList.add("nao-audio-video");
  if (player) player.classList.add("nao-audio-player");
}

document.addEventListener("nao_runtime_sync", refresh);
document.addEventListener("yt-navigate-finish", refresh);
refresh();
