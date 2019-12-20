// ==UserScript==
// @name         GitHub AutoMergeWhenGreenButton
// @namespace    https://github.com/galloween
// @version      0.35
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
// @grant       GM_listValues
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

  const imageAdd =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiM0M2IwNWMiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0yNSAxM3YyNU0zOCAyNUgxMyIvPjwvc3ZnPg==';

  const imageSuccess =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMyNWFlODgiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0zOCAxNUwyMiAzM2wtMTAtOCIvPjwvc3ZnPg==';

  const imageCancel =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiNkNzVhNGEiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xNiAzNGw5LTkgOS05TTE2IDE2bDkgOSA5IDkiLz48L3N2Zz4=';

  const imageWait =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyOTcgMjk3Ij48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTI1MSAyNzdoLTE4di0zMmMwLTMxLTE3LTYwLTQ4LTgyLTQtMi03LTgtNy0xNXMzLTEyIDctMTRjMzEtMjIgNDgtNTEgNDgtODJWMjBoMThhMTAgMTAgMCAwMDAtMjBINDZhMTAgMTAgMCAxMDAgMjBoMTh2MzJjMCAzMSAxNyA2MCA0OCA4MiA0IDIgNyA4IDcgMTUgMCA2LTMgMTItNyAxNC0zMSAyMi00OCA1MS00OCA4MnYzMkg0NmExMCAxMCAwIDAwMCAyMGgyMDVhMTAgMTAgMCAxMDAtMjB6TTg0IDI0NWMwLTMzIDI1LTU1IDQwLTY1IDktNiAxNS0xOCAxNS0zMSAwLTE0LTYtMjYtMTUtMzItMTUtMTAtNDAtMzItNDAtNjVWMjBoMTI5djMyYzAgMzMtMjUgNTUtNDAgNjUtOSA2LTE1IDE4LTE1IDMxIDAgMTQgNiAyNiAxNSAzMiAxNSAxMCA0MCAzMiA0MCA2NXYzMkg4NHYtMzJ6Ii8+PC9zdmc+';

  const imagePlay =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMC4xIDMwLjEiPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNMjAgMTQuNEwxMy43IDEwYS44LjggMCAwMC0xLjIuNnY5YS44LjggMCAwMDEuMi43bDYuMy00LjVjLjItLjIuMy0uNC4zLS43bC0uMy0uNnoiLz48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTE1IDBhMTUgMTUgMCAxMDAgMzAgMTUgMTUgMCAwMDAtMzB6bTAgMjcuNWExMi41IDEyLjUgMCAxMTAtMjUgMTIuNSAxMi41IDAgMDEwIDI1eiIvPjwvc3ZnPg==';

  const imageStop =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NS41IDY1LjUiPjxwYXRoIGZpbGw9ImJsYWNrIiBkPSJNMzIuOCAwYTMyLjggMzIuOCAwIDEwMCA2NS42IDMyLjggMzIuOCAwIDAwMC02NS42ek02IDMyLjhhMjYuOCAyNi44IDAgMDE0NC4yLTIwLjNMMTIuNSA1MC4yQzguNSA0NS41IDYgMzkuNCA2IDMyLjh6bTI2LjggMjYuN2MtNiAwLTExLjUtMi0xNi01LjJsMzcuNS0zNy40YTI2LjggMjYuOCAwIDAxLTIxLjUgNDIuN3oiLz48L3N2Zz4=';

  const buttonStyle =
    'background-position: left 10px top 50%; background-repeat: no-repeat; padding-left: 35px; margin-left: 15px;';

  let githubApp,
    PRid,
    mergeButton,
    checkFailedEl,
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
    mergingBranches,
    refreshIntervalId,
    timeStampNow;

  const init = () => {
    timeStampNow = new Date().getTime();
    githubApp = $('.application-main');
    mergingBranches = GM_getValue('GHAMWG_mergingBranches', {});

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
    const testsPass = checkIfTestsPass();

    if (testsPass) {
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

        finishAutoMerge();
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
      autoMergeButton = document.createElement('button');
      autoMergeButton.setAttribute('type', 'button');
      autoMergeButton.classList.add('gam-button', 'btn', 'btn-primary');
      autoMergeButton.setAttribute('style', buttonStyle);
      setAMButtonImgPlay();
      mergeButtonContainer.setAttribute('style', 'display: block;');
      mergeButtonContainer.appendChild(autoMergeButton);
      autoMergeButton = $('.gam-button', mergeButtonContainer);

      autoMergeButton.addEventListener('click', () => {
        mergingBranches[PRid] = timeStampNow;
        GM_setValue('GHAMWG_mergingBranches', mergingBranches);
        autoMergeStarted = true;
        observer.disconnect();
        observer.observe(githubApp, obsrverConfig);

        autoMergeButton.disabled = true;
        setAMButtonImgWait();

        if (autoMergeCancelButton) {
          autoMergeCancelButton.hidden = false;
        }

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
      });
    }
    if (!autoMergeCancelButton) {
      autoMergeCancelButton = document.createElement('button');
      autoMergeCancelButton.setAttribute('type', 'button');
      autoMergeCancelButton.hidden = true;
      autoMergeCancelButton.classList.add(
        'gam-cancel-button',
        'btn',
        'btn-secondary'
      );
      autoMergeCancelButton.setAttribute(
        'style',
        buttonStyle +
          ' background-image: url(' +
          imageStop +
          '); background-size: 17px auto; '
      );
      setAMButtonImgPlay();
      autoMergeCancelButton.innerText = 'Cancel';
      mergeButtonContainer.appendChild(autoMergeCancelButton);
      autoMergeCancelButton = $('.gam-cancel-button', mergeButtonContainer);

      autoMergeCancelButton.addEventListener('click', () => {
        console.log(
          '%cAutoMergeWhenGreen: %c"' + PRid,
          'color: orange',
          'color: yellow',
          '\nAuto-merge cancelled.'
        );
        finishAutoMerge();
      });
    }

    if (autostart && !autoMergeButton.disabled) {
      autoMergeButton.click();
    }
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
        image: imageCancel,
        timeout: !autoMergeStarted ? 10000 : 0,
      });

      finishAutoMerge();
      return true;
    }
    return false;
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

  const checkIfTestsPass = () => {
    checkFailedEl = $('.mergeability-details .status-heading.text-red');
    const checkFailed =
      checkFailedEl &&
      checkFailedEl.innerHTML.toLowerCase().includes('check') &&
      checkFailedEl.innerHTML.toLowerCase().includes('fail');

    if (checkFailed && !testFailMessageShown) {
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: red',
        'color: pink',
        '\nYour tests fail. Cant merge PR. Fix and come back.'
      );

      GM_notification({
        title: 'Tests failed',
        text: PRid,
        image: imageCancel,
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
      finishAutoMerge();

      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRid,
        'color: green',
        'color: yellow',
        '\nBranch deleted.'
      );

      GM_notification({
        title: 'Merge complete!',
        text: PRid,
        image: imageSuccess,
        timeout: 12000,
      });
    }
  };

  const checkIfCanMerge = () => {
    mergeButton = $(
      '.merge-pr:not(.open) .mergeability-details .btn-group-merge'
    );
    if (mergeButton && !mergeButton.disabled) {
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
        image: imageAdd,
        timeout: 7000,
      });
      testFailMessageShown = false;
    }
  };

  const finishAutoMerge = () => {
    autoMergeStarted = false;
    testFailMessageShown = false;
    observer.disconnect();

    if (autoMergeButton) {
      autoMergeButton.disabled = false;
      setAMButtonImgPlay();
    }

    if (autoMergeCancelButton) {
      autoMergeCancelButton.hidden = true;
    }

    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
      refreshIntervalId = null;
    }

    delete mergingBranches[PRid];
    GM_setValue('GHAMWG_mergingBranches', mergingBranches);
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
