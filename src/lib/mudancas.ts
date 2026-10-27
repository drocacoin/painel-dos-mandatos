/**
 * "O que mudou": cada entrada do histórico das promessas vira um evento. A primeira entrada de
 * cada promessa é o registro inicial; registros do mesmo dia e painel viram um evento só,
 * para a lista não ficar com dezenas de linhas iguais. As outras entradas são mudanças de status.
 */
import type { Status } from '../../config/promessas';
import type { Promessa } from './promessas';
import type { Mandato } from './schemas';

export type Evento =
  | { tipo: 'registro'; data: string; mandato: Mandato; promessas: Promessa[]; status: Status }
  | {
      tipo: 'mudanca';
      data: string;
      mandato: Mandato;
      promessa: Promessa;
      de: Status;
      para: Status;
      justificativa: string;
      fontes: string[];
    };

export function eventosDasPromessas(paineis: { mandato: Mandato; promessas: Promessa[] }[]) {
  const eventos: Evento[] = [];
  for (const { mandato, promessas } of paineis) {
    const registros = new Map<string, Extract<Evento, { tipo: 'registro' }>>();
    for (const promessa of promessas) {
      promessa.historico.forEach((entrada, i) => {
        const anterior = promessa.historico[i - 1];
        if (!anterior) {
          const chave = `${entrada.data}|${entrada.status}`;
          const grupo = registros.get(chave);
          if (grupo) grupo.promessas.push(promessa);
          else
            registros.set(chave, {
              tipo: 'registro',
              data: entrada.data,
              mandato,
              promessas: [promessa],
              status: entrada.status,
            });
          return;
        }
        eventos.push({
          tipo: 'mudanca',
          data: entrada.data,
          mandato,
          promessa,
          de: anterior.status,
          para: entrada.status,
          justificativa: entrada.justificativa,
          fontes: entrada.fontes,
        });
      });
    }
    eventos.push(...registros.values());
  }
  // Mais recente primeiro; no mesmo dia, mudanças antes de registros, depois por painel e id.
  const ordem = (e: Evento) => (e.tipo === 'mudanca' ? `0${e.promessa.id}` : '1');
  return eventos.sort(
    (a, b) =>
      b.data.localeCompare(a.data) ||
      ordem(a).localeCompare(ordem(b)) ||
      a.mandato.abrangencia.localeCompare(b.mandato.abrangencia),
  );
}
