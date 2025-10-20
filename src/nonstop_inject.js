(function () {
  "use strict";
  Object.defineProperties(document, {
    hidden: { value: false },
    visibilityState: { value: "visible" },
  });
  addEventListener(
    "visibilitychange",
    (e) => e.stopImmediatePropagation(),
    true
  );
  const keepActive = () => {
    "_lact" in window && setInterval(() => (window._lact = Date.now()), 300000);
  };
  (function wait() {
    "_lact" in window ? keepActive() : setTimeout(wait, 1000);
  })();
})();
