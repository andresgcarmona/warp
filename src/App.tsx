import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Command as CommandInterface } from 'types'
import { getCommands } from './utils/getCommands'

const defaultCommands: CommandInterface[] = getCommands()

const Command: FC<{
  command: CommandInterface
  isActive?: boolean
  handleHover: (e: any) => void
}> = ({ command, handleHover, isActive = false }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  
  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [isActive])
  
  return (
    <div className={`warp-item ${isActive ? 'warp-item-active' : ''}`} ref={ref} onMouseEnter={handleHover}>
      {command.emoji ? <span className="warp-emoji-action">{command.emojiChar}</span> : null}
      {command.favIconUrl ? <img src={command.favIconUrl} alt={command.title} className="warp-emoji-action"/> : null}
      
      <div className="warp-item-details">
        <div className="warp-item-name">{command.title}</div>
        <div className="warp-item-desc">{command.desc}</div>
      </div>
    </div>
  )
}

export const App = () => {
  const [isOpen, setIsOpen]           = useState(false)
  const [search, setSearch]           = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [commands, setCommands]       = useState<CommandInterface[]>(defaultCommands)
  
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
  
  const checkKeyPressed = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        setActiveIndex(index => {
          if (index === filteredCommands.length - 1) return filteredCommands.length - 1
          
          return index + 1
        })
      }
      
      if (e.key === 'ArrowUp') {
        setActiveIndex(index => {
          if (index === 0) return 0
          
          return index - 1
        })
      }
      
      if (e.key === 'Home') {
        setActiveIndex(0)
      }
  
      if (e.key === 'End') {
        setActiveIndex(filteredCommands.length - 1)
      }
    },
    [],
  )
  
  const filteredCommands = useMemo(() => {
    if (search.trim() === '') {
      return commands
    }
    
    const searchRegExp = new RegExp(search, 'i')
    
    return commands.filter((command: Command) => {
      return command.title.match(searchRegExp) || command.desc.match(searchRegExp)
    })
  }, [search])
  
  useEffect(() => {
    setActiveIndex(0)
  }, [filteredCommands.length])
  
  useEffect(() => {
    document.addEventListener('keydown', checkKeyPressed)
    
    return () => {
      document.removeEventListener('keydown', checkKeyPressed)
    }
  }, [])
  
  return (
    <>
      <div id="warp-extension" className={`${!isOpen ? 'warp-cloing' : ''} warp-extension`}>
        <div id="warp-wrap">
          <div id="warp">
            <div id="warp-search">
              <input
                value={search}
                placeholder="Type a command or search" onChange={(e) => {
                setSearch(e.target.value)
              }}
              />
            </div>
            <div id="warp-list">
              {filteredCommands.map((command, index) => (
                <Command key={index} command={command} isActive={activeIndex === index} handleHover={() => {
                  setActiveIndex(index)
                }}/>
              ))}
            </div>
            <div id="warp-footer">
              <div id="warp-results">{filteredCommands.length} results</div>
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
