import { z } from 'zod';

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
