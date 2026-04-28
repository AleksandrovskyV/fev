const dropzone = document.getElementById("dropzone");

const cPanelBlock = document.getElementById("cPanel");
const editorBlock = document.getElementById("editor");
const canvas = document.getElementById("edCanvas");
const ctx = canvas.getContext("2d");

const cmap = document.getElementById("cmap");

const buttonGlyph = document.getElementById("GBOARD");
const buttonSample = document.getElementById("SBOARD");
const exportButton = document.getElementById("EXPORTBUTTON");

const bezierBtn = document.getElementById("bezierMode");
const closeBtn = document.getElementById("closeEditor");

const informBlock = document.getElementById("Information_section");
const controls = document.getElementById("variation");

const debug = false;
let font = null;
let glyphArray = [];
let currentSettings = {};

let glyphEditor = false;
let sampleEditor = false;
let bezierMode = false;

let dragGlyph = false;
let mw = false; // multuwindow?

let backupPerEm = 2000;
let originalFormat = 'ttf';

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

function getSafeName(field) {
    const data = font.names.windows?.[field] || font.names.macintosh?.[field];
    if (!data) return "Unknown";
    return data.en || Object.values(data)[0] || "Unknown";
}

function printInformation(variable) {
    if (!informBlock) return;
    informBlock.innerHTML = ""; 

	console.log("Все имена шрифта:", font.names);
	const fontName = getSafeName('fullName');
	const author = getSafeName('designer'); // Если designer нет, попробуйте 'manufacturer'
	const copyright = getSafeName('copyright');
	const format = originalFormat.toUpperCase();
    
    //informBlock.innerHTML = "<p> Not Variable Font</p>";
    informBlock.innerHTML = `
        <div class="font-info">
    		<p>Font: ${fontName} by ${author} </p>
    	    <p>${copyright}</p>
            <p>Format: ${format} | Status: ${variable?"":"No"} Variable Font</p>
        </div>
    `;
}

function setupVariationControls() {
    if (!controls) return;
    controls.innerHTML = ""; 

    if (!font.tables.fvar || !font.tables.fvar.axes) {
    	// шрифт не вариативный, очищаем панель и выходим
    	printInformation(0);
        return; 
    }

    printInformation(1);

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

		    if (editorBlock.classList.contains("active")){
		    	redrawCurrent();
		    }

        };
        controls.appendChild(row);
    });
}

window.addEventListener("drop", e => {
    e.preventDefault();
    document.body.classList.remove("drag"); 

    const file = e.dataTransfer.files[0];

    if (!file) return;

    originalFormat = file.name.split('.').pop().toLowerCase(); 

    const reader = new FileReader();
    reader.onload = function() {
        try {
            font = opentype.parse(reader.result);
            
            backupPerEm = font.unitsPerEm;
            
            //font.unitsPerEm = 1000; // решение заранее задать 1000, но это нестабильно 

            setupVariationControls(); // Настроит ползунки или скажет, что их нет
            
            dropzone.classList.add("hidden"); 
            cPanelBlock.classList.remove("hidden");
            parseGlyphs(); // Теперь создаст сетку в любом случае
            firstDragAndDrop = true;
        } catch (err) {
            alert("Error parsing font: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
});



// parse glyphs
function parseGlyphs() {
    glyphArray = [];
    cmap.innerHTML = "";
    if (!font) return;

    for (let i = 0; i < font.glyphs.length; i++) {
        const glyph = font.glyphs.get(i);
        
        // Проверка по индексам точек, чтобы не зависеть от кэша path
        if (glyph.numberOfContours <= 0 || glyph.name === '.notdef') continue;

        const item = {
        	index: glyph.index,
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


let firstDragAndDrop = false;
let flagThis = false;
let currentGlyph = null;
let glyphSelection = false;

function redrawCurrent() {
    console.log("redrawCurrent", glyphSelection);
    
    // 1. Находим базовый глиф в шрифте по сохраненному индексу
    let glyph = font.glyphs.get(glyphSelection);
    
    if (!glyph) return;

    // 2. Если шрифт вариативный, применяем текущие настройки ползунков
    if (font.variation) {
        const transformed = font.variation.getTransform(glyph, currentSettings);
        if (transformed && transformed !== glyph) {
            glyph = transformed;
        }
    }

    // 3. Рисуем уже трансформированный глиф
    drawGlyphPath(glyph);
}


function createTile(item, index) {
	//console.log(index);
	const activeFont = item.font; 
    let glyph = item.glyph;
    
    const upm = activeFont.unitsPerEm;
    let renderSize = upm; // 2000
    let isTransformed = false;

    if (activeFont.variation) {
        const transformed = activeFont.variation.getTransform(glyph, currentSettings);
        
        // ПРОВЕРКА: Если форк opentype.js вернул тот же самый объект или не смог трансформировать
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
        //console.log("version1");
    } else {
        offsetBoxY = capHeight * 0.4; 
        //console.log("version2");
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
    cmap.appendChild(tile);
    
    const isNotEmpty = d && d.trim().length > 0;

    if(currentGlyph == null && isNotEmpty && firstDragAndDrop == false){
    	currentGlyph = glyph;
    	glyphSelection = index;
    	console.log("setCurrentGlyph");
    }

    tile.onclick = () => clickMap("tile", glyph, item.index);
}

// editor

function clickMap(from, glyph, index){
	if(!glyph){
		console.log("глифа нет");
		return
	} 
    
    if (index !== undefined) {
        glyphSelection = index;
    }

	if(dragGlyph){

	}else{
		callGlypthEditor(true);
		currentGlyph = glyph;
		drawGlyphPath(glyph)
	}	
}

// Перевести потом в единую функцию
function callSampleEditor(option){
	if(glyphEditor){ callGlypthEditor(false); }

	if (option !== undefined) {
		sampleEditor = option;
	}else{
		sampleEditor = !sampleEditor;
	}
	
	console.log("CallSampleEditor", sampleEditor);

	if(sampleEditor==true){
		buttonSample.classList.add("active")
	}else{
	    buttonSample.classList.remove("active")
	}
}

function callGlypthEditor(option) {
	if(sampleEditor){ callSampleEditor(false); }

	if (option !== undefined) {
		glyphEditor = option;
	}else{
		glyphEditor = !glyphEditor; 
	}
	
	console.log("callGlyphEditor:", glyphEditor);

	if(glyphEditor==true){
		editorBlock.classList.add("active")
		buttonGlyph.classList.add("active")
		drawGlyphPath(currentGlyph)
	}else{
	    editorBlock.classList.remove("active"); 
	    buttonGlyph.classList.remove("active");
	    callBezierMode(false);
	}
}

function callBezierMode(option) {
    if (option !== undefined) {
        bezierMode = option;
    } else {
        bezierMode = !bezierMode; 
    }
    
    console.log("callBezierMode:", bezierMode);

	if(bezierMode==true){
		bezierBtn.classList.add("active")
	}else{
	    bezierBtn.classList.remove("active"); 
	}
}

buttonGlyph.onclick = () => callGlypthEditor();
bezierBtn.onclick = () => callBezierMode();
closeBtn.onclick  = () => callGlypthEditor(false);

buttonSample.onclick = () => callSampleEditor();


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
    cmap.innerHTML = ""; // Очищаем сетку
    parseGlyphs(); 
    if (currentGlyph) {
        // Находим тот же глиф в новом шрифте по его индексу
        //const updatedGlyph = font.glyphs.get(currentGlyph.index);
        //drawGlyphPath(updatedGlyph);
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

