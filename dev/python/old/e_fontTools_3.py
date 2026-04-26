import sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import table__g_l_y_f
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen

# Полная конвертация otf(cff1) > ttf (glyph)

def log(msg):
    print(f"[INFO] {msg}", flush=True)

def log_error(msg):
    print(f"[ERROR] {msg}", flush=True, file=sys.stderr)

try:
    # 1. Загружаем OTF-CFF
    otf_path = "dfedit.otf"
    log(f"Загружаем OTF-CFF: {otf_path}")
    otf_font = TTFont(otf_path)
    cff = otf_font["CFF "]
    cff_font = cff.cff[0]

    # 2. Создаём TTF-шаблон
    temp_ttf = "temp_empty_glyf.ttf"
    log(f"Создаём TTF-контейнер с пустой glyf таблицей: {temp_ttf}")
    otf_font.save(temp_ttf)
    ttf_font = TTFont(temp_ttf)

    # получаем список всех глифов из CFF
    glyph_order = list(cff_font.CharStrings.keys())

    # добавляем стандартные системные глифы, если их нет
    for sys_glyph in [".notdef", ".null", "nonmarkingreturn"]:
        if sys_glyph not in glyph_order:
            glyph_order.insert(0, sys_glyph)

    # присваиваем TTFont
    ttf_font.setGlyphOrder(glyph_order)
    log(f"Glyph order установлен: {glyph_order[:10]} ...")  # первые 10 глифов для логирования

    # создаём пустую glyf таблицу, если её нет
    if "glyf" not in ttf_font:
        glyf_table = table__g_l_y_f()
        glyf_table.glyphs = {}  # инициализируем словарь для глифов
        ttf_font["glyf"] = glyf_table
        log("Пустая таблица glyf создана")


    # 3. Конвертация глифов CFF -> glyf
    log("Начинаем конвертацию глифов CFF1 → glyf")
    for glyph_name in glyph_order:
        try:
            charstring = cff_font.CharStrings[glyph_name]  # ← индексирование, не get()
        except KeyError:
            # если глифа нет в CharStrings, создаём пустой
            ttf_font["glyf"][glyph_name] = TTGlyphPen(ttf_font.getGlyphSet()).glyph()
            log(f"Глиф '{glyph_name}' отсутствует — создан пустой глиф")
            continue

        # пустой системный глиф
        if charstring.program == b"":
            ttf_font["glyf"][glyph_name] = TTGlyphPen(ttf_font.getGlyphSet()).glyph()
            log(f"Глиф '{glyph_name}' пустой — создан пустой глиф")
            continue

        # конвертация cubic -> quadratic
        pen = TTGlyphPen(ttf_font.getGlyphSet())
        cu2qu_pen = Cu2QuPen(pen, 1.0)  # старые версии fontTools
        charstring.draw(cu2qu_pen)
        ttf_font["glyf"][glyph_name] = pen.glyph()
        log(f"Глиф '{glyph_name}' конвертирован")


    # 4. Обновляем зависимые таблицы
    log("Пересчитываем таблицы loca, maxp, head, hmtx")
    ttf_font["loca"].recalc(ttf_font)
    ttf_font["maxp"].recalc(ttf_font)
    ttf_font["head"].checkSumAdjustment = 0

    for glyph_name in ttf_font.getGlyphOrder():
        advanceWidth, lsb = ttf_font["hmtx"][glyph_name]
        ttf_font["hmtx"][glyph_name] = (advanceWidth, lsb)


    # 5. Сохраняем готовый TTF-glyf
    out_path = "dfedit_py.ttf"
    ttf_font.save(out_path)
    log(f"Готовый TTF-glyf сохранён: {out_path}")

except Exception as e:
    log_error(f"Общая ошибка пайплайна: {e}")

log("[DONE] Процесс завершён")