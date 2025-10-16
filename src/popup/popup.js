let tabId, tabUrl;

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  tabId = tab.id;
  tabUrl = tab.url || "";
  tabUrl.includes("youtube.com")
    ? init()
    : (document.body.innerHTML =
        '<div style="padding:20px;text-align:center">Not a YouTube page</div>');
});

async function init() {
  const data = await chrome.storage.local.get(null);
  const sstabs = data.sstabs || {};
  const isYTMusic = tabUrl.includes("music.youtube.com");
  const enabled =
    sstabs[tabId]?.enabled ??
    (isYTMusic ? data.youtube_music_video : data.youtube_video);

  const tabToggle = document.getElementById("tab-toggle");
  const settings = document.getElementById("settings-toggle");
  const content = document.getElementById("settings-content");

  tabToggle.checked = enabled;
  document
    .querySelectorAll(".setting")
    .forEach((el) => (el.checked = !!data[el.name]));

  tabToggle.onchange = async () => {
    const { sstabs = {} } = await chrome.storage.local.get("sstabs");
    sstabs[tabId] = { enabled: tabToggle.checked };
    await chrome.storage.local.set({ sstabs });
    chrome.tabs.sendMessage(tabId, { data: 1 }, () => chrome.runtime.lastError);
  };

  document.querySelectorAll(".setting").forEach((el) => {
    el.onchange = () => chrome.storage.local.set({ [el.name]: el.checked });
  });

  settings.onclick = () => {
    settings.classList.toggle("expanded");
    content.classList.toggle("collapsed");
    content.classList.toggle("expanded");
  };
}
