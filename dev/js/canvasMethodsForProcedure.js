/* Glyph Deltas Structure
Нам нужно создать с нуля или обновить текущий ключ в GLYPH_DELTAS
В качестве структуры берем объект currentProcedureGlyph:

advanceWidth: 580
symbol: "А" // основной ключ
elements: (3) [StemLine, StemLine, StemLine] // те самые индексы
recipeFn: ƒ anonymous(p,self )
*/

function createCodeEditor() {
  if (codeEditor) return

  const fullCode = GLYPH_RECIPES[currentGlyph.name].toString();
  const body = fullCode.includes('{') 
      ? fullCode.substring(fullCode.indexOf('{') + 1, fullCode.lastIndexOf('}'))
      : fullCode;
  const trimmedBody = body.replace(/^\s*\n?/, '').replace(/\n?\s*$/, '');
  
  // Пропуск блока по инициализации

  // Отслеживание изменений
  codeEditor.on("change", (cm, change) => {
    if (change.origin !== "setValue") { 
      const codeString = `(p, self) => {\n${cm.getValue()}\n}`;
      updateRecipeFromEditor(currentGlyph.name, codeString);
    }
  });
}

function updateProcedureGlyph() {
  if (currentProcedureGlyph && currentItem) {
    const recipeFn = GLYPH_RECIPES[currentItem.name];
    if (recipeFn) {
      currentProcedureGlyph.update(currentItem.name, recipeFn, GFONT_PARAMS);
    }
  }
}

function updateRecipeFromEditor(symbol, codeString) {
    try {
        GLYPH_RECIPES_TEXT[symbol] = codeString.trim();
        GLYPH_RECIPES[symbol] = eval(codeString);

        if (currentProcedureGlyph) updateProcedureGlyph()
    }
}




// Пока Хранится в ProcedureGlyph.js

let GLYPH_DELTAS = {};

// AppMain.js
function updateProcedureGlyphDeltas(el, delta = { x: 0, y: 0 }) {
// updateProcedureGlyphDeltas(el, null); // создаем 
// updateProcedureGlyphDeltas(el, { x: deltaX, y: deltaY }); // обвноялем
// updateProcedureGlyphDeltas(); // выводим в консоль

    if (!currentProcedureGlyph) return;
    const char = currentProcedureGlyph.symbol;
    if (!GLYPH_DELTAS[char]) GLYPH_DELTAS[char] = {};


    if (el) {
        const elIndex = currentProcedureGlyph.elements.indexOf(el);
        const ptIndex = el.selectedIndex; // Индекс точки: 0 или 1

        if (!GLYPH_DELTAS[char][elIndex]) {
            GLYPH_DELTAS[char][elIndex] = {
                pts: [{x: 0, y: 0}, {x: 0, y: 0}], 
                w: el.w ?? 300,
                penAngle: el.penAngle ?? 0
            };
            console.log(`Создали запись для элемента ${elIndex}`);
        } 
        
        // Если передана дельта — обновляем существующую запись
        if (delta && ptIndex !== null) {
            // Обновляем только ТУ точку, за которую тянем
            GLYPH_DELTAS[char][elIndex].pts[ptIndex] = { x: delta.x, y: delta.y };
            GLYPH_DELTAS[char][elIndex].w = el.w;
            GLYPH_DELTAS[char][elIndex].penAngle = el.penAngle;
        }
    } else {
        console.log(`Текущая дельта для "${char}":`, GLYPH_DELTAS[char]);
    }

}

function updateProcedureGlyph() {
  if(!handleChange) console.log("updateProcedureGlyph");

  if (currentProcedureGlyph && currentItem) {
    const recipeFn = GLYPH_RECIPES[currentItem.name];
    
    if (recipeFn) {
      slog(`Рецепт для ${currentItem.name} найден!`);
      currentProcedureGlyph.update(currentItem.name, recipeFn, GFONT_PARAMS);
    } else {
      slog(`Рецепт для ${currentItem.name} не найден!`,"warn");
    }
  }
}

let procSelected = null;
let procDragged = false;

canvas.addEventListener("mousedown", e => {
  let procHitFound = false;

    if (pEditMode && currentProcedureGlyph) { // Procedure Point Edit
        procDragged = false;

        currentProcedureGlyph.elements.forEach(el => {
            if (el instanceof StemLine) {
                if ( el.checkHit(fx, fy, true) ){

                    procHitFound = true;
                    procSelected = el;
                    updateProcedureGlyphDeltas(el, null); // Создает запись в GLYPH_DELTAS
                    
                    const current = el.getDeltas(el.selectedIndex);

                    // Перезаписываем старт позицию с учётом накопленных данных
                    fMouseTempX = fx - current.dx;
                    fMouseTempY = fy - current.dy;

                    // Установка курсора
                    editorCanvas.style.cursor = "default";
                    return

                }
            }
        });

        if (!procHitFound) {
            procSelected = null;
            currentProcedureGlyph.elements.forEach(el => { 
                if (el.selectedIndex !== undefined) el.selectedIndex = null; 
            });

        }
    }

    renderEditorCanvas();
});

canvas.addEventListener("mousemove", e => {
    let procHitFound = false;

    if (pEditMode && currentProcedureGlyph) {
        if (procSelected) {
            procDragged = true; // deltaFlag - активно меняем дельту
            updateProcedureGlyphDeltas(procSelected, { x: fDeltaX, y: fDeltaY });
            return safeReturn();  
        } else {
            // Используем for...of вместо forEach
            for (const el of currentProcedureGlyph.elements) {
                if (el instanceof StemLine) {
                    if (el.checkHit(fx, fy)) { // проверка, чтобы код ниже не актвировал курсор 
                        editorCanvas.style.cursor = "default";
                        procHitFound = true;
                        return safeReturn(true);
                    }
                }
            }
        }
    }
});

window.addEventListener("mouseup", e => {

    if (pEditMode && currentProcedureGlyph && procSelected) { // Procedure Letter
        procDragged = false
        updateProcedureGlyphDeltas(); // выводим в консоль
        procSelected = null; 
        commitGlyphEdits();
    }

    startFontX = 0; startFontY = 0; initialValue = 0;

});