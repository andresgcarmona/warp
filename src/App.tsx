import { FC, useState } from 'react'

interface Command {
  title: string
  desc: string
  type: string
  action: string
  emoji: boolean
  emojiChar: string
  keyCheck: boolean
}

const defaultCommands: Command[] = [
  {
    title: 'Search',
    desc: 'Search for a query',
    type: 'action',
    action: 'search',
    emoji: true,
    emojiChar: '🔍',
    keyCheck: false,
  },
  {
    title: 'Search',
    desc: 'Go to website',
    type: 'action',
    action: 'goto',
    emoji: true,
    emojiChar: '🔍',
    keyCheck: false,
  },
]

const Command: FC<{ command: Command }> = ({ command }) => {
  return (
    <div className="warp-item">
      <span className="warp-emoji-action">{command.emojiChar}</span>
  
      <div className="warp-item-details">
        <div className="warp-item-name">{command.title}</div>
        <div className="warp-item-desc">{command.desc}</div>
      </div>
    </div>
  )
}

export const App = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [commands, setCommands] = useState<Command[]>(defaultCommands)
  
  type Action = 'open-warp' | 'close-warp'
  
  interface ActionMessage {
    action: Action
  }
  
  const openWarp = () => {
    setIsOpen(true)
  }
  
  const closeWarp = () => {
    setIsOpen(false)
  }
  
  // Listen messages from background
  chrome.runtime?.onMessage.addListener((message: ActionMessage) => {
    if (message.action == 'open-warp') {
      if (isOpen) {
        closeWarp()
      }
      else {
        openWarp()
      }
    }
    
    if (message.action == 'close-warp') {
      closeWarp()
    }
  })
  
  return (
    <>
      <div id="warp-extension" className={`${!isOpen ? 'warp-closin' : ''} warp-extension`}>
        <div id="warp-wrap">
          <div id="warp">
            <div id="warp-search">
              <input placeholder="Type a command or search"/>
            </div>
            <div id="warp-list">
              {commands.map((command, index) => (
                <Command key={index} command={command} />
              ))}
            </div>
            <div id="warp-footer">
              <div id="warp-results">{commands.length} results</div>
              <div id="warp-arrows">Use arrow keys <span className="warp-shortcut">↑</span><span
                className="warp-shortcut">↓</span> to navigate
              </div>
            </div>
          </div>
        </div>
        <div id="warp-overlay"></div>
      </div>
      <div id="warp-extension-toast"><img alt="" src=""/><span>The action has been successful</span></div>
    </>
  )
}
