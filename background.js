chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: "https://github.com/nvbangg/nvbangg-tools"
  });
});