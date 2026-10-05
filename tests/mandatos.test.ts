import { describe, expect, it } from 'vitest';
import dados from '../config/mandatos.json';
import { mandatosSchema, type Mandato } from '../src/lib/schemas';

const mandatos = mandatosSchema.parse(dados);
const [modelo] = mandatos;
if (!modelo) throw new Error('config/mandatos.json está vazio');

const validar = (lista: unknown) => mandatosSchema.safeParse(lista).success;
const comMudanca = (mudanca: Partial<Mandato>) => validar([{ ...modelo, ...mudanca }]);

describe('config/mandatos.json', () => {
  it('passa na validação', () => {
    expect(validar(dados)).toBe(true);
  });

  it('tem as datas de posse da EC 111/2021 (5/1 para presidente, 6/1 para governador)', () => {
    const porAbrangencia = new Map(mandatos.map((m) => [m.abrangencia, m]));
    expect(porAbrangencia.get('brasil')?.inicio).toBe('2027-01-05');
    expect(porAbrangencia.get('sp')?.inicio).toBe('2027-01-06');
  });
});

describe('a validação recusa', () => {
  it('fim do mandato antes do início', () => {
    expect(comMudanca({ fim: '2026-12-31' })).toBe(false);
  });

  it('data que não existe', () => {
    expect(comMudanca({ inicio: '2027-02-30' })).toBe(false);
  });

  it('pessoa eleita sem partido', () => {
    expect(comMudanca({ eleito: 'Pessoa Teste', partido: null })).toBe(false);
  });

  it('abrangência com letra maiúscula (vira endereço do site)', () => {
    expect(comMudanca({ abrangencia: 'SP' })).toBe(false);
  });

  it('a mesma abrangência duas vezes', () => {
    expect(validar([modelo, { ...modelo, id: 'outro-id' }])).toBe(false);
  });

  it('lista vazia', () => {
    expect(validar([])).toBe(false);
  });
});
