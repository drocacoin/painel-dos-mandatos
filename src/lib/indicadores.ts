/**
 * Junta a descrição de cada indicador (config/indicadores.ts) com os dados coletados
 * (data/<abrangencia>/indicadores/<id>.json) e calcula a comparação com o início do mandato.
 * Arquivo de dados inválido faz o build falhar: o CI não deixa publicar dado quebrado.
 */
import { indicadores, type Indicador, type Tema } from '../../config/indicadores';
import { formatarValor, formatarVariacao } from './formatar';
import { fimDoPeriodo, periodoValido, rotuloPeriodo } from './periodos';
import { arquivoIndicadorSchema, type ArquivoIndicador, type Mandato, type Ponto } from './schemas';

const arquivos = import.meta.glob<unknown>('../../data/*/indicadores/*.json', {
  eager: true,
  import: 'default',
});

export const TEMAS: Tema[] = [
  'Economia',
  'Contas públicas',
  'Segurança',
  'Saúde',
  'Educação',
  'Transporte',
];

/** Âncora de cada tema na página (#contas-publicas). */
export const ANCORA_DO_TEMA: Record<Tema, string> = {
  Economia: 'economia',
  'Contas públicas': 'contas-publicas',
  Segurança: 'seguranca',
  Saúde: 'saude',
  Educação: 'educacao',
  Transporte: 'transporte',
};

/** Lê e valida o arquivo de dados do indicador. null = ainda não coletado. */
export function carregarArquivo(indicador: Indicador): ArquivoIndicador | null {
  const caminho = `../../data/${indicador.abrangencia}/indicadores/${indicador.id}.json`;
  const bruto = arquivos[caminho];
  if (bruto === undefined) return null;
  const resultado = arquivoIndicadorSchema.safeParse(bruto);
  if (!resultado.success) throw new Error(`${caminho}: ${resultado.error.message}`);
  resultado.data.serie.forEach((ponto, i, serie) => {
    if (!periodoValido(ponto.periodo, indicador.periodicidade)) {
      throw new Error(`${caminho}: período "${ponto.periodo}" fora do formato`);
    }
    const anterior = serie[i - 1];
    if (anterior && anterior.periodo >= ponto.periodo) {
      throw new Error(`${caminho}: períodos fora de ordem em ${ponto.periodo}`);
    }
  });
  return resultado.data;
}

export interface Comparacao {
  /** Último ponto cujo período terminou antes do início do mandato. */
  referencia: Ponto | null;
  /** Último ponto do mandato, quando já existe. Pontos com nota (parciais) não contam. */
  atual: Ponto | null;
}

export function compararComInicio(
  serie: Ponto[],
  indicador: Indicador,
  inicioMandato: string,
): Comparacao {
  const completos = serie.filter((p) => !p.nota);
  const antesDoMandato = completos.filter(
    (p) => fimDoPeriodo(p.periodo, indicador.periodicidade) < inicioMandato,
  );
  const referencia = antesDoMandato.at(-1) ?? null;
  const ultimo = completos.at(-1) ?? null;
  const atual = ultimo && referencia && ultimo !== referencia ? ultimo : null;
  return { referencia, atual };
}

/** Texto da variação entre a referência e o ponto atual, ou null se ainda não há o que comparar. */
export function textoDaVariacao(indicador: Indicador, comparacao: Comparacao): string | null {
  const { referencia, atual } = comparacao;
  if (!referencia || !atual) return null;
  let variacao = atual.valor - referencia.valor;
  if (indicador.variacao === 'percentual') {
    if (referencia.valor === 0) return null;
    variacao = (atual.valor / referencia.valor - 1) * 100;
  }
  const { unidade, casas, periodicidade } = indicador;
  const de = `${formatarValor(referencia.valor, unidade, casas)} em ${rotuloPeriodo(referencia.periodo, periodicidade)}`;
  const para = `${formatarValor(atual.valor, unidade, casas)} em ${rotuloPeriodo(atual.periodo, periodicidade)}`;
  return `${formatarVariacao(variacao, indicador.variacao, unidade, casas)} desde o início do mandato (de ${de} para ${para})`;
}

/** Rótulo do período com a nota, se houver: "2026 (jan-ago)". */
export const rotuloComNota = (ponto: Ponto, indicador: Indicador, formato: 'longo' | 'curto') =>
  `${rotuloPeriodo(ponto.periodo, indicador.periodicidade, formato)}${ponto.nota ? ` (${ponto.nota})` : ''}`;

export interface ItemDoPainel {
  indicador: Indicador;
  arquivo: ArquivoIndicador | null;
}

/** Indicadores de um painel, agrupados por tema na ordem fixa de TEMAS. */
export function indicadoresDoPainel(mandato: Mandato) {
  const doPainel = indicadores
    .filter((i) => i.abrangencia === mandato.abrangencia)
    .map((indicador): ItemDoPainel => ({ indicador, arquivo: carregarArquivo(indicador) }));
  return TEMAS.map((tema) => ({
    tema,
    itens: doPainel.filter((item) => item.indicador.tema === tema),
  })).filter((grupo) => grupo.itens.length > 0);
}
