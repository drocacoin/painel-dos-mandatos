import type { Indicador } from '../../config/indicadores.ts';
import type { Ponto } from '../../src/lib/schemas.ts';
import { ErroDeColeta, type Dependencias } from '../http.ts';

/** Período coletado: do início do histórico (4 anos antes do mandato) até hoje. AAAA-MM-DD. */
export interface Janela {
  inicio: string;
  hoje: string;
}

export interface Contexto {
  indicador: Indicador;
  janela: Janela;
  /** Série já salva (ou null se ainda não existe). Alguns coletores evitam baixar de novo. */
  anterior: Ponto[] | null;
  deps?: Dependencias;
}

/**
 * Lê CSV separado por ";". Recusa aspas e linhas com número errado de colunas: nas fontes
 * verificadas isso não acontece, e um ";" dentro de aspas mudaria os dados sem aviso.
 */
export function lerCsv(texto: string): Record<string, string>[] {
  if (texto.includes('"')) throw new ErroDeColeta('CSV com aspas: formato não suportado', true);
  // Alguns arquivos começam com a marca BOM do UTF-8 (código 0xFEFF): ela é descartada.
  const semBom = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
  const linhas = semBom.split(/\r?\n/).filter((linha) => linha.trim() !== '');
  const [cabecalho, ...resto] = linhas;
  if (!cabecalho) throw new ErroDeColeta('CSV vazio', true);
  const colunas = cabecalho.split(';');
  return resto.map((linha, i) => {
    const campos = linha.split(';');
    if (campos.length !== colunas.length) {
      throw new ErroDeColeta(
        `CSV: a linha ${i + 2} tem ${campos.length} colunas, o cabeçalho tem ${colunas.length}`,
        true,
      );
    }
    return Object.fromEntries(colunas.map((coluna, j) => [coluna, campos[j] ?? '']));
  });
}

/** "5,89" → 5.89; "2527" → 2527. Vazio ou símbolo → null. Nunca vira zero. */
export function numeroBr(texto: string): number | null {
  const limpo = texto.trim();
  return /^-?\d+(,\d+)?$/.test(limpo) ? Number(limpo.replace(',', '.')) : null;
}

/** "AAAA-MM" de n meses antes (n pode ser negativo). */
export function somarMeses(mes: string, n: number): string {
  const total = Number(mes.slice(0, 4)) * 12 + Number(mes.slice(5, 7)) - 1 + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}
