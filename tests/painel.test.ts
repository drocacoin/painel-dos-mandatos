import { describe, expect, it } from 'vitest';
import { prazosDasPromessas, proximosPrazos, ultimasAtualizacoes } from '../src/lib/painel';
import type { Promessa } from '../src/lib/promessas';
import { momentoDoMandato, posicaoNoMandato, textoDoMomento } from '../src/lib/tempo';

const INICIO = '2027-01-01';
const FIM = '2031-01-01';

describe('momento do mandato', () => {
  it('antes da posse conta os dias que faltam', () => {
    const momento = momentoDoMandato(INICIO, FIM, '2026-10-05');
    expect(momento).toEqual({ fase: 'antes', dias: 88, total: 1461, decorrido: 0 });
    expect(textoDoMomento(momento, FIM)).toBe('Faltam 88 dias para a posse');
    expect(textoDoMomento(momentoDoMandato(INICIO, FIM, '2026-12-31'), FIM)).toBe(
      'Falta 1 dia para a posse',
    );
  });

  it('no dia da posse é o dia 1, e o último dia vem antes do fim', () => {
    expect(textoDoMomento(momentoDoMandato(INICIO, FIM, INICIO), FIM)).toBe(
      'Dia 1 de 1.461 do mandato',
    );
    const ultimo = momentoDoMandato(INICIO, FIM, '2030-12-31');
    expect(ultimo.dias).toBe(1461);
    expect(ultimo.decorrido).toBeCloseTo(1460 / 1461);
  });

  it('depois do fim fica encerrado', () => {
    const momento = momentoDoMandato(INICIO, FIM, FIM);
    expect(momento.decorrido).toBe(1);
    expect(textoDoMomento(momento, FIM)).toBe('Mandato encerrado em 01/01/2031');
  });

  it('a posição na régua fica entre 0 e 1', () => {
    expect(posicaoNoMandato('2026-01-01', INICIO, FIM)).toBe(0);
    expect(posicaoNoMandato('2029-01-01', INICIO, FIM)).toBeCloseTo(731 / 1461);
    expect(posicaoNoMandato('2032-01-01', INICIO, FIM)).toBe(1);
  });
});

// Promessas FICTÍCIAS: só o prazo e o id importam aqui.
const promessa = (id: string, prazo: string | null) => ({ id, prazo }) as Promessa;
const PROMESSAS = [
  promessa('P0003', '2028-06-30'),
  promessa('P0001', null),
  promessa('P0002', '2027-12-31'),
  promessa('P0004', '2027-12-31'),
  promessa('P0005', null),
];

describe('prazos das promessas', () => {
  it('agrupa por data e põe as sem prazo no fim do mandato', () => {
    expect(prazosDasPromessas(PROMESSAS, FIM)).toEqual([
      { data: '2027-12-31', quantidade: 2 },
      { data: '2028-06-30', quantidade: 1 },
      { data: FIM, quantidade: 2 },
    ]);
  });

  it('próximos prazos: só os que têm data, a partir de hoje, em ordem', () => {
    expect(proximosPrazos(PROMESSAS, '2027-01-10').map((p) => p.id)).toEqual([
      'P0002',
      'P0004',
      'P0003',
    ]);
    expect(proximosPrazos(PROMESSAS, '2028-01-01').map((p) => p.id)).toEqual(['P0003']);
    expect(proximosPrazos(PROMESSAS, '2029-01-01')).toEqual([]);
  });
});

describe('últimas atualizações', () => {
  it('vêm da mais recente para a mais antiga, no limite pedido', () => {
    for (const abrangencia of ['brasil', 'sp']) {
      const lista = ultimasAtualizacoes(abrangencia, 4);
      expect(lista.length).toBeGreaterThan(0);
      expect(lista.length).toBeLessThanOrEqual(4);
      const instantes = lista.map((a) => Date.parse(a.atualizadoEm));
      expect(instantes).toEqual([...instantes].sort((a, b) => b - a));
    }
  });
});
