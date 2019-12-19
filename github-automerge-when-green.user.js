// ==UserScript==
// @name         GitHub AutoMergeWhenGreenButton
// @namespace    https://github.com/galloween
// @version      0.2
// @description  adds 'Auto merge when green button'
// @author       Pasha Golovin
// @updateURL   https://raw.githubusercontent.com/galloween/github-automerge-when-green/master/github-automerge-when-green.user.js
// @downloadURL https://raw.githubusercontent.com/galloween/github-automerge-when-green/master/github-automerge-when-green.user.js

// @include     *github.com/*/pull/*
// @run-at      document-idle
// @connect     github.com
// @connect     githubusercontent.com
// @grant       GM_notification
// ==/UserScript==

(() => {
  'use strict';

  let githubApp,
    PRname,
    branchName,
    mergeButton,
    checkFailedEl,
    mergeButtonContainer,
    autoMergeButton,
    deleteBranchButton,
    restoreBranchButton,
    confirmMergeButton,
    updateBranchButton,
    autoMergeStarted,
    observer,
    testFailMessageShown;

  const init = () => {
    githubApp = $('.application-main');

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

      observer.observe(githubApp, {
        childList: true,
        subtree: true,
        characterData: false,
      });
    }

    if (!PRname || !branchName) {
      setBranchAndPRnames();
    }
  };

  const doChecks = () => {
    const checkPass = checkIfTestsPass();

    if (!autoMergeStarted && checkPass) {
      mergeButton = $(
        '.merge-pr:not(.open) .mergeability-details .btn-group-merge'
      );

      mergeButtonContainer = mergeButton && mergeButton.closest('.select-menu');

      if (mergeButton && mergeButtonContainer && mergeButton.disabled) {
        addAutoMergeButton();
      }
    }

    if (autoMergeStarted) {
      checkIfBranchOutOfDate();
      checkIfCanMerge();
      checkIfNeedToConfirm();
      checkIfNeedToDeleteBranch();
    }
  };

  const addAutoMergeButton = () => {
    autoMergeButton = $('.merge-pr .gam-button');

    if (!autoMergeButton) {
      autoMergeButton = document.createElement('button');
      autoMergeButton.setAttribute('type', 'button');
      autoMergeButton.classList.add('gam-button', 'btn', 'btn-primary');
      autoMergeButton.innerText = 'Auto merge when green';
      mergeButtonContainer.style.display = 'block';
      mergeButtonContainer.appendChild(autoMergeButton);
      autoMergeButton = $('.gam-button', mergeButtonContainer);

      autoMergeButton.addEventListener('click', () => {
        autoMergeButton.innerText = 'Will merge when green';
        autoMergeButton.disabled = true;
        autoMergeStarted = true;
        console.log(
          '%cAutoMergeWhenGreen: %c"' + PRname + '" (' + branchName + ')',
          'color: green',
          'color: yellow',
          '\nWaiting for the Merge button to become enabled...'
        );
      });
    }
  };

  const setBranchAndPRnames = () => {
    const PRtitleEl = $('.repository-content .pull.request .gh-header-title');
    PRname = PRtitleEl && PRtitleEl.innerText;
    const branchNameEl = $(
      '.repository-content .pull.request .commit-ref.head-ref'
    );
    branchName = branchNameEl && branchNameEl.innerText;
  };

  const checkIfTestsPass = () => {
    checkFailedEl = $('.mergeability-details .status-heading.text-red');
    const checkFailed =
      checkFailedEl &&
      checkFailedEl.innerHTML.toLowerCase().includes('check') &&
      checkFailedEl.innerHTML.toLowerCase().includes('fail');

    if (checkFailed && !testFailMessageShown) {
      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRname + '" (' + branchName + ')',
        'color: red',
        'color: pink',
        '\nYour tests fail. Cant merge PR. Fix and come back.'
      );

      GM_notification({
        title: 'Tests failed',
        text: PRname + '" (' + branchName + ')',
        image:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiNkNzVhNGEiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xNiAzNGw5LTkgOS05TTE2IDE2bDkgOSA5IDkiLz48L3N2Zz4=',
        icon:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiNkNzVhNGEiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xNiAzNGw5LTkgOS05TTE2IDE2bDkgOSA5IDkiLz48L3N2Zz4=',
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
        '%cAutoMergeWhenGreen: %c"' + PRname + '" (' + branchName + ')',
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
        '%cAutoMergeWhenGreen: %c"' + PRname + '" (' + branchName + ')',
        'color: green',
        'color: yellow',
        '\nMerge confirmed!'
      );
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
      autoMergeStarted = false;

      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRname + '" (' + branchName + ')',
        'color: green',
        'color: yellow',
        '\nBranch deleted.'
      );

      GM_notification({
        title: 'Merge complete!',
        text: PRname + '" (' + branchName + ')',
        image:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMyNWFlODgiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0zOCAxNUwyMiAzM2wtMTAtOCIvPjwvc3ZnPg==',
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
      autoMergeButton = $('.mergeability-details .gam-button');
      removeElement(autoMergeButton);

      console.log(
        '%cAutoMergeWhenGreen: %c"' + PRname + '" (' + branchName + ')',
        'color: green',
        'color: yellow',
        '\nMerge started!'
      );
      GM_notification({
        title: 'Merge started',
        text: PRname + '" (' + branchName + ')',
        image:
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiM0M2IwNWMiLz48cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0yNSAxM3YyNU0zOCAyNUgxMyIvPjwvc3ZnPg==',
        timeout: 7000,
      });
      testFailMessageShown = false;
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
