import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { placar, statusAtual, validarPromessa, type Promessa } from '../src/lib/promessas';

const HOJE = '2027-03-01';
const CAMINHO = 'data/sp/promessas/P0001.json';

// Promessa FICTÍCIA, só para testar as regras. Não é dado real e não aparece no site.
const exemplo: Promessa = {
  id: 'P0001',
  resumo: 'Texto de resumo de teste.',
  texto: 'Texto literal de teste, como se fosse copiado do plano.',
  tema: 'Saúde',
  fonte: {
    tipo: 'plano de governo',
    titulo: 'Documento de teste',
    url: 'https://exemplo.gov.br/plano.pdf',
    data: '2026-08-15',
    pagina: 9,
  },
  mensuravel: true,
  meta: 'Meta de teste',
  indicador: 'sp/mortalidade-infantil',
  prazo: '2030-12-31',
  historico: [
    {
      data: '2026-10-05',
      status: 'nao-iniciada',
      justificativa: 'Entrada de teste com justificativa longa o bastante.',
      fontes: ['https://exemplo.gov.br/fonte'],
    },
    {
      data: '2027-02-10',
      status: 'em-andamento',
      justificativa: 'Segunda entrada de teste com justificativa longa.',
      fontes: ['https://exemplo.gov.br/outra-fonte'],
    },
  ],
};

const com = (mudanca: Record<string, unknown>) => ({ ...exemplo, ...mudanca });
const validar =
  (bruto: unknown, caminho = CAMINHO) =>
  () =>
    validarPromessa(bruto, caminho, HOJE);

describe('validarPromessa (regra 6)', () => {
  it('aceita uma promessa completa', () => {
    expect(validar(exemplo)()).toEqual(exemplo);
  });

  it('recusa entrada do histórico sem link de fonte', () => {
    const [primeira] = exemplo.historico;
    expect(validar(com({ historico: [{ ...primeira, fontes: [] }] }))).toThrow(
      'pelo menos um link de fonte',
    );
  });

  it('recusa entrada do histórico sem justificativa de verdade', () => {
    const [primeira] = exemplo.historico;
    expect(validar(com({ historico: [{ ...primeira, justificativa: 'ok' }] }))).toThrow(
      'explique a mudança',
    );
  });

  it('recusa histórico vazio', () => {
    expect(validar(com({ historico: [] }))).toThrow('pelo menos uma entrada');
  });

  it('recusa status fora dos 6 definidos', () => {
    const [primeira] = exemplo.historico;
    expect(validar(com({ historico: [{ ...primeira, status: 'quase-cumprida' }] }))).toThrow(
      'historico.0.status',
    );
  });

  it('recusa histórico fora de ordem de data', () => {
    expect(validar(com({ historico: [...exemplo.historico].reverse() }))).toThrow('ordem de data');
  });

  it('recusa data no futuro', () => {
    expect(() => validarPromessa(exemplo, CAMINHO, '2027-01-01')).toThrow('data no futuro');
  });

  it('recusa promessa mensurável sem meta', () => {
    expect(validar(com({ meta: null }))).toThrow('precisa de meta');
  });

  it('recusa tema fora das funções de governo', () => {
    expect(validar(com({ tema: 'Tema inventado' }))).toThrow('tema');
  });

  it('recusa id diferente do nome do arquivo', () => {
    expect(validar(exemplo, 'data/sp/promessas/P0002.json')).toThrow('igual ao nome do arquivo');
  });

  it('recusa indicador que não existe', () => {
    expect(validar(com({ indicador: 'sp/nao-existe' }))).toThrow('não existe');
  });
});

describe('statusAtual e placar', () => {
  it('o status atual é o da última entrada do histórico', () => {
    expect(statusAtual(exemplo)).toBe('em-andamento');
  });

  it('conta por status na ordem fixa, com percentuais', () => {
    const resultado = placar([exemplo, { ...exemplo, historico: exemplo.historico.slice(0, 1) }]);
    expect(resultado.map((r) => [r.status, r.quantidade])).toEqual([
      ['nao-iniciada', 1],
      ['em-andamento', 1],
      ['cumprida-em-parte', 0],
      ['cumprida', 0],
      ['descumprida', 0],
      ['nao-avaliavel', 0],
    ]);
    expect(resultado[0]?.percentual).toBe(50);
  });
});

describe('arquivos reais em data/*/promessas', () => {
  const arquivos = globSync('data/*/promessas/*.json');
  it.each(arquivos.length ? arquivos : ['(nenhum arquivo ainda)'])('%s é válido', (arquivo) => {
    if (!arquivo.endsWith('.json')) return;
    const caminho = arquivo.replaceAll('\\', '/');
    expect(() =>
      validarPromessa(JSON.parse(readFileSync(arquivo, 'utf-8')), caminho),
    ).not.toThrow();
  });
});
