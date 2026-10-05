/**
 * Página de metodologia: transforma config/fontes.ts (o arquivo único de códigos verificados,
 * regra 2) numa tabela para quem lê o site.
 */
import { fontes } from '../../config/fontes';

const INSTITUICOES: Record<string, string> = {
  bcb: 'Banco Central (SGS)',
  ibge: 'IBGE (API de agregados)',
  siconfi: 'Tesouro Nacional (SICONFI)',
  transparencia: 'Portal da Transparência',
  tse: 'Tribunal Superior Eleitoral',
  infosiga: 'Detran-SP (Infosiga)',
  inep: 'INEP',
  seade: 'Fundação Seade',
  senado: 'Senado Federal',
  camara: 'Câmara dos Deputados',
};

// Verificadas, mas sem uso no site (decisão de 05/10/2026: gastos só por função).
const FORA_DO_SITE = new Set(['transparencia']);

export interface LinhaDeFonte {
  instituicao: string;
  descricao: string;
  /** Código da série ou tabela, quando a fonte é consultada por código. */
  codigo: string | null;
  /** Endereço, quando a fonte é consultada por endereço. */
  url: string | null;
  verificadoEm: string;
}

/** "série 432"; "tabela 1737, variável 2265, N1[all]"; "RREO-Anexo 02, ente 35". */
export function codigoDaFonte(item: Record<string, unknown>): string | null {
  if (typeof item.serie === 'number') return `série ${item.serie}`;
  if (typeof item.tabela === 'number') {
    const partes = [`tabela ${item.tabela}`, `variável ${String(item.variavel)}`];
    partes.push(String(item.localidade));
    if (typeof item.classificacao === 'string') partes.push(`classificação ${item.classificacao}`);
    return partes.join(', ');
  }
  if (typeof item.anexo === 'string') return `${item.anexo}, ente ${String(item.ente)}`;
  return null;
}

/** Todas as fontes usadas pelo site, na ordem de config/fontes.ts. */
export function fontesDoSite(): LinhaDeFonte[] {
  return Object.entries(fontes)
    .filter(([grupo]) => !FORA_DO_SITE.has(grupo))
    .flatMap(([grupo, itens]) =>
      Object.values(itens as Record<string, Record<string, unknown>>).map((item) => ({
        instituicao: INSTITUICOES[grupo] ?? grupo,
        descricao: String(item.descricao),
        codigo: codigoDaFonte(item),
        url: typeof item.url === 'string' ? item.url : null,
        verificadoEm: String(item.verificadoEm),
      })),
    );
}
