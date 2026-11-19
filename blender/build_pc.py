"""Modela la torre y sus componentes en Blender y los exporta a un GLB.
Uso:  blender -b --factory-startup -P build_pc.py -- salida.glb
Convenciones (las mismas que la página):
  unidades = centímetros (1 unidad de Blender = 1 unidad de la escena 3D)
  X = hacia el frente de la torre, Y = arriba, Z = hacia el vidrio lateral (en coordenadas de la página)
  Cada pieza tiene una variante por nivel: cpu_t0, cpu_t1, cpu_t2, gpu_t0, ...  y la caja ('case').
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(bpy.data.filepath or __file__)) if '__file__' not in globals() else os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, 'tex')
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else os.path.join(HERE, 'pc.glb')

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


# ---------------------------------------------------------------- utilidades
def P(x, y, z):
    """coordenadas de la página (x, y arriba, z hacia el vidrio) -> Blender (x, -z, y)"""
    return (x, -z, y)


def lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexcol(h):
    h = h.lstrip('#')
    return (lin(int(h[0:2], 16)), lin(int(h[2:4], 16)), lin(int(h[4:6], 16)), 1.0)


_mats = {}
_imgs = {}


def image(name):
    if name not in _imgs:
        _imgs[name] = bpy.data.images.load(os.path.join(TEX, name))
    return _imgs[name]


def mat(name, color='#808080', metal=0.0, rough=0.5, emit=None, estr=1.0, img=None, emit_img=None, emit_img_strength=0.4):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = hexcol(color)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = hexcol(emit)
        b.inputs['Emission Strength'].default_value = estr
    if img:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = image(img)
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if emit_img:
            nt.links.new(t.outputs['Color'], b.inputs['Emission Color'])
            b.inputs['Emission Strength'].default_value = emit_img_strength
    _mats[name] = m
    return m


def link(o, parent):
    scene.collection.objects.link(o)
    o.parent = parent
    return o


def empty(name, parent=None, loc=None, extras=None):
    o = bpy.data.objects.new(name, None)
    o.empty_display_type = 'PLAIN_AXES'
    if loc is not None:
        o.location = P(*loc)
    if extras:
        for k, v in extras.items():
            o[k] = v
    return link(o, parent)


def finish(bm, smooth_deg=35):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    lim = math.radians(smooth_deg)
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        e.smooth = (len(e.link_faces) != 2) or (e.calc_face_angle(0) < lim)


def to_obj(name, bm, mats, parent, loc=(0, 0, 0)):
    finish(bm)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    o.location = P(*loc)
    return link(o, parent)


FACE_DIRS = {'+x': (1, 0, 0), '-x': (-1, 0, 0), '+y': (0, 0, 1), '-y': (0, 0, -1), '+z': (0, -1, 0), '-z': (0, 1, 0)}


def box(parent, name, c, s, m, bevel=0.0, faces=None):
    """caja centrada en c (coords de la página) de tamaño s=(x,y,z). faces={'+z': otro_material}"""
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * s[0], v.co.y * s[2], v.co.z * s[1]))
    bm.normal_update()
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for lp in f.loops:
            co = lp.vert.co
            if ax == 0:
                lp[uvl].uv = (co.y / s[2] + 0.5, co.z / s[1] + 0.5)
            elif ax == 1:
                lp[uvl].uv = (co.x / s[0] + 0.5, co.z / s[1] + 0.5)
            else:
                lp[uvl].uv = (co.x / s[0] + 0.5, co.y / s[2] + 0.5)
    if bevel > 0:
        r = min(bevel, min(s) * 0.45)
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=r, offset_type='OFFSET', segments=2, profile=0.6, affect='EDGES')
    bm.normal_update()
    mats = [m]
    if faces:
        idx = {}
        for k, mm in faces.items():
            mats.append(mm)
            idx[k] = len(mats) - 1
        bm.faces.ensure_lookup_table()
        for f in bm.faces:
            n = f.normal
            for k, i in idx.items():
                d = Vector(FACE_DIRS[k])
                if n.dot(d) > 0.95:
                    f.material_index = i
    return to_obj(name, bm, mats, parent, c)


def cyl(parent, name, c, r, h, axis, m, seg=24, r2=None):
    """cilindro con eje a lo largo de 'x','y' o 'z' de la página"""
    bm = bmesh.new()
    bm.loops.layers.uv.new('UVMap')
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=(r if r2 is None else r2), depth=h)
    if axis == 'x':
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
    elif axis == 'z':
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'))
    return to_obj(name, bm, [m], parent, c)


def torus(parent, name, c, R, r, axis, m, seg=40, tseg=8):
    bm = bmesh.new()
    verts = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        row = []
        for j in range(tseg):
            b = 2 * math.pi * j / tseg
            row.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
        verts.append(row)
    for i in range(seg):
        for j in range(tseg):
            bm.faces.new((verts[i][j], verts[(i + 1) % seg][j], verts[(i + 1) % seg][(j + 1) % tseg], verts[i][(j + 1) % tseg]))
    if axis == 'x':
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
    elif axis == 'z':
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'))
    return to_obj(name, bm, [m], parent, c)


def tube(parent, name, pts, r, m):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new('NURBS')
    sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts):
        b = P(*q)
        p.co = (b[0], b[1], b[2], 1.0)
    sp.order_u = 4
    sp.use_endpoint_u = True
    cu.materials.append(m)
    o = bpy.data.objects.new(name, cu)
    return link(o, parent)


def plane_tex(parent, name, c, w, h, face, m, thick=0.03):
    """lámina fina con una cara texturizada (face = '+z', '+x', ...); w,h en el plano de esa cara"""
    s = {'+z': (w, h, thick), '+x': (thick, w, h), '+y': (w, thick, h)}[face]
    return box(parent, name, c, s, mat('dark_plate', '#101417', 0.2, 0.6), faces={face: m})


def glow(parent, c, color, size, op):
    return empty('glow', parent, c, {'glow': [color, size, op]})


def rot_local(v, axis_spec):
    """gira un vector local (eje de ventilador = z) hacia ('y',+1)=+x, ('y',-1)=-x, ('x',+1)=-y"""
    x, y, z = v
    kind, sgn = axis_spec
    if kind == 'y':
        a = sgn * math.pi / 2
        return (x * math.cos(a) + z * math.sin(a), y, -x * math.sin(a) + z * math.cos(a))
    if kind == 'x':
        a = sgn * math.pi / 2
        return (x, y * math.cos(a) - z * math.sin(a), y * math.sin(a) + z * math.cos(a))
    return v


def mesh_from(parent, name, c, verts, faces, mats, rot):
    """crea un objeto desde vértices locales (coords de página alrededor de c) girados con rot"""
    bm = bmesh.new()
    vs = [bm.verts.new(P(*rot_local(v, rot))) for v in verts]
    for f in faces:
        try:
            bm.faces.new([vs[i] for i in f])
        except ValueError:
            pass
    return to_obj(name, bm, mats, parent, c)


# ---------------------------------------------------------------- materiales
M_CASE = mat('case_metal', '#0c0f12', 0.8, 0.42)
M_DK = mat('case_dark', '#06080a', 0.25, 0.78)
M_SHROUD = mat('case_shroud', '#0a0d10', 0.75, 0.45)
M_LED_ACC = mat('led_orange', '#d9480f', 0, 0.4, emit='#d9480f', estr=3.0)
M_LED_TEAL = mat('led_teal', '#35e0c8', 0, 0.4, emit='#35e0c8', estr=3.0)
M_LED_WHITE = mat('led_white', '#cfe8ff', 0, 0.4, emit='#cfe8ff', estr=3.0)
M_BLACK = mat('black_plastic', '#070a0c', 0.0, 0.55)
M_SILVER = mat('silver', '#c4ccd2', 0.95, 0.28)
M_GOLD = mat('gold', '#b99a3a', 1.0, 0.3)
M_ALU = {'light': mat('alu_light', '#aab6bf', 0.9, 0.34), 'dark': mat('alu_dark', '#191d21', 0.85, 0.36), 'darker': mat('alu_darker', '#23282c', 0.85, 0.36),
         'black': mat('alu_black', '#0f1316', 0.85, 0.32), 'io': mat('alu_io', '#424c53', 0.85, 0.4)}
M_PCB = mat('pcb', '#ffffff', 0.25, 0.4, img='pcb.png')
M_PCB_GREEN = mat('pcb_green', '#1c4a3d', 0, 0.5)
M_WHITE_CONN = mat('connector_white', '#e5e9ec', 0, 0.65)
M_FANFRAME = mat('fan_frame', '#0c0f12', 0.35, 0.45)
M_FANBLADE = mat('fan_blade', '#1b2328', 0.2, 0.35)
M_FANHUB = mat('fan_hub', '#11181d', 0.5, 0.4)
M_SCREW = mat('screw', '#2b3238', 0.9, 0.4)
M_COPPER = mat('copper', '#b8693b', 0.95, 0.22)
M_FIN = mat('alu_fins', '#aab5bd', 0.9, 0.3)
M_TUBE = mat('sleeve', '#0a0e11', 0, 0.8)
M_CABLE = mat('cable', '#080b0d', 0, 0.9)
M_HDD = mat('hdd_metal', '#9ba7b0', 0.9, 0.32)
M_CAP = mat('capacitor', '#101417', 0.4, 0.5)
M_CHOKE = mat('choke', '#7e8a92', 0.9, 0.4)
M_RUBBER = mat('rubber', '#07090b', 0, 0.95)
M_POWERBTN = mat('power_btn', '#20292f', 0.8, 0.35)


# ---------------------------------------------------------------- ventilador
def fan(parent, name, c, size, led=None, speed=7, rot=('y', 1), tag=''):
    """ventilador con marco, tornillos, aro LED y aspas que giran (empty 'spin' con eje en extras)"""
    s = size
    root = empty(name, parent, c)
    # ---- marco: anillo cuadrado con agujero circular
    depth = 2.5
    z0, z1 = -depth / 2, depth / 2
    N = 48
    half = s / 2
    rin = s * 0.455
    bm = bmesh.new()
    inn, out = [], []
    for i in range(N):
        a = 2 * math.pi * i / N
        ca, sa = math.cos(a), math.sin(a)
        ro = half / max(abs(ca), abs(sa))
        inn.append((bm.verts.new((rin * ca, rin * sa, z0)), bm.verts.new((rin * ca, rin * sa, z1))))
        out.append((bm.verts.new((ro * ca, ro * sa, z0)), bm.verts.new((ro * ca, ro * sa, z1))))
    for i in range(N):
        j = (i + 1) % N
        bm.faces.new((inn[i][1], inn[j][1], out[j][1], out[i][1]))
        bm.faces.new((inn[i][0], out[i][0], out[j][0], inn[j][0]))
        bm.faces.new((inn[i][0], inn[j][0], inn[j][1], inn[i][1]))
        bm.faces.new((out[i][0], out[i][1], out[j][1], out[j][0]))
    for v in bm.verts:
        v.co = Vector(P(*rot_local((v.co.x, v.co.y, v.co.z), rot)))
    to_obj(name + '_frame', bm, [M_FANFRAME], root)
    # ---- tornillos
    ax = {'y': 'x', 'x': 'y'}[rot[0]]
    for sx_ in (-1, 1):
        for sy_ in (-1, 1):
            p = rot_local((sx_ * s * 0.43, sy_ * s * 0.43, 1.28), rot)
            cyl(root, name + '_screw', p, 0.28, 0.2, ax, M_SCREW, 10)
    # ---- aro LED
    if led:
        p = rot_local((0, 0, 1.15), rot)
        torus(root, name + '_ring', p, s * 0.43, max(0.07, s * 0.012), ax, led, 48, 6)
    # ---- aspas + cubo (giran)
    spin_axis = rot_local((0, 0, 1), rot)
    spin = empty(name + '_spin', root, (0, 0, 0), {'spin': [round(spin_axis[0], 3), round(spin_axis[1], 3), round(spin_axis[2], 3)], 'speed': speed, 'tag': tag})
    n = 9
    leaf = [(0.07, -0.012), (0.14, -0.04), (0.26, -0.058), (0.38, -0.045), (0.435, 0.05), (0.38, 0.1), (0.26, 0.115), (0.14, 0.075), (0.07, 0.025)]
    bm = bmesh.new()
    pitch = 0.5
    th = 0.06
    for k in range(n):
        ang = 2 * math.pi * k / n
        top, bot = [], []
        for (px, py) in leaf:
            for zz, lst in ((th, top), (-th, bot)):
                y2 = py * s * math.cos(pitch) - zz * math.sin(pitch)
                z2 = py * s * math.sin(pitch) + zz * math.cos(pitch)
                x2 = px * s
                xr = x2 * math.cos(ang) - y2 * math.sin(ang)
                yr = x2 * math.sin(ang) + y2 * math.cos(ang)
                lst.append(bm.verts.new(P(*rot_local((xr, yr, z2), rot))))
        m_ = len(leaf)
        bm.faces.new(top)
        bm.faces.new(list(reversed(bot)))
        for i in range(m_):
            j = (i + 1) % m_
            bm.faces.new((top[i], bot[i], bot[j], top[j]))
    to_obj(name + '_blades', bm, [M_FANBLADE], spin)
    ax = {'y': 'x', 'x': 'y'}[rot[0]]
    cyl(spin, name + '_hub', rot_local((0, 0, 0), rot), s * 0.1, 1.4, ax, M_FANHUB, 20)
    cyl(spin, name + '_cap', rot_local((0, 0, 0.76), rot), s * 0.045, 0.1, ax, led if led else M_FANHUB, 16)
    if led:
        glow(root, rot_local((0, 0, 1.6), rot), 0xCFE8FF if led is M_LED_WHITE else 0xD9480F, s * 1.15, 0.42)
    return root


def fins(parent, name, c, w, h, z0, z1, n, m, stack='z'):
    bm = bmesh.new()
    for i in range(n):
        t = z0 + (z1 - z0) * i / (n - 1)
        b = bmesh.new()
        bmesh.ops.create_cube(b, size=1.0)
        for v in b.verts:
            if stack == 'z':
                v.co = Vector((v.co.x * w, v.co.y * 0.13, v.co.z * h)) + Vector(P(0, 0, t))
            else:
                v.co = Vector((v.co.x * 0.13, v.co.y * w, v.co.z * h)) + Vector(P(t, 0, 0))
        me = bpy.data.meshes.new('tmp')
        b.to_mesh(me)
        b.free()
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    # con stack 'z' las láminas son (w en x, grosor en z, h en y): en la página (w,h,0.13)
    return to_obj(name, bm, [m], parent, c)


def heatsink(parent, name, c, w, h, d, m, ribs):
    g = empty(name, parent, c)
    box(g, name + '_body', (0, 0, 0), (w, h, d), m, bevel=0.22)
    for i in range(ribs):
        box(g, name + '_rib', (0, -h / 2 + (i + 0.6) * h / ribs, d / 2 + 0.12), (w * 0.9, h / (ribs * 2.4), 0.4), m, bevel=0.1)
    return g


# ---------------------------------------------------------------- constantes de diseño
BX0, BY0, BW, BZ, SX, SY = -20.5, -12.0, 24.4, -9.2, -9.5, 6.5
GL, GT, GH = [24, 26.5, 33], [3.8, 4.5, 6.4], [11.5, 12.4, 14.4]
BOARD_NAME = ['A620', 'B650', 'X870E']


# ================================================================ CAJA
def build_case():
    g = empty('case')
    box(g, 'base', (0, -24.35, 0), (47.4, 0.7, 21.4), M_CASE, 0.25)
    box(g, 'tapa', (0, 24.35, 0), (47.4, 0.7, 21.4), M_CASE, 0.25)
    box(g, 'fondo', (0, 0, -10.35), (47.4, 49.4, 0.7), M_DK)
    box(g, 'trasera', (-23.35, 0, 0), (0.7, 49.4, 21.4), M_CASE, 0.2)
    box(g, 'frente_sup', (23.35, 24.2, 0), (0.7, 0.8, 21.4), M_CASE, 0.2)
    box(g, 'frente_inf', (23.35, -24.1, 0), (0.7, 0.8, 21.4), M_CASE, 0.2)
    box(g, 'frente_l1', (23.35, 0, 10.2), (0.7, 49.4, 0.8), M_CASE, 0.2)
    box(g, 'frente_l2', (23.35, 0, -10.2), (0.7, 49.4, 0.8), M_CASE, 0.2)
    box(g, 'poste1', (-23.2, 0, 10.3), (0.8, 49.4, 0.8), M_CASE, 0.2)
    box(g, 'poste2', (23.2, 0, 10.3), (0.8, 49.4, 0.8), M_CASE, 0.2)
    box(g, 'marco_sup', (0, 24.1, 10.3), (47.4, 0.8, 0.8), M_CASE, 0.2)
    box(g, 'marco_inf', (0, -24.1, 10.3), (47.4, 0.8, 0.8), M_CASE, 0.2)
    box(g, 'cubierta_fuente', (0, -12.55, 0), (46.4, 0.5, 20.6), M_SHROUD, 0.15)
    box(g, 'cubierta_l', (-22.25, -18.2, 9.75), (1.5, 11.5, 0.5), M_SHROUD, 0.12)
    box(g, 'cubierta_r', (8, -18.2, 9.75), (30, 11.5, 0.5), M_SHROUD, 0.12)
    box(g, 'cubierta_t', (-14, -13.5, 9.75), (15, 2, 0.5), M_SHROUD, 0.12)
    box(g, 'cubierta_b', (-14, -23.25, 9.75), (15, 1.5, 0.5), M_SHROUD, 0.12)
    box(g, 'cubierta_led', (0, -12.2, 9.95), (46.4, 0.15, 0.15), M_LED_ACC)
    for v in range(9):
        box(g, 'ranura', (-17 + v * 2.6, 24.72, 0), (1.3, 0.06, 15), mat('vent_slot', '#020304', 0, 0.9))
    box(g, 'io_panel', (16, 24.8, 5), (9, 0.5, 3.2), mat('io_panel', '#14181b', 0.7, 0.4), 0.1)
    for i, dx in enumerate((-2.6, 0, 2.6)):
        box(g, 'usb', (14.5 + dx * 1.4, 24.97, 5), (1.1, 0.2, 0.5), mat('usb_blue', '#0e5fb0', 0, 0.5) if i else mat('usb_black', '#020304', 0, 0.5))
    cyl(g, 'boton', (-14, 24.7, 6), 0.9, 0.5, 'y', M_POWERBTN, 24)
    torus(g, 'boton_led', (-14, 24.97, 6), 0.8, 0.08, 'y', M_LED_TEAL, 28, 6)
    glow(g, (-14, 25.3, 6), 0x35E0C8, 4, 0.5)
    for px, pz in ((-18, -7), (18, -7), (-18, 7), (18, 7)):
        cyl(g, 'pata', (px, -25.2, pz), 1.5, 1.1, 'y', M_RUBBER, 20, r2=1.4)
    return g


# ================================================================ PLACA
def build_board(t):
    g = empty('placa_t%d' % t)
    atx = t > 0
    bh = 30.5 if atx else 24.4
    bx, by = BX0 + BW / 2, BY0 + bh / 2
    top = BY0 + bh
    pcb_tint = [mat('pcb_t0', '#b9c3ca', 0.3, 0.4, img='pcb.png'), mat('pcb_t1', '#dfe6ea', 0.3, 0.4, img='pcb.png'), M_PCB][t]
    box(g, 'pcb', (bx, by, BZ), (BW, bh, 0.18), pcb_tint)
    zb = BZ + 0.09
    box(g, 'zocalo', (SX, SY, zb + 0.3), (5.7, 5.7, 0.6), mat('socket', '#b7c2ca', 0.9, 0.3), 0.1)
    box(g, 'zocalo_in', (SX, SY, zb + 0.45), (4.4, 4.4, 0.2), M_BLACK)
    hc = M_ALU['darker'] if t == 2 else M_ALU['dark']
    if t > 0:
        heatsink(g, 'vrm_izq', (-16, SY, zb + 1.2), 4.2, 11, 2.4, hc, 5)
        heatsink(g, 'vrm_sup', (-9.5, top - 2.2 if atx else top - 1.9, zb + 1.2), 13, 3.6 if atx else 3.2, 2.4, hc, 3)
        if t == 2:
            box(g, 'vrm_led', (-9.5, top - 0.9, zb + 2.5), (12, 0.2, 0.2), M_LED_ACC)
            glow(g, (-9.5, top - 0.9, zb + 3), 0xD9480F, 9, 0.3)
    else:
        for i in range(5):
            box(g, 'mosfet', (-16 + (i % 2) * 1.5, SY - 5 + i * 2.3, zb + 0.45), (2, 1.2, 0.9), M_BLACK)
        for j in range(4):
            box(g, 'mosfet', (-13 + j * 2.2, top - 1.5, zb + 0.45), (1.2, 2, 0.9), M_BLACK)
    for c in range(6):
        cy_ = SY - 7 + c * 2.6
        cyl(g, 'cap', (-13.2, cy_, zb + 0.5), 0.42, 0.95, 'z', M_CAP, 14)
        cyl(g, 'cap_top', (-13.2, cy_, zb + 1.0), 0.3, 0.06, 'z', M_GOLD, 14)
    for h in range(6):
        box(g, 'choke', (-6.4 + h * 1.15, top - (5.2 if atx else 3.8), zb + 0.5), (1.2, 1.1, 1.0), M_CHOKE, 0.12)
    for r in range(4):
        box(g, 'slot_ram', (-2.1 + r * 1.05, SY, zb + 0.4), (0.7, 13.8, 0.8), mat('ram_slot_a' if r % 2 else 'ram_slot_b', '#0c1115' if r % 2 else '#161e24', 0, 0.7), 0.1)
    box(g, 'pcie16', (-15.1, -3.5, zb + 0.55), (9, 1.1, 1.1), M_BLACK, 0.12)
    box(g, 'pcie1', (-19, -8.3, zb + 0.45), (3.1, 0.9, 0.9), M_BLACK, 0.1)
    if t > 0:
        box(g, 'pcie_metal', (-15.1, -3.5, zb + 1.15), (9, 0.45, 0.2), mat('pcie_metal', '#c8d0d6', 0.9, 0.2))
    cw = 3.2 if t == 0 else 5
    heatsink(g, 'chipset', (-5, -9, zb + 0.6), cw, cw, 1.2, hc, 3)
    lw = 2.6 if t == 0 else 4.2
    plane_tex(g, 'chipset_label', (-5, -9, zb + 1.22), lw, lw, '+z', mat('chipset_%d' % t, '#ffffff', 0.2, 0.6, img='chipset_%d.png' % t))
    for s2 in range(4):
        box(g, 'sata', (2.2, -5 - s2 * 1.15, zb + 0.55), (2.6, 0.8, 1.1), M_BLACK, 0.1)
    cyl(g, 'pila', (-3.5, -5.6, zb + 0.4), 1.1, 0.5, 'z', M_SILVER, 24)
    box(g, 'conn24', (3.1, top - 8, zb + 0.8), (1.4, 5.6, 1.6), M_WHITE_CONN, 0.12)
    box(g, 'conn8', (-18, top - 0.9, zb + 0.7), (3, 1.7, 1.4), M_WHITE_CONN, 0.12)
    for f in range(4):
        box(g, 'fan_header', (-1 + f * 1.6, -11.1, zb + 0.3), (1.4, 0.7, 0.6), M_BLACK)
    for (x, y) in [(-19.2, top - 1.2), (2.6, top - 1.2), (-19.2, BY0 + 1.2), (2.6, BY0 + 1.2), (-19.2, SY), (2.6, SY - 3), (-8, BY0 + 1.2), (-8, top - 9 if atx else top - 6)]:
        cyl(g, 'tornillo', (x, y, zb + 0.12), 0.36, 0.25, 'z', M_SILVER, 14)
    box(g, 'io', (-21.9, top - 6.4, BZ + 3.8), (2.8, 10.4, 7.4), M_ALU['io'], 0.2)
    for a in range(6):
        for b in range(3):
            box(g, 'puerto', (-23.32, top - 10 + a * 1.55, BZ + 1 + b * 2.1), (0.15, 1.3, 1.5), M_BLACK)
    if t == 2:
        box(g, 'io_led', (-21.9, top - 6.4, BZ + 7.6), (3, 10.6, 0.25), M_LED_ACC)
    return g


# ================================================================ CPU
def build_cpu(t):
    g = empty('cpu_t%d' % t)
    box(g, 'sustrato', (SX, SY, -8.4), (4.6, 4.6, 0.2), M_PCB_GREEN)
    side = mat('ihs_side', '#aab5be', 0.95, 0.25)
    box(g, 'ihs', (SX, SY, -8.12), (4, 4, 0.36), side, faces={'+z': mat('ihs_top_%d' % t, '#ffffff', 0.9, 0.28, img='cpu_%d.png' % t)})
    return g


# ================================================================ RAM
def build_ram(t):
    g = empty('ram_t%d' % t)
    h = [3.1, 3.3, 4.7][t]
    for dx in (-1.05, 1.05):
        z = -8.9 + h / 2
        box(g, 'dimm_pcb', (dx, SY, z), (0.18, 13.3, h), mat('dimm_pcb', '#1d2a22', 0, 0.45))
        box(g, 'dimm_oro', (dx, SY, -8.75), (0.2, 12.4, 0.4), M_GOLD)
        if t == 0:
            for c in range(4):
                box(g, 'chip', (dx + 0.12, SY - 4.5 + c * 3, z + 0.2), (0.12, 2, 1.6), M_BLACK)
        else:
            sm = M_ALU['black'] if t == 2 else M_ALU['dark']
            box(g, 'spreader', (dx, SY, z - 0.05), (0.55, 13.1, h - 0.2), sm, 0.12)
            plane_tex(g, 'etiqueta', (dx + 0.29, SY, z - 0.3), 8.6, 2.2, '+x', mat('ram_%d' % t, '#ffffff', 0.4, 0.45, img='ram_%d.png' % t))
            led = M_LED_ACC if t == 2 else M_LED_WHITE
            box(g, 'ram_led', (dx, SY, -8.9 + h - 0.1), (0.5, 12.2, 0.28), led)
            glow(g, (dx, SY, -8.9 + h + 0.8), 0xD9480F if t == 2 else 0xCFE8FF, 6, 0.35)
    return g


# ================================================================ GPU
def build_gpu(t):
    g = empty('gpu_t%d' % t)
    L, TH, H, nf = GL[t], GT[t], GH[t], [2, 2, 3][t]
    x0, cy, z0 = -20.2, -3.5, -8.65
    cx, cz = x0 + L / 2, z0 + H / 2
    body = [mat('gpu_body_0', '#15191c', 0.65, 0.36), mat('gpu_body_1', '#111518', 0.65, 0.36), mat('gpu_body_2', '#1b2024', 0.65, 0.36)][t]
    box(g, 'carcasa', (cx, cy, cz), (L, TH, H), body, 0.9)
    fs = min(L / nf * 0.92, H * 0.9)
    for i in range(nf):
        fan(g, 'gpu_fan%d' % i, (x0 + L / nf * (i + 0.5) + 0.2, cy - TH / 2 + 0.4, cz), fs, M_LED_ACC if t == 2 else None, 9, ('x', 1), 'gpu')
    box(g, 'backplate', (cx, cy + TH / 2 + 0.05, cz), (L - 0.4, 0.25, H - 0.4), M_ALU['light'] if t == 2 else mat('backplate_dark', '#22282d', 0.9, 0.32), 0.1)
    box(g, 'bracket', (x0 - 0.15, cy, cz), (0.35, TH + 1.1, H + 0.6), M_ALU['light'])
    for s in range(4):
        box(g, 'bracket_slot', (x0 - 0.34, cy - TH / 2 + 0.8 + s * 0.9, cz), (0.1, 0.5, H * 0.7), M_BLACK)
    cyl(g, 'bracket_tornillo', (x0 - 0.3, cy + TH / 2 + 0.7, cz + H * 0.32), 0.35, 0.3, 'x', M_SILVER, 14)
    plane_tex(g, 'borde', (cx, cy, z0 + H + 0.01), L - 0.6, TH - 0.5, '+z', mat('gpu_edge_%d' % t, '#ffffff', 0.2, 0.45, img='gpu_edge_%d.png' % t, emit_img=True, emit_img_strength=0.4))
    glow(g, (cx, cy - TH / 2 + 0.9, z0 + H + 1), 0xD9480F if t == 2 else 0x3DDCC4, L * 0.9, 0.28)
    box(g, 'conector12v', (x0 + L - 3.2, cy + TH / 2 + 0.4, z0 + H - 1.4), (2.4, 0.7, 1.3), mat('gpu_conn', '#0b0f12', 0, 0.65), 0.1)
    return g


# ================================================================ ALMACENAMIENTO
def build_storage(t):
    g = empty('almacenamiento_t%d' % t)
    nx, ny, nz = -10.5, 1.5, -8.55
    box(g, 'nvme_pcb', (nx, ny, nz), (8, 2.2, 0.2), M_PCB_GREEN)
    box(g, 'nvme_oro', (nx + 4.05, ny, nz - 0.1), (0.3, 2.4, 0.3), M_GOLD)
    cyl(g, 'nvme_tornillo', (nx - 4.2, ny, nz + 0.1), 0.3, 0.4, 'z', M_SILVER, 12)
    if t == 0:
        for dx in (-2.2, 0, 2.1):
            box(g, 'nvme_chip', (nx + dx, ny, nz + 0.17), (1.5, 1.4, 0.14), mat('nand', '#0a0a0a', 0, 0.35))
    else:
        w, hh, dd = (10, 3.4, 1.1) if t == 2 else (8.4, 2.6, 0.7)
        box(g, 'nvme_disipador', (nx, ny, nz + dd / 2 - 0.1), (w, hh, dd), M_ALU['black'] if t == 2 else M_ALU['dark'], 0.14)
        plane_tex(g, 'nvme_etiqueta', (nx, ny, nz + dd - 0.08), w * 0.82, hh * 0.7, '+z', mat('nvme_%d' % t, '#ffffff', 0.5, 0.4, img='nvme_%d.png' % t))
        if t == 2:
            box(g, 'nvme_led', (nx, ny - hh / 2 + 0.35, nz + dd + 0.1), (w * 0.8, 0.18, 0.2), M_LED_ACC)
    for i in range(t):
        y, x, z = -12.2 + 1.3 + i * 2.85, 10.2, -2.9
        box(g, 'hdd', (x, y, z), (14.7, 2.6, 10.2), M_HDD, faces={
            '+y': mat('hdd_top_%d' % t, '#ffffff', 0.6, 0.4, img='hdd_top_%d.png' % t),
            '+z': mat('hdd_side_%d' % t, '#ffffff', 0.4, 0.5, img='hdd_side_%d.png' % t)})
        box(g, 'hdd_sata', (x - 7.9, y, z - 2), (0.9, 0.5, 3), M_BLACK)
        for (px, pz) in ((-6.2, -4.2), (-6.2, 4.2), (6.2, -4.2), (6.2, 4.2)):
            cyl(g, 'hdd_tornillo', (x + px, y + 1.34, z + pz), 0.28, 0.12, 'y', M_SCREW, 10)
    return g


# ================================================================ FUENTE (la carcasa; los cables los arma la página)
def build_psu(t):
    g = empty('fuente_t%d' % t)
    ws = [14, 15, 16][t]
    fm = mat('psu_body', '#151d22', 0.7, 0.45)
    box(g, 'psu', (-22.4 + ws / 2, -19.1, -9.2 + 8), (ws, 8.6, 16), fm, faces={'+z': mat('psu_%d' % t, '#ffffff', 0.3, 0.45, img='psu_%d.png' % t)})
    return g


# ================================================================ REFRIGERACION
def build_cooling(t):
    g = empty('refrigeracion_t%d' % t)
    fan(g, 'ventilador_trasero', (-21.6, 18, 3), 12, None, 5.5, ('y', -1), 'case')
    cooler = empty('cooler', g)
    if t < 2:
        box(cooler, 'base', (SX, SY, -7.65), (4.4, 4.4, 0.5), M_COPPER, 0.1)
        for dy in (-3.6, -1.2, 1.2, 3.6):
            cyl(cooler, 'heatpipe', (SX, SY + dy, -5.9), 0.3, 3.4, 'z', M_COPPER, 12)
        if t == 0:
            fins(cooler, 'aletas', (SX - 2.6, SY, 0), 4.2, 11.6, -5.2, 7, 26, M_FIN)
            box(cooler, 'tapa', (SX - 2.6, SY, 7.2), (4.2, 11.6, 0.5), M_ALU['darker'], 0.12)
            fan(cooler, 'cooler_fan', (SX + 1.6, SY, 0.9), 12, None, 6, ('y', 1), 'cpu')
        else:
            fins(cooler, 'aletas_a', (SX - 4.1, SY, 0), 3.2, 11.6, -5.2, 7, 30, M_FIN)
            fins(cooler, 'aletas_b', (SX + 2.1, SY, 0), 3.2, 11.6, -5.2, 7, 30, M_FIN)
            fan(cooler, 'cooler_fan1', (SX - 1.0, SY, 0.9), 12, M_LED_WHITE, 6.5, ('y', 1), 'cpu')
            fan(cooler, 'cooler_fan2', (SX + 4.4, SY, 0.9), 12, M_LED_WHITE, 6.5, ('y', 1), 'cpu')
            box(cooler, 'tapa_a', (SX - 4.1, SY, 7.2), (3.2, 11.8, 0.5), M_ALU['darker'], 0.12)
            box(cooler, 'tapa_b', (SX + 2.1, SY, 7.2), (3.2, 11.8, 0.5), M_ALU['darker'], 0.12)
            for k in range(3):
                fan(g, 'frontal%d' % k, (21, -6 + k * 12, 0), 12, M_LED_WHITE, 5.5, ('y', 1), 'case')
    else:
        cyl(cooler, 'bomba', (SX, SY, -6), 3.9, 3.2, 'z', M_ALU['darker'], 40)
        cyl(cooler, 'bomba_tapa', (SX, SY, -4.38), 3.7, 0.05, 'z', mat('pump', '#ffffff', 0.4, 0.35, img='pump.png'), 40)
        torus(cooler, 'bomba_led', (SX, SY, -4.4), 3.85, 0.12, 'z', M_LED_ACC, 48, 6)
        glow(cooler, (SX, SY, -3.6), 0xD9480F, 11, 0.4)
        tube(cooler, 'tubo1', [(SX + 3.4, SY + 1.5, -5.5), (2, 13, -4.5), (10, 21, -3.5), (17.6, 23, -3.2)], 0.6, M_TUBE)
        tube(cooler, 'tubo2', [(SX + 3.4, SY - 1.5, -5.5), (3, 6, -5), (11, 15, -3), (17.6, 21, -1.2)], 0.6, M_TUBE)
        fins(g, 'radiador', (18.4, 6, 0), 2.6, 35, -5.9, 5.9, 60, M_FIN, stack='x')
        box(g, 'radiador_marco', (18.4, 6, 0), (2.8, 36, 12), mat('rad_frame', '#12181c', 0.8, 0.4), 0.25)
        for q in range(3):
            fan(g, 'rad_fan%d' % q, (20.9, -6 + q * 12, 0), 12, M_LED_ACC, 6, ('y', 1), 'case')
    return g


# ================================================================ construir todo
build_case()
for t in range(3):
    build_board(t)
    build_cpu(t)
    build_ram(t)
    build_gpu(t)
    build_storage(t)
    build_psu(t)
    build_cooling(t)

# cargar luz suave sólo para vista previa dentro de Blender (no se exporta)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True,
                          export_extras=True, export_cameras=False, export_lights=False,
                          export_image_format='AUTO', export_materials='EXPORT')
print('GLB_OK', OUT, os.path.getsize(OUT))
