import Tab = chrome.tabs.Tab

function injectScripts (tab: any) {
  const manifest = chrome.runtime.getManifest() || {}
  
  const scripts = manifest.content_scripts && manifest.content_scripts[0]
  
  if (scripts && Array.isArray(scripts.js)) {
    for (let script of scripts.js) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [script],
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

async function getCurrentTab (): Promise<Tab> {
  const queryOptions = {
    active: true,
    currentWindow: true,
  }
  
  const [tab] = await chrome.tabs.query(queryOptions)
  
  return tab
}

const openTab = async () => {
  await chrome.tabs.create({
    url: 'chrome://newtab',
  })
}

const closeTab = async () => {
  const tab = await getCurrentTab()
  
  if (tab && tab.id) {
    await chrome.tabs.remove(tab.id);
  }
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
          if (tab && !tab.url?.includes('chrome://') && !tab.url?.includes('chrome-extension://') &&
            !tab.url?.includes('chrome.google.com')) {
            injectScripts(tab)
          }
        }
      }
    },
  )
})

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.tabs.sendMessage(tab.id as number, { action: 'open-warp' })
})

chrome.runtime.onMessage.addListener(async (message, sender) => {
  switch (message.action) {
    case 'new-tab':
      await openTab()
      break
    case 'close-tab':
      await closeTab()
      break
  }
})
