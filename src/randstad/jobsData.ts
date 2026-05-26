export type JobContract = 'Tempo inteiro' | 'Part-time' | 'Temporário' | 'Freelance' | 'Estágio';
export type JobWorkMode = 'Presencial' | 'Remoto' | 'Híbrido';

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  province: string;
  city: string;
  area: string;
  contract: JobContract;
  workMode: JobWorkMode;
  salaryMin: number;
  salaryMax: number;
  currency: 'MT';
  postedAt: string;
  urgent: boolean;
  description: string;
  requirements: string[];
  benefits: string[];
  skills: string[];
}

export const jobAreas = [
  'Todas',
  'Tecnologia',
  'Atendimento',
  'Administração',
  'Vendas',
  'Logística',
  'Construção',
  'Saúde',
  'Educação',
  'Hotelaria',
] as const;

export const mozambiqueProvinces = [
  'Todas',
  'Maputo Cidade',
  'Maputo Província',
  'Gaza',
  'Inhambane',
  'Sofala',
  'Manica',
  'Tete',
  'Zambézia',
  'Nampula',
  'Cabo Delgado',
  'Niassa',
] as const;

export const mockJobs: JobPosting[] = [
  {
    id: 'job-001',
    title: 'Técnico de Suporte Informático',
    company: 'Netek Services Partner',
    province: 'Maputo Cidade',
    city: 'Maputo',
    area: 'Tecnologia',
    contract: 'Tempo inteiro',
    workMode: 'Presencial',
    salaryMin: 18000,
    salaryMax: 28000,
    currency: 'MT',
    postedAt: 'Hoje',
    urgent: true,
    description: 'Prestar suporte técnico a utilizadores, configurar redes, instalar software e resolver incidentes em computadores e impressoras.',
    requirements: ['12.ª classe ou curso técnico', 'Conhecimentos de Windows e redes', 'Boa comunicação', 'Disponibilidade imediata'],
    benefits: ['Formação contínua', 'Subsídio de transporte', 'Possibilidade de progressão'],
    skills: ['Windows', 'Redes', 'Suporte', 'Hardware'],
  },
  {
    id: 'job-002',
    title: 'Assistente de Atendimento ao Cliente',
    company: 'Call Center Maputo',
    province: 'Maputo Província',
    city: 'Matola',
    area: 'Atendimento',
    contract: 'Tempo inteiro',
    workMode: 'Presencial',
    salaryMin: 12000,
    salaryMax: 18000,
    currency: 'MT',
    postedAt: 'Ontem',
    urgent: false,
    description: 'Atender clientes por telefone e WhatsApp, registar reclamações e encaminhar pedidos para as equipas responsáveis.',
    requirements: ['Português fluente', 'Experiência com atendimento', 'Conhecimentos básicos de computador'],
    benefits: ['Bónus por desempenho', 'Horários por turnos', 'Contrato renovável'],
    skills: ['Atendimento', 'WhatsApp Business', 'CRM'],
  },
  {
    id: 'job-003',
    title: 'Programador Front-end React',
    company: 'Startup Digital MZ',
    province: 'Maputo Cidade',
    city: 'Remoto',
    area: 'Tecnologia',
    contract: 'Freelance',
    workMode: 'Remoto',
    salaryMin: 45000,
    salaryMax: 90000,
    currency: 'MT',
    postedAt: '2 dias',
    urgent: true,
    description: 'Desenvolver interfaces React responsivas, integrar APIs e colaborar com equipa de produto em ciclos rápidos.',
    requirements: ['React e TypeScript', 'Tailwind CSS', 'Git/GitHub', 'Portfólio obrigatório'],
    benefits: ['Trabalho remoto', 'Pagamento por milestones', 'Projetos internacionais'],
    skills: ['React', 'TypeScript', 'Tailwind', 'APIs'],
  },
  {
    id: 'job-004',
    title: 'Gestor de Redes Sociais',
    company: 'Agência Criativa Beira',
    province: 'Sofala',
    city: 'Beira',
    area: 'Vendas',
    contract: 'Part-time',
    workMode: 'Híbrido',
    salaryMin: 10000,
    salaryMax: 20000,
    currency: 'MT',
    postedAt: '3 dias',
    urgent: false,
    description: 'Criar calendário editorial, responder mensagens, produzir conteúdos para Facebook, Instagram e TikTok.',
    requirements: ['Experiência com redes sociais', 'Noções de Canva', 'Boa escrita', 'Criatividade'],
    benefits: ['Horário flexível', 'Bónus por campanhas', 'Ambiente criativo'],
    skills: ['Canva', 'Meta Business', 'TikTok', 'Copywriting'],
  },
  {
    id: 'job-005',
    title: 'Auxiliar Administrativo',
    company: 'Empresa Comercial Nampula',
    province: 'Nampula',
    city: 'Nampula',
    area: 'Administração',
    contract: 'Tempo inteiro',
    workMode: 'Presencial',
    salaryMin: 14000,
    salaryMax: 22000,
    currency: 'MT',
    postedAt: '4 dias',
    urgent: false,
    description: 'Apoiar na organização de documentos, faturação, atendimento e gestão de agenda administrativa.',
    requirements: ['Excel básico', 'Organização', 'Disponibilidade presencial'],
    benefits: ['Contrato anual', 'Subsídio de alimentação', 'Formação'],
    skills: ['Excel', 'Arquivo', 'Faturação'],
  },
  {
    id: 'job-006',
    title: 'Técnico de Obra / Fiscal',
    company: 'Construções Sul',
    province: 'Gaza',
    city: 'Xai-Xai',
    area: 'Construção',
    contract: 'Temporário',
    workMode: 'Presencial',
    salaryMin: 25000,
    salaryMax: 40000,
    currency: 'MT',
    postedAt: '1 semana',
    urgent: true,
    description: 'Acompanhar obras, controlar materiais, reportar progresso e garantir cumprimento de normas de segurança.',
    requirements: ['Experiência em obra', 'Leitura de plantas', 'Carta de condução é vantagem'],
    benefits: ['Alojamento em obra', 'Transporte', 'Prémio por conclusão'],
    skills: ['Obra', 'Medições', 'Segurança'],
  },
];
