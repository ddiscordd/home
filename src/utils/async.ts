/** Erro de rede/tempo limite já com mensagem amigável. */
export class AppNetworkError extends Error {}

const DEFAULT_TIMEOUT_MS = 12000

/**
 * Aguarda a promise com limite de tempo.
 * Sem isso, um Firebase inacessível (firewall/antivírus/queda de rede)
 * deixaria a aplicação carregando para sempre.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = DEFAULT_TIMEOUT_MS,
  label = 'operação',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AppNetworkError(`A ${label} demorou demais. Verifique sua conexão e tente novamente.`))
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/** Traduz erros do Realtime Database para mensagens amigáveis em português. */
export function friendlyDbError(err: unknown, fallback: string): Error {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : ''
  if (code.includes('permission_denied')) {
    return new Error(
      'O banco de dados negou o acesso aos seus dados. Confira as regras de segurança (Security Rules) do Firebase.',
    )
  }
  if (err instanceof AppNetworkError) return err
  return new Error(fallback)
}