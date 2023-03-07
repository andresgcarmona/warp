import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.scss'

if (import.meta.env.DEV) {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />)
}
else {
  const container = document.createElement('div')
  container.classList.add('warp-container')
  
  document.body.appendChild(container)
  
  const root = ReactDOM.createRoot(container as HTMLElement)
  
  root.render(<App />)
}
