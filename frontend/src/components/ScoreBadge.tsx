export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-brand-600 text-white' : score >= 40 ? 'bg-accent-500 text-white' : 'bg-slate-200 text-slate-600'
  return (
    <span className={`badge ${color} px-3 py-1 text-sm font-bold`} title="Compatibility score">
      {score}%
    </span>
  )
}
