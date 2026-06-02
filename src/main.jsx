import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// React mounts the application into the root element referenced by index.html.
createRoot(document.getElementById('root')).render(
  // StrictMode double-invokes selected development lifecycle paths to expose
  // impure side effects.
  <StrictMode>
    <App />
  </StrictMode>,
)
