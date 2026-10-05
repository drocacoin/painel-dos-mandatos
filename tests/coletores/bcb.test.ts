import { describe, expect, it } from 'vitest';
import { coletarBcb } from '../../scripts/coletores/bcb';
import { amostra, foraDoAr, indicador, internetFalsa, janela, TIPO } from '../ajuda';

const coletar = (id: string, deps: ReturnType<typeof internetFalsa>) =>
  coletarBcb({ indicador: indicador('brasil', id), janela, anterior: null, deps });

describe('coletor do Banco Central', () => {
  it('Selic: fica com o valor do fim de cada mês e descarta datas futuras', async () => {
    // Amostra real: 14,00% até meados de setembro, depois 13,75%, com datas até 04/11/2026.
    const deps = internetFalsa(() => ({
      corpo: amostra('bcb/sgs-432-meta-selic-set-dez-2026.json'),
      tipo: TIPO.bcb,
    }));
    await expect(coletar('selic', deps)).resolves.toEqual([
      { periodo: '2026-09', valor: 13.75 },
      { periodo: '2026-10', valor: 13.75 },
    ]);
    const url = String(deps.fetch.mock.calls[0]?.[0]);
    expect(url).toContain('bcdata.sgs.432');
    expect(url).toContain('dataInicial=01/01/2023&dataFinal=05/10/2026');
  });

  it('ordena por data (esta série vem do mais novo para o mais antigo)', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('bcb/sgs-13762-divida-bruta-ultimos-3.json'),
      tipo: TIPO.bcb,
    }));
    await expect(coletar('divida-bruta', deps)).resolves.toEqual([
      { periodo: '2026-06', valor: 81.95 },
      { periodo: '2026-07', valor: 82.56 },
      { periodo: '2026-08', valor: 82.86 },
    ]);
  });

  it('inverte o sinal do resultado primário (no BC, positivo = déficit)', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('bcb/sgs-5783-resultado-primario-ultimos-3.json'),
      tipo: TIPO.bcb,
    }));
    await expect(coletar('resultado-primario', deps)).resolves.toEqual([
      { periodo: '2026-06', valor: -1.06 },
      { periodo: '2026-07', valor: -0.55 },
      { periodo: '2026-08', valor: -0.53 },
    ]);
  });

  it('falha com resposta vazia (HTTP 404 "Value(s) not found"), sem repetir', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('bcb/vazio-periodo-futuro.json'),
      tipo: TIPO.bcb,
      status: 404,
    }));
    await expect(coletar('divida-bruta', deps)).rejects.toThrow('HTTP 404');
    expect(deps.fetch).toHaveBeenCalledTimes(1);
  });

  it('falha com resposta malformada (página HTML em vez de JSON) depois de 4 tentativas', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('bcb/erro-200-html-serie-inexistente.html'),
      tipo: TIPO.html,
    }));
    await expect(coletar('divida-bruta', deps)).rejects.toThrow('esperava json');
    expect(deps.fetch).toHaveBeenCalledTimes(4);
  });

  it('falha com a API fora do ar', async () => {
    const deps = internetFalsa(() => foraDoAr());
    await expect(coletar('divida-bruta', deps)).rejects.toThrow('fetch failed');
  });

  it('falha com JSON de formato inesperado (a API mudou)', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('bcb/erro-400-mais-de-20-valores.json'),
      tipo: TIPO.bcb,
    }));
    await expect(coletar('divida-bruta', deps)).rejects.toThrow('formato inesperado');
  });
});
