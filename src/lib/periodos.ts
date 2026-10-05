// Períodos de referência guardados como texto, um formato por periodicidade:
//   mensal e trimestre-movel: AAAA-MM (no trimestre móvel, o mês final: 2026-08 = jun-jul-ago)
//   trimestral: AAAA-T1..T4 · quadrimestral: AAAA-Q1..Q3 · anual e bienal: AAAA
export type Periodicidade =
  'mensal' | 'trimestre-movel' | 'trimestral' | 'quadrimestral' | 'anual' | 'bienal';

const FORMATOS: Record<Periodicidade, RegExp> = {
  mensal: /^\d{4}-(0[1-9]|1[0-2])$/,
  'trimestre-movel': /^\d{4}-(0[1-9]|1[0-2])$/,
  trimestral: /^\d{4}-T[1-4]$/,
  quadrimestral: /^\d{4}-Q[1-3]$/,
  anual: /^\d{4}$/,
  bienal: /^\d{4}$/,
};

/** Meses cobertos pelos relatórios bimestrais (RREO) até cada bimestre; o 6º é o ano inteiro. */
export const MESES_ATE_O_BIMESTRE = ['jan-fev', 'jan-abr', 'jan-jun', 'jan-ago', 'jan-out'];

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const nomeDoMes = (mes: number) => MESES[(mes + 11) % 12] ?? '?';

export const periodoValido = (periodo: string, periodicidade: Periodicidade) =>
  FORMATOS[periodicidade].test(periodo);

/** Último mês (1 a 12) coberto pelo período. */
function mesFinal(periodo: string, periodicidade: Periodicidade): number {
  switch (periodicidade) {
    case 'mensal':
    case 'trimestre-movel':
      return Number(periodo.slice(5, 7));
    case 'trimestral':
      return Number(periodo.slice(6)) * 3;
    case 'quadrimestral':
      return Number(periodo.slice(6)) * 4;
    default:
      return 12;
  }
}

/** Último dia do período (AAAA-MM-DD). Diz se o período terminou antes do início do mandato. */
export function fimDoPeriodo(periodo: string, periodicidade: Periodicidade): string {
  const ano = Number(periodo.slice(0, 4));
  const mes = mesFinal(periodo, periodicidade);
  // Dia 0 do mês seguinte é o último dia deste mês. UTC só para a conta, sem fuso envolvido.
  const dia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Rótulo em português. "longo" para textos, "curto" para os eixos dos gráficos. */
export function rotuloPeriodo(
  periodo: string,
  periodicidade: Periodicidade,
  formato: 'longo' | 'curto' = 'longo',
): string {
  const ano = periodo.slice(0, 4);
  const anoCurto = ano.slice(2);
  const mes = mesFinal(periodo, periodicidade);
  switch (periodicidade) {
    case 'mensal':
      return formato === 'curto' ? `${nomeDoMes(mes)}/${anoCurto}` : `${nomeDoMes(mes)}/${ano}`;
    case 'trimestre-movel':
      return formato === 'curto'
        ? `${nomeDoMes(mes)}/${anoCurto}`
        : `${nomeDoMes(mes - 2)}-${nomeDoMes(mes - 1)}-${nomeDoMes(mes)} ${ano}`;
    case 'trimestral':
      return `${mes / 3}º tri/${formato === 'curto' ? anoCurto : ano}`;
    case 'quadrimestral':
      return formato === 'curto'
        ? `${mes / 4}º quadr./${anoCurto}`
        : `${mes / 4}º quadrimestre de ${ano}`;
    default:
      return ano;
  }
}
