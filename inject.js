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
