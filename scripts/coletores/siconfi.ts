/**
 * Tesouro Nacional, API do SICONFI (relatórios fiscais RREO e RGF dos entes).
 * Verificado na Fase 0: período ainda não publicado responde 200 com lista vazia, e os nomes
 * das linhas ("contas") são os mesmos de 2023 a 2026. Valores em reais, como número.
 */
import { z } from 'zod';
import type { Ponto } from '../../src/lib/schemas.ts';
import { buscarJson, ErroDeColeta, type Dependencias } from '../http.ts';
import type { Contexto } from './comum.ts';

const BASE = 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt';

const respostaSiconfi = z.object({
  items: z.array(z.object({ conta: z.string(), coluna: z.string(), valor: z.number().nullable() })),
  hasMore: z.boolean(),
});

type Item = z.infer<typeof respostaSiconfi>['items'][number];

// Meses cobertos pelo RREO até cada bimestre. O 6º é o ano completo (sem nota).
const MESES_ATE_O_BIMESTRE = ['jan-fev', 'jan-abr', 'jan-jun', 'jan-ago', 'jan-out'];

async function buscarItens(url: string, deps?: Dependencias): Promise<Item[]> {
  const resposta = await buscarJson(url, respostaSiconfi, deps);
  if (resposta.hasMore) throw new ErroDeColeta(`${url}: resposta paginada não esperada`, true);
  return resposta.items;
}

/** Linha única cuja conta começa com `conta` e cuja coluna é `coluna`. */
function valorDe(itens: Item[], conta: string, coluna: string | RegExp, url: string): number {
  const achados = itens.filter(
    (i) =>
      i.conta.startsWith(conta) &&
      (typeof coluna === 'string' ? i.coluna === coluna : coluna.test(i.coluna)),
  );
  const [unico, ...outros] = achados;
  if (!unico || outros.length > 0 || unico.valor === null) {
    throw new ErroDeColeta(
      `${url}: esperava 1 valor para "${conta}", achei ${achados.length}`,
      true,
    );
  }
  return unico.valor;
}

export async function coletarSiconfi({ indicador, janela, deps }: Contexto): Promise<Ponto[]> {
  const { coleta } = indicador;
  if (coleta.tipo !== 'siconfi-resultado-primario' && coleta.tipo !== 'siconfi-divida-rcl') {
    throw new Error(`coletor errado para ${indicador.id}`);
  }
  const rreo = coleta.tipo === 'siconfi-resultado-primario';
  const { anexo, ente, esfera } = coleta.fonte;
  const anexoNaUrl = encodeURIComponent(anexo);

  const pontos: Ponto[] = [];
  const anoFinal = Number(janela.hoje.slice(0, 4));
  for (let ano = Number(janela.inicio.slice(0, 4)); ano <= anoFinal; ano++) {
    // Do último período do ano para o primeiro: fica o mais recente já publicado.
    for (let periodo = rreo ? 6 : 3; periodo >= 1; periodo--) {
      const url = rreo
        ? `${BASE}/rreo?an_exercicio=${ano}&nr_periodo=${periodo}&co_tipo_demonstrativo=RREO` +
          `&no_anexo=${anexoNaUrl}&co_esfera=${esfera}&id_ente=${ente}`
        : `${BASE}/rgf?an_exercicio=${ano}&in_periodicidade=Q&nr_periodo=${periodo}` +
          `&co_tipo_demonstrativo=RGF&no_anexo=${anexoNaUrl}&co_esfera=${esfera}` +
          `&co_poder=${coleta.fonte.poder}&id_ente=${ente}`;
      const itens = await buscarItens(url, deps);
      if (itens.length === 0) continue;

      if (rreo) {
        const valor = valorDe(
          itens,
          'RESULTADO PRIMÁRIO (COM RPPS) - Acima da Linha',
          'VALOR',
          url,
        );
        const nota = MESES_ATE_O_BIMESTRE[periodo - 1];
        pontos.push({ periodo: String(ano), valor, ...(nota ? { nota } : {}) });
      } else {
        for (let q = 1; q <= periodo; q++) {
          const valor = valorDe(
            itens,
            '% da DCL sobre a RCL AJUSTADA',
            `Até o ${q}º Quadrimestre`,
            url,
          );
          pontos.push({ periodo: `${ano}-Q${q}`, valor });
        }
      }
      break;
    }
  }
  if (pontos.length === 0)
    throw new ErroDeColeta(`${indicador.id}: nenhum relatório publicado`, true);
  return pontos;
}
