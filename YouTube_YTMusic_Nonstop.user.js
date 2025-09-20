// ==UserScript==
// @name         YouTube™ YTMusic™ Nonstop
// @namespace    https://github.com/nvbangg
// @version      1.0
// @description  Prevent auto-pause, keep YouTube & YouTube Music nonstop
// @author       nvbangg (https://github.com/nvbangg)
// @copyright    Copyright (c) 2025 Nguyễn Văn Bằng (nvbangg, github.com/nvbangg)
// @homepage     https://github.com/nvbangg/YouTube_YTMusic_Nonstop
// @icon         https://raw.githubusercontent.com/nvbangg/YouTube_YTMusic_Nonstop/main/icon.png
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        none
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/546130/YouTube-YTMusic-Nonstop.user.js
// @updateURL https://update.greasyfork.org/scripts/546130/YouTube-YTMusic-Nonstop.meta.js
// ==/UserScript==

(function () {
  "use strict";
  // Force page to always appear visible
  Object.defineProperties(document, {
    hidden: { value: false },
    visibilityState: { value: "visible" },
  });

  // Block visibilitychange events
  addEventListener(
    "visibilitychange",
    (e) => e.stopImmediatePropagation(),
    true
  );

  // Keep _lact (last activity) fresh
  const keepActive = () => {
    if ("_lact" in window)
      setInterval(() => (window._lact = Date.now()), 300000);
  };
  (function wait() {
    "_lact" in window ? keepActive() : setTimeout(wait, 1000);
  })();
})();
