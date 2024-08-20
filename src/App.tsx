import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react'
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

      {
        command.icon && (command.icon.startsWith('http') || command.icon.startsWith('data'))
          ? <img src={command.icon} alt={command.title} className="warp-emoji-action"/>
          : <span className="warp-emoji-action">{command.icon}</span>
      }

      <div className="warp-item-details">
        <div className="warp-item-name">{command.title}</div>
        <div className="warp-item-desc">{command.desc || command.url}</div>
      </div>
    </div>
  )
}

export const App = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [commands, setCommands] = useState<CommandInterface[]>(defaultCommands)
  const [filteredCommands, setFilteredCommands] = useState<CommandInterface[]>(defaultCommands)

  const input = useRef<HTMLInputElement>(null)

  type Action = 'open-warp' | 'close-warp'

  interface ActionMessage {
    action: Action
  }

  const openWarp = () => {
    setIsOpen(true)

    setTimeout(() => {
      input.current?.focus()
    }, 100)
  }

  const closeWarp = () => {
    setIsOpen(false)
  }

  const clearWarp = () => {
    setSearch('')
    setActiveIndex(0)
    closeWarp()
  }

  // Listen messages from background
  chrome.runtime?.onMessage.addListener((message: ActionMessage) => {
    if (message.action == 'open-warp') {
      if (isOpen) {
        closeWarp()
      } else {
        openWarp()
      }
    }

    if (message.action == 'close-warp') {
      closeWarp()
    }
  })

  const maxIndex = filteredCommands.length - 1

  const filterCommands = async () => {
    if (search.trim() === '') {
      return commands
    }

    const searchRegExp = new RegExp(search, 'i')

    return Promise.resolve([commands[0]].concat(commands.filter((command: CommandInterface) => {
      return command.title.match(searchRegExp) || command.desc.match(searchRegExp)
    })))
  }

  const checkKeyPressed = (e: any) => {
    if (e.key === 'ArrowDown') {
      setActiveIndex(index => {
        if (index === maxIndex) return maxIndex

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
      // Get command.
      const command = filteredCommands[activeIndex]

      if (command.action && typeof command.action === 'string') {
        chrome.runtime?.sendMessage({action: command.action, command})
      }

      if (command.action && typeof command.action !== 'string') {
        command.action(search as any)
      }

      clearWarp()
    }
  }

  const checkCloseKey = (e: any) => {
    if (e.key === 'Escape') {
      closeWarp()
    }
  }

  const getTabs = async () => {
    const {tabs} = await chrome.runtime?.sendMessage({action: 'get-tabs'}) || {}

    if (Array.isArray(tabs)) {
      setCommands(commands => [...commands, ...tabs])
    }
  }

  useLayoutEffect(() => {
    input.current?.focus()
  }, [])

  useEffect(() => {
    setFilteredCommands(commands)
  }, [commands])

  useEffect(() => {
    setActiveIndex(0)
  }, [filteredCommands.length])

  useEffect(() => {
    // Add open tabs to list of available commands.
    (async () => {
      await getTabs()
    })()

    document.addEventListener('keydown', checkCloseKey)

    return () => {
      document.removeEventListener('keydown', checkCloseKey)
    }
  }, [])

  useEffect(() => {
    (async () => {
      setFilteredCommands(await filterCommands())
    })()
  }, [search])

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
                onKeyDown={checkKeyPressed}
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
                    if (typeof command.action === 'string') {
                      chrome.runtime?.sendMessage({action: command.action, command})

                      clearWarp()

                      return
                    }

                    command.action(search as any)

                    clearWarp()
                  }}/>
              ))}
              <div id="warp-list">
                <div className="warp-item " tabIndex="0"><span className="warp-emoji-action">🔍</span>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Search</div>
                    <div className="warp-item-desc">Search for a query</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="1"><span className="warp-emoji-action">✨</span>
                  <div className="warp-item-details">
                    <div className="warp-item-name">New tab</div>
                    <div className="warp-item-desc">Open a new tab</div>
                  </div>
                </div>
                <div className="warp-item warp-item-active" tabIndex="2"><span className="warp-emoji-action">🗑</span>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Close tab</div>
                    <div className="warp-item-desc">Close the current tab</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="3"><span className="warp-emoji-action">➕</span>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Duplicate tab</div>
                    <div className="warp-item-desc">Duplicate current tab</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="4"><img src="https://tinybase.org/favicon.svg"
                                                              alt="Writing To Stores | TinyBase"
                                                              className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Writing To Stores | TinyBase</div>
                    <div className="warp-item-desc">https://tinybase.org/guides/the-basics/writing-to-stores/</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="5"><img
                  src="https://github.githubassets.com/favicons/favicon-dark.svg"
                  alt="Building an offline realtime sync engine" className="warp-emoji-action"
                  data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Building an offline realtime sync engine</div>
                    <div
                      className="warp-item-desc">https://gist.github.com/pesterhazy/3e039677f2e314cb77ffe3497ebca07b
                    </div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="6"><img src="https://www.inkandswitch.com/favicon.ico?v=1"
                                                              alt="Project Cambria: Translate your data with lenses"
                                                              className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Project Cambria: Translate your data with lenses</div>
                    <div className="warp-item-desc">https://www.inkandswitch.com/cambria/</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="7"><img src="https://riffle.systems/favicon-32x32.png"
                                                              alt="Building data-centric apps with a reactive relational database"
                                                              className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Building data-centric apps with a reactive relational database</div>
                    <div className="warp-item-desc">https://riffle.systems/essays/prelude/</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="8"><img src="https://jlongster.com/favicon.ico"
                                                              alt="A future for SQL on the web"
                                                              className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">A future for SQL on the web</div>
                    <div className="warp-item-desc">https://jlongster.com/future-sql-web?utm_source=pocket_saves</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="9"><img src="https://www.inkandswitch.com/favicon.ico?v=1"
                                                              alt="Upwelling: Combining real-time collaboration with version control for writers."
                                                              className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Upwelling: Combining real-time collaboration with version control
                      for writers.
                    </div>
                    <div className="warp-item-desc">https://www.inkandswitch.com/upwelling/</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="10"><img src="https://www.inkandswitch.com/favicon.ico?v=1"
                                                               alt="Local-first software: You own your data, in spite of the cloud"
                                                               className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Local-first software: You own your data, in spite of the cloud</div>
                    <div className="warp-item-desc">https://www.inkandswitch.com/local-first/</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="11"><img src="https://www.inkandswitch.com/favicon.ico?v=1"
                                                               alt="Peritext: A CRDT for Rich-Text Collaboration"
                                                               className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Peritext: A CRDT for Rich-Text Collaboration</div>
                    <div className="warp-item-desc">https://www.inkandswitch.com/peritext/</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="12"><img
                  src="https://github.githubassets.com/favicons/favicon-dark.svg"
                  alt="jesseduffield/lazygit: simple terminal UI for git commands" className="warp-emoji-action"
                  data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">jesseduffield/lazygit: simple terminal UI for git commands</div>
                    <div className="warp-item-desc">https://github.com/jesseduffield/lazygit?tab=readme-ov-file#usage
                    </div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="13"><img
                  src="https://github.githubassets.com/favicons/favicon-dark.svg"
                  alt="darrenburns/posting: The modern API client that lives in your terminal."
                  className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">darrenburns/posting: The modern API client that lives in your
                      terminal.
                    </div>
                    <div className="warp-item-desc">https://github.com/darrenburns/posting</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="14"><img
                  src="https://github.githubassets.com/favicons/favicon-dark.svg"
                  alt="rothgar/awesome-tuis: List of projects that provide terminal user interfaces"
                  className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">rothgar/awesome-tuis: List of projects that provide terminal user
                      interfaces
                    </div>
                    <div className="warp-item-desc">https://github.com/rothgar/awesome-tuis?tab=readme-ov-file</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="15"><img
                  src="https://www.nytimes.com/vi-assets/static-assets/favicon-dark-c0de2ee21c5d303cad570e8565f03f1d.ico"
                  alt="La incursión ucraniana en Rusia resulta en la rendición en masa de reclutas del Kremlin - The New York Times"
                  className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">La incursión ucraniana en Rusia resulta en la rendición en masa de
                      reclutas del Kremlin - The New York Times
                    </div>
                    <div
                      className="warp-item-desc">https://www.nytimes.com/es/2024/08/18/espanol/ucrania-rusia-reclutas-capturados.html?campaign_id=42&amp;emc=edit_bn_20240819&amp;instance_id=132042&amp;nl=el-times&amp;regi_id=110873371&amp;segment_id=175524&amp;te=1&amp;user_id=e45afec1237ca0391d8e648083cd41fd
                    </div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="16"><img src="https://www.google.com/favicon.ico"
                                                               alt="32:20 - Búsqueda de Google"
                                                               className="warp-emoji-action" data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">32:20 - Búsqueda de Google</div>
                    <div
                      className="warp-item-desc">https://www.google.com/search?q=timer&amp;rlz=1C5CHFA_enMX1091MX1091&amp;oq=time&amp;gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIGCAEQRRg5MgYIAhAjGCcyBggDEEUYPTIGCAQQRRg8MgYIBRBFGDwyBggGEEUYQTIGCAcQRRhB0gEHNTMzajBqMagCALACAA&amp;sourceid=chrome&amp;ie=UTF-8
                    </div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="17"><span className="warp-emoji-action"></span>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Extensions</div>
                    <div className="warp-item-desc">chrome://extensions/</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="18"><img src="https://www.google.com/favicon.ico"
                                                               alt=" - Buscar con Google" className="warp-emoji-action"
                                                               data-ilt="1724165583723"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name"> - Buscar con Google</div>
                    <div
                      className="warp-item-desc">https://www.google.com/search?q=%EF%A3%BF&amp;sca_esv=a1240fbab318ff70&amp;sxsrf=ADLYWIKHE4W2f21m9tnnSkylLHMPldDdMg%3A1724164901458&amp;source=hp&amp;ei=JavEZpTcGaGlkPIPgoK0gAU&amp;iflsig=AL9hbdgAAAAAZsS5NUinK6xfKln9i3zBuRELVHqaYYIv&amp;ved=0ahUKEwjUgu_j5oOIAxWhEkQIHQIBDVAQ4dUDCBY&amp;uact=5&amp;oq=%EF%A3%BF&amp;gs_lp=Egdnd3Mtd2l6IgPvo78yCxAAGIAEGLEDGIMBMgsQABiABBixAxiDATIFEAAYgARIrh1QAFgAcAF4AJABAJgBnAGgAZwBqgEDMC4xuAEDyAEA-AEBmAICoAKkAZgDAJIHAzEuMaAHuwE&amp;sclient=gws-wiz
                    </div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="19"><img
                  src="https://www.gstatic.com/devrel-devsite/prod/v20ab951cf37b43fc7a428ae75ce91d8269f391204ca16525bc8a5ececea0ab56/chrome/images/favicon.png"
                  alt="chrome.commands &nbsp;|&nbsp; API &nbsp;|&nbsp; Chrome for Developers"
                  className="warp-emoji-action" data-ilt="1724165583724"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">chrome.commands &nbsp;|&nbsp; API &nbsp;|&nbsp; Chrome for
                      Developers
                    </div>
                    <div
                      className="warp-item-desc">https://developer.chrome.com/docs/extensions/reference/api/commands#key-combinations
                    </div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="20"><span className="warp-emoji-action"></span>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Extensions</div>
                    <div className="warp-item-desc">chrome://extensions/shortcuts</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="21"><img
                  src="https://www.gstatic.com/devrel-devsite/prod/v20ab951cf37b43fc7a428ae75ce91d8269f391204ca16525bc8a5ececea0ab56/chrome/images/favicon.png"
                  alt="Message passing &nbsp;|&nbsp; Chrome Extensions &nbsp;|&nbsp; Chrome for Developers"
                  className="warp-emoji-action" data-ilt="1724165583724"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Message passing &nbsp;|&nbsp; Chrome Extensions &nbsp;|&nbsp; Chrome
                      for Developers
                    </div>
                    <div
                      className="warp-item-desc">https://developer.chrome.com/docs/extensions/develop/concepts/messaging
                    </div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="22"><img
                  src="data:image/png;base64,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"
                  alt="Open dialog with key shortcut en Warp | Trello" className="warp-emoji-action"
                  data-ilt="1724165583724"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Open dialog with key shortcut en Warp | Trello</div>
                    <div className="warp-item-desc">https://trello.com/c/Rw5iMGmo/12-open-dialog-with-key-shortcut</div>
                  </div>
                </div>
                <div className="warp-item " tabIndex="23"><img src="https://music.youtube.com/img/favicon_32.png"
                                                               alt="Chopin: Nocturne No. 8 In D Flat, Op. 27 No. 2 (2005 Recording) - YouTube&nbsp;Music"
                                                               className="warp-emoji-action" data-ilt="1724165583724"/>
                  <div className="warp-item-details">
                    <div className="warp-item-name">Chopin: Nocturne No. 8 In D Flat, Op. 27 No. 2 (2005 Recording) -
                      YouTube&nbsp;Music
                    </div>
                    <div className="warp-item-desc">https://music.youtube.com/channel/UCyTnUReB5s38R-ZKlb2wyVg</div>
                  </div>
                </div>
              </div>
            </div>
            <div id="warp-footer">
              <div id="warp-results">{filteredCommands.length} results</div>
              <div id="warp-arrows">Use arrow keys <span className="warp-shortcut">↑</span><span
                className="warp-shortcut">↓</span> to navigate
              </div>
            </div>
          </div>
        </div>
        <div id="warp-overlay" onClick={closeWarp}></div>
      </div>
      <div id="warp-extension-toast"><img alt="" src=""/><span>The action has been successful</span></div>
    </>
  )
}
