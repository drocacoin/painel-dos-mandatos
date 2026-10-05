import { describe, expect, it } from 'vitest';
import {
  frasesDaPagina,
  gerarMarkdown,
  marcasDeCompromisso,
  trechosCandidatos,
} from '../scripts/rascunho-promessas';

// Texto FICTÍCIO no formato que o PDF devolve: número da página, título em maiúsculas e
// frases quebradas pela diagramação.
const PAGINA = [
  '12',
  '3.1 PROGRAMA DE TESTE',
  'O programa de teste do governo será ampliado para',
  'todas as regiões, com novos centros de atendimento.',
  'Hoje o programa atende cerca de mil pessoas por mês.',
  'Implantaremos o sistema de acompanhamento em parce-',
  'ria com os municípios da região metropolitana.',
  'Curto.',
].join('\n');

describe('frasesDaPagina', () => {
  it('junta as linhas, separa as frases e guarda a seção', () => {
    expect(frasesDaPagina(PAGINA)).toEqual([
      {
        secao: '3.1 PROGRAMA DE TESTE',
        texto:
          'O programa de teste do governo será ampliado para todas as regiões, com novos centros de atendimento.',
      },
      {
        secao: '3.1 PROGRAMA DE TESTE',
        texto: 'Hoje o programa atende cerca de mil pessoas por mês.',
      },
      {
        secao: '3.1 PROGRAMA DE TESTE',
        // Palavra quebrada: junta sem espaço e mantém o hífen para o revisor conferir.
        texto:
          'Implantaremos o sistema de acompanhamento em parce-ria com os municípios da região metropolitana.',
      },
    ]);
  });
});

describe('marcasDeCompromisso', () => {
  it('acha verbos no futuro em "-remos" e as palavras da lista, com acento', () => {
    expect(marcasDeCompromisso('Ampliaremos o atendimento e a meta será atingida.')).toEqual([
      'ampliaremos',
      'meta',
      'será',
    ]);
  });

  it('ignora palavras terminadas em "-remos" que não são verbo', () => {
    expect(marcasDeCompromisso('Casos extremos, tribunais supremos e o que queremos.')).toEqual([]);
  });
});

describe('trechosCandidatos e gerarMarkdown', () => {
  it('lista só as frases com sinal de compromisso, com página e número', () => {
    const trechos = trechosCandidatos(['', PAGINA]);
    expect(trechos.map((t) => [t.pagina, t.marcas])).toEqual([
      [2, ['será']],
      [2, ['implantaremos']],
    ]);
    const md = gerarMarkdown({
      painel: 'sp',
      arquivo: 'plano.pdf',
      sha256: 'abc',
      fonte: 'https://exemplo.gov.br/plano.zip',
      totalDePaginas: 2,
      paginasSemTexto: [1],
      trechos,
      geradoEm: new Date('2026-10-05T11:00:00Z'),
    });
    expect(md).toContain('Rascunho para revisão humana');
    expect(md).toContain('**Páginas sem texto** (provavelmente imagem; conferir à mão): 1');
    expect(md).toContain('## Página 2');
    expect(md).toContain('**#2** · seção: 3.1 PROGRAMA DE TESTE · sinais: implantaremos');
    expect(md).toContain('05/10/2026 às 08:00');
  });
});
