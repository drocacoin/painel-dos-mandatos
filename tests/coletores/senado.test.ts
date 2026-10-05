import { describe, expect, it } from 'vitest';
import { coletarMedidasProvisorias } from '../../scripts/coletores/senado';
import { amostra, foraDoAr, internetFalsa, TIPO, type Resposta } from '../ajuda';

// Amostras reais de 2025, 2026 e de um ano sem MPs (tests/fixtures/senado).
const AMOSTRAS: Record<string, string> = {
  2025: 'senado/processo-mpv-2025.json',
  2026: 'senado/processo-mpv-2026.json',
};
const porAno = (url: string): Resposta => {
  const ano = url.match(/ano=(\d+)/)?.[1] ?? '';
  return {
    corpo: amostra(AMOSTRAS[ano] ?? 'senado/vazio-processo-mpv-2031.json'),
    tipo: TIPO.json,
  };
};
const janela = { inicio: '2025-01-01', hoje: '2026-10-05' };

/** Amostra real de 2025 com uma alteração feita pelo teste. */
const alterada = (alterar: (itens: Record<string, unknown>[]) => unknown[]) =>
  JSON.stringify(alterar(JSON.parse(amostra('senado/processo-mpv-2025.json').toString())));

describe('coletor de medidas provisórias (Senado)', () => {
  it('junta os anos da janela, em ordem de data, com a situação oficial', async () => {
    const medidas = await coletarMedidasProvisorias(janela, internetFalsa(porAno));
    expect(medidas).toHaveLength(46 + 62);
    const datas = medidas.map((m) => m.data);
    expect(datas).toEqual([...datas].sort());
    expect(medidas.find((m) => m.identificacao === 'MPV 1333/2026')).toEqual({
      identificacao: 'MPV 1333/2026',
      codigoMateria: 172340,
      data: '2026-01-07',
      ementa:
        'Abre crédito extraordinário, em favor do Ministério da Integração e do Desenvolvimento Regional, no valor de R$ 250.000.000,00, para os fins que especifica.',
      situacao: 'SEM EFICÁCIA',
      deliberacao: 'PERDA_EFICACIA',
      tramitando: false,
    });
    // Em tramitação: ainda sem deliberação.
    const emAndamento = medidas.filter((m) => m.tramitando);
    expect(emAndamento.length).toBeGreaterThan(0);
    expect(emAndamento.every((m) => m.deliberacao === null)).toBe(true);
  });

  it('ano sem MPs (lista vazia) não acrescenta nada', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('senado/vazio-processo-mpv-2031.json'),
      tipo: TIPO.json,
    }));
    await expect(coletarMedidasProvisorias(janela, deps)).resolves.toEqual([]);
  });

  it('situação ausente vira null (aconteceu em 3 MPs de 2023)', async () => {
    const semSituacao = alterada((itens) =>
      itens.map((item) => {
        const copia = { ...item };
        delete copia.situacaoAtual;
        return copia;
      }),
    );
    const deps = internetFalsa(() => ({ corpo: semSituacao, tipo: TIPO.json }));
    const medidas = await coletarMedidasProvisorias(
      { inicio: '2025-01-01', hoje: '2025-12-31' },
      deps,
    );
    expect(medidas.every((m) => m.situacao === null)).toBe(true);
  });

  it('falha se uma MP vier com outra autoria', async () => {
    const outraAutoria = alterada((itens) => itens.map((i) => ({ ...i, autoria: 'Senado' })));
    const deps = internetFalsa(() => ({ corpo: outraAutoria, tipo: TIPO.json }));
    await expect(coletarMedidasProvisorias(janela, deps)).rejects.toThrow('autoria');
  });

  it('falha com resposta malformada', async () => {
    const deps = internetFalsa(() => ({ corpo: '{"erro": true}', tipo: TIPO.json }));
    await expect(coletarMedidasProvisorias(janela, deps)).rejects.toThrow('formato inesperado');
  });

  it('falha com a API fora do ar', async () => {
    const deps = internetFalsa(() => foraDoAr());
    await expect(coletarMedidasProvisorias(janela, deps)).rejects.toThrow('fetch failed');
  });
});
