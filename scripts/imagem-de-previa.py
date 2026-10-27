"""Gera public/compartilhar.png (1200 x 630), a imagem de prévia quando o link do site é
compartilhado. Rodar de novo só se o texto ou as cores mudarem:

    python scripts/imagem-de-previa.py

Usa as cores de src/styles/tokens.css e a Source Serif 4 do próprio site. Não traz nomes de
políticos nem contagens, para não envelhecer.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
SERIF = RAIZ / 'node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff2'
SANS = Path('C:/Windows/Fonts/segoeui.ttf')  # só para gerar no Windows; o arquivo final é PNG

FUNDO, SUPERFICIE, SUPERFICIE_2 = '#111214', '#18191c', '#212327'
BORDA, BORDA_FORTE, TEXTO, SUAVE = '#2a2c31', '#3b3e45', '#ecedef', '#a3a7ae'

img = Image.new('RGB', (1200, 630), FUNDO)
d = ImageDraw.Draw(img)
serif = lambda t: ImageFont.truetype(str(SERIF), t)
sans = lambda t: ImageFont.truetype(str(SANS), t)

d.text((80, 70), 'Painel dos Mandatos', font=serif(36), fill=TEXTO)
d.text((80, 150), 'Promessas, gastos e números oficiais', font=serif(56), fill=TEXTO)
d.text((80, 222), 'dos mandatos de 2027 a 2031', font=serif(56), fill=TEXTO)
d.text(
    (80, 320),
    'Presidente da República e governador de São Paulo. Fonte em todo número.',
    font=sans(28),
    fill=SUAVE,
)

# Régua do mandato, o elemento assinatura do site.
x0, x1, y = 80, 1120, 440
d.rounded_rectangle((x0, y, x1, y + 10), radius=5, fill=SUPERFICIE_2, outline=BORDA)
for i, ano in enumerate(range(2027, 2031)):
    x = x0 + (x1 - x0) * i / 4
    d.line((x, y + 18, x, y + 44), fill=BORDA_FORTE, width=2)
    d.text((x + 10, y + 18), str(ano), font=sans(24), fill=SUAVE)

d.rounded_rectangle((0, 560, 1200, 630), radius=0, fill=SUPERFICIE)
d.line((0, 560, 1200, 560), fill=BORDA, width=1)
d.text((80, 577), 'drocacoin.github.io/painel-dos-mandatos', font=sans(26), fill=TEXTO)
d.text((1120, 577), 'Público, gratuito e apartidário', font=sans(26), fill=SUAVE, anchor='ra')

saida = RAIZ / 'public/compartilhar.png'
saida.parent.mkdir(exist_ok=True)
img.save(saida, optimize=True)
print(saida, img.size)
