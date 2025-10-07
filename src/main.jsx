import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './i18n.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<div className="app-loading">Loading…</div>}>
      <App />
    </Suspense>
  </React.StrictMode>,
)
