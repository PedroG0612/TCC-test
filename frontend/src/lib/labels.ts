export const CATEGORY_LABELS: Record<string, string> = {
  technology: 'Tecnologia',
  design: 'Design',
  marketing: 'Marketing',
  business: 'Negócios',
  engineering: 'Engenharia',
  health: 'Saúde',
  education: 'Educação',
  other: 'Outros',
}

export const WORK_MODE_LABELS: Record<string, string> = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
}

export const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Tempo integral',
  part_time: 'Meio período',
  internship: 'Estágio',
  freelance: 'Freelance',
}

export const SENIORITY_LABELS: Record<string, string> = {
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicada',
  paused: 'Pausada',
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  applied: 'Candidatura enviada',
  under_review: 'Em análise',
  interview: 'Entrevista',
  rejected: 'Não avançou',
  hired: 'Contratado',
}

export const EDUCATION_STATUS_LABELS: Record<string, string> = {
  in_progress: 'Cursando',
  completed: 'Concluído',
  dropped: 'Evadido',
}

export const label = (map: Record<string, string>, key: string) =>
  map[key] ?? key
