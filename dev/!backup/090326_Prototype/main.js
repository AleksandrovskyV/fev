const dropzone = document.getElementById("dropzone")
const grid = document.getElementById("grid")
const closeBtn = document.getElementById("closeEditor");

const editor = document.getElementById("editor")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

let font = null
let currentVariationFont = null; // Здесь будет шрифт с примененной шириной
let glyphArray = []
let currentSettings = {}; // Глобальная переменная

const debug = false;

// drag drop
window.addEventListener("dragover", e => {
    e.preventDefault()
})

window.addEventListener("dragenter", ()=>{
    document.body.classList.add("drag")
})

window.addEventListener("dragleave", ()=>{
    document.body.classList.remove("drag")
})

function setupVariationControls() {
    const controls = document.getElementById("variation");
    if (!controls) return;
    controls.innerHTML = ""; 

    // Если шрифт ОБЫЧНЫЙ (не вариативный), просто очищаем панель и выходим
    if (!font.tables.fvar || !font.tables.fvar.axes) {
        controls.innerHTML = "<p>Статический шрифт (без вариаций)</p>";
        return; 
    }

    const axes = font.tables.fvar.axes;
    currentSettings = {};

    axes.forEach(axis => {
        const row = document.createElement("div");
        row.className = "control-row";
        currentSettings[axis.tag] = axis.defaultValue;

        row.innerHTML = `
            <label>${axis.tag}</label>
            <input type="range" min="${axis.minValue}" max="${axis.maxValue}" value="${axis.defaultValue}" step="1">
            <span class="axis-val">${axis.defaultValue}</span>
        `;

        const input = row.querySelector("input");
        const valSpan = row.querySelector(".axis-val");

        input.oninput = (e) => {
            const val = parseFloat(e.target.value);
            valSpan.innerText = val;
            currentSettings[axis.tag] = val;
            //console.log(currentSettings,val);
        
		    // Устанавливаем вариацию глобально для шрифта
		    /*
		    if (font.variation) {
		        font.variation.set(currentSettings);
		    }
		    */

            parseGlyphs(); 

        };
        controls.appendChild(row);
    });
}

let backupPerEm = 2000;
window.addEventListener("drop", e => {
    e.preventDefault();
    document.body.classList.remove("drag"); 

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function() {
        try {
            currentVariationFont = null; 
            font = opentype.parse(reader.result);
            
            backupPerEm = font.unitsPerEm;
            
            //font.unitsPerEm = 1000; // убрал это решение, так как нестабильно 

            setupVariationControls(); // Настроит ползунки или скажет, что их нет
            
            dropzone.classList.add("hidden"); 
            parseGlyphs(); // Теперь создаст сетку в любом случае
        } catch (err) {
            alert("Error parsing font: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
});



// parse glyphs
function parseGlyphs() {
    glyphArray = [];
    grid.innerHTML = "";
    if (!font) return;

    for (let i = 0; i < font.glyphs.length; i++) {
        const glyph = font.glyphs.get(i);
        
        // Проверка по индексам точек, чтобы не зависеть от кэша path
        if (glyph.numberOfContours <= 0 || glyph.name === '.notdef') continue;

        const item = {
            unicode: glyph.unicode,
            name: glyph.name,
            glyph: glyph,
            font: font,
        };
        
        glyphArray.push(item);
        createTile(item, i);
    }
}
// preview render
function getGlyphCase(glyph) {
    if (!glyph.unicode || typeof glyph.unicode !== 'number') {
        if(debug) console.log(`[getGlyphCase] Glyph "${glyph.name}": No Unicode (Other)`);
        return 'other';
    }

    const char = String.fromCharCode(glyph.unicode);
    
    const lower = char.toLowerCase();
    const upper = char.toUpperCase();
    const hasCase = lower !== upper;
    
    const isUpper = hasCase && char === upper;
    const isLower = hasCase && char === lower;

    if (isUpper) return 'upper';
    if (isLower) return 'lower';
    
    return 'other'; 
}


let flagThis = false;
function createTile(item, index) {
	const activeFont = item.font; 
    let glyph = item.glyph;
    
    const upm = activeFont.unitsPerEm;
    let renderSize = upm; // 2000
    let isTransformed = false;

    if (activeFont.variation) {
        const transformed = activeFont.variation.getTransform(glyph, currentSettings);
        
        // ПРОВЕРКА: Если форк вернул тот же самый объект или не смог трансформировать
        // (у трансформированных глифов в этом форке обычно нет ссылки на оригинальный индекс или изменен прототип)
        if (transformed && transformed !== glyph) {
            glyph = transformed;
            renderSize = 1000;
            isTransformed = true;
        }
    }

    const os2 = activeFont.tables.os2;
    const metrics = glyph.getMetrics();
    const charCase = getGlyphCase(glyph);

    // Логика выбора версии:
    // Если есть sCapHeight и sxHeight (не равны 0 и не undefined) — используем версию 1
    // Если данных нет — используем версию 2 (индивидуальное центрирование targetY)
    let version = (os2 && os2.sCapHeight && os2.sxHeight) ? 1 : 2;

    // Подготовка метрик
    const capHeight = (os2 && os2.sCapHeight) ? os2.sCapHeight : activeFont.ascender;
    const gHeight = metrics.yMax - metrics.yMin;
    const gCenter = (metrics.yMax + metrics.yMin) / 2;

    let offsetBoxY = 0;
    let targetY = (gHeight > 0) ? gCenter : 0;

    // Расчет для версии 1 (основан на регистре)
    if (charCase === 'upper') {
        offsetBoxY = capHeight / 2;
        console.log("version1");
    } else {
        offsetBoxY = capHeight * 0.4; 
        console.log("version2");
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const width = glyph.advanceWidth || upm;
    
    let viewHeight;
    let vBoxY;
    let desize = 1; 
    if (version === 1) {
        // Стратегия по регистру (хорошо для стандартных шрифтов)
        viewHeight = (upm * 1.4) * desize; 
        vBoxY = -(offsetBoxY + viewHeight / 2);
    } else {
        // Стратегия 2: Индивидуальное центрирование (хорошо для иконок/кривых шрифтов)
        viewHeight = (upm * 1.2) * desize; 
        vBoxY = -(targetY + viewHeight / 2);
    }
    if (flagThis == false ) {
        console.log(`DEBUG GLYPH: ${glyph.name}`);
        console.log({
            upm,os2,metrics,charCase,version,capHeight,
            gHeight,gCenter,offsetBoxY,targetY,width,viewHeight,
            vBoxY
        });
        flagThis = true;
    }


    svg.setAttribute("width", "100");
    svg.setAttribute("height", "100");
    svg.setAttribute("viewBox", `0 ${vBoxY} ${width} ${viewHeight}`);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = glyph.getPath(0, 0, renderSize).toPathData({ flipY: false }); // reback  renderSize > to upm // reback again

    path.setAttribute("d", d);
    path.setAttribute("fill", "grey");

    svg.appendChild(path);
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.appendChild(svg);
    grid.appendChild(tile);
    tile.onclick = () => openEditor(glyph);
}

// editor
let currentGlyph = null

function openEditor(glyph){
	currentGlyph = glyph
	editor.classList.add("active")
	drawGlyphPath(glyph)
}

function closeEditor() {
    editor.classList.remove("active"); // Просто удаляем активный класс
    console.log("CloseEditor:"); // Проверка в консоли
}

closeBtn.onclick = closeEditor;


function drawGuidelines(){
    const scale = canvas.height / font.unitsPerEm
    const baseline = canvas.height * 0.7

    ctx.strokeStyle = "#444"
    ctx.lineWidth = 1

    function line(y){
        ctx.beginPath()
        ctx.moveTo(0,y)
        ctx.lineTo(canvas.width,y)
        ctx.stroke()
    }

    line(baseline)
    line(baseline - font.ascender * scale)
    line(baseline - font.descender * scale)
}

function drawGlyphPath(glyph) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGuidelines();

    const fontSize = 600; //600
    const upm = font.unitsPerEm;
    const baseline = canvas.height * 0.7;

    // Если шрифт вариативный, мы корректируем fontSize, чтобы компенсировать переход библиотеки на сетку 1000. 
    // Например: если upm=2000, то (1000/2000) = 0.5. Мы рисуем кеглем 300 вместо 600.
    //const isTransformed = (glyph.unitsPerEm === 1000) || glyph.isTransformed;
    const renderSize = font.variation ? (fontSize * (1000 / upm)) : fontSize;

    const glyphWidth = (glyph.advanceWidth || upm) * (renderSize / (font.variation ? 1000 : upm));
    const x = (canvas.width - glyphWidth) / 2;

    ctx.save();

    const path = glyph.getPath(x, baseline, renderSize);
    
    path.draw(ctx); 
    ctx.fillStyle = "grey";
    ctx.fill();
    ctx.restore();
}

function updateAll() {
    grid.innerHTML = ""; // Очищаем сетку
    parseGlyphs(); 
    if (currentGlyph) {
        // Находим тот же глиф в новом шрифте по его индексу
        const updatedGlyph = currentVariationFont.glyphs.get(currentGlyph.index);
        drawGlyphPath(updatedGlyph);
    }
}

function exportFont() {

	const uiUpm = font.unitsPerEm; // сохраняем наш хак (1000)

	if (font.backupPerEm) {
        //font.unitsPerEm = font.backupPerEm; // возвращаем 2000
    }

    const originalName = (font && font.names && font.names.fontFamily) 
        ? font.names.fontFamily.en 
        : "Font";
    const newFamilyName = `${originalName}_edited`;
    const rawGlyphs = glyphArray.map(item => item.glyph);
    
    // Проверка на .notdef (обязательно)
    const hasNotDef = rawGlyphs.some(g => g.name === '.notdef');
    const finalGlyphs = hasNotDef ? rawGlyphs : [
        new opentype.Glyph({
            name: '.notdef',
            unicode: 0,
            advanceWidth: 650,
            path: new opentype.Path()
        }),
        ...rawGlyphs
    ];

    try {
        const newFont = new opentype.Font({
            familyName: newFamilyName,
            styleName: font.styleName || "Regular",
            unitsPerEm: font.unitsPerEm || 1000,
            ascender: font.ascender || 800,
            descender: font.descender || -200,
            glyphs: finalGlyphs
        });

        // 4. Генерация и скачивание
        const buffer = newFont.toArrayBuffer();

        // 2. СРАЗУ ВОЗВРАЩАЕМ ХАК ОБРАТНО (для UI)
        font.unitsPerEm = uiUpm; 

        const blob = new Blob([buffer], { type: "font/opentype" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${newFamilyName}.otf`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        console.log(`Font "${newFamilyName}" exported!`);
    } catch (err) {
    	font.unitsPerEm = uiUpm; // Не забываем вернуть при ошибке
        console.error("Export Error:", err);
        alert("Export failed: " + err.message);
    }
}

// save font
window.addEventListener("keydown", e => {
    // Проверка Ctrl+S или Cmd+S (для Mac)
    if ((e.ctrlKey || e.metaKey) && e.code === "KeyS") {
        e.preventDefault();
        console.log("Saving font...");
        
        try {
            exportFont();

        } catch (err) {
            console.error("Export failed:", err);
            alert("Ошибка при экспорте: " + err.message);
        }
    }
}, { capture: true }); // capture: true помогает перехватить событие раньше браузера

