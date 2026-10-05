import { describe, expect, it } from 'vitest';
import { compararComInicio, textoDaVariacao } from '../src/lib/indicadores';
import { indicador } from './ajuda';

// Séries de TESTE que atravessam o início do mandato (05/01/2027). Não são dados reais e
// não aparecem no site: servem só para exercitar a conta antes de o mandato começar.
const INICIO = '2027-01-05';
const ipca = indicador('brasil', 'ipca-12m'); // mensal, variação em p.p.
const rendimento = indicador('brasil', 'rendimento'); // trimestre móvel, variação em %
const resultadoSp = indicador('sp', 'resultado-primario'); // anual, ano corrente com nota

describe('compararComInicio', () => {
  it('referência = último período que terminou antes do início; atual = último do mandato', () => {
    const serie = [
      { periodo: '2026-11', valor: 4.0 },
      { periodo: '2026-12', valor: 4.1 },
      { periodo: '2027-01', valor: 4.3 },
      { periodo: '2027-02', valor: 4.5 },
    ];
    expect(compararComInicio(serie, ipca, INICIO)).toEqual({
      referencia: { periodo: '2026-12', valor: 4.1 },
      atual: { periodo: '2027-02', valor: 4.5 },
    });
  });

  it('antes do mandato não há ponto atual', () => {
    const serie = [{ periodo: '2026-08', valor: 4.22 }];
    expect(compararComInicio(serie, ipca, INICIO).atual).toBeNull();
  });

  it('pontos com nota (ano incompleto) não entram na comparação', () => {
    const serie = [
      { periodo: '2026', valor: 9e9 },
      { periodo: '2027', valor: 3e9, nota: 'jan-ago' },
    ];
    expect(compararComInicio(serie, resultadoSp, INICIO)).toEqual({
      referencia: { periodo: '2026', valor: 9e9 },
      atual: null,
    });
  });
});

describe('textoDaVariacao', () => {
  it('taxa: diferença em pontos percentuais, com os dois períodos', () => {
    const texto = textoDaVariacao(ipca, {
      referencia: { periodo: '2026-12', valor: 4.1 },
      atual: { periodo: '2027-02', valor: 4.5 },
    });
    expect(texto).toBe(
      '+0,40 p.p. desde o início do mandato (de 4,10% em dez/2026 para 4,50% em fev/2027)',
    );
  });

  it('valor em reais: variação percentual', () => {
    const texto = textoDaVariacao(rendimento, {
      referencia: { periodo: '2026-12', valor: 4000 },
      atual: { periodo: '2027-03', valor: 4100 },
    });
    expect(texto).toBe(
      '+2,5% desde o início do mandato (de R$ 4.000 em out-nov-dez 2026 para R$ 4.100 em jan-fev-mar 2027)',
    );
  });

  it('sem ponto atual, não há texto', () => {
    expect(
      textoDaVariacao(ipca, { referencia: { periodo: '2026-12', valor: 4 }, atual: null }),
    ).toBeNull();
  });
});
