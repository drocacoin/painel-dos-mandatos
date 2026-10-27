# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dois públicos, atendidos ao mesmo tempo (confirmado em 05/10/2026):

- **Cidadão comum**, quase sempre no celular, muitas vezes chegando por um link compartilhado. Quer entender rápido o que mudou, o que foi cumprido e quanto se gasta.
- **Jornalistas e pesquisadores**, no computador, que precisam de detalhe, tabelas, fontes e datas para citar.

A regra é: resumo primeiro, detalhe a um clique.

## Product Purpose

Site público, gratuito e apartidário para acompanhar os mandatos 2027–2031 do presidente da República e do governador de São Paulo, com dados oficiais. Cobre:

- promessas do plano de governo registrado no TSE, com status e histórico;
- indicadores comparados com o início do mandato;
- gastos por área de governo, corrigidos pela inflação;
- Congresso (só no Brasil): medidas provisórias e projetos do governo.

Sucesso é qualquer pessoa conseguir conferir na fonte oficial cada número que o site mostra.

## Positioning

Todo número mostra fonte com link, período de referência e data da última atualização. O status de uma promessa só muda por edição humana, com justificativa e link de fonte, e cada mudança fica no histórico público do GitHub. A coleta é automática e diária, e nunca troca dado bom por vazio, zero ou erro.

## Operating Context

- Site estático no GitHub Pages; dados em JSON versionados no git; coleta diária pelo GitHub Actions.
- Brasil e São Paulo são painéis separados e simétricos. Nenhuma página mistura ou compara presidente e governador.
- O mandato do presidente vai de 05/01/2027 a 05/01/2031; o do governador, de 06/01/2027 a 06/01/2031. Antes da posse, o site mostra o histórico e espera o primeiro dado do mandato.

## Capabilities and Constraints

- Stack fixa, que só muda com aprovação do responsável: Astro, TypeScript estrito, Zod, Vitest, Chart.js, CSS próprio com tokens; sem banco e sem backend.
- Números e datas no padrão pt-BR, horário de Brasília.
- Linguagem neutra: registra fatos, sem adjetivos de avaliação.
- Nenhuma cor associada a partido como cor da marca. Status de promessa sempre com ícone e texto, nunca só cor. Todo gráfico tem tabela equivalente.
- Períodos parciais ou preliminares aparecem marcados e não entram na comparação com o início do mandato.
- Em aberto: presidente eleito e promessas do Brasil, que dependem do 2º turno de 25/10/2026.

## Brand Commitments

- Nome: Painel dos Mandatos. Público, gratuito e apartidário.
- Licenças: código MIT; conteúdo CC BY 4.0.
- Referência visual escolhida pelo responsável em 05/10/2026: <https://seuimposto.com/> ("Apuração 2026"). Pedido: "algo parecido com esse site".

## Evidence on Hand

- 19 indicadores com séries reais (`data/<painel>/indicadores/`).
- 30 promessas do governo de SP, aprovadas pelo responsável (`data/sp/promessas/`).
- Gastos por função de Brasil e SP desde 2023 (`data/<painel>/gastos/`).
- 241 medidas provisórias e 103 projetos do Executivo desde 2023 (`data/brasil/congresso/`).
- Não há fotos de candidatos, mapas ou dados por município. O site não deve inventar nenhum desses elementos.

## Product Principles

1. **Verificável antes de bonito.** Fonte, período e atualização ficam junto de cada número, sempre.
2. **Neutro de verdade.** Nenhuma cor, palavra, ordem ou destaque favorece um lado.
3. **Resumo primeiro, detalhe a um clique.** Quem tem pressa entende na primeira tela; quem pesquisa encontra a tabela e a fonte.
4. **Separado e simétrico.** Brasil e SP usam os mesmos componentes, na mesma ordem, sem comparação entre eles.
5. **Honesto sobre o que falta.** Dado parcial, atrasado ou ainda inexistente aparece como tal, nunca como zero.

## Accessibility & Inclusion

- WCAG 2.2 nível AA; a auditoria com axe-core 4.12 estava sem violações nos temas claro e escuro em 05/10/2026.
- Funciona a 320 px sem rolagem lateral; navegação por teclado com foco visível; respeita `prefers-reduced-motion`.
- Cor nunca é o único sinal; cores de status da paleta Okabe-Ito, pensada para daltonismo.
