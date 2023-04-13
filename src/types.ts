export interface Command {
  title: string
  desc: string
  action: string | ((...args: any) => any)
  icon: string
  keys?: string[]
  url?: string
}
