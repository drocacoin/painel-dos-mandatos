/**
 * Regras das promessas: status possíveis, temas e tipos de fonte.
 *
 * Temas = funções de governo da classificação oficial do orçamento (Portaria nº 42/1999,
 * anexo, versão consolidada publicada no SIOP; conferida em 05/10/2026). A mesma
 * classificação organiza os gastos públicos (Fase 4).
 */
export const FONTE_DOS_TEMAS = {
  nome: 'Portaria nº 42/1999, funções de governo (versão consolidada)',
  url: 'https://www1.siop.planejamento.gov.br/siopdoc/lib/exe/fetch.php/ploa:portaria42_consolidada.pdf',
};

export const TEMAS_PROMESSAS = [
  'Legislativa',
  'Judiciária',
  'Essencial à Justiça',
  'Administração',
  'Defesa Nacional',
  'Segurança Pública',
  'Relações Exteriores',
  'Assistência Social',
  'Previdência Social',
  'Saúde',
  'Trabalho',
  'Educação',
  'Cultura',
  'Direitos da Cidadania',
  'Urbanismo',
  'Habitação',
  'Saneamento',
  'Gestão Ambiental',
  'Ciência e Tecnologia',
  'Agricultura',
  'Organização Agrária',
  'Indústria',
  'Comércio e Serviços',
  'Comunicações',
  'Energia',
  'Transporte',
  'Desporto e Lazer',
  'Encargos Especiais',
] as const;

// Os 6 status definidos para o projeto, nesta ordem (placar e filtros seguem a ordem).
export const STATUS = [
  'nao-iniciada',
  'em-andamento',
  'cumprida-em-parte',
  'cumprida',
  'descumprida',
  'nao-avaliavel',
] as const;

export type Status = (typeof STATUS)[number];

export const ROTULO_DO_STATUS: Record<Status, string> = {
  'nao-iniciada': 'Não iniciada',
  'em-andamento': 'Em andamento',
  'cumprida-em-parte': 'Cumprida em parte',
  cumprida: 'Cumprida',
  descumprida: 'Descumprida',
  'nao-avaliavel': 'Não avaliável',
};

// Critérios de cada status (PROPOSTA: aguardando aprovação do responsável pelo projeto).
// Aparecem na página de promessas para quem lê saber como a classificação é feita.
export const CRITERIO_DO_STATUS: Record<Status, string> = {
  'nao-iniciada': 'Não há registro oficial de ação do governo voltada à promessa.',
  'em-andamento':
    'Há ato oficial publicado voltado à promessa (lei, decreto, edital, contrato ou despesa empenhada), e a entrega ainda não terminou.',
  'cumprida-em-parte':
    'Parte do que foi prometido foi entregue (por exemplo, parte da meta ou das regiões), e o prazo terminou ou a ação foi encerrada.',
  cumprida: 'O que foi prometido foi entregue, com comprovação em fonte oficial.',
  descumprida:
    'O prazo terminou sem a entrega, ou o governo comunicou oficialmente que não vai cumprir.',
  'nao-avaliavel':
    'A promessa não tem ação, meta ou prazo verificáveis, ou não há fonte oficial que permita avaliar.',
};

// Formas diferentes para cada status: a cor nunca é o único sinal (design system, seção 6).
export const ICONE_DO_STATUS: Record<Status, string> = {
  'nao-iniciada': '○',
  'em-andamento': '◔',
  'cumprida-em-parte': '◐',
  cumprida: '●',
  descumprida: '✕',
  'nao-avaliavel': '?',
};

export const TIPOS_DE_FONTE = [
  'plano de governo',
  'debate',
  'entrevista',
  'discurso',
  'propaganda eleitoral',
  'outro',
] as const;
