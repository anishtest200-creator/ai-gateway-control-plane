import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { FluentProvider, webDarkTheme } from '@fluentui/react-components'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <FluentProvider theme={webDarkTheme}>
        <App />
      </FluentProvider>
    </BrowserRouter>
  </React.StrictMode>
)
