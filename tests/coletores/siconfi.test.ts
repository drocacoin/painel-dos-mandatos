import { describe, expect, it } from 'vitest';
import { fontes } from '../../config/fontes';
import { coletarGastosPorFuncao, coletarSiconfi } from '../../scripts/coletores/siconfi';
import { amostra, foraDoAr, indicador, internetFalsa, TIPO, type Resposta } from '../ajuda';

// Janela curta (2025 e 2026) para usar só amostras reais desses anos.
const janela = { inicio: '2025-01-01', hoje: '2026-10-05' };

/** Responde como a API real respondeu para cada ano/período (amostras em tests/fixtures/siconfi). */
function porAnoEPeriodo(tabela: Record<string, string>) {
  return (url: string): Resposta => {
    const ano = url.match(/an_exercicio=(\d+)/)?.[1];
    const periodo = url.match(/nr_periodo=(\d)/)?.[1];
    const arquivo = tabela[`${ano}/${periodo}`];
    if (!arquivo) throw new Error(`pedido inesperado: ${url}`);
    return { corpo: amostra(arquivo), tipo: TIPO.json };
  };
}

const RREO = {
  '2025/6': 'siconfi/rreo-sp-2025-bimestre6-anexo06.json',
  '2026/6': 'siconfi/vazio-rreo-sp-2026-bimestre6.json',
  '2026/5': 'siconfi/vazio-rreo-sp-2026-bimestre5.json',
  '2026/4': 'siconfi/rreo-sp-2026-bimestre4-anexo06.json',
};

const coletar = (id: string, deps: ReturnType<typeof internetFalsa>) =>
  coletarSiconfi({ indicador: indicador('sp', id), janela, anterior: null, deps });

describe('coletor do SICONFI', () => {
  it('resultado primário: ano completo e ano corrente parcial, com nota', async () => {
    const deps = internetFalsa(porAnoEPeriodo(RREO));
    await expect(coletar('resultado-primario', deps)).resolves.toEqual([
      { periodo: '2025', valor: 8459480549.55 },
      { periodo: '2026', valor: 5341116534.66, nota: 'jan-ago' },
    ]);
    // 2026: tentou o 6º e o 5º bimestres (vazios) antes de achar o 4º.
    expect(deps.fetch).toHaveBeenCalledTimes(4);
  });

  it('dívida/RCL: um ponto por quadrimestre publicado', async () => {
    const deps = internetFalsa(
      porAnoEPeriodo({
        '2025/3': 'siconfi/rgf-sp-2025-quadrimestre3-anexo02.json',
        '2026/3': 'siconfi/vazio-rgf-sp-2026-quadrimestre3.json',
        '2026/2': 'siconfi/rgf-sp-2026-quadrimestre2-anexo02.json',
      }),
    );
    await expect(coletar('divida-rcl', deps)).resolves.toEqual([
      { periodo: '2025-Q1', valor: 119.39 },
      { periodo: '2025-Q2', valor: 121.34 },
      { periodo: '2025-Q3', valor: 124.23 },
      { periodo: '2026-Q1', valor: 115.82 },
      { periodo: '2026-Q2', valor: 113.03 },
    ]);
  });

  it('falha quando nenhum relatório foi publicado (respostas vazias)', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('siconfi/vazio-rreo-sp-2026-bimestre6.json'),
      tipo: TIPO.json,
    }));
    await expect(coletar('resultado-primario', deps)).rejects.toThrow('nenhum relatório publicado');
  });

  it('falha quando a linha esperada não existe (resposta de outro anexo)', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('siconfi/rreo-sp-2025-bimestre6-anexo02.json'),
      tipo: TIPO.json,
    }));
    await expect(coletar('resultado-primario', deps)).rejects.toThrow('esperava 1 valor');
  });

  it('falha com resposta malformada', async () => {
    const deps = internetFalsa(() => ({ corpo: '{"itens": []}', tipo: TIPO.json }));
    await expect(coletar('divida-rcl', deps)).rejects.toThrow('formato inesperado');
  });

  it('falha com a API fora do ar', async () => {
    const deps = internetFalsa(() => foraDoAr());
    await expect(coletar('divida-rcl', deps)).rejects.toThrow('fetch failed');
  });
});

describe('coletor de gastos por função (SICONFI, RREO Anexo 02)', () => {
  const GASTOS_SP = {
    '2025/6': 'siconfi/rreo-sp-2025-bimestre6-anexo02.json',
    '2026/6': 'siconfi/vazio-rreo-sp-2026-bimestre6.json',
    '2026/5': 'siconfi/vazio-rreo-sp-2026-bimestre5.json',
    '2026/4': 'siconfi/rreo-sp-2026-bimestre4-anexo02.json',
  };
  const fonte = fontes.siconfi.gastosPorFuncaoSp;

  /** Amostra real de 2025 com uma alteração feita pelo teste. */
  const amostraAlterada = (alterar: (itens: Record<string, unknown>[]) => unknown[]) => {
    const real = JSON.parse(amostra('siconfi/rreo-sp-2025-bimestre6-anexo02.json').toString());
    return JSON.stringify({ ...real, items: alterar(real.items) });
  };
  const so2025 = { inicio: '2025-01-01', hoje: '2025-12-31' };

  it('um item por ano, do último bimestre publicado, com o total e as funções', async () => {
    const deps = internetFalsa(porAnoEPeriodo(GASTOS_SP));
    const anos = await coletarGastosPorFuncao(fonte, janela, deps);
    expect(anos.map((a) => [a.ano, a.bimestre, a.funcoes.length])).toEqual([
      [2025, 6, 24],
      [2026, 4, 24],
    ]);
    const [ano2025] = anos;
    expect(ano2025?.total).toBe(355439276197.86);
    // Só o bloco "Exceto Intra-Orçamentárias", coluna da despesa liquidada até o bimestre.
    expect(ano2025?.funcoes.find((f) => f.funcao === 'Saúde')?.liquidado).toBe(42153192468.94);
    // Funções sem despesa no estado não aparecem (nunca viram zero).
    expect(ano2025?.funcoes.some((f) => f.funcao === 'Defesa Nacional')).toBe(false);
  });

  it('falha quando a soma das funções não bate com o total do relatório', async () => {
    const semSaude = amostraAlterada((itens) => itens.filter((i) => i.conta !== 'Saúde'));
    const deps = internetFalsa(() => ({ corpo: semSaude, tipo: TIPO.json }));
    await expect(coletarGastosPorFuncao(fonte, so2025, deps)).rejects.toThrow('diferente do total');
  });

  it('falha quando uma função aparece repetida', async () => {
    const repetida = amostraAlterada((itens) => [
      ...itens,
      ...itens.filter(
        (i) => i.conta === 'Saúde' && i.coluna === 'DESPESAS LIQUIDADAS ATÉ O BIMESTRE (d)',
      ),
    ]);
    const deps = internetFalsa(() => ({ corpo: repetida, tipo: TIPO.json }));
    await expect(coletarGastosPorFuncao(fonte, so2025, deps)).rejects.toThrow('repetido');
  });

  it('falha com resposta malformada (valor em texto)', async () => {
    const valorEmTexto = amostraAlterada((itens) =>
      itens.map((i) => ({ ...i, valor: String(i.valor) })),
    );
    const deps = internetFalsa(() => ({ corpo: valorEmTexto, tipo: TIPO.json }));
    await expect(coletarGastosPorFuncao(fonte, so2025, deps)).rejects.toThrow('formato inesperado');
  });

  it('ano sem nenhum bimestre publicado fica de fora (lista vazia)', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('siconfi/vazio-rreo-sp-2026-bimestre6.json'),
      tipo: TIPO.json,
    }));
    await expect(coletarGastosPorFuncao(fonte, so2025, deps)).resolves.toEqual([]);
    expect(deps.fetch).toHaveBeenCalledTimes(6);
  });

  it('falha com a API fora do ar', async () => {
    const deps = internetFalsa(() => foraDoAr());
    await expect(coletarGastosPorFuncao(fonte, so2025, deps)).rejects.toThrow('fetch failed');
  });
});
