import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buscarJson, buscarTexto, ErroDeColeta } from '../scripts/http';
import { amostra, foraDoAr, internetFalsa, TIPO } from './ajuda';

const URL_TESTE = 'https://api.bcb.gov.br/teste';

describe('buscarTexto', () => {
  it('tenta de novo quando o Banco Central devolve página HTML com status 200', async () => {
    let pedidos = 0;
    const deps = internetFalsa(() =>
      ++pedidos === 1
        ? { corpo: amostra('bcb/erro-200-html-requisicao-invalida.html'), tipo: TIPO.html }
        : { corpo: '[]', tipo: TIPO.bcb },
    );
    await expect(buscarTexto(URL_TESTE, 'json', {}, deps)).resolves.toBe('[]');
    expect(deps.fetch).toHaveBeenCalledTimes(2);
    expect(deps.esperar).toHaveBeenCalledWith(2000); // espera antes da 2ª tentativa
  });

  it('desiste depois de 4 tentativas, com espera crescente (2 s, 4 s, 8 s)', async () => {
    const deps = internetFalsa(() => foraDoAr());
    await expect(buscarTexto(URL_TESTE, 'json', {}, deps)).rejects.toThrow('fetch failed');
    expect(deps.fetch).toHaveBeenCalledTimes(4);
    const esperas = deps.esperar.mock.calls.map(([ms]) => ms);
    expect(esperas.filter((ms) => ms >= 2000)).toEqual([2000, 4000, 8000]);
  });

  it('não repete pedido que recebeu erro 4xx (repetir não adianta)', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('bcb/erro-406-janela-maior-que-10-anos.json'),
      tipo: TIPO.bcb,
      status: 406,
    }));
    const erro = await buscarTexto(URL_TESTE, 'json', {}, deps).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroDeColeta);
    expect((erro as ErroDeColeta).message).toContain('HTTP 406');
    expect(deps.fetch).toHaveBeenCalledTimes(1);
  });

  it('repete pedido que recebeu erro 5xx', async () => {
    const deps = internetFalsa(() => ({
      corpo: amostra('ibge/erro-500-tabela-inexistente.json'),
      tipo: TIPO.json,
      status: 500,
    }));
    await expect(buscarTexto(URL_TESTE, 'json', {}, deps)).rejects.toThrow('HTTP 500');
    expect(deps.fetch).toHaveBeenCalledTimes(4);
  });

  it('lê texto em Windows-1252 quando pedido (Infosiga)', async () => {
    const deps = internetFalsa(() => ({
      corpo: new Uint8Array([0x53, 0xe3, 0x6f]),
      tipo: TIPO.csv,
    }));
    await expect(
      buscarTexto(URL_TESTE, 'csv', { codificacao: 'windows-1252' }, deps),
    ).resolves.toBe('São');
  });
});

describe('buscarJson', () => {
  it('recusa JSON com formato diferente do esperado, sem repetir', async () => {
    const deps = internetFalsa(() => ({ corpo: '{"inesperado": true}', tipo: TIPO.json }));
    await expect(buscarJson(URL_TESTE, z.array(z.number()), deps)).rejects.toThrow(
      'formato inesperado',
    );
    expect(deps.fetch).toHaveBeenCalledTimes(1);
  });

  it('recusa resposta que não é JSON válido', async () => {
    const deps = internetFalsa(() => ({ corpo: '{quebrado', tipo: TIPO.json }));
    await expect(buscarJson(URL_TESTE, z.unknown(), deps)).rejects.toThrow('não é um JSON válido');
  });
});
