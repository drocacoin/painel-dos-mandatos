import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { fontes } from '../config/fontes';

// Regra 2: toda fonte precisa dizer o que é e quando foi verificada.
const entradas = Object.entries(fontes).flatMap(([grupo, itens]) =>
  Object.entries(itens).map(([nome, fonte]) => [`${grupo}.${nome}`, fonte] as const),
);

describe('config/fontes.ts', () => {
  it.each(entradas)('%s tem descrição e data de verificação válida', (_nome, fonte) => {
    expect(fonte.descricao.length).toBeGreaterThan(0);
    expect(z.iso.date().safeParse(fonte.verificadoEm).success).toBe(true);
  });
});
