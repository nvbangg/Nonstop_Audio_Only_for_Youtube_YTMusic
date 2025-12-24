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
  const isMusic = tabUrl.includes("music.youtube.com");
  const baseDefault = isMusic ? data.youtube_music_video : data.youtube_video;

  let checkUrl = tabUrl;
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: "getCheckUrl" });
    if (response && response.checkUrl) {
      checkUrl = response.checkUrl;
    }
  } catch (e) {}

  let defaultEnabled = baseDefault;
  if (!baseDefault) {
    const tokens = (data.audio_only_tokens || []).filter(Boolean);
    if (tokens.length) {
      defaultEnabled = urlMatchesTokens(checkUrl, tokens);
    }
  }

  const isOverridden = sstabs[tabId] !== undefined;
  const enabled = isOverridden ? sstabs[tabId].enabled : defaultEnabled;

  const tabToggle = document.getElementById("tab-toggle");
  const tabOption = document.getElementById("tab-option");
  const resetBtn = document.getElementById("reset-btn");
  const isYT = tabUrl.includes("youtube.com");
  if (!isYT && tabOption) tabOption.style.display = "none";
  const settingsBtn = document.getElementById("settings-btn");

  tabToggle.checked = enabled;
  if (isOverridden) resetBtn.classList.add("visible");

  tabToggle.onchange = async () => {
    const { sstabs = {} } = await chrome.storage.local.get("sstabs");
    sstabs[tabId] = { enabled: tabToggle.checked };
    await chrome.storage.local.set({ sstabs });
    resetBtn.classList.add("visible");
    chrome.tabs.sendMessage(tabId, { data: 1 }, () => chrome.runtime.lastError);
  };

  resetBtn.onclick = async () => {
    const { sstabs = {} } = await chrome.storage.local.get("sstabs");
    delete sstabs[tabId];
    await chrome.storage.local.set({ sstabs });
    tabToggle.checked = defaultEnabled;
    resetBtn.classList.remove("visible");
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
