"""Genera las texturas (etiquetas, placa, tapa del CPU...) que usa el modelo de Blender.
Ejecutar con Python normal: python make_textures.py"""
import os, random
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'tex')
os.makedirs(OUT, exist_ok=True)
FB = 'C:/Windows/Fonts/arialbd.ttf'
FR = 'C:/Windows/Fonts/arial.ttf'


def font(size, bold=True):
    try:
        return ImageFont.truetype(FB if bold else FR, size)
    except Exception:
        return ImageFont.load_default()


def text(d, xy, s, size, fill, anchor='lm', bold=True):
    d.text(xy, s, font=font(size, bold), fill=fill, anchor=anchor)


def save(im, name):
    im.save(os.path.join(OUT, name))


# ---- placa (PCB oscuro con pistas)
def pcb():
    w, h = 1024, 1220
    im = Image.new('RGB', (w, h), '#17232c')
    d = ImageDraw.Draw(im)
    r = random.Random(7)
    for i in range(170):
        x, y = r.random() * w, r.random() * h
        pts = [(x, y)]
        for _ in range(2 + int(r.random() * 3)):
            if r.random() < .5:
                x += (r.random() - .5) * 260
            else:
                y += (r.random() - .5) * 260
            pts.append((x, y))
        d.line(pts, fill='#223540' if i % 5 else '#3a5a6a', width=2)
        d.ellipse((x - 2.4, y - 2.4, x + 2.4, y + 2.4), fill='#c9a24a')
    for q in range(26):
        text(d, (r.random() * w, r.random() * h), 'C%d' % (100 + q * 7), 14, '#7b858b', 'lm', False)
    save(im, 'pcb.png')


pcb()

# ---- tapa del procesador
for t, (nm, mod) in enumerate([('RYZEN 5', '9600X'), ('RYZEN 7', '9700X'), ('RYZEN 9', '9950X')]):
    im = Image.new('RGB', (256, 256), '#c5ced5')
    d = ImageDraw.Draw(im)
    for i in range(256):
        c = int(225 - 40 * abs(i - 128) / 128)
        d.line((0, i, 256, i), fill=(c, c + 4, c + 8))
    text(d, (128, 64), 'AMD', 38, '#4a5760', 'mm')
    text(d, (128, 128), nm, 30, '#3a464f', 'mm')
    text(d, (128, 172), mod, 34, '#3a464f', 'mm')
    text(d, (128, 214), 'AM5', 24, '#5a6872', 'mm', False)
    d.polygon([(10, 10), (46, 10), (10, 46)], fill='#c79a2b')
    save(im, 'cpu_%d.png' % t)

# ---- chipset
for t, nm in enumerate(['A620', 'B650', 'X870E']):
    im = Image.new('RGB', (128, 128), '#0d1317')
    text(ImageDraw.Draw(im), (64, 64), nm, 34, '#dfe7ec', 'mm')
    save(im, 'chipset_%d.png' % t)

# ---- etiqueta de RAM
for t, lab in [(1, '32 GB DDR5-6000'), (2, '64 GB DDR5-6000')]:
    im = Image.new('RGB', (512, 128), '#1b2227' if t == 1 else '#0d1215')
    text(ImageDraw.Draw(im), (256, 64), lab, 46, '#e6edf1', 'mm')
    save(im, 'ram_%d.png' % t)

# ---- borde de la GPU (visible desde el vidrio)
for t, (nm, vr) in enumerate([('5060', '8 GB'), ('5060 Ti', '16 GB'), ('5090', '32 GB')]):
    w, h = 1024, 128
    im = Image.new('RGB', (w, h), '#10161a')
    d = ImageDraw.Draw(im)
    for x in range(w):
        c = int(14 + 14 * x / w)
        d.line((x, 0, x, h), fill=(c, c + 6, c + 9))
    d.rectangle((0, h - 14, w, h - 8), fill='#d9480f' if t == 2 else '#3ddcc4')
    text(d, (32, 52), 'GEFORCE RTX ' + nm, 52, '#e8eef2', 'lm')
    text(d, (w - 32, 52), vr + ' GDDR7', 40, '#8fa1ad', 'rm')
    save(im, 'gpu_edge_%d.png' % t)

# ---- NVMe
for t, lab in [(1, 'NVMe 1 TB · PCIe 4.0'), (2, 'NVMe 2 TB · PCIe 5.0')]:
    im = Image.new('RGB', (512, 128), '#222a30' if t == 1 else '#0e1317')
    text(ImageDraw.Draw(im), (256, 64), lab, 38, '#e6edf1', 'mm')
    save(im, 'nvme_%d.png' % t)

# ---- HDD
for t, cap in [(1, '4 TB'), (2, '8 TB')]:
    im = Image.new('RGB', (512, 96), '#d9dfe3')
    text(ImageDraw.Draw(im), (256, 48), 'HDD %s · 5400 RPM' % cap, 40, '#1a2228', 'mm')
    save(im, 'hdd_side_%d.png' % t)
    im = Image.new('RGB', (256, 256), '#a9b4bc')
    d = ImageDraw.Draw(im)
    d.rectangle((24, 60, 232, 196), fill='#e4e9ec')
    text(d, (128, 110), cap, 48, '#1a2228', 'mm')
    text(d, (128, 160), 'SATA 6 Gb/s', 24, '#4a5760', 'mm', False)
    save(im, 'hdd_top_%d.png' % t)

# ---- cara de la fuente
for t, (w_, cert, c1, c2) in enumerate([('550', '80 PLUS BRONZE', '#a2682f', '#d28b4a'), ('750', '80 PLUS GOLD', '#c9a54a', '#e2c066'), ('1000', '80 PLUS PLATINUM', '#d9dde0', '#e7ecee')]):
    im = Image.new('RGB', (1024, 512), '#0e1519')
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 1024, 16), fill=c1)
    text(d, (60, 170), w_ + ' W', 150, '#eef2f4', 'lm')
    text(d, (64, 300), cert, 54, c2, 'lm')
    text(d, (64, 380), 'ATX · Modular · Ventilador de 135 mm', 40, '#8fa1ad', 'lm', False)
    for i in range(5):
        rr = 60 + i * 30
        d.ellipse((830 - rr, 256 - rr, 830 + rr, 256 + rr), outline='#26323a', width=3)
    save(im, 'psu_%d.png' % t)

# ---- tapa de la bomba AIO
im = Image.new('RGB', (256, 256), '#0b1013')
d = ImageDraw.Draw(im)
d.ellipse((32, 32, 224, 224), outline='#d9480f', width=14)
text(d, (128, 128), 'AIO', 64, '#e8eef2', 'mm')
save(im, 'pump.png')

print('texturas listas en', OUT, len(os.listdir(OUT)))
