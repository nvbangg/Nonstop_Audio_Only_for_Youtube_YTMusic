async function init() {
  const data = await chrome.storage.local.get(null);

  document.querySelectorAll(".setting").forEach((el) => (el.checked = !!data[el.name]));

  const patternsEl = document.getElementById("audio_only_patterns");
  const ghostEl = document.getElementById("ghost-placeholder");
  if (patternsEl) {
    patternsEl.value = (data.audio_only_patterns || []).join("\n");
    if (patternsEl.value.length > 0 && !patternsEl.value.endsWith("\n")) {
      const end = patternsEl.value.length;
      patternsEl.value += "\n";
      patternsEl.selectionStart = patternsEl.selectionEnd = end;
    }
    updateGhost();
  }

  document.querySelectorAll(".setting").forEach((el) => {
    el.onchange = async () => {
      await chrome.storage.local.set({ [el.name]: el.checked });
      await notifyYouTubeTabs();
    };
  });

  if (patternsEl) {
    patternsEl.oninput = async () => {
      const before = patternsEl.value;
      const atEnd = patternsEl.selectionStart === before.length && patternsEl.selectionEnd === before.length;
      if (before.length > 0 && !before.endsWith("\n") && atEnd) {
        const end = before.length;
        patternsEl.value = before + "\n";
        patternsEl.selectionStart = patternsEl.selectionEnd = end;
      }
      updateGhost();
      const lines = patternsEl.value
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const tokenSet = new Set();
      for (const line of lines) {
        const t = extractToken(line);
        if (t) tokenSet.add(t);
      }
      const tokens = Array.from(tokenSet);
      await chrome.storage.local.set({
        audio_only_patterns: lines,
        audio_only_tokens: tokens,
      });
      await notifyYouTubeTabs();
    };

    patternsEl.onscroll = () => {
      if (ghostEl) ghostEl.style.transform = `translateY(${-patternsEl.scrollTop}px)`;
    };

    patternsEl.onfocus = ensureTrailingBlank;
    patternsEl.onkeydown = ensureTrailingBlank;
    patternsEl.onkeyup = ensureTrailingBlank;
  }

  function updateGhost() {
    if (!patternsEl || !ghostEl) return;
    const val = patternsEl.value;
    const lines = val.split(/\r?\n/);
    const lastIsEmpty = lines.length === 0 || lines[lines.length - 1] === "";
    const prefixCount = lastIsEmpty ? Math.max(0, lines.length - 1) : lines.length;
    const prefix = prefixCount ? Array(prefixCount).fill("").join("\n") + "\n" : "";
    ghostEl.textContent = prefix + "Enter video/playlist URLs line by line";

    ghostEl.style.top = patternsEl.offsetTop + "px";
    ghostEl.style.left = patternsEl.offsetLeft + "px";
    ghostEl.style.width = patternsEl.clientWidth + "px";
    ghostEl.style.height = patternsEl.clientHeight + "px";
  }

  function ensureTrailingBlank() {
    const v = patternsEl.value;
    if (v.length === 0) return;
    if (!v.endsWith("\n")) {
      const end = v.length;
      patternsEl.value = v + "\n";
      patternsEl.selectionStart = patternsEl.selectionEnd = end;
    }
  }
}

init();

async function notifyYouTubeTabs() {
  const tabs = await chrome.tabs.query({
    url: ["*://*.youtube.com/*", "*://youtube.com/*"],
  });
  tabs.forEach((tab) => {
    chrome.tabs.sendMessage(tab.id, { data: 1 }, () => chrome.runtime.lastError);
  });
}

function extractToken(s) {
  const mV = String(s).match(/(?:^|[?&])v=([A-Za-z0-9_-]{11})/);
  if (mV) return `v=${mV[1]}`;
  const mL = String(s).match(/(?:^|[?&])list=([A-Za-z0-9_-]+)/);
  if (mL) return `list=${mL[1]}`;
  return "";
}
