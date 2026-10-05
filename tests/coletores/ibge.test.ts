import { describe, expect, it } from 'vitest';
import { coletarIbge } from '../../scripts/coletores/ibge';
import { amostra, foraDoAr, indicador, internetFalsa, janela, TIPO } from '../ajuda';

const coletar = (abrangencia: string, id: string, deps: ReturnType<typeof internetFalsa>) =>
  coletarIbge({ indicador: indicador(abrangencia, id), janela, anterior: null, deps });

const json = (caminho: string) => () => ({ corpo: amostra(caminho), tipo: TIPO.json });

describe('coletor do IBGE', () => {
  it('IPCA mensal: períodos AAAA-MM, de jan/2023 até o último divulgado', async () => {
    const deps = internetFalsa(json('ibge/coleta-ipca-12m-brasil.json'));
    const serie = await coletar('brasil', 'ipca-12m', deps);
    expect(serie).toHaveLength(44);
    expect(serie[0]).toEqual({ periodo: '2023-01', valor: 5.77 });
    expect(serie.at(-1)).toEqual({ periodo: '2026-08', valor: 4.22 });
    expect(String(deps.fetch.mock.calls[0]?.[0])).toContain(
      '/1737/periodos/202301-209912/variaveis/2265?localidades=N1%5Ball%5D',
    );
  });

  it('tabela trimestral: "202602" vira o 2º trimestre (2026-T2)', async () => {
    const deps = internetFalsa(json('ibge/coleta-desocupacao-sp.json'));
    const serie = await coletar('sp', 'desocupacao', deps);
    expect(serie).toHaveLength(14);
    expect(serie[0]).toEqual({ periodo: '2023-T1', valor: 8.5 });
    expect(serie.at(-1)).toEqual({ periodo: '2026-T2', valor: 5.4 });
  });

  it('envia a classificação quando a tabela exige (PIB a preços de mercado)', async () => {
    const deps = internetFalsa(json('ibge/coleta-pib-brasil.json'));
    const serie = await coletar('brasil', 'pib', deps);
    expect(serie.at(-1)).toEqual({ periodo: '2026-T2', valor: 1.9 });
    expect(String(deps.fetch.mock.calls[0]?.[0])).toContain('classificacao=11255%5B90707%5D');
  });

  it('falha com resposta vazia (período ainda não divulgado)', async () => {
    const deps = internetFalsa(json('ibge/vazio-periodo-inexistente.json'));
    await expect(coletar('brasil', 'ipca-12m', deps)).rejects.toThrow('resposta vazia');
  });

  it('falha quando o valor é um símbolo do IBGE em vez de número (nunca vira zero)', async () => {
    const real = JSON.parse(amostra('ibge/coleta-ipca-12m-brasil.json').toString('utf-8'));
    real[0].resultados[0].series[0].serie['202608'] = '...'; // "valor não disponível"
    const deps = internetFalsa(() => ({ corpo: JSON.stringify(real), tipo: TIPO.json }));
    await expect(coletar('brasil', 'ipca-12m', deps)).rejects.toThrow('"..." no período 202608');
  });

  it('falha quando vêm várias séries (amostra real com Brasil e SP juntos)', async () => {
    const deps = internetFalsa(json('ibge/4099-desocupacao-brasil-e-sp-ultimos-3.json'));
    await expect(coletar('sp', 'desocupacao', deps)).rejects.toThrow('esperava 1 série, recebeu 2');
  });

  it('falha com erro do servidor (HTTP 500) depois de 4 tentativas', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('ibge/erro-500-tabela-inexistente.json'),
      tipo: TIPO.json,
      status: 500,
    }));
    await expect(coletar('brasil', 'ipca-12m', deps)).rejects.toThrow('HTTP 500');
    expect(deps.fetch).toHaveBeenCalledTimes(4);
  });

  it('falha com a API fora do ar', async () => {
    const deps = internetFalsa(() => foraDoAr());
    await expect(coletar('brasil', 'ipca-12m', deps)).rejects.toThrow('fetch failed');
  });
});
