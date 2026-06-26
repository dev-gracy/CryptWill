import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: 'var(--color-success)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--color-danger)', secondary: '#fff' } },
      }}
    />
  </StrictMode>,
)
