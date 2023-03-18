function injectScripts(tab: any) {
  const manifest = chrome.runtime.getManifest() || {}
  
  const scripts = manifest.content_scripts && manifest.content_scripts[0]

  if (scripts && Array.isArray(scripts.js)) {
    for (let script of scripts.js) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [script]
      })
    }
  
    if (scripts && Array.isArray(scripts.css)) {
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: [scripts.css[0]],
      })
    }
  }
}

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

const openTab = () => {
  chrome.tabs.create({
    url: 'chrome://newtab'
  });
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ installed: true }, function () {
    console.log('The extension was successfully installed.')
  })
  
  chrome.windows.getAll(
    {
      populate: true,
    },
    (windows) => {
      console.log(windows)
      
      for (let window of windows) {
        for (let tab of window.tabs ?? []) {
          if (tab && !tab.url?.includes("chrome://") && !tab.url?.includes("chrome-extension://") && !tab.url?.includes("chrome.google.com")) {
            injectScripts(tab);
          }
        }
      }
    }
  );
})

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id as number, {action: 'open-warp'});
});

chrome.runtime.onMessage.addListener((message, sender) => {
  switch (message.action) {
    case 'new-tab':
      openTab()
      break;
  }
})
