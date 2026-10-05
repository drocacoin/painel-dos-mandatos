/**
 * Banco Central, API do SGS. Pegadinhas verificadas na Fase 0 (ver tests/fixtures/bcb):
 * - a série 432 (meta Selic) traz datas futuras, até a próxima reunião do Copom;
 * - a ordem dos dados muda de série para série;
 * - período sem dados responde HTTP 404; série diária aceita no máximo 10 anos por consulta.
 */
import { z } from 'zod';
import type { Ponto } from '../../src/lib/schemas.ts';
import { buscarJson } from '../http.ts';
import type { Contexto } from './comum.ts';

const respostaBcb = z
  .array(
    z.object({
      data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
      valor: z.string().regex(/^-?\d+(\.\d+)?$/, 'valor não numérico'),
    }),
  )
  .min(1, 'resposta vazia');

const paraBr = (iso: string) => iso.split('-').reverse().join('/');
const paraIso = (br: string) => br.split('/').reverse().join('-');

export async function coletarBcb({ indicador, janela, deps }: Contexto): Promise<Ponto[]> {
  const { coleta } = indicador;
  if (coleta.tipo !== 'bcb') throw new Error(`coletor errado para ${indicador.id}`);

  const url =
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${coleta.fonte.serie}/dados?formato=json` +
    `&dataInicial=${paraBr(janela.inicio)}&dataFinal=${paraBr(janela.hoje)}`;
  const dados = await buscarJson(url, respostaBcb, deps);

  const diarios = dados
    .map((d) => ({ data: paraIso(d.data), valor: Number(d.valor) }))
    .filter((d) => d.data <= janela.hoje) // descarta datas futuras
    .sort((a, b) => a.data.localeCompare(b.data));

  // Uma entrada por mês. Em 'fim-do-mes' (série diária), vale o último dia do mês
  // disponível; como a lista está em ordem, a última atribuição de cada mês é a que fica.
  const porMes = new Map<string, number>();
  for (const d of diarios) porMes.set(d.data.slice(0, 7), d.valor);

  return [...porMes].map(([periodo, valor]) => ({
    periodo,
    valor: coleta.inverterSinal && valor !== 0 ? -valor : valor,
  }));
}
