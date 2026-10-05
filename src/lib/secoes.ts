// Seções de cada painel, na ordem do menu. `fase` é a fase do projeto em que a seção é
// publicada; `pronta` diz se ela já tem página própria (as outras mostram "em construção").
export const secoes = [
  { slug: '', titulo: 'Visão geral', fase: 1, pronta: true },
  { slug: 'indicadores', titulo: 'Indicadores', fase: 2, pronta: true },
  { slug: 'promessas', titulo: 'Promessas', fase: 3, pronta: true },
  { slug: 'gastos', titulo: 'Gastos', fase: 4, pronta: true },
] as const;

export type Secao = (typeof secoes)[number];

/** "Fase 2" com espaço inseparável, para o número nunca ficar sozinho na linha seguinte. */
export const rotuloFase = (secao: Secao) => `Fase${String.fromCharCode(0xa0)}${secao.fase}`;
