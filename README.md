## GitHub AutoMergeWhenGreenButton user script for TamperMonkey

![](https://tva1.sinaimg.cn/large/006tNbRwgy1ga4oay6qcgj316i0hiwf9.jpg)

No more waiting for checks to pass to finally merge your PR! The script will do the waiting and checking and button clicking for you!

#### Installing

- Install and enable TamperMonkey extension: [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- [Click here](https://github.com/galloween/github-automerge-when-green/raw/master/github-automerge-when-green.user.js)  to go to script code, TamperMonkey should automatically offer to install script 
- You can also install the script manually, by going to TamperMonkey extension Dashboard (click the extension button), then to Utilities tab, and using ‘Install from URL’ option at the bottom of the page. Here’s the script [URL](https://github.com/galloween/github-automerge-when-green/raw/master/github-automerge-when-green.user.js).
- The script will be automatically updated by TamperMonkey as the new versions become available.

#### Using

- The script adds an Auto-merge button to the PR page (Conversation tab) 
- Once clicked, the script will wait when all checks pass and auto-click the ‘Merge pull request’ button for you
- If the branch will need to be rebased, it will also be done automatically
- If checks will fail, the script will alert you and exit. You will need to fix tests, push the branch and reload the PR page to see the Auto-merge button again
- You can cancel the Auto-merge process by clicking the ‘Cancel’ button

#### How it works

- If the script detects disabled ‘Merge pull request’ button, it adds the Auto-merge button
- It uses MutationObserver to watch for page changes. When the  ‘Merge pull request’ becomes enabled, it will click it
- The script also auto-refreshes the page every 5 minutes, to see if the tests passed, but Github failed to enable the merge button.
- If checks fail or it can’t auto-merge within 2 hours, the script will exit
- You should keep the tab open until the merge is complete
- If you close the tab or navigate away, while the script is in progress, and then come back, the script will recognize the PR and will resume auto-merging.



