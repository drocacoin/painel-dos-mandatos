import { describe, expect, it } from 'vitest';
import { formatarData, formatarDataHora } from '../src/lib/formatar';

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
