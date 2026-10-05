/**
 * Desenha os gráficos da página com Chart.js. Cada <canvas data-grafico="..."> traz os dados
 * em JSON (preparados no build). Cores vêm do design system (CSS) e mudam com o tema.
 */
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
  type ChartType,
  type Plugin,
} from 'chart.js';
import { formatarEixo, type Unidade } from '../lib/formatar';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

export interface DadosDoGrafico {
  tipo: 'linha' | 'colunas';
  unidade: Unidade;
  casas: number;
  rotulos: (string | string[])[]; // eixo (curtos; com nota, em duas linhas)
  rotulosLongos: string[]; // dica ao passar o mouse
  valores: number[];
  textos: string[]; // valores já formatados em pt-BR
  parciais: boolean[]; // ano incompleto ou dado preliminar
  marcador: number | null; // índice do primeiro período do mandato
}

// Opções dos dois plugins próprios, declaradas como o Chart.js documenta.
declare module 'chart.js' {
  // A declaração precisa repetir o parâmetro da interface original, mesmo sem usá-lo.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    marcadorDoMandato?: { indice: number | null; cor: string };
    mira?: { cor: string };
  }
}

/** "#1b1f24" + 0.1 → "rgba(27, 31, 36, 0.1)" (preenchimento suave sob a linha). */
function translucida(hex: string, alfa: number) {
  const cor = hex.replace('#', '');
  const seis = cor.length === 3 ? [...cor].map((c) => c + c).join('') : cor;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(seis.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

function cores() {
  const css = getComputedStyle(document.documentElement);
  const v = (nome: string) => css.getPropertyValue(nome).trim();
  return {
    texto: v('--cor-texto'),
    suave: v('--cor-texto-suave'),
    borda: v('--cor-borda'),
    fundo: v('--cor-fundo'),
  };
}

/** Linha vertical fina com o rótulo "Início do mandato". */
const marcadorDoMandato: Plugin = {
  id: 'marcadorDoMandato',
  afterDatasetsDraw(grafico, _args, opcoes: { indice?: number | null; cor?: string }) {
    if (opcoes.indice === null || opcoes.indice === undefined) return;
    const { ctx, chartArea, scales } = grafico;
    const x = scales.x?.getPixelForValue(opcoes.indice);
    if (x === undefined) return;
    ctx.save();
    ctx.strokeStyle = opcoes.cor ?? '#777';
    ctx.fillStyle = opcoes.cor ?? '#777';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = x > chartArea.left + (chartArea.right - chartArea.left) / 2 ? 'right' : 'left';
    ctx.fillText('Início do mandato', x + (ctx.textAlign === 'right' ? -4 : 4), chartArea.top + 12);
    ctx.restore();
  },
};

/** Linha vertical que acompanha o ponteiro (a "mira" encontra o período). */
const mira: Plugin = {
  id: 'mira',
  afterDatasetsDraw(grafico, _args, opcoes: { cor?: string }) {
    const ativo = grafico.tooltip?.getActiveElements()[0];
    if (!ativo) return;
    const { ctx, chartArea } = grafico;
    ctx.save();
    ctx.strokeStyle = opcoes.cor ?? '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ativo.element.x, chartArea.top);
    ctx.lineTo(ativo.element.x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

function configuracao(dados: DadosDoGrafico): ChartConfiguration<'line' | 'bar'> {
  const c = cores();
  const linha = dados.tipo === 'linha';
  return {
    type: linha ? 'line' : 'bar',
    data: {
      labels: dados.rotulos,
      datasets: [
        {
          data: dados.valores,
          borderColor: c.texto,
          borderWidth: linha ? 2 : 0, // colunas não têm contorno
          // Colunas: ano incompleto ou dado preliminar em tom mais claro.
          backgroundColor: linha
            ? translucida(c.texto, 0.1)
            : dados.parciais.map((parcial) => (parcial ? c.suave : c.texto)),
          fill: linha,
          tension: 0,
          pointRadius: dados.valores.map((_, i) => (i === dados.valores.length - 1 ? 4 : 0)),
          pointHoverRadius: 5,
          pointBackgroundColor: c.texto,
          pointBorderColor: c.fundo,
          pointBorderWidth: 2,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
          maxBarThickness: 24,
          borderRadius: 4,
          borderSkipped: 'start',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { display: false },
          border: { color: c.borda },
          // Colunas (poucas, anuais) mostram todos os rótulos; linhas pulam alguns.
          ticks: {
            color: c.suave,
            maxRotation: 0,
            autoSkip: linha,
            maxTicksLimit: linha ? 6 : undefined,
          },
        },
        y: {
          beginAtZero: !linha,
          grid: { color: c.borda },
          border: { display: false },
          ticks: {
            color: c.suave,
            maxTicksLimit: 5,
            callback: (valor) => formatarEixo(Number(valor), dados.unidade, dados.casas),
          },
        },
      },
      plugins: {
        legend: { display: false }, // uma só série: o título do cartão já diz o que é
        tooltip: {
          backgroundColor: c.fundo,
          borderColor: c.borda,
          borderWidth: 1,
          titleColor: c.texto,
          bodyColor: c.suave,
          displayColors: false,
          // O valor vem primeiro (em destaque); o período, depois.
          callbacks: {
            title: (itens) => dados.textos[itens[0]?.dataIndex ?? 0] ?? '',
            label: (item) => dados.rotulosLongos[item.dataIndex] ?? '',
          },
        },
        marcadorDoMandato: { indice: dados.marcador, cor: c.suave },
        mira: { cor: c.borda },
      },
    },
    plugins: [marcadorDoMandato, mira],
  };
}

const graficos: { grafico: Chart; dados: DadosDoGrafico }[] = [];

for (const canvas of document.querySelectorAll<HTMLCanvasElement>('canvas[data-grafico]')) {
  const dados = JSON.parse(canvas.dataset.grafico ?? '{}') as DadosDoGrafico;
  graficos.push({ grafico: new Chart(canvas, configuracao(dados)), dados });
}

// Tema claro/escuro mudou: redesenha com as cores novas.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  for (const item of graficos) {
    const nova = configuracao(item.dados);
    item.grafico.data = nova.data;
    item.grafico.options = nova.options ?? {};
    item.grafico.update();
  }
});
