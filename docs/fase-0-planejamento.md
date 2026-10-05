# Fase 0: Planejamento

**Projeto:** painel público de acompanhamento dos mandatos do presidente da República e do governador de São Paulo (2027–2031)
**Data:** 04/10/2026 · **Situação:** Fases 0 a 5 concluídas (promessas de SP, gastos e Congresso em 05/10/2026), ver README
**Pasta:** `E:\painel-dos-mandatos` · **Repositório:** `drocacoin/painel-dos-mandatos`

Nesta fase não escrevi código. Criei só este documento e as amostras reais das APIs em `tests/fixtures/` (regra 2).

---

## 1. Resumo

- Testei as 6 fontes com chamadas reais:
  - **5 responderam:** Banco Central, IBGE, Tesouro (SICONFI), Senado e TSE.
  - **Portal da Transparência:** exige a sua chave. O endpoint e os campos estão confirmados na especificação oficial.
  - **Câmara:** nem o site nem a API responderam a partir daqui hoje.
- Salvei **16 respostas reais** em `tests/fixtures/`, entre elas 7 casos de erro ou resposta vazia. Elas viram os testes dos coletores. A origem de cada uma está em [`tests/fixtures/README.md`](../tests/fixtures/README.md).
- Três fatos mudam o projeto:
  1. O mandato vai de **05/01/2027 a 05/01/2031**, e não de 1º de janeiro. Isso vem da Emenda Constitucional 111/2021.
  2. **Hoje é o 1º turno.** O eleito pode só ser conhecido no 2º turno, em 25/10. As promessas (Fase 3) dependem disso; as Fases 1 e 2 não.
  3. O Banco Central às vezes responde **com status 200 ("deu certo") e uma página HTML de erro** no lugar dos dados. Sem validação, o coletor gravaria lixo achando que funcionou. A regra 3 (Zod) existe exatamente para isso.
- **Atualização, governo de SP:** a seu pedido, o projeto passa a incluir o governador de SP e uma visão do estado.
  - O mandato do governador vai de **06/01/2027 a 06/01/2031**.
  - Verifiquei as fontes de SP com chamadas reais (seção 3.9) e salvei mais 7 amostras, somando 23.
  - A estrutura passa a aceitar vários mandatos (seção 4).
- **Decisões que você tomou** (seção 8):
  - repositório público `painel-dos-mandatos` na conta `drocacoin`;
  - licenças MIT (código) e CC BY 4.0 (conteúdo);
  - SP no nível do estado inteiro;
  - temas extras de SP: segurança, saúde, educação e transporte;
  - **visões de Brasil e SP separadas**.
- Verifiquei os 4 temas extras (seção 3.10). Transporte e educação têm fonte de resultado. Segurança e saúde, por enquanto, têm só os dados de gastos.
- Falta só o seu OK para começar a Fase 1 (seção 10).

---

## 2. Datas do mandato (confirmadas em texto oficial)

| Fato | Data | Base legal |
|---|---|---|
| Início do mandato | **05/01/2027** | CF art. 82, na redação da EC 111/2021: "terá início em 5 de janeiro do ano seguinte ao de sua eleição". O art. 5º da EC diz que isso vale a partir das eleições de 2026. |
| Fim do mandato | **05/01/2031** (posse do sucessor) | CF art. 82: mandato de 4 anos |
| Fim do mandato atual | 05/01/2027 | EC 111/2021, art. 4º |
| 1º turno | 04/10/2026 (hoje) | CF art. 77: primeiro domingo de outubro |
| 2º turno, se houver | 25/10/2026 | CF art. 77: último domingo de outubro |
| Início do mandato do governador de SP | **06/01/2027** | CF art. 28, na redação da EC 111/2021: "a posse ocorrerá em 6 de janeiro do ano subsequente" |
| Fim do mandato do governador de SP | **06/01/2031** | CF art. 28: mandato de 4 anos |

A eleição para governador acontece nas mesmas datas de 1º e 2º turno (CF art. 28).

Texto da emenda: <https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc111.htm>

Enquanto o TSE não oficializar os resultados, o `config/mandatos.json` terá as datas acima e os campos dos eleitos vazios ("a definir").

---

## 3. Verificação das fontes

### 3.1 Visão geral

| Fonte | Situação | Uso proposto | Ponto de atenção |
|---|---|---|---|
| Banco Central (SGS) | ✅ funciona | Selic, dívida bruta, resultado primário | Erros às vezes chegam com status 200 em HTML |
| IBGE (API de agregados v3) | ✅ funciona | IPCA, desocupação, rendimento, PIB | Período ainda não divulgado volta como lista vazia |
| Portal da Transparência | ⚠️ falta a chave | Gastos por órgão e por função | Valores em reais vêm como texto |
| Tesouro: SICONFI | ✅ funciona | Opcional | O sinal do resultado é o oposto do usado pelo BC |
| Tesouro Transparente | ⚠️ | Não recomendo | Só planilha XLSX; a "API" do catálogo não tem documentação acessível |
| Câmara | ❌ fora do ar hoje | Fase 5 | Retestar antes da Fase 5 |
| Senado | ✅ funciona | Fase 5 | O endpoint antigo foi descontinuado; usar `/processo` |
| TSE | ✅ funciona | Plano de governo (Fase 3) | Usar o arquivo oficial de dados abertos |
| Fontes do estado de SP | ✅ IBGE, BC, SICONFI, TSE · ❌ ALESP hoje · ⚠️ SSP e Seade | Visão de SP | Detalhes na seção 3.9 |

### 3.2 Banco Central (SGS) ✅

**Endpoint:** `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{código}/dados?formato=json&dataInicial=dd/MM/aaaa&dataFinal=dd/MM/aaaa`
**Formato:** `[{"data":"01/08/2026","valor":"-0.32"}]`. A data vem como dd/MM/aaaa e o valor vem como **texto**, com ponto decimal.

Séries confirmadas. O nome, a unidade e a periodicidade foram lidos no serviço de metadados do próprio BC em 04/10/2026:

| Código | Nome oficial | Unidade | Periodicidade | Proposta |
|---|---|---|---|---|
| 432 | Taxa de juros – Meta Selic definida pelo Copom | % a.a. | diária | Selic |
| 13762 | Dívida bruta do governo geral (% PIB) – Metodologia utilizada a partir de 2008 | % | mensal | Dívida bruta |
| 5783 | NFSP sem desvalorização cambial (% PIB) – Fluxo acumulado em 12 meses – Resultado primário – Total – Governo Federal e Banco Central | % | mensal | Resultado primário |
| 433 e 13522 | IPCA: variação mensal e variação em 12 meses | % | mensal | **Não usar.** São cópias de números do IBGE; uso o IBGE direto, que é a fonte primária. Os valores de ago/2026 batem nas duas fontes. |

**Comportamentos encontrados** (todos têm amostra salva):

1. Séries diárias aceitam **no máximo 10 anos por consulta**. Acima disso, vem erro 406 em JSON.
2. `ultimos/N` aceita N de no máximo 20. Acima disso, vem erro 400 em JSON. Os dois erros têm formatos de JSON diferentes.
3. Um código de série inexistente devolve **status 200 com uma página HTML** "Requisição inválida!".
4. Com pedidos seguidos (cerca de 15 em um minuto), às vezes veio **a mesma página HTML, com status 200**. O mesmo pedido funcionou segundos depois. As duas páginas são idênticas, mudando só o número do erro, então não dá para saber se o código está errado ou se foi um bloqueio temporário. Com 4 segundos entre os pedidos, nenhum dos 5 pedidos seguintes recebeu a página de bloqueio.
   → Por isso o coletor vai espaçar os pedidos, conferir se a resposta é mesmo JSON e tentar de novo com espera crescente. Se o erro persistir, falha sem tocar no dado salvo.
5. A série 432 traz **datas no futuro**: o valor é repetido até a próxima reunião do Copom (hoje vai até 04/11/2026).
   → O coletor descarta datas depois de "hoje" no fuso America/Sao_Paulo.
6. A **ordem muda** de série para série: a 432 vem do mais antigo para o mais novo; a 13762 e a 5783, do mais novo para o mais antigo.
   → O coletor ordena sempre pela data.
7. O servidor do BC calcula "hoje" em **UTC**. Depois das 21h de Brasília, para ele já é o dia seguinte.
8. Resultado primário na convenção do BC (NFSP): **positivo = déficit**. A evidência vem dos próprios números: na série mensal 4639, janeiro de 2025, mês que costuma ter superávit, aparece como −83.149,89 (R$ milhões).
   → Vou confirmar isso na nota metodológica do BC antes da Fase 2. No site, o sinal será explicado ao lado do número.

### 3.3 IBGE ✅

**Endpoint escolhido:** a API de agregados v3, que devolve um JSON mais simples que a API SIDRA clássica:
`https://servicodados.ibge.gov.br/api/v3/agregados/{tabela}/periodos/{períodos}/variaveis/{variáveis}?localidades=N1[all]`
Os metadados de cada tabela ficam em `…/agregados/{tabela}/metadados`.

| Indicador | Tabela | Variável | Último dado em 04/10/2026 |
|---|---|---|---|
| IPCA, variação em 12 meses | 1737 | 2265 | 4,22% (ago/2026) |
| IPCA, variação mensal | 1737 | 63 | −0,32% (ago/2026) |
| IPCA, número-índice (para corrigir gastos pela inflação na Fase 4) | 1737 | 2266 | ago/2026 |
| Taxa de desocupação (PNAD Contínua, trimestre móvel) | 6381 | 4099 | 5,3% (jun-jul-ago 2026) |
| Rendimento médio mensal real habitual (trimestre móvel) | 6390 | 5933 | R$ 3.777 (jun-jul-ago 2026) |
| PIB, taxa acumulada em 4 trimestres | 5932, classificação 11255, categoria 90707 ("PIB a preços de mercado") | 6562 | 1,9% (2º trimestre 2026) |
| PIB, trimestre contra o trimestre anterior | 5932, mesma classificação | 6564 | 0,5% (2º trimestre 2026) |

**Comportamentos encontrados:**

1. Período ainda não divulgado → **status 200 com `[]`** (lista vazia).
   → Nunca gravar; manter o último dado.
2. Tabela inexistente → erro 500 em JSON.
3. Limite de **100.000 valores por consulta**, segundo a ajuda oficial da API SIDRA. As nossas consultas usam poucas centenas.
4. O campo de valor pode trazer **símbolos** em vez de número: `-` (zero absoluto), `X` (valor inibido), `..` (não se aplica), `...` (não disponível) e letras (faixas de valores).
   → Qualquer valor que não seja número é tratado como "sem dado", e o coletor falha. **Nunca vira zero.**
5. O código de período tem leituras diferentes conforme a tabela: `202608` é um mês no IPCA, mas na PNAD é o trimestre móvel terminado em agosto (rótulo oficial: "jun-jul-ago 2026"). Já `202602`, numa tabela trimestral, é o "2º trimestre 2026".
   → O rótulo exibido sai da configuração de cada série.

### 3.4 Portal da Transparência ⚠️ (falta a chave)

- Li a especificação oficial (OpenAPI) em <https://api.portaldatransparencia.gov.br/v3/api-docs>.
- Gastos por órgão: `GET /api-de-dados/despesas/por-orgao?ano=&orgaoSuperior=&orgao=&pagina=`
  Campos: `ano, orgao, codigoOrgao, orgaoSuperior, codigoOrgaoSuperior, empenhado, liquidado, pago`.
- Gastos por função: `GET /api-de-dados/despesas/por-funcional-programatica?ano=&funcao=&subfuncao=&programa=&acao=&pagina=`
  Campos: `ano, funcao, codigoFuncao, subfuncao, codigoSubfuncao, programa, codigoPrograma, acao, codigoAcao, empenhado, liquidado, pago`.
- A chave vai no cabeçalho HTTP **`chave-api-dados`**.
- Sem chave, a API responde 401, com o texto em **ISO-8859-1**. Se lido como UTF-8, os acentos quebram.
- `empenhado`, `liquidado` e `pago` são declarados como **texto**. O formato real (por exemplo, "1.234,56" ou "1234.56") só dá para confirmar com a chave, na Fase 4.
- Limites, conforme a página oficial de cadastro lida em 04/10/2026:
  - 400 pedidos por minuto das 6h às 23h59;
  - 700 por minuto da 0h às 6h;
  - os dois endpoints acima **não** estão na lista de "APIs restritas", que têm limite de 180 por minuto;
  - acima do limite, a chave é suspensa.
- A própria página recomenda as planilhas de dados abertos para volumes grandes. É o plano B se a API ficar lenta para vários anos.
- Os termos de uso da página dizem que a API é de "livre utilização", conforme o Decreto nº 8.777/2016.

### 3.5 Tesouro Nacional

**SICONFI ✅**
- Endpoint testado: `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2006&co_esfera=U&id_ente=1`
- Na lista oficial de entes, a União é `id_ente=1`, esfera `U`.
- Formato: `{ items: [{ exercicio, periodo, anexo, rotulo, coluna, cod_conta, conta, valor }], hasMore, count }`. Aqui `valor` já vem como número.

**Tesouro Transparente ⚠️**
- O Resultado do Tesouro Nacional existe só como planilha XLSX (atualizada em 27/08/2026). Ler XLSX exigiria mais uma biblioteca.
- A "API Séries Temporais" indicada no catálogo redireciona para uma página interna, sem documentação utilizável.
- Não recomendo esta fonte.

**Atenção: o "resultado primário de 2025" tem três números oficiais diferentes.**

| Fonte | Medida | 2025 | Convenção |
|---|---|---|---|
| BC, série 4639 (soma dos 12 meses) | NFSP, Governo Federal e Banco Central | R$ 58,7 bi | positivo = déficit |
| SICONFI, RREO Anexo 06 | Resultado primário "acima da linha", União | −R$ 61,7 bi | negativo = déficit |
| SICONFI, RREO Anexo 06 | Resultado primário "abaixo da linha", União | −R$ 22,3 bi | negativo = déficit |

As três indicam déficit, mas com valores e sinais diferentes, porque cada uma usa metodologia, abrangência e ajustes próprios. Mostrar mais de um número confunde quem lê.

**Proposta:** um só número principal, a série 5783 do BC. Os motivos: é mensal, está em % do PIB (comparável entre anos) e vem de uma API JSON simples. O sinal fica explicado na própria página.

### 3.6 Câmara ❌ (hoje)

Em 04/10/2026, por volta das 21h40, nem o site (`www.camara.leg.br`) nem a API (`dadosabertos.camara.leg.br`) responderam daqui (tempo esgotado ao conectar). Pode ser manutenção no dia da eleição. Vou testar de novo antes da Fase 5. Isso não bloqueia nada agora.

### 3.7 Senado ✅

- O endpoint antigo `/dadosabertos/materia/pesquisa/lista` ainda responde, mas o próprio servidor avisa nos cabeçalhos:
  - descontinuado desde 18/03/2025;
  - desligamento previsto para 01/02/2026 (a data já passou);
  - substituto: `/dadosabertos/processo`.
- O substituto funciona: `https://legis.senado.leg.br/dadosabertos/processo?sigla=MPV&ano=2025` devolve uma lista JSON com 46 itens.
- Campos úteis: `id`, `identificacao` ("MPV 1287/2025"), `ementa`, `autoria` ("Presidência da República"), `dataApresentacao`, `situacaoAtual`, `dataUltimaAtualizacao`.

### 3.8 TSE ✅

- O sistema DivulgaCandContas bloqueia acesso automatizado (403 "Access Denied", proteção Akamai). Não vou tentar contornar.
- O caminho oficial é o portal de dados abertos do TSE, conjunto **"Candidatos - 2026"**, publicado sob licença Creative Commons Atribuição:
  - `https://cdn.tse.jus.br/estatistica/sead/odsele/proposta_governo/proposta_governo_2026_BR.zip`: propostas de governo de abrangência nacional (BR), onde ficam as candidaturas à Presidência. São 18,3 MB, atualizado em 04/10/2026. Confirmo o conteúdo quando abrir o arquivo.
  - `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip`: lista de candidatos (3,2 MB), para achar o arquivo do eleito.
- Não baixei nada; só conferi que os arquivos existem. Na Fase 3, peço sua autorização antes do download.

### 3.9 Estado de São Paulo ✅

Todas as linhas abaixo foram verificadas com chamada real em 04/10/2026, e cada uma tem amostra salva.

| Indicador | Fonte e código | Periodicidade | Último dado |
|---|---|---|---|
| Taxa de desocupação | IBGE, tabela 4099, variável 4099, localidade `N3[35]` (SP) | trimestral | SP 5,4%; Brasil 5,4% (2º tri/2026) |
| Rendimento médio real habitual | IBGE, tabela 5436, variável 5933, `N3[35]`, sexo = Total (categoria 6794) | trimestral | SP R$ 4.447; Brasil R$ 3.738 (2º tri/2026) |
| Inflação (IPCA em 12 meses) da Região Metropolitana de SP | IBGE, tabela 7060, variável 2265, `N7[3501]`, índice geral (classificação 315, categoria 7169) | mensal | 4,48% (ago/2026) |
| Atividade econômica de SP | BC, série 25394: "Índice de Atividade Econômica Regional – São Paulo – IBCR-SP – com ajuste sazonal" (unidade: índice) | mensal | 106,33 (jul/2026) |
| Resultado primário do estado | SICONFI, RREO Anexo 06, `id_ente=35`, `co_esfera=E` | bimestral | 2025: R$ 8,46 bi com RPPS e R$ 8,49 bi sem RPPS. RPPS é o regime de previdência próprio dos servidores. Positivo = superávit. |
| Dívida consolidada líquida em % da receita corrente líquida | SICONFI, RGF Anexo 02, Poder Executivo (`co_poder=E`) | quadrimestral | 124,23% no fim de 2025; 126,55% no fim de 2024 |
| Gastos por função | SICONFI, RREO Anexo 02 | bimestral | 2025: R$ 369,2 bi liquidados, sem as despesas intraorçamentárias |
| Plano de governo do eleito | TSE, `proposta_governo_2026_SP.zip` (13,6 MB, atualizado em 04/10/2026) | n/a | não baixado |

**O que muda em relação ao nível federal**

1. **Desemprego e renda de SP só existem por trimestre.** O recorte mensal (trimestre móvel) só existe para o Brasil. Para comparar Brasil e SP no mesmo período, recomendo usar as tabelas trimestrais para os dois (pergunta 14).
2. **Não existe IPCA por estado.** O mais próximo é o da Região Metropolitana de SP, e o site usa exatamente esse nome.
3. **O PIB estadual do IBGE só vai até 2023**, com três anos de atraso, então não serve para acompanhar o mandato.
   - A Seade (órgão de estatística de SP) publica PIB mensal e trimestral de SP, mas só em planilha XLSX.
   - Proponho o IBCR-SP do Banco Central, que é mensal e vem em JSON. No site, ele aparece como "índice de atividade econômica", nunca como PIB.
4. **No SICONFI, cada função de gasto aparece duas vezes:** uma linha "exceto intraorçamentárias" e outra só com as intraorçamentárias (repasses entre órgãos do próprio estado). Somar as duas contaria o mesmo dinheiro duas vezes. O coletor usa só a primeira.
5. **No RREO, positivo = superávit**, tanto para SP quanto para a União. No BC é o contrário (seção 3.2).

**Uma simplificação possível:** o SICONFI tem o mesmo formato para a União e para os estados. Conferi o RREO Anexo 02 da União: em 2025, foram liquidados R$ 217,1 bi em Saúde e R$ 157,0 bi em Educação, sem as intraorçamentárias. Com isso, **um único coletor** faria os gastos por função de Brasil e SP sem precisar de chave. O Portal da Transparência ficaria só para os gastos federais por órgão (pergunta 15).

**Fontes de SP que não recomendo agora**

- **Segurança pública (SSP-SP).** Os dados existem por ano desde 2001, por região e por município, mas só em páginas interativas. O portal de dados abertos do estado apenas aponta para essas páginas, e não encontrei arquivo aberto nem API documentada. Usar os endereços internos dessas páginas, que não são documentados, iria contra a regra 2. Fica para depois, se aparecer uma fonte oficial.
- **Assembleia Legislativa (ALESP).** A página de dados abertos respondeu "503, em manutenção" nas duas tentativas de hoje. É o equivalente estadual da fase do Congresso, que é opcional. Retesto antes dela.
- **Seade.** O repositório de dados funciona (catálogo em JSON), mas o PIB está só em planilha. A API de dados municipais responde em JSON, com séries anuais dos 645 municípios; o exemplo que vi era uma série encerrada em 2011. Pode servir se você quiser detalhe por município (pergunta 12), mas exige estudar quais variáveis estão atualizadas.

### 3.10 Temas extras de SP: segurança, saúde, educação e transporte

**Gastos por tema: confirmados para os quatro.** Vêm do SICONFI, RREO Anexo 02 (seção 3.9). Valores liquidados em 2025, sem as intraorçamentárias:

| Função | 2025 |
|---|---|
| Educação | R$ 69,3 bi |
| Saúde | R$ 42,2 bi |
| Transporte | R$ 19,1 bi |
| Segurança Pública | R$ 17,7 bi |

**Indicadores de resultado (o que está acontecendo em cada área)**

| Tema | Indicador | Fonte | Situação |
|---|---|---|---|
| Transporte | Mortes no trânsito por mês | Detran-SP, Infosiga, no portal de dados abertos do estado: um CSV por mês desde jan/2015, licença CC BY 4.0 | ✅ confirmado; último mês publicado: ago/2026 |
| Transporte | Passageiros do Metrô | Portal da Transparência do Metrô: CSV de entrada de passageiros por linha e por estação | ⚠️ a licença aparece como "não especificada" e o endereço do arquivo muda a cada versão. Não recomendo por enquanto. |
| Educação | IDEB por estado | INEP, `divulgacao_regioes_ufs_ideb_2025.zip` (0,76 MB, publicado em 05/08/2026) | ✅ o arquivo existe; confirmo as colunas quando abrir. O IDEB sai a cada 2 anos; durante o mandato virão as edições de 2027 e 2029. |
| Segurança | Homicídios dolosos e outros crimes, por mês | Sinesp, do Ministério da Justiça. Segundo a página do ministério, é uma planilha com dados por estado. | ❌ o portal `dados.mj.gov.br` não abriu hoje, nem por linha de comando nem pelo navegador. A SSP-SP só tem páginas interativas (seção 3.9). Retesto no início da Fase 2. |
| Saúde | Por exemplo, mortalidade infantil ou cobertura vacinal | Ministério da Saúde | ❌ o antigo OpenDataSUS agora redireciona para um portal novo, que não tem a interface de catálogo usada nas outras fontes. Não encontrei hoje uma fonte com acesso automatizado confirmado. Investigo no início da Fase 2. |

**Detalhes que importam**

1. **Infosiga.**
   - O CSV usa `;` como separador e codificação Windows-1252; se for lido como UTF-8, os acentos quebram.
   - A coluna `tempo_sinistro_obito` mostra que uma morte pode ser registrada dias depois do acidente. Por isso, o mês mais recente pode subir nas semanas seguintes, e o site marca esse mês como "preliminar". A regra exata eu confirmo na metodologia do Infosiga na Fase 2.
   - Os arquivos trazem dados de cada vítima (idade, sexo, profissão). O site publica só os totais por mês e não republica esses microdados.
   - Os links do catálogo carregam uma assinatura de acesso com validade (`se=2027-05-15`). Por isso, o coletor sempre lê o link atual no catálogo, em vez de guardar um link fixo.
2. **IDEB.** O arquivo vem compactado (.zip) com planilhas e só sai a cada 2 anos. Automatizar exigiria duas bibliotecas novas, uma para .zip e outra para planilha. Proposta: atualizar à mão, copiando o valor do arquivo oficial para um JSON junto com o link. O Zod valida esse JSON como valida todo o resto. É uma edição a cada 2 anos.
3. **Pisos de gasto em saúde e educação.** Os anexos do SICONFI que tratam disso (RREO 12 e 08) não existem para SP na API. Conferi a lista de anexos que SP enviou em 2025: 01, 02, 03, 04, 06, 07, 09, 10, 11, 13 e 14. Esses dados costumam ir para outros sistemas federais (SIOPS e SIOPE). Ficam fora por enquanto.

---

## 4. Decisões técnicas propostas

**Estrutura e versões**
- **Vários mandatos, uma estrutura só.**
  - O arquivo `config/mandatos.json` lista os mandatos acompanhados. Hoje são dois: Presidência da República e Governo de SP.
  - Cada mandato tem cargo, abrangência (`brasil` ou `sp`), início, fim, nome do eleito e partido.
  - Cada abrangência tem a sua pasta de dados e as mesmas páginas no site (`/brasil/...` e `/sp/...`), geradas a partir de um só modelo.
  - Para acompanhar outro estado no futuro, basta uma entrada nova no config e a configuração das fontes dele. Não é preciso mudar código.
- **Visões separadas (decisão sua).** Brasil e SP são dois painéis independentes. A página inicial só oferece a escolha entre os dois, e cada painel tem o seu próprio menu. Nenhuma página mistura dados de Brasil e SP.
- **Um projeto só, sem monorepo.** Coletores em `scripts/`, site em `src/`, e os mesmos schemas Zod servem aos dois.
- **Versões** (registro do npm em 04/10/2026):
  - Node 24 LTS. Você tem a 24.16; a mais recente da linha 24 é a 24.21. Atualizar é opcional.
  - Astro 7.3, Chart.js 4.5, Zod 4 (a mesma versão que o Astro usa por dentro), Vitest 5, ESLint 10 com typescript-eslint 8, Prettier 3.
- **TypeScript fixado na 6.0.3.** A versão atual no npm é a 7, que ainda não é aceita pelo typescript-eslint (aceita abaixo de 6.1) nem pelo verificador do Astro (aceita 5 ou 6). Um `npm install typescript` sem fixar a versão quebraria o lint.

**Coleta e dados**
- **Rede sem bibliotecas extras.** Uso o `fetch` nativo do Node, com timeout, até 4 tentativas com espera crescente (2 s, 4 s, 8 s) e um intervalo mínimo entre pedidos à mesma fonte (no BC, 4 s). Uma resposta só é aceita se for JSON e passar no Zod.
- **"Último dado bom".** O coletor só grava se a resposta (a) passou no Zod, (b) não está vazia e (c) não tem menos pontos que o arquivo atual. Se algo falhar, ele não toca no arquivo, mostra o erro e termina com falha. Aí o workflow fica vermelho e abre uma issue.
- **Datas.** O período de referência é guardado como texto (`"2026-08"`, `"2026-T2"`), nunca como objeto `Date`. Isso evita o erro clássico de "01/08" virar "31/07" por causa do fuso. Horários de atualização ficam em ISO com `-03:00`, e a exibição usa `Intl` em pt-BR com `timeZone: "America/Sao_Paulo"`.
- **Comparação com o início do mandato.** O valor de referência é o último dado cujo período termina antes do início do mandato: 05/01/2027 para o Brasil e 06/01/2027 para SP. Exemplos: IPCA de dez/2026, desocupação de out-nov-dez 2026, PIB do 4º trimestre de 2026, meta Selic vigente em 04/01/2027. Taxas são comparadas em pontos percentuais.
- **Marca do início do mandato nos gráficos.** Uma linha vertical feita com um plugin de cerca de 15 linhas, sem dependência extra.
- **Fontes raras ou difíceis entram à mão.** O IDEB, que sai a cada 2 anos dentro de um .zip com planilhas, é atualizado por edição humana de um JSON com o valor e o link, validado pelo Zod. O robô não mexe nesses arquivos.

**Promessas**
- **Um arquivo JSON por promessa** (`data/brasil/promessas/P0001.json`, `data/sp/promessas/P0001.json`). O histórico do git de cada arquivo é a trilha de auditoria daquela promessa. O ID é sequencial dentro de cada mandato, nunca muda e nunca é reaproveitado; ele não depende do tema, porque o tema pode ser corrigido depois.
- **O CI bloqueia:**
  - status fora da lista de 6;
  - histórico vazio;
  - entrada sem justificativa ou sem pelo menos 1 link de fonte;
  - status atual diferente do status da última entrada do histórico;
  - datas fora de ordem.
- **O robô nunca mexe em promessas.** O workflow diário só faz `git add` nas pastas `indicadores` e `gastos` de cada abrangência.
- **Rascunho de promessas.**
  - Um script lê o PDF com `unpdf` (camada sobre o pdf.js, da Mozilla) e separa frases e itens de lista.
  - Ele guarda apenas trechos **literais**, com o número da página, e marca os candidatos por uma lista de palavras-chave que você pode editar.
  - **Sem IA no começo:** nada é resumido nem reescrito, então nada pode ser inventado.
  - A saída vai para `rascunhos/`, fora de `data/`. O site não lê essa pasta.

**Automação e publicação**
- **Agendamento.** A documentação do GitHub Actions confirma que o agendamento aceita fuso horário: `cron: '17 10 * * *'` com `timezone: "America/Sao_Paulo"` roda todo dia às 10h17 de Brasília. Esse horário fica depois das divulgações do IBGE, que costumam sair às 9h. O minuto 17 foge do início da hora, quando o GitHub pode atrasar ou descartar execuções agendadas.
- **Um detalhe do GitHub que muda o desenho.** Commits feitos pelo robô (`GITHUB_TOKEN`) não disparam outros workflows. Por isso, depois do commit, o workflow de coleta dispara explicitamente o de teste e publicação, usando `workflow_dispatch`, que é a exceção permitida.
- **Sem analytics e sem cookies.** Não precisa de aviso de cookies (LGPD), e o site fica mais leve.
- **Tema claro/escuro** segue a configuração do aparelho (`prefers-color-scheme`). Sem botão de troca por enquanto.

---

## 5. Estrutura de pastas proposta

```
painel-mandato/
├── config/
│   ├── mandatos.json         um item por mandato: cargo, abrangência, datas,
│   │                         eleito e partido (você edita)
│   └── fontes.ts             todos os códigos de séries, tabelas e endpoints;
│                             cada um com descrição, link e data da verificação
├── data/                     dados publicados; o git guarda o histórico
│   ├── brasil/
│   │   ├── indicadores/      um JSON por indicador (escrito pelo robô)
│   │   ├── gastos/           um JSON por ano (escrito pelo robô)
│   │   └── promessas/        um JSON por promessa (só edição humana)
│   └── sp/                   mesma estrutura de brasil/
├── rascunhos/                saída do script do PDF; o site não lê esta pasta
├── scripts/
│   ├── coletar.ts            roda todos os coletores
│   ├── coletores/            bcb.ts, ibge.ts, siconfi.ts, transparencia.ts,
│   │                         infosiga.ts (um por fonte; o mesmo coletor serve
│   │                         Brasil e SP quando a fonte cobre os dois)
│   ├── http.ts               fetch com timeout, novas tentativas e intervalo
│   └── rascunho-promessas.ts
├── src/                      site Astro
│   ├── pages/                início (só a escolha entre Brasil e SP);
│   │                         [abrangencia]/ = painel próprio com indicadores,
│   │                         promessas, promessas/[id], gastos; metodologia
│   ├── components/
│   ├── lib/                  schemas.ts (Zod), formatar.ts (pt-BR e fuso)
│   └── styles/tokens.css     design system (seção 6)
├── tests/
│   ├── fixtures/             respostas reais das APIs (já criadas)
│   └── *.test.ts
├── docs/                     este plano
├── .github/workflows/        ci.yml (testes + publicação), coleta.yml (diária)
├── .env.example   .gitignore   README.md
└── package.json   tsconfig.json   astro.config.mjs   eslint.config.js
```

O `config/fontes.ts` é TypeScript, e não JSON, porque JSON não aceita comentários. Cada entrada também tem os campos `descricao`, `url` e `verificadoEm`, para que a página de metodologia liste todas as fontes automaticamente.

---

## 6. Design system: proposta inicial

Como você abriu o pedido pelo comando de design system, já deixo aqui a base visual. Ela vira o arquivo `src/styles/tokens.css` na Fase 1.

### 6.1 Princípios

1. **Neutralidade visual.** A interface fica em tons de cinza e grafite. Cor só aparece onde carrega informação: status e gráficos. Nenhuma cor de destaque associada a partido (vermelho, azul, verde-e-amarelo) é usada como "cor da marca".
2. **Cor nunca sozinha.** Todo status tem ícone e texto, o que também atende pessoas com daltonismo.
3. **Todo número com fonte (regra 5).** O componente de número exige fonte, período e data como propriedades obrigatórias. Se faltar algum, o TypeScript não deixa o site ser gerado.
4. **Todo gráfico tem uma tabela equivalente**, para leitores de tela e impressão.
5. **Leve no celular.** Fonte do sistema (nada para baixar) e Chart.js carregado só nas páginas que têm gráfico.
6. **Visões separadas e simétricas.** Brasil e SP são painéis separados, por decisão sua, e nenhuma página mistura os dois. Os dois painéis usam os mesmos componentes, na mesma ordem e com o mesmo destaque. Não existe ranking nem "placar" comparando presidente e governador.

### 6.2 Tokens

**Cores da interface** (os contrastes foram calculados pela fórmula da WCAG):

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--cor-fundo` | `#FFFFFF` | `#111418` | fundo da página |
| `--cor-superficie` | `#F5F6F7` | `#1A1E23` | cartões |
| `--cor-borda` | `#D9DCE0` | `#2F353D` | divisórias |
| `--cor-texto` | `#1B1F24` (16,6:1) | `#E6E8EB` (15:1) | texto principal |
| `--cor-texto-suave` | `#57606A` (6,4:1) | `#A3ABB5` (8:1) | legendas, fonte, datas |
| `--cor-foco` | `#1B1F24` | `#E6E8EB` | contorno de foco de 3 px |

Os links usam a cor do texto, sublinhados, para manter a interface monocromática.

**Cores de status.** Seguem a paleta Okabe-Ito, desenhada para daltonismo, e aparecem só no ícone. O texto do status fica sempre na cor normal.

| Status | Ícone | Cor |
|---|---|---|
| Cumprida | ● | `#009E73` |
| Cumprida em parte | ◐ | `#56B4E9` |
| Em andamento | ◔ | `#E69F00` |
| Não iniciada | ○ | `#8C959F` |
| Descumprida | ✕ | `#D55E00` |
| Não avaliável | ? | `#CC79A7` |

No tema claro, o laranja e o azul-claro ficam abaixo de 3:1 contra o branco. É por isso que o texto sempre acompanha o ícone, e o ícone ganha contorno. Valido os valores finais na Fase 3.

**Tipografia**
- Família: `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif`.
- Números com `font-variant-numeric: tabular-nums`, para os dígitos ficarem alinhados nas tabelas.
- Escala de tamanhos (rem): 0,875 · 1 · 1,125 · 1,375 · 1,75 · 2,25. Altura de linha de 1,5 no texto corrido e 1,2 nos títulos. Pesos 400 e 600.

**Espaço, bordas e movimento**
- Espaçamento em múltiplos de 4 px: 4, 8, 12, 16, 24, 32, 48, 64.
- Margem lateral de 16 px no celular; largura máxima de cerca de 70 caracteres para texto.
- Bordas de 1 px; raio de 4 px (selos, campos) e 8 px (cartões). Sem sombras.
- Movimento: só transições de 150 ms em foco e hover, e nenhuma quando o aparelho pede `prefers-reduced-motion`.

**Formatação pt-BR**

| Tipo | Exemplo |
|---|---|
| Percentual | 4,22% |
| Variação de taxa | +0,3 p.p. |
| Moeda, em destaque | R$ 1,2 bi |
| Moeda, em tabela | R$ 1.234.567,89 |
| Data | 04/10/2026 |
| Mês de referência | ago/2026 |
| Trimestre móvel | jun-jul-ago 2026 |
| Trimestre | 2º tri/2026 |
| Atualização | 04/10/2026 às 10:17 (horário de Brasília) |

### 6.3 Componentes

| Componente | Para quê | Variações e estados | Acessibilidade |
|---|---|---|---|
| `Fonte` | linha "Fonte · Referência · Atualizado em" | todas as propriedades obrigatórias | link com texto descritivo |
| `Numero` | valor formatado em pt-BR | destaque, normal, sem dado ("—" com o motivo) | abreviações por extenso no `aria-label` (ex.: "pontos percentuais") |
| `CartaoIndicador` | valor atual, variação desde o início do mandato e `Fonte` | normal; desatualizado; mandato não iniciado (sem comparação) | título como `h3`; variação escrita com palavras ("subiu", "caiu"), não só com seta |
| `GraficoSerie` | série no tempo com a marca do início do mandato | claro e escuro; sem JavaScript, mostra a tabela | `canvas` com `role="img"` e `aria-label`, mais a tabela em `<details>` |
| `SeloStatus` | status da promessa | os 6 status | ícone com `aria-hidden`; texto sempre visível |
| `Placar` | contagem de promessas por status | n/a | lista com números, não só a barra |
| `FiltrosPromessas` | filtrar por tema e status | sem JavaScript, mostra a lista completa | campos nativos com `<label>`; contador de resultados com `aria-live` |
| `CartaoPromessa` | resumo de uma promessa na lista | n/a | o título é o link |
| `CitacaoOriginal` | texto literal da promessa | n/a | `<blockquote cite>` com o documento e a página |
| `LinhaDoTempo` | histórico de status | n/a | `<ol>` com datas em `<time>` |
| `TabelaDados` | números em tabela | n/a | `<caption>`, `<th scope>`, números alinhados à direita |
| `Aviso` | informação de contexto | informação, atenção | `role="note"`; não depende só de cor |
| `Cabecalho` e `Rodape` | navegação e créditos | n/a | link "pular para o conteúdo" |

### 6.4 Regras de texto (regra 9)

| ✅ Faça | ❌ Evite |
|---|---|
| "A taxa de desocupação foi de 5,3% no trimestre jun-jul-ago 2026 (IBGE)." | "O desemprego despencou!" |
| "Subiu 0,4 p.p. desde o início do mandato." | "melhorou", "piorou", "infelizmente" |
| "Status: descumprida. Justificativa: o prazo definido na promessa terminou sem a medida prevista. Fonte: [link]" | "O governo falhou em…" |
| Verbos de registro: foi, registrou, passou de X para Y | Adjetivos de avaliação: forte, fraco, pífio, histórico |

---

## 7. Riscos

| # | Risco | O que faço |
|---|---|---|
| 1 | O eleito só é conhecido hoje à noite ou em 25/10. As promessas dependem disso. | As Fases 1 e 2 não dependem do eleito. A Fase 3 só começa depois do resultado oficial do TSE. |
| 2 | O status de uma promessa envolve julgamento, o que abre espaço para acusações de viés. | Critérios escritos para cada status na página de metodologia **antes** de publicar o primeiro status. Justificativa e fonte obrigatórias (o CI bloqueia sem elas). Histórico público. Canal de correção pelas issues do GitHub. Recomendo uma segunda pessoa revisando. |
| 3 | APIs que bloqueiam robôs ou IPs de fora do Brasil. Já vi bloqueio no BC, no TSE e nas páginas do Portal, e os servidores do GitHub Actions ficam fora do Brasil. | Na Fase 1, um job de "teste de conexão" chama cada API a partir do GitHub. Se alguma bloquear, as saídas são rodar a coleta no seu computador (runner próprio) ou usar os arquivos de dados abertos. |
| 4 | A Câmara estava fora do ar hoje. | Retestar antes da Fase 5. |
| 5 | O endpoint do Senado foi descontinuado. | Usar `/processo`. |
| 6 | Números fiscais diferentes conforme a fonte, com sinais opostos (BC: positivo = déficit; RREO: negativo = déficit). | Um só número principal, com o sinal explicado na página de metodologia. |
| 7 | IBGE e BC revisam dados passados (o PIB, por exemplo). | O valor novo e válido substitui o antigo, o git guarda o anterior, e o "atualizado em" mostra quando a mudança aconteceu. |
| 8 | Fuso horário: o servidor do BC usa UTC, a Selic traz datas futuras e o robô do GitHub roda em UTC. | Datas guardadas como texto, filtro "até hoje em America/Sao_Paulo" e testes específicos para isso. |
| 9 | O Portal manda valores como texto, com acentos em ISO-8859-1. | Conversão coberta por teste com a amostra real (Fase 4). |
| 10 | O PDF do plano pode ser imagem escaneada ou ter colunas, o que piora a extração. | É só um rascunho. Se o PDF for imagem, eu aviso e paramos: OCR está fora do escopo. |
| 11 | O TypeScript 7 é incompatível com o lint. | Fixar a versão 6.0.3. |
| 12 | O GitHub pode atrasar ou descartar execuções agendadas no início da hora, e desativa workflows agendados depois de 60 dias sem atividade em repositório público. | Rodar no minuto 17. O IPCA muda todo mês e gera commit, então o repositório não deve ficar 60 dias parado. Se acontecer, reativar é um clique. |
| 13 | Vazamento da chave do Portal num repositório público. | A chave fica só no `.env`, que o git ignora, e nos GitHub Secrets. Não dá para contar com o GitHub reconhecendo esse formato de chave. **Nunca cole a chave no chat.** |
| 14 | Manutenção difícil para quem está começando. | Poucas dependências (cerca de 10, todas só de desenvolvimento), Dependabot mensal e uma seção "como atualizar" no README. |
| 15 | Até 05/01/2027 só existem dados anteriores ao mandato, e o primeiro dado do novo mandato sai semanas ou meses depois da posse. | A página inicial informa a data de início. A comparação "desde o início" só aparece quando houver dado do novo mandato. |
| 16 | Com dois planos de governo, o trabalho humano de revisar promessas dobra. É o seu tempo. | O mesmo script gera os dois rascunhos. Dá para revisar um plano de cada vez; a segunda pessoa revisora ajuda mais ainda aqui. |
| 17 | Os dados estaduais saem com menos frequência e mais atraso: PNAD trimestral, RREO bimestral, RGF quadrimestral. | O período de referência fica sempre visível, e o aviso de "desatualizado" considera a periodicidade de cada série. |
| 18 | Brasil e SP podem ter medidas diferentes para a mesma ideia (IPCA nacional × IPCA da Região Metropolitana; PIB × índice de atividade). | Rótulos com o nome exato de cada medida, e a diferença explicada na metodologia. |
| 19 | Presidente e governador podem ser de grupos políticos opostos. Qualquer diferença visual entre as duas partes do site vira acusação de viés. | Regra de simetria do design system (seção 6.1, princípio 6). |
| 20 | Os estados podem retificar relatórios já enviados ao SICONFI. | O valor novo e válido substitui o anterior, e o git guarda os dois. |
| 21 | ALESP fora do ar hoje; segurança pública sem fonte aberta utilizável. | Ficam fora da primeira versão. Retesto antes da fase opcional. |
| 22 | Segurança e saúde em SP ainda sem fonte de resultado com acesso automatizado confirmado. | Começam só com os gastos. Retesto o Sinesp e procuro uma fonte de saúde no início da Fase 2. Se não houver fonte, o site diz claramente que o indicador ainda não existe, sem número aproximado. |
| 23 | Infosiga: o mês mais recente pode ser revisto, e os arquivos trazem dados pessoais das vítimas. | O mês recente aparece marcado como "preliminar"; o site publica só totais. |
| 24 | Mais fontes significam mais manutenção (de 6 para cerca de 10). | Mesma estrutura de coletor, testes com amostras reais, e as fontes raras entram à mão. |

---

## 8. Perguntas

### Decisões já tomadas (04/10/2026)

| # | Pergunta | Sua resposta |
|---|---|---|
| 1 | Usuário do GitHub | `drocacoin` (li no seu Chrome, só leitura) |
| 2 | Nome do repositório | `painel-dos-mandatos` (o nome estava livre) |
| 3 | Repositório público | sim |
| 4 | Licenças | MIT para o código e CC BY 4.0 para o conteúdo |
| 12 | Nível de detalhe de SP | (a) o estado inteiro |
| 13 | Temas de SP | os temas base, mais segurança, saúde, educação e transporte |
| n/a | Organização do painel | visões de Brasil e SP separadas |
| 11 | Gastos: pago ou liquidado (05/10/2026) | **liquidado**: o pago por função só sai uma vez por ano (DCA); o liquidado sai a cada 2 meses (RREO) |
| 16 | Fase 5: Congresso e ALESP (05/10/2026) | **medidas provisórias (Senado) e projetos do governo (Câmara)**, só no painel Brasil. A ALESP ficou de fora: só publica ZIPs com XML (cerca de 26 MB por dia) |
| 15 | Gastos por órgão (05/10/2026) | **não mostrar**: só por função. Os ministérios mudam a cada governo, a Fazenda soma R$ 2,6 trilhões sem detalhe e o ano em curso não tem data de corte |

As perguntas originais seguem abaixo como registro.

### Preciso agora (para a Fase 1)

1. **Usuário do GitHub:** você contou que já está logado no Brave, mas eu não consigo ver esse navegador (a extensão do Claude não está conectada a ele). Basta digitar o usuário aqui. O endereço do site será `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO`.
2. **Nome do repositório e do site:** como agora são dois mandatos, sugiro `painel-dos-mandatos`. Prefere outro?
3. **Repositório público:** pode ser? O GitHub Pages é grátis para repositórios públicos, e o histórico aberto é a própria trilha de auditoria.
4. **Licenças:** MIT para o código e CC BY 4.0 para o conteúdo curado (promessas e textos)? É o que recomendo.

### Pode responder até a fase indicada (já deixei minha recomendação)

5. **(Fase 2) Indicadores do Brasil:** Selic meta (BC 432), IPCA em 12 meses (IBGE 1737), desocupação (IBGE 6381), rendimento real (IBGE 6390), PIB acumulado em 4 trimestres (IBGE 5932), dívida bruta (BC 13762) e resultado primário (BC 5783). → Recomendo exatamente estes 7. Veja também a pergunta 14, que pode trocar as tabelas de desocupação e renda.
6. **(Fase 2) Quanto histórico antes do início do mandato os gráficos mostram?** → Recomendo 4 anos, a mesma duração de um mandato, igual para todos os indicadores. A alternativa é 10 anos.
7. **(Fase 2) Resultado primário:** só o número do BC (recomendado) ou também o do RREO do Tesouro?
8. **(Fase 3) Fontes aceitas para promessas:** só o plano registrado no TSE (recomendado para começar) ou também debates, entrevistas e cartas de 2º turno?
9. **(Fase 3) Quem decide o status:** só você, ou com revisão obrigatória de uma segunda pessoa (pull request)? → Recomendo a segunda pessoa, se houver alguém disponível.
10. **(Fase 3) Rascunho das promessas:** sem IA (recomendado), ou com IA ajudando a resumir? A segunda opção exige uma chave de API paga e revisão redobrada.
11. **(Fase 4) Gastos:** mostrar o valor "pago" (recomendado: é o dinheiro que efetivamente saiu no ano) ou o "liquidado"? O método de correção pelo IPCA eu detalho na Fase 4.

### Sobre SP: preciso agora

12. **Nível de detalhe de SP.** Escolha uma opção:
    - (a) o estado como um todo (recomendado para começar);
    - (b) também as regiões (Capital, Grande SP e interior), onde a fonte permitir;
    - (c) também os 645 municípios. Esta opção exige estudar as variáveis da Seade e do IBGE por município.
13. **Temas de SP.** Recomendo começar com os mesmos temas do Brasil: emprego, renda, inflação, atividade econômica, contas públicas, gastos e promessas. Quer incluir segurança, saúde, educação ou transporte? Cada tema novo exige investigar fontes, e o de segurança hoje não tem arquivo aberto.

### Sobre SP: pode esperar (já deixei minha recomendação)

14. **(Fase 2) Desemprego e renda:** usar as tabelas trimestrais (4099 e 5436) também para o Brasil, para comparar com SP no mesmo período? → **Resolvida pela sua decisão de separar as visões.** Como não há mais comparação na mesma página, o Brasil mantém as tabelas mensais (6381 e 6390), que são mais atualizadas, e SP usa as trimestrais.
15. **(Fase 4) Gastos por função:** usar o SICONFI para Brasil e SP (o mesmo coletor, sem chave) e manter o Portal da Transparência só para os gastos federais por órgão? → Recomendo sim.
16. **(Fase 5) ALESP:** incluir a Assembleia Legislativa junto com o Congresso, como fase opcional? → Recomendo sim, depois de retestar a fonte.

---

## 9. O que você precisa fazer manualmente

### Antes da Fase 1

1. ✅ A conta `drocacoin` está confirmada. Recomendo conferir se a verificação em duas etapas está ativada (Settings → Password and authentication).
2. Nos commits, vou usar o nome `drocacoin` e o e-mail privado do GitHub, `225993673+drocacoin@users.noreply.github.com`, que não expõe o seu e-mail real. Se preferir outro nome, me diga.
3. *(Opcional, facilita.)* Instalar o GitHub CLI com `winget install --id GitHub.cli` e depois rodar `gh auth login`. O login é você quem faz; eu nunca digito senhas.
4. *(Opcional.)* Atualizar o Node 24.16 para a 24.21 com o instalador "LTS" de <https://nodejs.org>.

### Até a Fase 4: chave do Portal da Transparência

1. Ter uma conta gov.br de nível **Prata ou Ouro**, ou então ativar a **verificação em duas etapas** nas configurações de segurança da conta.
2. Abrir <https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email> e clicar em "Entrar com gov.br".
3. A chave chega no e-mail cadastrado na sua conta gov.br.
4. **Não cole a chave aqui no chat nem em arquivos do projeto.** Na Fase 4 eu crio o arquivo `.env` (que o git ignora) e mostro onde colar. No GitHub, ela vai em Settings → Secrets and variables → Actions → New repository secret.

### Depois da eleição

5. Quando o TSE oficializar os resultados, você confirma os dados do presidente e do governador eleitos para o `config/mandatos.json` e autoriza o download dos arquivos de propostas de governo: o nacional (18,3 MB) e o de SP (13,6 MB).

---

## 10. O que a Fase 1 entrega, se você aprovar

- Repositório público `drocacoin/painel-dos-mandatos` com `.gitignore`, `.env.example`, README e as licenças MIT e CC BY 4.0. Criar o repositório é o primeiro passo público, então só faço depois do seu OK.
- Página inicial com a escolha entre os painéis **Brasil** e **SP**.
- Astro, TypeScript strict, ESLint, Prettier e Vitest configurados, com `npm run lint`, `typecheck`, `test` e `build` passando sem erros nem avisos.
- `config/mandatos.json` com os dois mandatos (Presidência e Governo de SP), as datas confirmadas e os eleitos "a definir", e `config/fontes.ts` com os códigos verificados neste documento.
- Os dois painéis vazios (`/brasil` e `/sp`), cada um com o seu menu, gerados pelo mesmo modelo.
- `tokens.css` com o design system da seção 6 e uma página inicial vazia, conferida a 380 px e no desktop, nos temas claro e escuro.
- Workflow de CI com publicação no GitHub Pages, mais o job de teste de conexão com as APIs a partir do GitHub.
