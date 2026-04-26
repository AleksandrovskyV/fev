import os
import subprocess
from fontTools.ttLib import TTFont

# Флаги overlap (ручные, т.к. констант нет в 4.38.0)
OVERLAP_SIMPLE = 0x40
OVERLAP_COMPOUND = 0x400

input_otf = "dfedit.otf"
temp_ttf = "dfedit_temp.ttf"
output_ttf = "dfedit_py.ttf"


def run_ttx_extract(otf_path):
    print("[STEP 1] Extracting OTF → TTX")

    cmd = ["ttx", "-f", "-o", "temp.ttx", otf_path]
    subprocess.run(cmd, check=True)

    print("[OK] temp.ttx created")


def run_ttx_compile_to_ttf():
    print("[STEP 2] Compiling TTX → TTF (glyf instead of CFF)")

    cmd = ["ttx", "-f", "-o", temp_ttf, "-t", "glyf", "-t", "head", "-t", "maxp", "-t", "loca", "temp.ttx"]
    subprocess.run(cmd, check=True)

    print(f"[OK] {temp_ttf} generated with glyf outlines")


def apply_overlap_flags(ttf_path, out_path):
    print("[STEP 3] Adding overlap flags")

    font = TTFont(ttf_path)

    if "glyf" not in font:
        print("[ERROR] glyf table still missing — conversion failed")
        return

    glyf = font["glyf"]
    order = font.getGlyphOrder()

    modified = 0
    for name in order:
        g = glyf[name]

        # пустой глиф
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

    font.save(out_path)
    print(f"[OK] Saved: {out_path}")


# --- RUN ---

print("[START] Converting OTF → TTF with overlap flags")
run_ttx_extract(input_otf)
run_ttx_compile_to_ttf()
apply_overlap_flags(temp_ttf, output_ttf)

print("[DONE]")