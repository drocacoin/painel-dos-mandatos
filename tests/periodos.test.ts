import { describe, expect, it } from 'vitest';
import { fimDoPeriodo, periodoValido, rotuloPeriodo } from '../src/lib/periodos';

describe('fimDoPeriodo', () => {
  it.each([
    ['2026-02', 'mensal', '2026-02-28'],
    ['2028-02', 'mensal', '2028-02-29'], // ano bissexto
    ['2026-12', 'trimestre-movel', '2026-12-31'],
    ['2026-T2', 'trimestral', '2026-06-30'],
    ['2026-Q1', 'quadrimestral', '2026-04-30'],
    ['2026-Q3', 'quadrimestral', '2026-12-31'],
    ['2025', 'anual', '2025-12-31'],
  ] as const)('%s (%s) termina em %s', (periodo, periodicidade, fim) => {
    expect(fimDoPeriodo(periodo, periodicidade)).toBe(fim);
  });
});

describe('rotuloPeriodo', () => {
  it.each([
    ['2026-08', 'mensal', 'ago/2026', 'ago/26'],
    ['2026-08', 'trimestre-movel', 'jun-jul-ago 2026', 'ago/26'],
    ['2026-01', 'trimestre-movel', 'nov-dez-jan 2026', 'jan/26'], // atravessa o ano
    ['2026-T2', 'trimestral', '2º tri/2026', '2º tri/26'],
    ['2025-Q3', 'quadrimestral', '3º quadrimestre de 2025', '3º quadr./25'],
    ['2025', 'bienal', '2025', '2025'],
  ] as const)('%s (%s) → "%s" / "%s"', (periodo, periodicidade, longo, curto) => {
    expect(rotuloPeriodo(periodo, periodicidade)).toBe(longo);
    expect(rotuloPeriodo(periodo, periodicidade, 'curto')).toBe(curto);
  });
});

describe('periodoValido', () => {
  it('aceita o formato da periodicidade e recusa os outros', () => {
    expect(periodoValido('2026-08', 'mensal')).toBe(true);
    expect(periodoValido('2026-13', 'mensal')).toBe(false);
    expect(periodoValido('2026-T2', 'mensal')).toBe(false);
    expect(periodoValido('2026-T4', 'trimestral')).toBe(true);
    expect(periodoValido('2026-T5', 'trimestral')).toBe(false);
    expect(periodoValido('2026-Q3', 'quadrimestral')).toBe(true);
    expect(periodoValido('2026', 'anual')).toBe(true);
  });
});
