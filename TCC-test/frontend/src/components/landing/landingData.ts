export interface LandingJob {
  id: string
  liveJobId?: number
  title: string
  company: string
  logoKey: 'nativa' | 'cerrado' | 'folha' | 'semente' | 'pinheiro' | 'mata'
  area: 'Tecnologia' | 'Design' | 'Dados' | 'Pessoas & RH' | 'Marketing'
  location: string
  cityFilter: 'São Paulo, SP' | 'Belo Horizonte, MG' | 'Curitiba, PR' | 'Florianópolis, SC' | 'Remoto (Brasil)'
  model: 'Remoto' | 'Híbrido' | 'Presencial'
  contract: 'CLT' | 'PJ' | 'Estágio'
  level: 'Estágio' | 'Júnior' | 'Pleno' | 'Sênior'
  salary: string
  urgent?: boolean
  postedLabel: string
  searchQuery: string
}

export const FEATURED_JOBS: LandingJob[] = [
  {
    id: 'fe-react-nativa',
    title: 'Desenvolvedor(a) Front-end React',
    company: 'Nativa Tecnologia',
    logoKey: 'nativa',
    area: 'Tecnologia',
    location: 'São Paulo, SP',
    cityFilter: 'Remoto (Brasil)',
    model: 'Remoto',
    contract: 'CLT',
    level: 'Pleno',
    salary: 'R$ 9.500 – R$ 12.000',
    urgent: true,
    postedLabel: 'Publicada hoje',
    searchQuery: 'React',
  },
  {
    id: 'pd-ux-floresta',
    title: 'Designer de Produto (UX/UI)',
    company: 'Floresta Digital',
    logoKey: 'folha',
    area: 'Design',
    location: 'São Paulo, SP',
    cityFilter: 'São Paulo, SP',
    model: 'Híbrido',
    contract: 'CLT',
    level: 'Pleno',
    salary: 'R$ 8.500 – R$ 10.800',
    postedLabel: 'Há 1 dia',
    searchQuery: 'Design',
  },
  {
    id: 'dados-cerrado',
    title: 'Analista de Dados & BI',
    company: 'Cerrado Pay',
    logoKey: 'cerrado',
    area: 'Dados',
    location: 'Belo Horizonte, MG',
    cityFilter: 'Belo Horizonte, MG',
    model: 'Remoto',
    contract: 'CLT',
    level: 'Júnior',
    salary: 'R$ 5.800 – R$ 7.200',
    urgent: true,
    postedLabel: 'Há 2 dias',
    searchQuery: 'Dados',
  },
  {
    id: 'be-node-pinheiro',
    title: 'Engenheiro(a) de Software Back-end',
    company: 'Pinheiro Cloud',
    logoKey: 'pinheiro',
    area: 'Tecnologia',
    location: 'Curitiba, PR',
    cityFilter: 'Curitiba, PR',
    model: 'Remoto',
    contract: 'PJ',
    level: 'Sênior',
    salary: 'R$ 15.000 – R$ 18.500',
    postedLabel: 'Há 2 dias',
    searchQuery: 'Back-end',
  },
  {
    id: 'rh-mata',
    title: 'Pessoa Recrutadora Tech (People)',
    company: 'Mata Atlântica Saúde',
    logoKey: 'mata',
    area: 'Pessoas & RH',
    location: 'Florianópolis, SC',
    cityFilter: 'Florianópolis, SC',
    model: 'Híbrido',
    contract: 'CLT',
    level: 'Pleno',
    salary: 'R$ 6.800 – R$ 8.400',
    postedLabel: 'Há 3 dias',
    searchQuery: 'Recrutadora',
  },
  {
    id: 'mkt-estagio-semente',
    title: 'Estágio em Marketing de Produto',
    company: 'Semente Educação',
    logoKey: 'semente',
    area: 'Marketing',
    location: 'São Paulo, SP',
    cityFilter: 'São Paulo, SP',
    model: 'Presencial',
    contract: 'Estágio',
    level: 'Estágio',
    salary: 'Bolsa R$ 2.400 + benefícios',
    urgent: true,
    postedLabel: 'Publicada hoje',
    searchQuery: 'Marketing',
  },
]

export interface LandingTestimonial {
  id: string
  name: string
  role: string
  company: string
  type: 'Candidata contratada' | 'Candidato contratado' | 'Empresa parceira'
  quote: string
  photo: string
  initials: string
  rating: number
}

export const TESTIMONIALS: LandingTestimonial[] = [
  {
    id: 'camila',
    name: 'Camila Nogueira',
    role: 'Product Designer Pleno',
    company: 'Floresta Digital',
    type: 'Candidata contratada',
    quote:
      'Preenchi meu perfil em dez minutos e já vi exatamente por que cada vaga fazia sentido para meu momento. Em três semanas fiz duas entrevistas alinhadas e aceitei minha proposta atual.',
    photo: '/images/testimonial-camila.jpg',
    initials: 'CN',
    rating: 5,
  },
  {
    id: 'rafael',
    name: 'Rafael Mendes',
    role: 'Engenheiro de Software Sênior',
    company: 'Cerrado Pay',
    type: 'Candidato contratado',
    quote:
      'O que mais fez diferença foi a clareza de faixa salarial, modelo de trabalho e retorno em cada etapa. Não fiquei no escuro esperando resposta de currículo.',
    photo: '/images/testimonial-rafael.jpg',
    initials: 'RM',
    rating: 5,
  },
  {
    id: 'fernanda',
    name: 'Fernanda Azevedo',
    role: 'Head de Pessoas',
    company: 'Folha Viva Logística',
    type: 'Empresa parceira',
    quote:
      'Reduzimos nosso tempo de triagem pela metade sem perder o olhar humano. Recebemos perfis muito mais aderentes à cultura do time e com histórico organizado.',
    photo: '/images/testimonial-fernanda.jpg',
    initials: 'FA',
    rating: 5,
  },
]

export interface CareerArticle {
  id: string
  category: string
  readTime: string
  title: string
  summary: string
  body: string[]
}

export const CAREER_ARTICLES: CareerArticle[] = [
  {
    id: 'cv-objetivo',
    category: 'Para candidatos',
    readTime: '4 min de leitura',
    title: 'Como descrever projetos e resultados reais no seu currículo sem exageros',
    summary:
      'Troque listas genéricas de ferramentas por contexto, problema resolvido e impacto mensurável no time.',
    body: [
      'Recrutadores e lideranças técnicas leem dezenas de perfis por semana. Quando você escreve apenas "Responsável por relatórios", fica difícil entender o porte do desafio que você encarou.',
      'Uma estrutura simples funciona bem: diga qual era o contexto, o que você construiu ou organizou e qual mudança prática isso trouxe (menos retrabalho, tempo economizado, atendimento mais rápido).',
      'No BrotoRH, suas experiências e competências são apresentadas lado a lado com evidências reais para evitar filtros mecânicos injustos.',
    ],
  },
  {
    id: 'vaga-clara',
    category: 'Para empresas',
    readTime: '5 min de leitura',
    title: 'O que candidatos experientes avaliam antes de clicar em "Candidatar-se"',
    summary:
      'Faixa salarial transparente, escopo dos primeiros 90 dias e rotina real do time aumentam candidaturas qualificadas.',
    body: [
      'Descrições vagas com quinze requisitos obrigatórios afastam bons profissionais — especialmente quem já está trabalhando e escolhe processos com cuidado.',
      'Separar o que é essencial do que é desejável, informar cidade/modelo de trabalho logo no topo e explicar como será o processo seletivo cria confiança imediata.',
      'Empresas que mantêm feedback ágil nas etapas iniciais recebem até 2x mais indicações orgânicas dentro da plataforma.',
    ],
  },
  {
    id: 'entrevista-tecnica',
    category: 'Carreira & Entrevistas',
    readTime: '4 min de leitura',
    title: 'Perguntas inteligentes para fazer ao final de uma entrevista de trabalho',
    summary:
      'Entrevistas são uma via de mão dupla: avalie liderança, rituais do time e expectativas reais da vaga.',
    body: [
      'Quando o entrevistador pergunta se você tem dúvidas, essa é a melhor janela para demonstrar preparo e avaliar se a empresa combina com o seu ritmo.',
      'Boas perguntas incluem: "Como o sucesso desta posição será medido nos primeiros três meses?" e "Qual foi o maior aprendizado do time no último projeto?".',
      'Leve suas anotações e use o histórico de etapas do BrotoRH para comparar propostas com tranquilidade.',
    ],
  },
]
