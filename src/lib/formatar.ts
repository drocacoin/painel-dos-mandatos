const FUSO_BRASILIA = 'America/Sao_Paulo';

/** "2027-01-05" → "05/01/2027". Só troca a ordem do texto: data de calendário não tem fuso. */
export function formatarData(iso: string): string {
  return iso.split('-').reverse().join('/');
}

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_BRASILIA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Um instante → "04/10/2026 às 21:34", sempre no horário de Brasília. */
export function formatarDataHora(instante: Date): string {
  const p = Object.fromEntries(
    formatoDataHora.formatToParts(instante).map((parte) => [parte.type, parte.value]),
  );
  return `${p.day}/${p.month}/${p.year} às ${p.hour}:${p.minute}`;
}

const formatoIso = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_BRASILIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'longOffset',
});

/** Um instante → "2026-10-04T21:34:00-03:00": data e hora de Brasília, com o fuso explícito. */
export function isoEmBrasilia(instante: Date): string {
  const p = Object.fromEntries(
    formatoIso.formatToParts(instante).map((parte) => [parte.type, parte.value]),
  );
  const fuso = p.timeZoneName === 'GMT' ? '+00:00' : (p.timeZoneName ?? '').replace('GMT', '');
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${fuso}`;
}

/** A data de hoje em Brasília (AAAA-MM-DD), mesmo quando o computador está em UTC. */
export const hojeEmBrasilia = (instante = new Date()) => isoEmBrasilia(instante).slice(0, 10);

export type Unidade =
  | '%'
  | '% a.a.'
  | '% do PIB'
  | '% da RCL'
  | 'R$'
  | 'índice'
  | 'vítimas'
  | 'mortes'
  | 'medidas provisórias'
  | 'projetos'
  | 'por mil nascidos vivos';

// Unidades de contagem no singular: "1 vítima", e não "1 vítimas".
const SINGULAR: Partial<Record<Unidade, string>> = {
  vítimas: 'vítima',
  mortes: 'morte',
  'medidas provisórias': 'medida provisória',
  projetos: 'projeto',
};

const numero = (casas: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 2 });

/** 4.22 em % → "4,22%"; 8459480549 em R$ → "R$ 8,46 bi"; 2527 vítimas → "2.527 vítimas". */
export function formatarValor(valor: number, unidade: Unidade, casas: number): string {
  if (unidade === 'R$') {
    const sinal = valor < 0 ? '-' : '';
    const absoluto = Math.abs(valor);
    return `${sinal}R$ ${absoluto >= 1e6 ? compacto.format(absoluto) : numero(casas).format(absoluto)}`;
  }
  if (unidade === 'índice') return numero(casas).format(valor);
  if (unidade.startsWith('%')) return `${numero(casas).format(valor)}${unidade}`;
  const nome = valor === 1 ? (SINGULAR[unidade] ?? unidade) : unidade;
  return `${numero(casas).format(valor)} ${nome}`;
}

/** Número curto para o eixo dos gráficos: "4%", "R$ 5 bi", "5,9 mil". Sem unidade por extenso. */
export function formatarEixo(valor: number, unidade: Unidade, casas: number): string {
  if (unidade === 'R$') return formatarValor(valor, unidade, 0);
  // Marcas redondas do eixo (14, 16) saem sem casas decimais: "14%", não "14,00%".
  const decimais = Number.isInteger(valor) ? 0 : casas;
  const texto = Math.abs(valor) >= 1e4 ? compacto.format(valor) : numero(decimais).format(valor);
  return unidade.startsWith('%') ? `${texto}%` : texto;
}

/** Variação com sinal explícito: "+0,4 p.p.", "-3,9%", "+R$ 1,2 bi". Zero sai sem sinal. */
export function formatarVariacao(
  variacao: number,
  tipo: 'pontos-percentuais' | 'percentual' | 'diferenca',
  unidade: Unidade,
  casas: number,
): string {
  const sinal = variacao > 0 ? '+' : variacao < 0 ? '-' : '';
  const absoluto = Math.abs(variacao);
  if (tipo === 'pontos-percentuais') return `${sinal}${numero(casas).format(absoluto)} p.p.`;
  if (tipo === 'percentual') return `${sinal}${numero(1).format(absoluto)}%`;
  return `${sinal}${formatarValor(absoluto, unidade, casas)}`;
}
