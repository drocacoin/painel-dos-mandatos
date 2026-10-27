/**
 * Resumos usados na página inicial e na visão geral de cada painel: prazos das promessas e as
 * atualizações mais recentes dos dados. O momento do mandato fica em ./tempo.ts.
 */
import { ABRANGENCIA_DO_CONGRESSO } from '../../config/congresso';
import { indicadores } from '../../config/indicadores';
import { carregarMedidas, carregarProjetos } from './congresso';
import { carregarGastos } from './gastos';
import { carregarArquivo, rotuloComNota } from './indicadores';
import { MESES_ATE_O_BIMESTRE } from './periodos';
import type { Promessa } from './promessas';

export interface PrazoNaRegua {
  data: string;
  quantidade: number;
}

/**
 * Prazos das promessas agrupados por data, em ordem. Promessa sem prazo no texto conta no
 * fim do mandato (critério aprovado em 05/10/2026).
 */
export function prazosDasPromessas(promessas: Promessa[], fim: string): PrazoNaRegua[] {
  const porData = new Map<string, number>();
  for (const promessa of promessas) {
    const data = promessa.prazo ?? fim;
    porData.set(data, (porData.get(data) ?? 0) + 1);
  }
  return [...porData]
    .map(([data, quantidade]) => ({ data, quantidade }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

/** As próximas promessas a vencer a partir de hoje (só as que têm prazo no texto). */
export const proximosPrazos = (promessas: Promessa[], hoje: string, quantidade = 3) =>
  promessas
    .filter((p): p is Promessa & { prazo: string } => p.prazo !== null && p.prazo >= hoje)
    .sort((a, b) => a.prazo.localeCompare(b.prazo) || a.id.localeCompare(b.id))
    .slice(0, quantidade);

export interface Atualizacao {
  titulo: string;
  referencia: string;
  atualizadoEm: string;
  /** Caminho dentro do painel, ex.: "indicadores/#selic". */
  caminho: string;
}

/** Os dados do painel que mudaram por último, do mais recente para o mais antigo. */
export function ultimasAtualizacoes(abrangencia: string, quantidade = 5): Atualizacao[] {
  const lista: Atualizacao[] = [];
  for (const indicador of indicadores) {
    if (indicador.abrangencia !== abrangencia || indicador.apoio) continue;
    const arquivo = carregarArquivo(indicador);
    const ultimo = arquivo?.serie.at(-1);
    if (!arquivo || !ultimo) continue;
    lista.push({
      titulo: indicador.titulo,
      referencia: rotuloComNota(ultimo, indicador, 'longo'),
      atualizadoEm: arquivo.atualizadoEm,
      caminho: `indicadores/#${indicador.id}`,
    });
  }
  const gastos = carregarGastos(abrangencia);
  const ano = gastos?.anos.at(-1);
  if (gastos && ano) {
    const meses = MESES_ATE_O_BIMESTRE[ano.bimestre - 1];
    lista.push({
      titulo: 'Gastos por área',
      referencia: meses ? `${ano.ano} (${meses})` : String(ano.ano),
      atualizadoEm: gastos.atualizadoEm,
      caminho: 'gastos/',
    });
  }
  if (abrangencia === ABRANGENCIA_DO_CONGRESSO) {
    for (const [titulo, arquivo] of [
      ['Medidas provisórias', carregarMedidas()],
      ['Projetos do governo', carregarProjetos()],
    ] as const) {
      const ultima = arquivo?.itens.at(-1);
      if (!arquivo || !ultima) continue;
      lista.push({
        titulo,
        referencia: `até ${ultima.identificacao}`,
        atualizadoEm: arquivo.atualizadoEm,
        caminho: 'congresso/',
      });
    }
  }
  return lista
    .sort((a, b) => Date.parse(b.atualizadoEm) - Date.parse(a.atualizadoEm))
    .slice(0, quantidade);
}
