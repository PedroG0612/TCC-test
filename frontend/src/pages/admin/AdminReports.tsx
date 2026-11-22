import { useState } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ErrorAlert } from '../../components/ui'

const DATASETS = [
  { value: 'applications', label: 'Candidaturas' },
  { value: 'jobs', label: 'Vagas' },
  { value: 'overview', label: 'Visão geral' },
]
const FORMATS = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'pdf', label: 'PDF' },
]

export function AdminReports() {
  const { user } = useAuth()
  const [dataset, setDataset] = useState('applications')
  const [format, setFormat] = useState('xlsx')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const datasets = user?.role === 'admin' ? DATASETS : DATASETS.filter((d) => d.value !== 'overview')

  const download = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('appliety_token')
      const res = await fetch(
        `/api/reports/export/?dataset=${dataset}&export_format=${format}`,
        { headers: { Authorization: `Token ${token}` } },
      )
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appliety_${dataset}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Não foi possível gerar o relatório.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Relatórios e exportações</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gere relatórios com dados reais da plataforma. Admins can export platform-wide data;
        companies export their own vacancies and applications.
      </p>

      <div className="card mt-6 space-y-5 p-6">
        <div>
          <label className="label">Conjunto de dados</label>
          <div className="grid gap-2 sm:grid-cols-3">
            {datasets.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDataset(d.value)}
                className={`rounded-xl border-2 p-4 text-left text-sm font-medium transition-all ${
                  dataset === d.value ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Formato</label>
          <div className="flex gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                className={`badge px-4 py-2 text-sm ring-1 ring-inset ${format === f.value ? 'bg-accent-600 text-white ring-accent-600' : 'bg-white text-slate-600 ring-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {error && <ErrorAlert message={error} />}
        <button onClick={download} disabled={loading} className="btn-primary">
          {loading ? 'Gerando…' : '⬇ Baixar relatório'}
        </button>
      </div>
    </div>
  )
}
