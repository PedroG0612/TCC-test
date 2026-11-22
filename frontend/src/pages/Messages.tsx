import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { ConversationItem, MessageItem, PostAuthor } from '../types'
import { EmptyState, Spinner } from '../components/ui'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days} d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ author, size = 'md' }: { author: PostAuthor | null; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  if (author?.avatar_url) {
    return <img src={author.avatar_url} alt={author.name} className={`${dims} shrink-0 rounded-full object-cover`} />
  }
  const initials = (author?.name ?? '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`${dims} flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700`}>
      {initials}
    </div>
  )
}

export function Messages() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [text, setText] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isCandidate = user?.role === 'candidate'

  const loadConversations = useCallback(() => {
    api.get<ConversationItem[]>('/conversations/')
      .then(({ data }) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  const loadMessages = useCallback((convId: number, silent = false) => {
    if (!silent) setLoadingMsgs(true)
    api.get<MessageItem[]>(`/conversations/${convId}/messages/`)
      .then(({ data }) => setMessages(data))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false))
  }, [])

  // Initial list + polling
  useEffect(() => {
    if (!isCandidate) return
    loadConversations()
    const t = setInterval(loadConversations, 15_000)
    return () => clearInterval(t)
  }, [isCandidate, loadConversations])

  // Deep link: ?with=username -> open/create conversation
  useEffect(() => {
    const withUser = params.get('with')
    if (!withUser || !isCandidate) return
    api.post<ConversationItem>('/conversations/', { username: withUser })
      .then(({ data }) => {
        setActiveId(data.id)
        setParams({}, { replace: true })
      })
      .catch(() => {})
  }, [params, isCandidate, setParams])

  // Active conversation: load + poll + mark read
  useEffect(() => {
    if (activeId === null) return
    loadMessages(activeId)
    api.post(`/conversations/${activeId}/read/`).catch(() => {})
    const t = setInterval(() => {
      loadMessages(activeId, true)
      api.post(`/conversations/${activeId}/read/`).catch(() => {})
      loadConversations()
    }, 5_000)
    return () => clearInterval(t)
  }, [activeId, loadMessages, loadConversations])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const value = text.trim()
    if (!value || !activeId || sending) return
    setSending(true)
    try {
      const { data } = await api.post<MessageItem>(`/conversations/${activeId}/messages/`, { text: value })
      setMessages((m) => [...m, data])
      setText('')
      loadConversations()
    } catch { /* ignore */ }
    setSending(false)
  }

  const active = conversations.find((c) => c.id === activeId)

  if (!isCandidate) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Acesso restrito" hint="A mensageria está disponível para contas de candidato." />
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl flex-col px-4 py-4 sm:px-6">
      <h1 className="mb-3 text-xl font-extrabold tracking-tight text-slate-900">Mensagens</h1>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Conversation list */}
        <aside className={`w-full flex-col border-slate-200 sm:w-80 sm:border-r ${activeId !== null ? 'hidden sm:flex' : 'flex'}`}>
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Conversas</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <Spinner />
            ) : conversations.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                Nenhuma conversa ainda. Conecte-se com candidatos para começar.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${c.id === activeId ? 'bg-brand-50' : ''}`}
                    >
                      <div className="relative">
                        <Avatar author={c.other_user} />
                        {c.unread_count > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{c.other_user?.name ?? 'Usuário'}</p>
                        <p className="truncate text-xs text-slate-500">
                          {c.last_message
                            ? `${c.last_message.sender_id === user?.id ? 'Você: ' : ''}${c.last_message.text}`
                            : 'Conversa iniciada'}
                        </p>
                      </div>
                      {c.last_message && (
                        <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(c.last_message.created_at)}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Active conversation */}
        <section className={`min-w-0 flex-1 flex-col ${activeId === null ? 'hidden sm:flex' : 'flex'}`}>
          {activeId === null ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <p className="text-sm text-slate-400">Selecione uma conversa para começar.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button onClick={() => setActiveId(null)} className="text-slate-400 hover:text-slate-700 sm:hidden" aria-label="Voltar">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                <Avatar author={active?.other_user ?? null} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{active?.other_user?.name ?? '…'}</p>
                  <p className="truncate text-xs text-slate-500">{active?.other_user?.headline || active?.other_user?.subtitle}</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
                {loadingMsgs && messages.length === 0 ? (
                  <Spinner />
                ) : messages.length === 0 ? (
                  <p className="pt-8 text-center text-sm text-slate-400">Envie a primeira mensagem.</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender.id === user?.id
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? 'bg-brand-600 text-white' : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'}`}>
                          <p className="whitespace-pre-line text-sm leading-relaxed">{m.text}</p>
                          <p className={`mt-1 text-right text-[10px] ${mine ? 'text-brand-100' : 'text-slate-400'}`}>
                            {fmtTime(m.created_at)}{mine && m.read_at ? ' · lida' : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="flex items-end gap-2 border-t border-slate-100 p-3">
                <textarea
                  className="input max-h-32 min-h-10 flex-1 resize-none !py-2 text-sm"
                  placeholder="Escreva uma mensagem…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  rows={1}
                />
                <button onClick={send} disabled={sending || !text.trim()} className="btn-primary !px-4 !py-2.5 text-sm">
                  Enviar
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
