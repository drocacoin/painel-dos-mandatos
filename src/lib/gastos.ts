/**
 * Gastos por função de cada painel: lê data/<abrangencia>/gastos/por-funcao.json, corrige
 * pela inflação e monta séries anuais no formato dos indicadores, para usar os mesmos
 * cartões, gráficos e tabelas.
 *
 * Correção: valor × (IPCA do mês de referência ÷ IPCA médio dos meses do período). O mês de
 * referência é o último IPCA publicado. Ano sem IPCA para todos os meses fica de fora.
 */
import { FONTE_DOS_GASTOS } from '../../config/gastos';
import { indicadores } from '../../config/indicadores';
import { carregarArquivo, type Exibivel } from './indicadores';
import { MESES_ATE_O_BIMESTRE, rotuloPeriodo } from './periodos';
import {
  arquivoGastosSchema,
  type ArquivoGastos,
  type ArquivoIndicador,
  type Ponto,
} from './schemas';

const arquivos = import.meta.glob<unknown>('../../data/*/gastos/por-funcao.json', {
  eager: true,
  import: 'default',
});

/** Lê e valida os gastos de um painel. null = ainda não coletados. */
export function carregarGastos(abrangencia: string): ArquivoGastos | null {
  const caminho = `../../data/${abrangencia}/gastos/por-funcao.json`;
  const bruto = arquivos[caminho];
  if (bruto === undefined) return null;
  const resultado = arquivoGastosSchema.safeParse(bruto);
  if (!resultado.success) throw new Error(`${caminho}: ${resultado.error.message}`);
  return resultado.data;
}

/** Média do índice nos meses 1 a `meses` do ano. null se faltar algum mês. */
export function indiceMedio(indice: Ponto[], ano: number, meses: number): number | null {
  let soma = 0;
  for (let mes = 1; mes <= meses; mes++) {
    const ponto = indice.find((p) => p.periodo === `${ano}-${String(mes).padStart(2, '0')}`);
    if (!ponto) return null;
    soma += ponto.valor;
  }
  return soma / meses;
}

/** "Saúde" → "saude"; "Segurança Pública" → "seguranca-publica". */
const ancora = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

export interface SerieDeGasto {
  exibivel: Exibivel;
  serie: Ponto[];
}

export interface GastosDoPainel {
  /** O mais recente entre a coleta dos gastos e a do IPCA: os dois mudam o valor exibido. */
  atualizadoEm: string;
  /** Mês do IPCA usado como base, ex.: "ago/2026". */
  referencia: string;
  total: SerieDeGasto;
  /** Todas as funções com gasto, da maior para a menor no último ano completo. */
  funcoes: SerieDeGasto[];
  /** Anos que ficaram de fora por falta de IPCA para todos os meses. */
  anosSemCorrecao: number[];
}

/** Junta gastos e IPCA. Separado da leitura dos arquivos para poder ser testado. */
export function montarGastos(gastos: ArquivoGastos, ipca: ArquivoIndicador): GastosDoPainel | null {
  const base = ipca.serie.at(-1);
  if (!base) return null;
  const referencia = rotuloPeriodo(base.periodo, 'mensal');

  const exibivel = (id: string, titulo: string, descricao: string): Exibivel => ({
    id,
    titulo,
    descricao,
    unidade: 'R$',
    casas: 0,
    periodicidade: 'anual',
    variacao: 'percentual',
    fonte: FONTE_DOS_GASTOS,
  });

  const total: Ponto[] = [];
  const porFuncao = new Map<string, Ponto[]>();
  const anosSemCorrecao: number[] = [];
  for (const { ano, bimestre, total: valorTotal, funcoes } of gastos.anos) {
    const media = indiceMedio(ipca.serie, ano, bimestre * 2);
    if (media === null) {
      anosSemCorrecao.push(ano);
      continue;
    }
    const fator = base.valor / media;
    const nota = MESES_ATE_O_BIMESTRE[bimestre - 1];
    const ponto = (valor: number): Ponto => ({
      periodo: String(ano),
      valor: valor * fator,
      ...(nota ? { nota } : {}),
    });
    total.push(ponto(valorTotal));
    for (const { funcao, liquidado } of funcoes) {
      porFuncao.set(funcao, [...(porFuncao.get(funcao) ?? []), ponto(liquidado)]);
    }
  }

  const ultimoCompleto = (serie: Ponto[]) => serie.filter((p) => !p.nota).at(-1)?.valor ?? 0;
  const funcoes = [...porFuncao]
    .map(([funcao, serie]) => ({
      exibivel: exibivel(
        `gasto-${ancora(funcao)}`,
        funcao,
        `Despesa liquidada na função ${funcao}, em reais de ${referencia}.`,
      ),
      serie,
    }))
    .sort((a, b) => ultimoCompleto(b.serie) - ultimoCompleto(a.serie));

  const maisRecente = [gastos.atualizadoEm, ipca.atualizadoEm].sort(
    (a, b) => Date.parse(b) - Date.parse(a),
  )[0];
  return {
    atualizadoEm: maisRecente ?? gastos.atualizadoEm,
    referencia,
    total: {
      exibivel: exibivel(
        'gasto-total',
        'Todas as funções',
        `Despesa liquidada em todas as funções somadas, em reais de ${referencia}.`,
      ),
      serie: total,
    },
    funcoes,
    anosSemCorrecao,
  };
}

/** Gastos de um painel, prontos para a página. null = ainda não coletados. */
export function gastosDoPainel(abrangencia: string): GastosDoPainel | null {
  const gastos = carregarGastos(abrangencia);
  const indiceIpca = indicadores.find((i) => i.id === 'ipca-indice');
  const ipca = indiceIpca ? carregarArquivo(indiceIpca) : null;
  return gastos && ipca ? montarGastos(gastos, ipca) : null;
}
