import React from "react";

export interface Command {
  title: string
  desc: string
  action: string | ((...args: any) => any)
  icon: string | React.ReactNode
  keys?: string[]
  url?: string
  default?: boolean
}
