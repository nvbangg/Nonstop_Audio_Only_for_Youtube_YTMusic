let blockVideo = getValue("youtube_nonstop_video_blocked");

document.addEventListener("injection_script_communication", () => {
  initialization();
});

function initialization() {
  blockVideo = getValue("youtube_nonstop_video_blocked");
  let videoPlayer = getPlayer();
  setPlayerBackground(videoPlayer);
}

initialization();

async function setPlayerBackground(videoPlayer) {
  let stylesheet = document.getElementById("youtube_nonstop_player_background");
  let stylesheetContent = ``;

  if (blockVideo) {
    let imgurl = await getThumbnailImage(videoPlayer);
    if (imgurl) {
      stylesheetContent += `
      .html5-video-player,
      ytmusic-player {
        background-image: url('${imgurl}') !important;
        background-repeat: no-repeat !important;
        background-position: center !important;
        background-size: contain !important;
      }
    `;
    }
  }

  if (stylesheet == undefined) {
    stylesheet = document.createElement("style");
    stylesheet.id = "youtube_nonstop_player_background";
    document.documentElement.appendChild(stylesheet);
  }
  stylesheet.textContent = stylesheetContent;
}

async function getThumbnailImage(videoPlayer) {
  if (videoPlayer) {
    try {
      return videoPlayer.getPlayerResponse().videoDetails.thumbnail.thumbnails.slice(-1)[0].url + "?noblocking=true";
    } catch (error) {}
  }
  let url_string = new URL(window.location.href);
  let videoId = url_string.searchParams.get("v");
  if (videoId) {
    let thumbnailUrl;
    if (getSiteName() === "youtube_music") {
      thumbnailUrl = `https://i1.ytimg.com/vi/${videoId}/maxresdefault.jpg?noblocking=true`;
    } else thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg?noblocking=true`;
    return fetch(thumbnailUrl, {
      method: "HEAD",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
      })
      .then((data) => {
        return thumbnailUrl;
      })
      .catch((error) => {
        return thumbnailUrl.replace("maxresdefault", "hqdefault");
      });
  }
}

function getPlayer() {
  let player;
  let video = findVideoEl();
  if (video && video.parentNode && video.parentNode.parentNode) player = video.parentNode.parentNode;
  return player;
}

try {
  if (typeof HXRopen === "undefined") {
    var HXRopen = XMLHttpRequest.prototype.open;
  }
} catch (e) {}

XMLHttpRequest.prototype.open = function (method, url) {
  if (blockVideo && url.indexOf("mime=audio") !== -1) {
    musicModeForYouTube(url, url.indexOf("live=1"), true);
  }
  return HXRopen.apply(this, arguments);
};

try {
  const { fetch: origFetch } = window;
  window.fetch = async (...args) => {
    if (blockVideo) {
      let url = args[0].url;
      if (url) {
        if (url.indexOf("mime=audio") !== -1) {
          musicModeForYouTube(url, url.indexOf("live=1"), true);
        } else if (url.indexOf("mime=video") !== -1 && url.indexOf("live=1") === -1) {
          return new Response("", { status: 204 });
        }
      }
    }
    return await origFetch(...args);
  };
} catch (error) {}

function musicModeForYouTube(url, isLive, firstCall) {
  let video = findVideoEl();
  if (video) {
    setPlaybackRateAgain(video);
    if (isLive != -1) {
      if (isNotMusicUrl(video.src)) {
        video.dataset.originalurl = video.src;
        video.dataset.musicurl = 1;
      }
    } else {
      if (isNotMusicUrl(video.src)) {
        if (!firstCall) {
          try {
            const params = new URLSearchParams(url);
            if (video.parentNode.parentNode.getVideoData().cpn == params.get("cpn")) {
              setNewURL(video, url);
            }
          } catch (error) {}
        } else setNewURL(video, url);
      } else {
        if (firstCall) {
          setTimeout(() => {
            musicModeForYouTube(url, isLive, false);
          }, 5000);
        }
      }
    }
  }
}

function setNewURL(video, url) {
  let urlParts = url.split("?");
  if (urlParts.length >= 2) {
    let parametersToBeRemoved = ["rn", "rbuf", "range", "ump"];
    let parameters = urlParts[1].split(/[&;]/g);
    parametersToBeRemoved.forEach((k) => {
      parameters = parameters.filter((p) => !p.startsWith(encodeURIComponent(k) + "="));
    });
    url = urlParts[0] + "?" + parameters.join("&");
    if (video.src !== url && blockVideo) {
      if (video.parentNode && video.parentNode.parentNode) {
        let videoPlayer = video.parentNode.parentNode;
        setPlayerBackground(videoPlayer);
      }
      video.dataset.musicurl = url;
      video.dataset.originalurl = video.src;
      let paused = video.paused;
      if (!paused) video.pause();
      let curTime = video.currentTime;
      video.src = url;

      let observerOptions = {
        attributes: true,
        attributeFilter: ["src"],
        attributeOldValue: true,
      };
      let videoSrcObserver = new MutationObserver(findChangesInSource);
      videoSrcObserver.observe(video, observerOptions);
      video.addEventListener("stalled", listenerReceiver);
      video.load();
      video.currentTime = curTime;
      video.parentNode.parentNode.playVideo();
    }
  }
}

function listenerReceiver(e) {
  reloadVideo(e.target.currentTime, true);
}

function findChangesInSource(mutations) {
  for (let mutation of mutations) {
    if (mutation.target.nodeName === "VIDEO") {
      if (!mutation.target.hasAttribute("src") || mutation.target.src === "") {
        reloadVideo(mutation.target.currentTime, true);
      }
    }
  }
}

function reloadVideo(currentTime, reSearchVideo) {
  let newVideoEl = findVideoEl();
  if (!newVideoEl) {
    if (reSearchVideo) {
      setTimeout(() => {
        reloadVideo(currentTime, false);
      }, 5000);
    }
  } else {
    if (newVideoEl.offsetTop < 0 && !isVideoPreview(newVideoEl)) {
      setTimeout(() => {
        let newVideoEl = findVideoEl();
        if (newVideoEl && (!newVideoEl.hasAttribute("src") || newVideoEl.src === "")) {
          newVideoEl.parentNode.parentNode.playVideo();
        }
      }, 1000);
    }
  }
}

function isVideoPreview(video) {
  try {
    return video.parentNode.parentNode.id == "inline-preview-player";
  } catch (error) {
    return false;
  }
}

function setPlaybackRateAgain(video) {
  try {
    let player = video.parentNode.parentNode;
    let rate = player.getPlaybackRate();
    player.setPlaybackRate(1);
    player.setPlaybackRate(rate);
  } catch (err) {}
}

function findVideoEl() {
  let video;
  let videoElements = document.querySelectorAll("video");
  if (videoElements && videoElements.length) {
    let videoRect;
    for (var i = 0; i < videoElements.length; i++) {
      if (videoElements[i] !== undefined) {
        videoRect = videoElements[i].getBoundingClientRect();
        if (getSiteName() !== "youtube_music") {
          if (videoRect.width > 0 && videoRect.height > 0) {
            video = videoElements[i];
            break;
          }
        } else {
          video = videoElements[i];
          break;
        }
      }
    }
  }
  return video;
}

function getSiteName() {
  if (window.location.hostname.indexOf("music.youtube.com") !== -1) return "youtube_music";
  else if (window.location.href.indexOf("www.youtube.com") !== -1) return "youtube";
  else return "false";
}

function getValue(key) {
  return sessionStorage.getItem(key) === "true";
}

function isNotMusicUrl(url) {
  return url.indexOf("www.youtube.com") !== -1 || url.indexOf("music.youtube.com") !== -1;
}
