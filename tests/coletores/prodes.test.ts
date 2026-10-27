import { describe, expect, it } from 'vitest';
import { coletarProdes } from '../../scripts/coletores/prodes';
import { amostra, indicador, internetFalsa, janela, TIPO } from '../ajuda';

const TAXAS = 'inpe/prodes-amazonia-legal-rates2026.json';
const ATUALIZACAO = 'inpe/prodes-last_update_date.json';

const internet = (atualizacao = amostra(ATUALIZACAO)) =>
  internetFalsa((url) => ({
    corpo: url.includes('last_update_date') ? atualizacao : amostra(TAXAS),
    tipo: TIPO.json,
  }));

const coletar = (deps: ReturnType<typeof internetFalsa>) =>
  coletarProdes({
    indicador: indicador('brasil', 'desmatamento-amazonia'),
    janela,
    anterior: null,
    deps,
  });

describe('coletor do PRODES (INPE)', () => {
  it('soma os estados de cada ano PRODES, a partir de 2023, e marca a taxa nova como estimativa', async () => {
    // Totais conferidos com o painel TerraBrasilis em 26/10/2026.
    await expect(coletar(internet())).resolves.toEqual([
      { periodo: '2023', valor: 9064 },
      { periodo: '2024', valor: 6518 },
      { periodo: '2025', valor: 5731 },
      { periodo: '2026', valor: 3335, nota: 'estimativa' },
    ]);
  });

  it('depois da consolidação (atualização no ano seguinte), a taxa perde a nota', async () => {
    const pontos = await coletar(internet(Buffer.from('{"last_date":"2027-05-20"}')));
    expect(pontos.at(-1)).toEqual({ periodo: '2026', valor: 3335 });
  });

  it('formato inesperado é erro, e o dado anterior fica como estava', async () => {
    const deps = internetFalsa(() => ({ corpo: '{"periods":[]}', tipo: TIPO.json }));
    await expect(coletar(deps)).rejects.toThrow(/formato inesperado/);
  });
});
