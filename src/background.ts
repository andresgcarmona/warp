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

const openTab = async (url = 'chrome://newtab') => {
  await chrome.tabs.create({
    url,
  })
}

const openIncognito = async (url = 'chrome://newtab') => {
  if (url.startsWith('chrome') || url.startsWith('http')) {
    await chrome.windows.create({ incognito: true, url })
  }
  else{
    await chrome.windows.create({ incognito: true, url: 'chrome://newtab' })
  }
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

const pinTab = async () => {
  const tab = await getCurrentTab()

  if (tab) {
    await chrome.tabs.update(tab.id as number, { pinned: !tab.pinned })
  }
}

const reloadTab = async () => {
  const tab = await getCurrentTab()

  if (tab) {
    await chrome.tabs.reload(tab.id as number)
  }
}

const muteTab = async () => {
  const tab = await getCurrentTab()

  if (tab) {
    await chrome.tabs.update(tab.id as number, { muted: !tab.mutedInfo?.muted ?? true })
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
      is_tab: true,
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

  if (message.action === 'pin-tab') {
    (async () => {
      await pinTab()
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

  if (message.action === 'reload-tab') {
    (async () => {
      await reloadTab()
    })()
  }

  if (message.action === 'mute-tab') {
    (async () => {
      await muteTab()
    })()
  }

  if (message.action === 'open-history') {
    (async () => {
      await openTab('chrome://history')
    })()
  }

  if (message.action === 'open-downloads') {
    (async () => {
      await openTab('chrome://downloads')
    })()
  }

  if (message.action === 'open-incognito') {
    (async () => {
      await openIncognito(message.query)
    })()
  }

  if (message.action === 'search-youtube') {
    (async () => {
      await openTab(`https://www.youtube.com/results?search_query=${message.query}`)
    })()
  }

  return true
})

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-warp') {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, { action: command });
      }
    })()
  }
});
