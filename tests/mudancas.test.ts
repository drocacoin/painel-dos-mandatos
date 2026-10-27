import { describe, expect, it } from 'vitest';
import { eventosDasPromessas } from '../src/lib/mudancas';
import type { Promessa } from '../src/lib/promessas';
import type { Mandato } from '../src/lib/schemas';

// Dados FICTÍCIOS: só o histórico importa aqui.
const mandato = { abrangencia: 'sp', nomeAbrangencia: 'São Paulo' } as Mandato;
const entrada = (data: string, status: Promessa['historico'][number]['status']) => ({
  data,
  status,
  justificativa: 'Justificativa de teste longa o bastante.',
  fontes: ['https://exemplo.gov.br'],
});
const promessa = (id: string, historico: Promessa['historico']) => ({ id, historico }) as Promessa;

describe('o que mudou', () => {
  it('junta registros do mesmo dia e lista cada mudança de status, da mais recente', () => {
    const eventos = eventosDasPromessas([
      {
        mandato,
        promessas: [
          promessa('P0001', [
            entrada('2026-10-05', 'nao-iniciada'),
            entrada('2027-03-01', 'em-andamento'),
          ]),
          promessa('P0002', [entrada('2026-10-05', 'nao-iniciada')]),
        ],
      },
    ]);
    expect(eventos.map((e) => [e.tipo, e.data])).toEqual([
      ['mudanca', '2027-03-01'],
      ['registro', '2026-10-05'],
    ]);
    const [mudanca, registro] = eventos;
    expect(mudanca?.tipo === 'mudanca' && [mudanca.de, mudanca.para]).toEqual([
      'nao-iniciada',
      'em-andamento',
    ]);
    expect(registro?.tipo === 'registro' && registro.promessas.map((p) => p.id)).toEqual([
      'P0001',
      'P0002',
    ]);
  });
});
