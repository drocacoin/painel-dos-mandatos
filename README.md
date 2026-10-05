# Painel dos Mandatos

Site público, gratuito e apartidário para acompanhar os mandatos 2027–2031 do **presidente da República** e do **governador de São Paulo**, com dados oficiais. Brasil e São Paulo são painéis separados.

Endereço: <https://drocacoin.github.io/painel-dos-mandatos/>

## Situação atual

- **Fase 1 (fundação):** concluída. Estrutura do projeto, verificações automáticas e publicação.
- **Fase 2 (indicadores):** concluída. 19 indicadores (7 do Brasil, 12 de SP) com gráficos, coleta automática diária e comparação com o início do mandato.
- **Fase 3 (promessas):** concluída para SP: 30 promessas do plano de governo registrado no TSE, aprovadas em 05/10/2026, com validação no CI, placar, filtros e histórico. As do Brasil aguardam o 2º turno (25/10/2026).
- **Fase 4 (gastos):** concluída. Despesa liquidada por área de governo (função), no Brasil e em SP, corrigida pela inflação, com coleta automática a cada bimestre publicado.
- **Fase 5 (Congresso):** concluída, só no painel Brasil. Medidas provisórias editadas pela Presidência e projetos (PL, PLP e PEC) enviados pelo Poder Executivo à Câmara, desde 2023, com a situação atual de cada um.
- Próxima: metodologia, acessibilidade, desempenho e guia de contribuição (Fase 6). Plano completo: [docs/fase-0-planejamento.md](docs/fase-0-planejamento.md).

O governador de SP foi eleito no 1º turno (04/10/2026) e já aparece no site. A Presidência aguarda o 2º turno, em 25/10/2026; o site só mostra o eleito depois do resultado oficial do TSE. Como o mandato começa em 05/01/2027 (Brasil) e 06/01/2027 (SP), a comparação "desde o início do mandato" só aparece quando sair o primeiro dado de cada indicador a partir dessas datas.

## Como rodar no seu computador

Pré-requisito: [Node.js](https://nodejs.org) 24 (versão LTS).

```bash
npm ci       # instala as dependências nas versões exatas do package-lock.json
npm run dev  # abre o site em http://localhost:4321/painel-dos-mandatos/
```

Coleta dos dados (a mesma que o GitHub roda todo dia):

```bash
npm run coletar                    # todos os indicadores automáticos e os gastos
npm run coletar -- sp/homicidios   # só os indicados (painel/indicador)
npm run coletar -- sp/gastos       # só os gastos de um painel
npm run coletar -- brasil/medidas-provisorias brasil/projetos-de-lei
```

A primeira coleta do trânsito (Infosiga) baixa cerca de 55 arquivos de 4 MB; depois, só baixa de novo quando sai um mês novo.

Verificações (as mesmas que o GitHub roda a cada envio):

| Comando             | O que faz                                                      |
| ------------------- | -------------------------------------------------------------- |
| `npm run lint`      | ESLint (erros e más práticas) e Prettier (formatação)          |
| `npm run typecheck` | confere os tipos do TypeScript, inclusive nas páginas `.astro` |
| `npm test`          | roda os testes automáticos (Vitest)                            |
| `npm run build`     | gera o site final na pasta `dist/`                             |
| `npm run format`    | corrige a formatação automaticamente                           |

## Estrutura

| Pasta ou arquivo             | O que tem                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `config/mandatos.json`       | mandatos acompanhados: cargo, datas, pessoa eleita e partido (edição manual)                        |
| `config/fontes.ts`           | todos os códigos de séries e tabelas verificados, cada um com a data da verificação                 |
| `config/indicadores.ts`      | o que cada painel mostra: título, unidade, fonte (com link) e como coletar                          |
| `config/gastos.ts`           | de onde vêm os gastos de cada painel e quais áreas ganham gráfico próprio                           |
| `config/congresso.ts`        | fontes do Congresso e as regras que resumem a situação de cada medida provisória e projeto          |
| `data/<painel>/indicadores/` | os dados, um JSON por indicador; o histórico do git é a trilha de auditoria                         |
| `data/<painel>/gastos/`      | despesa liquidada por função, em reais da época (a correção pela inflação é feita no site)          |
| `data/brasil/congresso/`     | medidas provisórias e projetos do governo, com a situação no texto oficial                          |
| `scripts/`                   | coletores (`coletores/`), acesso à internet com novas tentativas (`http.ts`) e `coletar.ts`         |
| `src/pages/`                 | páginas: início e os painéis `/brasil/` e `/sp/`, cada um com Indicadores, Promessas e Gastos       |
| `src/components/`            | cartão do indicador, gráfico com tabela e a linha de fonte                                          |
| `src/scripts/graficos.ts`    | desenho dos gráficos (Chart.js)                                                                     |
| `src/lib/`                   | validação (Zod), períodos, formatação em pt-BR e comparação com o início do mandato                 |
| `src/styles/`                | design system: `tokens.css` (cores, tamanhos, espaços) e `base.css`                                 |
| `tests/`                     | testes automáticos; `tests/fixtures/` tem respostas reais das APIs (não editar à mão)               |
| `docs/`                      | plano do projeto                                                                                    |
| `.github/workflows/`         | `ci.yml` (verificação e publicação), `coleta.yml` (coleta diária) e `conexao.yml` (teste de acesso) |

## Promessas

Cada promessa é um arquivo em `data/<painel>/promessas/` (ex.: `data/sp/promessas/P0001.json`). O histórico do git de cada arquivo é a trilha de auditoria daquela promessa, e a página da promessa tem um link para ele.

**Regras (regra 6 do projeto), conferidas pelo CI a cada envio:**

- o status só muda por edição humana do arquivo; o robô da coleta nunca mexe em promessas;
- o status atual é sempre o da **última entrada do histórico**;
- toda entrada do histórico precisa de data, status, justificativa (pelo menos 20 caracteres) e **pelo menos um link de fonte**;
- o histórico fica em ordem de data, sem datas no futuro;
- `id` igual ao nome do arquivo (`P0001` a `P9999`, nunca reaproveitado);
- tema = uma das 28 funções de governo da classificação oficial do orçamento (lista em [`config/promessas.ts`](config/promessas.ts));
- promessa mensurável precisa de meta; `indicador`, se preenchido, precisa existir (ex.: `"sp/homicidios"`).

Os critérios aprovados em 05/10/2026 estão em [`config/promessas.ts`](config/promessas.ts) e aparecem na página de promessas:

- **quais promessas entram:** trechos do plano de governo registrado no TSE com um compromisso e alvo verificável (um número, um prazo ou a cobertura total, como "todos os municípios");
- **prazo:** quando o texto não traz prazo, vale o fim do mandato;
- **status:** os 6 status, cada um com o seu critério.

### Como cadastrar uma promessa

1. Gere o rascunho a partir do PDF do plano de governo (próxima seção) e escolha um trecho.
2. Crie o arquivo com o próximo número livre, seguindo este modelo:

```json
{
  "id": "P0001",
  "resumo": "<frase curta e neutra, sem adjetivos>",
  "texto": "<cópia exata do trecho, conferida no PDF>",
  "tema": "<uma das funções de governo>",
  "fonte": {
    "tipo": "plano de governo",
    "titulo": "Proposta de governo registrada no TSE (eleições 2026)",
    "url": "<link oficial do TSE>",
    "data": "<AAAA-MM-DD>",
    "pagina": 9
  },
  "mensuravel": false,
  "meta": null,
  "indicador": null,
  "prazo": null,
  "historico": [
    {
      "data": "<AAAA-MM-DD de hoje>",
      "status": "nao-iniciada",
      "justificativa": "<por que este status, em linguagem neutra>",
      "fontes": ["<link da fonte que comprova>"]
    }
  ]
}
```

3. Rode `npm test`: se algo estiver fora das regras, o teste diz qual campo corrigir.
4. Faça o commit e envie. O CI valida de novo e publica.

**Para mudar o status**, acrescente uma entrada nova no fim do `historico`, com a data, o novo status, a justificativa e as fontes. Não apague nem edite entradas antigas.

### Rascunho a partir do PDF do plano de governo

```bash
npm run rascunho -- <arquivo.pdf> <painel> [link da fonte]
```

O script lê o PDF, junta as linhas em frases e lista as que têm sinais de compromisso: verbos no futuro terminados em "-remos" e as palavras de `PALAVRAS_DE_COMPROMISSO` em [`scripts/rascunho-promessas.ts`](scripts/rascunho-promessas.ts). Cada trecho vem com a página e a seção de origem. A saída vai para `rascunhos/`, que o git ignora: **nada do rascunho é publicado sem revisão**.

## De onde vêm os dados

Cada indicador mostra no site a fonte (com link), o período de referência e a data da última atualização. Os códigos exatos de séries e tabelas, com a data em que foram verificados, estão em [`config/fontes.ts`](config/fontes.ts).

| Painel | Tema            | Indicador                                                        | Fonte                                                                                                                                                                        | Atualização              | Coleta     |
| ------ | --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------- |
| Brasil | Economia        | Taxa básica de juros (meta Selic)                                | [Banco Central, SGS série 432](https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom)                                                   | mensal                   | automática |
| Brasil | Economia        | Inflação (IPCA) em 12 meses                                      | [IBGE, IPCA (tabela 1737)](https://sidra.ibge.gov.br/tabela/1737)                                                                                                            | mensal                   | automática |
| Brasil | Economia        | Taxa de desocupação                                              | [IBGE, PNAD Contínua (tabela 6381)](https://sidra.ibge.gov.br/tabela/6381)                                                                                                   | mensal (trimestre móvel) | automática |
| Brasil | Economia        | Rendimento médio real do trabalho                                | [IBGE, PNAD Contínua (tabela 6390)](https://sidra.ibge.gov.br/tabela/6390)                                                                                                   | mensal (trimestre móvel) | automática |
| Brasil | Economia        | PIB: crescimento acumulado em 4 trimestres                       | [IBGE, Contas Nacionais Trimestrais (tabela 5932)](https://sidra.ibge.gov.br/tabela/5932)                                                                                    | trimestral               | automática |
| Brasil | Contas públicas | Dívida bruta do governo geral                                    | [Banco Central, SGS série 13762](https://dadosabertos.bcb.gov.br/dataset/13762-divida-bruta-do-governo-geral--pib---metodologia-utilizada-a-partir-de-2008)                  | mensal                   | automática |
| Brasil | Contas públicas | Resultado primário em 12 meses (Governo Federal e Banco Central) | [Banco Central, SGS série 5783](https://dadosabertos.bcb.gov.br/dataset/5783-nfsp-sem-desvalorizacao-cambial--pib---fluxo-acumulado-em-12-meses---resultado-primario---tota) | mensal                   | automática |
| SP     | Economia        | Taxa de desocupação                                              | [IBGE, PNAD Contínua trimestral (tabela 4099)](https://sidra.ibge.gov.br/tabela/4099)                                                                                        | trimestral               | automática |
| SP     | Economia        | Rendimento médio real do trabalho                                | [IBGE, PNAD Contínua trimestral (tabela 5436)](https://sidra.ibge.gov.br/tabela/5436)                                                                                        | trimestral               | automática |
| SP     | Economia        | Inflação (IPCA) em 12 meses na Região Metropolitana de São Paulo | [IBGE, IPCA por região metropolitana (tabela 7060)](https://sidra.ibge.gov.br/tabela/7060)                                                                                   | mensal                   | automática |
| SP     | Economia        | Índice de atividade econômica (IBCR-SP)                          | [Banco Central, SGS série 25394](https://dadosabertos.bcb.gov.br/dataset/25394-sgs)                                                                                          | mensal                   | automática |
| SP     | Contas públicas | Resultado primário do estado no ano                              | [Tesouro Nacional, SICONFI (RREO, Anexo 06)](https://apidatalake.tesouro.gov.br/docs/siconfi/)                                                                               | anual                    | automática |
| SP     | Contas públicas | Dívida consolidada líquida em relação à receita                  | [Tesouro Nacional, SICONFI (RGF, Anexo 02)](https://apidatalake.tesouro.gov.br/docs/siconfi/)                                                                                | quadrimestral            | automática |
| SP     | Segurança       | Vítimas de homicídio doloso                                      | [Secretaria da Segurança Pública, via Fundação Seade](https://repositorio.seade.gov.br/dataset/objetivo-estrategico-3-seguranca)                                             | anual                    | automática |
| SP     | Saúde           | Taxa de mortalidade infantil                                     | [Fundação Seade](https://repositorio.seade.gov.br/dataset/objetivo-estrategico-2-saude)                                                                                      | anual                    | automática |
| SP     | Transporte      | Mortes no trânsito em 12 meses                                   | [Detran-SP, Infosiga](https://dadosabertos.sp.gov.br/dataset/pessoas-envolvidas-em-sinistros)                                                                                | mensal                   | automática |
| SP     | Educação        | IDEB da rede estadual: anos iniciais do fundamental              | [INEP, IDEB 2025, resultados por UF (rede estadual)](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados)                    | a cada 2 anos            | manual     |
| SP     | Educação        | IDEB da rede estadual: anos finais do fundamental                | [INEP, IDEB 2025, resultados por UF (rede estadual)](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados)                    | a cada 2 anos            | manual     |
| SP     | Educação        | IDEB da rede estadual: ensino médio                              | [INEP, IDEB 2025, resultados por UF (rede estadual)](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados)                    | a cada 2 anos            | manual     |
| Brasil | Gastos          | Despesa liquidada por função (União)                             | [Tesouro Nacional, SICONFI (RREO, Anexo 02)](https://apidatalake.tesouro.gov.br/docs/siconfi/)                                                                               | bimestral                | automática |
| SP     | Gastos          | Despesa liquidada por função (estado de SP)                      | [Tesouro Nacional, SICONFI (RREO, Anexo 02)](https://apidatalake.tesouro.gov.br/docs/siconfi/)                                                                               | bimestral                | automática |
| Ambos  | Gastos          | IPCA, número-índice (só para corrigir os gastos; sem cartão)     | [IBGE, IPCA (tabela 1737)](https://sidra.ibge.gov.br/tabela/1737)                                                                                                            | mensal                   | automática |
| Brasil | Congresso       | Medidas provisórias editadas pela Presidência                    | [Senado Federal, Dados Abertos (processos legislativos)](https://legis.senado.leg.br/dadosabertos/)                                                                          | diária                   | automática |
| Brasil | Congresso       | Projetos (PL, PLP e PEC) enviados pelo Poder Executivo           | [Câmara dos Deputados, Dados Abertos (proposições)](https://dadosabertos.camara.leg.br/)                                                                                     | diária                   | automática |

Cuidados de método, todos explicados também no próprio site:

- **Resultado primário do Brasil:** o Banco Central publica a série como "necessidade de financiamento", em que positivo significa déficit (Manual de Estatísticas Fiscais do BC). No site o sinal é invertido: positivo = superávit.
- **Meta Selic:** a série do BC é diária; o site mostra o valor vigente no último dia de cada mês (no mês atual, o vigente no dia da coleta).
- **Desemprego e renda de SP:** o recorte por estado só existe por trimestre; o do Brasil é por trimestre móvel (mensal).
- **Inflação de SP:** não existe IPCA por estado; o site usa o da Região Metropolitana de São Paulo.
- **Atividade de SP:** índice do Banco Central (IBCR-SP), não o PIB; o PIB estadual do IBGE sai com cerca de 3 anos de atraso.
- **Resultado primário de SP:** acumulado no ano; o ano corrente é parcial e aparece marcado (ex.: "jan-ago").
- **Mortes no trânsito:** soma de 12 meses; o mês mais recente é preliminar, porque mortes podem ser registradas dias depois do sinistro.
- **IDEB:** sai a cada 2 anos e é copiado à mão do arquivo oficial do INEP (o servidor do INEP recusa os servidores do GitHub).
- **Gastos:**
  - valor **liquidado** (o bem ou serviço foi entregue e a despesa reconhecida). Decisão de 05/10/2026: o valor pago por função só é publicado uma vez por ano, meses depois do fim do ano, enquanto o liquidado sai a cada 2 meses;
  - as áreas são as funções de governo da Portaria nº 42/1999; ficam de fora as despesas intraorçamentárias (pagamentos entre órgãos do próprio governo), que contariam o mesmo dinheiro duas vezes;
  - o coletor confere se a soma das funções é igual ao total do relatório; se não for, não grava;
  - correção pela inflação: valor × IPCA do mês de referência ÷ IPCA médio dos meses do período. O mês de referência é o último IPCA publicado, e os arquivos guardam os valores da época, sem correção;
  - o ano em curso é parcial, até o último bimestre publicado (ex.: "jan-ago"), e não entra na comparação com o início do mandato.
- **Congresso:**
  - as tabelas agrupam pelo ano do número oficial (o PL 1/2023 foi apresentado em 30/12/2022); a lista do mandato usa a data de apresentação;
  - a busca da Câmara por autor "Poder Executivo" também traz projetos de comissões com esse texto no nome (ex.: PLP 265/2025). O coletor confere o autor de cada projeto novo e guarda só os do órgão Poder Executivo;
  - a situação vem no texto oficial e é resumida pelas regras de [`config/congresso.ts`](config/congresso.ts). Situação que ainda não está nas regras aparece como "Outra situação", nunca encaixada à força.

### Coleta automática

O workflow [`coleta.yml`](.github/workflows/coleta.yml) roda todo dia às 10h17 de Brasília:

1. coleta cada indicador e os gastos de cada painel, com até 4 tentativas e espera crescente entre elas;
2. valida a resposta (Zod) e só grava se o dado novo não estiver vazio e não tiver encolhido (nos gastos, nenhum ano pode sumir nem voltar para um bimestre anterior; nas listas do Congresso, nenhum item salvo pode sumir). Se algo falhar, o dado anterior fica intacto;
3. faz commit só se algum dado mudou, e então publica o site;
4. se alguma coleta falhou, abre uma issue ("Falha na coleta automática") e termina em vermelho.

## Limitações conhecidas

- Presidência: eleito e promessas aguardam o resultado oficial do 2º turno (25/10/2026).
- O rascunho de promessas é uma ajuda, não uma lista completa: ele só pega frases com os sinais de compromisso, e páginas do PDF sem texto (imagens) precisam ser conferidas à mão.
- Congresso: só no painel Brasil. A Assembleia Legislativa de SP publica os dados só em arquivos ZIP com XML (cerca de 26 MB por dia), e ficou de fora por decisão de 05/10/2026. Vetos e projetos do Congresso Nacional (PLN, como os de crédito orçamentário) não aparecem.
- Gastos: só por função (área). O ano em curso é parcial; o valor pago por função não é usado, porque só sai uma vez por ano. Gastos por ministério não são mostrados (decisão de 05/10/2026): os ministérios mudam a cada governo, o que quebra a comparação no início do mandato.
- Segurança e saúde de SP usam dados **anuais** da Fundação Seade (vítimas de homicídio doloso e mortalidade infantil). O catálogo da Seade não informa a licença desses arquivos.
- O site ainda não avisa quando um dado está atrasado em relação ao calendário da fonte; a data de referência e a de atualização ficam sempre visíveis.
- O tema claro ou escuro segue a configuração do aparelho; não há botão de troca.

### Teste de conexão a partir do GitHub (04/10/2026)

Os servidores do GitHub, que rodam a coleta automática, ficam fora do Brasil. O workflow [`conexao.yml`](.github/workflows/conexao.yml) chamou cada fonte uma vez:

| Fonte                                | Resultado                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| Banco Central, IBGE, SICONFI, Senado | responderam (HTTP 200)                                                                  |
| TSE e Dados Abertos SP (Infosiga)    | responderam (HTTP 206 e 200)                                                            |
| Portal da Transparência              | respondeu 401, o esperado sem chave                                                     |
| INEP (IDEB)                          | recusou a conexão do GitHub (funciona a partir do Brasil); o IDEB será atualizado à mão |
| Câmara dos Deputados                 | não respondeu (tempo esgotado); também falhou a partir do Brasil                        |
| Ministério da Justiça (Sinesp)       | não respondeu; também falhou a partir do Brasil                                         |
| Assembleia Legislativa de SP (ALESP) | respondeu 503 (em manutenção)                                                           |

## Segredos

Chaves de API ficam só no arquivo `.env`, que o git ignora, e nos Secrets do GitHub. O modelo é o [`.env.example`](.env.example). A chave do Portal da Transparência (`PORTAL_TRANSPARENCIA_CHAVE`) está guardada nos dois lugares, mas nenhuma coleta a usa hoje.

## Licenças

- Código: MIT ([LICENSE](LICENSE)).
- Conteúdo curado (promessas, textos e documentação): CC BY 4.0 ([LICENSE-CONTEUDO.md](LICENSE-CONTEUDO.md)).
