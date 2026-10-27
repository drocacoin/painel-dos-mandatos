/**
 * Botão de tema: escuro é o padrão; o claro fica salvo no aparelho. Sem JavaScript o botão não
 * aparece e o site fica no tema escuro. O tema salvo é aplicado antes da pintura por um script
 * curto no <head> (src/layouts/Base.astro), para a página não piscar.
 */
const botao = document.querySelector<HTMLButtonElement>('[data-botao-tema]');

if (botao) {
  const raiz = document.documentElement;
  const atualizar = () => botao.setAttribute('aria-pressed', String(raiz.dataset.tema === 'claro'));
  botao.hidden = false;
  atualizar();
  botao.addEventListener('click', () => {
    const claro = raiz.dataset.tema !== 'claro';
    if (claro) raiz.dataset.tema = 'claro';
    else delete raiz.dataset.tema;
    try {
      localStorage.setItem('tema', claro ? 'claro' : 'escuro');
    } catch {
      // Sem acesso ao armazenamento (navegação privada): o tema vale só nesta página.
    }
    atualizar();
  });
}
