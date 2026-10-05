/**
 * Fontes de dados verificadas (regra 2 do projeto).
 *
 * Nenhum código entra aqui sem: (1) uma chamada real à fonte, (2) uma amostra salva em
 * tests/fixtures/ quando a resposta é pequena o bastante e (3) a data da verificação.
 * Pegadinhas de cada fonte: docs/fase-0-planejamento.md, seção 3.
 */
export const fontes = {
  // Banco Central, SGS: https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados?formato=json
  bcb: {
    selicMeta: {
      serie: 432,
      descricao: 'Taxa de juros - Meta Selic definida pelo Copom (% a.a., diária)',
      nota: 'Traz datas futuras, até a próxima reunião do Copom: descartar datas depois de hoje.',
      verificadoEm: '2026-10-04',
    },
    dividaBruta: {
      serie: 13762,
      descricao:
        'Dívida bruta do governo geral (% PIB) - Metodologia utilizada a partir de 2008 (mensal)',
      verificadoEm: '2026-10-04',
    },
    resultadoPrimario: {
      serie: 5783,
      descricao:
        'NFSP sem desvalorização cambial (% PIB) - Fluxo acumulado em 12 meses - Resultado primário - Total - Governo Federal e Banco Central (mensal)',
      nota: 'Convenção NFSP: positivo = déficit (indício nos dados de jan/2025; confirmar na nota metodológica do BC antes da Fase 2).',
      verificadoEm: '2026-10-04',
    },
    ibcrSp: {
      serie: 25394,
      descricao:
        'Índice de Atividade Econômica Regional - São Paulo - IBCR-SP - com ajuste sazonal (índice, mensal)',
      verificadoEm: '2026-10-04',
    },
  },

  // IBGE, API de agregados v3:
  // https://servicodados.ibge.gov.br/api/v3/agregados/{tabela}/periodos/{periodos}/variaveis/{variavel}?localidades={localidade}
  ibge: {
    ipca12mBrasil: {
      tabela: 1737,
      variavel: 2265,
      localidade: 'N1[all]',
      descricao: 'IPCA - Variação acumulada em 12 meses, Brasil (%)',
      verificadoEm: '2026-10-04',
    },
    ipcaNumeroIndice: {
      tabela: 1737,
      variavel: 2266,
      localidade: 'N1[all]',
      descricao:
        'IPCA - Número-índice, base dezembro de 1993 = 100 (para corrigir valores pela inflação)',
      verificadoEm: '2026-10-04',
    },
    desocupacaoBrasil: {
      tabela: 6381,
      variavel: 4099,
      localidade: 'N1[all]',
      descricao: 'Taxa de desocupação, trimestre móvel, Brasil (PNAD Contínua mensal, %)',
      nota: 'Período 202608 = trimestre jun-jul-ago 2026.',
      verificadoEm: '2026-10-04',
    },
    rendimentoBrasil: {
      tabela: 6390,
      variavel: 5933,
      localidade: 'N1[all]',
      descricao:
        'Rendimento médio mensal real habitual de todos os trabalhos, trimestre móvel, Brasil (R$)',
      verificadoEm: '2026-10-04',
    },
    pibBrasil: {
      tabela: 5932,
      variavel: 6562,
      localidade: 'N1[all]',
      classificacao: '11255[90707]',
      descricao: 'PIB a preços de mercado - Taxa acumulada em quatro trimestres (%)',
      verificadoEm: '2026-10-04',
    },
    desocupacaoSp: {
      tabela: 4099,
      variavel: 4099,
      localidade: 'N3[35]',
      descricao: 'Taxa de desocupação, trimestral, São Paulo (PNAD Contínua trimestral, %)',
      verificadoEm: '2026-10-04',
    },
    rendimentoSp: {
      tabela: 5436,
      variavel: 5933,
      localidade: 'N3[35]',
      classificacao: '2[6794]',
      descricao:
        'Rendimento médio mensal real habitual de todos os trabalhos, trimestral, São Paulo (R$; sexo = Total)',
      verificadoEm: '2026-10-04',
    },
    ipca12mRmsp: {
      tabela: 7060,
      variavel: 2265,
      localidade: 'N7[3501]',
      classificacao: '315[7169]',
      descricao:
        'IPCA - Variação acumulada em 12 meses, Região Metropolitana de São Paulo, índice geral (%)',
      verificadoEm: '2026-10-04',
    },
  },

  // Tesouro Nacional, SICONFI: https://apidatalake.tesouro.gov.br/ords/siconfi/tt/{relatorio}
  siconfi: {
    gastosPorFuncaoUniao: {
      relatorio: 'rreo',
      anexo: 'RREO-Anexo 02',
      esfera: 'U',
      ente: 1,
      descricao: 'Despesa por função da União (bimestral)',
      nota: "Usar só o rótulo 'Total das Despesas Exceto Intra-Orçamentárias'.",
      verificadoEm: '2026-10-04',
    },
    gastosPorFuncaoSp: {
      relatorio: 'rreo',
      anexo: 'RREO-Anexo 02',
      esfera: 'E',
      ente: 35,
      descricao: 'Despesa por função do estado de São Paulo (bimestral)',
      nota: "Usar só o rótulo 'Total das Despesas Exceto Intra-Orçamentárias'.",
      verificadoEm: '2026-10-04',
    },
    resultadoPrimarioSp: {
      relatorio: 'rreo',
      anexo: 'RREO-Anexo 06',
      esfera: 'E',
      ente: 35,
      descricao: 'Resultado primário do estado de São Paulo (bimestral)',
      nota: 'No RREO, positivo = superávit.',
      verificadoEm: '2026-10-04',
    },
    dividaRclSp: {
      relatorio: 'rgf',
      anexo: 'RGF-Anexo 02',
      esfera: 'E',
      ente: 35,
      poder: 'E',
      descricao:
        'Dívida consolidada líquida em % da receita corrente líquida, Poder Executivo de São Paulo (quadrimestral)',
      verificadoEm: '2026-10-04',
    },
  },

  // Portal da Transparência: exige chave no cabeçalho HTTP `chave-api-dados` (Fase 4).
  transparencia: {
    despesasPorOrgao: {
      url: 'https://api.portaldatransparencia.gov.br/api-de-dados/despesas/por-orgao',
      descricao: 'Despesas anuais por órgão do Poder Executivo Federal',
      nota: 'Os valores vêm como texto; o formato exato só será confirmado com a chave.',
      verificadoEm: '2026-10-04',
    },
  },

  // TSE: arquivos oficiais de dados abertos. Baixar só com autorização (Fase 3).
  tse: {
    planosDeGovernoBrasil: {
      url: 'https://cdn.tse.jus.br/estatistica/sead/odsele/proposta_governo/proposta_governo_2026_BR.zip',
      descricao: 'Propostas de governo de abrangência nacional, eleições 2026 (18,3 MB)',
      verificadoEm: '2026-10-04',
    },
    planosDeGovernoSp: {
      url: 'https://cdn.tse.jus.br/estatistica/sead/odsele/proposta_governo/proposta_governo_2026_SP.zip',
      descricao: 'Propostas de governo de São Paulo, eleições 2026 (13,6 MB)',
      verificadoEm: '2026-10-04',
    },
    candidatos: {
      url: 'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip',
      descricao: 'Lista de candidatos das eleições 2026 (3,2 MB)',
      verificadoEm: '2026-10-04',
    },
  },

  // Detran-SP, Infosiga, no portal de dados abertos de SP (licença CC BY 4.0).
  infosiga: {
    pessoasEnvolvidas: {
      url: 'https://dadosabertos.sp.gov.br/api/3/action/package_show?id=pessoas-envolvidas-em-sinistros',
      descricao: 'Pessoas envolvidas em sinistros de trânsito em SP: um CSV por mês desde jan/2015',
      nota: 'CSV com ; e codificação Windows-1252. Ler o link atual no catálogo: os links têm assinatura com validade.',
      verificadoEm: '2026-10-04',
    },
  },

  // INEP: IDEB (sai a cada 2 anos; atualizado à mão).
  inep: {
    idebUfs2025: {
      url: 'https://download.inep.gov.br/ideb/resultados/divulgacao_regioes_ufs_ideb_2025.zip',
      descricao: 'IDEB 2025 por região e UF (0,76 MB, publicado em 05/08/2026)',
      verificadoEm: '2026-10-04',
    },
  },

  // Senado: processos legislativos (Fase 5).
  senado: {
    processos: {
      url: 'https://legis.senado.leg.br/dadosabertos/processo',
      descricao:
        'Processos legislativos do Senado (substituto do endpoint /materia, descontinuado)',
      verificadoEm: '2026-10-04',
    },
  },
} as const;
