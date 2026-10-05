import { describe, expect, it } from 'vitest';
import { coletarProjetosDoGoverno } from '../../scripts/coletores/camara';
import type { ProjetoDeLei } from '../../src/lib/schemas';
import { amostra, foraDoAr, internetFalsa, TIPO, type Resposta } from '../ajuda';

// Só 2025. Amostras reais em tests/fixtures/camara. A lista de PL tem 22 projetos: o teste usa
// só o primeiro (PL 1087/2025), para não precisar do detalhe de todos.
const janela = { inicio: '2025-01-01', hoje: '2025-12-31' };

const listaDePl = () => {
  const real = JSON.parse(
    amostra('camara/proposicoes-pl-2025-autor-poder-executivo.json').toString(),
  );
  return JSON.stringify({ ...real, dados: real.dados.slice(0, 1) });
};

function camara(url: string): Resposta {
  const json = (corpo: string | Uint8Array): Resposta => ({ corpo, tipo: TIPO.json });
  if (url.includes('siglaTipo=PL&')) return json(listaDePl());
  if (url.includes('siglaTipo=PLP&'))
    return json(amostra('camara/proposicoes-plp-2025-autor-poder-executivo.json'));
  if (url.includes('siglaTipo=PEC&'))
    return json(amostra('camara/proposicoes-pec-2025-autor-poder-executivo.json'));
  const id = url.match(/proposicoes\/(\d+)/)?.[1];
  if (url.endsWith('/autores')) return json(amostra(`camara/proposicao-${id}-autores.json`));
  return json(amostra(`camara/proposicao-${id}.json`));
}

const chamadas = (deps: ReturnType<typeof internetFalsa>) =>
  deps.fetch.mock.calls.map(([url]) => String(url));

describe('coletor de projetos do governo (Câmara)', () => {
  it('confere o autor e descarta o projeto de comissão que a busca traz junto', async () => {
    const deps = internetFalsa(camara);
    const projetos = await coletarProjetosDoGoverno(janela, null, deps);
    expect(projetos).toEqual([
      {
        identificacao: 'PL 1087/2025',
        id: 2487436,
        data: '2025-03-18',
        ementa:
          'Altera a legislação do imposto sobre a renda para instituir a redução do imposto devido nas bases de cálculo mensal e anual e a tributação mínima para as pessoas físicas que auferem altas rendas, e dá outras providências.',
        codSituacao: 1140,
        situacao: 'Transformado em Norma Jurídica',
      },
      {
        identificacao: 'PEC 18/2025',
        id: 2500080,
        data: '2025-04-24',
        ementa: expect.any(String),
        codSituacao: 926,
        situacao: 'Aguardando Apreciação pelo Senado Federal',
      },
    ]);
    // O PLP 265/2025 (id 2595808) é de uma comissão especial: o autor foi conferido e o
    // detalhe nem foi pedido.
    expect(chamadas(deps)).toContain(
      'https://dadosabertos.camara.leg.br/api/v2/proposicoes/2595808/autores',
    );
    expect(chamadas(deps)).not.toContain(
      'https://dadosabertos.camara.leg.br/api/v2/proposicoes/2595808',
    );
  });

  it('não confere de novo o autor de projeto já salvo', async () => {
    const deps = internetFalsa(camara);
    const salvo = { id: 2487436 } as ProjetoDeLei;
    await coletarProjetosDoGoverno(janela, [salvo], deps);
    expect(chamadas(deps)).not.toContain(
      'https://dadosabertos.camara.leg.br/api/v2/proposicoes/2487436/autores',
    );
  });

  it('tenta de novo quando a Câmara responde 504 (aconteceu na verificação)', async () => {
    let primeira = true;
    const deps = internetFalsa((url) => {
      if (primeira) {
        primeira = false;
        return {
          corpo: amostra('camara/erro-504-tempo-esgotado.txt'),
          tipo: 'text/plain',
          status: 504,
        };
      }
      return camara(url);
    });
    await expect(coletarProjetosDoGoverno(janela, null, deps)).resolves.toHaveLength(2);
  });

  it('falha quando o detalhe não existe (404)', async () => {
    const deps = internetFalsa((url) =>
      /proposicoes\/\d+$/.test(url)
        ? {
            corpo: amostra('camara/erro-404-proposicao-inexistente.json'),
            tipo: TIPO.json,
            status: 404,
          }
        : camara(url),
    );
    await expect(coletarProjetosDoGoverno(janela, null, deps)).rejects.toThrow('HTTP 404');
  });

  it('falha se a lista tiver mais de uma página (não previsto)', async () => {
    const comProxima = JSON.stringify({
      ...JSON.parse(listaDePl()),
      links: [
        { rel: 'next', href: 'https://dadosabertos.camara.leg.br/api/v2/proposicoes?pagina=2' },
      ],
    });
    const deps = internetFalsa((url) =>
      url.includes('siglaTipo=PL&') ? { corpo: comProxima, tipo: TIPO.json } : camara(url),
    );
    await expect(coletarProjetosDoGoverno(janela, null, deps)).rejects.toThrow('paginação');
  });

  it('ano sem projetos (lista vazia) não acrescenta nada', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('camara/vazio-proposicoes-pec-2026-autor-poder-executivo.json'),
      tipo: TIPO.json,
    }));
    await expect(coletarProjetosDoGoverno(janela, null, deps)).resolves.toEqual([]);
  });

  it('falha com resposta malformada', async () => {
    const deps = internetFalsa(() => ({ corpo: '{"dados": "x"}', tipo: TIPO.json }));
    await expect(coletarProjetosDoGoverno(janela, null, deps)).rejects.toThrow(
      'formato inesperado',
    );
  });

  it('falha com a API fora do ar', async () => {
    const deps = internetFalsa(() => foraDoAr());
    await expect(coletarProjetosDoGoverno(janela, null, deps)).rejects.toThrow('fetch failed');
  });
});
