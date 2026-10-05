# Como contribuir

O Painel dos Mandatos é público, gratuito e apartidário. Toda contribuição segue as mesmas regras do projeto: dados oficiais, fonte em todo número e linguagem neutra.

## Informar um erro

Achou um número, texto ou status diferente da fonte oficial? Abra uma issue pelo formulário [Correção de dado ou de promessa](https://github.com/drocacoin/painel-dos-mandatos/issues/new?template=correcao.yml). Informe:

- o endereço da página do site;
- o que está diferente;
- o link da fonte oficial com o dado correto.

Sem link de fonte oficial, a correção não entra.

## Propor uma promessa ou mudar um status

Cada promessa é um arquivo JSON em `data/<painel>/promessas/`. O modelo e as regras estão no [README](README.md#promessas). Em resumo:

1. O status só muda por edição humana do arquivo. O robô da coleta nunca mexe em promessas.
2. Para mudar o status, acrescente uma entrada **no fim** do `historico`, com data, novo status, justificativa (pelo menos 20 caracteres) e pelo menos um link de fonte oficial. Não apague nem edite entradas antigas.
3. Os critérios de cada status estão em [`config/promessas.ts`](config/promessas.ts) e na [página de metodologia](https://drocacoin.github.io/painel-dos-mandatos/metodologia/#promessas).
4. Abra um pull request. O CI confere as regras e bloqueia entradas sem justificativa ou sem fonte.

## Linguagem

Registre fatos, sem avaliar:

| Faça                                                           | Evite                     |
| -------------------------------------------------------------- | ------------------------- |
| "Passou de 5,3% para 5,0% desde o início do mandato."          | "O desemprego despencou." |
| "Status: descumprida. O prazo terminou sem a medida prevista." | "O governo falhou."       |

Nada de adjetivos de avaliação, como "forte", "fraco" ou "histórico".

## Mexer no código

Pré-requisito: [Node.js](https://nodejs.org) 24.

```bash
npm ci
npm run dev
```

Antes de enviar, rode as mesmas verificações do CI:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Regras do código:

- **Nunca invente** dados, códigos de série ou endereços. Antes de programar contra uma API, faça uma chamada real, salve a resposta em `tests/fixtures/` e registre o código em [`config/fontes.ts`](config/fontes.ts), com a data da verificação.
- **Toda resposta externa passa pelo Zod.** Se falhar, o dado anterior fica como estava e a coleta termina com erro. Dado bom nunca é trocado por vazio, zero ou erro.
- **Todo coletor tem testes com amostras reais**, incluindo API fora do ar, resposta malformada e resposta vazia.
- **Nenhum segredo no repositório.** Chaves de API ficam no arquivo `.env`, que o git ignora, e nos Secrets do GitHub.
- TypeScript estrito, ESLint e Prettier sem avisos.

## Licenças

Ao contribuir, você concorda que o código fica sob a licença [MIT](LICENSE) e o conteúdo sob a [CC BY 4.0](LICENSE-CONTEUDO.md).
