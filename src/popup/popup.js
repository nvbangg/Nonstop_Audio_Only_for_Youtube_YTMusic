let tabId, tabUrl;

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  tabId = tab.id;
  tabUrl = tab.url || "";
  init();
});

async function init() {
  const data = await chrome.storage.local.get(null);
  const sstabs = data.sstabs || {};
  const isYTMusic = tabUrl.includes("music.youtube.com");
  const baseDefault = isYTMusic ? data.youtube_music_video : data.youtube_video;
  let defaultEnabled = baseDefault;
  if (!baseDefault) {
    const tokens = (data.audio_only_tokens || []).filter(Boolean);
    if (tokens.length) {
      defaultEnabled = urlMatchesTokens(tabUrl, tokens);
    }
  }
  const enabled = sstabs[tabId]?.enabled ?? defaultEnabled;

  const tabToggle = document.getElementById("tab-toggle");
  const tabOption = document.getElementById("tab-option");
  const isYT = tabUrl.includes("youtube.com");
  if (!isYT && tabOption) tabOption.style.display = "none";
  const settingsBtn = document.getElementById("settings-btn");

  tabToggle.checked = enabled;

  tabToggle.onchange = async () => {
    const { sstabs = {} } = await chrome.storage.local.get("sstabs");
    sstabs[tabId] = { enabled: tabToggle.checked };
    await chrome.storage.local.set({ sstabs });
    chrome.tabs.sendMessage(tabId, { data: 1 }, () => chrome.runtime.lastError);
  };

  settingsBtn.onclick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("page/page.html") });
  };
}

function urlMatchesTokens(url, tokens) {
  if (!tokens.length) return false;
  const lower = String(url).toLowerCase();
  const normalized = lower.replace(/&/g, "?");
  const stripped = lower.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const strippedNorm = normalized.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return tokens.some((raw) => {
    const p = String(raw).trim().toLowerCase();
    if (!p) return false;
    return lower.includes(p) || normalized.includes(p) || stripped.includes(p) || strippedNorm.includes(p);
  });
}
