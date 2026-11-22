export function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Sobre o Appliety</h1>
      <div className="prose prose-slate mt-6 space-y-4 text-slate-600">
        <p>
          O Appliety é um marketplace inteligente de vagas e recrutamento. Ele centraliza
          empresas, candidatos, vagas e candidaturas em um só lugar, usando algoritmos
          de matching para recomendar oportunidades e candidatos adequados.
        </p>
        <h2 className="text-xl font-bold text-slate-900">O problema que resolvemos</h2>
        <p>
          Empresas têm dificuldade para encontrar candidatos qualificados, enquanto
          estudantes e profissionais lutam para identificar oportunidades compatíveis
          com seus perfis. O Appliety resolve isso combinando perfis estruturados,
          busca poderosa e um score de compatibilidade explicável.
        </p>
        <h2 className="text-xl font-bold text-slate-900">Como o matching funciona</h2>
        <p>
          Cada par candidato–vaga recebe um score de 0 a 100 distribuído em quatro
          critérios: competências essenciais (50 pts), competências desejáveis
          (10 pts), experiência (25 pts, incluindo similaridade textual via
          TF-IDF/scikit-learn) e preferências de local/modelo/área (15 pts).
          O resultado mostra a evidência por critério — o que foi encontrado,
          o que foi parcial e o que não foi informado.
        </p>
        <p className="text-sm text-slate-400">
          Nota: o matcher é um heurístico transparente, não um modelo avançado de IA
          para contratação. Informações ausentes aparecem como “não informadas” —
          nunca como prova de falta de competência. A decisão final é sempre das
          pessoas envolvidas.
        </p>
      </div>
    </div>
  )
}
