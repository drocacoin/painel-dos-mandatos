/**
 * Em que ponto do mandato estamos. Módulo pequeno e sem dados, usado no build e também no
 * navegador (src/scripts/mandato.ts), para a contagem não envelhecer entre um build e outro.
 */

/** Dias de calendário de `a` até `b` (datas AAAA-MM-DD). */
export const diasEntre = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Posição de uma data no mandato, de 0 (posse) a 1 (fim). */
export const posicaoNoMandato = (data: string, inicio: string, fim: string) =>
  Math.min(1, Math.max(0, diasEntre(inicio, data) / diasEntre(inicio, fim)));

export interface MomentoDoMandato {
  fase: 'antes' | 'durante' | 'depois';
  /** Antes: dias até a posse. Durante: dia do mandato (1 = dia da posse). Depois: 0. */
  dias: number;
  /** Duração total do mandato, em dias. */
  total: number;
  /** Fração do mandato já passada, de 0 a 1. */
  decorrido: number;
}

export function momentoDoMandato(inicio: string, fim: string, hoje: string): MomentoDoMandato {
  const total = diasEntre(inicio, fim);
  if (hoje < inicio) return { fase: 'antes', dias: diasEntre(hoje, inicio), total, decorrido: 0 };
  if (hoje >= fim) return { fase: 'depois', dias: 0, total, decorrido: 1 };
  const passados = diasEntre(inicio, hoje);
  return { fase: 'durante', dias: passados + 1, total, decorrido: passados / total };
}

const numero = new Intl.NumberFormat('pt-BR');

/** Frase curta sobre o momento: "Faltam 92 dias para a posse", "Dia 120 de 1.461 do mandato". */
export function textoDoMomento(momento: MomentoDoMandato, fim: string): string {
  if (momento.fase === 'antes') {
    return momento.dias === 1
      ? 'Falta 1 dia para a posse'
      : `Faltam ${numero.format(momento.dias)} dias para a posse`;
  }
  if (momento.fase === 'depois') {
    return `Mandato encerrado em ${fim.split('-').reverse().join('/')}`;
  }
  return `Dia ${numero.format(momento.dias)} de ${numero.format(momento.total)} do mandato`;
}
