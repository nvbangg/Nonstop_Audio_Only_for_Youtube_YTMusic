let tabId = 0;
let tabUrl = "";

chrome.tabs.query(
  {
    active: true,
    currentWindow: true,
  },
  (tabs) => {
    const activeTab = tabs && tabs[0];
    if (!activeTab) return;
    tabId = activeTab.id;
    tabUrl = activeTab.url || "";
    if (tabUrl.indexOf("youtube.com") !== -1) {
      initPopup();
    } else {
      document.body.textContent = "Not a YouTube page";
      document.body.style.padding = "20px";
      document.body.style.textAlign = "center";
    }
  }
);

function initPopup() {
  const tabToggle = document.getElementById("tab-toggle");
  const settingsHeader = document.getElementById("settings-toggle");
  const settingsContent = document.getElementById("settings-content");

  chrome.storage.local.get(null, (result) => {
    const sstabs = result.sstabs || {};
    const isYTMusic = tabUrl.indexOf("music.youtube.com") !== -1;
    const defaultEnabled = isYTMusic ? result.youtube_music_video : result.youtube_video;
    const isEnabled = sstabs[tabId] && sstabs[tabId].enabled !== undefined
      ? sstabs[tabId].enabled
      : defaultEnabled;

    if (tabToggle) tabToggle.checked = isEnabled;
    document.querySelectorAll(".setting-checkbox").forEach((checkbox) => {
      checkbox.checked = !!result[checkbox.name];
    });
  });

  if (tabToggle) {
    tabToggle.addEventListener("change", function () {
      chrome.storage.local.get(["sstabs"], (result) => {
        const sstabs = result.sstabs || {};
        sstabs[tabId] = { enabled: this.checked };
        chrome.storage.local.set({ sstabs }, () => {
          chrome.tabs.sendMessage(tabId, { data: 1 }, () => chrome.runtime.lastError);
        });
      });
    });
  }

  document.querySelectorAll(".setting-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      chrome.storage.local.get(null, (storedValues) => {
        if (storedValues[this.name] !== undefined) {
          const newValues = {};
          newValues[this.name] = this.checked;
          chrome.storage.local.set(newValues);
        }
      });
    });
  });

  if (settingsHeader && settingsContent) {
    settingsHeader.addEventListener("click", () => {
      settingsHeader.classList.toggle("settings-expanded");
      settingsContent.classList.toggle("settings-collapsed");
      settingsContent.classList.toggle("settings-expanded");
    });
  }
}
