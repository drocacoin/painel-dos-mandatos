import { describe, expect, it } from 'vitest';
import { fontes } from '../config/fontes';
import { codigoDaFonte, fontesDoSite } from '../src/lib/metodologia';

describe('tabela de fontes da metodologia', () => {
  it('descreve o código de cada tipo de fonte', () => {
    expect(codigoDaFonte(fontes.bcb.selicMeta)).toBe('série 432');
    expect(codigoDaFonte(fontes.ibge.rendimentoSp)).toBe(
      'tabela 5436, variável 5933, N3[35], classificação 2[6794]',
    );
    expect(codigoDaFonte(fontes.siconfi.gastosPorFuncaoSp)).toBe('RREO-Anexo 02, ente 35');
    expect(codigoDaFonte(fontes.senado.processos)).toBeNull(); // esta tem endereço
  });

  it('toda fonte do site tem descrição, data de verificação e código ou endereço', () => {
    const linhas = fontesDoSite();
    expect(linhas.length).toBeGreaterThan(20);
    for (const linha of linhas) {
      expect(linha.descricao.length).toBeGreaterThan(0);
      expect(linha.verificadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(linha.codigo ?? linha.url).toBeTruthy();
    }
  });

  it('deixa de fora a fonte verificada que o site não usa', () => {
    expect(fontesDoSite().some((l) => l.instituicao === 'Portal da Transparência')).toBe(false);
  });
});
