/**
 * Atualiza a régua do mandato com a data de hoje (horário de Brasília) quando a página abre:
 * o site é gerado só quando os dados mudam, e a contagem até a posse não pode envelhecer.
 */
import { hojeEmBrasilia } from '../lib/formatar';
import { momentoDoMandato, textoDoMomento } from '../lib/tempo';

const hoje = hojeEmBrasilia();
for (const regua of document.querySelectorAll<HTMLElement>('[data-regua]')) {
  const { inicio, fim } = regua.dataset;
  if (!inicio || !fim) continue;
  const momento = momentoDoMandato(inicio, fim, hoje);
  regua
    .querySelector<HTMLElement>('.linha-mandato-trilho')
    ?.style.setProperty('--decorrido', String(momento.decorrido));
  const texto = regua.querySelector('[data-momento]');
  if (texto) texto.textContent = textoDoMomento(momento, fim);
  const marcaDeHoje = regua.querySelector<HTMLElement>('[data-hoje]');
  if (marcaDeHoje) {
    marcaDeHoje.hidden = momento.fase !== 'durante';
    marcaDeHoje.style.setProperty('--pos', String(momento.decorrido));
  }
}
