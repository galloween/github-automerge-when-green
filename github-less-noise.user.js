// ==UserScript==
// @name         GitHubHideQodoCrap
// @namespace    https://github.com/galloween
// @version      0.1
// @description  collapses Qodo PR comments and other Qodo noise
// @author       Pasha Golovin
// @updateURL    https://github.com/galloween/github-automerge-when-green/raw/refs/heads/master/github-less-noise.user.js
// @downloadURL  https://github.com/galloween/github-automerge-when-green/raw/refs/heads/master/github-less-noise.user.js

// @include     *github.com/*/pull/*
// @run-at      document-idle
// @connect     github.com
// @connect     githubusercontent.com
// @grant       GM_notification
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_addStyle

// ==/UserScript==

(() => {
  'use strict';

  let initDone;
  const qodos = new WeakSet();

  GM_addStyle(`
    @keyframes nodeInserted {
      from { opacity: 0.99; }
      to { opacity: 1; }
    }

    details[open]:has([href*=qodo]) {
      animation-duration: 0.001s;
      animation-name: nodeInserted;
      margin-top: 8px;
    }

    details:not([open]):has([href*=qodo]),
    .js-diff-progressive-container:has(.check-annotation-failure) {
      display: none;
    }
  `);

  const hideQodoComments = (event) => {
    const target = event.target || event.srcElement;
    if (qodos.has(target)) return;

    qodos.add(target);
    target.open = false;

    target.insertAdjacentHTML(
      'beforebegin',
      `<button type="button" class="hqc-toggle Button--secondary Button--small Button d-inline-flex">Toggle Qodo Comment</button>`
    );
  };

  const toggleQodoComments = (event) => {
    const target = event.target;

    if (target.matches('.hqc-toggle')) {
      const details = target.nextElementSibling;
      details.open = !details.open;
    }
  };

  const init = () => {
    if (!initDone) {
      initDone = true;

      document.addEventListener('animationstart', hideQodoComments, {
        capture: false,
        passive: true,
      });

      document.addEventListener('click', toggleQodoComments, {
        capture: true,
        passive: true,
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init);
  } else {
    init();
  }

  const insertHTMLafter = (html, element) => {};
})();
