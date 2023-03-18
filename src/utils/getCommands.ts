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
      icon: '🔍',
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
    },
  ] as Command[]
}
