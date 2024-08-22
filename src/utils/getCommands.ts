import { Command } from '../types'

export const getCommands = (): Command[] => {
  return [
    {
      title: 'Search',
      desc: 'Search for a query',
      action: (query: string) => {
        if (query) {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`)
        }
      },
      icon: chrome.runtime.getURL('assets/google.ico'),
    }, {
      title: 'New tab',
      desc: 'Open a new tab',
      action: () => {
        chrome.runtime?.sendMessage({
          action: 'new-tab',
        })
      },
      icon: '✨',
    }, {
      title: 'Close tab',
      desc: 'Close the current tab',
      action: () => {
        chrome.runtime?.sendMessage({
          action: 'close-tab',
        })
      },
      icon: '🗑',
    }, {
      title: 'Duplicate tab',
      desc: 'Duplicate current tab',
      action: () => {
        chrome.runtime?.sendMessage({
          action: 'duplicate-tab',
        })
      },
      icon: '➕',
    }, {
      title: 'Pin/unpin tab',
      desc: 'Pin/unpin current tab',
      action: () => {
        chrome.runtime?.sendMessage({
          action: 'pin-tab',
        })
      },
      icon: '📌',
    }, {
      title: 'Reload tab',
      desc: 'Reload current tab',
      action: () => {
        chrome.runtime?.sendMessage({
          action: 'reload-tab',
        })
      },
      icon: '🔃',
    },
  ] as Command[]
}
