// Configuração do Astro. O site é publicado no GitHub Pages em
// https://drocacoin.github.io/painel-dos-mandatos/
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://drocacoin.github.io',
  base: '/painel-dos-mandatos',
  // O padrão do Astro 7 ('jsx') apaga o espaço entre um texto e um link quando o
  // Prettier quebra a linha. `true` remove espaços sem mudar o que aparece na tela.
  compressHTML: true,
});
