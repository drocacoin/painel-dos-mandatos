// Feed RSS 2.0 de "O que mudou", montado no build, sem biblioteca: os mesmos eventos da página.
import type { APIRoute } from 'astro';
import { ROTULO_DO_STATUS } from '../../config/promessas';
import { mandatos } from '../lib/mandatos';
import { eventosDasPromessas } from '../lib/mudancas';
import { carregarPromessas } from '../lib/promessas';

const escapar = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Meio-dia em Brasília, para a data do feed não cair no dia anterior em outro fuso.
const dataRss = (iso: string) => new Date(`${iso}T12:00:00-03:00`).toUTCString();

export const GET: APIRoute = ({ site }) => {
  const raiz = new URL(import.meta.env.BASE_URL.replace(/\/?$/, '/'), site).href;
  const eventos = eventosDasPromessas(
    mandatos.map((mandato) => ({ mandato, promessas: carregarPromessas(mandato.abrangencia) })),
  );
  const itens = eventos.map((e) => {
    const painel = e.mandato.nomeAbrangencia;
    const [titulo, link, descricao, guid] =
      e.tipo === 'registro'
        ? [
            `${painel}: ${e.promessas.length} ${e.promessas.length === 1 ? 'promessa registrada' : 'promessas registradas'}`,
            `${raiz}${e.mandato.abrangencia}/promessas/`,
            `Promessas do plano de governo registradas no painel ${painel}, todas como ${ROTULO_DO_STATUS[e.status]}.`,
            `registro-${e.mandato.abrangencia}-${e.data}`,
          ]
        : [
            `${painel}, ${e.promessa.id}: ${ROTULO_DO_STATUS[e.de]} para ${ROTULO_DO_STATUS[e.para]}`,
            `${raiz}${e.mandato.abrangencia}/promessas/${e.promessa.id}/`,
            `${e.promessa.resumo}. ${e.justificativa} Fonte: ${e.fontes.join(', ')}`,
            `mudanca-${e.mandato.abrangencia}-${e.promessa.id}-${e.data}`,
          ];
    return `    <item>
      <title>${escapar(titulo)}</title>
      <link>${escapar(link)}</link>
      <description>${escapar(descricao)}</description>
      <pubDate>${dataRss(e.data)}</pubDate>
      <guid isPermaLink="false">${escapar(guid)}</guid>
    </item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Painel dos Mandatos: o que mudou</title>
    <link>${raiz}o-que-mudou/</link>
    <description>Mudanças de status das promessas do presidente e do governador de São Paulo, com justificativa e fonte.</description>
    <language>pt-BR</language>
${itens.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
