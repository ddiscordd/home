import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { PrimaryButton } from '../../components/auth/PrimaryButton'
import { CreateServerModal } from '../../components/modals/CreateServerModal'
import { cn } from '../../utils/cn'

interface OnboardingStep {
  title: string
  text: string
  cta: string
  visual: 'welcome' | 'servers' | 'channels' | 'people' | 'ready'
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Bem-vindo!',
    text: 'Vamos configurar seu espaço em poucos passos.',
    cta: 'Começar',
    visual: 'welcome',
  },
  {
    title: 'Comece criando seu primeiro servidor',
    text: 'Servidores são espaços onde você pode reunir pessoas, criar canais e organizar suas conversas.',
    cta: 'Continuar',
    visual: 'servers',
  },
  {
    title: 'Organize suas conversas',
    text: 'Crie canais de texto e voz para separar assuntos, projetos e comunidades.',
    cta: 'Continuar',
    visual: 'channels',
  },
  {
    title: 'Convide pessoas',
    text: 'Depois você poderá convidar pessoas para participar do seu servidor.',
    cta: 'Entendi',
    visual: 'people',
  },
  {
    title: 'Pronto para começar?',
    text: 'Crie seu primeiro servidor agora — leva menos de um minuto.',
    cta: '',
    visual: 'ready',
  },
]

/** Ilustrações mínimas, feitas só com divs (identidade própria, sem assets externos). */
function StepVisual({ kind }: { kind: OnboardingStep['visual'] }) {
  if (kind === 'welcome' || kind === 'ready') {
    return (
      <div className="animate-float mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-500/30 to-accent-600/10 text-4xl text-accent-300">
        ✦
      </div>
    )
  }
  if (kind === 'servers') {
    return (
      <div className="mx-auto flex w-fit items-center gap-2.5 rounded-2xl border border-white/10 bg-abyss-800/70 px-5 py-4">
        {['#7c5cff', '#3ba55d', '#4d9de0', '#e5a83b'].map((color, i) => (
          <span
            key={color}
            className="animate-fade-in block h-9 w-9 rounded-xl transition-transform hover:scale-110 hover:rounded-lg"
            style={{ backgroundColor: color, animationDelay: `${i * 90}ms` }}
          />
        ))}
        <span className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-slate-500 text-slate-400">
          +
        </span>
      </div>
    )
  }
  if (kind === 'channels') {
    return (
      <div className="mx-auto w-fit space-y-1.5 rounded-2xl border border-white/10 bg-abyss-800/70 px-5 py-4 text-left">
        <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Canais de texto</p>
        <p className="text-sm text-slate-300"># geral</p>
        <p className="text-sm text-slate-300"># projetos</p>
        <p className="pt-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Canais de voz</p>
        <p className="text-sm text-slate-300">🔊 Sala geral</p>
      </div>
    )
  }
  return (
    <div className="mx-auto flex w-fit items-center -space-x-2.5">
      {['#7c5cff', '#3ba55d', '#e06c5b', '#4d9de0'].map((color, i) => (
        <span
          key={color}
          className="animate-fade-in flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-abyss-850 text-sm font-bold text-white"
          style={{ backgroundColor: color, animationDelay: `${i * 90}ms`, zIndex: 10 - i }}
        >
          {String.fromCharCode(65 + i)}
        </span>
      ))}
    </div>
  )
}
export function OnboardingPage() {
  const { completeOnboarding, completeOnboardingAndCreateServer } = useApp()
  const [step, setStep] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [skipError, setSkipError] = useState<string | null>(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  async function handleSkip() {
    if (skipping) return
    setSkipping(true)
    setSkipError(null)
    try {
      await completeOnboarding()
    } catch {
      setSkipError('Não foi possível salvar seu progresso. Tente novamente.')
      setSkipping(false)
    }
  }

  return (
    <div className="auth-bg relative flex h-full items-center justify-center overflow-hidden p-4">
      <div aria-hidden="true" className="auth-glow auth-glow--a" />
      <div aria-hidden="true" className="auth-glow auth-glow--b" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Onboarding do Concord"
        className="relative w-[460px] max-w-full animate-fade-up rounded-2xl border border-white/10 bg-abyss-850/90 p-8 text-center shadow-2xl backdrop-blur-sm"
      >
        <div
          className="mb-6 flex items-center justify-center gap-1.5"
          aria-label={`Etapa ${step + 1} de ${STEPS.length}`}
        >
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              aria-hidden="true"
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-6 bg-accent-500' : i < step ? 'w-1.5 bg-accent-500/50' : 'w-1.5 bg-abyss-600',
              )}
            />
          ))}
        </div>

        <div key={current.title} className="animate-fade-slide">
          <StepVisual kind={current.visual} />
          <h1 className="mt-5 text-2xl font-bold text-white">{current.title}</h1>
          <p className="mx-auto mt-2 max-w-[340px] text-[15px] leading-relaxed text-slate-400">{current.text}</p>
        </div>

        {skipError && (
          <p role="alert" className="mt-4 rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
            {skipError}
          </p>
        )}

        <div className="mt-7">
          {isLast ? (
            <div className="space-y-2.5">
              <PrimaryButton onClick={() => setModalOpen(true)}>Criar meu primeiro servidor</PrimaryButton>
              <button
                type="button"
                onClick={() => void handleSkip()}
                disabled={skipping}
                className="h-10 w-full rounded-lg text-sm font-medium text-slate-400 transition-colors hover:bg-abyss-700 hover:text-white disabled:opacity-60"
              >
                Pular por enquanto
              </button>
            </div>
          ) : (
            <PrimaryButton onClick={() => setStep((s) => s + 1)}>{current.cta}</PrimaryButton>
          )}
        </div>
      </div>

      {modalOpen && (
        <CreateServerModal onClose={() => setModalOpen(false)} onCreate={completeOnboardingAndCreateServer} />
      )}
    </div>
  )
}