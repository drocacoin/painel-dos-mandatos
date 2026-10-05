// Seções de cada painel, na ordem do menu. `fase` é a fase do projeto em que a seção é publicada.
export const secoes = [
  { slug: '', titulo: 'Visão geral', fase: 1 },
  { slug: 'indicadores', titulo: 'Indicadores', fase: 2 },
  { slug: 'promessas', titulo: 'Promessas', fase: 3 },
  { slug: 'gastos', titulo: 'Gastos', fase: 4 },
] as const;

export type Secao = (typeof secoes)[number];

/** "Fase 2" com espaço inseparável, para o número nunca ficar sozinho na linha seguinte. */
export const rotuloFase = (secao: Secao) => `Fase\u00A0${secao.fase}`;
