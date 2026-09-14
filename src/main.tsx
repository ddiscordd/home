import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { AdminEditorProvider } from './components/admin/AdminEditorContext'
import { getSystemAppearance } from './services/systemSettings/systemSettingsService'
import { applySystemAppearance } from './pages/settings/AdminPersonalization'
import App from './App.tsx'

/** Aplica a aparência global salva (leitura pública autenticada) antes do render. */
function ThemeBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getSystemAppearance().then(applySystemAppearance).catch(() => undefined)
  }, [])
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <AdminEditorProvider>
          <ThemeBootstrap>
            <App />
          </ThemeBootstrap>
        </AdminEditorProvider>
      </AppProvider>
    </AuthProvider>
  </StrictMode>,
)
