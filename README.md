# Painel dos Mandatos

Site público, gratuito e apartidário para acompanhar os mandatos 2027–2031 do **presidente da República** e do **governador de São Paulo**, com dados oficiais. Brasil e São Paulo são painéis separados.

Endereço: <https://drocacoin.github.io/painel-dos-mandatos/>

## Situação atual

- **Fase 1 (fundação):** concluída. Estrutura do projeto, verificações automáticas e publicação.
- **Fase 2 (indicadores):** concluída. 19 indicadores (7 do Brasil, 12 de SP) com gráficos, coleta automática diária e comparação com o início do mandato.
- Próximas: promessas (Fase 3), gastos (Fase 4), Congresso e Assembleia Legislativa (Fase 5, opcional) e metodologia (Fase 6). Plano completo: [docs/fase-0-planejamento.md](docs/fase-0-planejamento.md).

As pessoas eleitas ainda não aparecem no site. O projeto aguarda o resultado oficial do TSE (1º turno em 04/10/2026; 2º turno, se houver, em 25/10/2026). Como o mandato começa em 05/01/2027 (Brasil) e 06/01/2027 (SP), a comparação "desde o início do mandato" só aparece quando sair o primeiro dado de cada indicador a partir dessas datas.

## Como rodar no seu computador

Pré-requisito: [Node.js](https://nodejs.org) 24 (versão LTS).

```bash
npm ci       # instala as dependências nas versões exatas do package-lock.json
npm run dev  # abre o site em http://localhost:4321/painel-dos-mandatos/
```

Coleta dos dados (a mesma que o GitHub roda todo dia):

```bash
npm run coletar                    # todos os indicadores automáticos
npm run coletar -- sp/homicidios   # só os indicados (painel/indicador)
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
| `data/<painel>/indicadores/` | os dados, um JSON por indicador; o histórico do git é a trilha de auditoria                         |
| `scripts/`                   | coletores (`coletores/`), acesso à internet com novas tentativas (`http.ts`) e `coletar.ts`         |
| `src/pages/`                 | páginas: início e os painéis `/brasil/` e `/sp/`, cada um com Indicadores                           |
| `src/components/`            | cartão do indicador, gráfico com tabela e a linha de fonte                                          |
| `src/scripts/graficos.ts`    | desenho dos gráficos (Chart.js)                                                                     |
| `src/lib/`                   | validação (Zod), períodos, formatação em pt-BR e comparação com o início do mandato                 |
| `src/styles/`                | design system: `tokens.css` (cores, tamanhos, espaços) e `base.css`                                 |
| `tests/`                     | testes automáticos; `tests/fixtures/` tem respostas reais das APIs (não editar à mão)               |
| `docs/`                      | plano do projeto                                                                                    |
| `.github/workflows/`         | `ci.yml` (verificação e publicação), `coleta.yml` (coleta diária) e `conexao.yml` (teste de acesso) |

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

Cuidados de método, todos explicados também no próprio site:

- **Resultado primário do Brasil:** o Banco Central publica a série como "necessidade de financiamento", em que positivo significa déficit (Manual de Estatísticas Fiscais do BC). No site o sinal é invertido: positivo = superávit.
- **Meta Selic:** a série do BC é diária; o site mostra o valor vigente no último dia de cada mês (no mês atual, o vigente no dia da coleta).
- **Desemprego e renda de SP:** o recorte por estado só existe por trimestre; o do Brasil é por trimestre móvel (mensal).
- **Inflação de SP:** não existe IPCA por estado; o site usa o da Região Metropolitana de São Paulo.
- **Atividade de SP:** índice do Banco Central (IBCR-SP), não o PIB; o PIB estadual do IBGE sai com cerca de 3 anos de atraso.
- **Resultado primário de SP:** acumulado no ano; o ano corrente é parcial e aparece marcado (ex.: "jan-ago").
- **Mortes no trânsito:** soma de 12 meses; o mês mais recente é preliminar, porque mortes podem ser registradas dias depois do sinistro.
- **IDEB:** sai a cada 2 anos e é copiado à mão do arquivo oficial do INEP (o servidor do INEP recusa os servidores do GitHub).

### Coleta automática

O workflow [`coleta.yml`](.github/workflows/coleta.yml) roda todo dia às 10h17 de Brasília:

1. coleta cada indicador, com até 4 tentativas e espera crescente entre elas;
2. valida a resposta (Zod) e só grava se a série nova não estiver vazia e não tiver encolhido. Se algo falhar, o dado anterior daquele indicador fica intacto;
3. faz commit só se algum dado mudou, e então publica o site;
4. se algum indicador falhou, abre uma issue ("Falha na coleta automática") e termina em vermelho.

## Limitações conhecidas

- Pessoas eleitas ainda não definidas: aguardando o resultado oficial do TSE.
- Promessas e gastos ainda não publicados (Fases 3 e 4).
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

Chaves de API ficam só no arquivo `.env`, que o git ignora, e nos Secrets do GitHub. O modelo é o [`.env.example`](.env.example).

## Licenças

- Código: MIT ([LICENSE](LICENSE)).
- Conteúdo curado (promessas, textos e documentação): CC BY 4.0 ([LICENSE-CONTEUDO.md](LICENSE-CONTEUDO.md)).
