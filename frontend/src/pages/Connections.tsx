import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Connection, ConnectionLists, PostAuthor } from '../types'
import { EmptyState, Spinner } from '../components/ui'

function Avatar({ author }: { author: PostAuthor }) {
  if (author.avatar_url) {
    return <img src={author.avatar_url} alt={author.name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
  }
  const initials = author.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
      {initials}
    </div>
  )
}

function PersonRow({
  person, children,
}: { person: PostAuthor; children?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Link to={person.profile_url} className="shrink-0">
        <Avatar author={person} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={person.profile_url} className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-700 hover:underline">
          {person.name}
        </Link>
        <p className="truncate text-xs text-slate-500">{person.headline || person.subtitle || person.role_display}</p>
      </div>
      {children}
    </li>
  )
}

export function Connections() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lists, setLists] = useState<ConnectionLists | null>(null)
  const [suggestions, setSuggestions] = useState<PostAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | 'new' | null>(null)

  const isCandidate = user?.role === 'candidate'

  const load = useCallback(() => {
    api.get<ConnectionLists>('/connections/')
      .then(({ data }) => setLists(data))
      .catch(() => {})
      .finally(() => setLoading(false))
    api.get<PostAuthor[]>('/connections/suggestions/')
      .then(({ data }) => setSuggestions(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isCandidate) load()
    else setLoading(false)
  }, [isCandidate, load])

  const act = async (id: number | 'new', action: string, username?: string) => {
    setBusy(id)
    try {
      if (action === 'request') {
        await api.post('/connections/', { username })
      } else {
        await api.post(`/connections/${id}/${action}/`)
      }
      load()
    } catch { /* ignore */ }
    setBusy(null)
  }

  const message = (username: string) => navigate(`/messages?with=${username}`)

  if (!isCandidate) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Acesso restrito" hint="As conexões profissionais estão disponíveis para contas de candidato." />
      </div>
    )
  }

  const other = (c: Connection) =>
    c.requester.username === user?.username ? c.addressee : c.requester

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Minhas conexões</h1>
      <p className="mt-1 text-sm text-slate-500">Gerencie sua rede profissional no Appliety.</p>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Incoming requests */}
          <section className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
              Convites recebidos {lists && lists.incoming.length > 0 && `(${lists.incoming.length})`}
            </h2>
            {lists && lists.incoming.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {lists.incoming.map((c) => (
                  <PersonRow key={c.id} person={c.requester}>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => act(c.id, 'accept')}
                        disabled={busy === c.id}
                        className="btn-primary !px-3 !py-1.5 text-xs"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => act(c.id, 'reject')}
                        disabled={busy === c.id}
                        className="btn-outline !px-3 !py-1.5 text-xs"
                      >
                        Recusar
                      </button>
                    </div>
                  </PersonRow>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-slate-400">Nenhum convite pendente.</p>
            )}
          </section>

          {/* Sent requests */}
          <section className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
              Convites enviados {lists && lists.outgoing.length > 0 && `(${lists.outgoing.length})`}
            </h2>
            {lists && lists.outgoing.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {lists.outgoing.map((c) => (
                  <PersonRow key={c.id} person={c.addressee}>
                    <button
                      onClick={() => act(c.id, 'cancel')}
                      disabled={busy === c.id}
                      className="btn-ghost !px-3 !py-1.5 text-xs text-slate-500"
                    >
                      Cancelar
                    </button>
                  </PersonRow>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-slate-400">Nenhum convite enviado.</p>
            )}
          </section>

          {/* Accepted connections */}
          <section className="card overflow-hidden lg:col-span-2">
            <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
              Minha rede {lists && `(${lists.accepted.length})`}
            </h2>
            {lists && lists.accepted.length > 0 ? (
              <ul className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
                {lists.accepted.map((c) => {
                  const person = other(c)
                  return (
                    <li key={c.id} className="flex items-center gap-3 px-4 py-3 sm:border-b sm:border-slate-100">
                      <Link to={person.profile_url} className="shrink-0">
                        <Avatar author={person} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={person.profile_url} className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-700 hover:underline">
                          {person.name}
                        </Link>
                        <p className="truncate text-xs text-slate-500">{person.headline || person.subtitle}</p>
                      </div>
                      <button
                        onClick={() => message(person.username)}
                        className="btn-outline !px-3 !py-1.5 text-xs"
                      >
                        Mensagem
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-slate-400">Você ainda não tem conexões. Explore as sugestões abaixo.</p>
            )}
          </section>

          {/* Suggestions */}
          <section className="card overflow-hidden lg:col-span-2">
            <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
              Pessoas que você pode conhecer
            </h2>
            {suggestions.length > 0 ? (
              <ul className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
                {suggestions.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:border-b sm:border-slate-100">
                    <Link to={p.profile_url} className="shrink-0">
                      <Avatar author={p} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={p.profile_url} className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-700 hover:underline">
                        {p.name}
                      </Link>
                      <p className="truncate text-xs text-slate-500">{p.headline || p.subtitle}</p>
                    </div>
                    <button
                      onClick={() => act('new', 'request', p.username)}
                      disabled={busy === 'new'}
                      className="btn-primary !px-3 !py-1.5 text-xs"
                    >
                      Conectar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-slate-400">Nenhuma sugestão no momento.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
