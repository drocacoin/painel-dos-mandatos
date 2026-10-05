import { describe, expect, it, vi } from 'vitest';
import {
  processarGastos,
  processarIndicador,
  type Armazenamento,
  type ArmazenamentoDeGastos,
} from '../scripts/coletar';
import type { AnoDeGastos, ArquivoGastos, ArquivoIndicador, Ponto } from '../src/lib/schemas';
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

describe('processarGastos (regra 3 para os gastos)', () => {
  // Valores FICTÍCIOS, só para testar as regras de gravação.
  const ano = (ano: number, bimestre: number): AnoDeGastos => ({
    ano,
    bimestre,
    total: 300,
    funcoes: [
      { funcao: 'Saúde', liquidado: 100 },
      { funcao: 'Educação', liquidado: 200 },
    ],
  });
  const SALVOS: ArquivoGastos = {
    atualizadoEm: '2026-09-30T10:17:00-03:00',
    anos: [ano(2025, 6), ano(2026, 3)],
  };
  const disco = (salvo: ArquivoGastos | null) =>
    ({
      ler: vi.fn(async () => salvo),
      gravar: vi.fn(async () => {}),
    }) satisfies ArmazenamentoDeGastos;
  const devolve = (anos: AnoDeGastos[]) => async () => anos;

  it('grava quando sai um bimestre novo', async () => {
    const armazenamento = disco(SALVOS);
    const novos = [ano(2025, 6), ano(2026, 4)];
    const resultado = await processarGastos('sp', armazenamento, devolve(novos), AGORA);
    expect(resultado).toEqual({ situacao: 'gravado', ultimo: novos[1] });
    expect(armazenamento.gravar).toHaveBeenCalledWith('sp', {
      atualizadoEm: '2026-10-05T10:17:00-03:00',
      anos: novos,
    });
  });

  it('não grava quando nada mudou', async () => {
    const armazenamento = disco(SALVOS);
    const resultado = await processarGastos('sp', armazenamento, devolve(SALVOS.anos));
    expect(resultado).toEqual({ situacao: 'sem-mudanca' });
    expect(armazenamento.gravar).not.toHaveBeenCalled();
  });

  it('não grava quando um ano salvo some (resposta vazia ou cortada)', async () => {
    const armazenamento = disco(SALVOS);
    const resultado = await processarGastos('sp', armazenamento, devolve([ano(2026, 4)]));
    expect(resultado.situacao).toBe('falhou');
    expect(armazenamento.gravar).not.toHaveBeenCalled();
  });

  it('não grava quando o último bimestre de um ano volta para trás', async () => {
    const armazenamento = disco(SALVOS);
    const resultado = await processarGastos(
      'sp',
      armazenamento,
      devolve([ano(2025, 6), ano(2026, 2)]),
    );
    expect(resultado).toEqual({
      situacao: 'falhou',
      motivo: '2026: o último bimestre voltou do 3º para o 2º',
    });
  });

  it('não grava lista vazia nem quando a coleta falha', async () => {
    const armazenamento = disco(null);
    await expect(processarGastos('sp', armazenamento, devolve([]))).resolves.toEqual({
      situacao: 'falhou',
      motivo: 'nenhum ano coletado',
    });
    const falhou = async () => {
      throw new Error('HTTP 500');
    };
    await expect(processarGastos('sp', armazenamento, falhou)).resolves.toEqual({
      situacao: 'falhou',
      motivo: 'HTTP 500',
    });
    expect(armazenamento.gravar).not.toHaveBeenCalled();
  });
});
