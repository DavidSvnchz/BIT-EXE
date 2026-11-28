"""Uso: python3 generar_niveles.py  (reescribe los niveles 2-20 dentro de js/niveles.js)

Genera los niveles 2-20 de Bit con restricciones de salto y los escribe en index.html.

Física de Bit: salto ≈ 53 px de alto (3 casillas justas) y ≈ 65 px de largo.
Reglas: subir 2 casillas → hueco máx. 2; subir 1 o igual → hueco máx. 3; bajar → hueco máx. 4.
"""
import json, random, re, sys

FILAS = 12
NOMBRES = [
    # Zona 1 · La entrada (Bit acaba de salir de la Red)
    "Cortafuegos Roto", "Router Abandonado", "Bus de Datos",
    # Zona 2 · Ciudad Caché
    "Barrio Caché", "Avenida del Búfer", "Torres de Píxeles", "Mercado de Paquetes",
    # Zona 3 · Los archivos olvidados
    "Cementerio de Cookies", "Archivos Temporales", "Papelera de Reciclaje", "Sector Corrupto",
    # Zona 4 · Las profundidades
    "Granja de Servidores", "Nube Tormentosa", "Kernel Profundo", "Memoria Volátil",
    # Zona 5 · Hacia el núcleo
    "Puente de Fibra", "Ancho de Banda", "Antesala del Núcleo", "Final: El Núcleo",
]
# Objetos fijos por nivel (índice 1 = nivel 2). Letras: E enchufe, L láser, C escudo, S espada, B batería
OBJETOS = {
    1: "E", 2: "B", 3: "L", 4: "E", 5: "C", 6: "B", 7: "S", 8: "LB", 9: "CE",
    10: "SB", 11: "LC", 12: "EB", 13: "SC", 14: "BLB", 15: "SCB",
    16: "LBE", 17: "CSB", 18: "EBL", 19: "BLSB",
}


def enemigos_disponibles(n):
    pool = [("4", 3), ("5", 2)]
    if n >= 2: pool.append(("6", 2))
    if n >= 4: pool.append(("8", 2))
    if n >= 6: pool.append(("K", 2))
    if n >= 8: pool.append(("7", 2))
    if n >= 10: pool.append(("H", 2))
    return pool


def generar(n, semilla):
    """n = índice del nivel (1..15)."""
    r = random.Random(semilla)
    d = round(min(1.0, (n - 1) / 13), 2)        # dificultad 0..1
    largo = 104 + n * 7
    alturas = []                                # altura de suelo por columna (0 = hueco)
    segmentos = []                              # (c0, c1, h)

    def poner(lon, h):
        c0 = len(alturas)
        alturas.extend([h] * lon)
        segmentos.append((c0, c0 + lon - 1, h))

    h = r.choice([2, 3])
    poner(9, h)
    while len(alturas) < largo - 14:
        dh = r.choice([-2, -1, 0, 0, 1, 1, 2] if d > 0.3 else [-1, 0, 0, 1, 1])
        nh = max(2, min(6, h + dh))
        dh = nh - h
        maxg = 2 if dh >= 2 else 3
        ming = 1 if dh == 0 else 0
        pesos = [max(0.2, 1 - d), 1, 1 + d, 0.5 + d, 0.3 + d][: maxg + 1]
        opciones = list(range(0, maxg + 1))
        g = r.choices(opciones, weights=pesos)[0]
        g = max(g, ming)
        alturas.extend([0] * g)
        lon = r.randint(4, 8) if d > 0.5 else r.randint(4, 9)
        poner(lon, nh)
        h = nh
    # tramo final con medalla y pared
    dh = max(-1, min(1, 3 - h))
    if h + dh != h:
        alturas.extend([0] * 2)
    jefe = n == 19
    poner(28 if jefe else 12, h + dh)
    final_h = h + dh
    cols = len(alturas) + 2

    m = [["0"] * cols for _ in range(FILAS)]
    for c, hh in enumerate(alturas):
        for f in range(FILAS - hh, FILAS):
            if hh: m[f][c] = "1"
    for f in range(FILAS):
        m[f][cols - 2] = m[f][cols - 1] = "1"
    sup = lambda hh: FILAS - hh          # fila de la superficie
    encima = lambda hh: FILAS - hh - 1   # fila donde está Bit de pie
    libre = lambda f, c: 0 <= f < FILAS and 0 <= c < cols and m[f][c] == "0"

    meta_c = cols - 6   # columna de la medalla
    m[encima(final_h)][meta_c] = "9"
    if jefe:
        m[encima(final_h) - 2][cols - 18] = "X"

    medio = segmentos[1:-1]
    # Pinchos
    pinchos = set()
    for (c0, c1, hh) in medio:
        lon = c1 - c0 + 1
        if lon >= 6 and r.random() < 0.35 + 0.45 * d:
            ancho = 2 if (d > 0.45 and lon >= 8 and r.random() < 0.5) else 1
            # lejos del borde de llegada (se aterriza ahí) y con sitio para caer después
            c = r.randint(c0 + 3, c1 - 1 - ancho)
            for k in range(ancho):
                m[encima(hh)][c + k] = "3"; pinchos.add(c + k)

    # Plataformas flotantes con monedas (solo en el centro de tramos largos, lejos de pinchos)
    for (c0, c1, hh) in medio:
        lon = c1 - c0 + 1
        if lon >= 8 and hh <= 5 and r.random() < 0.45:
            a = r.randint(c0 + 2, c1 - 5)
            ancho = 3
            if any(abs(c - p) <= 1 for c in range(a, a + ancho) for p in pinchos):
                continue
            fila = sup(hh) - 2
            for c in range(a, a + ancho):
                m[fila][c] = "1"
            for c in range(a, a + ancho):
                if libre(fila - 1, c): m[fila - 1][c] = "2"

    # Monedas: sobre los huecos y en filas sobre los tramos
    c = 0
    while c < len(alturas):
        if alturas[c] == 0:
            c1 = c
            while c1 < len(alturas) and alturas[c1] == 0: c1 += 1
            izq = alturas[c - 1] if c > 0 else 2
            der = alturas[c1] if c1 < len(alturas) else 2
            fila = sup(max(izq, der)) - 2
            medio_c = (c + c1 - 1) // 2
            if libre(fila, medio_c) and fila > 0: m[fila][medio_c] = "2"
            c = c1
        else:
            c += 1
    for (c0, c1, hh) in segmentos[:-1]:
        if r.random() < 0.5:
            a = r.randint(c0, max(c0, c1 - 2))
            for k in range(r.randint(2, 3)):
                cc = a + k
                if cc <= c1 and libre(encima(hh) - 1, cc) and libre(encima(hh), cc) and m[encima(hh) - 1][cc] == "0":
                    m[encima(hh) - 1][cc] = "2"

    # Objetos
    objetos = list(OBJETOS.get(n, ""))
    candidatos = [s for s in medio if s[1] - s[0] >= 3]
    r.shuffle(candidatos)
    zonas = sorted(candidatos[: len(objetos)], key=lambda s: s[0])
    for letra, (c0, c1, hh) in zip(objetos, zonas):
        for _ in range(20):
            c = r.randint(c0 + 1, c1 - 1)
            if libre(encima(hh), c) and c not in pinchos:
                m[encima(hh)][c] = letra; break

    # Enemigos
    pool = enemigos_disponibles(n)
    cuantos = 3 + round(d * 9)
    huecos_ok = [s for s in medio if s[0] > 18]
    for _ in range(cuantos):
        if not huecos_ok: break
        tipo = r.choices([t for t, _ in pool], weights=[w * (1 + d * (i)) for i, (_, w) in enumerate(pool)])[0]
        c0, c1, hh = r.choice(huecos_ok)
        if tipo in "57":            # torretas: al fondo del tramo
            c = c1 if libre(encima(hh), c1) else c1 - 1
            f = encima(hh)
        elif tipo == "6":           # volador: en el aire sobre el tramo
            c = r.randint(c0, c1); f = sup(hh) - 3
        else:
            c = r.randint(c0 + 1, c1); f = encima(hh)
        if f > 0 and libre(f, c) and c not in pinchos and abs(c - meta_c) > 3:
            m[f][c] = tipo

    # ------------------------------------------------------------------
    # REFUERZO de dificultad (niveles 3 a 19; el 1 y el 2 se quedan fáciles). Usa otro generador aleatorio para
    # no cambiar el recorrido (saltos, huecos) ya comprobado: solo añade enemigos
    # y pinchos y reduce las ayudas en los niveles altos.
    # ------------------------------------------------------------------
    if 2 <= n <= 18:
        r2 = random.Random(semilla * 7919 + 17)
        if n == 2:
            objetivo = 9                                       # nivel 3: 9 enemigos (antes 4)
            d_final = round(d + 0.05, 2)
        elif n <= 8:
            objetivo = round(13 + (n - 3) * 1.6)               # niveles 4-9: 13 a 21 enemigos (antes 10 a 15)
            d_final = round(d + 0.1, 2)
        else:
            objetivo = round(22 + (n - 9) * 1.65)              # niveles 10-19: 22 a 37 enemigos (antes 18 a 32)
            d_final = round(0.9 + (n - 9) * 0.07, 2)           # 0,90 a 1,53
        es_enemigo = lambda ch: ch in "45678KHX"
        actuales = [(f, c) for f in range(FILAS) for c in range(cols) if es_enemigo(m[f][c])]
        ocupadas = {c for _, c in actuales}
        cazadores = sum(1 for f, c in actuales if m[f][c] == "H")

        # Más pinchos en los niveles altos (mismas reglas de seguridad que antes)
        if n >= 9:
            for k, (c0, c1, hh) in enumerate(medio):
                lon = c1 - c0 + 1
                # si se llega bajando desde un tramo más alto, se aterriza más lejos del borde
                margen = 5 if segmentos[k][2] > hh else 3   # segmentos[k] es el tramo anterior a medio[k]
                if lon >= margen + 4 and not any(c0 <= p <= c1 for p in pinchos) and r2.random() < 0.6:
                    c = r2.randint(c0 + margen, c1 - 2)   # 2 casillas libres después para caer
                    if libre(encima(hh), c) and libre(encima(hh) - 1, c) is not None:
                        m[encima(hh)][c] = "3"; pinchos.add(c)
            # Menos ayudas: una sola mejora y batería extra solo cada 3 niveles
            letras = [(f, c) for f in range(FILAS) for c in range(cols) if m[f][c] in "ELCS"]
            for f, c in letras[1:]:
                m[f][c] = "2"
            baterias = [(f, c) for f in range(FILAS) for c in range(cols) if m[f][c] == "B"]
            for k, (f, c) in enumerate(baterias):
                if n % 3 != 0 or k > 0:
                    m[f][c] = "2"

        # Tipos con más peso cuanto más alto el nivel
        pesos = {"4": 3, "5": 2, "6": 2}
        if n >= 4: pesos["8"] = 2
        if n >= 6: pesos["K"] = 2
        if n >= 8: pesos["7"] = 2
        if n >= 9:
            pesos.update({"7": 3, "K": 3, "8": 3, "6": 3, "5": 3, "4": 2})
        if n >= 10: pesos["H"] = 1

        validos = [s for s in medio if s[0] > 18 and s[1] < meta_c - 4]
        intentos = 0
        while len(actuales) < objetivo and intentos < 600 and validos:
            intentos += 1
            tipo = r2.choices(list(pesos), weights=list(pesos.values()))[0]
            if tipo == "H" and cazadores >= 4:
                continue
            c0, c1, hh = r2.choice(validos)
            if tipo in "57":
                c = r2.choice([c1, c1 - 1, c0 + 2]); f = encima(hh)
            elif tipo == "6":
                # sobre un hueco cercano o sobre el tramo
                c = r2.choice([c0 - 1, c1 + 1, r2.randint(c0, c1)]); f = sup(hh) - 3
            elif tipo == "H":
                c = r2.randint(c0, c1); f = sup(hh) - 4
            else:
                c = r2.randint(c0 + 2, c1); f = encima(hh)   # nunca justo donde se aterriza
            if not (0 < f < FILAS and 0 <= c < cols) or not libre(f, c):
                continue
            if c in pinchos or any(abs(c - o) < 2 for o in ocupadas):
                continue
            if tipo not in "6H" and not (m[f + 1][c] == "1"):
                continue
            m[f][c] = tipo
            actuales.append((f, c)); ocupadas.add(c)
            if tipo == "H": cazadores += 1
        d = d_final

    inicio_f = encima(segmentos[0][2])
    return {
        "nombre": NOMBRES[n - 1],
        "dificultad": d,
        "inicio": {"col": 2, "fila": inicio_f},
        "mapa": ["".join(fila) for fila in m],
    }


def a_js(nivel):
    filas = ",\n".join('      "' + f + '"' for f in nivel["mapa"])
    return ("  {\n    nombre: " + json.dumps(nivel["nombre"], ensure_ascii=False) + ",\n"
            "    dificultad: " + str(nivel["dificultad"]) + ",\n"
            "    inicio: { col: " + str(nivel["inicio"]["col"]) + ", fila: " + str(nivel["inicio"]["fila"]) + " },\n"
            "    mapa: [\n" + filas + ",\n    ]\n  },")


if __name__ == "__main__":
    semillas = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else {}
    niveles = [generar(n, semillas.get(str(n), 1000 + n)) for n in range(1, 20)]
    bloque = "// @@NIVELES_GENERADOS@@\n" + "\n".join(a_js(nv) for nv in niveles) + "\n  // @@FIN_GENERADOS@@"
    import os
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "js", "niveles.js")
    s = open(p).read()
    if "// @@FIN_GENERADOS@@" in s:
        s = re.sub(r"// @@NIVELES_GENERADOS@@.*?// @@FIN_GENERADOS@@", lambda _: bloque, s, flags=re.S)
    else:
        s = s.replace("// @@NIVELES_GENERADOS@@", bloque)
    open(p, "w").write(s)
    print("niveles:", len(niveles), "columnas:", [len(nv["mapa"][0]) for nv in niveles])
