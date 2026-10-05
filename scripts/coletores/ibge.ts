/**
 * IBGE, API de agregados v3. Pegadinhas verificadas na Fase 0 (ver tests/fixtures/ibge):
 * - período ainda não divulgado responde HTTP 200 com lista vazia;
 * - valores vêm como texto e podem ser símbolos ("-", "X", "..", "...") em vez de número;
 * - "202602" é fevereiro numa tabela mensal, mas o 2º trimestre numa tabela trimestral.
 */
import { z } from 'zod';
import type { Ponto } from '../../src/lib/schemas.ts';
import { buscarJson, ErroDeColeta } from '../http.ts';
import type { Contexto } from './comum.ts';

const respostaIbge = z
  .array(
    z.object({
      id: z.string(),
      resultados: z.array(
        z.object({
          series: z.array(z.object({ serie: z.record(z.string(), z.string()) })),
        }),
      ),
    }),
  )
  .min(1, 'resposta vazia');

export async function coletarIbge({ indicador, janela, deps }: Contexto): Promise<Ponto[]> {
  const { coleta, periodicidade } = indicador;
  if (coleta.tipo !== 'ibge') throw new Error(`coletor errado para ${indicador.id}`);
  const trimestral = periodicidade === 'trimestral';

  // Do primeiro período do histórico até um período bem no futuro: o IBGE devolve só o que já saiu.
  const inicio = `${janela.inicio.slice(0, 4)}01`;
  const fim = trimestral ? '209904' : '209912';
  const { tabela, variavel, localidade, classificacao } = coleta.fonte;
  const url =
    `https://servicodados.ibge.gov.br/api/v3/agregados/${tabela}/periodos/${inicio}-${fim}` +
    `/variaveis/${variavel}?localidades=${encodeURIComponent(localidade)}` +
    (classificacao ? `&classificacao=${encodeURIComponent(classificacao)}` : '');

  const dados = await buscarJson(url, respostaIbge, deps);
  const series = dados.flatMap((v) => v.resultados.flatMap((r) => r.series));
  const [unica, ...outras] = series;
  if (!unica || outras.length > 0) {
    throw new ErroDeColeta(`${url}: esperava 1 série, recebeu ${series.length}`, true);
  }

  return Object.entries(unica.serie)
    .map(([codigo, texto]) => {
      if (!/^-?\d+(\.\d+)?$/.test(texto)) {
        throw new ErroDeColeta(
          `${url}: valor "${texto}" no período ${codigo} não é número (símbolo do IBGE?)`,
          true,
        );
      }
      const periodo = trimestral
        ? `${codigo.slice(0, 4)}-T${Number(codigo.slice(4))}`
        : `${codigo.slice(0, 4)}-${codigo.slice(4)}`;
      return { periodo, valor: Number(texto) };
    })
    .sort((a, b) => a.periodo.localeCompare(b.periodo));
}
