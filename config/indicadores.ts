/**
 * Indicadores exibidos em cada painel: o que é, unidade, fonte (com link) e como coletar.
 * Os códigos das séries e tabelas ficam em config/fontes.ts (regra 2); aqui só há referências.
 * Os dados coletados ficam em data/<abrangencia>/indicadores/<id>.json.
 */
import type { Unidade } from '../src/lib/formatar.ts';
import type { Periodicidade } from '../src/lib/periodos.ts';
import { fontes } from './fontes.ts';

export type Tema =
  'Economia' | 'Contas públicas' | 'Segurança' | 'Saúde' | 'Educação' | 'Transporte';

export type Coleta =
  | {
      tipo: 'bcb';
      fonte: { serie: number };
      // 'fim-do-mes': série diária reduzida ao valor do último dia de cada mês.
      amostragem: 'mensal' | 'fim-do-mes';
      inverterSinal?: boolean;
    }
  | {
      tipo: 'ibge';
      fonte: { tabela: number; variavel: number; localidade: string; classificacao?: string };
    }
  | { tipo: 'siconfi-resultado-primario'; fonte: { anexo: string; ente: number; esfera: string } }
  | {
      tipo: 'siconfi-divida-rcl';
      fonte: { anexo: string; ente: number; esfera: string; poder: string };
    }
  | { tipo: 'seade'; fonte: { url: string }; colunaFiltro: string; colunaValor: string }
  | { tipo: 'infosiga'; fonte: { url: string } }
  // Atualizado à mão: o robô não mexe no arquivo.
  | { tipo: 'manual' };

export interface Indicador {
  id: string;
  abrangencia: 'brasil' | 'sp';
  tema: Tema;
  titulo: string;
  descricao: string;
  unidade: Unidade;
  casas: number;
  periodicidade: Periodicidade;
  variacao: 'pontos-percentuais' | 'percentual' | 'diferenca';
  fonte: { nome: string; url: string };
  nota?: string;
  coleta: Coleta;
}

const BCB = 'https://dadosabertos.bcb.gov.br/dataset/';
const SIDRA = 'https://sidra.ibge.gov.br/tabela/';
const DOC_SICONFI = 'https://apidatalake.tesouro.gov.br/docs/siconfi/';
const IDEB = {
  fonte: {
    nome: 'INEP, IDEB 2025, resultados por UF (rede estadual)',
    url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados',
  },
  nota: 'Valores copiados à mão do arquivo oficial do INEP (divulgacao_regioes_ufs_ideb_2025.xlsx, linha São Paulo, rede Estadual, colunas VL_OBSERVADO). O IDEB sai a cada 2 anos.',
} as const;

export const indicadores: Indicador[] = [
  // ----- Brasil -----
  {
    id: 'selic',
    abrangencia: 'brasil',
    tema: 'Economia',
    titulo: 'Taxa básica de juros (meta Selic)',
    descricao:
      'Meta da taxa Selic definida pelo Copom: valor vigente no último dia de cada mês (no mês atual, o vigente hoje).',
    unidade: '% a.a.',
    casas: 2,
    periodicidade: 'mensal',
    variacao: 'pontos-percentuais',
    fonte: {
      nome: 'Banco Central, SGS série 432',
      url: `${BCB}432-taxa-de-juros---meta-selic-definida-pelo-copom`,
    },
    coleta: { tipo: 'bcb', fonte: fontes.bcb.selicMeta, amostragem: 'fim-do-mes' },
  },
  {
    id: 'ipca-12m',
    abrangencia: 'brasil',
    tema: 'Economia',
    titulo: 'Inflação (IPCA) em 12 meses',
    descricao: 'Variação acumulada do IPCA nos 12 meses terminados no mês indicado.',
    unidade: '%',
    casas: 2,
    periodicidade: 'mensal',
    variacao: 'pontos-percentuais',
    fonte: { nome: 'IBGE, IPCA (tabela 1737)', url: `${SIDRA}1737` },
    coleta: { tipo: 'ibge', fonte: fontes.ibge.ipca12mBrasil },
  },
  {
    id: 'desocupacao',
    abrangencia: 'brasil',
    tema: 'Economia',
    titulo: 'Taxa de desocupação',
    descricao:
      'Taxa de desocupação na semana de referência, pessoas de 14 anos ou mais, em trimestre móvel.',
    unidade: '%',
    casas: 1,
    periodicidade: 'trimestre-movel',
    variacao: 'pontos-percentuais',
    fonte: { nome: 'IBGE, PNAD Contínua (tabela 6381)', url: `${SIDRA}6381` },
    coleta: { tipo: 'ibge', fonte: fontes.ibge.desocupacaoBrasil },
  },
  {
    id: 'rendimento',
    abrangencia: 'brasil',
    tema: 'Economia',
    titulo: 'Rendimento médio real do trabalho',
    descricao:
      'Rendimento médio mensal real habitual de todos os trabalhos, pessoas ocupadas de 14 anos ou mais, em trimestre móvel.',
    unidade: 'R$',
    casas: 0,
    periodicidade: 'trimestre-movel',
    variacao: 'percentual',
    fonte: { nome: 'IBGE, PNAD Contínua (tabela 6390)', url: `${SIDRA}6390` },
    coleta: { tipo: 'ibge', fonte: fontes.ibge.rendimentoBrasil },
  },
  {
    id: 'pib',
    abrangencia: 'brasil',
    tema: 'Economia',
    titulo: 'PIB: crescimento acumulado em 4 trimestres',
    descricao:
      'PIB a preços de mercado: taxa acumulada em quatro trimestres, em relação ao mesmo período do ano anterior.',
    unidade: '%',
    casas: 1,
    periodicidade: 'trimestral',
    variacao: 'pontos-percentuais',
    fonte: { nome: 'IBGE, Contas Nacionais Trimestrais (tabela 5932)', url: `${SIDRA}5932` },
    coleta: { tipo: 'ibge', fonte: fontes.ibge.pibBrasil },
  },
  {
    id: 'divida-bruta',
    abrangencia: 'brasil',
    tema: 'Contas públicas',
    titulo: 'Dívida bruta do governo geral',
    descricao: 'Dívida bruta do governo geral em % do PIB (metodologia usada a partir de 2008).',
    unidade: '% do PIB',
    casas: 2,
    periodicidade: 'mensal',
    variacao: 'pontos-percentuais',
    fonte: {
      nome: 'Banco Central, SGS série 13762',
      url: `${BCB}13762-divida-bruta-do-governo-geral--pib---metodologia-utilizada-a-partir-de-2008`,
    },
    coleta: { tipo: 'bcb', fonte: fontes.bcb.dividaBruta, amostragem: 'mensal' },
  },
  {
    id: 'resultado-primario',
    abrangencia: 'brasil',
    tema: 'Contas públicas',
    titulo: 'Resultado primário em 12 meses (Governo Federal e Banco Central)',
    descricao:
      'Resultado primário acumulado em 12 meses, em % do PIB. Positivo = superávit; negativo = déficit.',
    unidade: '% do PIB',
    casas: 2,
    periodicidade: 'mensal',
    variacao: 'pontos-percentuais',
    fonte: {
      nome: 'Banco Central, SGS série 5783',
      url: `${BCB}5783-nfsp-sem-desvalorizacao-cambial--pib---fluxo-acumulado-em-12-meses---resultado-primario---tota`,
    },
    nota: 'O Banco Central publica esta série como necessidade de financiamento, em que positivo significa déficit (Manual de Estatísticas Fiscais do BC). Aqui o sinal foi invertido para que positivo signifique superávit.',
    coleta: {
      tipo: 'bcb',
      fonte: fontes.bcb.resultadoPrimario,
      amostragem: 'mensal',
      inverterSinal: true,
    },
  },

  // ----- São Paulo -----
  {
    id: 'desocupacao',
    abrangencia: 'sp',
    tema: 'Economia',
    titulo: 'Taxa de desocupação',
    descricao:
      'Taxa de desocupação na semana de referência, pessoas de 14 anos ou mais, por trimestre (o recorte por estado só existe por trimestre).',
    unidade: '%',
    casas: 1,
    periodicidade: 'trimestral',
    variacao: 'pontos-percentuais',
    fonte: { nome: 'IBGE, PNAD Contínua trimestral (tabela 4099)', url: `${SIDRA}4099` },
    coleta: { tipo: 'ibge', fonte: fontes.ibge.desocupacaoSp },
  },
  {
    id: 'rendimento',
    abrangencia: 'sp',
    tema: 'Economia',
    titulo: 'Rendimento médio real do trabalho',
    descricao:
      'Rendimento médio mensal real habitual de todos os trabalhos, pessoas ocupadas de 14 anos ou mais, por trimestre.',
    unidade: 'R$',
    casas: 0,
    periodicidade: 'trimestral',
    variacao: 'percentual',
    fonte: { nome: 'IBGE, PNAD Contínua trimestral (tabela 5436)', url: `${SIDRA}5436` },
    coleta: { tipo: 'ibge', fonte: fontes.ibge.rendimentoSp },
  },
  {
    id: 'ipca-12m-rmsp',
    abrangencia: 'sp',
    tema: 'Economia',
    titulo: 'Inflação (IPCA) em 12 meses na Região Metropolitana de São Paulo',
    descricao:
      'Variação acumulada do IPCA em 12 meses na Região Metropolitana de São Paulo (não existe IPCA para o estado inteiro).',
    unidade: '%',
    casas: 2,
    periodicidade: 'mensal',
    variacao: 'pontos-percentuais',
    fonte: { nome: 'IBGE, IPCA por região metropolitana (tabela 7060)', url: `${SIDRA}7060` },
    coleta: { tipo: 'ibge', fonte: fontes.ibge.ipca12mRmsp },
  },
  {
    id: 'atividade',
    abrangencia: 'sp',
    tema: 'Economia',
    titulo: 'Índice de atividade econômica (IBCR-SP)',
    descricao:
      'Índice de Atividade Econômica Regional do Banco Central para São Paulo, com ajuste sazonal. Não é o PIB: o PIB estadual do IBGE sai com cerca de 3 anos de atraso.',
    unidade: 'índice',
    casas: 2,
    periodicidade: 'mensal',
    variacao: 'percentual',
    fonte: { nome: 'Banco Central, SGS série 25394', url: `${BCB}25394-sgs` },
    coleta: { tipo: 'bcb', fonte: fontes.bcb.ibcrSp, amostragem: 'mensal' },
  },
  {
    id: 'resultado-primario',
    abrangencia: 'sp',
    tema: 'Contas públicas',
    titulo: 'Resultado primário do estado no ano',
    descricao:
      'Resultado primário com RPPS (previdência dos servidores), acima da linha, acumulado no ano. Positivo = superávit; negativo = déficit. O ano corrente é parcial.',
    unidade: 'R$',
    casas: 0,
    periodicidade: 'anual',
    variacao: 'diferenca',
    fonte: { nome: 'Tesouro Nacional, SICONFI (RREO, Anexo 06)', url: DOC_SICONFI },
    coleta: { tipo: 'siconfi-resultado-primario', fonte: fontes.siconfi.resultadoPrimarioSp },
  },
  {
    id: 'divida-rcl',
    abrangencia: 'sp',
    tema: 'Contas públicas',
    titulo: 'Dívida consolidada líquida em relação à receita',
    descricao:
      'Dívida consolidada líquida em % da receita corrente líquida ajustada, Poder Executivo, ao fim de cada quadrimestre.',
    unidade: '% da RCL',
    casas: 2,
    periodicidade: 'quadrimestral',
    variacao: 'pontos-percentuais',
    fonte: { nome: 'Tesouro Nacional, SICONFI (RGF, Anexo 02)', url: DOC_SICONFI },
    coleta: { tipo: 'siconfi-divida-rcl', fonte: fontes.siconfi.dividaRclSp },
  },
  {
    id: 'homicidios',
    abrangencia: 'sp',
    tema: 'Segurança',
    titulo: 'Vítimas de homicídio doloso',
    descricao: 'Número de vítimas de homicídio doloso no estado, por ano.',
    unidade: 'vítimas',
    casas: 0,
    periodicidade: 'anual',
    variacao: 'percentual',
    fonte: {
      nome: 'Secretaria da Segurança Pública, via Fundação Seade',
      url: 'https://repositorio.seade.gov.br/dataset/objetivo-estrategico-3-seguranca',
    },
    coleta: {
      tipo: 'seade',
      fonte: fontes.seade.homicidioDoloso,
      colunaFiltro: 'gid_ra',
      colunaValor: 'n_homic_dol',
    },
  },
  {
    id: 'mortalidade-infantil',
    abrangencia: 'sp',
    tema: 'Saúde',
    titulo: 'Taxa de mortalidade infantil',
    descricao: 'Óbitos de menores de 1 ano por mil nascidos vivos, no estado, por ano.',
    unidade: 'por mil nascidos vivos',
    casas: 1,
    periodicidade: 'anual',
    variacao: 'diferenca',
    fonte: {
      nome: 'Fundação Seade',
      url: 'https://repositorio.seade.gov.br/dataset/objetivo-estrategico-2-saude',
    },
    coleta: {
      tipo: 'seade',
      fonte: fontes.seade.mortalidadeInfantil,
      colunaFiltro: 'cod_ibge',
      colunaValor: 'tx_mtdd_i_tot',
    },
  },
  {
    id: 'transito-mortes',
    abrangencia: 'sp',
    tema: 'Transporte',
    titulo: 'Mortes no trânsito em 12 meses',
    descricao:
      'Soma das mortes em sinistros de trânsito ocorridos nos 12 meses terminados no mês indicado.',
    unidade: 'mortes',
    casas: 0,
    periodicidade: 'mensal',
    variacao: 'percentual',
    fonte: {
      nome: 'Detran-SP, Infosiga',
      url: 'https://dadosabertos.sp.gov.br/dataset/pessoas-envolvidas-em-sinistros',
    },
    nota: 'Uma morte pode ser registrada dias depois do sinistro; por isso o mês mais recente é preliminar e pode aumentar.',
    coleta: { tipo: 'infosiga', fonte: fontes.infosiga.pessoasEnvolvidas },
  },
  {
    id: 'ideb-anos-iniciais',
    abrangencia: 'sp',
    tema: 'Educação',
    titulo: 'IDEB da rede estadual: anos iniciais do fundamental',
    descricao: 'Índice de Desenvolvimento da Educação Básica (0 a 10), 1º ao 5º ano.',
    unidade: 'índice',
    casas: 1,
    periodicidade: 'bienal',
    variacao: 'diferenca',
    ...IDEB,
    coleta: { tipo: 'manual' },
  },
  {
    id: 'ideb-anos-finais',
    abrangencia: 'sp',
    tema: 'Educação',
    titulo: 'IDEB da rede estadual: anos finais do fundamental',
    descricao: 'Índice de Desenvolvimento da Educação Básica (0 a 10), 6º ao 9º ano.',
    unidade: 'índice',
    casas: 1,
    periodicidade: 'bienal',
    variacao: 'diferenca',
    ...IDEB,
    coleta: { tipo: 'manual' },
  },
  {
    id: 'ideb-ensino-medio',
    abrangencia: 'sp',
    tema: 'Educação',
    titulo: 'IDEB da rede estadual: ensino médio',
    descricao: 'Índice de Desenvolvimento da Educação Básica (0 a 10), ensino médio.',
    unidade: 'índice',
    casas: 1,
    periodicidade: 'bienal',
    variacao: 'diferenca',
    ...IDEB,
    coleta: { tipo: 'manual' },
  },
];
