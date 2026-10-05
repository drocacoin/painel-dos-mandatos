// Apoio aos testes: lê as amostras reais e simula a internet, sem esperas de verdade.
import { readFileSync } from 'node:fs';
import { vi } from 'vitest';
import { indicadores } from '../config/indicadores';
import type { Janela } from '../scripts/coletores/comum';
import type { Dependencias } from '../scripts/http';

/** Conteúdo de tests/fixtures/<caminho>, byte a byte. */
export const amostra = (caminho: string) =>
  readFileSync(new URL(`./fixtures/${caminho}`, import.meta.url));

export const indicador = (abrangencia: string, id: string) => {
  const achado = indicadores.find((i) => i.abrangencia === abrangencia && i.id === id);
  if (!achado) throw new Error(`indicador ${abrangencia}/${id} não existe`);
  return achado;
};

export const janela: Janela = { inicio: '2023-01-01', hoje: '2026-10-05' };

// Tipos de conteúdo exatamente como as fontes reais responderam (tests/fixtures/README.md).
export const TIPO = {
  bcb: 'application/json; charset=utf-8',
  html: 'text/html; charset=utf-8',
  json: 'application/json',
  csv: 'text/csv',
} as const;

export type Resposta = { corpo: string | Uint8Array; tipo: string; status?: number } | Error;

// Relógio falso único para todos os testes: só avança, então o intervalo mínimo entre
// pedidos (guardado pelo http.ts entre chamadas) nunca obriga um teste a esperar.
let relogio = 0;

/** Dependências falsas: cada endereço recebe o que `responder` devolver. */
export function internetFalsa(responder: (url: string) => Resposta) {
  return {
    fetch: vi.fn(async (url: string) => {
      const resposta = responder(url);
      if (resposta instanceof Error) throw resposta;
      const corpo =
        typeof resposta.corpo === 'string' ? resposta.corpo : Uint8Array.from(resposta.corpo);
      return new Response(corpo, {
        status: resposta.status ?? 200,
        headers: { 'content-type': resposta.tipo },
      });
    }),
    esperar: vi.fn(async (ms: number) => {
      relogio += ms;
    }),
    // Cada consulta ao relógio avança 10 s: o intervalo entre pedidos nunca precisa esperar.
    agora: () => (relogio += 10_000),
  } satisfies Dependencias;
}

/** Simula a rede fora do ar (o erro que o fetch do Node lança). */
export const foraDoAr = () => new TypeError('fetch failed');
