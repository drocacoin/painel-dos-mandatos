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
