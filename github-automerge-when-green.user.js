// ==UserScript==
// @name         GitHub AutoMergeWhenGreenButton
// @namespace    https://github.com/galloween
// @version      0.4
// @description  adds 'Auto merge when green button'
// @author       Pasha Golovin
// @updateURL   https://raw.githubusercontent.com/galloween/github-automerge-when-green/master/github-automerge-when-green.user.js
// @downloadURL https://raw.githubusercontent.com/galloween/github-automerge-when-green/master/github-automerge-when-green.user.js

// @include     *github.com/*/pull/*
// @run-at      document-idle
// @connect     github.com
// @connect     githubusercontent.com
// @grant       GM_notification
// @grant       GM_setValue
// @grant       GM_getValue

// ==/UserScript==

(() => {
  'use strict';

  const refreshAfterMin = 5;
  const giveUpAfterHours = 1.5;

  const obsrverConfig = {
    childList: true,
    subtree: true,
    characterData: false,
  };

  const imageWait =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyOTcgMjk3Ij48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTI1MSAyNzdoLTE4di0zMmMwLTMxLTE3LTYwLTQ4LTgyLTQtMi03LTgtNy0xNXMzLTEyIDctMTRjMzEtMjIgNDgtNTEgNDgtODJWMjBoMThhMTAgMTAgMCAwMDAtMjBINDZhMTAgMTAgMCAxMDAgMjBoMTh2MzJjMCAzMSAxNyA2MCA0OCA4MiA0IDIgNyA4IDcgMTUgMCA2LTMgMTItNyAxNC0zMSAyMi00OCA1MS00OCA4MnYzMkg0NmExMCAxMCAwIDAwMCAyMGgyMDVhMTAgMTAgMCAxMDAtMjB6TTg0IDI0NWMwLTMzIDI1LTU1IDQwLTY1IDktNiAxNS0xOCAxNS0zMSAwLTE0LTYtMjYtMTUtMzItMTUtMTAtNDAtMzItNDAtNjVWMjBoMTI5djMyYzAgMzMtMjUgNTUtNDAgNjUtOSA2LTE1IDE4LTE1IDMxIDAgMTQgNiAyNiAxNSAzMiAxNSAxMCA0MCAzMiA0MCA2NXYzMkg4NHYtMzJ6Ii8+PC9zdmc+';

  const imagePlay =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMC4xIDMwLjEiPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNMjAgMTQuNEwxMy43IDEwYS44LjggMCAwMC0xLjIuNnY5YS44LjggMCAwMDEuMi43bDYuMy00LjVjLjItLjIuMy0uNC4zLS43bC0uMy0uNnoiLz48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTE1IDBhMTUgMTUgMCAxMDAgMzAgMTUgMTUgMCAwMDAtMzB6bTAgMjcuNWExMi41IDEyLjUgMCAxMTAtMjUgMTIuNSAxMi41IDAgMDEwIDI1eiIvPjwvc3ZnPg==';

  const imageStop =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NS41IDY1LjUiPjxwYXRoIGZpbGw9ImJsYWNrIiBkPSJNMzIuOCAwYTMyLjggMzIuOCAwIDEwMCA2NS42IDMyLjggMzIuOCAwIDAwMC02NS42ek02IDMyLjhhMjYuOCAyNi44IDAgMDE0NC4yLTIwLjNMMTIuNSA1MC4yQzguNSA0NS41IDYgMzkuNCA2IDMyLjh6bTI2LjggMjYuN2MtNiAwLTExLjUtMi0xNi01LjJsMzcuNS0zNy40YTI2LjggMjYuOCAwIDAxLTIxLjUgNDIuN3oiLz48L3N2Zz4=';

  const buttonStyle =
    'background-position: left 10px top 50%; background-repeat: no-repeat; padding-left: 35px; user-select: none;';

  const autoMergeControlsHTML = `
    <button type="button" class="gam-button btn btn-primary ml-2" style="${buttonStyle}"></button>
    <button type="button" class="gam-cancel-button btn btn-secondary ml-2" style="${buttonStyle} background-image: url(${imageStop}); background-size: 17px auto;" hidden>Cancel</button>
    <label class="js-reviewed-toggle ml-2 px-2 py-1 rounded-1 f6 text-normal d-flex flex-items-center border text-gray border-gray-dark" style="cursor:pointer; user-select: none;"><input type="checkbox" id="gam-waitForApproval" class="gam-waitForApproval mr-1 js-reviewed-checkbox" type="checkbox">Wait for approval</label>
  `;

  let githubApp,
    PRid,
    mergeButton,
    checkFailedEl,
    changesRequestedEl,
    hasConflictsEl,
    mergeButtonContainer,
    autoMergeButton,
    autoMergeCancelButton,
    deleteBranchButton,
    restoreBranchButton,
    confirmMergeButton,
    updateBranchButton,
    autoMergeStarted,
    observer,
    testFailMessageShown,
    changesRequestedMessageShown,
    hasConflictsMessageShown,
    needsApprovalMessageShown,
    mergingBranches,
    refreshIntervalId,
    timeStampNow,
    hasApprovalEl,
    needApprovalGlobal,
    waitForApprovalChkbx;

  const init = () => {
    timeStampNow = new Date().getTime();
    githubApp = $('.application-main');
    mergingBranches = GM_getValue('GHAMWG_mergingBranches', {});
    needApprovalGlobal = GM_getValue('GHAMWG_needApprovalGlobal', true);

    if (!githubApp) {
      console.log(
        '%cAutoMergeWhenGreen:',
        'color: orange',
        'Cant find Github .application-main element.'
      );
      setTimeout(init, 1000);
      return;
    }

    if (!observer) {
      observer = new MutationObserver(
        debounce(() => {
          doChecks();
        }, 1000)
      );

      observer.observe(githubApp, obsrverConfig);

      githubApp.addEventListener('click', event => {
        const target = event.target;

        if (target.classList.contains('gam-button')) {
          onAutoMergeButtonClick();
        }

        if (target.classList.contains('gam-cancel-button')) {
          onAutoMergeCancelButtonClick();
        }
      });

      githubApp.addEventListener('change', event => {
        const target = event.target;

        if (target.classList.contains('gam-waitForApproval')) {
          needApprovalGlobal = target.checked;
          GM_setValue('GHAMWG_needApprovalGlobal', needApprovalGlobal);
        }
      });
    }

    if (!PRid) {
      setPRid();
    }

    if (autoMergeStarted) {
      doChecks();
    }
  };

  const setPRid = () => {
    const PRtitleEl = $('.repository-content .pull.request .gh-header-title');
    const PRname = PRtitleEl && PRtitleEl.innerText;
    const branchNameEl = $(
      '.repository-content .pull.request .commit-ref.head-ref'
    );
    const branchName = branchNameEl && branchNameEl.innerText;
    PRid = PRname && branchName && PRname + '" (' + branchName + ')';

    if (
      PRid &&
      mergingBranches[PRid] &&
      hoursBetweenTimeStamps(timeStampNow, mergingBranches[PRid]) <=
        giveUpAfterHours
    ) {
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\nRecognized this PR, will resume auto-merge.'
      );

      autoMergeStarted = true;
    }
  };

  const doChecks = () => {
    if (checkIfTestsPass()) {
      mergeButton = $(
        '.merge-pr:not(.open) .mergeability-details .btn-group-merge'
      );
      mergeButtonContainer = mergeButton && mergeButton.closest('.select-menu');

      if (mergeButton && mergeButtonContainer && mergeButton.disabled) {
        addAutoMergeButton(autoMergeStarted);
      }

      if (mergeButton && !mergeButton.disabled && !autoMergeStarted) {
        console.log(
          '%cAutoMergeWhenGreen: %c"' + PRid,
          'color: orange',
          'color: yellow',
          '\nBranch can be merged, no auto-merge needed.'
        );

        finishAutoMerge(true);
        return;
      }

      if (!mergeButton && !autoMergeStarted) {
        console.log(
          '%cAutoMergeWhenGreen: %c"' + PRid,
          'color: orange',
          'color: yellow',
          '\nNothing to merge here.'
        );
      }

      if (
        mergeButton &&
        (checkIfChangesRequested(false) || checkIfHasConflicts(false))
      ) {
        finishAutoMerge(true);
        return;
      }

      if (autoMergeStarted && !checkIfNeedToGiveUp()) {
        checkIfBranchOutOfDate();
        checkIfCanMerge();
        checkIfNeedToConfirm();
        checkIfNeedToDeleteBranch();
      }
    }
  };

  const addAutoMergeButton = (autostart = false) => {
    autoMergeButton = $('.merge-pr .gam-button');
    autoMergeCancelButton = $('.merge-pr .gam-cancel-button');

    if (!autoMergeButton) {
      mergeButtonContainer.setAttribute('style', 'display: flex !important;');
      mergeButtonContainer.insertAdjacentHTML(
        'beforeend',
        autoMergeControlsHTML
      );
      autoMergeButton = $('.gam-button', mergeButtonContainer);
      setAMButtonImgPlay();
      waitForApprovalChkbx = $('#gam-waitForApproval', mergeButtonContainer);
      waitForApprovalChkbx.checked = needApprovalGlobal;
      autoMergeCancelButton = $('.gam-cancel-button', mergeButtonContainer);
    }

    if (autostart && !autoMergeButton.disabled) {
      if (autoMergeStarted && refreshIntervalId) {
        switchButtonsView(true);
      } else {
        autoMergeButton.click();
      }
    }
  };

  const switchButtonsView = (inProgress = true) => {
    if (inProgress && autoMergeButton) {
      autoMergeButton.disabled = true;
      setAMButtonImgWait();
      waitForApprovalChkbx.disabled = true;
      console.log(waitForApprovalChkbx.disabled);
    }

    if (inProgress && autoMergeCancelButton) {
      autoMergeCancelButton.hidden = false;
    }

    if (!inProgress && autoMergeButton) {
      autoMergeButton.disabled = false;
      setAMButtonImgPlay();
      waitForApprovalChkbx.disabled = false;
    }

    if (!inProgress && autoMergeCancelButton) {
      autoMergeCancelButton.hidden = true;
    }
  };

  const onAutoMergeButtonClick = () => {
    mergingBranches[PRid] = timeStampNow;
    GM_setValue('GHAMWG_mergingBranches', mergingBranches);
    autoMergeStarted = true;
    observer.disconnect();
    observer.observe(githubApp, obsrverConfig);

    switchButtonsView(true);

    console.log(
      '%cAutoMergeWhenGreen: %c"' + PRid,
      'color: green',
      'color: yellow',
      '\nWaiting for the Merge button to become enabled...'
    );

    clearInterval(refreshIntervalId);
    refreshIntervalId = setInterval(() => {
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\nWill refresh page...'
      );

      location.reload();
    }, 1000 * 60 * refreshAfterMin);
  };

  const onAutoMergeCancelButtonClick = () => {
    console.log(
      '%cAutoMergeWhenGreen: %c"' + PRid,
      'color: orange',
      'color: yellow',
      '\nAuto-merge cancelled.'
    );
    finishAutoMerge(false);
  };

  const setAMButtonImgWait = () => {
    autoMergeButton.style.backgroundImage = 'url(' + imageWait + ')';
    autoMergeButton.style.backgroundSize = '15px auto';
    autoMergeButton.innerText = 'Will merge when green';
  };

  const setAMButtonImgPlay = () => {
    autoMergeButton.style.backgroundImage = 'url(' + imagePlay + ')';
    autoMergeButton.style.backgroundSize = '20px auto';
    autoMergeButton.innerText = 'Auto merge when green';
  };

  const checkIfChangesRequested = (forceMessage = false) => {
    changesRequestedEl = $$(
      '.mergeability-details .status-heading.text-red'
    ).filter(el => el.innerHTML.toLowerCase().includes('changes requested'))[0];

    if (changesRequestedEl && (!changesRequestedMessageShown || forceMessage)) {
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: red',
        'color: pink',
        '\nChanges were requested. Cant merge PR. Fix and come back.'
      );

      GM_notification({
        title: 'Changes requested',
        text: PRid,
        timeout: !autoMergeStarted ? 10000 : 0,
      });

      changesRequestedMessageShown = true;
      autoMergeStarted = false;
    }

    if (changesRequestedEl) {
      return true;
    }
    return false;
  };

  const checkIfHasConflicts = (forceMessage = false) => {
    hasConflictsEl = $$(
      '.mergeability-details .completeness-indicator-problem + .status-heading'
    ).filter(
      el =>
        el.innerHTML.toLowerCase().includes('has conflicts') &&
        el.innerHTML.toLowerCase().includes('must be resolved')
    )[0];

    if (hasConflictsEl && (!hasConflictsMessageShown || forceMessage)) {
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: red',
        'color: pink',
        '\nBranch has conflicts. Cant merge PR. Fix and come back.'
      );

      GM_notification({
        title: 'Branch has conflicts',
        text: PRid,
        timeout: !autoMergeStarted ? 10000 : 0,
      });

      hasConflictsMessageShown = true;
      autoMergeStarted = false;
    }

    if (hasConflictsEl) {
      return true;
    }
    return false;
  };

  const checkIfApproved = (forceMessage = false) => {
    hasApprovalEl = $(
      '.pull-discussion-timeline .js-discussion .js-timeline-item .is-approved'
    );

    if (
      needApprovalGlobal &&
      !hasApprovalEl &&
      (!needsApprovalMessageShown || forceMessage)
    ) {
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: orange',
        'color: yellow',
        '\nPR has not been approved yet. Will wait until approved. Dont forget to request review!'
      );

      GM_notification({
        title: 'PR needs approval',
        text: PRid,
        timeout: !autoMergeStarted ? 10000 : 0,
      });

      needsApprovalMessageShown = true;
    }

    if (!needApprovalGlobal || hasApprovalEl) {
      return true;
    }

    return false;
  };

  const checkIfNeedToGiveUp = () => {
    const timeNow = new Date().getTime();

    if (
      mergingBranches[PRid] &&
      hoursBetweenTimeStamps(timeNow, mergingBranches[PRid]) > giveUpAfterHours
    ) {
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: red',
        'color: pink',
        '\nAuto-merge is taking too long, giving up.'
      );

      GM_notification({
        title: 'Auto-merge cancelled (timeout)',
        text: PRid,
        timeout: !autoMergeStarted ? 10000 : 0,
      });

      finishAutoMerge(false);
      return true;
    }
    return false;
  };

  const checkIfTestsPass = (forceMessage = false) => {
    checkFailedEl = $('.mergeability-details .status-heading.text-red');
    const checkFailed =
      checkFailedEl &&
      checkFailedEl.innerHTML.toLowerCase().includes('check') &&
      checkFailedEl.innerHTML.toLowerCase().includes('fail');

    if (checkFailed && (!testFailMessageShown || forceMessage)) {
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: red',
        'color: pink',
        '\nYour tests fail. Cant merge PR. Fix and come back.'
      );

      GM_notification({
        title: 'Tests failed',
        text: PRid,
        timeout: !autoMergeStarted ? 10000 : 0,
      });

      testFailMessageShown = true;
      autoMergeStarted = false;
    }

    if (checkFailed) {
      return false;
    }

    return true;
  };

  const checkIfBranchOutOfDate = () => {
    updateBranchButton = $(
      '.mergeability-details .branch-action-btn > button[type=submit]'
    );

    if (
      updateBranchButton &&
      updateBranchButton.innerHTML.toLowerCase().includes('update')
    ) {
      updateBranchButton.click();
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\nUpdating branch...'
      );
    }
  };

  const checkIfNeedToConfirm = () => {
    confirmMergeButton = $(
      '.merge-pr.open .merge-branch-form .commit-form-actions .btn-primary'
    );

    if (
      confirmMergeButton &&
      confirmMergeButton.innerHTML.toLowerCase().includes('confirm')
    ) {
      confirmMergeButton.click();

      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\nMerge confirmed!'
      );

      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
      }
    }
  };

  const checkIfNeedToDeleteBranch = () => {
    restoreBranchButton = $(
      '.pull-request-ref-restore .btn.pull-request-ref-restore-text'
    );
    deleteBranchButton = $(
      '.branch-action-state-merged .post-merge-message > button[type=submit]'
    );

    const alreadyDeleted =
      restoreBranchButton &&
      restoreBranchButton.innerHTML.toLowerCase().includes('restore') &&
      restoreBranchButton.innerHTML.toLowerCase().includes('branch');

    const canDelete =
      deleteBranchButton &&
      deleteBranchButton.innerHTML.toLowerCase().includes('delete') &&
      deleteBranchButton.innerHTML.toLowerCase().includes('branch');

    if (canDelete) {
      deleteBranchButton.click();
    }

    if (alreadyDeleted || canDelete) {
      finishAutoMerge(true);

      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\nBranch deleted.'
      );

      GM_notification({
        title: 'Merge complete!',
        text: PRid,
        timeout: 12000,
      });
    }
  };

  const checkIfCanMerge = () => {
    mergeButton = $(
      '.merge-pr:not(.open) .mergeability-details .btn-group-merge'
    );
    if (mergeButton && !mergeButton.disabled && checkIfApproved()) {
      mergeButton.click();
      removeElement(autoMergeButton);
      removeElement(autoMergeCancelButton);

      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\nMerge started!'
      );
      GM_notification({
        title: 'Merge started',
        text: PRid,
        timeout: 7000,
      });
      testFailMessageShown = false;
      changesRequestedMessageShown = false;
      hasConflictsMessageShown = false;
      needsApprovalMessageShown = false;
    }
  };

  const finishAutoMerge = (disconnect = true) => {
    autoMergeStarted = false;

    if (disconnect) {
      testFailMessageShown = false;
      changesRequestedMessageShown = false;
      hasConflictsMessageShown = false;
      needsApprovalMessageShown = false;
    }

    switchButtonsView(false);

    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
      refreshIntervalId = null;
    }

    delete mergingBranches[PRid];
    GM_setValue('GHAMWG_mergingBranches', mergingBranches);

    if (disconnect) {
      observer.disconnect();
    }
  };

  const removeElement = element => {
    if (element && typeof element.remove === 'function') {
      element.remove();
    }
    element = null;
  };

  const $ = (str, el) => (el || document).querySelector(str);

  const $$ = (str, el) => [...(el || document).querySelectorAll(str)];

  const hoursBetweenTimeStamps = (dm1, dm2) =>
    Math.round((Math.abs(dm1 - dm2) / 3600000) * 100) / 100;

  function debounce(callback, time) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(function() {
        timeout = null;
        callback.apply(context, args);
      }, time);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init);
  } else {
    init();
  }
})();
