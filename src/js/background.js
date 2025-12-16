let options = {
  youtube_video: false,
  youtube_music_video: true,
  youtube_nonstop: true,
  youtube_music_nonstop: true,
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "browser_update" && details.reason !== "chrome_update") {
    initOptions();
  }
  chrome.storage.local.set({ sstabs: {} });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ sstabs: {} });
});

async function initOptions() {
  const stored = await chrome.storage.local.get(null);
  for (let key in options) {
    if (stored[key] === undefined) {
      stored[key] = options[key];
    }
  }
  await chrome.storage.local.set(stored);
  chrome.management.getSelf((info) => {
    chrome.storage.local.set({ version: info.version });
  });
}

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get("sstabs", (data) => {
    let sstabs = data.sstabs || {};
    if (tabId in sstabs) {
      delete sstabs[tabId];
      chrome.storage.local.set({ sstabs });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" || (changeInfo.status && changeInfo.url)) {
    if (tab.url && tab.url.includes("youtube.com")) {
      chrome.tabs.sendMessage(tabId, { data: 2 }, () => chrome.runtime.lastError);
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.funct === 0) {
    sendResponse({ id: sender.tab.id, url: sender.url });
    return true;
  }
});
