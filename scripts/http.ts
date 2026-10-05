/**
 * Acesso à internet para os coletores: timeout, novas tentativas com espera crescente,
 * intervalo mínimo entre pedidos ao mesmo servidor e conferência do tipo da resposta.
 * Regras 3 e 4 do projeto.
 */
import type { z } from 'zod';

export class ErroDeColeta extends Error {
  // true quando repetir o pedido não adianta (ex.: HTTP 404, formato da resposta mudou).
  readonly definitivo: boolean;

  constructor(mensagem: string, definitivo = false) {
    super(mensagem);
    this.name = 'ErroDeColeta';
    this.definitivo = definitivo;
  }
}

export interface Dependencias {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  esperar: (ms: number) => Promise<void>;
  agora: () => number;
}

export const dependenciasReais: Dependencias = {
  fetch: (url, init) => fetch(url, init),
  esperar: (ms) => new Promise((resolver) => setTimeout(resolver, ms)),
  agora: () => Date.now(),
};

// Intervalo mínimo entre pedidos ao mesmo servidor. O Banco Central bloqueou pedidos
// seguidos nos testes da Fase 0; com 4 segundos, não bloqueou.
const INTERVALO_MS: Record<string, number> = { 'api.bcb.gov.br': 4000 };
const INTERVALO_PADRAO_MS = 1000;
const ultimoPedido = new Map<string, number>();

const TENTATIVAS = 4;
const TIMEOUT_MS = 60_000;
const esperaAntesDaTentativa = (tentativa: number) => 2000 * 2 ** (tentativa - 1); // 2 s, 4 s, 8 s

async function respeitarIntervalo(url: string, deps: Dependencias) {
  const servidor = new URL(url).host;
  const minimo = INTERVALO_MS[servidor] ?? INTERVALO_PADRAO_MS;
  const anterior = ultimoPedido.get(servidor);
  if (anterior !== undefined) {
    const falta = anterior + minimo - deps.agora();
    if (falta > 0) await deps.esperar(falta);
  }
  ultimoPedido.set(servidor, deps.agora());
}

const mensagemDe = (erro: unknown) => (erro instanceof Error ? erro.message : String(erro));

/**
 * Busca um endereço e devolve o texto da resposta.
 * `tipo` é o que a resposta precisa ser: 'json' ou 'csv'. Uma página HTML no lugar de JSON
 * (o Banco Central faz isso com status 200) conta como falha e é tentada de novo.
 */
export async function buscarTexto(
  url: string,
  tipo: 'json' | 'csv',
  opcoes: { codificacao?: string } = {},
  deps: Dependencias = dependenciasReais,
): Promise<string> {
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      await respeitarIntervalo(url, deps);
      const resposta = await deps.fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!resposta.ok) {
        const repetivel = resposta.status >= 500 || resposta.status === 429;
        throw new ErroDeColeta(`HTTP ${resposta.status}`, !repetivel);
      }
      const tipoRecebido = resposta.headers.get('content-type') ?? '';
      if (!tipoRecebido.includes(tipo)) {
        throw new ErroDeColeta(`esperava ${tipo}, recebeu "${tipoRecebido || 'sem tipo'}"`);
      }
      const bytes = await resposta.arrayBuffer();
      return new TextDecoder(opcoes.codificacao ?? 'utf-8').decode(bytes);
    } catch (erro) {
      ultimoErro = erro;
      if ((erro instanceof ErroDeColeta && erro.definitivo) || tentativa === TENTATIVAS) break;
      await deps.esperar(esperaAntesDaTentativa(tentativa));
    }
  }
  const definitivo = ultimoErro instanceof ErroDeColeta && ultimoErro.definitivo;
  throw new ErroDeColeta(`${url}: ${mensagemDe(ultimoErro)}`, definitivo);
}

/** Busca JSON e valida com o schema Zod. Formato inesperado é erro definitivo. */
export async function buscarJson<T>(
  url: string,
  schema: z.ZodType<T>,
  deps: Dependencias = dependenciasReais,
): Promise<T> {
  const texto = await buscarTexto(url, 'json', {}, deps);
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new ErroDeColeta(`${url}: a resposta não é um JSON válido`, true);
  }
  const resultado = schema.safeParse(dados);
  if (!resultado.success) {
    const problemas = resultado.error.issues
      .slice(0, 3)
      .map((p) => `${p.path.join('.') || '(raiz)'}: ${p.message}`);
    throw new ErroDeColeta(`${url}: formato inesperado (${problemas.join('; ')})`, true);
  }
  return resultado.data;
}
