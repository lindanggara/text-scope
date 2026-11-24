import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AnalysisProvider } from './context/AnalysisContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AnalysisProvider>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </AnalysisProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
