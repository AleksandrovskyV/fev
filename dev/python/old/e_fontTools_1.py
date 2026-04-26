from fontTools.ttLib import TTFont
import os

OVERLAP_SIMPLE = 0x40
OVERLAP_COMPOUND = 0x400

input_file = "dfedit.otf"
output_file = "dfedit_py.ttf"

print(f"[INFO] Loading font: {os.path.abspath(input_file)}")
font = TTFont(input_file)

if "glyf" not in font:
    print("[ERROR] Font does not contain 'glyf' table. Probably OTF-CFF.")
else:
    glyf = font["glyf"]
    order = font.getGlyphOrder()
    modified = 0

    print(f"[INFO] Processing {len(order)} glyphs...")

    for name in order:
        g = glyf[name]

        # empty
        if g.numberOfContours == 0 and not g.isComposite():
            continue

        before = getattr(g, "flags", None)

        if g.isComposite():
            g.flags |= OVERLAP_COMPOUND
        else:
            g.flags |= OVERLAP_SIMPLE

        if before is not None and g.flags != before:
            modified += 1
            print(f"[MODIFIED] {name} -> {hex(g.flags)}")

    print(f"[INFO] Modified glyphs: {modified}")

print(f"[INFO] Saving TTF: {os.path.abspath(output_file)}")
font.save(output_file)

print("[INFO] Done.")