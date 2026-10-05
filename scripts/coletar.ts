/**
 * Coleta os indicadores automáticos e grava em data/<abrangencia>/indicadores/<id>.json.
 *
 * Regra 3 do projeto: só grava se a série nova passou na validação, não está vazia e não
 * encolheu. Se um indicador falhar, os outros continuam, o arquivo dele fica intacto e o
 * processo termina com erro (no GitHub, o workflow fica vermelho e abre uma issue).
 *
 * Uso: npm run coletar                     → todos
 *      npm run coletar -- sp/homicidios    → só os indicados (abrangencia/id)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { indicadores, type Indicador } from '../config/indicadores.ts';
import { hojeEmBrasilia, isoEmBrasilia } from '../src/lib/formatar.ts';
import { periodoValido } from '../src/lib/periodos.ts';
import {
  arquivoIndicadorSchema,
  mandatosSchema,
  type ArquivoIndicador,
  type Ponto,
} from '../src/lib/schemas.ts';
import { coletarBcb } from './coletores/bcb.ts';
import type { Contexto, Janela } from './coletores/comum.ts';
import { coletarIbge } from './coletores/ibge.ts';
import { coletarInfosiga } from './coletores/infosiga.ts';
import { coletarSeade } from './coletores/seade.ts';
import { coletarSiconfi } from './coletores/siconfi.ts';

type Coletor = (contexto: Contexto) => Promise<Ponto[]>;

const COLETORES: Record<Exclude<Indicador['coleta']['tipo'], 'manual'>, Coletor> = {
  bcb: coletarBcb,
  ibge: coletarIbge,
  'siconfi-resultado-primario': coletarSiconfi,
  'siconfi-divida-rcl': coletarSiconfi,
  seade: coletarSeade,
  infosiga: coletarInfosiga,
};

export const caminhoDoArquivo = (indicador: Indicador) =>
  `data/${indicador.abrangencia}/indicadores/${indicador.id}.json`;

/** Motivos para NÃO gravar a série nova. Lista vazia = pode gravar. */
export function problemasDaSerie(
  nova: Ponto[],
  anterior: Ponto[] | null,
  indicador: Indicador,
): string[] {
  const problemas: string[] = [];
  if (nova.length === 0) problemas.push('série vazia');
  nova.forEach((ponto, i) => {
    if (!periodoValido(ponto.periodo, indicador.periodicidade)) {
      problemas.push(`período "${ponto.periodo}" fora do formato de ${indicador.periodicidade}`);
    }
    if (!Number.isFinite(ponto.valor)) problemas.push(`valor inválido em ${ponto.periodo}`);
    const antes = nova[i - 1];
    if (antes && antes.periodo >= ponto.periodo) {
      problemas.push(`períodos fora de ordem ou repetidos em ${ponto.periodo}`);
    }
  });
  if (anterior && nova.length < anterior.length) {
    problemas.push(
      `a série nova tem ${nova.length} pontos e a salva tem ${anterior.length}: dado bom não é substituído por dado incompleto`,
    );
  }
  return problemas;
}

export interface Armazenamento {
  ler: (indicador: Indicador) => Promise<ArquivoIndicador | null>;
  gravar: (indicador: Indicador, arquivo: ArquivoIndicador) => Promise<void>;
}

export type Resultado =
  | { situacao: 'gravado'; pontos: number; ultimo: Ponto }
  | { situacao: 'sem-mudanca' }
  | { situacao: 'falhou'; motivo: string };

/** Coleta um indicador e decide se grava. Nunca lança erro: devolve o resultado. */
export async function processarIndicador(
  indicador: Indicador,
  janela: Janela,
  armazenamento: Armazenamento,
  coletor: Coletor,
  agora = new Date(),
): Promise<Resultado> {
  try {
    const anterior = await armazenamento.ler(indicador);
    const serie = await coletor({ indicador, janela, anterior: anterior?.serie ?? null });
    const problemas = problemasDaSerie(serie, anterior?.serie ?? null, indicador);
    if (problemas.length > 0) return { situacao: 'falhou', motivo: problemas.join('; ') };
    if (anterior && JSON.stringify(anterior.serie) === JSON.stringify(serie)) {
      return { situacao: 'sem-mudanca' };
    }
    const ultimo = serie[serie.length - 1];
    if (!ultimo) return { situacao: 'falhou', motivo: 'série vazia' };
    const arquivo = arquivoIndicadorSchema.parse({ atualizadoEm: isoEmBrasilia(agora), serie });
    await armazenamento.gravar(indicador, arquivo);
    return { situacao: 'gravado', pontos: serie.length, ultimo };
  } catch (erro) {
    return { situacao: 'falhou', motivo: erro instanceof Error ? erro.message : String(erro) };
  }
}

const armazenamentoEmDisco: Armazenamento = {
  async ler(indicador) {
    let texto: string;
    try {
      texto = await readFile(caminhoDoArquivo(indicador), 'utf-8');
    } catch {
      return null; // ainda não existe
    }
    const resultado = arquivoIndicadorSchema.safeParse(JSON.parse(texto));
    if (!resultado.success) {
      throw new Error(`o arquivo salvo ${caminhoDoArquivo(indicador)} é inválido: corrija à mão`);
    }
    return resultado.data;
  },
  async gravar(indicador, arquivo) {
    const caminho = caminhoDoArquivo(indicador);
    await mkdir(dirname(caminho), { recursive: true });
    await writeFile(caminho, `${JSON.stringify(arquivo, null, 2)}\n`, 'utf-8');
  },
};

async function main(pedidos: string[]) {
  const mandatos = mandatosSchema.parse(
    JSON.parse(await readFile('config/mandatos.json', 'utf-8')),
  );
  const hoje = hojeEmBrasilia();
  const alvos = indicadores.filter(
    (i) =>
      i.coleta.tipo !== 'manual' &&
      (pedidos.length === 0 || pedidos.includes(`${i.abrangencia}/${i.id}`)),
  );

  let falhas = 0;
  for (const indicador of alvos) {
    const nome = `${indicador.abrangencia}/${indicador.id}`;
    const mandato = mandatos.find((m) => m.abrangencia === indicador.abrangencia);
    if (!mandato || indicador.coleta.tipo === 'manual') continue;
    // Histórico: a partir de janeiro do ano 4 anos antes do início do mandato.
    const janela = { inicio: `${Number(mandato.inicio.slice(0, 4)) - 4}-01-01`, hoje };
    const resultado = await processarIndicador(
      indicador,
      janela,
      armazenamentoEmDisco,
      COLETORES[indicador.coleta.tipo],
    );
    if (resultado.situacao === 'gravado') {
      const { ultimo } = resultado;
      console.log(
        `✓ ${nome}: ${resultado.pontos} pontos, último ${ultimo.periodo} = ${ultimo.valor}`,
      );
    } else if (resultado.situacao === 'sem-mudanca') {
      console.log(`= ${nome}: sem mudança`);
    } else {
      falhas++;
      console.error(`✗ ${nome}: ${resultado.motivo}`);
    }
  }

  console.log(`\n${alvos.length} indicadores, ${falhas} com falha.`);
  if (falhas > 0) process.exitCode = 1;
}

// Roda só quando chamado pela linha de comando (não quando os testes importam este arquivo).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
