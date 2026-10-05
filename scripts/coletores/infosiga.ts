/**
 * Detran-SP, Infosiga: um CSV por mês com as pessoas envolvidas em sinistros de trânsito
 * (cerca de 4 MB cada, Windows-1252). Mortes = pessoas com gravidade_lesao "FATAL".
 * Indicador: soma das mortes nos 12 meses terminados em cada mês.
 *
 * Só baixa quando sai um mês novo: aí recalcula tudo, porque o Detran regera os arquivos
 * antigos (todos tinham a mesma data de modificação na verificação).
 */
import { z } from 'zod';
import type { Ponto } from '../../src/lib/schemas.ts';
import { buscarJson, buscarTexto, ErroDeColeta } from '../http.ts';
import { lerCsv, somarMeses, type Contexto } from './comum.ts';

const catalogo = z.object({
  result: z.object({ resources: z.array(z.object({ url: z.string() })) }),
});

export async function coletarInfosiga({
  indicador,
  janela,
  anterior,
  deps,
}: Contexto): Promise<Ponto[]> {
  const { coleta } = indicador;
  if (coleta.tipo !== 'infosiga') throw new Error(`coletor errado para ${indicador.id}`);

  // Os links do catálogo têm assinatura com validade: por isso são lidos a cada coleta.
  const { result } = await buscarJson(coleta.fonte.url, catalogo, deps);
  const arquivos = new Map<string, string>(); // "AAAA-MM" → link
  for (const { url } of result.resources) {
    const [, mes, ano] = url.match(/pessoas_(\d{2})-(\d{4})\.csv/) ?? [];
    if (mes && ano) arquivos.set(`${ano}-${mes}`, url);
  }
  const ultimoMes = [...arquivos.keys()].sort().at(-1);
  if (!ultimoMes)
    throw new ErroDeColeta(`${coleta.fonte.url}: catálogo sem arquivos mensais`, true);

  // Nenhum mês novo publicado: mantém a série salva e não baixa nada.
  if (anterior?.at(-1)?.periodo === ultimoMes) return anterior;

  const primeiroMes = janela.inicio.slice(0, 7);
  const mortesPorMes = new Map<string, number>();
  for (let mes = somarMeses(primeiroMes, -11); mes <= ultimoMes; mes = somarMeses(mes, 1)) {
    const url = arquivos.get(mes);
    if (!url) throw new ErroDeColeta(`Infosiga: falta o arquivo de ${mes} no catálogo`, true);
    const linhas = lerCsv(await buscarTexto(url, 'csv', { codificacao: 'windows-1252' }, deps));
    if (linhas[0] && !('gravidade_lesao' in linhas[0])) {
      throw new ErroDeColeta(`Infosiga ${mes}: coluna gravidade_lesao não encontrada`, true);
    }
    mortesPorMes.set(mes, linhas.filter((l) => l.gravidade_lesao === 'FATAL').length);
  }

  const pontos: Ponto[] = [];
  for (let mes = primeiroMes; mes <= ultimoMes; mes = somarMeses(mes, 1)) {
    let soma = 0;
    for (let k = 0; k < 12; k++) {
      const mortes = mortesPorMes.get(somarMeses(mes, -k));
      if (mortes === undefined) throw new ErroDeColeta(`Infosiga: faltou contar ${mes}`, true);
      soma += mortes;
    }
    pontos.push({ periodo: mes, valor: soma });
  }
  const ultimo = pontos.at(-1);
  if (ultimo) ultimo.nota = 'preliminar';
  return pontos;
}
