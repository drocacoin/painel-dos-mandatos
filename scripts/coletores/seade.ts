/**
 * Fundação Seade (SP): CSVs anuais. A linha do estado inteiro tem código 35 na coluna de
 * filtro. Ano sem valor (ex.: taxa ainda sem população estimada) fica de fora, nunca vira zero.
 */
import type { Ponto } from '../../src/lib/schemas.ts';
import { buscarTexto, ErroDeColeta } from '../http.ts';
import { lerCsv, numeroBr, type Contexto } from './comum.ts';

export async function coletarSeade({ indicador, janela, deps }: Contexto): Promise<Ponto[]> {
  const { coleta } = indicador;
  if (coleta.tipo !== 'seade') throw new Error(`coletor errado para ${indicador.id}`);
  const { url } = coleta.fonte;

  const linhas = lerCsv(await buscarTexto(url, 'csv', {}, deps));
  const [primeira] = linhas;
  for (const coluna of ['ano', coleta.colunaFiltro, coleta.colunaValor]) {
    if (!primeira || !(coluna in primeira)) {
      throw new ErroDeColeta(`${url}: coluna "${coluna}" não encontrada`, true);
    }
  }

  const anoInicial = Number(janela.inicio.slice(0, 4));
  const porAno = new Map<string, number>();
  for (const linha of linhas) {
    const ano = linha.ano ?? '';
    if (linha[coleta.colunaFiltro] !== '35' || Number(ano) < anoInicial) continue;
    const valor = numeroBr(linha[coleta.colunaValor] ?? '');
    if (valor === null) continue;
    if (porAno.has(ano)) throw new ErroDeColeta(`${url}: ano ${ano} repetido`, true);
    porAno.set(ano, valor);
  }

  if (porAno.size === 0) throw new ErroDeColeta(`${url}: nenhum valor para o estado`, true);
  return [...porAno]
    .map(([periodo, valor]) => ({ periodo, valor }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));
}
