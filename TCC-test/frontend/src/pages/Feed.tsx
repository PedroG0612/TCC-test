import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { CompanyStats, JobMatch, Paginated, Post, PostComment } from '../types'
import { EmptyState, ErrorAlert, Spinner } from '../components/ui'
import { CompanyLogo } from '../components/CompanyLogo'

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

function Avatar({ author, size = 'md' }: { author: Post['author']; size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = useState(false)
  useEffect(() => {
    setImgError(false)
  }, [author.avatar_url])
  const dims = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-9 w-9' : 'h-12 w-12'
  if (author.avatar_url && !imgError) {
    return (
      <img
        src={author.avatar_url}
        alt={author.name}
        onError={() => setImgError(true)}
        className={`${dims} shrink-0 rounded-full object-cover`}
      />
    )
  }
  const initials = author.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`${dims} flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700`}>
      {initials}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Post card
// ---------------------------------------------------------------------------
function PostCard({ post, onDelete, onLike }: {
  post: Post
  onDelete: (id: number) => void
  onLike: (id: number, liked: boolean, count: number) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PostComment[] | null>(null)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [postImageError, setPostImageError] = useState(false)
  const longText = post.text.length > 400

  const loadComments = useCallback(() => {
    api.get<PostComment[]>(`/feed/posts/${post.id}/comments/`)
      .then(({ data }) => setComments(data))
      .catch(() => setComments([]))
  }, [post.id])

  const toggleComments = () => {
    const next = !showComments
    setShowComments(next)
    if (next && comments === null) loadComments()
  }

  const like = async () => {
    try {
      const { data } = await api.post<{ liked: boolean; like_count: number }>(`/feed/posts/${post.id}/like/`)
      onLike(post.id, data.liked, data.like_count)
    } catch { /* ignore */ }
  }

  const sendComment = async () => {
    const text = commentText.trim()
    if (!text || posting) return
    setPosting(true)
    try {
      const { data } = await api.post<PostComment>(`/feed/posts/${post.id}/comments/`, { text })
      setComments((c) => [...(c ?? []), data])
      setCommentText('')
    } catch { /* ignore */ }
    setPosting(false)
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/home`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const remove = async () => {
    if (!window.confirm('Excluir esta publicação?')) return
    try {
      await api.delete(`/feed/posts/${post.id}/`)
      onDelete(post.id)
    } catch { /* ignore */ }
  }

  return (
    <article className="card p-5">
      {/* Author header */}
      <div className="flex items-start gap-3">
        <Link to={post.author.profile_url} className="shrink-0">
          <Avatar author={post.author} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link to={post.author.profile_url} className="truncate font-bold text-slate-900 hover:text-brand-700 hover:underline">
              {post.author.name}
            </Link>
            {post.author.role === 'company' && (
              <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">Empresa</span>
            )}
          </div>
          <p className="truncate text-sm text-slate-500">
            {post.author.headline || post.author.role_display}
            {post.author.subtitle ? ` · ${post.author.subtitle}` : ''}
          </p>
          <p className="text-xs text-slate-400">{timeAgo(post.created_at)}</p>
        </div>
        {post.is_own && (
          <button onClick={remove} className="text-xs font-medium text-slate-400 hover:text-red-600" title="Excluir publicação">
            Excluir
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mt-3">
        <p className={`whitespace-pre-line text-sm leading-relaxed text-slate-700 ${!expanded && longText ? 'line-clamp-6' : ''}`}>
          {post.text}
        </p>
        {longText && (
          <button onClick={() => setExpanded(!expanded)} className="mt-1 text-xs font-semibold text-brand-600 hover:underline">
            {expanded ? 'Ver menos' : 'Ver mais'}
          </button>
        )}
        {post.image_url && !postImageError && (
          <img
            src={post.image_url}
            alt="Publicação"
            onError={() => setPostImageError(true)}
            className="mt-3 w-full rounded-xl border border-slate-200 object-cover"
          />
        )}
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{post.like_count > 0 ? `${post.like_count} ${post.like_count === 1 ? 'curtida' : 'curtidas'}` : ''}</span>
        <span>{post.comment_count > 0 ? `${post.comment_count} ${post.comment_count === 1 ? 'comentário' : 'comentários'}` : ''}</span>
      </div>

      {/* Actions */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
        <button
          onClick={like}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
            post.has_liked ? 'text-brand-600' : 'text-slate-500 hover:bg-slate-50 hover:text-brand-600'
          }`}
        >
          <svg className="h-5 w-5" fill={post.has_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V2.75a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.25a2.25 2.25 0 01-2.25-2.25v-6a2.25 2.25 0 012.25-2.25z" />
          </svg>
          {post.has_liked ? 'Curtido' : 'Curtir'}
        </button>
        <button
          onClick={toggleComments}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-brand-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          Comentar
        </button>
        <button
          onClick={share}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-brand-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          {copied ? 'Link copiado!' : 'Compartilhar'}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {comments === null ? (
            <Spinner label="Carregando comentários…" />
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400">Seja o primeiro a comentar.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <Avatar author={c.author} size="sm" />
                  <div className="rounded-2xl bg-slate-100 px-3 py-2">
                    <Link to={c.author.profile_url} className="text-xs font-bold text-slate-800 hover:underline">{c.author.name}</Link>
                    <p className="text-sm text-slate-700">{c.text}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(c.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <input
              className="input !py-2 text-sm"
              placeholder="Escreva um comentário…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendComment()}
            />
            <button onClick={sendComment} disabled={posting || !commentText.trim()} className="btn-primary !px-4 !py-2 text-xs">
              Enviar
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

// ---------------------------------------------------------------------------
// Feed page
// ---------------------------------------------------------------------------
export function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [next, setNext] = useState<string | null>(null)
  const [ordering, setOrdering] = useState('-created_at')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  // Composer
  const [composing, setComposing] = useState(false)
  const [postText, setPostText] = useState('')
  const [postImage, setPostImage] = useState<File | null>(null)
  const [publishing, setPublishing] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  // Sidebar data
  const [appCount, setAppCount] = useState<number | null>(null)
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])

  const isCandidate = user?.role === 'candidate'
  const isCompany = user?.role === 'company'

  const fetchPosts = useCallback((reset = true) => {
    if (reset) setLoading(true)
    else setLoadingMore(true)
    setError('')
    const url = reset
      ? `/feed/posts/?ordering=${ordering}&page_size=10`
      : next!
    api.get<Paginated<Post>>(url)
      .then(({ data }) => {
        setPosts((prev) => (reset ? data.results : [...prev, ...data.results]))
        setNext(data.next)
      })
      .catch(() => setError('Não foi possível carregar o feed.'))
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }, [ordering, next])

  useEffect(() => {
    setPosts([])
    setNext(null)
    fetchPosts(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordering])

  // Sidebar stats & suggestions (real API data only)
  useEffect(() => {
    if (!user) return
    if (isCandidate) {
      api.get<Paginated<any>>('/applications/', { params: { page_size: 1 } })
        .then(({ data }) => setAppCount(data.count)).catch(() => {})
      api.get<JobMatch[]>('/matching/jobs/', { params: { limit: 3 } })
        .then(({ data }) => setSuggestions(data)).catch(() => {})
    } else if (isCompany) {
      api.get<CompanyStats>('/reports/company/')
        .then(({ data }) => setCompanyStats(data)).catch(() => {})
      api.get<Paginated<any>>('/applications/', { params: { page_size: 3 } })
        .then(({ data }) => setSuggestions(data.results)).catch(() => {})
    } else {
      api.get<Paginated<any>>('/jobs/', { params: { status: 'published', page_size: 3 } })
        .then(({ data }) => setSuggestions(data.results)).catch(() => {})
    }
  }, [user, isCandidate, isCompany])

  const publish = async () => {
    if (!postText.trim() && !postImage) return
    setPublishing(true)
    setError('')
    try {
      const fd = new FormData()
      if (postText.trim()) fd.append('text', postText.trim())
      else fd.append('text', '')
      if (postImage) fd.append('image', postImage)
      const { data } = await api.post<Post>('/feed/posts/', fd)
      setPosts((prev) => [data, ...prev])
      setPostText('')
      setPostImage(null)
      setComposing(false)
    } catch (err: any) {
      const errData = err.response?.data
      setError(
        errData?.image?.[0] ??
          errData?.non_field_errors?.[0] ??
          errData?.detail ??
          'Não foi possível publicar.',
      )
    } finally {
      setPublishing(false)
    }
  }

  const handleLike = (id: number, liked: boolean, count: number) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, has_liked: liked, like_count: count } : p)))
  }

  const handleDelete = (id: number) => setPosts((prev) => prev.filter((p) => p.id !== id))

  const profile = isCandidate ? user?.candidate_profile : user?.company_profile
  const avatarUrl = isCandidate
    ? (profile as any)?.photo_url
    : (profile as any)?.logo_url
  const coverUrl = (profile as any)?.cover_url
  const displayName = isCandidate
    ? `${user?.first_name} ${user?.last_name}`.trim() || user?.username
    : (user?.company_profile?.company_name || user?.username)
  const headline = isCandidate
    ? (profile as any)?.headline
    : user?.company_profile?.sector
  const profilePath = isCandidate ? '/profile' : '/company/profile'
  const publicPath = user ? `/u/${user.username}` : '#'

  const [sidebarAvatarError, setSidebarAvatarError] = useState(false)
  const [sidebarCoverError, setSidebarCoverError] = useState(false)

  useEffect(() => {
    setSidebarAvatarError(false)
  }, [avatarUrl])

  useEffect(() => {
    setSidebarCoverError(false)
  }, [coverUrl])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        {/* ---------------- Left sidebar ---------------- */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Profile summary card */}
          <div className="card overflow-hidden">
            <div className="h-16 bg-brand-600">
              {coverUrl && !sidebarCoverError && (
                <img src={coverUrl} alt="" onError={() => setSidebarCoverError(true)} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="px-4 pb-4">
              <div className="-mt-8 mb-2">
                {avatarUrl && !sidebarAvatarError ? (
                  <img
                    src={avatarUrl}
                    alt={displayName ?? ''}
                    onError={() => setSidebarAvatarError(true)}
                    className="h-16 w-16 rounded-full border-4 border-white bg-white object-cover"
                  />
                ) : (
                  <CompanyLogo name={displayName ?? '?'} size="lg" />
                )}
              </div>
              <Link to={profilePath} className="block font-bold text-slate-900 hover:text-brand-700 hover:underline">
                {displayName}
              </Link>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{headline || 'Complete seu perfil'}</p>
              {user?.city && <p className="mt-0.5 text-xs text-slate-400">{user.city}</p>}
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs">
                <Link to={profilePath} className="block font-semibold text-slate-600 hover:text-brand-600">Ver perfil</Link>
                <Link to={publicPath} className="block font-semibold text-slate-600 hover:text-brand-600">Perfil público</Link>
              </div>
            </div>
          </div>

          {/* Stats card — real data only */}
          <div className="card p-4">
            <p className="eyebrow mb-2">Seu painel</p>
            {isCandidate && (
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Candidaturas</dt><dd className="font-bold text-slate-900">{appCount ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Competências</dt><dd className="font-bold text-slate-900">{(profile as any)?.skills?.length ?? 0}</dd></div>
              </dl>
            )}
            {isCompany && companyStats && (
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Vagas publicadas</dt><dd className="font-bold text-slate-900">{companyStats.totals?.published_jobs ?? 0}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Candidaturas</dt><dd className="font-bold text-slate-900">{companyStats.totals?.applications ?? 0}</dd></div>
              </dl>
            )}
            {user?.role === 'admin' && <p className="text-sm text-slate-500">Acesso administrativo à plataforma.</p>}
          </div>

          {/* Quick links */}
          <div className="card p-4">
            <p className="eyebrow mb-2">Atalhos</p>
            <div className="space-y-1 text-sm">
              {isCandidate && (
                <>
                  <Link to="/jobs" className="block font-medium text-slate-600 hover:text-brand-600">Buscar vagas</Link>
                  <Link to="/applications" className="block font-medium text-slate-600 hover:text-brand-600">Minhas candidaturas</Link>
                  <Link to="/jobs" className="block font-medium text-slate-600 hover:text-brand-600">Vagas para meu perfil</Link>
                </>
              )}
              {isCompany && (
                <>
                  <Link to="/company/jobs/new" className="block font-medium text-slate-600 hover:text-brand-600">Publicar vaga</Link>
                  <Link to="/company/applications" className="block font-medium text-slate-600 hover:text-brand-600">Candidaturas</Link>
                  <Link to="/company/matching" className="block font-medium text-slate-600 hover:text-brand-600">Matching</Link>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin/users" className="block font-medium text-slate-600 hover:text-brand-600">Usuários</Link>
                  <Link to="/admin/reports" className="block font-medium text-slate-600 hover:text-brand-600">Relatórios</Link>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ---------------- Center feed ---------------- */}
        <div className="order-first min-w-0 space-y-4 lg:order-none">
          {/* Composer */}
          <div className="card p-4">
            <div className="flex items-center gap-3">
              {avatarUrl && !sidebarAvatarError ? (
                <img
                  src={avatarUrl}
                  alt=""
                  onError={() => setSidebarAvatarError(true)}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <CompanyLogo name={displayName ?? '?'} />
              )}
              <button
                onClick={() => setComposing(!composing)}
                className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-slate-50"
              >
                Começar publicação
              </button>
            </div>

            {composing && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <textarea
                  className="input min-h-28"
                  placeholder="No que você está pensando?"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  autoFocus
                />
                {postImage && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <span className="truncate">{postImage.name}</span>
                    <button onClick={() => setPostImage(null)} className="ml-auto text-slate-400 hover:text-red-500">×</button>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={() => fileInput.current?.click()} className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    Foto
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      e.target.value = ''
                      setPostImage(file)
                    }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setComposing(false); setPostText(''); setPostImage(null) }} className="btn-ghost !py-2 text-xs">Cancelar</button>
                    <button onClick={publish} disabled={publishing || (!postText.trim() && !postImage)} className="btn-primary !py-2 text-xs">
                      {publishing ? 'Publicando…' : 'Publicar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sort row */}
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className="text-slate-400">Ordenar por:</span>
            <select
              className="input !w-auto !py-1.5 text-xs"
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
            >
              <option value="-created_at">Mais recentes</option>
              <option value="-like_count,-created_at">Mais relevantes</option>
            </select>
          </div>

          {error && <ErrorAlert message={error} />}

          {/* Posts */}
          {loading ? (
            <Spinner />
          ) : posts.length === 0 ? (
            <EmptyState
              title="Nenhuma publicação ainda"
              hint="Seja o primeiro a compartilhar algo com a comunidade Appliety."
            />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onDelete={handleDelete} onLike={handleLike} />
              ))}
            </div>
          )}

          {next && !loading && (
            <div className="text-center">
              <button className="btn-outline" onClick={() => fetchPosts(false)} disabled={loadingMore}>
                {loadingMore ? 'Carregando…' : 'Carregar mais publicações'}
              </button>
            </div>
          )}
        </div>

        {/* ---------------- Right sidebar ---------------- */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {isCandidate && (
            <div className="card p-4">
              <p className="eyebrow mb-3">Vagas para você</p>
              {suggestions.length === 0 ? (
                <p className="text-sm text-slate-400">Complete seu perfil para receber recomendações.</p>
              ) : (
                <ul className="space-y-3">
                  {suggestions.map((m: JobMatch) => (
                    <li key={m.job.id}>
                      <Link to={`/jobs?job=${m.job.id}`} className="block">
                        <p className="text-sm font-semibold text-slate-900 hover:text-brand-700">{m.job.title}</p>
                        <p className="text-xs text-slate-500">{m.job.company_name} · {m.job.location}</p>
                        <span className="badge mt-1 bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">{m.score}% match</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/jobs" className="mt-3 inline-block text-xs font-semibold text-brand-600 hover:underline">Ver todas →</Link>
            </div>
          )}

          {isCompany && (
            <div className="card p-4">
              <p className="eyebrow mb-3">Candidaturas recentes</p>
              {suggestions.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma candidatura recebida ainda.</p>
              ) : (
                <ul className="space-y-3">
                  {suggestions.map((a: any) => (
                    <li key={a.id}>
                      <p className="text-sm font-semibold text-slate-900">{a.candidate_name}</p>
                      <p className="text-xs text-slate-500">{a.job_title}</p>
                      <span className="badge mt-1 bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">{a.status_display}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/company/applications" className="mt-3 inline-block text-xs font-semibold text-brand-600 hover:underline">Ver todas →</Link>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="card p-4">
              <p className="eyebrow mb-3">Vagas em destaque</p>
              {suggestions.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma vaga publicada.</p>
              ) : (
                <ul className="space-y-3">
                  {suggestions.map((j: any) => (
                    <li key={j.id}>
                      <Link to={`/jobs/${j.id}`} className="block">
                        <p className="text-sm font-semibold text-slate-900 hover:text-brand-700">{j.title}</p>
                        <p className="text-xs text-slate-500">{j.company_name} · {j.location}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Platform info card */}
          <div className="card p-4">
            <p className="eyebrow mb-2">Appliety</p>
            <p className="text-xs leading-relaxed text-slate-500">
              Marketplace de vagas com matching explicável. Conectamos talentos e empresas
              por critérios transparentes.
            </p>
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs">
              <Link to="/about" className="block font-medium text-slate-500 hover:text-brand-600">Sobre a plataforma</Link>
              <a href="/api/docs/" target="_blank" rel="noreferrer" className="block font-medium text-slate-500 hover:text-brand-600">Documentação da API ↗</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
