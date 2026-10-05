/**
 * Congresso (painel Brasil): lê as listas de data/brasil/congresso/, resume a situação de cada
 * item com as regras de config/congresso.ts e monta a contagem e o quadro por ano.
 */
import type { z } from 'zod';
import {
  ABRANGENCIA_DO_CONGRESSO,
  RESULTADO_DA_DELIBERACAO,
  RESULTADO_DA_SITUACAO,
  type Resultado,
} from '../../config/congresso';
import {
  arquivoMedidasSchema,
  arquivoProjetosSchema,
  type MedidaProvisoria,
  type Ponto,
  type ProjetoDeLei,
} from './schemas';

const arquivos = import.meta.glob<unknown>('../../data/*/congresso/*.json', {
  eager: true,
  import: 'default',
});

function carregar<T>(nome: string, schema: z.ZodType<T>): T | null {
  const caminho = `../../data/${ABRANGENCIA_DO_CONGRESSO}/congresso/${nome}.json`;
  const bruto = arquivos[caminho];
  if (bruto === undefined) return null;
  const resultado = schema.safeParse(bruto);
  if (!resultado.success) throw new Error(`${caminho}: ${resultado.error.message}`);
  return resultado.data;
}

/** Medidas provisórias salvas. null = ainda não coletadas. */
export const carregarMedidas = () => carregar('medidas-provisorias', arquivoMedidasSchema);

/** Projetos do governo salvos. null = ainda não coletados. */
export const carregarProjetos = () => carregar('projetos-de-lei', arquivoProjetosSchema);

export const resultadoDaMedida = (medida: MedidaProvisoria): Resultado => {
  if (medida.deliberacao) return RESULTADO_DA_DELIBERACAO[medida.deliberacao] ?? 'Outra situação';
  return medida.tramitando ? 'Em tramitação' : 'Outra situação';
};

export const resultadoDoProjeto = (projeto: ProjetoDeLei): Resultado =>
  (projeto.codSituacao !== null && RESULTADO_DA_SITUACAO[projeto.codSituacao]) || 'Outra situação';

/** Ano do número oficial ("PL 1/2023" → 2023). Pode diferir do ano da apresentação. */
export const anoDoNumero = (item: { identificacao: string }) =>
  Number(item.identificacao.slice(-4));

/** Quantos itens há em cada ano. Ano sem itens conta zero; o ano corrente fica marcado. */
export const contagemPorAno = (
  itens: { identificacao: string }[],
  anos: number[],
  anoAtual: number,
): Ponto[] =>
  anos.map((ano) => ({
    periodo: String(ano),
    valor: itens.filter((item) => anoDoNumero(item) === ano).length,
    ...(ano === anoAtual ? { nota: 'parcial' } : {}),
  }));

export interface LinhaDoQuadro {
  ano: number;
  total: number;
  porResultado: Record<Resultado, number>;
}

/** Quadro "situação atual por ano": uma linha por ano, uma coluna por resultado. */
export function quadroPorAno<T extends { identificacao: string }>(
  itens: T[],
  resultadoDe: (item: T) => Resultado,
  anos: number[],
): LinhaDoQuadro[] {
  return anos.map((ano) => {
    const doAno = itens.filter((item) => anoDoNumero(item) === ano);
    const porResultado = {} as Record<Resultado, number>;
    for (const item of doAno) {
      const resultado = resultadoDe(item);
      porResultado[resultado] = (porResultado[resultado] ?? 0) + 1;
    }
    return { ano, total: doAno.length, porResultado };
  });
}

/** Itens apresentados a partir do início do mandato, do mais recente para o mais antigo. */
export const doMandato = <T extends { data: string; identificacao: string }>(
  itens: T[],
  inicio: string,
) =>
  itens
    .filter((item) => item.data >= inicio)
    .sort((a, b) => b.data.localeCompare(a.data) || b.identificacao.localeCompare(a.identificacao));
