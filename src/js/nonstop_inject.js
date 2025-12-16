(function () {
  "use strict";
  Object.defineProperties(document, {
    hidden: { value: false },
    visibilityState: { value: "visible" },
  });
  addEventListener("visibilitychange", (e) => e.stopImmediatePropagation(), true);
  const keepAlive = () => {
    if ("_lact" in window) setInterval(() => (window._lact = Date.now()), 300000);
    else setTimeout(keepAlive, 1000);
  };
  keepAlive();
})();
