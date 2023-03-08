export interface Command {
  title: string
  desc: string
  type: string
  action: string
  emoji: boolean
  emojiChar: string
  keyCheck: boolean
  keys?: string[]
  favIconUrl?: string
}
