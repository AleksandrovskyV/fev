const dropzone = document.getElementById("dropzone");

const cPanelBlock = document.getElementById("cPanel");
const cPanelBlockRow = document.getElementById('cPanelRow');

const editorBlock = document.getElementById("editor");
const canvas = document.getElementById("edCanvas");
const ctx = canvas.getContext("2d");

const sampleCanvasBlock = document.getElementById("sampleCanvasWrapper");
const canvasSample = document.getElementById("sampleCanvas");
const ctxSample = canvasSample.getContext("2d");

const cmap = document.getElementById("cmap");

const genButton = document.getElementById("genButton");

const compBtn = document.getElementById("CBOARD");
const buttonGlyph = document.getElementById("GBOARD");
const buttonSample = document.getElementById("SBOARD");
const exportButton = document.getElementById("EXPORTBUTTON");

const guidesBtn = document.getElementById("dispGuides");
const bezierBtn = document.getElementById("bezierMode");
const closeBtn = document.getElementById("closeEditor");

const informBlock = document.getElementById("Information_section");

const inputLine = document.getElementById("settingInputLine");
const settingBlock = document.getElementById("overlaySetting");
const langSelect = document.getElementById('languageSelect');
const applyLowercaseBtn = document.getElementById("LOVERCASE");
const applyNumbersBtn = document.getElementById("NUMBERS");
const applySymbolsBtn = document.getElementById("SYMBOLS");
const applySettingBtn = document.getElementById("APPLY_SETTING");

const loadBgBtn = document.getElementById("LOAD_BG");
const fixBgBtn = document.getElementById("FIX_BG");
const bgFileInput = document.getElementById("bgFileInput");

const opacityWrap = document.getElementById('sliderColumn');
const opacitySlider = document.getElementById('bgOpacityRange');

let setupFlags = {
    symbols: false, 
    lowercase: false,
    numbers: false,
    lang: "RU",
};

const controls = document.getElementById("variation");

const debug = false;

let generatedFont = false;

let glyphEditor = false;
let sampleEditor = false;
let displayGuide = false;
let bezierMode = false;

let newDragAndDrop = false;
let dragGlyph = false;
let mw = false; // multuwindow?

let backupPerEm = 2000;
let loadedFileName = "font"; 
let loadedFontName = "unknow";
let originalFormat = 'ttf';

let font = null;
let glyphArray = [];
let currentSettings = {};
let currentGlyph = null;
let currentGlyphIndex = null;

////////////////////////////////////////////////// GENERIC 

const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const SYMBOLS = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+", "[", "]", "{", "}", ";", ":", ",", ".", "<", ">", "/", "?", "|", "\\", "~", "`"];

const UCASE_EN = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const LCASE_EN = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

const UCASE_RU = ["А", "Б", "В", "Г", "Д", "Е", "Ё", "Ж", "З", "И", "Й", "К", "Л", "М", "Н", "О", "П", "Р", "С", "Т", "У", "Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ы", "Ь", "Э", "Ю", "Я"];
const LCASE_RU = ["а", "б", "в", "г", "д", "е", "ё", "ж", "з", "и", "й", "к", "л", "м", "н", "о", "п", "р", "с", "т", "у", "ф", "х", "ц", "ч", "ш", "щ", "ъ", "ы", "ь", "э", "ю", "я"];

const ABET_EN = [...UCASE_EN, ...LCASE_EN];
const ABET_RU = [...UCASE_RU, ...LCASE_RU];


let USER_INPUT_GLYPH = ""; 
let lastInputValue = ""; // Хранилище для отката
const SMART_CLEANUP = true;

function resetToLanguageBase() {
    let base = (setupFlags.lang === "RU") ? UCASE_RU : UCASE_EN;
    
    [applySymbolsBtn, applyNumbersBtn, applyLowercaseBtn].forEach(btn => btn.classList.remove("active"));
    
    setupFlags.symbols = false;
    setupFlags.numbers = false;
    setupFlags.lowercase = false;

    const cleanString = base.join('');
    inputLine.value = cleanString;
    USER_INPUT_GLYPH = cleanString;
}

function addRequirement(key, button, charArray) {
    setupFlags[key] = !setupFlags[key];
    button.classList.toggle("active", setupFlags[key]);

    if (setupFlags[key]) {
        let currentChars = inputLine.value.split('');
        let newChars = [...currentChars, ...charArray];
        const cleanString = [...new Set(newChars)].join('');
        inputLine.value = cleanString;
        USER_INPUT_GLYPH = cleanString;
    } else {
        refreshFromScratch(); 
    }
}

function refreshFromScratch() {
    let result = (setupFlags.lang === "RU") ? [...UCASE_RU] : [...UCASE_EN];
    
    if (setupFlags.lowercase) result.push(...(setupFlags.lang === "RU" ? LCASE_RU : LCASE_EN));
    if (setupFlags.numbers) result.push(...NUMBERS);
    if (setupFlags.symbols) result.push(...SYMBOLS);

    inputLine.value = [...new Set(result)].join('');
    updateInternalGlyph();
}


function updateInternalGlyph() {
    USER_INPUT_GLYPH = [...new Set(inputLine.value)].join('');
}

function toggleAndAdd(key, button, charArray) {
    if (!setupFlags[key]) {
        lastInputValue = inputLine.value; 
        inputLine.value += charArray.join('');
    } 
    else {

        if (SMART_CLEANUP) {
            const charsToRemove = new Set(charArray);
            inputLine.value = inputLine.value
                .split('')
                .filter(char => !charsToRemove.has(char))
                .join('');
        } else {
            inputLine.value = lastInputValue;
        }
    }

    setupFlags[key] = !setupFlags[key];
    button.classList.toggle("active", setupFlags[key]);

    updateInternalGlyph();
}

inputLine.addEventListener('input', () => {
    lastInputValue = inputLine.value; 
    updateInternalGlyph();
});

langSelect.addEventListener('change', (event) => {
    setupFlags.lang = event.target.value; 
    resetToLanguageBase();
});

applySymbolsBtn.onclick = () => { toggleAndAdd('symbols', applySymbolsBtn, SYMBOLS);
};

applyNumbersBtn.onclick = () => { toggleAndAdd('numbers', applyNumbersBtn, NUMBERS);
};

applyLowercaseBtn.onclick = () => {
    const chars = (setupFlags.lang === "RU") ? LCASE_RU : LCASE_EN;
    toggleAndAdd('lowercase', applyLowercaseBtn, chars);
};

resetToLanguageBase();

//console.log(polygonClipping);

const GFONT_PARAMS = {
    name: "Generated",
    style: "Regular",
    unitsPerEm: 1000, // Размер площадки
    ascender: 800,
    descender: -200,
    t: 80,    // tickness штриха?
    w: 400,   // ширина буквы
    ch: 700,  // Высота буквы
};


const TEST_MAP = ["A","H","I","L","П"];

function getTable(lang = "EN") {
    const mode = "debug";

    const langSelect = (lang === "RU") ? ABET_RU : ABET_EN;
    const debug_map = TEST_MAP;
    
    if(mode=="default"){
        return [...NUMBERS, ...langSelect, ...SYMBOLS]; 
    }else{
        return debug_map; 
    }
    
}

let GENERIC_TABLE = getTable();

class penLine {
  constructor(pos = { x: 0, y: 0 }, w = 300, a = 0) {
    this.pos = pos;
    this.width = w;
    this.angle = a;
    this.updateOffsets();
  }

  updateOffsets() {
    const rad = this.angle * (Math.PI / 180);
    const hWidth = this.width / 2;
    this.dx = hWidth * Math.cos(rad);
    this.dy = hWidth * Math.sin(rad);
  }

  // Теперь это просто свойства, работают мгновенно
  xStart() { return this.pos.x - this.dx; }
  yStart() { return this.pos.y - this.dy; }
  xEnd() { return this.pos.x + this.dx; }
  yEnd() { return this.pos.y + this.dy; }

  // Если меняем угол, пересчитываем смещения
  setAngle(a) {
    this.angle = a;
    this.updateOffsets();
  }

  drawCanvas(ctx, mode = "render") {
    if (mode === "editor") {
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        // Рисуем саму линию-перекладину
        ctx.moveTo(this.xStart(), this.yStart());
        ctx.lineTo(this.xEnd(), this.yEnd());
        ctx.stroke();

        // Рисуем точки на концах для наглядности
        ctx.fillStyle = "blue";
        ctx.fillRect(this.xStart() - 2, this.yStart() - 2, 4, 4);
        ctx.fillRect(this.xEnd() - 2, this.yEnd() - 2, 4, 4);
    }
  }
}


class stermLine { // Like A Skeletal Logic
    constructor(type = "vs", pts = [], w = 300, penAngle = 0) { //offset, 
        //vs - пресет Vertical Sterm
        //hs - пресет Horizontal Sterm

        this.type = type;
        this.w = w;
        this.penAngle = penAngle;
        // pts ожидает массив объектов {x, y}
        this.rawPts = pts; 
        this.pens = [];
        this.update();
    }

    update() {
        // Создаем экземпляры PenLine по точкам stermLine
        this.pens = this.rawPts.map(p => new penLine(p, this.w, this.penAngle));
    }

    constrain(index, targetSterm, t = 0.5) {
        const p1 = targetSterm.rawPts[0];
        const p2 = targetSterm.rawPts[targetSterm.rawPts.length - 1];

        Object.defineProperties(this.rawPts[index], {
            x: {
                get: () => p1.x + (p2.x - p1.x) * t,
                configurable: true
            },
            y: {
                get: () => p1.y + (p2.y - p1.y) * t,
                configurable: true
            }
        });
    }

    drawCanvas(ctx, mode = "render") {
        if (mode === "render") {
            const path = this.getOpenPath();
            ctx.beginPath();
            ctx.fillStyle = "black";
            path.toPathData(); 
            ctx.fill(new Path2D(path.toPathData())); 
        } 
        else if (mode === "editor") {
            this.pens.forEach(pen => pen.drawCanvas(ctx, "editor"));
            
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "gray";
            this.pens.forEach((pen, i) => {
                if (i === 0) ctx.moveTo(pen.pos.x, pen.pos.y);
                else ctx.lineTo(pen.pos.x, pen.pos.y);
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    getOpenPath() {
        this.update(); // Гарантируем актуальность координат перед отрисовкой

        const path = new opentype.Path();
        if (this.pens.length === 0) return path;

        // 1. Идем по всем начальным точкам в обычном порядке
        path.moveTo(this.pens[0].xStart(), this.pens[0].yStart());
        for (let i = 1; i < this.pens.length; i++) {
            path.lineTo(this.pens[i].xStart(), this.pens[i].yStart());
        }

        // 2. Идем по всем конечным точкам в ОБРАТНОМ порядке
        for (let i = this.pens.length - 1; i >= 0; i--) {
            path.lineTo(this.pens[i].xEnd(), this.pens[i].yEnd());
        }

        path.close();
        return path;
    }
}

class serifElement {
  // просто цепляется за верх и низ sterm
  constructor(pos = { x: 0, y: 0 }, w = 300, h = 20) {
    this.pos = pos;
    this.width = w;
  }
}

class procedureGlyph{
    // класс содержащий объекты процедурной буквы
    constructor(symbol) {


    }
}


const GLYPH_RECIPES = {
    "A": (p) => {
        // 1. Создаем левую и правую "ноги"
        const lLeg = new stermLine("vs", [{x: 0, y: 0}, {x: p.w/2, y: p.ch}], p.t, 0);
        const rLeg = new stermLine("vs", [{x: p.w, y: 0}, {x: p.w/2, y: p.ch}], p.t, 0);
        
        // 2. Склеиваем верхушки (индекс 1 у обеих линий — это верх)
        // t = 1.0 означает конец линии lLeg
        rLeg.constrain(1, lLeg, 1.0);

        // 3. Создаем перекладину (координаты 0,0 заменятся констрейнтами)
        const bridge = new stermLine("hs", [{x: 0, y: 0}, {x: 0, y: 0}], p.t, 90);

        // 4. Привязываем перекладину к ногам на высоте 40% (t = 0.4)
        bridge.constrain(0, lLeg, 0.4); 
        bridge.constrain(1, rLeg, 0.4);

        return [lLeg, rLeg, bridge];
    },

    "H": (p) => {
        // 1. Создаем объекты
        const left = new stermLine("vs", [{x: 0, y: 0}, {x: 0, y: p.ch}], p.t, 0);
        const right = new stermLine("vs", [{x: p.w - p.t, y: 0}, {x: p.w - p.t, y: p.ch}], p.t, 0);
        const bridge = new stermLine("hs", [{x: 0, y: p.ch/2}, {x: p.w - p.t, y: p.ch/2}], p.t, 90);

        // Привязываем 0-ю точку моста к середине (0.5) левой стойки
        bridge.constrain(0, left, 0.5); 
        // Привязываем 1-ю точку моста к середине (0.5) правой стойки
        bridge.constrain(1, right, 0.5);

        return [left, right, bridge];
    },

};


// Обработка Выражени | парсер
function parseCoord(val, p) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    
    // Безопасная замена переменных (w -> p.w, t -> p.t)
    const context = { w: p.w, t: p.t, ch: p.ch };
    const expr = val.replace(/w|t|ch/g, (m) => context[m]);
    
    // Используем Function для вычисления строки как кода
    return new Function(`return ${expr}`)();
}


function generateGlyphPath(char, recipes, p) {
    const recipeFunc = recipes[char];
    if (typeof recipeFunc !== 'function') return new opentype.Path();

    const elements = recipeFunc(p);

    // 1. Собираем координаты контуров из всех элементов
    const polygons = elements.map(el => {
        const path = el.getOpenPath(); // Наш готовый метод класса
        
        // Извлекаем точки из команд moveTo и lineTo
        const points = path.commands
            .filter(cmd => cmd.type === 'M' || cmd.type === 'L')
            .map(cmd => [cmd.x, cmd.y]);

        // Для polygon-clipping важно, чтобы контур был замкнут (первая точка = последней)
        if (points.length > 0 && (points[0][0] !== points[points.length-1][0] || points[0][1] !== points[points.length-1][1])) {
            points.push([points[0][0], points[0][1]]);
        }

        return [points]; // Формат [ [ [x,y], ... ] ]
    });

    // 2. Сливаем всё в один массив контуров
    const merged = polygonClipping.union(...polygons);

    // 3. Собираем финальный путь для шрифта
    const finalPath = new opentype.Path();
    merged.forEach(poly => {
        poly.forEach(contour => {
            if (contour.length < 3) return;
            
            finalPath.moveTo(contour[0][0], contour[0][1]);
            for (let i = 1; i < contour.length; i++) {
                finalPath.lineTo(contour[i][0], contour[i][1]);
            }
            finalPath.close();
        });
    });

    return finalPath;
}

// 2. Reverse Search (поиск компонентов в рецептах)
function getUsageMap() {
    const usage = {};
    for (const [char, components] of Object.entries(GLYPH_RECIPES)) {
        components.forEach(comp => {
            const type = comp[0]; // Берем 'vs' или 'hs'
            if (!usage[type]) usage[type] = [];
            usage[type].push(char);
        });
    }
    return usage;
}

function initGenericFont() {
    settingBlock.hidden = false;
}

function processGenerate() {
    updateInternalGlyph();
    console.log("Финальная карта",USER_INPUT_GLYPH);

    settingBlock.hidden = true;

    // 1. Сначала создаем .notdef (техническая заглушка)
    const notdefGlyph = new opentype.Glyph({
        name: '.notdef',
        unicode: 0,
        advanceWidth: GFONT_PARAMS.w + 100,
        path: new opentype.Path()
    });

    // 2. Генерируем основные глифы прямо здесь
    const generatedGlyphs = GENERIC_TABLE.map(symbol => {
        return new opentype.Glyph({
            name: symbol,
            unicode: symbol.charCodeAt(0),
            advanceWidth: GFONT_PARAMS.w + 100, 
            path: generateGlyphPath(symbol, GLYPH_RECIPES, GFONT_PARAMS)
        });
    });

    // 3. Собираем объект шрифта
    font = new opentype.Font({
        familyName: GFONT_PARAMS.name,
        styleName: GFONT_PARAMS.style,
        unitsPerEm: GFONT_PARAMS.unitsPerEm,
        ascender: GFONT_PARAMS.ascender,
        descender: GFONT_PARAMS.descender,
        designer: "you...",
        glyphs: [notdefGlyph, ...generatedGlyphs],
    });
    
    for (let i = 0; i < font.glyphs.length; i++) {
        font.glyphs.get(i).index = i;
        console.log("IND",i);
    }

    // 4. Синхронизируем ваш кастомный массив для интерфейса
    glyphArray = [];
    // Используем font.glyphs, чтобы подтянуть уже присвоенные индексацией данные
    for (let i = 0; i < font.glyphs.length; i++) {
        const g = font.glyphs.get(i);
        if (g.name === '.notdef') continue;

        glyphArray.push({
            index: g.index,
            unicode: g.unicode,
            name: g.name,
            glyph: g,
            font: font
        });
    }
    
    // Интерфейс
    printInformation(0);

    parseGlyphs(); 
    generatedFont = true; 

    compBtn.hidden = false;
    dropzone.hidden = true;
    cPanelBlock.hidden = false;

    console.log(`Шрифт "${GFONT_PARAMS.name}" создан. Всего глифов в системе: ${font.glyphs.length}`);
}


// При помощи:
// console.log(getUsageMap()["vs"]); 
// Выведет где именно используются verticalStem

////////////////////////////////////////////////

function getUnicode(char) {
    const hex = char.codePointAt(0).toString(16).toUpperCase();
    return "U+" + hex.padStart(4, "0");
}


function getSafeName(field) {
    const data = font.names.windows?.[field] || font.names.macintosh?.[field];
    if (!data) return "Unknown";
    return data.en || Object.values(data)[0] || "Unknown";
}

function printInformation(variable) {
    if (!informBlock) return;
    informBlock.innerHTML = ""; 

	console.log("Все имена шрифта:", font.names);
	loadedFontName = getSafeName('fullName');
	const author = getSafeName('designer'); // Если designer нет, попробуйте 'manufacturer'
	const copyright = getSafeName('copyright');
	const format = originalFormat.toUpperCase();
    
    //informBlock.innerHTML = "<p> Not Variable Font</p>";
    informBlock.innerHTML = `
        <div class="font-info">
    		<p>Font: ${loadedFontName} by ${author} </p>
    	    <p>${copyright}</p>
            <p>Format: ${format} | Status: ${variable?"":"No"} Variable Font</p>
        </div>
    `;
}

function updateFontMetrics(newAscender, newDescender) {
    if (!font) return;

    // Обновляем напрямую в объекте
    font.ascender = parseInt(newAscender);
    font.descender = parseInt(newDescender);
    
    // В некоторых версиях opentype.js также стоит обновить таблицу OS/2 
    // для корректного отображения в Windows:
    if (font.tables.os2) {
        font.tables.os2.sTypoAscender = font.ascender;
        font.tables.os2.sTypoDescender = font.descender;
    }
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

		    if (!editorBlock.hidden) { 
		    	redrawCurrentGlyphPath();
		    }

        };
        controls.appendChild(row);
    });
}



let sampleBackgroundImage = null;
let backgroundSelected = false;
let dragOverCanvas = false;
let messageSampleCanvas = true;

let canvasObjects = []; // Глифы на холсте
let selectedObjects = []; // Массив выделенных объектов
let dragOffsets = []; 
let selectionBox = { x1: 0, y1: 0, x2: 0, y2: 0 }; // Координаты рамки
let isSelecting = false; 
let isDragging = false;
let startMouseX, startMouseY;

const dragColorOnCanvas = "rgba(200, 200, 200, 0.5)"; 
let bgTransform = { x: 0, y: 0, scale: 1.0 }; 

function getObjectAt(mx, my) {
    // Идем с конца массива (верхние слои приоритетнее)
    for (let i = canvasObjects.length - 1; i >= 0; i--) {
        const obj = canvasObjects[i];
        const bbox = obj.item.glyph.getBoundingBox();

        // 1. Считаем границы прямоугольника с учетом координат и масштаба
        // ВАЖНО: Координаты bbox в шрифтах (x1, y1...) нужно масштабировать
        const left = obj.x + (bbox.x1 * obj.scale);
        const right = obj.x + (bbox.x2 * obj.scale);
        
        // По Y учитываем инверсию, как в твоем renderSampleCanvas
        const top = obj.y + (-bbox.y2 * obj.scale);
        const bottom = obj.y + (-bbox.y1 * obj.scale);

        const pad = 10; //extend val

        if (mx >= left - pad && mx <= right + pad && 
            my >= top - pad && my <= bottom + pad) {
            
            // Bonus: turn to front Z-order
            const clickedObj = canvasObjects.splice(i, 1)[0];
            canvasObjects.push(clickedObj);
            
            return clickedObj;
        }
    }
    return null;
}

opacitySlider.addEventListener('input', (e) => {
    bgTransform.opacity = parseFloat(e.target.value);
    renderSampleCanvas();
});

function handleImageFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        console.error("Файл не является изображением!");
        return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {

            sampleBackgroundImage = img;
            if(opacityWrap.hidden != false){
                opacityWrap.hidden = false;
            }
            
            backgroundSelected = true;
            fixBgBtn.classList.toggle("active", backgroundSelected);
            fixBgBtn.innerHTML = backgroundSelected ? "🔓" : "🔒"; 

            renderSampleCanvas();
        };

        img.onerror = () => console.error("Ошибка загрузки изображения");
        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
}

function handleFontFile(file) {
    // Метод обработки файла

    if (!file) return;
    loadedFileName = file.name;
    originalFormat = loadedFileName.split('.').pop().toLowerCase();

    const reader = new FileReader();

    reader.onload = function() {
        try {
            // Сброс состояния
            font = null;
            glyphArray = [];
            currentGlyph = null;
            currentGlyphIndex = null;
            newDragAndDrop = false;

            // Парсинг через opentype.js
            font = opentype.parse(reader.result);
            backupPerEm = font.unitsPerEm;
            
            //font.unitsPerEm = 1000; // решение заранее задать 1000, но это нестабильно 

            setupVariationControls();
            
            parseGlyphs(); // Создание cmap сетки

            dropzone.hidden = true;
            cPanelBlock.hidden = false;

            newDragAndDrop = true;

            compBtn.hidden = false;

            if (glyphEditor === true) {
                drawGlyphPath(currentGlyph);
            }

        } catch (err) {
            //console.error(err);
            alert("Error parsing font: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// parse glyphs
let tileDebug = false;

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

function getGlyphRenderParams(item, glyph) {
    const activeFont = item.font;
    const upm = activeFont.unitsPerEm || 1000;
    const os2 = activeFont.tables.os2;
    const metrics = glyph.getMetrics();
    const charCase = getGlyphCase(glyph);

    // Все расчеты констант делаем только здесь один раз
    const capHeight = (os2 && os2.sCapHeight) ? os2.sCapHeight : activeFont.ascender;
    const hasCapMetrics = !!(os2 && os2.sCapHeight && os2.sxHeight);
    
    const viewHeight = upm * 1.4;
    const width = glyph.advanceWidth || upm;
    let vBoxY;

    if (hasCapMetrics) {
        const offsetBoxY = (charCase === 'upper') ? capHeight / 2 : capHeight * 0.4;
        vBoxY = -(offsetBoxY + viewHeight / 2);
    } else {
        const gCenter = (metrics.yMax + metrics.yMin) / 2;
        vBoxY = -(gCenter + viewHeight / 2);
    }

    // Унифицируем scaleFactor: для вариативных обычно 1, для статики расчет по UPM
    const scaleFactor = (activeFont.variation && glyph !== item.glyph) ? 1 : 1; 
    const d = getSafePathNEW(glyph, scaleFactor);

    return { d, vBoxY, width, viewHeight };
}

function getSafePathOLD(glyph, scaleFactor) { 
    // не эффективен
    const cleanCommands = JSON.parse(JSON.stringify(glyph.path.commands));
    
    cleanCommands.forEach(c => {
        if (c.x !== undefined) c.x *= scaleFactor;
        if (c.x1 !== undefined) c.x1 *= scaleFactor;
        if (c.x2 !== undefined) c.x2 *= scaleFactor;
        
        // Инверсия Y для SVG (согласно твоей логике)
        if (c.y !== undefined) c.y = -c.y * scaleFactor;
        if (c.y1 !== undefined) c.y1 = -c.y1 * scaleFactor;
        if (c.y2 !== undefined) c.y2 = -c.y2 * scaleFactor;
    });

    const tempPath = new opentype.Path();
    tempPath.commands = cleanCommands;
    return tempPath.toPathData({ flipY: false });
}

function getSafePathNEW(glyph, scaleFactor) {
    const cmds = glyph.path.commands;
    if (!cmds) return '';
    const d = [];
    const s = scaleFactor;

    for (let i = 0; i < cmds.length; i++) {
        const c = cmds[i];
        switch (c.type) {
            case 'M':
                d.push(`M${c.x * s} ${-c.y * s}`);
                break;
            case 'L':
                d.push(`L${c.x * s} ${-c.y * s}`);
                break;
            case 'C':
                d.push(`C${c.x1 * s} ${-c.y1 * s},${c.x2 * s} ${-c.y2 * s},${c.x * s} ${-c.y * s}`);
                break;
            case 'Q':
                d.push(`Q${c.x1 * s} ${-c.y1 * s},${c.x * s} ${-c.y * s}`);
                break;
            case 'Z':
                d.push('Z');
                break;
        }
    }
    return d.join('');
}


function parseGlyphs() {
    if (!font) return;
    glyphArray = [];
    cmap.innerHTML = "";
    
    // Используем Fragment для быстрой вставки в DOM
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < font.glyphs.length; i++) {
        const glyph = font.glyphs.get(i);
        
        // Быстрая проверка на пустоту
        if (glyph.numberOfContours <= 0 || glyph.name === '.notdef') continue;

        const item = {
            index: glyph.index,
            unicode: glyph.unicode,
            name: glyph.name,
            glyph: glyph,
            font: font,
        };
        
        glyphArray.push(item);
        createTile(item, i, fragment);
    }
    
    cmap.appendChild(fragment);
}

function createTileOld(item, index) {
    //console.log(index);
    const activeFont = item.font; 
    let glyph = item.glyph;
    
    const upm = activeFont.unitsPerEm || 1000;
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

    const params = getGlyphRenderParams(item, glyph);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "100");
    svg.setAttribute("viewBox", `0 ${params.vBoxY} ${params.width} ${params.viewHeight}`);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    //const dold = glyph.getPath(0, 0, renderSize).toPathData({ flipY: false }); // мутация данных!!!!

    // 1. Создаем глубокую копию команд из ТЕКУЩЕГО объекта glyph (базового или вариативного)
    const scaleFactor = (activeFont.variation && glyph !== item.glyph) ? 1 : (renderSize / upm);
    //const d = getSafePathOLD(glyph, scaleFactor);
    const d = getSafePathNEW(glyph, scaleFactor);
    
    //if (!d) return;

    path.setAttribute("d", d);
    path.setAttribute("fill", "grey");

    item.tilePath = path; 

    svg.appendChild(path);
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.appendChild(svg);
    cmap.appendChild(tile);
    
    const isNotEmpty = d && d.trim().length > 0;

    if(currentGlyph == null && isNotEmpty){
        currentGlyph = glyph;
        currentGlyphIndex = index;
        console.log("!!setCurrentGlyph", currentGlyphIndex);
    }

    tile.onclick = () => clickMap("tile", glyph, item.index);
}

function createTile(item, index, container) {
    let glyph = item.glyph;
    
    // 1. Обработка вариативности
    if (item.font.variation) {
        const transformed = item.font.variation.getTransform(glyph, currentSettings);
        if (transformed && transformed !== glyph) {
            glyph = transformed;
        }
    }

    // 2. Получаем параметры (один раз!)
    const params = getGlyphRenderParams(item, glyph);
    
    // Проверка на наличие контура
    const isNotEmpty = params.d && params.d.trim().length > 0;

    // 3. Создаем структуру плитки в любом случае
    const tile = document.createElement("div");
    tile.className = "tile";
    
    //if (!isNotEmpty) tile.classList.add("empty-glyph"); // Можно подсветить пустые плитки в CSS

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "100");
    svg.setAttribute("viewBox", `0 ${params.vBoxY} ${params.width} ${params.viewHeight}`);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", params.d || ""); // Если d пустой, path просто не отрисуется
    path.setAttribute("fill", "grey");

    item.tilePath = path; // ссылка для того чтобы обновить превью

    svg.appendChild(path);
    tile.appendChild(svg);
    container.appendChild(tile); 

    // 4. Логика выбора первого ВИДИМОГО глифа
    if (currentGlyph === null && isNotEmpty) {
        currentGlyph = glyph;
        currentGlyphIndex = index;
        //console.log("!!setCurrentGlyph", currentGlyphIndex);
        console.log("Auto-selected first visible glyph:", glyph.name);
    }

    tile.onclick = () => clickMap("tile", glyph, item.index);
    tile.draggable = true;
    tile.ondragstart = (e) => {
        e.dataTransfer.setData("glyphIndex", item.index); 
    };

}

function updateTileForGlyph(index) {
    // Ищем объект в массиве по индексу
    const item = glyphArray.find(it => it.index === index);
    if (!item || !item.tilePath) return;

    let glyph = item.glyph;

    if (item.font.variation) {
        glyph = item.font.variation.getTransform(item.glyph, currentSettings) || glyph;
    }

    const params = getGlyphRenderParams(item, glyph);
    const svg = item.tilePath.ownerSVGElement;

    if (svg) {
        svg.setAttribute("viewBox", `0 ${params.vBoxY} ${params.width} ${params.viewHeight}`);
    }
    item.tilePath.setAttribute('d', params.d);

    renderSampleCanvas();
}


// ---------- BEZIER EDITOR  ----------

// state
let editMode = false
let editContours = null
let dragTarget = null
const HIT_RADIUS_PX = 8

function drawCircle(x,y,r,fill,stroke){
    ctx.beginPath()
    ctx.arc(x,y,r,0,Math.PI*2)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.lineWidth = 1
    ctx.strokeStyle = stroke
    ctx.stroke()
}

function drawLine(y){
    ctx.beginPath()
    ctx.moveTo(0,y)
    ctx.lineTo(canvas.width,y)
    ctx.stroke()
}

function drawLineWithLabel(y, label, color, labelAlt) {
    if (isNaN(y) || y === null) return;

    ctx.save(); // Сохраняем состояние именно для этой линии
    
    ctx.font = "12px sans-serif"; 
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ctx.canvas.width, y);
    ctx.stroke();

    if (!labelAlt) {
        ctx.textAlign = "left";
        ctx.fillText(label, 10, y - 4);
    } else {
        console.log("Orange Accept");
        ctx.textAlign = "left";
        ctx.fillText(label, 10, y - 4); 

        ctx.textAlign = "right";
        ctx.fillText(labelAlt, ctx.canvas.width - 10, y - 4);
    }
    ctx.restore();
}


// --- Drawing helpers & guidelines ---
function getTransformParams(glyph) {
    const fontSize = 600;
    const baseline = canvas.height * 0.7;
    const upm = (font && font.unitsPerEm) ? font.unitsPerEm : 1000;

    // Масштаб всегда должен быть fontSize / upm, 
    // чтобы физический размер на экране был равен fontSize пикселей
    const scale = fontSize / upm; 
    const renderSize = fontSize; // Параметр для методов отрисовки, если они принимают кегль

    let x = null;
    if (glyph) {
        const glyphWidth = (glyph.advanceWidth || upm) * scale;
        x = (canvas.width - glyphWidth) / 2;
    }

    return { x, scale, baseline, renderSize };
}


function drawGuidelines() {
    if (!displayGuide) return;
    
    const { scale, baseline } = getTransformParams();
    const ascY = font.ascender ? baseline - font.ascender * scale : null;
    const capY = (font.tables.os2 && font.tables.os2.sCapHeight) 
                 ? baseline - font.tables.os2.sCapHeight * scale 
                 : null;

    // 1. Проверка на совпадение (с допуском в 1 пиксель для точности)
    const isSameHeight = ascY !== null && capY !== null && Math.abs(ascY - capY) < 1;

    if (isSameHeight) {
        drawLineWithLabel(ascY, "Ascender", "#ffaa44", "CapHeight");
    } else {
        // Если разные — рисуем как обычно
        if (ascY !== null) drawLineWithLabel(ascY, "Ascender", "#ff4444");
        if (capY !== null) drawLineWithLabel(capY, "CapHeight", "#44aa44");
    }

    // Остальные линии
    if (font.tables.os2 && font.tables.os2.sxHeight) {
        drawLineWithLabel(baseline - font.tables.os2.sxHeight * scale, "X-Height", "#aa6600");
    }

    drawLineWithLabel(baseline, "Baseline", "#666");
    
    if (font.descender) {
        drawLineWithLabel(baseline - font.descender * scale, "Descender", "#4444ff");
    }

    if (font.lineGap) {
        const gapY = baseline - (font.descender - font.lineGap) * scale;
        drawLineWithLabel(gapY, "Line Gap Limit", "#333");

    }else{
        console.log("Without LineGap")
    }
}


// Отрисовка глифа в Canvas
function drawGlyphPath(glyph) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGuidelines();
    if(!glyph) return

    const { x, baseline, scale } = getTransformParams(glyph);

    ctx.save();
    ctx.translate(x, baseline);
    ctx.scale(scale, -scale);

    glyph.path.draw(ctx); 
    
    ctx.fillStyle = "grey";
    ctx.fill();
    ctx.restore();
}

function redrawCurrentGlyphPath() { // Под Editor Canvas
    console.log("redrawCurrentGlyphPath", currentGlyphIndex);
    
    let glyph = font.glyphs.get(currentGlyphIndex);
    
    if (!glyph) return;

    // 2. Если шрифт вариативный, применяем текущие настройки ползунков
    if (font.variation) {
        const transformed = font.variation.getTransform(glyph, currentSettings);
        if (transformed && transformed !== glyph) {
            glyph = transformed;
        }
    }

    if(editMode==false){
        console.log("Draw Simple")
        drawGlyphPath(currentGlyph);

    }else{
        console.log("Draw from Bezier Mode")
        editContours = buildEditableContours(currentGlyph);
        renderEditableContours(currentGlyph, editContours);
    }

    renderSampleCanvas();
}

// Создаёт контура (безье) для редактирования глифа
function buildEditableContours(glyph){
    const cmds = glyph && glyph.path && glyph.path.commands? glyph.path.commands : []
    const contours = []
    let cur = []
    cmds.forEach(cmd=>{
        if(cmd.type === 'M'){
            if(cur.length) { contours.push(cur); cur = [] }
            // anchor point
            cur.push({
                type: 'M',
                anchor: { x: cmd.x, y: cmd.y },
                handle1: null,
                handle2: null
            })
        } else if(cmd.type === 'L'){
            cur.push({
                type: 'L',
                anchor: { x: cmd.x, y: cmd.y },
                handle1: null,
                handle2: null
            })
        } else if(cmd.type === 'Q'){
            // quadratic: single control (x1,y1) -> approximate as handle1
            cur.push({
                type: 'Q',
                anchor: { x: cmd.x, y: cmd.y },
                handle1: { x: cmd.x1, y: cmd.y1 },
                handle2: null
            })
        } else if(cmd.type === 'C'){
            cur.push({
                type: 'C',
                anchor: { x: cmd.x, y: cmd.y },
                handle1: { x: cmd.x1, y: cmd.y1 },
                handle2: { x: cmd.x2, y: cmd.y2 }
            })
        } else if(cmd.type === 'Z'){
            // mark closed on last point
            if(cur.length){
                cur[cur.length-1].closed = true
            }
        }
    })
    if(cur.length) contours.push(cur)
    return contours
}

// Создаёт путь для сохранения его обратно в шрифт
function buildPathFromContours(contours){

    const p = new opentype.Path()

    contours.forEach(contour=>{
        if(!contour.length) return

        const first = contour[0]

        p.moveTo(
            first.anchor.x,
            first.anchor.y
        )

        for(let i=1;i<contour.length;i++){
            const pt = contour[i]

            if(pt.type === 'L' || !pt.type){
                p.lineTo(
                    pt.anchor.x,
                    pt.anchor.y
                )
            }

            else if(pt.type === 'Q'){
                p.quadraticCurveTo(
                    pt.handle1.x,
                    pt.handle1.y,
                    pt.anchor.x,
                    pt.anchor.y
                )
            }

            else if(pt.type === 'C'){
                p.curveTo(
                    pt.handle1.x,
                    pt.handle1.y,
                    pt.handle2.x,
                    pt.handle2.y,
                    pt.anchor.x,
                    pt.anchor.y
                )
            }
        }

        if(contour[contour.length-1]?.closed){
            p.closePath()
        }
    })

    return p
}


function renderEditableContours(glyph, contours){
    ctx.save()
    ctx.clearRect(0,0,canvas.width,canvas.height)
    drawGuidelines()

    const { x, baseline, renderSize, scale } = getTransformParams(glyph);

    ctx.translate(x, baseline)
    ctx.scale(scale, scale)
    ctx.scale(1, -1)

    // strokes
    ctx.lineWidth = 1 / scale
    ctx.strokeStyle = "#aaa"
    ctx.fillStyle = "rgba(180,180,180,0.2)"

    contours.forEach(contour=>{
        ctx.beginPath()

        const p0 = contour[0].anchor
        ctx.moveTo(p0.x, p0.y)
        for(let i=1;i<contour.length;i++){
            const pt = contour[i]
            if(pt.type === 'L' || !pt.type){
                ctx.lineTo(pt.anchor.x, pt.anchor.y)
            } else if(pt.type === 'Q'){
                ctx.quadraticCurveTo(pt.handle1.x, pt.handle1.y, pt.anchor.x, pt.anchor.y)
            } else if(pt.type === 'C'){
                ctx.bezierCurveTo(pt.handle1.x, pt.handle1.y, pt.handle2.x, pt.handle2.y, pt.anchor.x, pt.anchor.y)
            }
        }
        if(contour[contour.length-1] && contour[contour.length-1].closed) ctx.closePath()
        ctx.stroke()
    })

    contours.forEach((contour, ci)=>{
        contour.forEach((pt, pi)=>{
            const ax = pt.anchor.x, ay = pt.anchor.y
            // anchor
            drawCircle(ax, ay, 5/scale, "#fff", "#000")

            // handles
            if(pt.handle1){
                // line
                ctx.beginPath()
                ctx.moveTo(ax, ay)
                ctx.lineTo(pt.handle1.x, pt.handle1.y)
                ctx.strokeStyle = "#666"
                ctx.stroke()
                drawCircle(pt.handle1.x, pt.handle1.y, 4/scale, "#f88", "#600")
            }
            if(pt.handle2){
                ctx.beginPath()
                ctx.moveTo(ax, ay)
                ctx.lineTo(pt.handle2.x, pt.handle2.y)
                ctx.strokeStyle = "#666"
                ctx.stroke()
                drawCircle(pt.handle2.x, pt.handle2.y, 4/scale, "#8f8", "#060")
            }
        })
    })

    ctx.restore()
}


function hitTestControls(mouseX, mouseY, glyph){
    const { scale, x, baseline } = getTransformParams(glyph)
    const translateX = x
    const translateY = baseline

    for(let ci=0; ci<editContours.length; ci++){
        const contour = editContours[ci]
        for(let pi=0; pi<contour.length; pi++){
            const pt = contour[pi]
            // anchor screen pos
            const ax = translateX + pt.anchor.x * scale
            const ay = translateY - pt.anchor.y * scale
            const dA = Math.hypot(ax - mouseX, ay - mouseY)
            if(dA <= HIT_RADIUS_PX) return { contourIdx:ci, pointIdx:pi, kind:"anchor" }

            if(pt.handle1){
                const h1x = translateX + pt.handle1.x * scale
                const h1y = translateY - pt.handle1.y * scale
                if(Math.hypot(h1x - mouseX, h1y - mouseY) <= HIT_RADIUS_PX) return { contourIdx:ci, pointIdx:pi, kind:"handle1" }
            }
            if(pt.handle2){
                const h2x = translateX + pt.handle2.x * scale
                const h2y = translateY - pt.handle2.y * scale
                if(Math.hypot(h2x - mouseX, h2y - mouseY) <= HIT_RADIUS_PX) return { contourIdx:ci, pointIdx:pi, kind:"handle2" }
            }
        }
    }
    return null
}


// Сохранение изменённого глифа
function commitGlyphEdits(){
    if(!currentGlyph || !editContours) return;

    console.log("CommitChange");
    const newPath = buildPathFromContours(editContours);

    // обновляем путь у текущего глифа
    currentGlyph.path = newPath;

    // обновляем ссылку в glyphArray
    if(typeof currentGlyphIndex === 'number'){
        const aindex = glyphArray.findIndex(it => it.index === currentGlyphIndex);
        if(aindex !== -1){
            glyphArray[aindex].glyph = currentGlyph;
        }
    }

    // убедимся что шрифт ссылается на тот же объект
    if(font && font.glyphs && font.glyphs.glyphs){
        font.glyphs.glyphs[currentGlyphIndex] = currentGlyph;
    }

    // Обновляем плитку в cmap если нужно
    updateTileForGlyph(currentGlyphIndex);
}


// drag drop File Overlay Logic Section
window.addEventListener("dragover", e => e.preventDefault());

window.addEventListener("dragenter", (e) => {
    e.preventDefault();
    document.body.classList.add("drag");
});

window.addEventListener("dragleave", (e) => {
    if (!e.relatedTarget) {
        document.body.classList.remove("drag");
    }
});

window.addEventListener("drop", (e) => {
    e.preventDefault();

    document.body.classList.remove("drag");

    const file = e.dataTransfer.files[0];
    handleFontFile(file);

});


canvasSample.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOverCanvas) { 
        dragOverCanvas = true;
        renderSampleCanvas();
    }
});

// Добавляем аргумент (e) и предотвращаем дефолт
canvasSample.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverCanvas = false;
    renderSampleCanvas();
});

canvasSample.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragOverCanvas = false;
    document.body.classList.remove("drag");

    // 1. ПРОВЕРКА: Это плитка (glyphIndex)?
    const glyphIndex = e.dataTransfer.getData("glyphIndex");
    
    if (glyphIndex !== "") {
        console.log("Ищем индекс:", glyphIndex);
        //console.log("Доступен ли массив glyphArray?", typeof glyphArray !== 'undefined');

        const rect = canvasSample.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Безопасный поиск
        const numericIndex = parseInt(glyphIndex);
        const originalItem = glyphArray.find(it => it.index === numericIndex);

        //console.log("ВАУ 1 - Индекс распознан");

        if (originalItem) {
            canvasObjects.push({
                item: originalItem, 
                x: x,
                y: y,
                scale: 0.1 // Поставь 0.1 для начала, вдруг они просто слишком большие
            });
            //console.log("ВАУ 2 - Объект добавлен в список:", canvasObjects);
            messageSampleCanvas = false;
            renderSampleCanvas(); 
        } else {
            console.warn("Элемент с таким индексом не найден в glyphArray!");
        }
        return; 
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageFile(files[0]);
    }
});



fixBgBtn.onclick = () => {
    // Инвертируем состояние (заблокирован/разблокирован)
    backgroundSelected = !backgroundSelected;
    
    // Визуальный фидбек
    fixBgBtn.classList.toggle("active", backgroundSelected);
    fixBgBtn.innerHTML = backgroundSelected ? "🔓" : "🔒";
    
    console.log("Background edit mode:", backgroundSelected);
};

canvasSample.onmousedown = (e) => {
    const rect = canvasSample.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvasSample.width / rect.width);
    const my = (e.clientY - rect.top) * (canvasSample.height / rect.height);
    const clicked = getObjectAt(mx, my);

    if (backgroundSelected) {
        isDragging = true;
        startMouseX = mx - bgTransform.x;
        startMouseY = my - bgTransform.y;
    } else if (clicked) {

        // --- Логика выделения объектов (уже есть) ---
        isDragging = true;
        if (!e.shiftKey && !selectedObjects.includes(clicked)) {
            selectedObjects = [clicked];
        } else if (e.shiftKey && !selectedObjects.includes(clicked)) {
            selectedObjects.push(clicked);
        }
        // Запоминаем смещения для группы
        dragOffsets = selectedObjects.map(obj => ({ x: mx - obj.x, y: my - obj.y }));
    } else {
        // --- НАЧАЛО РАМКИ ---
        isSelecting = true;
        selectionBox.x1 = mx;
        selectionBox.y1 = my;
        selectionBox.x2 = mx;
        selectionBox.y2 = my;
        if (!e.shiftKey) selectedObjects = []; // Снимаем старое выделение, если нет Shift
    }

    renderSampleCanvas();
};

canvasSample.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.98 : 1.02;

    // 1. Получаем точные координаты курсора на холсте
    const rect = canvasSample.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvasSample.width / rect.width);
    const my = (e.clientY - rect.top) * (canvasSample.height / rect.height);

    if (backgroundSelected) {
        // ЗУМ ФОНА В ТОЧКУ КУРСОРA
        // Формула: новое_полож = точка_курсора + (старое_полож - точка_курсора) * дельта
        bgTransform.x = mx + (bgTransform.x - mx) * delta;
        bgTransform.y = my + (bgTransform.y - my) * delta;
        bgTransform.scale *= delta;

    } else if (selectedObjects.length > 0) {
        // ЗУМ ГРУППЫ ГЛИФОВ В ТОЧКУ КУРСОРA
        selectedObjects.forEach(obj => {
            // Каждый объект смещается относительно курсора
            obj.x = mx + (obj.x - mx) * delta;
            obj.y = my + (obj.y - my) * delta;
            obj.scale *= delta;
        });
    }
    renderSampleCanvas();
};

canvasSample.addEventListener('mousemove', (e) => {
    const rect = canvasSample.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvasSample.width / rect.width);
    const my = (e.clientY - rect.top) * (canvasSample.height / rect.height);

    if (isDragging) {
        if (backgroundSelected) {
            bgTransform.x = mx - startMouseX;
            bgTransform.y = my - startMouseY;
        } else if (selectedObjects.length > 0) {
            selectedObjects.forEach((obj, i) => {
                obj.x = mx - dragOffsets[i].x;
                obj.y = my - dragOffsets[i].y;
            });
        }
    } else if (isSelecting) {
        selectionBox.x2 = mx;
        selectionBox.y2 = my;
    }
    renderSampleCanvas();
});



window.onkeydown = (e) => {
    if ((e.key === "Delete" || e.key === "Backspace") && selectedObjects.length > 0) {
        e.preventDefault();
        // Оставляем только те объекты, которых нет в списке выделенных
        canvasObjects = canvasObjects.filter(o => !selectedObjects.includes(o));
        selectedObjects = [];
        renderSampleCanvas();
    }
};

function renderSampleCanvas() {
    ctxSample.clearRect(0, 0, canvasSample.width, canvasSample.height);

    // 1. Фон
    if (sampleBackgroundImage) {
        ctxSample.save();
        ctxSample.globalAlpha = bgTransform.opacity !== undefined ? bgTransform.opacity : 0.30;
        ctxSample.translate(bgTransform.x, bgTransform.y);
        ctxSample.scale(bgTransform.scale, bgTransform.scale);
        ctxSample.drawImage(sampleBackgroundImage, 0, 0);
        ctxSample.restore();
    }

    // 2. Глифы
    canvasObjects.forEach(obj => {
        

        let glyph = font.glyphs.get(obj.item.index);
        
        if (font.variation) {
            const transformed = font.variation.getTransform(glyph, currentSettings);
            if (transformed) glyph = transformed;
        }
        const params = getGlyphRenderParams(obj.item, glyph);
        if (!params.d) return;

        const pathData = new Path2D(params.d);

        /*
        const dString = obj.item.tilePath.getAttribute("d");
        if (!dString) return;
        const pathData = new Path2D(dString);
        */


        ctxSample.save();
        ctxSample.translate(obj.x, obj.y);
        ctxSample.scale(obj.scale, obj.scale); 
        
        ctxSample.fillStyle = "white"; 
        ctxSample.fill(pathData);

        // РАМКА ВЫДЕЛЕНИЯ
        const isSelected = selectedObjects.includes(obj);

        if (isSelected && !backgroundSelected) {
            const bbox = obj.item.glyph.getBoundingBox(); 
            const w = bbox.x2 - bbox.x1;
            const h = bbox.y2 - bbox.y1;
            const centerX = (bbox.x1 + bbox.x2) / 2;
            const centerY = (bbox.y1 + bbox.y2) / 2;

            ctxSample.strokeStyle = "#00ff00";
            ctxSample.lineWidth = 2 / obj.scale; 
            const padding = 20;

            ctxSample.strokeRect(
                centerX - (w / 2) - padding, 
                -centerY - (h / 2) - padding, 
                w + padding * 2, 
                h + padding * 2
            );
        }

        ctxSample.restore();
    });

    if (isSelecting) {
        ctxSample.setLineDash([5, 5]); // Делаем рамку пунктирной (стильно!)
        ctxSample.strokeStyle = "#00ff00";
        ctxSample.lineWidth = 1;
        ctxSample.strokeRect(
            selectionBox.x1, 
            selectionBox.y1, 
            selectionBox.x2 - selectionBox.x1, 
            selectionBox.y2 - selectionBox.y1
        );
        ctxSample.setLineDash([]); // Сбрасываем пунктир
    }

    if(messageSampleCanvas){
        ctxSample.fillStyle="#666";
        ctxSample.font = "bold 24px sans-serif";
        const cx = canvasSample.width / 2;
        const cy = canvasSample.height / 2;
        ctxSample.textAlign = "center"; 
        ctxSample.textBaseline = "middle"; 
        ctxSample.fillText("DRAG GLYPH FROM BELOW TO PREVIEW", cx, cy - 20);
        ctxSample.fillText("OR DROP IMAGE REFERENCE", cx, cy + 30);
    }

    if (dragOverCanvas) {
        ctxSample.fillStyle = dragColorOnCanvas;
        ctxSample.fillRect(0, 0, canvasSample.width, canvasSample.height);       
    }
}


//
canvas.addEventListener("mousedown", e=>{
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    dragTarget = hitTestControls(mx, my, currentGlyph)
})

canvas.addEventListener("mousemove", e => {
    if (!dragTarget || !currentGlyph) return;

    const rect = canvas.getBoundingClientRect();
    const { scale, x: translateX, baseline } = getTransformParams(currentGlyph);

    // Получаем координаты в пространстве шрифта (0...1000+)
    const fx = (e.clientX - rect.left - translateX) / scale;
    const fy = (baseline - (e.clientY - rect.top)) / scale; // Инверсия Y для шрифта

    const pt = editContours[dragTarget.contourIdx][dragTarget.pointIdx];

    if (dragTarget.kind === "anchor") {
        pt.anchor.x = fx;
        pt.anchor.y = fy;
    } else if (dragTarget.kind === "handle1") {
        pt.handle1.x = fx;
        pt.handle1.y = fy;
    } else if (dragTarget.kind === "handle2") {
        pt.handle2.x = fx;
        pt.handle2.y = fy;
    }

    renderEditableContours(currentGlyph, editContours);
});

window.addEventListener('mouseup', () => {
    dragTarget = null;

    if (isSelecting) {
        const left = Math.min(selectionBox.x1, selectionBox.x2);
        const right = Math.max(selectionBox.x1, selectionBox.x2);
        const top = Math.min(selectionBox.y1, selectionBox.y2);
        const bottom = Math.max(selectionBox.y1, selectionBox.y2);

        // Проверяем каждый объект: попал ли его BBox в рамку?
        canvasObjects.forEach(obj => {
            const bbox = obj.item.glyph.getBoundingBox();
            const oLeft = obj.x + (bbox.x1 * obj.scale);
            const oRight = obj.x + (bbox.x2 * obj.scale);
            const oTop = obj.y + (-bbox.y2 * obj.scale);
            const oBottom = obj.y + (-bbox.y1 * obj.scale);

            // Если есть пересечение прямоугольников
            if (oLeft < right && oRight > left && oTop < bottom && oBottom > top) {
                if (!selectedObjects.includes(obj)) selectedObjects.push(obj);
            }
        });
    }
    isDragging = false;
    isSelecting = false;

    renderSampleCanvas();
});


function clickMap(from, glyph, index){
	if(!glyph){
		console.log("глифа нет");
		return
	} 
    
    if(editMode==true && bezierMode ==true){
        commitGlyphEdits();
    }

    if (index !== undefined) {
        currentGlyphIndex = index;
    }

	if(dragGlyph){

	}else{

        if (editorBlock.hidden) { 
		  callGlypthEditor(true);
        }

		currentGlyph = glyph;
		redrawCurrentGlyphPath();
	}	
}

// Перевести потом в единую функцию
function callSampleEditor(option){

	if (option !== undefined) {
		sampleEditor = option;
	}else{
		sampleEditor = !sampleEditor;
	}
	
	console.log("CallSampleEditor", sampleEditor);

	if(sampleEditor==true){
		buttonSample.classList.add("active")

        sampleCanvasBlock.hidden = false;
        //informBlock.hidden = true;
	}else{
	    buttonSample.classList.remove("active")
        sampleCanvasBlock.hidden = true;
        //informBlock.hidden = false;
	}

    resizeCanvas();
}

function resizeCanvas() {
    canvasSample.width = scrollWrapper.clientWidth;
    renderSampleCanvas();
}


function callGlypthEditor(option) {
	if (option !== undefined) {
		glyphEditor = option;
	}else{
		glyphEditor = !glyphEditor; 
	}
	
	console.log("callGlyphEditor:", glyphEditor);

	if(glyphEditor==true){
		//editorBlock.classList.add("active")
        editorBlock.hidden = false;

		buttonGlyph.classList.add("active")
		drawGlyphPath(currentGlyph)
	}else{
	    //editorBlock.classList.remove("active"); 
        editorBlock.hidden = true;

	    buttonGlyph.classList.remove("active");
	    callBezierMode(false);
	}

    resizeCanvas();
}


window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function callGuidesMode(option) {
    if (option !== undefined) {
        displayGuide = option;
    } else {
        displayGuide = !displayGuide; 
    }
    
    console.log("callGuidesMode:", displayGuide);

    if(displayGuide==true){
        guidesBtn.classList.add("active")
        
    }else{
        guidesBtn.classList.remove("active");
    }

    if(editMode==true && bezierMode ==true){
        commitGlyphEdits();
    }

    redrawCurrentGlyphPath();
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

        editMode = true
        editContours = buildEditableContours(currentGlyph)
        
        renderEditableContours(currentGlyph, editContours)
	
    }else{
        bezierBtn.classList.remove("active");
        
        //drawGlyphPath(currentGlyph)
        commitGlyphEdits();

        editMode = false
        editContours = null

        redrawCurrentGlyphPath();
	}
}



buttonGlyph.onclick = () => callGlypthEditor();
guidesBtn.onclick = () => callGuidesMode();
bezierBtn.onclick = () => callBezierMode();
closeBtn.onclick  = () => callGlypthEditor(false);

buttonSample.onclick = () => callSampleEditor();
exportButton.onclick = () => exportFont();

genButton.onclick = () => initGenericFont();
applySettingBtn.onclick = () => processGenerate();

loadBgBtn.onclick = () => {
    bgFileInput.click(); 
};

bgFileInput.onchange = (e) => {
    const file = e.target.value !== "" ? e.target.files[0] : null;
    if (file) {
        handleImageFile(file);
        bgFileInput.value = "";


    }
};

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
    const uiUpm = font.unitsPerEm;

    if (font.backupPerEm) {
        //font.unitsPerEm = font.backupPerEm; // возвращаем 2000
    }

    const postfix = " EDIT";
    const cleanBaseName = loadedFontName.trim(); 
    const newFamilyName = cleanBaseName + postfix; 
    const exportFileName = `${loadedFileName.split('.').shift()+postfix}.otf`;

    const rawGlyphs = glyphArray.map(item => item.glyph);
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
            styleName: getSafeName('fontSubfamily') || "Regular",
            unitsPerEm: font.unitsPerEm || 1000,
            ascender: font.ascender || 800,
            descender: font.descender || -200,
            glyphs: finalGlyphs
        });

        const buffer = newFont.toArrayBuffer();
        font.unitsPerEm = uiUpm; 

        const blob = new Blob([buffer], { type: "font/opentype" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = exportFileName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

    } catch (err) {
        font.unitsPerEm = uiUpm;
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

/*

function openComponents() {
    console.log("Окно компонентов открыто!");
}

function createButton(panel, id, name, func) {
    const newBtn = document.createElement('button');
    newBtn.id = id;
    newBtn.className = 'mbutton';
    newBtn.textContent = `[ ${name} ]`;

    newBtn.onclick = () => func(); 
    
    panel.appendChild(newBtn);
}

//createButton(cPanelBlockRow, "CBOARD", "COMPONENTS", openComponents);
//createButton(panel, "ID2", "NAME2", () => openComponents("аргумент"));

*/