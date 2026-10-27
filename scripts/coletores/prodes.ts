/**
 * INPE, PRODES: taxa anual de desmatamento da Amazônia Legal, lida dos mesmos arquivos JSON que
 * o painel TerraBrasilis usa (verificados em 26/10/2026, amostras em tests/fixtures/inpe).
 * - O ano PRODES vai de agosto a julho: "2026" = 01/08/2025 a 31/07/2026 (campo endDate).
 * - Cada período traz a área por estado (km², type 1); o total é a soma, como no painel.
 * - A taxa nova sai como estimativa (out./dez.) e é consolidada no ano seguinte: o período
 *   do mesmo ano da última atualização leva a nota "estimativa".
 */
import { z } from 'zod';
import type { Ponto } from '../../src/lib/schemas.ts';
import { buscarJson, ErroDeColeta } from '../http.ts';
import type { Contexto } from './comum.ts';

const data = z.object({ year: z.number().int(), month: z.number().int(), day: z.number().int() });
const respostaTaxas = z.object({
  periods: z
    .array(
      z.object({
        startDate: data,
        endDate: data,
        features: z
          .array(
            z.object({
              areas: z.array(z.object({ type: z.number(), area: z.number().nonnegative() })),
            }),
          )
          .min(1, 'período sem estados'),
      }),
    )
    .min(1, 'resposta sem períodos'),
});
const respostaAtualizacao = z.object({ last_date: z.iso.date() });

export async function coletarProdes({ indicador, janela, deps }: Contexto): Promise<Ponto[]> {
  const { coleta } = indicador;
  if (coleta.tipo !== 'prodes') throw new Error(`coletor errado para ${indicador.id}`);

  const { periods } = await buscarJson(coleta.fonte.url, respostaTaxas, deps);
  const { last_date } = await buscarJson(coleta.fonte.atualizacao, respostaAtualizacao, deps);
  const anoDaAtualizacao = Number(last_date.slice(0, 4));
  const anoInicial = Number(janela.inicio.slice(0, 4));

  const pontos: Ponto[] = [];
  for (const p of periods) {
    const ano = p.endDate.year;
    if (p.startDate.year !== ano - 1 || p.startDate.month !== 8 || p.endDate.month !== 7) {
      throw new ErroDeColeta(`${coleta.fonte.url}: período ${ano} fora de agosto a julho`, true);
    }
    if (ano < anoInicial) continue;
    const areas = p.features.flatMap((f) => f.areas).filter((a) => a.type === 1);
    if (areas.length === 0) throw new ErroDeColeta(`${coleta.fonte.url}: ${ano} sem área`, true);
    const valor = Math.round(areas.reduce((soma, a) => soma + a.area, 0) * 100) / 100;
    pontos.push({
      periodo: String(ano),
      valor,
      ...(ano === anoDaAtualizacao ? { nota: 'estimativa' } : {}),
    });
  }
  if (pontos.length === 0)
    throw new ErroDeColeta(`${coleta.fonte.url}: nenhum ano na janela`, true);
  return pontos.sort((a, b) => a.periodo.localeCompare(b.periodo));
}
