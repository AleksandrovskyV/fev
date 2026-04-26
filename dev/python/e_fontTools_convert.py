#4.62.1
# Not Work (other logic export ttf)


import sys
import traceback
from fontTools.ttLib import TTFont
from fontTools.cffLib.CFFToCFF2 import convertCFFToCFF2
# Импортируем VarStore напрямую из otTables
from fontTools.ttLib.tables.otTables import VarStore

def log(msg):
    print(f"[INFO] {msg}", flush=True)

try:
    log("Загрузка...")
    font = TTFont("source.otf")
    
    log("Конвертация в CFF2...")
    convertCFFToCFF2(font)

    # Удаляем старую таблицу (критично для открытия в Windows)
    if 'CFF ' in font:
        del font['CFF ']

    if 'CFF2' in font:
        cff2 = font['CFF2'].cff
        top_dict = cff2.topDictIndex
        
        # РУЧНАЯ ВАЛИДАЦИЯ VSTORE (То, чего не хватало для открытия)
        if not hasattr(top_dict, 'vstore') or top_dict.vstore is None:
            log("Добавление заглушки Variation Store (vstore)...")
            vstore = VarStore()
            vstore.Format = 1
            vstore.RegionList = None
            vstore.ItemVariationStore = None
            top_dict.vstore = vstore

    # Опционально: removeOverlaps(font) — требует 'pip install skia-pathops'
    # log("Удаление наложений пропущено (требует skia-pathops)...")

    log("Сохранение...")
    font.save("output_cff2_final.otf")
    log("[SUCCESS] Шрифт сохранен!")

    # Финальный принт для проверки
    check = TTFont("output_cff2_final.otf")
    has_vstore = hasattr(check['CFF2'].cff.topDictIndex, 'vstore')
    log(f"Результат проверки vstore: {has_vstore}")

except Exception as e:
    log(f"Ошибка: {e}")
    traceback.print_exc()