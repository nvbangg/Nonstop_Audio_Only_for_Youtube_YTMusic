const state = { tabId: 0, key: "youtube_audio_only" };

const ui = {
  tabOption: document.getElementById("tab-option"),
  tabToggle: document.getElementById("tab-toggle"),
  settingsBox: document.getElementById("settings-box"),
  settingsHead: document.getElementById("settings-head"),
  settingToggles: Array.from(document.querySelectorAll(".setting-toggle")),
};

const YT_TAB_QUERY = { url: ["*://*.youtube.com/*", "*://youtube.com/*"] };
const AUDIO_DEFAULT_KEYS = new Set(["youtube_audio_only", "youtube_music_audio_only"]);

function notifyTab(tabId) {
  chrome.tabs.sendMessage(tabId, { data: 1 }, () => chrome.runtime.lastError);
}

function resolveTabEnabled(data) {
  const override = (data.sstabs || {})[state.tabId];
  return override === undefined ? data[state.key] === true : !!override.enabled;
}

async function syncPerTabToggleFromDefaults() {
  const data = await chrome.storage.local.get([state.key, "sstabs"]);
  ui.tabToggle.checked = resolveTabEnabled(data);
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  state.tabId = tab.id;
  const tabUrl = tab.url || "";

  if (!String(tabUrl).includes("youtube.com") && ui.tabOption) {
    ui.tabOption.style.display = "none";
  }

  const data = await chrome.storage.local.get(null);
  state.key = String(tabUrl).includes("music.youtube.com") ? "youtube_music_audio_only" : "youtube_audio_only";

  ui.tabToggle.checked = resolveTabEnabled(data);

  for (const el of ui.settingToggles) {
    const key = el.dataset.key;
    el.checked = data[key] === true;
  }

  ui.settingsHead.onclick = () => {
    ui.settingsBox.classList.toggle("expanded");
  };

  ui.tabToggle.onchange = async () => {
    const next = await chrome.storage.local.get([state.key, "sstabs"]);
    const sstabs = next.sstabs || {};
    const enabled = ui.tabToggle.checked;

    if (enabled === (next[state.key] === true)) {
      delete sstabs[state.tabId];
    } else {
      sstabs[state.tabId] = { enabled };
    }

    await chrome.storage.local.set({ sstabs });
    notifyTab(state.tabId);
  };

  for (const el of ui.settingToggles) {
    el.onchange = async () => {
      const key = el.dataset.key;
      if (AUDIO_DEFAULT_KEYS.has(key)) {
        await chrome.storage.local.set({ [key]: el.checked, sstabs: {} });
        await syncPerTabToggleFromDefaults();
      } else {
        await chrome.storage.local.set({ [key]: el.checked });
      }

      const tabs = await chrome.tabs.query(YT_TAB_QUERY);
      for (const t of tabs) notifyTab(t.id);
    };
  }
}

init();
