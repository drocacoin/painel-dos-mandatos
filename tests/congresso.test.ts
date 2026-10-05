import { describe, expect, it } from 'vitest';
import {
  anoDoNumero,
  contagemPorAno,
  doMandato,
  quadroPorAno,
  resultadoDaMedida,
  resultadoDoProjeto,
} from '../src/lib/congresso';
import type { MedidaProvisoria, ProjetoDeLei } from '../src/lib/schemas';

// Itens FICTÍCIOS (só os campos que importam para cada regra). Não são dados reais.
const medida = (mudanca: Partial<MedidaProvisoria>): MedidaProvisoria => ({
  identificacao: 'MPV 1/2026',
  codigoMateria: 1,
  data: '2026-01-10',
  ementa: 'Ementa de teste.',
  situacao: null,
  deliberacao: null,
  tramitando: false,
  ...mudanca,
});
const projeto = (mudanca: Partial<ProjetoDeLei>): ProjetoDeLei => ({
  identificacao: 'PL 1/2026',
  id: 1,
  data: '2026-01-10',
  ementa: 'Ementa de teste.',
  codSituacao: null,
  situacao: null,
  ...mudanca,
});

describe('resumo da situação', () => {
  it('medidas provisórias: pela deliberação; sem ela, pelo "tramitando"', () => {
    expect(resultadoDaMedida(medida({ deliberacao: 'APROVADO_PLV' }))).toBe('Virou lei');
    expect(resultadoDaMedida(medida({ deliberacao: 'APROVADO_NA_INTEGRA' }))).toBe('Virou lei');
    expect(resultadoDaMedida(medida({ deliberacao: 'PERDA_EFICACIA' }))).toBe('Perdeu a eficácia');
    expect(resultadoDaMedida(medida({ deliberacao: 'REVOGADO' }))).toBe('Revogada');
    expect(resultadoDaMedida(medida({ tramitando: true }))).toBe('Em tramitação');
    // Valor que ainda não está nas regras: não é encaixado à força.
    expect(resultadoDaMedida(medida({ deliberacao: 'REJEITADO' }))).toBe('Outra situação');
  });

  it('projetos: pelo código da situação na Câmara', () => {
    expect(resultadoDoProjeto(projeto({ codSituacao: 1140 }))).toBe('Virou lei');
    expect(resultadoDoProjeto(projeto({ codSituacao: 923 }))).toBe('Arquivado ou retirado');
    expect(resultadoDoProjeto(projeto({ codSituacao: 926 }))).toBe('Em tramitação');
    expect(resultadoDoProjeto(projeto({ codSituacao: 9999 }))).toBe('Outra situação');
    expect(resultadoDoProjeto(projeto({ codSituacao: null }))).toBe('Outra situação');
  });
});

describe('contagem e quadro por ano', () => {
  const itens = [
    projeto({ identificacao: 'PL 1/2023', data: '2022-12-30', codSituacao: 950 }),
    projeto({ identificacao: 'PL 5/2023', data: '2023-03-01', codSituacao: 1140 }),
    projeto({ identificacao: 'PL 9/2025', data: '2025-05-01', codSituacao: 926 }),
  ];

  it('o ano é o do número oficial, não o da apresentação', () => {
    expect(anoDoNumero(itens[0] ?? projeto({}))).toBe(2023);
  });

  it('conta zero no ano sem itens e marca o ano corrente como parcial', () => {
    expect(contagemPorAno(itens, [2023, 2024, 2025], 2025)).toEqual([
      { periodo: '2023', valor: 2 },
      { periodo: '2024', valor: 0 },
      { periodo: '2025', valor: 1, nota: 'parcial' },
    ]);
  });

  it('quadro: total e resultados de cada ano', () => {
    expect(quadroPorAno(itens, resultadoDoProjeto, [2023, 2024])).toEqual([
      {
        ano: 2023,
        total: 2,
        porResultado: { 'Arquivado ou retirado': 1, 'Virou lei': 1 },
      },
      { ano: 2024, total: 0, porResultado: {} },
    ]);
  });

  it('lista do mandato: pela data de apresentação, do mais recente ao mais antigo', () => {
    expect(doMandato(itens, '2023-01-01').map((i) => i.identificacao)).toEqual([
      'PL 9/2025',
      'PL 5/2023',
    ]);
  });
});
