---
name: Painel dos Mandatos
description: Painel público e apartidário dos mandatos 2027–2031, com dados oficiais e fonte em todo número.
colors:
  grafite-fundo: '#111214'
  grafite-superficie: '#18191c'
  grafite-superficie-2: '#212327'
  grafite-borda: '#2a2c31'
  grafite-borda-forte: '#3b3e45'
  tinta-clara: '#ecedef'
  tinta-clara-suave: '#a3a7ae'
  papel-fundo: '#ffffff'
  papel-superficie: '#f6f6f7'
  papel-superficie-2: '#ebecee'
  papel-borda: '#e0e1e4'
  papel-borda-forte: '#c6c8cd'
  tinta-escura: '#16171a'
  tinta-escura-suave: '#5a5e66'
  status-cumprida: '#009e73'
  status-cumprida-em-parte: '#56b4e9'
  status-em-andamento: '#e69f00'
  status-nao-iniciada: '#8c959f'
  status-descumprida: '#d55e00'
  status-nao-avaliavel: '#cc79a7'
typography:
  display:
    fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif"
    fontSize: 'clamp(2.25rem, 1.6rem + 2.6vw, 3.25rem)'
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: '-0.02em'
  headline:
    fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif"
    fontSize: '2.25rem'
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: '-0.01em'
  title:
    fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif"
    fontSize: '1.375rem'
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: '-0.01em'
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif"
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif"
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
  numero:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif"
    fontSize: '1rem'
    fontWeight: 600
    lineHeight: 1.5
    fontFeature: 'tnum'
rounded:
  sm: '6px'
  md: '10px'
  lg: '16px'
  pilula: '999px'
spacing:
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '24px'
  '6': '32px'
  '7': '48px'
  '8': '64px'
components:
  botao-principal:
    backgroundColor: '{colors.tinta-clara}'
    textColor: '{colors.grafite-fundo}'
    rounded: '{rounded.pilula}'
    padding: '0 24px'
    height: '44px'
  pilula:
    backgroundColor: '{colors.grafite-superficie}'
    textColor: '{colors.tinta-clara-suave}'
    typography: '{typography.label}'
    rounded: '{rounded.pilula}'
    padding: '0 16px'
    height: '40px'
  pilula-atual:
    backgroundColor: '{colors.grafite-superficie-2}'
    textColor: '{colors.tinta-clara}'
    rounded: '{rounded.pilula}'
  bloco:
    backgroundColor: '{colors.grafite-superficie}'
    textColor: '{colors.tinta-clara}'
    rounded: '{rounded.lg}'
    padding: '24px'
  aviso:
    backgroundColor: '{colors.grafite-superficie}'
    textColor: '{colors.tinta-clara}'
    rounded: '{rounded.md}'
    padding: '16px 24px'
  campo-de-escolha:
    backgroundColor: '{colors.grafite-superficie}'
    textColor: '{colors.tinta-clara}'
    rounded: '{rounded.md}'
    padding: '8px 12px'
    height: '44px'
  botao-tema:
    backgroundColor: '{colors.grafite-superficie}'
    textColor: '{colors.tinta-clara}'
    rounded: '{rounded.pilula}'
    size: '44px'
---

# Design System: Painel dos Mandatos

## Overview

**Creative North Star: "A Apuração"**

O mandato é lido como uma apuração: uma régua de tempo e números que se conferem na fonte. A página é grafite quase preto, quieta, e o que fala são os títulos serifados e os números. Nada decora: cada elemento mostra um dado, diz de onde ele vem ou leva ao detalhe.

A densidade é de painel de consulta, não de página de campanha. O resumo vem primeiro, em linhas compactas dentro de blocos de borda fina; o detalhe (gráfico, tabela, fonte) fica a um clique. Brasil e São Paulo usam exatamente os mesmos componentes, na mesma ordem, e nunca aparecem lado a lado para comparação de números.

A referência visual escolhida pelo responsável é seuimposto.com (05/10/2026): tema escuro, painéis arredondados, abas em pílula e números grandes. Recusa o portal governamental cinza e a página de links soltos.

**Key Characteristics:**

- Grafite neutro, sem cor de marca; cor só para status de promessa.
- Títulos em Source Serif 4, servida pelo próprio site; interface e números na fonte do aparelho, com algarismos tabulares.
- Blocos com raio de 16 px e borda de 1 px, sem sombra.
- Navegação em pílulas: painel (Brasil | São Paulo) no cabeçalho, seções numa faixa fixa.
- A régua do mandato como elemento assinatura.

## Colors

Paleta de grafite neutro em dois temas (escuro por padrão, claro por botão), mais seis cores de status que só aparecem nos ícones de promessa.

### Neutral

- **Grafite Quase Preto** (grafite-fundo): fundo da página no tema escuro.
- **Grafite Superfície** (grafite-superficie): blocos, avisos, pílulas em repouso, campos.
- **Grafite Destaque** (grafite-superficie-2): pílula atual, trilho da régua, fundo das barras finas.
- **Borda Fina** (grafite-borda) e **Borda Forte** (grafite-borda-forte): contorno de blocos e divisórias das linhas; a forte marca anos na régua, campos e barra de rolagem.
- **Tinta Clara** (tinta-clara): texto, números, foco e o botão principal (texto escuro sobre ele). 16:1 sobre o fundo.
- **Tinta Suave** (tinta-clara-suave): rótulos, períodos, notas, rodapé. 7,6:1 sobre o fundo.
- **Papel** (papel-fundo, papel-superficie, papel-superficie-2, papel-borda, papel-borda-forte) e **Tinta Escura** (tinta-escura, tinta-escura-suave): os mesmos papéis no tema claro. A tinta suave do claro tem 6,6:1 sobre o fundo.

### Tertiary

- **Status das promessas** (status-cumprida, status-cumprida-em-parte, status-em-andamento, status-nao-iniciada, status-descumprida, status-nao-avaliavel): paleta Okabe-Ito, segura para daltonismo. Só no ícone de status e na barra do placar, sempre com o nome do status escrito ao lado.

### Named Rules

**The Neutral Ground Rule.** Nenhuma cor de marca e nenhuma cor associada a partido. A interface inteira é grafite; a única cor é a do status, e ela nunca aparece sozinha.

**The Same Token Rule.** Componentes usam as variáveis de `src/styles/tokens.css`, nunca cores soltas; o tema claro troca só os valores das variáveis.

## Typography

**Display Font:** Source Serif 4 (com Georgia e Times New Roman), pesos 400 e 600, servida pelo site.
**Body Font:** fonte do aparelho (system-ui, Segoe UI, Roboto, Noto Sans).

**Character:** a serifada dá o tom de jornal e de documento aos títulos; a sans do aparelho mantém números, rótulos e tabelas leves e legíveis.

### Hierarchy

- **Display** (600, clamp de 2,25 a 3,25 rem, 1,15): título da página inicial e nome do painel na visão geral.
- **Headline** (600, 2,25 rem, 1,15): título das páginas internas. Quando o título é uma frase inteira (resumo de promessa), cai para 1,375–1,75 rem.
- **Title** (600, 1,375 rem, 1,15): títulos de seção e de bloco; também a contagem da régua ("Faltam 92 dias para a posse").
- **Body** (400, 1 rem, 1,5): texto corrido, até 68 caracteres por linha.
- **Label** (400, 0,875 rem): rótulos, períodos, notas de bloco, pílulas, rodapé.
- **Número** (600, algarismos tabulares): valores nas linhas e nos pares rótulo-valor; o valor principal de cada indicador sobe para 2,25 rem.

### Named Rules

**The Serif Speaks First Rule.** A serifada é só para títulos, contagem da régua e citações do plano de governo. Números e rótulos ficam sempre na sans, com algarismos tabulares.

## Layout

Coluna única centrada de até 72 rem, com 16 px de margem lateral. Espaçamento em múltiplos de 4 px (4 a 64 px). Mobile primeiro: tudo empilha em uma coluna e funciona em 320 px sem rolagem lateral; tabelas largas rolam dentro da própria caixa.

A partir de 40 rem aparecem os minigráficos das linhas e duas colunas no placar. A partir de 56 rem os dois painéis da página inicial ficam lado a lado e a visão geral vira uma grade de dois blocos; o bloco largo (indicadores) ocupa a linha toda e divide suas linhas em duas colunas.

As linhas compactas seguem um molde: nome e detalhe à esquerda, número à direita, divisória de 1 px em cima; uma barra fina de 4 px embaixo quando há participação no total.

## Elevation & Depth

Plano por padrão. A profundidade vem de camadas de tom (fundo, superfície, superfície 2) e de bordas de 1 px, não de sombras. A única sombra é a da pílula atual (`0 1px 2px` a 25% de preto), que a destaca do trilho. A faixa de seções fixa no topo usa fundo a 92% com desfoque de 10 px, para o texto continuar legível sobre o conteúdo que passa por baixo.

### Named Rules

**The Flat Panel Rule.** Blocos, avisos e campos não têm sombra. Se algo precisa se destacar, troca de tom ou de borda.

## Shapes

Três raios: 6 px (detalhes pequenos), 10 px (avisos, campos, tabelas) e 16 px (blocos e painéis). Pílulas e botões são totalmente arredondados. Bordas sempre de 1 px; nenhuma borda lateral grossa como destaque. Ícones são SVG desenhados no próprio site, traço de 1,5 px.

## Components

### Buttons

- **Shape:** pílula (999 px), 44 px de altura.
- **Primary:** fundo na tinta clara, texto no grafite do fundo, peso 600, seta SVG à direita ("Abrir o painel Brasil →").
- **Hover / Focus:** opacidade 0,88 no hover; anel de foco de 2 px na cor do texto.
- **Botão de tema:** círculo de 44 px na superfície, com sol (no escuro) ou lua (no claro); fica escondido até o script carregar e informa o estado com aria-pressed.

### Chips

- **Style:** pílulas de 40 px dentro de um trilho arredondado na superfície; texto suave de 0,875 rem.
- **State:** a atual ganha a superfície 2, texto na tinta, peso 600 e a sombra mínima. Rolam para o lado no celular sem barra visível.

### Cards / Containers

- **Corner Style:** 16 px.
- **Background:** superfície sobre o fundo.
- **Shadow Strategy:** nenhuma (ver Elevation & Depth).
- **Border:** 1 px na borda fina.
- **Internal Padding:** 24 px; cabeçalho do bloco com título serifado à esquerda e link discreto à direita.

### Inputs / Fields

- **Style:** campo de escolha com 44 px de altura, superfície, borda forte de 1 px, raio de 10 px; seta nativa do aparelho.
- **Focus:** anel de 2 px na cor do texto.

### Navigation

- **Painel:** pílulas Brasil | São Paulo no cabeçalho; o link leva à mesma seção do outro painel quando ela existe.
- **Seções:** faixa de pílulas fixa no topo ao rolar; aria-current marca a seção atual.

### Régua do mandato

O elemento assinatura. Trilho de 6 px com os quatro anos marcados, a parte já decorrida preenchida na tinta e a marca de hoje durante o mandato. Na visão geral, os prazos das promessas aparecem como pílulas pequenas com a quantidade, acima do trilho. Acima da régua, a contagem em serifada; abaixo, uma legenda que diz em texto tudo o que o desenho mostra. Na abertura da página, anos e prazos pousam da esquerda para a direita, na ordem do tempo (só com movimento permitido pelo aparelho).

### Ícone de status

Círculo de 16 px que se enche conforme o andamento (vazio, um quarto, metade, cheio), um x para descumprida e uma interrogação para não avaliável. A forma muda com o status, então a cor nunca é o único sinal.

## Do's and Don'ts

### Do:

- **Do** colocar fonte, período e data de atualização ao lado de todo número.
- **Do** usar as mesmas peças, na mesma ordem, nos painéis Brasil e São Paulo.
- **Do** escrever os números com algarismos tabulares e alinhados à direita nas linhas.
- **Do** explicar uma vez por página o que vale para todos os cartões (como o aviso antes da posse), em vez de repetir em cada cartão.
- **Do** conferir contraste e acessibilidade nos dois temas.

### Don't:

- **Don't** usar cor de partido, cor de marca ou foto de candidato.
- **Don't** usar cor de status fora do ícone e da barra do placar, nem sem o nome do status escrito.
- **Don't** colocar sombra em blocos ou borda lateral grossa como destaque.
- **Don't** pôr rótulo pequeno em caixa alta acima dos títulos.
- **Don't** usar emoji ou caractere especial como ícone; ícones são SVG desenhados.
