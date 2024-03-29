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

const getCurrentTab = async (): Promise<Tab> => {
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

const showTab = async (tab: Tab) => {
  await chrome.tabs.highlight({
    tabs: tab.index,
    windowId: tab.windowId
  })
  
  await chrome.windows.update(
    tab.windowId,
    { focused: true }
  )
}

const duplicateTab = async () => {
  const tab = await getCurrentTab()
  
  if (tab) {
    chrome.tabs.duplicate(tab.id as number)
  }
}

const getTabs = async () => {
  const tabs = await chrome.tabs.query({})
  
  return tabs.map((tab: Tab) => {
    const { title, url, favIconUrl, index, windowId, pinned } = tab
    
    return ({
      title,
      url,
      desc: url,
      icon: favIconUrl,
      index,
      windowId,
      pinned,
      action: 'show-tab',
    })
  })
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'new-tab') {
    (async () => {
      await openTab()
    })()
  }
  
  if (message.action === 'close-tab') {
    (async () => {
      await closeTab()
    })()
  }
  
  if (message.action === 'duplicate-tab') {
    (async () => {
      await duplicateTab()
    })()
  }
  
  if (message.action === 'get-tabs') {
    (async () => {
      const tabs = await getTabs()
      
      sendResponse({ tabs })
    })()
  }
  
  if (message.action === 'show-tab') {
    (async () => {
      await showTab(message.command)
    })()
  }
  
  return true
})
