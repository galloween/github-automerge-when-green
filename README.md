## GitHub AutoMerge When Green userscript for TamperMonkey

<img src="https://tva1.sinaimg.cn/large/006tNbRwgy1ga81kpxe8oj313g09i756.jpg" width="710" />

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
- If the branch has conflicts, the script will alert you and exit. You will need to fix merge errors and start auto-merge again
- If the ‘Wait for approval’ checkbox is On, script will not merge until you have at least 1 approval review
- If changes were requested, you will also be alerted and script will exit. Fix code and start again
- You can cancel the Auto-merge process by clicking the ‘Cancel’ button
- If you don’t see the Auto-merge button, make sure you are in Pull Requests / Conversation tab and try to refresh the page

<img src="https://tva1.sinaimg.cn/large/006tNbRwgy1ga81kopygwj313g09igmi.jpg" width="710" />

#### How it works

- If the script detects disabled ‘Merge pull request’ button, it adds the Auto-merge button
- It uses MutationObserver to watch for page changes. When the  ‘Merge pull request’ becomes enabled, it will click it
- The script also auto-refreshes the page every 5 minutes, to see if the tests passed, but Github failed to enable the merge button
- If checks fail, branch has conflicts, changes were requested by reviewer or it can’t auto-merge for any other reason within 2 hours, the script will exit
- You should keep the tab open until the merge is complete
- If you close the tab or navigate away, while the script is in progress, and then come back, the script will recognize the PR and will resume auto-merging
- The script depends on certain elements to be present on the page. If Github changes the layout or CSS selectors, the script may stop working

<img width="344" src="https://tva1.sinaimg.cn/large/006tNbRwgy1ga5tq0h59bj30j403idfr.jpg"  />  <img src="https://tva1.sinaimg.cn/large/006tNbRwgy1ga5zztauysj30j403ia9z.jpg" width="344" />
