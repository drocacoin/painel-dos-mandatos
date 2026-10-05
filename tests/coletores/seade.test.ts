import { describe, expect, it } from 'vitest';
import type { Indicador } from '../../config/indicadores';
import { coletarSeade } from '../../scripts/coletores/seade';
import { amostra, foraDoAr, indicador, internetFalsa, janela, TIPO } from '../ajuda';

const coletar = (alvo: Indicador, deps: ReturnType<typeof internetFalsa>) =>
  coletarSeade({ indicador: alvo, janela, anterior: null, deps });

const csv = (caminho: string) => () => ({ corpo: amostra(caminho), tipo: TIPO.csv });

/** O mesmo indicador de homicídios, lendo outra coluna do mesmo CSV. */
const homicidiosLendo = (colunaValor: string): Indicador => {
  const original = indicador('sp', 'homicidios');
  if (original.coleta.tipo !== 'seade') throw new Error('coleta inesperada');
  return { ...original, coleta: { ...original.coleta, colunaValor } };
};

describe('coletor da Seade', () => {
  it('homicídios: só a linha do estado (código 35), a partir de 2023', async () => {
    const deps = internetFalsa(csv('seade/homicidio-doloso.csv'));
    await expect(coletar(indicador('sp', 'homicidios'), deps)).resolves.toEqual([
      { periodo: '2023', valor: 2728 },
      { periodo: '2024', valor: 2630 },
      { periodo: '2025', valor: 2527 },
    ]);
  });

  it('mortalidade infantil: lê decimal com vírgula ("11,2")', async () => {
    const deps = internetFalsa(csv('seade/mortalidade-infantil.csv'));
    await expect(coletar(indicador('sp', 'mortalidade-infantil'), deps)).resolves.toEqual([
      { periodo: '2023', valor: 11.2 },
      { periodo: '2024', valor: 11.2 },
    ]);
  });

  it('ano com valor vazio fica de fora em vez de virar zero (taxa de 2025 ainda sem população)', async () => {
    const deps = internetFalsa(csv('seade/homicidio-doloso.csv'));
    await expect(coletar(homicidiosLendo('tx_homic_dol'), deps)).resolves.toEqual([
      { periodo: '2023', valor: 6.12 },
      { periodo: '2024', valor: 5.89 },
    ]);
  });

  it('falha quando a coluna não existe (o arquivo mudou)', async () => {
    const deps = internetFalsa(csv('seade/homicidio-doloso.csv'));
    await expect(coletar(homicidiosLendo('coluna_que_nao_existe'), deps)).rejects.toThrow(
      'coluna "coluna_que_nao_existe" não encontrada',
    );
  });

  it('falha com resposta malformada (página HTML em vez de CSV)', async () => {
    const deps = internetFalsa(() => ({ corpo: '<html></html>', tipo: TIPO.html }));
    await expect(coletar(indicador('sp', 'homicidios'), deps)).rejects.toThrow('esperava csv');
  });

  it('falha com CSV vazio', async () => {
    const deps = internetFalsa(() => ({ corpo: '', tipo: TIPO.csv }));
    await expect(coletar(indicador('sp', 'homicidios'), deps)).rejects.toThrow('CSV vazio');
  });

  it('falha com a API fora do ar', async () => {
    const deps = internetFalsa(() => foraDoAr());
    await expect(coletar(indicador('sp', 'homicidios'), deps)).rejects.toThrow('fetch failed');
  });
});
