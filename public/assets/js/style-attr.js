/*
 * CSP: an HTML style="" attribute is blocked without 'unsafe-inline' in style-src.
 * Templates write dynamic styles as data-css="…" (values computed at render: colours,
 * widths, CSS variables, background images); this applies them through the CSSOM,
 * which CSP allows. Loaded first, so it sees every node the other scripts insert.
 * The observer runs as a microtask, before the next paint: no unstyled frame.
 */
(function () {
  'use strict';
  const move = el => { el.style.cssText += ';' + el.getAttribute('data-css'); el.removeAttribute('data-css'); };
  const apply = node => {
    if (node.nodeType !== 1) return;
    if (node.hasAttribute('data-css')) move(node);
    node.querySelectorAll('[data-css]').forEach(move);
  };
  new MutationObserver(list => { for (const m of list) m.addedNodes.forEach(apply); })
    .observe(document.documentElement, { childList: true, subtree: true });
  window.TilesStyleAttr = { apply };
})();
