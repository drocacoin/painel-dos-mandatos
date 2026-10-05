/**
 * Câmara dos Deputados, Dados Abertos (API v2): projetos enviados pelo Poder Executivo.
 * Verificado em 05/10/2026 (amostras em tests/fixtures/camara):
 * - o filtro autor=Poder Executivo busca no NOME do autor e traz falsos positivos (o PLP
 *   265/2025 é de uma comissão especial "... do Poder Executivo"). Por isso o autor de cada
 *   projeto novo é conferido em /autores: precisa ser o órgão "Poder Executivo" (codTipo 30000);
 * - a situação atual só vem no detalhe de cada proposição (statusProposicao), às vezes vazia;
 * - às vezes responde 504 "upstream request timeout" em texto puro: o http.ts tenta de novo.
 */
import { z } from 'zod';
import { TIPOS_DE_PROJETO } from '../../config/congresso.ts';
import type { ProjetoDeLei } from '../../src/lib/schemas.ts';
import { buscarJson, ErroDeColeta, type Dependencias } from '../http.ts';
import type { Janela } from './comum.ts';

const BASE = 'https://dadosabertos.camara.leg.br/api/v2';
const PODER_EXECUTIVO = 30000; // codTipo do autor "Poder Executivo" ("Órgão do Poder Executivo")

const lista = z.object({
  dados: z.array(
    z.object({
      id: z.number().int(),
      siglaTipo: z.string(),
      numero: z.number().int(),
      ano: z.number().int(),
      ementa: z.string(),
      dataApresentacao: z.string(),
    }),
  ),
  links: z.array(z.object({ rel: z.string() })),
});

const detalhe = z.object({
  dados: z.object({
    statusProposicao: z
      .object({
        codSituacao: z.number().int().nullish(),
        descricaoSituacao: z.string().nullish(),
      })
      .nullish(),
  }),
});

const autores = z.object({ dados: z.array(z.object({ nome: z.string(), codTipo: z.number() })) });

/**
 * Projetos (PL, PLP e PEC) do Poder Executivo apresentados em cada ano da janela, com a
 * situação atual. `anteriores` são os já conferidos: o autor deles não é consultado de novo.
 */
export async function coletarProjetosDoGoverno(
  janela: Janela,
  anteriores: ProjetoDeLei[] | null,
  deps?: Dependencias,
): Promise<ProjetoDeLei[]> {
  const conferidos = new Set(anteriores?.map((p) => p.id));
  const projetos: ProjetoDeLei[] = [];
  const anoFinal = Number(janela.hoje.slice(0, 4));
  for (let ano = Number(janela.inicio.slice(0, 4)); ano <= anoFinal; ano++) {
    for (const tipo of TIPOS_DE_PROJETO) {
      const url =
        `${BASE}/proposicoes?siglaTipo=${tipo}&ano=${ano}` +
        `&autor=${encodeURIComponent('Poder Executivo')}&itens=100`;
      const { dados, links } = await buscarJson(url, lista, deps);
      if (links.some((l) => l.rel === 'next')) {
        throw new ErroDeColeta(`${url}: mais de 100 projetos, paginação não prevista`, true);
      }
      for (const p of dados) {
        if (!conferidos.has(p.id)) {
          const quem = await buscarJson(`${BASE}/proposicoes/${p.id}/autores`, autores, deps);
          if (!quem.dados.some((a) => a.codTipo === PODER_EXECUTIVO)) continue;
        }
        const status = (await buscarJson(`${BASE}/proposicoes/${p.id}`, detalhe, deps)).dados
          .statusProposicao;
        projetos.push({
          identificacao: `${p.siglaTipo} ${p.numero}/${p.ano}`,
          id: p.id,
          data: p.dataApresentacao.slice(0, 10),
          ementa: p.ementa,
          codSituacao: status?.codSituacao ?? null,
          situacao: status?.descricaoSituacao ?? null,
        });
      }
    }
  }
  return projetos.sort(
    (a, b) => a.data.localeCompare(b.data) || a.identificacao.localeCompare(b.identificacao),
  );
}
