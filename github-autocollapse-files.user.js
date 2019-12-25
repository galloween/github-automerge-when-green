// ==UserScript==
// @name         GitHub AutoCollapseFiles
// @namespace    https://github.com/galloween
// @version      0.1
// @description  automatically collapses not important files (like .spec.ts) in 'Files changed' view
// @author       Pasha Golovin
// @updateURL
// @downloadURL

// @include     *github.com/*/pull/*
// @run-at      document-idle
// @connect     github.com
// @connect     githubusercontent.com
// ==/UserScript==

(() => {
  'use strict';

  const collapseFileTypes = [
    /\.spec\.ts$/gi,
    /\.stories\.ts$/gi,
    /\.json$/gi,
    /\.js$/gi,
    /\.css$/gi,
    /\.md$/gi,
    /\.map$/gi,
    /\.git$/gi,
    /\.svg$/gi,
    /\.enum\.ts$/gi,
    /\.const\.ts$/gi,
    /\.module\.ts$/gi,
    /ignore/gi,
    /mock/gi,
  ];

  const obsrverConfig = {
    childList: true,
    subtree: true,
    characterData: false,
  };

  let githubApp, fileHeaders, emptyFiles, observer;

  const init = () => {
    githubApp = $('.application-main');

    if (!observer) {
      observer = new MutationObserver(
        debounce(() => {
          doCheck();
        }, 1000)
      );

      observer.observe(githubApp, obsrverConfig);
    }

    doCheck();
  };

  const doCheck = () => {
    fileHeaders = $$('.diff-view .file .file-header');
    emptyFiles = $$('.diff-view .Details-content--hidden .data.empty');

    if (!fileHeaders) {
      return;
    }

    fileHeaders
      .filter(header => {
        const path = header
          .getAttribute('data-path')
          .trim()
          .toLowerCase();
        for (const type of collapseFileTypes) {
          if (type.test(path)) {
            return true;
          }
        }
        return false;
      })
      .forEach(header => {
        header.parentElement.classList.remove('Details--on', 'open');
      });

    emptyFiles.forEach(emptyFile => {
      emptyFile
        .closest('.file.Details')
        .classList.remove('Details--on', 'open');
    });
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
