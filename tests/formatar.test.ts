import { describe, expect, it } from 'vitest';
import {
  formatarData,
  formatarDataHora,
  formatarEixo,
  formatarValor,
  formatarVariacao,
  hojeEmBrasilia,
  isoEmBrasilia,
} from '../src/lib/formatar';

describe('formatarValor', () => {
  it.each([
    [4.22, '%', 2, '4,22%'],
    [13.75, '% a.a.', 2, '13,75% a.a.'],
    [-0.53, '% do PIB', 2, '-0,53% do PIB'],
    [3777, 'R$', 0, 'R$ 3.777'],
    [8459480549.55, 'R$', 0, 'R$ 8,46\u00A0bi'],
    [-1200000000, 'R$', 0, '-R$ 1,2\u00A0bi'],
    [106.33, 'índice', 2, '106,33'],
    [2527, 'vítimas', 0, '2.527 vítimas'],
    [11.2, 'por mil nascidos vivos', 1, '11,2 por mil nascidos vivos'],
  ] as const)('%s em %s → %s', (valor, unidade, casas, esperado) => {
    expect(formatarValor(valor, unidade, casas)).toBe(esperado);
  });
});

describe('formatarEixo', () => {
  it('números redondos sem decimais, os outros com as casas do indicador', () => {
    expect(formatarEixo(14, '% a.a.', 2)).toBe('14%');
    expect(formatarEixo(4.25, '%', 2)).toBe('4,25%');
    expect(formatarEixo(6000, 'mortes', 0)).toBe('6.000');
    expect(formatarEixo(5_000_000_000, 'R$', 0)).toBe('R$ 5\u00A0bi');
  });
});

describe('formatarVariacao', () => {
  it('mostra o sinal sempre, e zero sem sinal', () => {
    expect(formatarVariacao(0.4, 'pontos-percentuais', '%', 1)).toBe('+0,4 p.p.');
    expect(formatarVariacao(-3.94, 'percentual', 'vítimas', 0)).toBe('-3,9%');
    expect(formatarVariacao(1.2e9, 'diferenca', 'R$', 0)).toBe('+R$ 1,2\u00A0bi');
    expect(formatarVariacao(0, 'pontos-percentuais', '%', 1)).toBe('0,0 p.p.');
  });
});

describe('isoEmBrasilia e hojeEmBrasilia', () => {
  it('usam o fuso de Brasília, com o deslocamento explícito', () => {
    const instante = new Date('2026-10-05T00:34:00Z'); // em UTC já é dia 5
    expect(isoEmBrasilia(instante)).toBe('2026-10-04T21:34:00-03:00');
    expect(hojeEmBrasilia(instante)).toBe('2026-10-04');
  });
});

describe('formatarData', () => {
  it('converte AAAA-MM-DD para DD/MM/AAAA sem passar por fuso horário', () => {
    expect(formatarData('2027-01-05')).toBe('05/01/2027');
  });
});

describe('formatarDataHora', () => {
  it('mostra o horário de Brasília, não o UTC', () => {
    // Caso real da Fase 0: 00:34 de 05/10 em UTC ainda é 21:34 de 04/10 em Brasília.
    expect(formatarDataHora(new Date('2026-10-05T00:34:00Z'))).toBe('04/10/2026 às 21:34');
  });

  it('usa o formato de 24 horas', () => {
    expect(formatarDataHora(new Date('2026-10-04T17:05:00Z'))).toBe('04/10/2026 às 14:05');
  });
});
