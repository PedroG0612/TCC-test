import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Appliety render error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">!</div>
          <h1 className="text-xl font-bold text-slate-900">Algo deu errado</h1>
          <p className="text-sm text-slate-500">
            Ocorreu um erro inesperado ao exibir esta página. Seus dados estão seguros —
            tente recarregar.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-2"
          >
            Recarregar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
