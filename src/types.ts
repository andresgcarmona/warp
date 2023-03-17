export interface Command {
  title: string
  desc: string
  action: (...args: any) => any
  icon: string
  keys?: string[]
}
