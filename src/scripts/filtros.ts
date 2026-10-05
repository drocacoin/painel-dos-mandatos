/**
 * Filtros da lista de promessas (tema e status). Sem JavaScript, os filtros ficam escondidos
 * e a lista aparece inteira; com JavaScript, eles aparecem e escondem o que não combina.
 */
const formulario = document.querySelector<HTMLFormElement>('[data-filtros]');
const lista = document.querySelector<HTMLElement>('[data-promessas]');
const contagem = document.querySelector<HTMLElement>('[data-contagem]');

if (formulario && lista && contagem) {
  const aplicar = () => {
    const tema = formulario.elements.namedItem('tema') as HTMLSelectElement;
    const status = formulario.elements.namedItem('status') as HTMLSelectElement;
    let visiveis = 0;
    for (const item of lista.querySelectorAll<HTMLElement>('[data-tema]')) {
      const combina =
        (!tema.value || item.dataset.tema === tema.value) &&
        (!status.value || item.dataset.status === status.value);
      item.hidden = !combina;
      if (combina) visiveis++;
    }
    contagem.textContent = `${visiveis} ${visiveis === 1 ? 'promessa' : 'promessas'}`;
  };
  formulario.hidden = false;
  formulario.addEventListener('change', aplicar);
  formulario.addEventListener('submit', (evento) => evento.preventDefault());
}
