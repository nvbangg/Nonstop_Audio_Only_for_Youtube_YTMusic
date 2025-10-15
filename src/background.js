const DEFAULT_OPTIONS = {
  youtube_video: false,
  youtube_music_video: true,
  continue_watching_prompt: true,
};

let activeTabs = [];

chrome.runtime.onInstalled.addListener((details) => {
  const isBrowserUpdate =
    details.reason === "browser_update" || details.reason === "chrome_update";
  isBrowserUpdate ? chrome.storage.local.set({ sstabs: {} }) : initOptions();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ sstabs: {} });
});

async function initOptions() {
  const stored = await chrome.storage.local.get(null);

  if (!stored.version) {
    await chrome.storage.local.set(DEFAULT_OPTIONS);
  } else {
    if (stored.enabled !== undefined) {
      stored.youtube_video = stored.youtube_music_video = stored.enabled;
      delete stored.enabled;
    }
    Object.keys(DEFAULT_OPTIONS).forEach((key) => {
      if (
        stored[key] === undefined ||
        typeof stored[key] !== typeof DEFAULT_OPTIONS[key]
      ) {
        stored[key] = DEFAULT_OPTIONS[key];
      }
    });
    await chrome.storage.local.set(stored);
  }

  chrome.management.getSelf((info) =>
    chrome.storage.local.set({ version: info.version })
  );
  updateRules();
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  activeTabs = activeTabs.filter((id) => id !== tabId);
  updateRules();

  const { sstabs } = await chrome.storage.local.get("sstabs");
  if (sstabs?.[tabId]) {
    delete sstabs[tabId];
    chrome.storage.local.set({ sstabs });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.status && !changeInfo.url) return;

  const url = changeInfo.url || tab?.url || "";
  const isYT = url.includes("youtube.com");
  const isYTMusic = url.includes("music.youtube.com");

  if (isYT) {
    handleYouTubeTab(tabId, isYTMusic);
    chrome.tabs.sendMessage(tabId, { data: 2 }, () => chrome.runtime.lastError);
  } else {
    activeTabs = activeTabs.filter((id) => id !== tabId);
    updateRules();
  }
});

async function handleYouTubeTab(tabId, isYTMusic) {
  const stored = await chrome.storage.local.get(null);
  const defaultEnabled = isYTMusic
    ? stored.youtube_music_video
    : stored.youtube_video;
  const enabled = stored.sstabs?.[tabId]?.enabled ?? defaultEnabled;

  const isActive = activeTabs.includes(tabId);
  if (enabled && !isActive) {
    activeTabs.push(tabId);
    updateRules();
  } else if (!enabled && isActive) {
    activeTabs = activeTabs.filter((id) => id !== tabId);
    updateRules();
  }
}

function updateRules() {
  const addRules = activeTabs.length
    ? [
        {
          id: 1,
          action: { type: "block" },
          condition: {
            urlFilter: "*://*.googlevideo.com/*mime=video*",
            tabIds: activeTabs,
          },
        },
      ]
    : [];
  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [1],
    addRules,
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.funct === 0) {
    sendResponse({ id: sender.tab.id, url: sender.url });
    return true;
  }
  if (request.funct === 1) {
    handleYouTubeTab(sender.tab.id, request.isYTMusic);
  }
});
