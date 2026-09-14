import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useApp } from './contexts/AppContext'
import { AppShell } from './components/app/AppShell'
import { AppLoading } from './components/common/AppLoading'
import { LoginPage } from './pages/login/LoginPage'
import { RegisterPage } from './pages/register/RegisterPage'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { SettingsPage } from './pages/settings/SettingsPage'

function App() {
  const { user, loading } = useAuth()
  const { status, settingsOpen } = useApp()
  const [view, setView] = useState<'login' | 'register'>('login')

  // Estados de espera: verificação de sessão e carregamento de dados do banco.
  // OBS: 'AUTHENTICATED' significa "sessão verificada SEM usuário" — deve cair no login abaixo,
  // NUNCA prender no loading (era a causa do carregamento infinito).
  if (loading || status === 'AUTH_LOADING' || status === 'LOADING_SERVER') {
    return <AppLoading />
  }

  // Não autenticado: telas públicas de login/registro.
  if (!user) {
    return view === 'login' ? (
      <LoginPage onNavigateRegister={() => setView('register')} />
    ) : (
      <RegisterPage onNavigateLogin={() => setView('login')} />
    )
  }

  // Primeiro acesso: tutorial persistido no banco (onboardingCompleted).
  if (status === 'ONBOARDING') return <OnboardingPage />

  // Aplicação principal (servidores reais; trata EMPTY_STATE/ERROR internamente).
  // Configurações = overlay por cima: servidor/canal/conversa atuais permanecem preservados.
  return (
    <>
      <AppShell />
      {settingsOpen && <SettingsPage />}
    </>
  )
}

export default App

