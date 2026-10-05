/**
 * Promessas: formato de cada arquivo (data/<painel>/promessas/P0001.json), validação e placar.
 *
 * Regra 6 do projeto: o status só muda por edição humana do arquivo, e toda entrada do
 * histórico precisa de justificativa e de pelo menos um link de fonte. Arquivo fora das
 * regras faz o build e os testes falharem, então o CI não deixa publicar.
 */
import { z } from 'zod';
import { indicadores } from '../../config/indicadores';
import { STATUS, TEMAS_PROMESSAS, TIPOS_DE_FONTE, type Status } from '../../config/promessas';
import { hojeEmBrasilia } from './formatar';

const dataIso = z.iso.date();

const entradaDoHistorico = z.object({
  data: dataIso,
  status: z.enum(STATUS),
  justificativa: z.string().trim().min(20, 'explique a mudança (pelo menos 20 caracteres)'),
  fontes: z.array(z.url()).min(1, 'toda entrada precisa de pelo menos um link de fonte'),
});

export const promessaSchema = z
  .object({
    id: z.string().regex(/^P\d{4}$/, 'use P seguido de 4 dígitos, ex.: P0001'),
    resumo: z.string().trim().min(10),
    // Citação exata do documento de origem.
    texto: z.string().trim().min(10),
    tema: z.enum(TEMAS_PROMESSAS),
    fonte: z.object({
      tipo: z.enum(TIPOS_DE_FONTE),
      titulo: z.string().trim().min(3),
      url: z.url(),
      data: dataIso,
      pagina: z.number().int().positive().optional(),
    }),
    mensuravel: z.boolean(),
    meta: z.string().trim().min(3).nullable(),
    // Indicador do painel ligado à promessa, no formato "painel/id" (ex.: "sp/homicidios").
    indicador: z.string().nullable(),
    prazo: dataIso.nullable(),
    historico: z.array(entradaDoHistorico).min(1, 'o histórico precisa de pelo menos uma entrada'),
  })
  .refine((p) => !p.mensuravel || p.meta !== null, {
    message: 'promessa mensurável precisa de meta',
    path: ['meta'],
  })
  .refine(
    (p) => p.historico.every((h, i) => i === 0 || (p.historico[i - 1]?.data ?? '') <= h.data),
    { message: 'o histórico precisa estar em ordem de data', path: ['historico'] },
  );

export type Promessa = z.infer<typeof promessaSchema>;

/** O status atual é sempre o da última entrada do histórico. */
export const statusAtual = (promessa: Promessa): Status =>
  promessa.historico[promessa.historico.length - 1]?.status ?? 'nao-iniciada';

/**
 * Valida o conteúdo de um arquivo de promessa. Além do formato, confere que o id é o nome
 * do arquivo, que o indicador ligado existe e que nenhuma data do histórico está no futuro.
 */
export function validarPromessa(
  bruto: unknown,
  caminho: string,
  hoje = hojeEmBrasilia(),
): Promessa {
  const resultado = promessaSchema.safeParse(bruto);
  if (!resultado.success) {
    const problemas = resultado.error.issues.map((p) => `${p.path.join('.')}: ${p.message}`);
    throw new Error(`${caminho} inválido: ${problemas.join('; ')}`);
  }
  const promessa = resultado.data;
  const nomeDoArquivo = caminho.split('/').at(-1)?.replace('.json', '');
  if (promessa.id !== nomeDoArquivo) {
    throw new Error(`${caminho}: o id "${promessa.id}" precisa ser igual ao nome do arquivo`);
  }
  if (
    promessa.indicador !== null &&
    !indicadores.some((i) => `${i.abrangencia}/${i.id}` === promessa.indicador)
  ) {
    throw new Error(`${caminho}: o indicador "${promessa.indicador}" não existe`);
  }
  const futura = promessa.historico.find((h) => h.data > hoje);
  if (futura) throw new Error(`${caminho}: data no futuro no histórico (${futura.data})`);
  return promessa;
}

const arquivos = import.meta.glob<unknown>('../../data/*/promessas/*.json', {
  eager: true,
  import: 'default',
});

/** Promessas publicadas de um painel, em ordem de id. */
export function carregarPromessas(abrangencia: string): Promessa[] {
  const prefixo = `../../data/${abrangencia}/promessas/`;
  return Object.entries(arquivos)
    .filter(([caminho]) => caminho.startsWith(prefixo))
    .map(([caminho, bruto]) => validarPromessa(bruto, caminho))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Quantas promessas há em cada status, na ordem fixa dos status. */
export function placar(promessas: Promessa[]) {
  const total = promessas.length;
  return STATUS.map((status) => {
    const quantidade = promessas.filter((p) => statusAtual(p) === status).length;
    return { status, quantidade, percentual: total === 0 ? 0 : (quantidade / total) * 100 };
  });
}
