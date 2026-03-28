const options = {
  youtube_audio_only: false,
  youtube_music_audio_only: true,
  youtube_nonstop: true,
  youtube_music_nonstop: true,
};

function clearTabState() {
  chrome.storage.local.set({ sstabs: {} });
}

async function initializeStorage() {
  const stored = await chrome.storage.local.get(null);
  const next = { version: chrome.runtime.getManifest().version };

  for (const [key, fallback] of Object.entries(options)) {
    const value = stored[key];
    next[key] = typeof value === typeof fallback ? value : fallback;
  }

  await chrome.storage.local.set(next);
  await chrome.storage.local.remove(["audio_only_patterns", "audio_only_tokens"]);
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== "browser_update" && reason !== "chrome_update") {
    await initializeStorage();
  }
  clearTabState();
});

chrome.runtime.onStartup.addListener(clearTabState);

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get("sstabs", ({ sstabs = {} }) => {
    if (!(tabId in sstabs)) return;
    delete sstabs[tabId];
    chrome.storage.local.set({ sstabs });
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!(changeInfo.status === "loading" || changeInfo.url)) return;
  const url = changeInfo.url || tab?.url || "";
  if (!url.includes("youtube.com")) return;
  chrome.tabs.sendMessage(tabId, { data: 2 }, () => chrome.runtime.lastError);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.funct !== 0 || !sender?.tab) return;
  sendResponse({ id: sender.tab.id, url: sender.url || sender.tab.url || "" });
});
