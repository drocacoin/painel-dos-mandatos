/**
 * Senado Federal, Dados Abertos: medidas provisórias (processos com sigla MPV).
 * Verificado em 05/10/2026 (amostras em tests/fixtures/senado):
 * - responde JSON sem cabeçalho especial; ano sem MPs responde lista vazia;
 * - todas as MPs têm autoria "Presidência da República";
 * - siglaTipoDeliberacao só aparece depois da decisão (aprovada, perda de eficácia, revogada);
 * - situacaoAtual às vezes falta (3 MPs de 2023, todas com perda de eficácia).
 */
import { z } from 'zod';
import type { MedidaProvisoria } from '../../src/lib/schemas.ts';
import { buscarJson, ErroDeColeta, type Dependencias } from '../http.ts';
import type { Janela } from './comum.ts';

const respostaSenado = z.array(
  z.object({
    codigoMateria: z.number().int(),
    identificacao: z.string(),
    autoria: z.string(),
    ementa: z.string(),
    dataApresentacao: z.iso.date(),
    situacaoAtual: z.string().optional(),
    siglaTipoDeliberacao: z.string().optional(),
    tramitando: z.enum(['Sim', 'Não']),
  }),
);

/** Medidas provisórias editadas em cada ano da janela, em ordem de data. */
export async function coletarMedidasProvisorias(
  janela: Janela,
  deps?: Dependencias,
): Promise<MedidaProvisoria[]> {
  const medidas: MedidaProvisoria[] = [];
  const anoFinal = Number(janela.hoje.slice(0, 4));
  for (let ano = Number(janela.inicio.slice(0, 4)); ano <= anoFinal; ano++) {
    const url = `https://legis.senado.leg.br/dadosabertos/processo?sigla=MPV&ano=${ano}`;
    for (const mp of await buscarJson(url, respostaSenado, deps)) {
      if (mp.autoria !== 'Presidência da República') {
        throw new ErroDeColeta(`${url}: ${mp.identificacao} com autoria "${mp.autoria}"`, true);
      }
      medidas.push({
        identificacao: mp.identificacao,
        codigoMateria: mp.codigoMateria,
        data: mp.dataApresentacao,
        ementa: mp.ementa,
        situacao: mp.situacaoAtual ?? null,
        deliberacao: mp.siglaTipoDeliberacao ?? null,
        tramitando: mp.tramitando === 'Sim',
      });
    }
  }
  return medidas.sort(
    (a, b) => a.data.localeCompare(b.data) || a.identificacao.localeCompare(b.identificacao),
  );
}
