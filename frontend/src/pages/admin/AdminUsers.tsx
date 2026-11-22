import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import type { Paginated, User } from '../../types'
import { ErrorAlert, Spinner } from '../../components/ui'

const ROLES = ['candidate', 'company', 'admin']

export function AdminUsers() {
  const [data, setData] = useState<Paginated<User> | null>(null)
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUsers = useCallback(() => {
    setLoading(true)
    api.get<Paginated<User>>('/users/', {
      params: { page_size: 50, ...(role ? { role } : {}), ...(search ? { search } : {}) },
    }).then(({ data }) => setData(data)).finally(() => setLoading(false))
  }, [role, search])

  useEffect(fetchUsers, [fetchUsers])

  const toggleActive = async (u: User) => {
    try {
      await api.patch(`/users/${u.id}/`, { is_active: !u.is_active })
      fetchUsers()
    } catch {
      setError('Could not update user.')
    }
  }

  const changeRole = async (u: User, newRole: string) => {
    if (!window.confirm(`Change ${u.username}'s role to ${newRole}?`)) return
    try {
      await api.patch(`/users/${u.id}/`, { role: newRole })
      fetchUsers()
    } catch {
      setError('Could not change role.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">User management</h1>
      <p className="mt-1 text-sm text-slate-500">{data ? `${data.count} registered users` : ''}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          className="input !w-64"
          placeholder="Search name, username, email…"
          defaultValue={search}
          onKeyDown={(e) => e.key === 'Enter' && setSearch((e.target as HTMLInputElement).value)}
          onBlur={(e) => setSearch(e.target.value)}
        />
        <select className="input !w-44" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {error && <div className="mt-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <Spinner />
      ) : !data || data.results.length === 0 ? (
        <p className="card mt-6 p-10 text-center text-sm text-slate-500">No users found.</p>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-slate-400">@{u.username}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input !w-32 !py-1 text-xs"
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.is_active !== false ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'}`}>
                      {u.is_active !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(u)} className="text-xs font-medium text-brand-600 hover:underline">
                      {u.is_active !== false ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
