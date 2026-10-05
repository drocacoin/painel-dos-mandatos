# Painel dos Mandatos

Site público, gratuito e apartidário para acompanhar os mandatos 2027–2031 do **presidente da República** e do **governador de São Paulo**, com dados oficiais. Brasil e São Paulo são painéis separados.

Endereço: <https://drocacoin.github.io/painel-dos-mandatos/>

## Situação atual

A Fase 1 (fundação) está concluída: estrutura do projeto, verificações automáticas e site vazio publicado. As próximas fases trazem os indicadores (Fase 2), as promessas (Fase 3), os gastos (Fase 4), o Congresso e a Assembleia Legislativa (Fase 5, opcional) e a metodologia (Fase 6). O plano completo está em [docs/fase-0-planejamento.md](docs/fase-0-planejamento.md).

As pessoas eleitas ainda não aparecem no site. O projeto aguarda o resultado oficial do TSE (1º turno em 04/10/2026; 2º turno, se houver, em 25/10/2026).

## Como rodar no seu computador

Pré-requisito: [Node.js](https://nodejs.org) 24 (versão LTS).

```bash
npm ci       # instala as dependências nas versões exatas do package-lock.json
npm run dev  # abre o site em http://localhost:4321/painel-dos-mandatos/
```

Verificações (as mesmas que o GitHub roda a cada envio):

| Comando             | O que faz                                                      |
| ------------------- | -------------------------------------------------------------- |
| `npm run lint`      | ESLint (erros e más práticas) e Prettier (formatação)          |
| `npm run typecheck` | confere os tipos do TypeScript, inclusive nas páginas `.astro` |
| `npm test`          | roda os testes automáticos (Vitest)                            |
| `npm run build`     | gera o site final na pasta `dist/`                             |
| `npm run format`    | corrige a formatação automaticamente                           |

## Estrutura

| Pasta ou arquivo       | O que tem                                                                       |
| ---------------------- | ------------------------------------------------------------------------------- |
| `config/mandatos.json` | mandatos acompanhados: cargo, datas, pessoa eleita e partido (edição manual)    |
| `config/fontes.ts`     | todas as fontes de dados verificadas, cada uma com a data da verificação        |
| `src/pages/`           | páginas do site: início e os painéis `/brasil/` e `/sp/`                        |
| `src/layouts/`         | moldura comum das páginas (cabeçalho, menu do painel, rodapé)                   |
| `src/lib/`             | validação (Zod) e formatação de datas no padrão brasileiro                      |
| `src/styles/`          | design system: `tokens.css` (cores, tamanhos, espaços) e `base.css`             |
| `tests/`               | testes automáticos                                                              |
| `tests/fixtures/`      | respostas reais das APIs, usadas nos testes (não editar à mão)                  |
| `docs/`                | plano do projeto                                                                |
| `.github/workflows/`   | `ci.yml` (verificação e publicação) e `conexao.yml` (teste de acesso às fontes) |

## De onde vêm os dados

O site ainda não exibe dados. As fontes já verificadas com chamadas reais em 04/10/2026 estão em [`config/fontes.ts`](config/fontes.ts): Banco Central (SGS), IBGE (API de agregados), Tesouro Nacional (SICONFI), Portal da Transparência, TSE, Detran-SP (Infosiga), INEP e Senado. Limites e particularidades de cada uma: [docs/fase-0-planejamento.md](docs/fase-0-planejamento.md), seção 3.

## Limitações conhecidas

- Pessoas eleitas ainda não definidas: aguardando o resultado oficial do TSE.
- Indicadores, promessas e gastos ainda não publicados (Fases 2 a 4).
- Segurança e saúde em SP: ainda sem fonte de resultado com acesso automatizado confirmado; por enquanto, só os gastos.
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
