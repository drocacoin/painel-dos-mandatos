/**
 * Gastos de cada painel: despesa liquidada por função de governo (SICONFI, RREO Anexo 02).
 * Os códigos verificados ficam em config/fontes.ts (regra 2).
 *
 * Decisões de 05/10/2026: valor liquidado (sai a cada 2 meses; o "pago" por função só é
 * publicado uma vez por ano) e correção pela inflação com o IPCA.
 */
import { fontes } from './fontes.ts';

export const gastos = [
  {
    abrangencia: 'brasil',
    ente: 'governo federal (União)',
    fonte: fontes.siconfi.gastosPorFuncaoUniao,
  },
  {
    abrangencia: 'sp',
    ente: 'governo do estado de São Paulo',
    fonte: fontes.siconfi.gastosPorFuncaoSp,
  },
] as const;

export const FONTE_DOS_GASTOS = {
  nome: 'Tesouro Nacional, SICONFI (RREO, Anexo 02)',
  url: 'https://apidatalake.tesouro.gov.br/docs/siconfi/',
};

// Áreas com gráfico próprio na página: as mesmas dos temas dos indicadores. Todas as
// funções aparecem na tabela.
export const FUNCOES_EM_DESTAQUE = ['Saúde', 'Educação', 'Segurança Pública', 'Transporte'];
