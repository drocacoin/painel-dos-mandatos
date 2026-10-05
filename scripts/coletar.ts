/**
 * Coleta os dados automáticos e grava em data/<abrangencia>/:
 * - indicadores/<id>.json, um arquivo por indicador;
 * - gastos/por-funcao.json, a despesa por função de governo de cada painel.
 *
 * Regra 3 do projeto: só grava se o dado novo passou na validação, não está vazio e não
 * encolheu. Se uma coleta falhar, as outras continuam, o arquivo dela fica intacto e o
 * processo termina com erro (no GitHub, o workflow fica vermelho e abre uma issue).
 *
 * Uso: npm run coletar                     → tudo
 *      npm run coletar -- sp/homicidios    → só os indicados (abrangencia/id)
 *      npm run coletar -- sp/gastos        → só os gastos de um painel
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { z } from 'zod';
import { gastos } from '../config/gastos.ts';
import { indicadores, type Indicador } from '../config/indicadores.ts';
import { hojeEmBrasilia, isoEmBrasilia } from '../src/lib/formatar.ts';
import { periodoValido } from '../src/lib/periodos.ts';
import {
  arquivoGastosSchema,
  arquivoIndicadorSchema,
  mandatosSchema,
  type AnoDeGastos,
  type ArquivoGastos,
  type ArquivoIndicador,
  type Mandato,
  type Ponto,
} from '../src/lib/schemas.ts';
import { coletarBcb } from './coletores/bcb.ts';
import type { Contexto, Janela } from './coletores/comum.ts';
import { coletarIbge } from './coletores/ibge.ts';
import { coletarInfosiga } from './coletores/infosiga.ts';
import { coletarSeade } from './coletores/seade.ts';
import { coletarGastosPorFuncao, coletarSiconfi } from './coletores/siconfi.ts';

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

export const caminhoDosGastos = (abrangencia: string) =>
  `data/${abrangencia}/gastos/por-funcao.json`;

/** Histórico: a partir de janeiro do ano 4 anos antes do início do mandato. */
const janelaDo = (mandato: Mandato, hoje: string): Janela => ({
  inicio: `${Number(mandato.inicio.slice(0, 4)) - 4}-01-01`,
  hoje,
});

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

/** Motivos para NÃO gravar os gastos novos. Lista vazia = pode gravar. */
export function problemasDosGastos(
  novos: AnoDeGastos[],
  anteriores: AnoDeGastos[] | null,
): string[] {
  const problemas: string[] = [];
  if (novos.length === 0) problemas.push('nenhum ano coletado');
  novos.forEach((ano, i) => {
    const antes = novos[i - 1];
    if (antes && antes.ano >= ano.ano) {
      problemas.push(`anos fora de ordem ou repetidos em ${ano.ano}`);
    }
  });
  for (const salvo of anteriores ?? []) {
    const novo = novos.find((a) => a.ano === salvo.ano);
    if (!novo) {
      problemas.push(
        `o ano ${salvo.ano} sumiu da coleta: dado bom não é substituído por dado incompleto`,
      );
    } else if (novo.bimestre < salvo.bimestre) {
      problemas.push(
        `${salvo.ano}: o último bimestre voltou do ${salvo.bimestre}º para o ${novo.bimestre}º`,
      );
    }
  }
  return problemas;
}

export interface Armazenamento {
  ler: (indicador: Indicador) => Promise<ArquivoIndicador | null>;
  gravar: (indicador: Indicador, arquivo: ArquivoIndicador) => Promise<void>;
}

export interface ArmazenamentoDeGastos {
  ler: (abrangencia: string) => Promise<ArquivoGastos | null>;
  gravar: (abrangencia: string, arquivo: ArquivoGastos) => Promise<void>;
}

export type Resultado =
  | { situacao: 'gravado'; pontos: number; ultimo: Ponto }
  | { situacao: 'sem-mudanca' }
  | { situacao: 'falhou'; motivo: string };

export type ResultadoDosGastos =
  | { situacao: 'gravado'; ultimo: AnoDeGastos }
  | { situacao: 'sem-mudanca' }
  | { situacao: 'falhou'; motivo: string };

const mensagemDe = (erro: unknown) => (erro instanceof Error ? erro.message : String(erro));

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
    return { situacao: 'falhou', motivo: mensagemDe(erro) };
  }
}

/** Coleta os gastos de um painel e decide se grava. Nunca lança erro: devolve o resultado. */
export async function processarGastos(
  abrangencia: string,
  armazenamento: ArmazenamentoDeGastos,
  coletor: () => Promise<AnoDeGastos[]>,
  agora = new Date(),
): Promise<ResultadoDosGastos> {
  try {
    const anterior = await armazenamento.ler(abrangencia);
    const anos = await coletor();
    const problemas = problemasDosGastos(anos, anterior?.anos ?? null);
    if (problemas.length > 0) return { situacao: 'falhou', motivo: problemas.join('; ') };
    if (anterior && JSON.stringify(anterior.anos) === JSON.stringify(anos)) {
      return { situacao: 'sem-mudanca' };
    }
    const ultimo = anos[anos.length - 1];
    if (!ultimo) return { situacao: 'falhou', motivo: 'nenhum ano coletado' };
    const arquivo = arquivoGastosSchema.parse({ atualizadoEm: isoEmBrasilia(agora), anos });
    await armazenamento.gravar(abrangencia, arquivo);
    return { situacao: 'gravado', ultimo };
  } catch (erro) {
    return { situacao: 'falhou', motivo: mensagemDe(erro) };
  }
}

/** Lê um arquivo de dados já salvo. null = ainda não existe. Arquivo inválido é erro. */
async function lerArquivo<T>(caminho: string, schema: z.ZodType<T>): Promise<T | null> {
  let texto: string;
  try {
    texto = await readFile(caminho, 'utf-8');
  } catch {
    return null; // ainda não existe
  }
  const resultado = schema.safeParse(JSON.parse(texto));
  if (!resultado.success) throw new Error(`o arquivo salvo ${caminho} é inválido: corrija à mão`);
  return resultado.data;
}

async function gravarArquivo(caminho: string, dados: unknown) {
  await mkdir(dirname(caminho), { recursive: true });
  await writeFile(caminho, `${JSON.stringify(dados, null, 2)}\n`, 'utf-8');
}

const armazenamentoEmDisco: Armazenamento = {
  ler: (indicador) => lerArquivo(caminhoDoArquivo(indicador), arquivoIndicadorSchema),
  gravar: (indicador, arquivo) => gravarArquivo(caminhoDoArquivo(indicador), arquivo),
};

const gastosEmDisco: ArmazenamentoDeGastos = {
  ler: (abrangencia) => lerArquivo(caminhoDosGastos(abrangencia), arquivoGastosSchema),
  gravar: (abrangencia, arquivo) => gravarArquivo(caminhoDosGastos(abrangencia), arquivo),
};

async function main(pedidos: string[]) {
  const mandatos = mandatosSchema.parse(
    JSON.parse(await readFile('config/mandatos.json', 'utf-8')),
  );
  const hoje = hojeEmBrasilia();
  const pedido = (nome: string) => pedidos.length === 0 || pedidos.includes(nome);
  const alvos = indicadores.filter(
    (i) => i.coleta.tipo !== 'manual' && pedido(`${i.abrangencia}/${i.id}`),
  );
  const alvosDeGastos = gastos.filter((g) => pedido(`${g.abrangencia}/gastos`));

  let falhas = 0;
  const falhou = (nome: string, motivo: string) => {
    falhas++;
    console.error(`✗ ${nome}: ${motivo}`);
  };

  for (const indicador of alvos) {
    const nome = `${indicador.abrangencia}/${indicador.id}`;
    const mandato = mandatos.find((m) => m.abrangencia === indicador.abrangencia);
    if (!mandato || indicador.coleta.tipo === 'manual') continue;
    const resultado = await processarIndicador(
      indicador,
      janelaDo(mandato, hoje),
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
      falhou(nome, resultado.motivo);
    }
  }

  for (const { abrangencia, fonte } of alvosDeGastos) {
    const nome = `${abrangencia}/gastos`;
    const mandato = mandatos.find((m) => m.abrangencia === abrangencia);
    if (!mandato) continue;
    const resultado = await processarGastos(abrangencia, gastosEmDisco, () =>
      coletarGastosPorFuncao(fonte, janelaDo(mandato, hoje)),
    );
    if (resultado.situacao === 'gravado') {
      const { ultimo } = resultado;
      console.log(`✓ ${nome}: até ${ultimo.ano}, ${ultimo.bimestre}º bimestre`);
    } else if (resultado.situacao === 'sem-mudanca') {
      console.log(`= ${nome}: sem mudança`);
    } else {
      falhou(nome, resultado.motivo);
    }
  }

  console.log(`\n${alvos.length + alvosDeGastos.length} coletas, ${falhas} com falha.`);
  if (falhas > 0) process.exitCode = 1;
}

// Roda só quando chamado pela linha de comando (não quando os testes importam este arquivo).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
