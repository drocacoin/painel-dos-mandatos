/**
 * Gera um RASCUNHO de promessas a partir do PDF de um plano de governo, para revisão humana.
 *
 * - Copia trechos literais (frases) com a página e a seção de origem. Não resume nem reescreve.
 * - Lista só as frases com sinais de compromisso: verbos no futuro terminados em "-remos"
 *   (ampliaremos, implementaremos) e as palavras de PALAVRAS_DE_COMPROMISSO.
 * - A saída vai para rascunhos/, que o git ignora: nada daqui é publicado no site.
 *
 * Uso: npm run rascunho -- <arquivo.pdf> <painel> [link da fonte]
 *      ex.: npm run rascunho -- rascunhos/plano-sp.pdf sp https://cdn.tse.jus.br/...zip
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { extractText } from 'unpdf';
import { formatarDataHora } from '../src/lib/formatar.ts';

// Palavras que costumam marcar compromissos, além dos verbos em "-remos". Edite à vontade.
export const PALAVRAS_DE_COMPROMISSO = ['vamos', 'iremos', 'será', 'serão', 'meta', 'compromisso'];
// Palavras terminadas em "-remos" que não são verbo no futuro ("queremos" é presente).
const NAO_SAO_VERBOS = new Set(['extremos', 'supremos', 'remos', 'queremos']);

export interface Trecho {
  pagina: number;
  secao: string | null;
  texto: string;
  marcas: string[];
}

const NUMERO_DE_PAGINA = /^\d{1,3}$/;
const FIM_DE_FRASE = /[.!?;:]$/;

/** Título de seção: linha curta toda em maiúsculas (ex.: "1.4 RECUPERA SP"). */
const ehTitulo = (linha: string) => {
  const letras = linha.replace(/[^\p{L}]/gu, '');
  return letras.length >= 3 && linha.length <= 80 && letras === letras.toUpperCase();
};

/** Junta as linhas de uma página (quebradas pela diagramação) em frases. */
export function frasesDaPagina(texto: string): { secao: string | null; texto: string }[] {
  const frases: { secao: string | null; texto: string }[] = [];
  let secao: string | null = null;
  let paragrafo = '';
  const fecharParagrafo = () => {
    for (const frase of paragrafo.split(/(?<=[.!?])\s+(?=[\p{Lu}0-9])/u)) {
      if (frase.trim().length >= 40) frases.push({ secao, texto: frase.trim() });
    }
    paragrafo = '';
  };
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha || NUMERO_DE_PAGINA.test(linha)) continue;
    if (ehTitulo(linha)) {
      fecharParagrafo();
      secao = linha;
      continue;
    }
    // Palavra quebrada no fim da linha: junta sem espaço e mantém o hífen (o revisor confere).
    if (!paragrafo) paragrafo = linha;
    else paragrafo += paragrafo.endsWith('-') ? linha : ` ${linha}`;
    if (FIM_DE_FRASE.test(linha)) fecharParagrafo();
  }
  fecharParagrafo();
  return frases;
}

/** Sinais de compromisso encontrados na frase (minúsculas, sem repetição). */
export function marcasDeCompromisso(frase: string): string[] {
  const palavras = frase.toLowerCase().match(/\p{L}+/gu) ?? [];
  const marcas = palavras.filter(
    (p) => PALAVRAS_DE_COMPROMISSO.includes(p) || (p.endsWith('remos') && !NAO_SAO_VERBOS.has(p)),
  );
  return [...new Set(marcas)];
}

/** Trechos candidatos de todas as páginas, na ordem do documento. */
export function trechosCandidatos(paginas: string[]): Trecho[] {
  return paginas.flatMap((texto, i) =>
    frasesDaPagina(texto)
      .map((frase) => ({ pagina: i + 1, ...frase, marcas: marcasDeCompromisso(frase.texto) }))
      .filter((trecho) => trecho.marcas.length > 0),
  );
}

export function gerarMarkdown(dados: {
  painel: string;
  arquivo: string;
  sha256: string;
  fonte: string;
  totalDePaginas: number;
  paginasSemTexto: number[];
  trechos: Trecho[];
  geradoEm: Date;
}): string {
  const linhas = [
    `# Rascunho de promessas: ${dados.painel}`,
    '',
    `- **Arquivo:** ${dados.arquivo} (${dados.totalDePaginas} páginas)`,
    `- **SHA-256 do arquivo:** ${dados.sha256}`,
    `- **Fonte:** ${dados.fonte}`,
    `- **Gerado em:** ${formatarDataHora(dados.geradoEm)} (horário de Brasília)`,
    `- **Trechos candidatos:** ${dados.trechos.length}`,
    '',
    '> **Rascunho para revisão humana.** Cada trecho é uma cópia literal do texto extraído do PDF, com a página de origem. Confira no PDF antes de usar: a extração junta as linhas da diagramação e pode errar em palavras quebradas. Nada daqui é publicado no site. Um trecho só vira promessa depois que uma pessoa revisa e preenche resumo, tema e a primeira entrada do histórico.',
    '',
    `**Páginas sem texto** (provavelmente imagem; conferir à mão): ${dados.paginasSemTexto.join(', ') || 'nenhuma'}`,
  ];
  let paginaAtual = 0;
  dados.trechos.forEach((trecho, i) => {
    if (trecho.pagina !== paginaAtual) {
      paginaAtual = trecho.pagina;
      linhas.push('', `## Página ${paginaAtual}`);
    }
    linhas.push(
      '',
      `**#${i + 1}**${trecho.secao ? ` · seção: ${trecho.secao}` : ''} · sinais: ${trecho.marcas.join(', ')}`,
      '',
      `> ${trecho.texto}`,
    );
  });
  return `${linhas.join('\n')}\n`;
}

async function main([arquivo, painel, fonte = '(informe o link da fonte)']: string[]) {
  if (!arquivo || !painel) {
    console.error('Uso: npm run rascunho -- <arquivo.pdf> <painel> [link da fonte]');
    process.exitCode = 1;
    return;
  }
  const bytes = await readFile(arquivo);
  const { totalPages, text } = await extractText(new Uint8Array(bytes), { mergePages: false });
  const paginasSemTexto = text.flatMap((t, i) => (t.trim().length < 20 ? [i + 1] : []));
  const trechos = trechosCandidatos(text);
  const saida = `rascunhos/${painel}-promessas-rascunho.md`;
  await mkdir('rascunhos', { recursive: true });
  await writeFile(
    saida,
    gerarMarkdown({
      painel,
      arquivo: basename(arquivo),
      sha256: createHash('sha256').update(bytes).digest('hex'),
      fonte,
      totalDePaginas: totalPages,
      paginasSemTexto,
      trechos,
      geradoEm: new Date(),
    }),
    'utf-8',
  );
  console.log(
    `${trechos.length} trechos candidatos em ${totalPages} páginas (${paginasSemTexto.length} sem texto). Rascunho: ${saida}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
