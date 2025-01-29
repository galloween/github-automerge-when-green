// ==UserScript==
// @name         GitHubHideQodoCrap
// @namespace    https://github.com/galloween
// @version      0.2
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
    @keyframes hqc-nodeInserted {
      from { opacity: 0.99; }
      to { opacity: 1; }
    }

    details[open]:has([href*=qodo]) {
      animation-duration: 0.001s;
      animation-name: hqc-nodeInserted;
      margin-top: 8px;
    }

    details:not([open]):has([href*=qodo]),
    .js-diff-progressive-container:has(.check-annotation-failure) {
      display: none;
    }

    .inline-comments:has(.hqc-toggle) {
      position: relative;
    }

    .hqc-toggle {
      position: absolute;
      left: 15px;
      top: -12px;
      z-index: 100;
      padding: 8px;
      height: auto;      
      --button-default-borderColor-rest: #7568DC;
      --button-default-borderColor-hover: #7568DC;
      --button-default-borderColor-active: #7568DC;
    }

    hqc-toggle,
    .hqc-toggle:hover,
    .hqc-toggle:focus {
      border-color: #7568DC;
    }

    .hqc-toggle:after {
      content: '';
      width: 0; 
      height: 0; 
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-left: 10px solid #7568DC;    
      position: absolute;
      right: -10px;
    }

    .hqc-toggle * {
      pointer-events: none;
    }

    .hqc-bubble {
      font-size: 16px;
      display: inline-block;
      margin: -7px 0 0px 0px;
    }

    .TimelineItem-body .hqc-toggle {
      position: static;
    }

    .TimelineItem-body .hqc-toggle:after {
      display: none;
    }

  `);

  const hideQodoComments = (event) => {
    const target = event.target || event.srcElement;
    if (qodos.has(target) || event.animationName !== 'hqc-nodeInserted') {
      return;
    }

    qodos.add(target);
    target.open = false;

    target.insertAdjacentHTML(
      'beforebegin',
      `<button type="button" title="Toggle Qodo comment"
      class="hqc-toggle Button--secondary Button--small Button d-inline-flex">
        <img src="https://avatars.githubusercontent.com/in/484649?s=48&amp;v=4" size="24" height="24" width="24" class="avatar d-inline-block">      
        <span class="hqc-bubble">💬</span>
      </button>`
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
