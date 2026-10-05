import { describe, expect, it } from 'vitest';
import { coletarInfosiga } from '../../scripts/coletores/infosiga';
import type { Ponto } from '../../src/lib/schemas';
import { amostra, foraDoAr, indicador, internetFalsa, janela, TIPO, type Resposta } from '../ajuda';

const CATALOGO = amostra('infosiga/catalogo-pessoas-envolvidas.json');
// Trecho real (400 linhas) do mês de ago/2026; tem 19 pessoas com gravidade_lesao FATAL.
const TRECHO = amostra('infosiga/pessoas-08-2026-trecho.csv');
const MORTES_NO_TRECHO = 19;

/** Catálogo real; para cada mês, devolve o mesmo trecho real (o teste é da conta, não dos dados). */
function infosiga(
  csv: Resposta = { corpo: TRECHO, tipo: TIPO.csv },
  catalogo: string | Uint8Array = CATALOGO,
) {
  return (url: string): Resposta =>
    url.includes('package_show')
      ? { corpo: catalogo, tipo: 'application/json;charset=utf-8' }
      : csv;
}

const coletar = (deps: ReturnType<typeof internetFalsa>, anterior: Ponto[] | null = null) =>
  coletarInfosiga({ indicador: indicador('sp', 'transito-mortes'), janela, anterior, deps });

describe('coletor do Infosiga', () => {
  it('soma 12 meses de mortes e marca o último mês como preliminar', async () => {
    const deps = internetFalsa(infosiga());
    const serie = await coletar(deps);
    expect(serie).toHaveLength(44); // jan/2023 a ago/2026
    expect(serie[0]).toEqual({ periodo: '2023-01', valor: 12 * MORTES_NO_TRECHO });
    expect(serie.at(-1)).toEqual({
      periodo: '2026-08',
      valor: 12 * MORTES_NO_TRECHO,
      nota: 'preliminar',
    });
    // 1 catálogo + 55 meses (fev/2022 a ago/2026: os 11 meses antes de jan/2023 entram na 1ª soma).
    expect(deps.fetch).toHaveBeenCalledTimes(56);
  });

  it('não baixa nada quando não saiu mês novo', async () => {
    const deps = internetFalsa(infosiga());
    const salva = [{ periodo: '2026-08', valor: 5000, nota: 'preliminar' }];
    await expect(coletar(deps, salva)).resolves.toBe(salva);
    expect(deps.fetch).toHaveBeenCalledTimes(1); // só o catálogo
  });

  it('falha quando falta o arquivo de um mês no catálogo', async () => {
    const semMaio = JSON.parse(CATALOGO.toString('utf-8'));
    semMaio.result.resources = semMaio.result.resources.filter(
      (r: { url: string }) => !r.url.includes('pessoas_05-2024.csv'),
    );
    const deps = internetFalsa(infosiga(undefined, JSON.stringify(semMaio)));
    await expect(coletar(deps)).rejects.toThrow('falta o arquivo de 2024-05');
  });

  it('falha com resposta malformada (página HTML em vez de CSV)', async () => {
    const deps = internetFalsa(infosiga({ corpo: '<html></html>', tipo: TIPO.html }));
    await expect(coletar(deps)).rejects.toThrow('esperava csv');
  });

  it('falha com CSV vazio', async () => {
    const deps = internetFalsa(infosiga({ corpo: '', tipo: TIPO.csv }));
    await expect(coletar(deps)).rejects.toThrow('CSV vazio');
  });

  it('falha com CSV que tem aspas (formato que mudaria os dados sem aviso)', async () => {
    const deps = internetFalsa(infosiga({ corpo: 'a;b\n"x;y";z', tipo: TIPO.csv }));
    await expect(coletar(deps)).rejects.toThrow('aspas');
  });

  it('falha com a API fora do ar', async () => {
    const deps = internetFalsa(() => foraDoAr());
    await expect(coletar(deps)).rejects.toThrow('fetch failed');
  });
});
