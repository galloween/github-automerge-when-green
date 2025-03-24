// ==UserScript==
// @name         GitHubLessNoise
// @namespace    https://github.com/galloween
// @version      0.5
// @description  collapses/resolves Qodo PR comments and other noise
// @author       Pasha Golovin
// @updateURL    https://github.com/galloween/github-automerge-when-green/raw/refs/heads/master/github-less-noise.user.js
// @downloadURL  https://github.com/galloween/github-automerge-when-green/raw/refs/heads/master/github-less-noise.user.js

// @include     *github.com/*/pull/*
// @run-at      document-idle
// @connect     github.com
// @connect     githubusercontent.com
// @grant       GM_addStyle

// ==/UserScript==

(() => {
  'use strict';

  let initDone;

  const qodos = new WeakSet();
  const multiQodos = new WeakSet();
  const expandOnce = new WeakSet();
  const sections = new WeakSet();
  const buttons = new WeakSet();
  const details = new WeakSet();

  let prAuthor, user;

  const tasks = [];
  let hasTasks = false;

  const selectors = [
    // [0] Qodo comments container
    'details:has([href*=qodo])',

    // [1] collapsible sections headers

    // PR description sections
    '.js-discussion .TimelineItem h3:not(:first-of-type),' +
      // "Affected"
      'h4:has(+.highlight-source-shell),' +
      // Sections with commit lists
      '.js-timeline-item [data-view-component="true"].TimelineItem:has(+ div:not([class])),' +
      // multiple Qodo comments header
      '.gln-qodo-comments-header',

    // [2] Load more button
    '.pull-request-tab-content#discussion_bucket button.ajax-pagination-btn[data-disable-with]',

    // [3] Outdated comments
    'details-toggle > details[open]:has([title*="Outdated"])',

    // [4] Resolve conversation button
    'form.js-resolvable-timeline-thread-form button[data-disable-with^="Resolving"]',

    // [5] Resolved but deferred comment container
    'details[data-resolved="true"][data-deferred-details-content-url]',

    // [6] Multiple Qodo comments container
    '.line-comments:has(> .gln-qodo-comment)',

    // [7] Qodo comments in discussion tab
    '.pull-discussion-timeline .TimelineItem:first-child:has([href*=qodo]):not(.js-command-palette-pull-body) .timeline-comment-header,' +
      '.pull-discussion-timeline .TimelineItem:first-child:has([href*=qodo]):not(.js-command-palette-pull-body):not(:has(.timeline-comment-header))',
  ];

  GM_addStyle(/*css*/ `
    @keyframes gln-nodeInserted {
      from { opacity: 0.99; }
      to { opacity: 1; }
    }

    summary, details-collapsible, .gln-qodo-comments-header {
      display: flex !important;
      align-items: start;
    }
    summary > :last-child,
    details-collapsible > :last-child,
    .gln-qodo-comments-header > :last-child {
      flex-grow: 1;
    }


    /* Qodo comments */
    ${selectors[0]},
    /* collapsible section headers */
    ${selectors[1]},
    /* "Load more" button */
    ${selectors[2]},
    /* Outdated comments */
    ${selectors[3]}, 
    /* Resolve QoDo comments button */
    ${selectors[4]},
    /* Resolved deferred comments */
    ${selectors[5]},
    /* Multiple Qodo comments container */
    ${selectors[6]},
    /* Qodo comments in discussion tab */
    ${selectors[7]}
    {
      animation-name: gln-nodeInserted;
      animation-duration: 0.001s;
    }

    /* Qodo comments */

    .TimelineItem:has(.gln-qodo-comments-header) .TimelineItem-avatar,
    .gln-qodo-comments-header .TimelineItem-avatar,
    .timeline-comment--caret:has(.gln-qodo-comments-header):before,
    .timeline-comment--caret:has(.gln-qodo-comments-header):after,
    .TimelineItem.gln-qodo-comments-header + div details-collapsible:before,
    .gln-qodo-comments-header ~ .gln-qodo-comment details-collapsible:before
     {
      display: none !important;
    }

    .timeline-comment-header.gln-qodo-comments-header {
      border: 0;
      margin: 0;
    }

    .gln-qodo-comments-header .avatar.d-inline-block {
      margin-right: 10px;
    }

    .TimelineItem.gln-qodo-comments-header:not(.gln-section-hidden) + [data-view-component] {
      padding-top: 20px !important;
    }
    .gln-qodo-comments-header:has(+ .comment-holder):not(.gln-section-hidden) {
      margin-bottom: 15px;
    }

    .pull-discussion-timeline .TimelineItem:first-child:has([href*=qodo]):not(.js-command-palette-pull-body) .timeline-comment-header:before {
      order: 1;
    }
   
    .gln-qodo-comment > turbo-frame > details-collapsible:before,
    details-collapsible:not(details-collapsible details-collapsible):has([href*=qodo]):before {
      content: '';
      display: block;
      background-image: url('https://avatars.githubusercontent.com/in/484649?s=48&amp;v=4');
      background-size: cover;
      background-position: center;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      border-radius: 4px;
      margin-right: 10px;
    }

    .gln-qodo-comments-header {
      align-items: center;
    }
    .gln-qodo-comments-header>:last-child {
      margin: 0px;
      font-weight: 700;
    }

    /* Discussion tab */
    .pull-request-tab-content#discussion_bucket {
      --stack-padding-normal: 10px;      
    }
    .js-command-palette-pull-body[data-url][data-channel] {
      margin-bottom: 20px;
    }
    .TimelineItem--condensed {
      padding: 0 !important;
    }
    .js-diff-progressive-container:has(.check-annotation-failure) {
      display: none;
    }

    /* Hide not-last Nx-cloud & Currents bot comments */
    .js-timeline-item:has([href="/apps/nx-cloud"]):has(~.js-timeline-item [href="/apps/nx-cloud"]),
    .js-timeline-item:has([href="/apps/nx-cloud"]):has(~ #js-progressive-timeline-item-container .js-timeline-item [href="/apps/nx-cloud"]),
    .js-timeline-item:has([href="/apps/currents-bot"]):has(~.js-timeline-item [href="/apps/currents-bot"]),
    .js-timeline-item:has([href="/apps/currents-bot"]):has(~ #js-progressive-timeline-item-container .js-timeline-item [href="/apps/currents-bot"]) {
      display: none;
    }


    /* Move Nx-cloud & Currents bot comments to the end */
    .js-discussion,
    #js-progressive-timeline-item-container {
      display: flex;
      flex-direction: column;
    }
    .js-timeline-item:has([href="/apps/nx-cloud"]) {
      order: 1500;
    }
    .js-timeline-item:has([href="/apps/currents-bot"]) {
      order: 1501;
    }
    .js-timeline-item:has([href="/apps/github-actions"]) {
      order: 1502;
    }
    

    /* toggle section */

    .gln-section-header {
      pointer-events: auto;
      cursor: pointer;
      /* border: 1px solid #D8DEE4; */
      border-radius: 4px;
      padding: 2px 5px 2px 5px;
      margin: 4px 0;
    }

    .comment-body details > summary:before,
    .gln-section-header:before {     
      margin-right: 9px;      
      position: static;
      width: auto;
      background: none;       
      line-height: 2;
   }

   .comment-body details > summary:before {
    font-size: 12px;
   }

   .gln-section-header:before {
    font-size: 15px;      
   }

   .comment-body details[open] > summary:before,
    .gln-section-header:before {
       content: '▼' !important;
    }

    .comment-body details:not([open]) > summary:before,
    .gln-section-header.gln-section-hidden:before {
      content: '►' !important;
      margin-right: 5px;
    }

    .gln-section-header * {
      pointer-events: none;
    }
    
    .gln-section-header.gln-section-hidden + *,
    .gln-section-header .TimelineItem-badge,
    .gln-section-header.gln-qodo-comments-header.gln-section-hidden ~ .comment-holder
    {
      display: none;
    }


  `);

  const runTasks = () => {
    if (!hasTasks) return;
    let task;
    while ((task = tasks.shift())) {
      task();
    }
    hasTasks = false;
  };

  const addTask = (task) => {
    tasks.push(task);
    if (hasTasks) return;
    hasTasks = true;
    requestAnimationFrame(() => {
      runTasks();
    });
  };

  const onRendered = (event) => {
    try {
      if (event.animationName !== 'gln-nodeInserted') {
        return;
      }

      const target = event.target || event.srcElement;

      // Load more Timeline items
      if (!buttons.has(target) && target.matches(selectors[2])) {
        buttons.add(target);
        addTask(() => {
          target.click();
        });
        return;
      }

      // Collapse outdated comments
      if (!details.has(target) && target.matches(selectors[3])) {
        details.add(target);
        addTask(() => {
          target.open = false;
        });
        return;
      }

      // Touch resolved comments to load them
      if (target.matches(selectors[5])) {
        addTask(() => {
          target
            .querySelector('summary')
            ?.dispatchEvent(new Event('mouseenter'));
        });
        return;
      }

      // Resolve QoDo comments
      if (
        !buttons.has(target) &&
        target.matches(`${selectors[0]} ${selectors[4]}`)
      ) {
        buttons.add(target);
        addTask(() => {
          target.closest('details').open = false;
          if (prAuthor === user) {
            target.click();
          }
        });
        return;
      }

      // Mark QoDo comment containers
      if (!qodos.has(target) && target.matches(selectors[0])) {
        const holder = target.closest('.comment-holder');
        if (holder) {
          qodos.add(holder);
          addTask(() => {
            holder.classList.add('gln-qodo-comment');
          });
        }
      }

      // Multiple Qodo comments
      if (!multiQodos.has(target) && target.matches(selectors[7])) {
        multiQodos.add(target);
        addTask(() => {
          target.classList.add('gln-qodo-comments-header');
        });
      }
      if (!multiQodos.has(target) && target.matches(selectors[6])) {
        if (target.querySelectorAll('.comment-holder')?.length > 1) {
          multiQodos.add(target);
          addTask(() => {
            target.firstElementChild?.insertAdjacentHTML(
              'beforebegin',
              /*html*/ `<div class="gln-qodo-comments-header"><img src="https://avatars.githubusercontent.com/in/484649?s=48&amp;v=4" size="24" height="24" width="24" class="avatar d-inline-block"><span>QoDo comments</span></div>`
            );
          });
        }
      }

      // Collapse sections
      if (
        !sections.has(target) &&
        (target.matches(selectors[1]) || target.matches(selectors[7]))
      ) {
        sections.add(target);
        addTask(() => {
          target.classList.add('gln-section-header', 'gln-section-hidden');
        });
      }

      //
    } catch (e) {}
  };

  const onDocClick = (event) => {
    try {
      const target = event.target;

      // toggleSection
      if (target.matches('.gln-section-header')) {
        const wasHidden = target.classList.contains('gln-section-hidden');
        addTask(() => {
          target.classList.toggle('gln-section-hidden', !wasHidden);
          wasHidden &&
            setTimeout(() => {
              target.scrollIntoViewIfNeeded(false);
            });
          if (
            wasHidden &&
            !expandOnce.has(target) &&
            target.classList.contains('gln-qodo-comments-header')
          ) {
            expandOnce.add(target);
            Array.from(
              target.parentElement.querySelectorAll('details-toggle > details')
            ).forEach((d) => {
              d.open = true;
            });
          }
        });
      }
    } catch (e) {}
  };

  const init = () => {
    if (!initDone) {
      initDone = true;

      prAuthor = document
        .querySelector(
          '.gh-header.js-pull-header-details .author.Link--secondary'
        )
        ?.href.split('/')
        .slice(-1)[0];
      user = document.querySelector('meta[name="user-login"]')?.content;

      // console.info('GitHubHideQodoCrap', { prAuthor, user });

      document.addEventListener('animationstart', onRendered, {
        capture: false,
        passive: true,
      });

      document.addEventListener('click', onDocClick, {
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
})();
