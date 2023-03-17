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
    },
    {
      title: 'New tab',
      desc: 'Open a new tab',
      action: () => {
        console.log('Open a new tab')
      },
      icon: '✨',
    },
  ] as Command[]
}
