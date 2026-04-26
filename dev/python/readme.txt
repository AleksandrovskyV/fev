https://fonttools.readthedocs.io/en/latest/
https://github.com/fonttools/fonttools

pip install fonttools
python -c "import fontTools; print(fontTools.__version__)"

My fontTools version: 4.62.1 (latest)

Вопрос по fontTools - как я понимаю имеет внутренюю возможность конвертации из CFF в CFF2?
4.61.0 [instancer] Support –remove-overlaps for fonts with CFF2 table (#3975)
4.61.0 [CFF2ToCFF] Add –remove-overlaps option (#3976)
4.52.4 [varLib.cff] Restore and deprecate convertCFFtoCFF2 that was removed in 4.52.0 release as it is used by downstream projects (#3535)
4.52.2 [cffLib] Make CFFToCFF2 and CFF2ToCFF more robust (#3521, #3525)
4.52.0 [varLib.instancer] Added support for partial-instancing CFF2 tables! Also, added method to down-convert from CFF2 to CFF 1.0, and CLI entry points to convert CFF<->CFF2 (#3506)

Также я знаю факт что CFF1 не поддерживает Overlapping contours, а CFF2 поддерживает (на сайте Microsoft эта информация записана)
Есть ли метод конвертации в fontTools где я могу задать эту опцию?



!!!!!!!!!!!!!!!!!!! Отказался от fonttools, так как fonteditor-core решил все проблемы...


#4.52.0
from fontTools.ttLib import TTFont
from fontTools.cffLib.CFFToCFF2 import convertCFFtoCFF2

font = TTFont("input.otf")
convertCFFtoCFF2(font)
font.save("output_cff2.otf")



Вопрос по метод run_ttx_compile_to_ttf на чём он основан?
Ответ: на внутреннем инструмент ttx включенным в fontTools


Другое:
Внутри fontTools есть конвертер кривых
fontTools.ttLib.ttFont._TTGlyphPen
fontTools.pens.qu2cuPen
fontTools.pens.cu2quPen
и функция
fontTools.pens.cu2qu.convertCubicToQuadratic()