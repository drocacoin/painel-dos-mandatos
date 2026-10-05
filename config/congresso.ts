/**
 * Congresso, só no painel Brasil (Fase 5, decisão de 05/10/2026): medidas provisórias editadas
 * pela Presidência da República e projetos (PL, PLP e PEC) enviados pelo Poder Executivo à
 * Câmara dos Deputados. Os endereços verificados ficam em config/fontes.ts (regra 2).
 */
export const ABRANGENCIA_DO_CONGRESSO = 'brasil';

export const FONTE_DAS_MEDIDAS = {
  nome: 'Senado Federal, Dados Abertos (processos legislativos)',
  url: 'https://legis.senado.leg.br/dadosabertos/',
};

export const FONTE_DOS_PROJETOS = {
  nome: 'Câmara dos Deputados, Dados Abertos (proposições)',
  url: 'https://dadosabertos.camara.leg.br/',
};

export const FONTE_DO_PRAZO_DAS_MEDIDAS = {
  nome: 'Constituição Federal, art. 62',
  url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
};

// PL = projeto de lei; PLP = projeto de lei complementar; PEC = proposta de emenda à Constituição.
export const TIPOS_DE_PROJETO = ['PL', 'PLP', 'PEC'] as const;

/** Situação resumida, usada nos quadros por ano. A página também mostra o texto oficial. */
export type Resultado =
  | 'Virou lei'
  | 'Perdeu a eficácia'
  | 'Revogada'
  | 'Arquivado ou retirado'
  | 'Em tramitação'
  | 'Outra situação';

export const RESULTADOS_DAS_MEDIDAS: Resultado[] = [
  'Virou lei',
  'Perdeu a eficácia',
  'Revogada',
  'Em tramitação',
  'Outra situação',
];

export const RESULTADOS_DOS_PROJETOS: Resultado[] = [
  'Virou lei',
  'Arquivado ou retirado',
  'Em tramitação',
  'Outra situação',
];

// Medidas provisórias: campo siglaTipoDeliberacao do Senado. Valores vistos nas MPs de 2023 a
// 2026 (verificado em 05/10/2026). Sem deliberação e ainda tramitando = "Em tramitação".
export const RESULTADO_DA_DELIBERACAO: Record<string, Resultado> = {
  APROVADO_NA_INTEGRA: 'Virou lei',
  APROVADO_PLV: 'Virou lei', // aprovada com mudanças (projeto de lei de conversão)
  PERDA_EFICACIA: 'Perdeu a eficácia',
  REVOGADO: 'Revogada',
};

// Projetos: código da situação na Câmara. Valores vistos nos projetos do Executivo de 2023 a
// 2026 (verificado em 05/10/2026). Código fora da lista entra em "Outra situação".
export const RESULTADO_DA_SITUACAO: Record<number, Resultado> = {
  1140: 'Virou lei', // Transformado em Norma Jurídica
  923: 'Arquivado ou retirado', // Arquivada
  950: 'Arquivado ou retirado', // Retirado pelo(a) Autor(a)
  907: 'Em tramitação', // Aguardando Designação de Relator(a)
  910: 'Em tramitação', // Aguardando Encaminhamento
  915: 'Em tramitação', // Aguardando Parecer
  924: 'Em tramitação', // Pronta para Pauta
  925: 'Em tramitação', // Tramitando em Conjunto
  926: 'Em tramitação', // Aguardando Apreciação pelo Senado Federal
  1200: 'Em tramitação', // Aguardando Autorização do Despacho
  1201: 'Em tramitação', // Aguardando Despacho do Presidente da Câmara dos Deputados (Chancela)
};
