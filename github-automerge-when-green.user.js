// ==UserScript==
// @name         GitHub AutoMergeWhenGreenButton
// @namespace    https://github.com/galloween
// @version      0.45
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
// @grant       GM_addStyle

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

  const imageWait = (color = 'white') =>
    `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20297%20297%22%3E%3Cpath%20fill%3D%22${color}%22%20d%3D%22M251%20277h-18v-32c0-31-17-60-48-82-4-2-7-8-7-15s3-12%207-14c31-22%2048-51%2048-82V20h18a10%2010%200%20000-20H46a10%2010%200%20100%2020h18v32c0%2031%2017%2060%2048%2082%204%202%207%208%207%2015%200%206-3%2012-7%2014-31%2022-48%2051-48%2082v32H46a10%2010%200%20000%2020h205a10%2010%200%20100-20zM84%20245c0-33%2025-55%2040-65%209-6%2015-18%2015-31%200-14-6-26-15-32-15-10-40-32-40-65V20h129v32c0%2033-25%2055-40%2065-9%206-15%2018-15%2031%200%2014%206%2026%2015%2032%2015%2010%2040%2032%2040%2065v32H84v-32z%22%2F%3E%3C%2Fsvg%3E`;

  const imagePlay = (color = 'white') =>
    `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2030.1%2030.1%22%3E%3Cpath%20fill%3D%22${color}%22%20d%3D%22M20%2014.4L13.7%2010a.8.8%200%2000-1.2.6v9a.8.8%200%20001.2.7l6.3-4.5c.2-.2.3-.4.3-.7l-.3-.6z%22%2F%3E%3Cpath%20fill%3D%22${color}%22%20d%3D%22M15%200a15%2015%200%20100%2030%2015%2015%200%20000-30zm0%2027.5a12.5%2012.5%200%20110-25%2012.5%2012.5%200%20010%2025z%22%2F%3E%3C%2Fsvg%3E`;

  const imageStop = (color = 'black') =>
    `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2065.5%2065.5%22%3E%3Cpath%20fill%3D%22${color}%22%20d%3D%22M32.8%200a32.8%2032.8%200%20100%2065.6%2032.8%2032.8%200%20000-65.6zM6%2032.8a26.8%2026.8%200%200144.2-20.3L12.5%2050.2C8.5%2045.5%206%2039.4%206%2032.8zm26.8%2026.7c-6%200-11.5-2-16-5.2l37.5-37.4a26.8%2026.8%200%2001-21.5%2042.7z%22%2F%3E%3C%2Fsvg%3E`;

  const imageAdd = (color = 'green') =>
    `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2050%2050%22%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%2225%22%20fill%3D%22${color}%22%2F%3E%3Cpath%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-miterlimit%3D%2210%22%20stroke-width%3D%223%22%20d%3D%22M25%2013v25M38%2025H13%22%2F%3E%3C%2Fsvg%3E`;

  const imageSuccess = (color = 'green') =>
    `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2050%2050%22%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%2225%22%20fill%3D%22${color}%22%2F%3E%3Cpath%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-miterlimit%3D%2210%22%20stroke-width%3D%223%22%20d%3D%22M38%2015L22%2033l-10-8%22%2F%3E%3C%2Fsvg%3E`;

  const imageError = (color = 'red') =>
    `data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2050%2050%22%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%2225%22%20fill%3D%22${color}%22%2F%3E%3Cpath%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-linecap%3D%22round%22%20stroke-miterlimit%3D%2210%22%20stroke-width%3D%223%22%20d%3D%22M16%2034l9-9%209-9M16%2016l9%209%209%209%22%2F%3E%3C%2Fsvg%3E`;

  const autoMergeControlsHTML = `
    <div class="gam-controls-container">
      <button type="button" class="gam-button btn btn-primary mr-2">Auto merge when green</button>
      <button type="button" class="gam-cancel-button btn btn-secondary mr-2" hidden>Cancel</button>
      <label class="gam-waitForApproval-label js-reviewed-toggle mr-2 px-2 py-1 rounded-1 f6 text-normal d-flex flex-items-center border text-gray border-gray-dark"><input type="checkbox" id="gam-waitForApproval" class="gam-waitForApproval mr-1 js-reviewed-checkbox" type="checkbox">Wait for approval</label>
      <span class="gam-triangle" aria-hidden="true"></span>
      <p class="gam-status-message"></p>
    </div>
  `;

  let githubApp,
    PRid,
    mergeButton,
    checkFailedEl,
    changesRequestedEl,
    hasConflictsEl,
    mergeButtonContainer,
    controlsContainer,
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
    waitForApprovalChkbx,
    statusMessageEl,
    mergeCompleted;

  GM_addStyle(`
    .pull-discussion-timeline .discussion-timeline-actions {
      display: flex; flex-direction: column;
    }

    .discussion-timeline-actions #partial-pull-merging {
      order: 1;
    }

    .discussion-timeline-actions .js-issue-connector-container {
      order: 3;
    }

    .discussion-timeline-actions .timeline-comment-wrapper {
      order: 4;
    }

    .gam-controls-container {
      display: flex;
      flex-wrap: wrap;
      position: relative;
      order: 2;
      padding: 15px;
      margin-top: -6px;
      margin-bottom: 16px;
      border: 1px solid #2cbe4e;
      border-radius: 3px;
      margin-left: 55px;
    }

    .gam-controls-container .gam-button, .gam-controls-container .gam-cancel-button {
      background-position: left 10px top 50% !important;
      background-repeat: no-repeat !important;
      padding-left: 35px;
      margin-right: 8px;
      user-select: none;
    }

    .gam-controls-container .gam-cancel-button {
      background-image: url(${imageStop()});
      background-size: 17px auto;
    }

    .gam-controls-container .gam-button {
      background-image: url(${imagePlay()});
      background-size: 20px auto;
    }

    .gam-waitForApproval-label {
      cursor:pointer;
      user-select: none;
    }

    .gam-cancel-button:not([hidden]) + .gam-waitForApproval-label {
      cursor: default;
    }

    .gam-controls-container .gam-triangle {
      width: 0;
      height: 0;
      border-left: 20px solid transparent;
      border-right: 20px solid transparent;
      border-bottom: 20px solid #2cbe4e;
      position: absolute;
      top: -20px; left: 83px;
    }

    .gam-controls-container .gam-status-message {
      width: 100%;
      margin: 8px 0 0 0;
      line-height: 1.2;
      font-size: 80%;
    }

    .gam-controls-container .gam-status-message:empty {
      display: none;
    }

    .gam-controls-container .gam-status-message span {
      display: flex;
      white-space: pre-line;
      min-height: 20px;
      align-items: center;
      background-position: left 0 top 50%;
      background-repeat: no-repeat;
      background-size: 15px auto;
      padding-left: 25px;
      white-space: pre-line;
    }
  `);

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
      const message = 'Recognized this PR, resuming auto-merge';
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\n' + message
      );
      if (statusMessageEl) {
        statusMessageEl.innerHTML = `<span style="color: green; background-image: url(${imageAdd()})">${message}</span>`;
      }

      autoMergeStarted = true;
    }
  };

  const doChecks = () => {
    if (checkIfTestsPass()) {
      mergeButton = $(
        '.merge-pr:not(.open) .mergeability-details .btn-group-merge'
      );

      if (
        (mergeButton && mergeButton.disabled) ||
        (mergeButton && autoMergeStarted)
      ) {
        addAutoMergeButton(autoMergeStarted);
      }

      if (mergeButton && !mergeButton.disabled && !autoMergeStarted) {
        const message = 'Branch can be merged, no auto-merge needed';
        console.log(
          '%cAutoMergeWhenGreen: %c"' + PRid,
          'color: orange',
          'color: yellow',
          '\n' + message
        );
        if (statusMessageEl) {
          statusMessageEl.innerHTML = `<span style="color: orange; background-image: url(${imageSuccess(
            'orange'
          )})">${message}</span>`;
        }

        finishAutoMerge(true);
        return;
      }

      if (!mergeButton && !autoMergeStarted) {
        const message = 'Nothing to merge here';
        console.log(
          '%cAutoMergeWhenGreen: %c"' + PRid,
          'color: orange',
          'color: yellow',
          '\n' + message
        );
        if (statusMessageEl) {
          statusMessageEl.innerHTML = `<span style="color: orange; background-image: url(${imageStop(
            'orange'
          )})">${message}</span>`;
        }
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
    controlsContainer = $('.gam-controls-container');

    if (!controlsContainer) {
      mergeButtonContainer = $('#partial-pull-merging');

      insertHTMLafter(autoMergeControlsHTML, mergeButtonContainer);

      autoMergeButton = $('.gam-button', mergeButtonContainer.parentNode);
      autoMergeCancelButton = $(
        '.gam-cancel-button',
        mergeButtonContainer.parentNode
      );
      waitForApprovalChkbx = $(
        '.gam-waitForApproval',
        mergeButtonContainer.parentNode
      );
      statusMessageEl = $(
        '.gam-status-message',
        mergeButtonContainer.parentNode
      );

      waitForApprovalChkbx.checked = needApprovalGlobal;
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
      autoMergeButton.innerText = 'Will merge when green';
      waitForApprovalChkbx.disabled = true;
    }

    if (inProgress && autoMergeCancelButton) {
      autoMergeCancelButton.hidden = false;
    }

    if (!inProgress && autoMergeButton) {
      autoMergeButton.disabled = false;
      autoMergeButton.innerText = 'Auto merge when green';
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

    const message = 'Waiting for the Merge button to become enabled...';
    console.log(
      '%cAutoMergeWhenGreen: %c"' + PRid,
      'color: green',
      'color: yellow',
      '\n' + message
    );
    if (statusMessageEl) {
      statusMessageEl.innerHTML = `<span style="color: green; background-image: url(${imageWait(
        'green'
      )})">${message}</span>`;
    }

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
    const message = 'Auto-merge cancelled';
    console.log(
      '%cAutoMergeWhenGreen: %c"' + PRid,
      'color: orange',
      'color: yellow',
      '\n' + message
    );
    if (statusMessageEl) {
      statusMessageEl.innerHTML = `<span style="color: orange; background-image: url(${imageError(
        'orange'
      )})">${message}</span>`;
    }

    finishAutoMerge(false);
  };

  const checkIfChangesRequested = (forceMessage = false) => {
    changesRequestedEl = $$(
      '.mergeability-details .status-heading.text-red'
    ).filter(el => el.innerHTML.toLowerCase().includes('changes requested'))[0];

    if (changesRequestedEl && (!changesRequestedMessageShown || forceMessage)) {
      const message =
        'Changes were requested. Cant merge PR. Fix and come back';
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: red',
        'color: pink',
        '\n' + message
      );
      if (statusMessageEl) {
        statusMessageEl.innerHTML = `<span style="color: red; background-image: url(${imageError()})">${message}</span>`;
      }

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
      const message = 'Branch has conflicts. Cant merge PR. Fix and come back';
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: red',
        'color: pink',
        '\n' + message
      );
      if (statusMessageEl) {
        statusMessageEl.innerHTML = `<span style="color: red; background-image: url(${imageError()})">${message}</span>`;
      }

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
      const message =
        'PR has not been approved yet. Will wait until approved. Dont forget to request review!';
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: orange',
        'color: yellow',
        '\n' + message
      );
      if (statusMessageEl) {
        statusMessageEl.innerHTML = `<span style="color: orange; background-image: url(${imageStop(
          'orange'
        )})">${message}</span>`;
      }

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
      const message = 'Auto-merge is taking too long, giving up';
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: red',
        'color: pink',
        '\n' + message
      );
      if (statusMessageEl) {
        statusMessageEl.innerHTML = `<span style="color: red; background-image: url(${imageError()})">${message}</span>`;
      }

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
      const message = 'Your tests fail. Cant merge PR. Fix and come back';
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: red',
        'color: pink',
        '\n' + message
      );
      if (statusMessageEl) {
        statusMessageEl.innerHTML = `<span style="color: red; background-image: url(${imageError()})">${message}</span>`;
      }

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

      const message = 'Updating branch...';
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\n' + message
      );
      if (statusMessageEl) {
        statusMessageEl.innerHTML = `<span style="color: green; background-image: url(${imageWait(
          'green'
        )})">${message}</span>`;
      }
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

      const message = 'Merge confirmed!';
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\n' + message
      );
      if (statusMessageEl) {
        statusMessageEl.innerHTML = `<span style="color: green; background-image: url(${imageSuccess()})">${message}</span>`;
      }

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
      if (controlsContainer) {
        autoMergeButton.disabled = true;
        hideElement($('#partial-pull-merging'));
        controlsContainer.style.marginTop = '16px';
        removeElement($('.gam-triangle', controlsContainer));

        setTimeout(() => {
          removeElement(controlsContainer);
        }, 1000 * 60 * 25);
      }

      finishAutoMerge(true);

      const message = 'Merge completed, branch deleted';
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\n' + message
      );
      if (statusMessageEl) {
        statusMessageEl.innerHTML = `<span style="color: green; background-image: url(${imageSuccess()})">${message}</span>`;
      }

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

      const message = 'Merge started!';
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\n' + message
      );
      if (statusMessageEl) {
        statusMessageEl.innerHTML = `<span style="color: green; background-image: url(${imageSuccess()})">${message}</span>`;
      }

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

  const insertHTMLafter = (html, element) => {
    element.insertAdjacentHTML('afterEnd', html);
  };

  const removeElement = element => {
    if (element && typeof element.remove === 'function') {
      element.remove();
    }
    element = null;
  };

  const hideElement = element => {
    if (element && typeof element.remove === 'function') {
      element.style.display = 'none';
    }
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
