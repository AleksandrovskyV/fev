import sys
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables._g_l_y_f import table__g_l_y_f
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen

#4.38.0

def log(msg):
    print(f"[INFO] {msg}", flush=True)


def log_error(msg):
    print(f"[ERROR] {msg}", flush=True, file=sys.stderr)


try:
    # -------------------------------------------------
    # 1. ЧИТАЕМ OTF
    # -------------------------------------------------
    otf = TTFont("dfedit.otf")
    cff_font = otf["CFF "].cff[0]
    glyph_order = otf.getGlyphOrder()
    charstrings = cff_font.CharStrings

    log(f"Загружено глифов: {len(glyph_order)}")

    for name in glyph_order:
        cs = charstrings[name]

        # Проверяем длину программы
        program_len = len(cs.program) if hasattr(cs, "program") else 0
        print(f"{name}: program length = {program_len}")

        # Если есть команды — можно их вывести
        if program_len > 0:
            # program — это список команд (bytecode-like), в fontTools можно распечатать
            print(f"  commands: {list(cs.program)}")
        else:
            print("  EMPTY program")

    # -------------------------------------------------
    # 2. СОЗДАЁМ TTF-КОНТЕЙНЕР
    # -------------------------------------------------
    ttf = TTFont()

    # копируем нужные таблицы (метрики и структура)
    for tag in ("head", "hhea", "maxp", "OS/2", "hmtx", "cmap", "name", "post"):
        if tag in otf:
            ttf[tag] = otf[tag]

    # glyph order
    ttf.setGlyphOrder(glyph_order)

    # glyf
    glyf = table__g_l_y_f()
    glyf.glyphs = {}
    glyf.glyphOrder = glyph_order[:]
    ttf["glyf"] = glyf

    # loca (пустая, заполнится при save)
    ttf["loca"] = newTable("loca")

    # ОБЯЗАТЕЛЬНО
    ttf["head"].indexToLocFormat = 1
    ttf["maxp"].numGlyphs = len(glyph_order)

    log("TTF-контейнер создан")

    # -------------------------------------------------
    # 3. КОНВЕРТАЦИЯ ГЛИФОВ
    # -------------------------------------------------
    charstrings = cff_font.CharStrings

    log("Конвертация CFF → glyf")

    for name in glyph_order:
        pen = TTGlyphPen(None)

        if name not in charstrings:
            ttf["glyf"][name] = pen.glyph()
            log_error("SKIP")
            continue

        cs = charstrings[name]
        cs.private = cff_font.Private
        cs.globalSubrs = cff_font.GlobalSubrs

        if not getattr(cs, "program", None):
            ttf["glyf"][name] = pen.glyph()
            log_error("SKIP PROGRAM")
            continue

        cu2qu = Cu2QuPen(pen, 1.0)
        cs.draw(cu2qu)

        glyph = pen.glyph()

        # 🔍 диагностика
        if glyph.numberOfContours == 0:
            log_error(f"EMPTY glyph after draw: {name}")

        ttf["glyf"][name] = glyph

    # -------------------------------------------------
    # 4. ПЕРЕСЧЁТ ТАБЛИЦ
    # -------------------------------------------------

    # maxp пересчитываем после заполнения glyf
    ttf["maxp"].recalc(ttf)

    # hmtx — просто гарантируем консистентность
    for g in glyph_order:
        if g not in ttf["hmtx"].metrics:
            ttf["hmtx"][g] = (0, 0)

    log("Таблицы обновлены")

    # -------------------------------------------------
    # 5. СОХРАНЕНИЕ
    # -------------------------------------------------

    log("=== TABLES ===")
    for tag in sorted(ttf.keys()):
        log(f"table: {tag}")

    log("=== GLYPH ORDER ===")
    go = ttf.getGlyphOrder()
    log(f"glyph count: {len(go)}")
    log(f"first 10: {go[:10]}")

    if go[0] != ".notdef":
        log_error("ERROR: .notdef НЕ первый!")

    for g in [".notdef", ".null", "nonmarkingreturn"]:
        if g not in go:
            log_error(f"ERROR: нет системного глифа {g}")

    log("=== HEAD/LOCA ===")
    log(f"indexToLocFormat: {ttf['head'].indexToLocFormat}")
    if "loca" not in ttf:
        log_error("loca отсутствует")

    ttf.save("result.ttf")

    log("Готово: result.ttf")

except Exception as e:
    log_error(f"Ошибка: {e}")