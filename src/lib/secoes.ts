// Seções de cada painel, na ordem do menu. `fase` é a fase do projeto em que a seção é
// publicada; `pronta` diz se ela já tem página própria (as outras mostram "em construção").
export interface Secao {
  slug: string;
  titulo: string;
  fase: number;
  pronta: boolean;
  /** Painéis que têm a seção. Sem a lista, todos têm. */
  abrangencias?: string[];
}

export const secoes: Secao[] = [
  { slug: '', titulo: 'Visão geral', fase: 1, pronta: true },
  { slug: 'indicadores', titulo: 'Indicadores', fase: 2, pronta: true },
  { slug: 'promessas', titulo: 'Promessas', fase: 3, pronta: true },
  { slug: 'gastos', titulo: 'Gastos', fase: 4, pronta: true },
  { slug: 'congresso', titulo: 'Congresso', fase: 5, pronta: true, abrangencias: ['brasil'] },
];

/** Seções de um painel, na ordem do menu. */
export const secoesDoPainel = (abrangencia: string) =>
  secoes.filter((secao) => !secao.abrangencias || secao.abrangencias.includes(abrangencia));

/** "Fase 2" com espaço inseparável, para o número nunca ficar sozinho na linha seguinte. */
export const rotuloFase = (secao: Secao) => `Fase${String.fromCharCode(0xa0)}${secao.fase}`;
