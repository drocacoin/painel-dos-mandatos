import { describe, expect, it, vi } from 'vitest';
import { processarIndicador, type Armazenamento } from '../scripts/coletar';
import type { ArquivoIndicador, Ponto } from '../src/lib/schemas';
import { indicador, janela } from './ajuda';

const IPCA = indicador('brasil', 'ipca-12m');
const SALVO: ArquivoIndicador = {
  atualizadoEm: '2026-09-10T09:17:00-03:00',
  serie: [
    { periodo: '2026-07', valor: 4.44 },
    { periodo: '2026-08', valor: 4.22 },
  ],
};

function armazenamento(salvo: ArquivoIndicador | null) {
  return {
    ler: vi.fn(async () => salvo),
    gravar: vi.fn(async () => {}),
  } satisfies Armazenamento;
}

const coletorQueDevolve = (serie: Ponto[]) => async () => serie;
const AGORA = new Date('2026-10-05T13:17:00Z');

describe('processarIndicador (regra 3: nunca trocar dado bom por dado ruim)', () => {
  it('grava a série nova, com a data e hora de Brasília', async () => {
    const disco = armazenamento(SALVO);
    const nova = [...SALVO.serie, { periodo: '2026-09', valor: 4.1 }];
    const resultado = await processarIndicador(IPCA, janela, disco, coletorQueDevolve(nova), AGORA);
    expect(resultado).toEqual({ situacao: 'gravado', pontos: 3, ultimo: nova[2] });
    expect(disco.gravar).toHaveBeenCalledWith(IPCA, {
      atualizadoEm: '2026-10-05T10:17:00-03:00',
      serie: nova,
    });
  });

  it('não grava quando nada mudou (o histórico do git só registra mudanças reais)', async () => {
    const disco = armazenamento(SALVO);
    const resultado = await processarIndicador(IPCA, janela, disco, coletorQueDevolve(SALVO.serie));
    expect(resultado).toEqual({ situacao: 'sem-mudanca' });
    expect(disco.gravar).not.toHaveBeenCalled();
  });

  it('não grava quando a coleta falha (API fora do ar, resposta vazia ou malformada)', async () => {
    const disco = armazenamento(SALVO);
    const falhou = async () => {
      throw new Error('HTTP 500');
    };
    const resultado = await processarIndicador(IPCA, janela, disco, falhou);
    expect(resultado).toEqual({ situacao: 'falhou', motivo: 'HTTP 500' });
    expect(disco.gravar).not.toHaveBeenCalled();
  });

  it('não troca uma série por outra menor (resposta cortada)', async () => {
    const disco = armazenamento(SALVO);
    const cortada = [{ periodo: '2026-08', valor: 4.22 }];
    const resultado = await processarIndicador(IPCA, janela, disco, coletorQueDevolve(cortada));
    expect(resultado.situacao).toBe('falhou');
    expect(disco.gravar).not.toHaveBeenCalled();
  });

  it('não grava série vazia', async () => {
    const disco = armazenamento(null);
    const resultado = await processarIndicador(IPCA, janela, disco, coletorQueDevolve([]));
    expect(resultado).toEqual({ situacao: 'falhou', motivo: 'série vazia' });
  });

  it('não grava período fora do formato ou fora de ordem', async () => {
    const disco = armazenamento(null);
    const errada = [
      { periodo: '2026-08', valor: 4.22 },
      { periodo: '2026-07', valor: 4.44 },
      { periodo: '2026-T3', valor: 1 },
    ];
    const resultado = await processarIndicador(IPCA, janela, disco, coletorQueDevolve(errada));
    expect(resultado.situacao).toBe('falhou');
    if (resultado.situacao === 'falhou') {
      expect(resultado.motivo).toContain('fora de ordem');
      expect(resultado.motivo).toContain('"2026-T3" fora do formato');
    }
    expect(disco.gravar).not.toHaveBeenCalled();
  });
});
