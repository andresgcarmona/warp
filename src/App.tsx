import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Command as CommandInterface } from './types'
import { getCommands } from './utils/getCommands'

const defaultCommands: CommandInterface[] = getCommands()

const Command: FC<{
  command: CommandInterface
  tabIndex: number
  isActive?: boolean
  handleHover: (e: any) => void
  handleSelect: (e: any) => void
}> = ({
  command,
  tabIndex,
  handleHover,
  handleSelect,
  isActive = false,
}) => {
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
    <div className={`warp-item ${isActive ? 'warp-item-active' : ''}`} ref={ref} onMouseEnter={handleHover}
         onClick={handleSelect} onKeyDown={handleSelect} tabIndex={tabIndex}>
      {command.icon && command.icon.startsWith('http') ? <img src={command.icon} alt={command.title}
                                                              className="warp-emoji-action"/> : <span
        className="warp-emoji-action">{command.icon}</span>}
      
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
  
  const input = useRef<HTMLInputElement>(null)
  
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
  
  const filteredCommands = useMemo(() => {
    if (search.trim() === '') {
      return commands
    }
    
    const searchRegExp = new RegExp(search, 'i')
  
    return [commands[0]].concat(commands.filter((command: CommandInterface) => {
      return command.title.match(searchRegExp) || command.desc.match(searchRegExp)
    }))
  }, [search])
  
  const checkKeyPressed = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setActiveIndex(index => {
          console.log(index, filteredCommands.length)
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
      
      if (e.key === 'Enter') {
        setActiveIndex(index => {
          console.log(index)
          
          if (index === 0) {
            // Get command.
            const command = filteredCommands[index]
  
            if (command.action) {
              command.action(search as any)
            }
          }
          
          return index
        })
        
      }
    },
    [activeIndex, filteredCommands.length],
  )
  
  useEffect(() => {
    setActiveIndex(0)
  }, [filteredCommands.length])
  
  useEffect(() => {
    document.addEventListener('keydown', checkKeyPressed)
    
    input.current?.focus()
    
    return () => {
      document.removeEventListener('keydown', checkKeyPressed)
    }
  }, [])
  
  return (
    <>
      <div id="warp-extension" className={`${!isOpen ? 'warp-closing' : ''} warp-extension`}>
        <div id="warp-wrap">
          <div id="warp">
            <div id="warp-search">
              <input
                value={search}
                placeholder="Type a command or search" onChange={(e) => {
                setSearch(e.target.value)
              }}
                ref={input}
              />
            </div>
            <div id="warp-list">
              {filteredCommands.map((command, index) => (
                <Command
                  key={index}
                  tabIndex={index}
                  command={command}
                  isActive={activeIndex === index}
                  handleHover={() => {
                    setActiveIndex(index)
                  }}
                  handleSelect={() => {
                    command.action(search as any)
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
