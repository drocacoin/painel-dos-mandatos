import { describe, expect, it } from 'vitest';
import { indiceMedio, montarGastos } from '../src/lib/gastos';
import type { ArquivoGastos, ArquivoIndicador, Ponto } from '../src/lib/schemas';

// Números FICTÍCIOS, escolhidos para a conta ser fácil de conferir à mão. Não são dados reais
// e não aparecem no site.
const mes = (ano: number, numero: number) => `${ano}-${String(numero).padStart(2, '0')}`;
const IPCA: ArquivoIndicador = {
  atualizadoEm: '2026-09-10T10:17:00-03:00',
  serie: [
    // 2025: índice 100 em todos os meses.
    ...Array.from({ length: 12 }, (_, i) => ({ periodo: mes(2025, i + 1), valor: 100 })),
    // 2026: 110 de janeiro a abril e 120 de maio a agosto (média jan-ago = 115).
    ...[110, 110, 110, 110, 120, 120, 120, 120].map((valor, i) => ({
      periodo: mes(2026, i + 1),
      valor,
    })),
  ],
};
const GASTOS: ArquivoGastos = {
  atualizadoEm: '2026-10-05T10:17:00-03:00',
  anos: [
    // 2024 não tem IPCA na série acima: fica de fora.
    { ano: 2024, bimestre: 6, total: 50, funcoes: [{ funcao: 'Saúde', liquidado: 50 }] },
    {
      ano: 2025,
      bimestre: 6,
      total: 300,
      funcoes: [
        { funcao: 'Saúde', liquidado: 100 },
        { funcao: 'Educação', liquidado: 200 },
      ],
    },
    {
      ano: 2026,
      bimestre: 4,
      total: 230,
      funcoes: [
        { funcao: 'Saúde', liquidado: 115 },
        { funcao: 'Educação', liquidado: 115 },
      ],
    },
  ],
};

const arredondada = (serie: Ponto[] = []) =>
  serie.map((p) => ({ ...p, valor: Math.round(p.valor * 1e6) / 1e6 }));

describe('indiceMedio', () => {
  it('média dos meses 1 a N do ano', () => {
    expect(indiceMedio(IPCA.serie, 2026, 8)).toBe(115);
    expect(indiceMedio(IPCA.serie, 2026, 4)).toBe(110);
  });

  it('null quando falta algum mês', () => {
    expect(indiceMedio(IPCA.serie, 2026, 10)).toBeNull();
    expect(indiceMedio(IPCA.serie, 2024, 12)).toBeNull();
  });
});

describe('montarGastos', () => {
  const resultado = montarGastos(GASTOS, IPCA);

  it('corrige pela inflação: valor × IPCA de referência ÷ IPCA médio do período', () => {
    expect(resultado?.referencia).toBe('ago/2026');
    // 2025: 300 × 120 ÷ 100 = 360. 2026 (jan-ago): 230 × 120 ÷ 115 = 240, com nota.
    expect(arredondada(resultado?.total.serie)).toEqual([
      { periodo: '2025', valor: 360 },
      { periodo: '2026', valor: 240, nota: 'jan-ago' },
    ]);
  });

  it('ano sem IPCA de todos os meses fica de fora e é listado', () => {
    expect(resultado?.anosSemCorrecao).toEqual([2024]);
  });

  it('funções da maior para a menor no último ano completo', () => {
    expect(resultado?.funcoes.map((f) => [f.exibivel.titulo, f.exibivel.id])).toEqual([
      ['Educação', 'gasto-educacao'],
      ['Saúde', 'gasto-saude'],
    ]);
  });

  it('data de atualização: a mais recente entre gastos e IPCA', () => {
    expect(resultado?.atualizadoEm).toBe('2026-10-05T10:17:00-03:00');
  });

  it('sem IPCA não há o que mostrar', () => {
    expect(montarGastos(GASTOS, { ...IPCA, serie: [] })).toBeNull();
  });
});
