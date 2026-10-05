import { z } from 'zod';
import { TEMAS_PROMESSAS as FUNCOES_DE_GOVERNO } from '../../config/promessas.ts';

// Data de calendário (AAAA-MM-DD) guardada como texto, nunca como Date, para não sofrer
// com fuso horário. O Zod recusa datas que não existem, como 2027-02-30.
const dataIso = z.iso.date();

const fonte = z.object({
  nome: z.string().min(1),
  url: z.url(),
});

export const mandatoSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'use só letras minúsculas, números e hífen'),
    // Vira o endereço do painel no site: /brasil/, /sp/
    abrangencia: z.string().regex(/^[a-z]+$/, 'use só letras minúsculas'),
    nomeAbrangencia: z.string().min(1),
    cargo: z.string().min(1),
    inicio: dataIso,
    fim: dataIso,
    // Ficam null até o TSE oficializar o resultado da eleição.
    eleito: z.string().min(1).nullable(),
    partido: z.string().min(1).nullable(),
    fonteDatas: fonte,
  })
  // Datas AAAA-MM-DD podem ser comparadas como texto.
  .refine((m) => m.inicio < m.fim, {
    message: 'o fim do mandato precisa ser depois do início',
    path: ['fim'],
  })
  .refine((m) => (m.eleito === null) === (m.partido === null), {
    message: 'eleito e partido são preenchidos juntos',
    path: ['partido'],
  });

export const mandatosSchema = z
  .array(mandatoSchema)
  .min(1)
  .refine((ms) => new Set(ms.map((m) => m.abrangencia)).size === ms.length, {
    message: 'cada abrangência só pode aparecer uma vez',
  })
  .refine((ms) => new Set(ms.map((m) => m.id)).size === ms.length, {
    message: 'cada id só pode aparecer uma vez',
  });

export type Mandato = z.infer<typeof mandatoSchema>;

// Arquivo de dados de um indicador (data/<abrangencia>/indicadores/<id>.json).
// Só dados: nome, unidade e fonte ficam em config/indicadores.ts.
export const arquivoIndicadorSchema = z.object({
  // Quando o valor mudou pela última vez (horário de Brasília, com fuso).
  atualizadoEm: z.iso.datetime({ offset: true }),
  serie: z
    .array(
      z.object({
        periodo: z.string(),
        valor: z.number(),
        // Ex.: "jan-ago" (ano incompleto) ou "preliminar". Pontos com nota não entram na
        // comparação com o início do mandato.
        nota: z.string().min(1).optional(),
      }),
    )
    .min(1, 'a série não pode estar vazia'),
});

export type ArquivoIndicador = z.infer<typeof arquivoIndicadorSchema>;
export type Ponto = ArquivoIndicador['serie'][number];

// Gastos de um painel (data/<abrangencia>/gastos/por-funcao.json): despesa liquidada por
// função de governo, em reais correntes, como o SICONFI publica. A correção pela inflação
// é feita no site, com o IPCA mais recente.
const anoDeGastos = z.object({
  ano: z.number().int(),
  // Último bimestre publicado no ano: 6 = ano inteiro; 4 = janeiro a agosto.
  bimestre: z.number().int().min(1).max(6),
  total: z.number(),
  funcoes: z
    .array(z.object({ funcao: z.enum(FUNCOES_DE_GOVERNO), liquidado: z.number() }))
    .min(1, 'o ano precisa de pelo menos uma função'),
});

export const arquivoGastosSchema = z.object({
  atualizadoEm: z.iso.datetime({ offset: true }),
  anos: z.array(anoDeGastos).min(1, 'a lista de anos não pode estar vazia'),
});

export type ArquivoGastos = z.infer<typeof arquivoGastosSchema>;
export type AnoDeGastos = z.infer<typeof anoDeGastos>;

// Congresso (data/brasil/congresso/): listas copiadas das fontes oficiais, com a situação atual
// de cada item no texto oficial. O resumo da situação é feito no site (config/congresso.ts).
const medidaProvisoria = z.object({
  identificacao: z.string().regex(/^MPV \d+\/\d{4}$/, 'formato "MPV 1333/2026"'),
  codigoMateria: z.number().int(),
  data: dataIso,
  ementa: z.string().min(1),
  // Texto oficial da situação; o Senado às vezes não informa (null).
  situacao: z.string().min(1).nullable(),
  // Só existe depois da decisão: aprovada, perda de eficácia, revogada.
  deliberacao: z.string().min(1).nullable(),
  tramitando: z.boolean(),
});

const projetoDeLei = z.object({
  identificacao: z.string().regex(/^(PL|PLP|PEC) \d+\/\d{4}$/, 'formato "PL 1087/2025"'),
  id: z.number().int(),
  data: dataIso,
  ementa: z.string().min(1),
  // A Câmara às vezes não informa a situação (null).
  codSituacao: z.number().int().nullable(),
  situacao: z.string().min(1).nullable(),
});

const listaComData = <T extends z.ZodType>(item: T) =>
  z.object({
    atualizadoEm: z.iso.datetime({ offset: true }),
    itens: z.array(item).min(1, 'a lista não pode estar vazia'),
  });

export const arquivoMedidasSchema = listaComData(medidaProvisoria);
export const arquivoProjetosSchema = listaComData(projetoDeLei);

export type MedidaProvisoria = z.infer<typeof medidaProvisoria>;
export type ProjetoDeLei = z.infer<typeof projetoDeLei>;
