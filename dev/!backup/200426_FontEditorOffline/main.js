//console.log(polygonClipping);
// CODEMIRROR V5 (1643 - 1824)

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const lerp = (a,b,t)=>a+(b-a)*t;
const map = (n, start1, stop1, start2, stop2) => 
  ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;


const oStartWindow = document.getElementById("oStartWindow");
const oMainWindow = document.getElementById("oMainWindow");

const editorBlock = document.getElementById("edCanvasWrapper");
const canvas = document.getElementById("editorCanvas");
const ctx = canvas.getContext("2d");

const sampleCanvasBlock = document.getElementById("sampleCanvasWrapper");
const canvasSample = document.getElementById("sampleCanvas");
const ctxSample = canvasSample.getContext("2d");

//const cPanelBlock = document.getElementById("cPanel");
const cPanelBlockRow = document.getElementById('cPanelRow');

const editorCodeBlock = document.getElementById("recieptContainer");

const searchWrapper = document.getElementById("searchWrapper");
const switchCmapViewer = document.getElementById("switchCmapViewer");
const searchBar = document.getElementById("searchBar");
const cmap = document.getElementById("cmap");

//const glyphMapBtn = document.getElementById("glyphMapBtn");
const buttonGlyph = document.getElementById("GBOARD");
const buttonSample = document.getElementById("SBOARD");
const exportButton = document.getElementById("exportPanelBtn");
const infoButton = document.getElementById("ReadmeBtn");
const closeNoteBtn = document.getElementById("closeNote");

const glyphInfoBtn = document.getElementById("GlyphInfo");
const guidesBtn = document.getElementById("dispGuides");
const gEditBtn = document.getElementById("pEditModeB");
const bezierBtn = document.getElementById("bezierMode");
const closeBtn = document.getElementById("closeEditor");

const informBlock = document.getElementById("InfoSection");
const informGlyphBlock = document.getElementById("overlayEditorCanvas");

// Generate Panel Section
const genButton = document.getElementById("genButton");
const generatePBlock = document.getElementById("oGenerateSetting");

const gsSLetterLine = document.getElementById("gsSLetterLine");
const langSelect = document.getElementById('languageSelect');
const applyLowercaseBtn = document.getElementById("LOVERCASE");
const applyNumbersBtn = document.getElementById("NUMBERS");
const applySymbolsBtn = document.getElementById("SYMBOLS");
const applySettingBtn = document.getElementById("APPLY_SETTING");

// Export Panel Section
const exportPanel = document.getElementById("oExportPanel");

const exportFromPanelBtn = document.getElementById("customExport");
const closeExportPanelBtn = document.getElementById("closeExport");
const eFontnameLine = document.getElementById("eFontname");
const eStylenameLine = document.getElementById("eStylename");
const eDesignerLine = document.getElementById("eDesigner");
const eCommentLine = document.getElementById("oExportComment");

//
const hornersBtns = document.getElementById("HornersBtns");
const bezTransformModeBtn = document.getElementById("bezFill");
const bezPointEditModeBtn = document.getElementById("bezCorner");

function expandBtns(e) {
  const btn = e.target.closest('.barBtnsLine > .sqbutton:first-child');
  if (!btn) return;

  if(btn.classList.contains('active')){
    btn.classList.remove("active");
  }else{
    btn.classList.add("active");  
  }

  //const siblings = Array.from(btn.parentElement.querySelectorAll('.sqbutton')).slice(1);
  const siblings = Array.from(btn.parentElement.children).slice(1);

  siblings.forEach(s => {
    if (!s.classList.contains('expandable')) {
        s.hidden = !s.hidden;
    }
  });
}

// Image Reference Upload (Diffirent Canvas)
const bgFileInput = document.getElementById("bgFileInput");

const sCanvasBgExpandBtn = document.getElementById("EXPAND_SC_BG");
const sCanvasBgLoadBtn = document.getElementById("LOAD_SC_BG");
const sOpacityWrap = document.getElementById('sliderRowS');
const sOpacitySlider = document.getElementById('bgOpacityRangeS');

const eCanvasBgExpandBtn = document.getElementById("EXPAND_ED_BG");
const eCanvasBgLoadBtn = document.getElementById("LOAD_ED_BG");
const eOpacityWrap = document.getElementById('sliderRowE');
const eOpacitySlider = document.getElementById('bgOpacityRangeE');

let sampleBackgroundImage = { img: null, x: 0, y: 0, scale: 1.0, opacity: 0.3 };
let editorBackgrounds = {};
let sBackgroundSelected = false;
let eBackgroundSelected = false;


let firstUploadedIndex = null; 
function getCurrentEditorBg() {
    if (!currentGlyph) return null;

    const specificBg = editorBackgrounds[currentGlyph.index];
    
    if (specificBg) {
        return specificBg;
    } 
    
    if (firstUploadedIndex !== null) {
        return editorBackgrounds[firstUploadedIndex];
    }

    return null;
}

sOpacitySlider.addEventListener('input', (e) => {
    sampleBackgroundImage.opacity = parseFloat(e.target.value);
    renderSampleCanvas();
});

eOpacitySlider.addEventListener('input', (e) => {
    const bg = getCurrentEditorBg();
    if (bg) { bg.opacity = parseFloat(e.target.value);
        renderEditorCanvas();
    }
});

function handleImageFile(file, callback) { 
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            if (typeof callback === "function") callback(img); 
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

sCanvasBgLoadBtn.onclick = () => {
    bgFileInput.onchange = (e) => {
        const file = e.target.files[0];

        if (file) handleImageFile(file, (img) => {
            sampleBackgroundImage.img = img;
            sampleBackgroundImage.x = canvasSample.width/2 - (img.width / 2);
            sampleBackgroundImage.y = canvasSample.height/2 - (img.height / 2);
            sBackgroundSelected = true;

            if(sOpacityWrap.hidden !== false){
                sOpacityWrap.classList.remove("expandable");
                sOpacityWrap.hidden = false;
            }
            
            renderSampleCanvas();

        });
        bgFileInput.onchange = null;
        bgFileInput.value = "";
    };
    bgFileInput.click();
};

eCanvasBgLoadBtn.onclick = () => {
    bgFileInput.onchange = (e) => {
        const file = e.target.files[0];
        const idx = currentGlyph.index;

        if (file) handleImageFile(file, (img) => {
            editorBackgrounds[idx] = { img: img,
                x: -(img.width/2), 
                y: -(img.height/2), 
                scale: 1.0, opacity: 0.3
            };

            if (firstUploadedIndex === null) {
                firstUploadedIndex = idx;
            }

            eBackgroundSelected = true;
            if(eOpacityWrap.hidden !== false){
                eOpacityWrap.classList.remove("expandable");
                eOpacityWrap.hidden = false;
            }

            renderEditorCanvas();
        });
        bgFileInput.onchange = null;
        bgFileInput.value = "";
    };
    bgFileInput.click();
};

sCanvasBgExpandBtn.onclick = () => {
    sBackgroundSelected = !sBackgroundSelected;
}

eCanvasBgExpandBtn.onclick = () => {
    eBackgroundSelected = !eBackgroundSelected;
}

///

document.getElementById('eCanvasRowBtns').addEventListener('click', (e) => {
    expandBtns(e);
});

document.getElementById('sCanvasRowBtns').addEventListener('click', (e) => {
    expandBtns(e);
});



const debug = false;

let handleChange = false;
function slog(text, mode="log") {
    if(handleChange) return

    if(mode==="log"){
        console.log(text);
    }else if(mode==="warn"){
        console.warn(text);
    }
}


// Visible Modes Flags

let startwindow = true;

let sampleEditor = false;
let glyphEditor = false;
let displayObjectInfo = false;
let displayGuide = false;

let glyphMapViewer = true;

let editMode = false; // global EditMode?
let pEditMode = false; // Procedure Letter Variable for Canvas
let bezierMode = false;
let cTransformMode = false; // GroupTransform Edit or Selected Pts

let setupFlags = {
    symbols: false, 
    lowercase: false,
    numbers: false,
    lang: "RU",
};

let loadedFileName = "font"; 
let loadedFontName = "unknow";
let originalFormat = 'ttf';

let variableFont = false;
let preservedFont = false;
let generatedFont = false;

let font = null; // активный
let component_font = null; // буфер для компонентов
 
 // Внутренние массивы хранения данных


let glyphArray = [];
let compArray = [];
let currentDataArray = glyphArray;

let arrayViewer = {
    glyf: true,
    comp: false,
    
    glyfTempIndex: null,
    compTempIndex: null,

    userInteraction: false,

    bcurrent: false,
    bprevious: false,
};


let currentSettings = {}; // хранит настройки variableFont
let tempVariableSettings = {}; // хранит настройки variableFont
const addGlyphsArray = []; // Динамически добавляемые (рассчитан на процедурные)
const addCompsArray = [];

let currentItem = null; 
let currentItemIndex = null;

let tempItem = null;
let tempItemIndex = null;
let tempBWA_ItemIndex = null; // Это между переключениями режимов

let currentGlyph = null;
let currentProcedureGlyph = null;

let currentGlyphIndex = null; // NEED REMOVE


let currentContours = null;

//

let activeCanvas = null; // 'sample' или 'editor'

let dragTarget = null;
let dragOverCanvas = false;
let isMouseDown = true; // флаг для opacity

let messageSampleCanvas = true;

let specialAlpha = 0; // Для клика (SpecialMessage)
let pasteAlpha = 1;   // Для подсказки (PasteMessage), начинаем с 1
let pasteMessageActive = true; // for OpacityDownMessage
let fadeRequest = null; // ID анимации

let selectedPoints = []; // Для хранения выделенных точек в Editor

let canvasObjects = []; // Глифы на холсте
let selectedObjects = []; // Массив выделенных объектов
let dragOffsets = []; 
let selBox = { x1: 0, y1: 0, x2: 0, y2: 0 }; 
let isSelecting = false; 
let isDragging = false;
let startMouseX, startMouseY;

let zoom = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;

const history = {
    undoStack: [],
    redoStack: [],
    maxDepth: 100 // Лимит шагов, чтобы не съедало память
};
///////

/* // 1. техническая заглушка)...
const notdefGlyph = new opentype.Glyph({
    name: '.notdef',
    advanceWidth: 500,
    path: new opentype.Path()
});
*/

const systemGlyphs = [
    new opentype.Glyph({
        name: '.notdef',
        advanceWidth: 500,
        path: new opentype.Path()
    }),
    new opentype.Glyph({
        name: '.null',
        unicode: 0,
        advanceWidth: 0,
        path: new opentype.Path()
    }),
    new opentype.Glyph({
        name: 'nonmarkingreturn',
        unicode: 13,
        advanceWidth: 0,
        path: new opentype.Path()
    })
];
const systemGlyphsNames = systemGlyphs.map(g => g.name);



////////////////////////////////////////////////// GENERIC 

// возможно стоит перейти на исходные данные по типу as = ascender, это унифицирует работу с исходными данными
const GFONT_PARAMS = {
    name: "Fenerated",
    style: "Regular",
    unitsPerEm: 1000, // Размер площадки
    aw: 500,  // ширина всей площади 
    br: 40,   // ширина отступа c обоих сторон
    ts: 120,  // tickness штриха?
    as: 800,  // ascender - максимальная высота глифа - всё что выше отрежется
    ch: 700,  // capHeight из os2 - высота Uppercase символов
    xh: 500,  // xHeight  из os2 - высота Lovercase символов
    ds: -200, // descender - насколько низко опускаются элементы вниз - всё что ниже отрежется
};

let USER_INPUT_GLYPH = "";
let ALL_RECIEPT_MAP = "";

let lastInputValue = ""; // Хранилище для отката
const SMART_CLEANUP = true;

const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const SYMBOLS = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+", "[", "]", "{", "}", ";", ":", ",", ".", "<", ">", "/", "?", "|", "\\", "~", "`"];

const UCASE_EN = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const LCASE_EN = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

const UCASE_RU = ["А", "Б", "В", "Г", "Д", "Е", "Ё", "Ж", "З", "И", "Й", "К", "Л", "М", "Н", "О", "П", "Р", "С", "Т", "У", "Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ы", "Ь", "Э", "Ю", "Я"];
const LCASE_RU = ["а", "б", "в", "г", "д", "е", "ё", "ж", "з", "и", "й", "к", "л", "м", "н", "о", "п", "р", "с", "т", "у", "ф", "х", "ц", "ч", "ш", "щ", "ъ", "ы", "ь", "э", "ю", "я"];

// таблица соответствий 
// US, RU
const symbolCases = {
    'case0': ['A', 'А'], 
    'case1': ['B', 'В'],
    'case2': ['C', 'С'],
    'case3': ['H', 'Н'],
    'case4': ['O', 'О'],
    'case5': ['T', 'Т'],
    'case6': ['y', 'у'],
    'case7': ['k', 'к'],
};

function findSymbolCase(symbol, obj) {
    for (let key in obj) {
        if (obj[key].includes(symbol)) {
            return key;
        }
    }
    return null;
}

function getTable(mode) {
    let map;
    
    if(USER_INPUT_GLYPH.length>0){
        
        const s = Array.from(USER_INPUT_GLYPH);

        if(addGlyphsArray.length > 0) {
            map = [...s, ...addGlyphsArray];
        }else{
            map = s;
        }

    }else{
        map = Array.from(ALL_RECIEPT_MAP) || ["A","H","I","L","П","Z"];
    }
    
    //console.log("getTable", map);
    return map;
}

let GENERIC_TABLE = getTable();


function resetToLanguageBase() {
    let base = (setupFlags.lang === "RU") ? UCASE_RU : UCASE_EN;
    
    [applySymbolsBtn, applyNumbersBtn, applyLowercaseBtn].forEach(btn => btn.classList.remove("active"));
    
    setupFlags.symbols = false;
    setupFlags.numbers = false;
    setupFlags.lowercase = false;

    const cleanString = base.join('');
    gsSLetterLine.value = cleanString;
    USER_INPUT_GLYPH = cleanString;
}

function addRequirement(key, button, charArray) {
    setupFlags[key] = !setupFlags[key];
    button.classList.toggle("active", setupFlags[key]);

    if (setupFlags[key]) {
        let currentChars = gsSLetterLine.value.split('');
        let newChars = [...currentChars, ...charArray];
        const cleanString = [...new Set(newChars)].join('');
        gsSLetterLine.value = cleanString;
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

    gsSLetterLine.value = [...new Set(result)].join('');
    updateInternalGlyph();
}


function updateInternalGlyph() {
    // Убираем повторы и пробелы
    //USER_INPUT_GLYPH = [...new Set(gsSLetterLine.value)].join('').trim();
    //USER_INPUT_GLYPH = USER_INPUT_GLYPH.split(' ').join('');
    USER_INPUT_GLYPH = [...new Set([...gsSLetterLine.value].filter(char => char !== ' '))].join('');
}

function toggleAndAdd(key, button, charArray) {
    if (!setupFlags[key]) {
        lastInputValue = gsSLetterLine.value; 
        gsSLetterLine.value += charArray.join('');
    } 
    else {

        if (SMART_CLEANUP) {
            const charsToRemove = new Set(charArray);
            gsSLetterLine.value = gsSLetterLine.value
                .split('')
                .filter(char => !charsToRemove.has(char))
                .join('');
        } else {
            gsSLetterLine.value = lastInputValue;
        }
    }

    setupFlags[key] = !setupFlags[key];
    button.classList.toggle("active", setupFlags[key]);

    updateInternalGlyph();
}

gsSLetterLine.addEventListener('input', () => {
    lastInputValue = gsSLetterLine.value; 
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

//resetToLanguageBase();


class penLine {
    constructor(pos = { x: 0, y: 0 }, w = 300, a = 0, c="yellow") {
        this.pos = pos;
        this.width = w;
        this.angle = a;
        this.color = c;
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
        const radius = 8;
        
        if (mode === "editor" || mode === "selection") {
            // 1. Рисуем перекладину
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2
            ctx.moveTo(this.xStart(), this.yStart());
            ctx.lineTo(this.xEnd(), this.yEnd());
            ctx.stroke();

            // 2. Рисуем центральную точку (узел stemLine)
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, radius, 0, Math.PI * 2);
            // Если выбрано — закрашиваем, если нет — только контур
            if (mode === "selection") {
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // 3. Рисуем крайние точки только при выделении
                this.drawCap(ctx, this.xStart(), this.yStart(), radius);
                this.drawCap(ctx, this.xEnd(), this.yEnd(), radius);
            } else {
                ctx.fillStyle = "#1c1c1c";
                ctx.fill();
                ctx.strokeStyle = this.color;
                ctx.stroke();
            }
        }
    }

    drawCap(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "#1c1c1c";
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }
}

class stemLine { // Like A Skeletal Logic
    constructor(pts = [], w = 300, pAngle = 0, c = "blue") { //offset, 
        //vs - пресет Vertical Stem
        //hs - пресет Horizontal Stem
        //cp - пресет Constrain Stem ?

        //this.type = type;
        this.w = w;
        this.penAngle = pAngle;
        this.color = c;
        
        // pts ожидает массив объектов {x, y}
        this.rawPts = pts; 
        this.cPts = null; // constrain generated pts
        this.pens = this.rawPts.map(p => new penLine(p, this.w, this.penAngle, this.color));
        
        this.selectedIndex = null;

        this.update();

    }

    update() {
        this.pens.forEach((pen, i) => {
            pen.pos = this.rawPts[i]; // Ссылка на ту же точку (геттеры сработают!)
            pen.width = this.w;       // Если ширина стема изменилась
            // Угол не трогаем, его настроит alignToPoints
        });
    }
    
    constrain(index, targetStem, t = 0.5, a = false) {
        const pStart = targetStem.rawPts[0];
        const pEnd = targetStem.rawPts[targetStem.rawPts.length - 1];

        // Сохраняем ссылку на объект-донор прямо в точку
        this.rawPts[index].origin = targetStem;
        this.rawPts[index].t = t; // коэффициент смещения

        // здесь происходит мутация raw - обрати внимание (или исправь)
        Object.defineProperties(this.rawPts[index], {
            x: {
                get: () => pStart.x + (pEnd.x - pStart.x) * t,
                configurable: true
            },
            y: {
                get: () => pStart.y + (pEnd.y - pStart.y) * t,
                configurable: true
            }
        });

        // Синхронизируем cPts, если нужно
        this.cPts = this.rawPts;

        if (a) {
            this.alignToPoints(); 
            this.update(); 
        }

    }

    constrainInset(index, targetStem, t = 1.0, a = false) {
        const pStart = targetStem.rawPts[0];
        const pEnd = targetStem.rawPts[targetStem.rawPts.length - 1];

        const dx = pEnd.x - pStart.x;
        const dy = pEnd.y - pStart.y;
        const len = Math.hypot(dx, dy) || 1;

        const inset = (this.w || 0) / 2;
        const dt = inset / len;

        let correctedT;

        if (t === 1.0) correctedT = t - dt;
        else if (t === 0.0) correctedT = t + dt;
        else correctedT = t;

        this.constrain(index, targetStem, correctedT, a);
    }

    alignToPoints() {
        this.rawPts.forEach((pt, index) => {
            if (pt.origin && this.pens[index]) {
                const target = pt.origin;
                const p1 = target.rawPts[0];
                const p2 = target.rawPts[target.rawPts.length - 1];

                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
                
                this.pens[index].setAngle(angle); 
            }
        });
    }

    drawCanvas(ctx, mode = "render") {
        this.update(); 

        if (mode === "render") {
            const path = this.getOpenPath();
            ctx.fillStyle = "black";
            ctx.fill(new Path2D(path.toPathData())); 
        } 
        else if (mode === "editor") {
            
            // 1. Рисуем "тело" стема (заливку между перьями)
            
            ctx.lineWidth = 2;

            if (this.pens.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = this.color;
            
                // Левая грань (Starts)
                ctx.moveTo(this.pens[0].xStart(), this.pens[0].yStart());
                for (let i = 1; i < this.pens.length; i++) {
                    ctx.lineTo(this.pens[i].xStart(), this.pens[i].yStart());
                }

                // Правая грань (Ends)
                ctx.moveTo(this.pens[0].xEnd(), this.pens[0].yEnd());
                for (let i = 1; i < this.pens.length; i++) {
                    ctx.lineTo(this.pens[i].xEnd(), this.pens[i].yEnd());
                }
                ctx.stroke();
            }

            // 3. Рисуем скелетную линию (stemLine) (пунктир по центрам)
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = this.color; 
            this.pens.forEach((pen, i) => {
                if (i === 0) ctx.moveTo(pen.pos.x, pen.pos.y);
                else ctx.lineTo(pen.pos.x, pen.pos.y);
            });
            ctx.stroke();
            ctx.setLineDash([]);

            // 2. Рисуем сами penLines
            this.pens.forEach((pen, i) => {
                const isSelected = (this.selectedIndex === i);
                pen.drawCanvas(ctx, isSelected ? "selection" : "editor");
            });

        }
    }

    checkHit(localX, localY) {
        let found = false;
        this.selectedIndex = null; // Сбрасываем старое выделение

        this.pens.forEach((pen, i) => {
            const dist = Math.hypot(pen.pos.x - localX, pen.pos.y - localY);
            if (dist < 15) { 
                this.selectedIndex = i;
                found = true;
            }
        });
        return found;
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
// in development
  constructor({h = 20, w = 30, itrl = 0.5, side = "top", inv = false} = {}) {
    this.height = k;
    this.width = w;
    this.interline = itrl;
    this.side = side;
    this.inverted = inv;
  }

  attachTo(stem, t, end = "start") {
    this.stem = stem;
    this.t = t;
    this.end = end;
  }

  getPath() {
  }
}

class procedureGlyph {
  // класс содержащий объекты процедурной буквы
  constructor(symbol, recipeFn, params) {
    this.symbol = symbol;
    this.recipeFn = recipeFn;
    this.params = params;
    this.advanceWidth = params.w; // Дефолт  +100
    this.elements = [];
    this.dirty = true;
    this.build();
  }

  build() {
    this.elements = this.recipeFn(this.params, this); 
    this.dirty = false;
  }

  update(symbol, recipeFn, params) {
        this.symbol = symbol;
        this.recipeFn = recipeFn;
        this.params = params;
        this.dirty = true; 
        this.build();
  }

  drawCanvas(ctx, mode = "render") {
    this.elements.forEach(el => el.drawCanvas(ctx, mode));
  }

  exportData() {
    const data = generateGlyphPath(this.symbol, GLYPH_RECIPES, GFONT_PARAMS);
    return {path: data.path, advanceWidth: data.width || this.advanceWidth};
  }
}


function createProcedureGlypth() {
  if(!handleChange) console.log("CreateProcedureGlyph")
  
  if(currentProcedureGlyph) return;
  if (!currentItem) return;
  
  const recipeFn = GLYPH_RECIPES[currentItem.name];
  if (!recipeFn) return;

  currentProcedureGlyph = new procedureGlyph(currentItem.name, recipeFn, GFONT_PARAMS);
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

function removeProcedureGlyph() {
  console.log("removeProcedureGlyph");
  if (currentProcedureGlyph && currentItem) {
    currentProcedureGlyph = null;
    console.log("REMOVED!!");
  }
}

const GLYPH_RECIPES_TEMPLATE = {
    "TemplateA":`
const { aw, br, ts, ch } = p // Unpack

const sPoint = ts / 2 + br
const ePoint = aw - sPoint

const lLeg = new stemLine( [{x: sPoint, y: 0}, {x: ePoint, y: ch}], ts, 0, "#0366d6")

return [lLeg]
`,
    "TemplateB": `string2dsadasd`
};

function unpackGlobals(p){
    return 
}

const GLYPH_RECIPES = {

"A": (p, self) => {
// Reciept A (65)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

self.advanceWidth = aw + ( br * 2 )
const nCenter = aw / 2 + br

const hwStem = ts / 2
const LX =  br + hwStem
const RX = ( aw + br ) - hwStem

// 1. Create left and right "legs" 
// stemLine( pStart, pEnd, thickness, anglePen, color )
const lLeg = new stemLine( [{x: LX, y: 0}, {x: nCenter, y: ch}], ts, 0, "#0366d6")
const rLeg = new stemLine( [{x: RX, y: 0}, {x: nCenter, y: ch}], ts, 0, "yellow")

// 2. Constrains top points (index 1 for both)
// t = 1.0 - ending lLeg
rLeg.constrain(1, lLeg, 1.0)

// 3. Create birdge
const bridge = new stemLine( [{x: 0, y: 0}, {x: 0, y: 0}], ts, 90, "red")

// 4. Constrain bridge to leg on height 40% (t = 0.4) with align (last arg)
bridge.constrain(0, lLeg, 0.4, true)
bridge.constrain(1, rLeg, 0.4, true)

return [lLeg, rLeg, bridge]
},

"H": (p, self) => {
// Reciept H (72)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

self.advanceWidth = aw + ( br * 2 )
const LS =  br + ts / 2
const RS = ( aw + br ) - ts / 2

// 1. Create left and right "legs" 
const lLeg   = new stemLine( [{x: LS, y: 0}, {x: LS, y: ch}], ts, 0, "#0366d6")
const rLeg   = new stemLine( [{x: RS, y: 0}, {x: RS, y: ch}], ts, 0, "yellow")
const bridge = new stemLine( [{x: LS, y: ch/2}, {x: RS, y: ch/2}], ts, 90,  "red")

// 2. Constrian bridge to leg on 50% height (t = 0.5)
bridge.constrain(0, lLeg, 0.5)
bridge.constrain(1, rLeg, 0.5)

return [lLeg, rLeg, bridge]

},

"I": (p, self) => {
// Reciept I (73)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

const xPos = br+ts/2
const lLeg = new stemLine( [{x: xPos, y: 0}, {x: xPos, y: ch}], ts, 0, "#0366d6")

// set customWidth from Reciept
self.advanceWidth = ts + ( br * 2 )

return [lLeg]
},

"K": (p, self) => {
// Reciept K (75)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

self.advanceWidth = aw + ( br * 2 )
const LS =  br + ts / 2
const RS = ( aw + br ) - ts / 2

// 1. Create Objects (cld = centerDown / clu = centerLeftUp)
const sp = map(ts,0,120,ts/2,ts);

const lLeg  = new stemLine( [{x: LS, y: 0}, {x: LS, y: ch}], ts, 0, "#0366d6");
const cldLeg  = new stemLine( [{x: RS, y: 0}, {x: sp, y: ch/2}], ts, 0, "yellow");
const cluLeg  = new stemLine( [{x: LS, y: ch/2}, {x: RS, y: ch}], ts, 0,  "red");

const tc = clamp(map(ts,60,140,0.5,0.65),0.5,0.65);
cldLeg.constrain(1, lLeg, tc);

return [lLeg, cldLeg, cluLeg]

},

"L": (p, self) => {
// Reciept L (76)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

self.advanceWidth = aw + ( br * 2 )
const LS =  br + ts / 2
const RS = aw+br

const lLeg = new stemLine( [{x: LS, y: 0}, {x: LS, y: ch}], ts, 0, "#0366d6");
const bLeg = new stemLine( [{x: LS, y: ts/2}, {x: RS, y: ts/2}], ts, 90, "yellow");

return [lLeg, bLeg];

},

"k": (p, self) => {
// Reciept k (107)(Lat)(Lowercase)

const { aw, br, ts, ch, xh } = p // Unpack

const newWidth = Math.ceil( aw / 1.2 ) +  ( br * 2 )
self.advanceWidth = newWidth 

const hwStem = ts / 2
const LX = br + hwStem
const RX = newWidth - br - hwStem

// 1. Create Objects
const sp = map(ts,0,120,hwStem,ts/1.525) +br
const middle = ch/2.8
const middleB = clamp(map(ts, 40, 120, 0, 50) , 0, 300)

const lLeg  = new stemLine( [ {x: LX, y: 0}, {x: LX, y: ch} ], ts, 0, "#0366d6")
const cluLeg  = new stemLine( [ {x: sp, y: middle}, {x: RX, y: xh} ], ts, 0,  "red")
const cldLeg  = new stemLine( [ {x: RX, y: 0}, {x: sp, y: middle+middleB} ], ts, 0, "yellow")

//const min = 0.3
//const tc = clamp(map(ts,50,180,min,0.65),min,0.65)
//cldLeg.constrain(1, lLeg, tc);

return [lLeg, cluLeg, cldLeg]

},

"П": (p, self) => {
// Рецепт П (Cyrillic)(Заглавная)

const { aw, br, ts, ch } = p // Распаковка

self.advanceWidth = aw + ( br * 2 )
const LS =  br + ts / 2
const RS = ( aw + br ) - ts / 2

// 1. Создаем объекты - левую и правую "ногу"
const lLeg   = new stemLine( [{x: LS, y: 0}, {x: LS, y: ch}], ts, 0, "#0366d6")
const rLeg   = new stemLine( [{x: RS, y: 0}, {x: RS, y: ch}], ts, 0, "yellow")
const bridge = new stemLine( [{x: 0, y: ch/2}, {x: aw - ts, y: ch/2}], ts, 90,  "red")

// 2. Привязываем перекладину к ногам на высоте 100% c учётом ширины (t = 1.0)
bridge.constrainInset(0, lLeg, 1.0)
bridge.constrainInset(1, rLeg, 1.0)

return [lLeg, rLeg, bridge]

},

"н": (p, self) => {
// Рецепт н (1085)(Cyrillic)(Строчная)

const { aw, br, ts, ch } = p // Распаковка

const newWidth = Math.ceil(aw/1.2)
self.advanceWidth = newWidth // задаем новую ширину глифу

// 1. Создаем объекты - левую и правую "ногу"
const lLeg   = new stemLine( [{x: ts/2, y: 0}, {x: ts/2, y: ch*0.8}], ts, 0, "#0366d6")
const rLeg   = new stemLine( [{x: newWidth-ts/2, y: 0}, {x: newWidth-ts/2, y: ch*0.8}], ts, 0, "yellow")
const bridge = new stemLine( [{x: 0, y: ch/2}, {x: aw - ts, y: ch/2}], ts, 90,  "red")

// 2. Привязываем перекладину к ногам на высоте 50% (t = 0.5)
bridge.constrain(0, lLeg, 0.5)
bridge.constrain(1, rLeg, 0.5)

return [lLeg, rLeg, bridge]

},

"у": (p, self) => {
// Рецепт у (1091)(Cyrillic)(Строчная)

const { aw, br, ts, ch, xh } = p // Распаковка

const newWidth = Math.ceil(aw/1.2) +  ( br * 2 )
self.advanceWidth = newWidth // задаем ширину глифу

const hwStem = ts / 2
const tConstr  = newWidth - hwStem - br
const bConstr = hwStem + br

// 1. Создаем объекты  (base / second)
const bLeg   = new stemLine( [{x: bConstr, y: -140}, {x: tConstr, y: xh} ], ts, 0, "#0366d6")
const sLeg   = new stemLine( [{x: newWidth/2, y: 0}, {x: hwStem + br, y: xh} ], ts, 0, "yellow")

// 2. Привязываем seocnd к base
sLeg.constrain(0, bLeg, 0.22)

return [bLeg, sLeg]

},

"!": (p, self) => {
// Reciept ! *Symbol

const { aw, br, ts, ch } = p // Unpack

self.advanceWidth = ts + br*2

const pBlock = ts
const cPoint = ts/2 + br
const iSpace  = map(ts,40,310, ts, ts/3)

const bStem = new stemLine( [{x: cPoint, y: 0}, {x: cPoint, y: 0+pBlock}], ts, 0, "#0366d6")
const tStem = new stemLine( [{x: cPoint, y: pBlock+iSpace}, {x: cPoint, y: ch}], ts, 0, "#0366d6")

return [bStem, tStem]

},

};

const GLYPH_RECIPES_TEXT = {};

function initRecipesText() {
    for (let sym in GLYPH_RECIPES) {
        GLYPH_RECIPES_TEXT[sym] = GLYPH_RECIPES[sym].toString();
        ALL_RECIEPT_MAP+=sym;
    }

}

initRecipesText();

// Обработка Выражени | парсер > устаревшее 
/*
function parseCoord(val, p) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    
    // Безопасная замена переменных (w -> p.w, t -> p.t)
    const context = { w: p.w, t: p.t, ch: p.ch };
    const expr = val.replace(/w|t|ch/g, (m) => context[m]);
    
    // Используем Function для вычисления строки как кода
    return new Function(`return ${expr}`)();
}
*/

function generateGlyphPathSimple(char, recipes, p) { // без нормализации
    const recipeFunc = recipes[char];
    if (typeof recipeFunc !== 'function') return new opentype.Path();

    const context = { advanceWidth: p.aw };
    const elements = recipeFunc(p, context);

    const finalPath = new opentype.Path();

    elements.forEach(el => {
        const path = el.getOpenPath(); 

        path.commands.forEach(cmd => {
            if (cmd.type === 'M') {
                finalPath.moveTo(cmd.x, cmd.y);
            } else if (cmd.type === 'L') {
                finalPath.lineTo(cmd.x, cmd.y);
            } else if (cmd.type === 'C') {
                finalPath.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            } else if (cmd.type === 'Q') {
                finalPath.quadTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
            } else if (cmd.type === 'Z') {
                finalPath.close();
            }
        });
    });

    return {
        path: finalPath,
        width: context.advanceWidth
    };
}

function generateGlyphPathSimpleMerge(char, recipes, p) { // Простой Merge
    const recipeFunc = recipes[char];
    if (typeof recipeFunc !== 'function') return new opentype.Path();

    const context = { advanceWidth: p.aw}; // +100
    const elements = recipeFunc(p, context);

    // 1. Собираем координаты контуров из всех элементов
    const polygons = elements.map(el => {
        const path = el.getOpenPath(); // Наш готовый метод класса
        
        // Извлекаем точки из команд moveTo и lineTo
        const points = path.commands
            .filter(cmd => cmd.type === 'M' || cmd.type === 'L')
            .map(cmd => [Math.round(cmd.x), Math.round(cmd.y)]);
        /*
        const points = path.commands
            .filter(cmd => cmd.type === 'M' || cmd.type === 'L')
            .map(cmd => [cmd.x, cmd.y]);
        */

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

    return {
        path: finalPath,
        width: context.advanceWidth // Возвращаем то, что рецепт записал в контекст
    };
}

function generateGlyphPath(char, recipes, p) { // с нормализацией (без Merge)
    const recipeFunc = recipes[char];
    if (typeof recipeFunc !== 'function') return new opentype.Path();

    const context = { advanceWidth: p.aw };

    const elements = recipeFunc(p, context);
    const finalPath = new opentype.Path();

    // Инициализируем paper.js один раз (можно вынести вовне для скорости)
    if (!paper.project) paper.setup(new paper.Size(GFONT_PARAMS.unitsPerEm, GFONT_PARAMS.unitsPerEm));

    elements.forEach(el => {
        const opentypePath = el.getOpenPath();
        const paperPath = new paper.Path();

        // 1. Переносим команды в Paper.js
        opentypePath.commands.forEach(cmd => {
            if (cmd.type === 'M') paperPath.moveTo([cmd.x, cmd.y]);
            else if (cmd.type === 'L') paperPath.lineTo([cmd.x, cmd.y]);
            else if (cmd.type === 'C') paperPath.cubicCurveTo([cmd.x1, cmd.y1], [cmd.x2, cmd.y2], [cmd.x, cmd.y]);
            else if (cmd.type === 'Q') paperPath.quadraticCurveTo([cmd.x1, cmd.y1], [cmd.x, cmd.y]);
            else if (cmd.type === 'Z') paperPath.closePath();
        });

        // 2. Нормализуем направление (делаем всегда по часовой стрелке)
        if (!paperPath.clockwise) {
            paperPath.reverse();
        }

        paperPath.segments.forEach((seg, i) => {
            if (i === 0) finalPath.moveTo(seg.point.x, seg.point.y);
            else {
                const prev = paperPath.segments[i - 1];
                if (seg.handleIn.isZero() && prev.handleOut.isZero()) {
                    finalPath.lineTo(seg.point.x, seg.point.y);
                } else {
                    // Paper.js хранит относительные ручки, пересчитываем в абсолютные для Cubic
                    finalPath.curveTo(
                        prev.point.x + prev.handleOut.x, prev.point.y + prev.handleOut.y,
                        seg.point.x + seg.handleIn.x, seg.point.y + seg.handleIn.y,
                        seg.point.x, seg.point.y
                    );
                }
            }
        });
        if (paperPath.closed) finalPath.close();
        
        paperPath.remove(); // Очистка
    });

    return { path: finalPath, width: context.advanceWidth };
}





// 2. Reverse Search (поиск компонентов в рецептах) (Устаревшее)
// При помощи:
// console.log(getUsageMap()["vs"]); 
// Выведет где именно используются verticalStem
/*
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
*/

function initGenericFont() {
    generatePBlock.hidden = false;
}

function getRecieptBodyFromSymbol(symbol) {
    const fullCode = GLYPH_RECIPES_TEXT[symbol];
    const body = fullCode.includes('{')
        ? fullCode.substring(fullCode.indexOf('{') + 1, fullCode.lastIndexOf('}'))
        : fullCode;
    return body.replace(/^\s*\n?/, '').replace(/\n?\s*$/, '');
}

let symbolReceiptTemplate = new Set();

function creteGlyphPromProcedure(symbol, newIndex, mode = 0) {
    let foundRecipe = false;
    let altCase = false;
    let oldSymbol = null;
    let template = false;

    const targetSymbol = symbol;
    let bufferSymbol = symbol;

    if (targetSymbol in GLYPH_RECIPES) {
        if(!handleChange) console.log("Reciept Found.");
        foundRecipe = true;
    } else {

        const caseKey = findSymbolCase(targetSymbol, symbolCases);
        
        if (caseKey !== null) {
            //console.log(`TargetSymbol`, targetSymbol.charCodeAt(0),"найден в symbolCases:", caseKey);

            // Перебираем символы в найденном ключе
            for (let i = 0; i < symbolCases[caseKey].length; i++) {

                let caseChar = symbolCases[caseKey][i];
                
                if (caseChar === targetSymbol){
                    if(!handleChange) console.log("Уже разобранный вариант");
                    continue; // уже проверенный не найденный символ
                }else{
                    if (caseChar in GLYPH_RECIPES){
                        //console.log("Alt Reciept for ", targetSymbol.charCodeAt(0), "found. Copied from", caseChar.charCodeAt(0));
                        foundRecipe = true;
                        bufferSymbol = caseChar; // Обновляем буфер символ

                        altCase = true;
                        break; // Выходим из цикла, так как нашли альтернативный символ с рецептом
                    }
                }

            }

        } else {
            if(!handleChange) console.log('case не найден в symbolCases');
            if(!handleChange) console.log("Reciept Not Found... GenerateBlank");
        }
        
    }

    if(foundRecipe){

        if (symbolReceiptTemplate.has(targetSymbol)) {
            template = true;
        }

        if(altCase){ // добавляем в рецепты как converted
            const bSymbol = bufferSymbol;

            const trimmedBody = getRecieptBodyFromSymbol(bSymbol);
            const comment = "// Converted from "+ bSymbol + " (" + bSymbol.charCodeAt(0) + ")" + "\n";
            const resultString = comment + trimmedBody;
            const codeString = `(p, self) => {\n${resultString}\n}`;

            GLYPH_RECIPES_TEXT[targetSymbol] = codeString.trim();
            //GLYPH_RECIPES[targetSymbol] = eval(codeString);
            GLYPH_RECIPES[targetSymbol] = new Function("p", "self", resultString);
        }


    }else{
        template = true;
        const trimmedBody = GLYPH_RECIPES_TEMPLATE["TemplateA"];
        const comment = "// Reciept for " + targetSymbol + " not found. Creating blank template..." + "\n";
        const resultString = comment + trimmedBody;
        const codeString = `(p, self) => {\n${resultString}\n}`;

        symbolReceiptTemplate.add(targetSymbol);

        GLYPH_RECIPES_TEXT[targetSymbol] = codeString.trim();
        GLYPH_RECIPES[targetSymbol] = eval(codeString);
    }

    altCase = false; 

    const glyphData = generateGlyphPath(targetSymbol, GLYPH_RECIPES, GFONT_PARAMS);

    let newGlyph;
    if(!newIndex){
        // 1. Создаем объект глифа
        newGlyph =  new opentype.Glyph({
            name: targetSymbol,
            unicode: targetSymbol.charCodeAt(0),
            advanceWidth: glyphData.width, // Берем индивидуальную ширину из рецепта
            path: glyphData.path           // Берем сгенерированный путь
        });
    }else{
        // 1. Создаем объект глифа
        newGlyph =  new opentype.Glyph({
            index: newIndex,
            name: targetSymbol,
            unicode: targetSymbol.charCodeAt(0),
            advanceWidth: glyphData.width, // Берем индивидуальную ширину из рецепта
            path: glyphData.path           // Берем сгенерированный путь
        });
    }
    
    newGlyph._templateFlag = template;
    
    return newGlyph
}

function processCreateFont(mode="procedure", returnFont=false) {
    // Base Method for Create FontObject
    // mode === "procedure", "component".  All other case create "opentype" default

    // 0. Собираем объект шрифта
    if(mode==="procedure"){

        updateInternalGlyph();
        GENERIC_TABLE = getTable();
        if(!handleChange) console.log("Финальная карта", GENERIC_TABLE);

        /*
        const filteredTable = GENERIC_TABLE.filter(symbol => {
            const isNameDup = systemGlyphsNames.includes(symbol.name);
            const isUnicodeDup = systemUnicodes.includes(symbol.unicode);
            return !isNameDup && !isUnicodeDup;
        });

        // 2. Генерируем глифы, начиная индекс сразу ПОСЛЕ системных
        const generatedGlyphs = filteredTable.map((symbol, i) => {
            // Индекс = (количество системных) + (текущий порядковый номер в map)
            const nextIndex = systemGlyphs.length + i; 
            return creteGlyphPromProcedure(symbol, nextIndex);
        });
        */

        // 2. Генерируем основные глифы прямо здесь
        const generatedGlyphs = GENERIC_TABLE.map(symbol => {
            return creteGlyphPromProcedure(symbol);
        });


        const resultGlyphs = [...systemGlyphs, ...generatedGlyphs];

        //console.log("Данные перед созданием", GFONT_PARAMS);

        font = new opentype.Font({
            familyName: GFONT_PARAMS.name,
            styleName: GFONT_PARAMS.style,
            unitsPerEm: GFONT_PARAMS.unitsPerEm,
            ascender: GFONT_PARAMS.as,
            descender: GFONT_PARAMS.ds,
            designer: "you...",
            glyphs: resultGlyphs,
            tables: {
                os2: {
                    sCapHeight: GFONT_PARAMS.ch,
                    sxHeight: GFONT_PARAMS.xh
                },
                maxp: {
                    version: 1.0,
                    numGlyphs: resultGlyphs.length
                }
            }
        });

    }else if(mode==="component"){
            //addGlyphsArray
        const generatedGlyphs = (compArray || []).map(item => {
            return creteGlyphPromProcedure(item.name);
        });

        if(!handleChange) console.log("comp generated", generatedGlyphs);

        const resultGlyphs = [...systemGlyphs, ...generatedGlyphs];

        //console.log("Данные перед созданием", GFONT_PARAMS);

        component_font = new opentype.Font({
            familyName: GFONT_PARAMS.name,
            styleName: GFONT_PARAMS.style,
            unitsPerEm: GFONT_PARAMS.unitsPerEm,
            ascender: GFONT_PARAMS.as,
            descender: GFONT_PARAMS.ds,
            designer: "you...",
            glyphs: resultGlyphs,
            tables: {
                os2: {
                    sCapHeight: GFONT_PARAMS.ch,
                    sxHeight: GFONT_PARAMS.xh
                },
                maxp: {
                    version: 1.0,
                    numGlyphs: resultGlyphs.length
                }
            }
        });

        /*
        component_font = new opentype.Font({
            familyName: getSafeName('fullName'), // берёт у глобального font
            styleName: getSafeName('fontSubfamily') || "Regular",
            unitsPerEm: font.unitsPerEm,
            ascender: font.ascender,
            descender: font.descender,
            designer: getSafeName('designer'),
            glyphs: [...systemGlyphs],
            tables: {
                os2: Object.assign({}, font.tables?.os2 || {}), // создаст копию
                maxp: {
                    version: 1.0,
                    numGlyphs: [...systemGlyphs].length
                }
            }
        });
        */
    }else{ // "opentype" - clean case

        font = new opentype.Font({
            familyName: "OpentypeFont",
            styleName: "Regular",
            unitsPerEm: 1000,
            ascender: 800,
            descender: -200,
            glyphs: systemGlyphs,
            tables: {
                os2: {
                    sCapHeight: 700,
                    sxHeight: 500
                },
                maxp: {
                    version: 1.0,
                    numGlyphs: systemGlyphs.length
                }
            }
        });
    }

    // 2. Задаём ссылку на объект куда положим созданный шрифт
    let targetFont;

    if(mode==="component"){
        targetFont = component_font; //buffer
    }else{
        targetFont = font; // general
    }

    // 3. Готовим индексы
    for (let i = 0; i < targetFont.glyphs.length; i++) {
        targetFont.glyphs.get(i).index = i;
        //console.log("IND",i);
    }

    //targetFont.tables = targetFont.toTables();
    //console.log(targetFont.tables.maxp.numGlyphs); 

    //targetFont.styleName = GFONT_PARAMS.style;
    //console.log("Check Style and Data", targetFont.styleName, targetFont.designer);
    
    // 5. Обновляем интерфейс
    if(returnFont){
       return targetFont 
    }

    if(!handleChange) console.log(`Создан ${mode} шрифт, глифов: ${targetFont.glyphs.length}`);
}

function startProcessGenerate() {

    generatedFont = true; 

    startwindow = false;
    originalFormat = 'fe';
    

    /*
    processCreateFont("procedure");
    updateCMAP("glyph", "fullwrite");
    createProcedureGlypth();
    */

    redrawAllProcedure(false, false); //(без рендер canvas и апдейт инфо)

    // Интерфейс

    oStartWindow.hidden = true;
    generatePBlock.hidden = true;

    switchCmapViewer.hidden = false;
    //cPanelBlock.hidden = false;
    oMainWindow.hidden = false;

    gEditBtn.hidden = false;

    setupVariationControls();
}

// CODEMIRROR (1643 - 1824)

CodeMirror.defineMode("javascriptSublimeKey", function(config) {
  var jsMode = CodeMirror.getMode(config, "javascript");

  function isObjectKey(stream) {
    var rest = stream.string.slice(stream.pos);
    var match = rest.match(/^\s*/);
    var nextIndex = match ? match[0].length : 0;
    var nextChar = rest.charAt(nextIndex);
    return nextChar === ":";
  }

  return {
    startState: function() {
      return {
        jsState: CodeMirror.startState(jsMode)
      };
    },

    copyState: function(state) {
      return {
        jsState: CodeMirror.copyState(jsMode, state.jsState)
      };
    },

    token: function(stream, state) {
      var style = jsMode.token(stream, state.jsState);

      if (style === "property" && isObjectKey(stream)) {
        return "variable"; // или "object-key"
      }

      return style;
    },

    indent: function(state, textAfter) {
      return jsMode.indent(state.jsState, textAfter);
    },

    innerMode: function(state) {
      return { state: state.jsState, mode: jsMode };
    }
  };
});

CodeMirror.defineMode("javascriptSublimeStable", function(config) {
  var jsMode = CodeMirror.getMode(config, "javascript");

  return {
    startState: function() {
      return { jsState: CodeMirror.startState(jsMode) };
    },
    copyState: function(state) {
      return { jsState: CodeMirror.copyState(jsMode, state.jsState) };
    },
    token: function(stream, state) {
      // 1. Проверяем, не стоим ли мы на слове "self"
      // eatSpace убирает пробелы перед проверкой
      if (stream.match("self", true)) {
          // Проверяем, что это отдельное слово, а не часть другого (например, myself)
          if (!/\w/.test(stream.peek() || "")) {
              return "keyword self-keyword"; // Даем два класса сразу
          }
      }

      if (stream.match(/\b(map|clamp|ceil)\b/)) {
        return "keyword myfync-keyword";
      }

      // 2. Если не self, используем стандартный парсер

      // 1. Получаем стиль от стандартного JS режима
      var style = jsMode.token(stream, state.jsState);
      
      // 2. Проверяем внутренний контекст парсера
      // jsState.lexical.type хранит тип текущего блока: 
      // "stat" (строка кода), ")" (в скобках), "]" (в массиве), "}" (в объекте)
      var context = state.jsState.lexical.type;

      // 3. Если мы внутри ЛЮБЫХ скобок или блоков:
      // В CodeMirror контексты внутри скобок обычно называются ")", "]", "}", "block" или "property" (внутри объекта)
      if (context !== "stat" && context !== "top") {
        if (style === "property") {
          return "variable"; // Принудительно делаем белым
        }
      }

      return style;
    },
    indent: function(state, textAfter) {
        return jsMode.indent(state.jsState, textAfter);
    },
    innerMode: function(state) {
        return {state: state.jsState, mode: jsMode};
    }
  };
});

let codeEditor = null;

//addon/search/searchcursor.js (логика поиска следующего слова)
//keymap/sublime.js (готовые бинды как в Sublime Text)

function createCodeEditor() {
  if (codeEditor) {
    //editorCodeBlock.innerHTML = '';
    return
  }

  const fullCode = GLYPH_RECIPES[currentGlyph.name].toString();
  const body = fullCode.includes('{') 
      ? fullCode.substring(fullCode.indexOf('{') + 1, fullCode.lastIndexOf('}'))
      : fullCode;
  const trimmedBody = body.replace(/^\s*\n?/, '').replace(/\n?\s*$/, '');

  // Инициализация в стиле v5
    codeEditor = CodeMirror(editorCodeBlock, {
        value: trimmedBody,
        mode: "javascriptSublimeStable", // используем пользовательский режим
        lineNumbers: false,
        lineWrapping: true,
        viewportMargin: Infinity, 
        scrollbarStyle: null      // Опционально: уберет полосы прокрутки
    });

  editorCodeBlock.hidden = false; // Сначала показываем блок

  // Даем браузеру отрисовать блок, затем обновляем CM
  setTimeout(() => {
    codeEditor.refresh();
  }, 1);

  // Отслеживание изменений
  codeEditor.on("change", (cm, change) => {
    if (change.origin !== "setValue") { // Игнорируем программные изменения
      const codeString = `(p, self) => {\n${cm.getValue()}\n}`;
      updateRecipeFromEditor(currentGlyph.name, codeString);
    }
  });

  editorCodeBlock.hidden = false;
}


function updateRecipeFromEditor(symbol, codeString) {
    try {
        GLYPH_RECIPES_TEXT[symbol] = codeString.trim();
        GLYPH_RECIPES[symbol] = eval(codeString);

        symbolReceiptTemplate.delete(symbol);

        if (currentProcedureGlyph) {
            updateProcedureGlyph();
            commitGlyphEdits();
            redrawActiveGlyphInCanvas();
        }
    } catch (e) {
        console.warn("Ошибка в рецепте:", e);
    }
}

function updateCodeEditor() {
    // Обновляет код в Редакторе (на соответствующий текущему глифу)
    if (!codeEditor) return;

    const symbol = currentGlyph.name;
    const fullCode = GLYPH_RECIPES_TEXT[symbol];
    const body = fullCode.includes('{')
        ? fullCode.substring(fullCode.indexOf('{') + 1, fullCode.lastIndexOf('}'))
        : fullCode;
    const trimmedBody = body.replace(/^\s*\n?/, '').replace(/\n?\s*$/, '');

    // В CM5 используем setValue
    codeEditor.setValue(trimmedBody);

    setTimeout(() => {
        codeEditor.refresh();
    }, 1);
}

////// CODEMIRROR END

function getMousePosition(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function getWeightName(value) {
    if (value <= 150) return "Thin";
    if (value <= 250) return "Extra Light";
    if (value <= 350) return "Light";
    if (value <= 450) return "Regular";
    if (value <= 550) return "Medium";
    if (value <= 650) return "Semi Bold";
    if (value <= 750) return "Bold";
    if (value <= 850) return "Extra Bold";
    return "Black";
}

function removeWeightName(fullName) {
    // Список всех стандартных названий весов
    const weights = [
        "Thin", "Extra Light", "Light", "Regular", "Medium", 
        "Semi Bold", "Bold", "Extra Bold", "Black"
    ];

    const regex = new RegExp(weights.join('|'), 'gi');
    return fullName.replace(regex, '').trim();
}

function cleanCopyright(text) {
    if (!text || text === "Unknown") return text;

    // Список элементов (экранируем спецсимволы)
    // Добавляем \s* между ними, чтобы ловить пробелы
    const values = ["©", "Copyright", "copyright", "\\(c\\)"];
    
    // ^(?: ... | ... )+ — ищем последовательность из одного или более элементов в начале
    // \s* — игнорируем любые пробелы между значками
    const regex = new RegExp(`^(?:(?:${values.join('|')})\\s*)+`, 'i');
    
    return text.replace(regex, '').trim();
}

function getUnicode(char) {
    const hex = char.codePointAt(0).toString(16).toUpperCase();
    return "U+" + hex.padStart(4, "0");
}


function getSafeName(fontTarget = null, field) {

    let currentFont;

    if(fontTarget){
        currentFont = fontTarget;
    }else{
        currentFont = font;
    }

    const data = currentFont.names.windows?.[field] || currentFont.names.macintosh?.[field];
    if (!data) return "Unknown";

    // Берем английский или первый попавшийся язык
    const rawName = data.en || Object.values(data)[0];

    // Проверяем: если это строка, убираем пробелы и смотрим длину
    if (typeof rawName === 'string' && rawName.trim().length > 0) {
        return rawName;
    }

    return "Unknown";
}

function printInformation(variable, fullwrite = true, id = "") {
    if (!informBlock) return;
    //console.log("pf", fullwrite, id);
    
    const fontTarget = arrayViewer.comp ? component_font : font ;
    loadedFontName = getSafeName(fontTarget, 'fullName');

    if(!handleChange) console.log("FONTTARGET", arrayViewer.comp, loadedFontName);
    
    const author = getSafeName(fontTarget, 'designer'); // Если designer нет, попробуйте 'manufacturer'
    const copyrightSource = getSafeName(fontTarget, 'copyright');
    
    let copyrightEdit = cleanCopyright(copyrightSource);

    const format = originalFormat.toUpperCase();

    if(copyrightEdit === "Unknown"){
        copyrightEdit = "Ещё потребуется перетереть с юристами...";
    }

    let statusLine = `${variable?"":"No"} Variable Font`;

    if(generatedFont){
        statusLine = `Fenerative Font`;
    }

    if(fullwrite){
        informBlock.innerHTML = ""; 

        informBlock.innerHTML = `
            <p id="info-name">Font: ${loadedFontName} by ${author} </p>
            <p id="info-crght">© ${copyrightEdit}</p>
            <p id="info-meta">Format: ${format} | Status: ${statusLine}</p>
        `;        
    } else if (id) {
        // Точечное обновление по конкретному ID
        const target = document.getElementById(id);
        if (!target) return;

        // Словарь: какой ID на какую строку меняем
        const updates = {
            'info-name': `Font: ${loadedFontName} by ${author}`,
            'info-crght': `© ${copyrightEdit}`,
            'info-meta': `Format: ${format} | Status: ${statusLine}`
        };

        if (updates[id]) { target.textContent = updates[id];
        }
    }

}

function updateObjectStats(currentItemIndex) { // index > currentItemIndex
    if (!informGlyphBlock) return;
    informGlyphBlock.innerHTML = ""; 

    //console.log(currentGlyphIndex);
    //let glyph = font.glyphs.get(currentGlyphIndex);

    let glyph = currentItem?.glyph;
    
    if (!glyph){
         console.log("Глиф не определен", glyph);
        return
    }

    //console.log();
    let NameVariable = currentItem.componentFlag ? "ComponentName" : "GlyphName";

    informGlyphBlock.innerHTML = `
        <div class="glyphInfo">
            <p>${NameVariable}: ${glyph.name}</p>
            <p>Unicode: ${glyph.unicode}</p>
            <p>advanceWidth: ${glyph.advanceWidth}</p>
            <p>GlyphIndex: ${glyph.index}</p>
            <p>GlyphCommands: ${glyph.path.commands.length}</p>
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

function debugFont() {
    console.log("--- Font Analysis ---");
    console.log("Outlines Format:", font.outlinesFormat); // 'truetype' или 'cff'
    console.log("Units Per Em:", font.unitsPerEm);

    // Проверяем физическое наличие таблиц в бинарном файле (не в объектах opentype)
    const tables = Object.keys(font.tables);
    console.log("All Tables found:", tables);

    console.log("Has fvar:", !!font.tables.fvar);
    console.log("Has gvar:", !!font.tables.gvar);
    console.log("Has CFF2:", !!font.tables.cff2);
    console.log("Has glyf:", !!font.tables.glyf); // Если это TrueType, контуры тут
    console.log("Has CFF :", !!font.tables.cff);  // Старый формат PostScript

    if (font.tables.fvar) {
        console.log("Axes:", font.tables.fvar.axes.map(a => `${a.tag} (${a.minValue}-${a.maxValue})`));
    }
    //console.log(font.tables);
}

let cffmode_preserve = false;

function refreshCanvasObjects() {
    if(!canvasObjects) return console.log("Объектов нет")

    // Проходим по каждому объекту, который уже лежит на канвасе
    canvasObjects.forEach((obj, i) => {
        
        // Берем  индекс с объекта Canvas
        const sourceIndex = obj.aindex; //item.index 
        const sourceArray = obj.array; 
        const newItem = sourceArray[sourceIndex]; //

        if (newItem) { // refresh link
            obj.item = newItem;
            if(!handleChange) console.log("Меняю", sourceIndex);
        } else {
            if(!handleChange) console.log("Нового нет", sourceIndex);
        }
    });

    renderSampleCanvas();
}

function redrawAllProcedure(erender=true, updateInfo=true){ // ЭТО ПРОСТО КУСОК ГОВНА
    // Перерисовываем весь генеративный шрифт (hard rewrite)

    // Почему так? SVG в плитках строятся от команд шрифта (значит требуется шрифт)
    // А шрифт рисуется по рецептам
    if(!handleChange) console.log("redrawAllProcedure: erender = ", erender);
    if(!handleChange) console.log("redrawAllProc from:", arrayViewer.comp ? "comp" : "glyf");
    //updateCMAP(modeUpdate, "fullwrite");
   


    if(arrayViewer.comp){
            
    // processCreateFont: mode "glyph", "component" ; action: "fullwrite", "update" 
    // здесь идёт обновление currentDataArrays

        processCreateFont("procedure", false); // обновляем в буффере процедурный
        updateCMAP("procedure", false, "fullwrite"); // не обновляем плитки

        processCreateFont("component", false); // сначала тот что виден
        updateCMAP("component", true, "fullwrite");
        //updateCMAP("component", "update");  // аккуратнее > ветка может дать сбой

        // currentDataArray = glyphArray; //compArray
    

    }else{
        processCreateFont("component", false);  // обновляем в буффере компоненты
        updateCMAP("component", false, "fullwrite");  // не обновляем плитки

        processCreateFont("procedure", false); 
        updateCMAP("glyph", true, "fullwrite");

    }

    if(canvasSample && erender){
        refreshCanvasObjects();
    }

    redrawActiveGlyphInCanvas(erender);


    if(updateInfo){
        if(font){
            if(!handleChange) console.log("PROMPROC", GFONT_PARAMS.style); 
          if(component_font){
            if(!handleChange) console.log("PROMPROC", GFONT_PARAMS.style);
          }
        }
        
        printInformation(0, false, "info-name");
    }

    updateObjectStats();
}


function manualUpdateControlValue(key, newValue, erender=true) {
    // 1. Обновляем само значение в данных
    GFONT_PARAMS[key] = newValue;

    // 2. Ищем инпут и текстовое поле
    const input = document.getElementById(`input_${key}`);
    const span = document.getElementById(`val_${key}`);

    if (input) input.value = newValue;
    if (span) span.innerText = newValue;
    
    redrawAllProcedure(erender);
}

function setupVariationControls() {
    const spControls = document.getElementById("SpecialControls");
    if (!spControls) return;
    spControls.innerHTML = "";
    spControls.hidden = false; 
    
    const pusher = document.createElement("div");
    pusher.id = "spPusher";
    pusher.className = "fg";

    if (generatedFont) {
        const controls = [
            { key: "ts", label: "ts / Thickness", min: 2, max: 300 },
            { key: "aw", label: "aw / advanceWidth", min: 100, max: 1000 },
            { key: "br", label: "br / Bearings", min: -50, max: 200 },
        ];

        controls.forEach(ctrl => {
            const row = document.createElement("div");
            row.id = `${ctrl.label}_param`;
            row.className = "rWrap thinkSlider";

            const currentValue = GFONT_PARAMS[ctrl.key];
            row.innerHTML = `
                <label>${ctrl.label}: </label>
                <span class="gval" id="val_${ctrl.key}">${currentValue}</span>
                <input type="range" 
                       id="input_${ctrl.key}" 
                       class="fExtend" 
                       style="max-width: 200px;" 
                       min="${ctrl.min}" max="${ctrl.max}" 
                       value="${currentValue}" step="1">
            `;
            
            const input = row.querySelector("input");
            const valSpan = row.querySelector(".gval");

            input.oninput = (e) => {

                handleChange = true;

                const val = parseFloat(e.target.value);
                valSpan.innerText = val;
                
                // Динамически обновляем параметр по ключу (w или t)
                GFONT_PARAMS[ctrl.key] = val;

            
                const newStyleName = getWeightName(GFONT_PARAMS.ts*4 || 400);
                GFONT_PARAMS.style = newStyleName;

                //console.log("GFONT UPD", GFONT_PARAMS[ctrl.key], GFONT_PARAMS.style); // здесь обновляется
                            
                if (ctrl.key === "br" && !displayGuide) {
                    callGuidesMode(true);
                }

                // Перерисовываем весь генеративный шрифт
                redrawAllProcedure()
                
            };

            input.onchange = (e) => {
                handleChange = false;
                redrawAllProcedure();
                //printInformation(0);
            }

            spControls.appendChild(row);
        });
        spControls.appendChild(pusher); // толкатель


        variableFont = false;
        printInformation(0);
        return;
    }

    if (!font.tables.fvar || !font.tables.fvar.axes) {
        // шрифт не вариативный, очищаем панель и выходим
        variableFont = false;
        spControls.hidden = true;

        if (preservedFont) {
            console.log("Plsadfsa");
            // Добавляем кнопку в конец строки

            const row = document.createElement("div");
            row.className = "rWrap thinkSlider";

            row.innerHTML = `
                <label>if fails > </label>
                <button id="undoPreserve_btn" class="sbutton">/undo </button>
            `;

            // Теперь ищем её и вешаем событие
            const undoBtn = row.querySelector("#undoPreserve_btn"); 

            undoBtn.onclick = () => rollbackFontlib();
            
            spControls.appendChild(row);
            spControls.appendChild(pusher); // толкатель

            if(bezierMode && cTransformMode){
                callSwitchBezierMode(false);
            }
        }

        printInformation(0);
        return; 
    }

    variableFont = true;
    preservedFont = false;

    if (font.tables.fvar) {
        console.log("Это вариативный шрифт (есть оси).");
        
        if (font.tables.gvar) {
            console.log("Тип: TrueType Variable (использует дельты точек gvar)");
        } else if (font.tables.cff2) {
            cffmode_preserve = true;
            console.log("Тип: OpenType CFF2 (PostScript-вариативность)");
        }
    } else {
        console.log("Это обычный статический шрифт.");
    }

    printInformation(1);

    //debugFont();

    const axes = font.tables.fvar.axes;

    const hasSettings = Object.keys(tempVariableSettings).length > 0;
    const settingsToApply = hasSettings ? { ...tempVariableSettings } : null;

    currentSettings = {};
    tempVariableSettings = {}; 

    console.log(`tempSetting`, hasSettings, settingsToApply);

    axes.forEach(axis => {
        const row = document.createElement("div");
        row.className = "rWrap thinkSlider";

        let defAxisValue = axis.defaultValue;

        if (settingsToApply && settingsToApply[axis.tag] !== undefined) {
            defAxisValue = settingsToApply[axis.tag];
        }

        currentSettings[axis.tag] = defAxisValue;

        row.innerHTML = `
            <label>${axis.tag}: </label>
            <span class="axis-val">${defAxisValue}</span>
            <input type="range" class="fExtend" style="max-width: 200px;" min="${axis.minValue}" max="${axis.maxValue}" value="${defAxisValue}" step="1">
        `;

        const input = row.querySelector("input");
        const valSpan = row.querySelector(".axis-val");

        input.oninput = (e) => {
            
            handleChange = true;

            const val = parseFloat(e.target.value);
            valSpan.innerText = val;
            currentSettings[axis.tag] = val;
        
            updateCMAP();
            redrawActiveGlyphInCanvas();
        };

        input.onchange = (e) => {
            handleChange = false;
            updateCMAP();
        }

        spControls.appendChild(row);
    });


    const handlePreserve = (isAlt = false) => {
        tempVariableSettings = { ...currentSettings }; 

        // isAlt = Alternative Mode Preserve
        const preserve_font = preserveVariableFont(isAlt);

        resetState();

        // Стандартный процесс сборки шрифта 
        font = preserve_font;

        setupVariationControls();
        
        updateCMAP();
        redrawActiveGlyphInCanvas();

        if (glyphEditor === true) { renderEditorCanvas(); }
        
        //console.log(`preserve ${isAlt ? 'Alt ' : ''}`, tempVariableSettings);
    };

    const buttonsRow = document.createElement("div");
    buttonsRow.className = "rWrap";
    buttonsRow.innerHTML = `
        <button class="sbutton preserve_btn">preserve</button>
        <button class="sbutton preserveAlt_btn">/alt </button>
        <div id="pusher" class="fg" ></div>
    `;
    
    const preserveBtn = buttonsRow.querySelector(".preserve_btn");
    const preserveAltBtn = buttonsRow.querySelector(".preserveAlt_btn");

    // 2. Назначаем обработчики
    preserveBtn.onclick = () => handlePreserve(false);
    preserveAltBtn.onclick = () => handlePreserve(true);

    spControls.appendChild(buttonsRow);
    spControls.appendChild(pusher); // толкатель
}


 
function resetState(){
    font = null;
    glyphArray = [];

    currentGlyph = null;
    currentGlyphIndex = null;

    currentItem = null; 
    currentItemIndex = null;
}

function resetFontEditorVariables(){
    if(bezierMode) callBezierMode(false); // отключаем bezier с сохранением

    callGEditMode(false,false);

    generatedFont = false;
    preservedFont = false;
    variableFont = false;

    font = null;
    glyphArray = [];
    currentGlyph = null;
    currentGlyphIndex = null;

    currentItem = null; 
    currentItemIndex = null;

    currentContours = []; // очищаем текущие контура

    tempVariableSettings = {};

    generatePBlock.hidden = true;
    switchCmapViewer.hidden = true;
    gEditBtn.hidden = true;

    specialAlpha = 0;
    pasteAlpha = 1;
    pasteMessageActive = true;
}

const fontlib = new Map();

function saveFontlib(font, buffer, originalFileName) {
    const names = font.names || {};
    const rawName = (names.fullName && (names.fullName.en || Object.values(names.fullName)[0])) || originalFileName;
    const fontName = String(rawName).trim();

    // Если шрифт с таким именем уже есть, удалим его, чтобы при повторной записи 
    // он "обновился" и переместился в конец очереди (стал самым новым)
    if (fontlib.has(fontName)) {
        fontlib.delete(fontName);
    }

    fontlib.set(fontName, {
        buffer: buffer, 
        name: fontName,
        filename: originalFileName,
    });

    // ОГРАНИЧЕНИЕ: Если размер превысил 3, удаляем самый старый (первый)
    const MAX_HISTORY = 3;
    if (fontlib.size > MAX_HISTORY) {
        const firstKey = fontlib.keys().next().value; // получаем самый старый ключ
        fontlib.delete(firstKey);
        console.log(`История переполнена. Удален старый шрифт: ${firstKey}`);
    }
    
    console.log(`Шрифт "${fontName}" сохранен. Текущий размер библиотеки: ${fontlib.size}`);
}

function clearFontlib() {
    fontlib.clear();
    preservedFont = false;
    console.log("Библиотека шрифтов полностью очищена.");
}

function applyFontFromLib(name) {
    const entry = fontlib.get(name);
    if (!entry) return;

    resetState();
    
    //console.log(`applyFontFromLib:`, currentSettings, tempVariableSettings);

    font = opentype.parse(entry.buffer);
    loadedFileName = entry.name;
    originalFormat = entry.filename.split('.').pop().toLowerCase(); 

    // Обновляем интерфейс
    setupVariationControls();
    updateCMAP(); // он сам сделает fullwrite
    updateCMAP(); // второй вызывает update (который почему то лечит этот OTF)

    if (glyphEditor) renderEditorCanvas();    

}

function rollbackFontlib() {
    if (fontlib.size < 1) return alert("Некуда откатываться");

    const keys = Array.from(fontlib.keys());
    const currentKey = keys[keys.length - 1];
    const previousKey = keys[keys.length - 2];

    if(preservedFont){
        // Загружаем последний
        applyFontFromLib(currentKey);
        preservedFont = false;

    }else{
        if (fontlib.size == 1){
            // Загружаем предыдущий
            applyFontFromLib(currentKey);

        }else{
            fontlib.delete(currentKey);
            applyFontFromLib(previousKey);
        }
    }
}

function handleFontFile(file) {
    if (!file) return;
    loadedFileName = file.name;
    originalFormat = loadedFileName.split('.').pop().toLowerCase();

    const reader = new FileReader();

    reader.onload = function() {
        try {

            resetFontEditorVariables();

            let fontData = reader.result;

            // ОТДЕЛЬНЫЙ КЕЙС ДЛЯ WOFF2
            if (originalFormat === 'woff2') {
                if (typeof Module === 'undefined' || typeof Module.decompress !== 'function') {
                    alert("Декомпрессор WOFF2 еще загружается...");
                    return;
                }
                    
                console.log("Processing WOFF2...");
                const decompressed = Module.decompress(new Uint8Array(fontData));
                
                // ВАЖНО: Используем slice, чтобы получить чистый ArrayBuffer шрифта
                // Это решит проблему с "Unsupported OpenType signature"
                fontData = decompressed.buffer.slice(
                    decompressed.byteOffset, 
                    decompressed.byteOffset + decompressed.byteLength
                );
            }

            // Парсинг через opentype.js
            font = opentype.parse(fontData);

            //console.log(font);
            //font.unitsPerEm = 1000; // решение заранее задать 1000 нестабильно (мутация)

            setupVariationControls();
            updateCMAP();

            startwindow = false;

            oStartWindow.hidden = true;

            oMainWindow.hidden = false;
            //cPanelBlock.hidden = false; 
            switchCmapViewer.hidden = false;    

            if (glyphEditor === true) renderEditorCanvas();  

            clearFontlib();
            saveFontlib(font, fontData, loadedFileName);

        } catch (err) {
            alert("Error parsing font: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}


// parse glyphs

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

// glyph params for all svg tile generation (cmap previews)
function getGlyphSVGParams(item) {

    const activeFont = item.font;
    let glyph = item.glyph;

    // 1. Обработка вариативности
    
    if (activeFont.variation) {
        const transformed = activeFont.variation.getTransform(glyph, currentSettings);
        if (transformed && transformed !== glyph) {
            glyph = transformed;
        }
    }

    const upm = activeFont.unitsPerEm || 1000;
    const os2 = activeFont.tables.os2;
    const metrics = glyph.getMetrics();
    const charCase = getGlyphCase(glyph);

    // Все расчеты констант делаем только здесь один раз
    const capHeight = (os2 && os2.sCapHeight) ? os2.sCapHeight : activeFont.ascender;
    const hasCapMetrics = !!(os2 && os2.sCapHeight && os2.sxHeight);

    //console.log("gParams", hasCapMetrics, activeFont.ascender, os2.sCapHeight, os2.sxHeight);
    
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

    // scaleFactor: для вариативных обычно 1, для статики расчет по UPM
    const scaleFactor = (activeFont.variation && glyph !== item.glyph) ? 1 : 1; // what?
    const d = getSafePathNEW(glyph, scaleFactor);

    return { d, vBoxY, width, viewHeight };
}

// generation svg tile from glyph path, inverse y - warning!
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

function checkScroll() {
    const scrollWrapper = document.getElementById("cmpaScrollWrapper");
    requestAnimationFrame(() => {
        const hasScroll = scrollWrapper.scrollHeight -20 > scrollWrapper.clientHeight;
        searchWrapper.hidden = !hasScroll; 
    });
}

function checkScrollNow(){
    const scrollWrapper = document.getElementById("cmpaScrollWrapper");
    const hasScroll =  scrollWrapper.scrollHeight -20 > scrollWrapper.clientHeight
    searchWrapper.hidden = !hasScroll
}

function updateCMAP(mode="glyph", updateTile=true, action) { 
    // Base Method for UpdateObjects in CMAP
    // mode "glyph" or "component" ; action "fullwrite" or "update", 

    let currentAction;
    if (action !== undefined) { 
        currentAction = action;
    }else{ 
        currentAction = "update"
    }
    

    // Используем Fragment для быстрой вставки в DOM
    if(updateTile){
        cmap.innerHTML = "";  
    }
      

    const fragment = document.createDocumentFragment();

    // 0. Уточняем с каким шрифтом и кастомным массивом имеем дело
    let targetFont, targetArray, componentFlag;

    if (mode === "component") {
        if(!component_font){ 
            //console.log("Fallback on CompCreate");
            component_font = processCreateFont("component", true);
            currentAction = "fullwrite";
        }
        
        targetFont = component_font; //buffer
        targetArray = compArray;
        currentDataArray = compArray;
        componentFlag = true;
    } else {
        if(!font){ 
            //console.log("Fallback on ProcCreate"); 
            if(generatedFont){
               font = processCreateFont("procedure", true); // true = returnFont
           }else{
               font = processCreateFont("opentype", true); 
           }
            
            currentAction = "fullwrite";
        } 
        
        targetFont = font; // general
        targetArray = glyphArray;
        currentDataArray = glyphArray;
        componentFlag = false;
    }

    if(!targetFont){ 
        if(!handleChange) console.log("Fallback on Draft");
        const draft = processCreateFont("opentype", true);
        
        // Записываем в глобал, чтобы в следующий раз не пересоздавать
        if (mode === "component") component_font = draft; else font = draft;
        if (mode === "component") currentDataArray = compArray; else currentDataArray = glyphArray;
        targetFont = draft;
        
        if(!targetFont){
            if(!handleChange) console.log("updateCMAP: шрифт не определён");
            return
        }
    }
    
    if(targetArray.length==0){
    /* 
        Здесь fullwrite при 0 не проблема т.к. 
        он перезаписывает внутренние даныне
    */
        currentAction = "fullwrite";
    }

    if(!handleChange) console.log("updateCMAP:", currentAction);

    if(currentAction === "fullwrite") { // Обновляем Item по которому рисуется плитки > вызываем создание плитки

        targetArray.length = 0; // ОЧИСТКА У ИСХОДНОГО ОБЪЕКТА
        
        for (let i = 0; i < targetFont.glyphs.length; i++) {
            const glyph = targetFont.glyphs.get(i);
            
            // Проверка на пустоту
            //if (glyph.numberOfContours <= 0 || glyph.name === '.notdef' || glyph.name === '.null' || glyph.name === 'nonmarkingreturn') continue;
             
            if (glyph.numberOfContours <= 0 || systemGlyphsNames.includes(glyph.name)) continue;
            //if (!glyph || systemGlyphsNames.includes(glyph.name)) continue; // Better Alternate?

            /*
            // 3. Проверка на пустоту (для TTF учитываем компоненты)
            if (glyph.unicode === undefined) continue;
            const isComposite = glyph.components && glyph.components.length > 0;
            const hasPath = glyph.numberOfContours !== 0 || (glyph.path && glyph.path.commands.length > 0);
            if (!hasPath && !isComposite) continue;
            //console.log(glyph.unicode);
            */
            
            // CreateArrayItem
            const forIndex = targetArray.length;
            const item = {
                
                font: targetFont,
                array: targetArray,

                findex: glyph.index, // font index
                aindex: forIndex, // array index

                unicode: glyph.unicode || undefined,
                name: glyph.name || `Unknow ${i}`,
                glyph: glyph || null,

                // customs
                template: glyph._templateFlag || false,

                componentFlag: componentFlag,
                compmask: glyph._compMaskFlag || false,
            };

            targetArray.push(item);

            if(updateTile) createTile(item, fragment); 
            
        }
        
        if(updateTile) cmap.appendChild(fragment);

    }else{
        // Режим "update"
        // Не переписываем массив - просто обновляем плитки
        targetArray.forEach((item, index) => {

            /* 
            А если порядок индексов в шрифте сместился, то всё идёт нахуй 
            > но это просто ссылка на актуальный шрифт уже созданный по рецептам
            > ?
            
            */

            //item.font = targetFont; 

            // 2. ВАЖНО: Обновляем ссылку на глиф из нового шрифта по индексу или имени
            // Так как в новом объекте шрифта глифы — это тоже новые объекты!
            // item.glyph = targetFont.glyphs.get(item.index); 

            createTile(item, fragment);
        });

        cmap.appendChild(fragment);
    }

    if(!variableFont) createCMapPlusButton();
    checkScroll();
}


//// Add Glyph / Component  Panel Section
 
 function createBlankPath(){
    const myPath = new opentype.Path();
    myPath.moveTo(100, 100);
    myPath.lineTo(100, 400);
    myPath.lineTo(400, 100);
    myPath.closePath();
    return myPath
 }


function appendGraphOject() {
    
    if(bezierMode) callBezierMode(false, false); // отключаем bezier с сохранением

    console.log("appendGraphOject == START");
    
    const oNameInput = document.getElementById("oNameInput");
    const newName = oNameInput.value;

    let templateFlag;
    let compValuesItem = null;
    let targetFont = null;
    let ucode = undefined;
    let componentFlag = false;

    const addComment = (text = "") => {
        const oCommentLine = document.getElementById("oCommentLine");
        oCommentLine.hidden = false;
        oCommentLine.innerHTML = `
            <label> ${text}...</label>
        `;
        return
    };

    if(newName==="") return addComment("EnterName")

    const targetArray = currentDataArray;
    const foundName = targetArray.find(item => item.name === newName);

    const newIndex = targetArray.length;
    let resultIndex = newIndex;

    if(arrayViewer.glyf){

        if(foundName) return addComment(`Глиф с этим "name" уже существует`)

        const oUnicodeInput = document.getElementById("oUnicodeInput");
        ucode = oUnicodeInput.value;
        //if(newName.length==1){ ucode = newName.charCodeAt(0); }
        //if (isNaN(ucode) || ucode < 0 || ucode > 0x10FFFF) return addComment(`Странный Unicode`)

        let ucodeVal = oUnicodeInput.value.trim();
        if (newName.length === 1) { 
            ucode = newName.charCodeAt(0); 
        } else {
            // Если ввели вручную, преобразуем в число (десятичное или hex)
            ucode = ucodeVal === "" ? undefined : parseInt(ucodeVal, 10); 
        }

        // Проверка (разрешаем undefined, если Unicode не обязателен, или запрещаем)
        if (ucode !== undefined && (isNaN(ucode) || ucode < 0 || ucode > 0x10FFFF)) {
            return addComment(`Странный Unicode`);
        }

        //const lastElement = glyphArray.length - 1;
        //const lastIndex = glyphArray[lastElement].index;
        //const newIndex = lastIndex+1;
        targetFont = font;
        
    }
    else if(arrayViewer.comp){
        
        if(foundName) return addComment(`Компонент с этим "name" уже существует..`)

        const oTypeSelect = document.getElementById("oTypeSelect");
        const uSelection = oTypeSelect.value;
        targetFont = component_font;
        componentFlag = true;

        // пока внутрениий объект
        compValuesItem = {
            name: newName,
            type: uSelection, // fill, mask, code 
        };

    }

    const fontIndex = targetFont.glyphs.length;
    
    const itsSameIndex = (fontIndex === newIndex);
    if(!itsSameIndex){
        resultIndex = fontIndex;
    }

    let advW = 400;
    if(generatedFont){ 
        advW = GFONT_PARAMS.w || 400;
    }

    // Создаем объект глифа
    let newGlyph;
    if ( generatedFont) { 
        newGlyph = creteGlyphPromProcedure(newName, resultIndex, 0);
    }else{
        const tempPath = createBlankPath();

        newGlyph =  new opentype.Glyph({
            index: resultIndex,
            name: newName,
            advanceWidth: advW,
            unicode: ucode || undefined,
            path: tempPath || undefined,
        });
    }

    //const codeItem = (compValuesItem && compValuesItem.type === "code"); 
    const maskFlag = (compValuesItem?.type === "mask");


    // CreateArrayItem
    const item = {

        font: targetFont,
        array: targetArray,

        findex: fontIndex, // font index
        aindex: newIndex, // array index

        unicode: ucode || undefined,
        name: newName,
        glyph: newGlyph || null,
        
        // customs
        template: newGlyph._templateFlag || false,

        componentFlag: componentFlag,
        compmask:  maskFlag || newGlyph._compMaskFlag || false, // из процедуры вернётся как флаг
    };


    // 2. Добавляем его в коллекцию glyphs
    targetFont.glyphs.push(resultIndex, newGlyph);

    // 3. ОБЯЗАТЕЛЬНО: Обновляем счетчик глифов в таблице maxp
    // Без этого при экспорте шрифт будет обрезан или поврежден
    targetFont.tables.maxp.numGlyphs = targetFont.glyphs.length;
    

    currentDataArray.push(item);

    if(!componentFlag){
        addGlyphsArray.push(newName);         
    }else{
        addCompsArray.push(newName); 
    }

    const fragment = document.createDocumentFragment();
    
    createTile(item, fragment, true); // force Active

    cmap.appendChild(fragment);

    const oAddElementBlock = document.getElementById("oAddElementBlock");
    oAddElementBlock.hidden = true;

    oUnicodeInput.value = "";
    
    createCMapPlusButton(); // двигает кнопку в конец

    redrawActiveGlyphInCanvas(true);

    updateObjectStats();

    console.log("appendGraphOject == END", newName);
}

function funcPlusCMapBtn(){
    const oAddElementBlock = document.getElementById("oAddElementBlock"); 
    const pushBtn = document.getElementById("pushBtn");
    const cancelPushBtn = document.getElementById("cancelPushBtn");
    const oCommentLine = document.getElementById("oCommentLine");

    const allObjectFlag = oAddElementBlock && pushBtn && cancelPushBtn && oCommentLine;
    if (!allObjectFlag) return;

    // Inside Elements
    
    const oPanelLabel = document.getElementById("oPanelLabel");

    const oNameLabel = document.getElementById("oNameLabel");
    const oNameInput = document.getElementById("oNameInput");

    const oTypeSelectLine = document.getElementById("oTypeSelectLine");
    const oTypeSelect = document.getElementById("oTypeSelect");

    const oUnicodeLine = document.getElementById("oUnicodeLine");
    const oUnicodeInput = document.getElementById("oUnicodeInput");

    
    console.log(arrayViewer.bcurrent);

    if (arrayViewer.bcurrent !== arrayViewer.bprevious) {
        oNameInput.value = "";
        oUnicodeInput.value = "";
    }

    if(arrayViewer.glyf){ // Add Glyph Process (Global Variable)

        oPanelLabel.textContent = "Create mew glyph....";
        oNameLabel.textContent = "GlyphName";

        if(oUnicodeLine){ oUnicodeLine.hidden = false; }
        if(oTypeSelectLine){ oTypeSelectLine.hidden = true; }

        oNameInput.oninput = (event) => {
            const a = event.target.value;
            // если символов нет : отключаем ввод unicode
            // если символ == 1  : делаем проверку по unicode, 
            // если символов > 1 : очищаем поле, чтобы user мог сам ввести unicode
            
            if(a.length==0){
                oUnicodeInput.disabled = true;
                oUnicodeInput.value = "";
            } else if (a.length>1){
               oUnicodeInput.value = "";
            }else if (a.length==1){
               const c = a.charCodeAt(0);
               oUnicodeInput.disabled = false;
               oUnicodeInput.value = c;
            }
        };       

    }else if(arrayViewer.comp){ // Add Component Process

        oPanelLabel.textContent = "Create new component....";
        oNameLabel.textContent = "cName";

        if(oUnicodeLine){ oUnicodeLine.hidden = true; }
        if(oTypeSelectLine){ oTypeSelectLine.hidden = false; }

        // Прописываю логику

        oNameInput.oninput = (event) => {
        };     
    }
    
    pushBtn.onclick = () => appendGraphOject();

    const cancelPushFunc = () => {
        oAddElementBlock.hidden = true;
    };

    cancelPushBtn.onclick = () => cancelPushFunc();

    // OpenWindow 
    oCommentLine.innerHTML = "";
    oCommentLine.hidden = true;

    oAddElementBlock.hidden = false;
}

function createCMapPlusButton() {
    const cmap = document.getElementById('cmap');
    if (!cmap) return

    const existingBtn = cmap.querySelector('.PlusCMapButton');

    if (!existingBtn) { // > create

        if(!handleChange) console.log("Пересоздаю кнопку");

        const plusBtn = document.createElement("button");

        plusBtn.id = "PlusCMapBtn";
        plusBtn.className = "PlusCMapButton";
        plusBtn.textContent = "+";

        const cMapMode = arrayViewer.bcurrent ? "1" : "0";

        plusBtn.dataset.cmode = cMapMode;
        plusBtn.dataset.tmode = cMapMode;

        plusBtn.onclick = () => funcPlusCMapBtn();
        plusBtn.draggable = false;

        cmap.appendChild(plusBtn);
        return;

    }else{
        //console.log(" Вставляем кнопку в конец cmap")
        cmap.insertBefore(existingBtn, null); 
    }
}

//// End Section


let tempElement = null;

function createTile(item, container, forceActive = false) {
    
    let arrayIndex = item.aindex;
    let glyph = item.glyph;
    

    // 2. Получаем параметры (один раз!)
    const params = getGlyphSVGParams(item);
    
    // Проверка на наличие контура
    const pathNoEmpty = params.d && params.d.trim().length > 0;

    // 3. Создаем структуру плитки в любом случае
    const tile = document.createElement("div");
    tile.className = "tile";
    
    if (item.template) {
        tile.classList.add("template");
    }
    
    tile.dataset.name = item.name;
    tile.dataset.arrayIndex = arrayIndex;// Позиция в массиве
    tile.dataset.fontIndex = item.findex; // Индекс в шрифте (напр. 42)

    //tile.dataset.type = "gfont";
    //if (!pathNoEmpty) tile.classList.add("empty-glyph"); // Можно подсветить пустые плитки в CSS

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

    // 4. TileSelection Logic

    let lastIndex = null;

    if(arrayViewer.glyf && arrayViewer.glyfTempIndex !== null){
        lastIndex = arrayViewer.glyfTempIndex;

    }else if (arrayViewer.comp && arrayViewer.compTempIndex !== null){ 
        lastIndex = arrayViewer.compTempIndex;
    }

    //if(!handleChange) console.log("lastIndex",  lastIndex);
    
    if(!forceActive){ // Fill Cmap default

        if ( arrayIndex == 0 && lastIndex==null && pathNoEmpty) { // HideAutoselect First
        
            currentItemIndex = arrayIndex;

            if(!handleChange) console.log("Auto-selected firstTile:", arrayViewer);


        }else if( lastIndex !== null && lastIndex === arrayIndex ){ 
            
            currentItemIndex = arrayIndex;

            tile.classList.add("active");
            tempElement = tile;
            
            if(!handleChange) console.log("Select From Temp");
        }
    
    }else{ // ForceActive = appendGraphOject

        if(tempElement !== null){ tempElement.classList.remove("active");
        }

        currentItemIndex = arrayIndex;

        if(arrayViewer.glyf){
            arrayViewer.glyfTempIndex = arrayIndex;

        }else if (arrayViewer.comp){ 
            arrayViewer.compTempIndex = arrayIndex;
        }

        arrayViewer.userInteraction = true;

        tile.classList.add("active");
        tempElement = tile;
    }

    tile.onclick = () => clickMap(tile, arrayIndex); // смена клика  item.index > index (click on ArrayIndex)
    tile.draggable = true;

    tile.ondragstart = (e) => {
        //console.log("ПРЕ", item.componentFlag);
        e.dataTransfer.setData("componentFlag", item.componentFlag); 
        e.dataTransfer.setData("arrayIndex", arrayIndex); // создать специальный id?
    };
}

function updateCurrentTile(arrayIndex) {
    // Ищем объект в массиве по индексу
    // const item = glyphArray.find(it => it.index === index);
    
    let item = null;
    
    if (arrayIndex !== undefined) {
        item = glyphArray[arrayIndex]; 
    }else{
        if(currentItem){
            item = currentItem;
        }
    }

    if (!item || !item?.tilePath) return;

    const params = getGlyphSVGParams(item);
    const svg = item.tilePath.ownerSVGElement;

    if (svg) {
        svg.setAttribute("viewBox", `0 ${params.vBoxY} ${params.width} ${params.viewHeight}`);
    }
    item.tilePath.setAttribute('d', params.d);

    renderSampleCanvas();
}

function finalizePath(path) {
    if (!path || path.segments.length < 2) return;

    const first = path.firstSegment;
    const last = path.lastSegment;

    const dist = first.point.getDistance(last.point);

    if (dist < 1e-6) {
        // переносим handle
        if (last.handleIn) {
            first.handleIn = last.handleIn.clone();
        }

        last.remove();
        path.closed = true;
    }
}

function preserveVariableFont(altMode = false) {
    const glyphs = [];

    // 1. Инициализируем Paper.js один раз вне цикла
    paper.setup(new paper.Size(font.unitsPerEm, font.unitsPerEm));

    console.log("ModeCFF", cffmode_preserve);

    for (let i = 0; i < font.glyphs.length; i++) {
        const originalGlyph = font.glyphs.get(i);
        if (!originalGlyph) {
            // Если глифа нет физически, пушим null, чтобы сохранить индекс
            glyphs.push(null);
            continue;
        }

        /*
        informBlock.innerHTML = `
            <div class="font-info">
                <p>Process: ${i} / ${font.glyphs.length}</p>
            </div>
        `;
        */

        let processedGlyph;
        let hasPath;

         // и проверяем наличие контуров ИЛИ команд (для CFF)
        if(!cffmode_preserve){
            // условие, которое не генерирует лишних символов
            hasPath = originalGlyph.numberOfContours > 0;
        }else{
            hasPath = originalGlyph.path && originalGlyph.path.commands.length > 0;
        }

        if (font.variation && i !== 0 && hasPath) {

            //Изначальная
            processedGlyph = font.variation.getTransform(originalGlyph, currentSettings);

            processedGlyph.index = i;
            processedGlyph.name = originalGlyph.name;
            processedGlyph.unicode = originalGlyph.unicode;
            processedGlyph.unicodes = originalGlyph.unicodes || [];
            processedGlyph.advanceWidth = originalGlyph.advanceWidth;
            
            // START MERGED PART (PROBLEM 1 SOLVED)

            // Новая реализация Merged через Paper.js (Чтобы корректно отображалась в Windows)
            // Очищаем текущий проект Paper.js перед обработкой нового глифа


/* MAYBE PROBLEM WITH MULTIPLE PATH 
NOW ALGORITM
SELECT ALL PATH > MERGE BETWEEN
FOR EACH ALL PATH 
IF ALL PTS INSIDE AND AREA PATH < MERGE BETWEEN = HOLE
CUT ALL HOLE FROM MERGE BETWEEN
*/

            paper.project.activeLayer.removeChildren();

            const paperPaths = [];
            const potentialHoles = [];
            let currentPath = null;

            let odebug = false;
            /*
            if(processedGlyph.name == "C"){ odebug = true;
                console.log("debugActivate");
                console.log(processedGlyph.path.commands);
            }
            */

            // Конвертируем команды в пути Paper.js
            processedGlyph.path.commands.forEach(cmd => {
                if (cmd.type === 'M') {
                    //finalizePath лечит cff крайние точки
                    finalizePath(currentPath);
                    currentPath = new paper.Path();
                    currentPath.moveTo([cmd.x, cmd.y]);
                    paperPaths.push(currentPath);
                } else if (currentPath) {
                    if (cmd.type === 'L') currentPath.lineTo([cmd.x, cmd.y]);
                    else if (cmd.type === 'C') currentPath.cubicCurveTo([cmd.x1, cmd.y1],[cmd.x2, cmd.y2],[cmd.x, cmd.y]);
                    else if (cmd.type === 'Q') currentPath.quadraticCurveTo([cmd.x1, cmd.y1], [cmd.x, cmd.y]);
                    else if (cmd.type === 'Z') currentPath.closePath();

                }
            });

            //finalizePath лечит крайние точки для cff 
            finalizePath(currentPath);

            // Дырки?
            paperPaths.forEach(path => {

                const isHoleA = false; // проверка по Area была
                
                let isHoleB = cffmode_preserve ? !path.clockwise : path.clockwise;
                if (altMode) isHoleB = !isHoleB; 

                if (isHoleA || isHoleB) {
                    let pp;
                    const cleaned = path.unite(path);
                    
                    if (cleaned instanceof paper.CompoundPath && cleaned.children.length > 0) {
                        pp = cleaned.children
                            .reduce((a, b) => Math.abs(a.area) > Math.abs(b.area) ? a : b)
                            .clone();
                        cleaned.remove(); 
                    } else {
                        pp = cleaned;
                    }

                    potentialHoles.push(pp);
                }
            });


            if(odebug){ 
                console.log(paperPaths);
                //console.log(potentialHoles);
            }

            // Merged Logic 
            if (paperPaths.length > 0) {

                // 1. СВАРИВАЕМ ВООБЩЕ ВСЁ В ОДИН МОНОЛИТ
                // На этом этапе "О" станет залитым кругом, а "t" — цельным крестом
                let bodyMonolith = paperPaths[0].unite(paperPaths[0]);
                
                for (let p = 1; p < paperPaths.length; p++) {
                    const prev = bodyMonolith;
                    const cleanPart = paperPaths[p].unite(paperPaths[p]);
                    bodyMonolith = bodyMonolith.unite(cleanPart);
                    
                    if (prev) prev.remove();
                    cleanPart.remove();
                    paperPaths[p].remove();
                }

                let finalShape = bodyMonolith;

                if (finalShape.length === 0) {
                    // Если тел путей нет, выходим из обработки глифа
                    glyphs.push(processedGlyph || originalGlyph);
                    continue; 
                }

                // 3. ВЫРЕЗАЕМ ВСЕ ДЫРКИ
                potentialHoles.forEach(hole => {
                    // ПРАВИЛО 1: Площадь дырки должна быть меньше площади монолита
                    const isSmaller = Math.abs(hole.area) < Math.abs(finalShape.area);

                    // ПРАВИЛО 2: Все точки дырки должны быть внутри монолита
                    // Проверяем каждый сегмент контура потенциальной дырки
                    const allPointsInside = hole.segments.every(segment => 
                        finalShape.contains(segment.point)
                    );

                    if (isSmaller && allPointsInside) {
                        const prev = finalShape;
                        finalShape = finalShape.subtract(hole);
                        if (prev && prev !== bodyMonolith) prev.remove();

                    }
                    hole.remove();
                });

                // 4. Финальный реориент для корректного файла (Windows)
                if (finalShape instanceof paper.CompoundPath) {
                    finalShape.reorient(true);
                } else {
                    finalShape.clockwise = true;
                }

                // 5. ЭКСПОРТ ОБРАТНО В OPENTYPE
                const finalPath = new opentype.Path();
                const children = (finalShape instanceof paper.CompoundPath) ? finalShape.children : [finalShape];

                children.forEach(child => {
                    if (!child.curves || child.curves.length === 0) return;
                    
                    finalPath.moveTo(child.curves[0].point1.x, child.curves[0].point1.y);
                    child.curves.forEach(curve => {
                        if (curve.isLinear()) {
                            finalPath.lineTo(curve.point2.x, curve.point2.y);
                        } else {
                            finalPath.curveTo(
                                curve.handle1.x + curve.point1.x, curve.handle1.y + curve.point1.y,
                                curve.handle2.x + curve.point2.x, curve.handle2.y + curve.point2.y,
                                curve.point2.x, curve.point2.y
                            );
                        }
                    });
                    finalPath.close();
                });

                processedGlyph.path = finalPath;

                // Очистка памяти проекта
                if (finalShape) finalShape.remove();
                paper.project.activeLayer.removeChildren(); 
            }

            // END MERGED PART

            //processedGlyph.data = processedGlyph.data || {};
            //processedGlyph.data.overlapSimple = true;
            //console.log(processedGlyph.data.overlapSimple);

        } else {
            processedGlyph = originalGlyph;
        }

        glyphs.push(processedGlyph);
    }


    const postfixName = " Fedit";
    const postfixFamily = " Preserve";
    const postFixDesigner = " & .Fe";

    const preBase = loadedFontName.trim();
    const cleanBaseName = removeWeightName(preBase); 

    const newFamilyName = cleanBaseName + postfixName;
    const newStyleName = getWeightName(currentSettings.wght || 400) + postfixFamily;
    const newDesigner = getSafeName(font, 'designer')+postFixDesigner; 

    // 3. Собираем объект шрифта
    const NewTables = {};

    // Проверяем наличие каждой таблицы перед копированием
    if (font.tables.cmap) NewTables.cmap = Object.assign({}, font.tables.cmap);
    if (font.tables.os2)  NewTables.os2  = Object.assign({}, font.tables.os2);
    if (font.tables.maxp) NewTables.maxp = Object.assign({}, font.tables.maxp);
    //console.log(font.tables)
    
    const new_font = new opentype.Font({
        familyName: cleanBaseName,
        styleName: newStyleName,
        unitsPerEm: font.unitsPerEm,
        ascender: font.ascender,
        descender: font.descender,
        designer: newDesigner,
        glyphs: glyphs,
        tables: NewTables
    });

    preservedFont = true;
    paper.project.clear(); // удаляет все слои и объекты Paper.js
    console.log("Preserved font:", preservedFont);
    return new_font
}

// ---------- BEZIER EDITOR  ----------

const HIT_RADIUS_PX = 8


// --- Drawing helpers & guidelines ---

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

// glyph params for glyphEditor (canvas element), using for global canvas transform
function getEditorTransformParams(glyph) {
    
    const fontSize = 600;
    
    const targetGlyph = glyph || (typeof currentGlyph !== 'undefined' ? currentGlyph : null);
    //console.log("ТФЬ",targetGlyph?.name)
    //const targetGlyph = currentItem?.glyph ?? null;

    const upm = (font && font.unitsPerEm) ? font.unitsPerEm : 1000;
    
    // Масштаб всегда должен быть fontSize / upm, 
    // чтобы физический размер на экране был равен fontSize пикселей
    const renderSize = fontSize; 

    const baseScale = fontSize / upm;
    const scale = baseScale * zoom;

    const limitX = (canvas.width * zoom - canvas.width) / 2;
    const limitY = (canvas.height * zoom - canvas.height) / 2;
    panX = Math.max(-limitX, Math.min(limitX, panX));
    panY = Math.max(-limitY, Math.min(limitY, panY));

    const cOffset = canvas.height * 0.7; // Константа смещения
    const baseline = cOffset + panY;     // Текущая линия с учетом панорамирования
    const yCenter = baseline - (cOffset / 2) * scale; 

    let x = null;
    let width = null;

    if (targetGlyph) {
        const glyphWidth = (targetGlyph.advanceWidth || upm) * scale; //glyphWidth
        x = ( (canvas.width - glyphWidth) / 2 ) + panX;
        width = glyphWidth;
    }

    return { renderSize, x, baseline,  yCenter, width, scale, zoom};
}


// editableContours Methods

// helper: get actual editableContours Width 
function getContoursWidth(contours) {
    if (!contours || contours.length === 0) return 0;

    let minX = Infinity;
    let maxX = -Infinity;

    contours.forEach(contour => {
        contour.forEach(pt => {
            const points = [pt.anchor, pt.handle1, pt.handle2].filter(p => p);
            points.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
            });
        });
    });
    if (minX === Infinity) return 0;

    return maxX - minX;
}

// Convertion glyph (from opentype.js) cmds to editableContours for glyphEditor (structWrapper)
function buildEditableContours(cmds){
    const contours = []
    let cur = []
    cmds.forEach(cmd=>{
        if(cmd.type === 'M'){
            if(cur.length) { contours.push(cur); cur = [] }
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
            // quadratic: single control
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
        } else if(cmd.type === 'Z'){// last point
            if(cur.length){
                cur[cur.length-1].closed = true
            }
        }
    })
    if(cur.length) contours.push(cur)
    return contours
}

// Convertion editableContours to glyphPaths (opentype.js) (structWrapper)
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


// Parsing SVG from plaintext to create editableContours
// Need to Replace currentContours from AdobeIllustrator (svg buffer data, copy-paste) 

// helper: get transformation from svg struct
function getSVGMatrix(transformStr) {
    const svg = document.getElementById('svg-parser') || document.createElementNS("http://w3.org", "svg");
    let matrix = svg.createSVGMatrix();

    if (!transformStr) return matrix;

    // Регулярка для поиска команд: translate(x y), rotate(a), etc.
    const transformRegex = /([a-z]+)\s*\(([^)]+)\)/gi;
    let match;

    while ((match = transformRegex.exec(transformStr)) !== null) {
        const command = match[1].toLowerCase();
        const args = match[2].trim().split(/[\s,]+/).map(Number);

        if (command === 'translate') {
            matrix = matrix.translate(args[0], args[1] || 0);
        //} else if (command === 'rotate') {
        //    matrix = matrix.rotate(args[0], args[1] || 0, args[2] || 0);
        } else if (command === 'rotate') {
            const angle = args[0];
            const cx = args[1] || 0;
            const cy = args[2] || 0;

            if (args.length > 1) {
                matrix = matrix
                    .translate(cx, cy)
                    .rotate(angle)
                    .translate(-cx, -cy);
            } else {
                matrix = matrix.rotate(angle);
            }
        } else if (command === 'scale') {
            matrix = matrix.scale(args[0], args[1] === undefined ? args[0] : args[1]);
        } else if (command === 'matrix') {
            const m = svg.createSVGMatrix();
            m.a = args[0]; m.b = args[1]; m.c = args[2];
            m.d = args[3]; m.e = args[4]; m.f = args[5];
            matrix = matrix.multiply(m);
        }
    }
    return matrix;
}

// helper: apply matrix transformation for coord (bake transform)
function applyTransform(x, y, transformStr) {
    if (!transformStr || transformStr.trim() === "") return { x, y };
    try {
        const matrix = getSVGMatrix(transformStr);
        return {
            x: x * matrix.a + y * matrix.c + matrix.e,
            y: x * matrix.b + y * matrix.d + matrix.f
        };
    } catch (e) {
        console.error("Manual Matrix Error:", e);
        return { x, y };
    }
}

// helper: svg ellipse to path (easy way)
function ellipseToPath(cx, cy, rx, ry, transformStr) {
    const k = 0.552284749831;
    const ox = rx * k;
    const oy = ry * k;

    // Вспомогательная микро-функция для чистоты строки
    const T = (x, y) => {
        const p = applyTransform(x, y, transformStr);
        return `${p.x} ${p.y}`;
    };

    return `
        M ${T(cx - rx, cy)}
        C ${T(cx - rx, cy - oy)} ${T(cx - ox, cy - ry)} ${T(cx, cy - ry)}
        C ${T(cx + ox, cy - ry)} ${T(cx + rx, cy - oy)} ${T(cx + rx, cy)}
        C ${T(cx + rx, cy + oy)} ${T(cx + ox, cy + ry)} ${T(cx, cy + ry)}
        C ${T(cx - ox, cy + ry)} ${T(cx - rx, cy + oy)} ${T(cx - rx, cy)}
        Z
    `;
}

// Convertion svg paths to path cmds
function parsePathData(d, flipY = true) { // flip for glyph idealogy
    
    // Игнорирует (T, A) и скорее всего нужно править!
    
    const commands = [];
    const commandRegex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;

    let match;
    let cx = 0, cy = 0;
    let sx = 0, sy = 0;

    const transformY = (y) => flipY ? -y : y;

    while ((match = commandRegex.exec(d)) !== null) {
        const type = match[1];
        const isRelative = (type === type.toLowerCase());

        const raw = match[2].trim();

        const args = raw
            ? (raw.match(/-?\d*\.?\d+(e[-+]?\d+)?/gi) || []).map(Number)
            : [];

        const t = type.toUpperCase();

        if (t === 'M' || t === 'L') {
            for (let i = 0; i < args.length; i += 2) {
                let x = args[i];
                let y = args[i + 1];

                if (isRelative) {
                    x += cx;
                    y += cy;
                }

                const cmdType = (t === 'M' && i === 0) ? 'M' : 'L';

                commands.push({
                    type: cmdType,
                    x,
                    y: transformY(y)
                });

                cx = x;
                cy = y;

                if (cmdType === 'M') {
                    sx = x;
                    sy = y;
                }
            }
            continue;
        }
        else if (t === 'H') {
            for (let i = 0; i < args.length; i++) {
                let x = args[i];

                if (isRelative) {
                    x += cx;
                }

                commands.push({
                    type: 'L',
                    x,
                    y: transformY(cy)
                });

                cx = x;
            }
            continue;
        }
        else if (t === 'V') {
            for (let i = 0; i < args.length; i++) {
                let y = args[i];

                if (isRelative) {
                    y += cy;
                }

                commands.push({
                    type: 'L',
                    x: cx,
                    y: transformY(y)
                });

                cy = y;
            }
            continue;
        }
        else if (t === 'C') {
            for (let i = 0; i < args.length; i += 6) {
                let x1 = args[i];
                let y1 = args[i + 1];
                let x2 = args[i + 2];
                let y2 = args[i + 3];
                let x = args[i + 4];
                let y = args[i + 5];

                if (isRelative) {
                    x1 += cx; y1 += cy;
                    x2 += cx; y2 += cy;
                    x += cx; y += cy;
                }

                commands.push({
                    type: 'C',
                    x1,
                    y1: transformY(y1),
                    x2,
                    y2: transformY(y2),
                    x,
                    y: transformY(y)
                });

                cx = x;
                cy = y;
            }
            continue;
        }
        else if (t === 'Q') {
            for (let i = 0; i < args.length; i += 4) {
                let x1 = args[i];
                let y1 = args[i + 1];
                let x = args[i + 2];
                let y = args[i + 3];

                if (isRelative) {
                    x1 += cx; y1 += cy;
                    x += cx; y += cy;
                }

                commands.push({
                    type: 'Q',
                    x1,
                    y1: transformY(y1),
                    x,
                    y: transformY(y)
                });

                cx = x;
                cy = y;
            }
            continue;
        }
        else if (t === 'Z') {
            commands.push({ type: 'Z' });
            cx = sx;
            cy = sy;
            continue;
        }
        else if (t === 'S') {
            for (let i = 0; i < args.length; i += 4) {
                // Внутри case 'S':
                let x2 = args[i];
                let y2 = args[i + 1];
                let x = args[i + 2];
                let y = args[i + 3];

                if (isRelative) {
                    x2 += cx; y2 += cy;
                    x += cx; y += cy;
                }

                // Вычисляем отражение в "нормальных" координатах (до flipY)
                let x1 = cx;
                let y1 = cy;

                const prev = commands[commands.length - 1];
                if (prev && prev.type === 'C') {
                    x1 = cx * 2 - prev.x2;
                    y1 = transformY(cy) * 2 - prev.y2; 
                } else {
                    y1 = transformY(cy);
                }

                commands.push({
                    type: 'C',
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: transformY(y2),
                    x: x,
                    y: transformY(y)
                });

                cx = x;
                cy = y;
            }
            continue;
        }

    }

    return commands;
}


// helpers for Normalization Direction and Reverse

// Под вопросом к сложным формам (check S )
function getSignedArea(contour) { // использует anchor
    let sum = 0;
    for (let i = 0; i < contour.length; i++) {
        const p1 = contour[i].anchor;
        const p2 = contour[(i + 1) % contour.length].anchor;
        sum += (p2.x - p1.x) * (p2.y + p1.y);
    }
    return sum;
}

// Под вопросом
function reverseContour(contour) {
    if (contour.length < 2) return contour;
    const closed = contour[contour.length - 1]?.closed;
    const segments = [];

    for (let i = 1; i < contour.length; i++) {
        const prev = contour[i - 1];
        const curr = contour[i];

        segments.push({
            type: curr.type,
            from: prev.anchor,
            to: curr.anchor,
            h1: curr.handle1,
            h2: curr.handle2
        });
    }
    if (closed) {
        const first = contour[0];
        const last = contour[contour.length - 1];

        segments.push({
            type: 'L', // Z = line
            from: last.anchor,
            to: first.anchor,
            h1: null,
            h2: null
        });
    }

    segments.reverse();
    const reversedSegments = segments.map(seg => {
        if (seg.type === 'L') {
            return {
                type: 'L',
                from: seg.to,
                to: seg.from,
                h1: null,
                h2: null
            };
        }
        if (seg.type === 'Q') {
            return {
                type: 'Q',
                from: seg.to,
                to: seg.from,
                h1: seg.h1, 
                h2: null
            };
        }
        if (seg.type === 'C') {
            return {
                type: 'C',
                from: seg.to,
                to: seg.from,
                h1: seg.h2, 
                h2: seg.h1
            };
        }

        return seg;
    });

    const result = [];

    result.push({
        type: 'M',
        anchor: { ...reversedSegments[0].from },
        handle1: null,
        handle2: null
    });

    for (let seg of reversedSegments) {
        result.push({
            type: seg.type,
            anchor: { ...seg.to },
            handle1: seg.h1 ? { ...seg.h1 } : null,
            handle2: seg.h2 ? { ...seg.h2 } : null
        });
    }

    if (closed) {
        result[result.length - 1].closed = true;
    }

    return result;
}

function getFillRule(el) {
    let rule = el.getAttribute('fill-rule');

    if (rule) return rule;

    const style = el.getAttribute('style');
    if (style) {
        const match = style.match(/fill-rule\s*:\s*(evenodd|nonzero)/i);
        if (match) return match[1].toLowerCase();
    }

    return 'nonzero'; // default SVG
}

// add methods for hole attributes
function detectRolesByArea(contours) { // корректно определяет что есть дырка а что нет
    const groups = new Map();
    contours.forEach(c => {
        if (!groups.has(c.sourceId)) groups.set(c.sourceId, []);
        groups.get(c.sourceId).push(c);
    });

    groups.forEach((group) => {
        const baseArea = getSignedArea(group[0]);
        const type = group[0].sourceId.toString().replace('Symbol(', '').replace(')', '');

        group.forEach((c, i) => {
            if (i === 0) {
                c.isHole = false;
            } else {
                const currentArea = getSignedArea(c);
                c.isHole = (Math.sign(baseArea) !== Math.sign(currentArea));
            }
            console.log(`Hole (${type}) [${i}] = ${c.isHole}`);
        });
    });
    return contours;
}

// controlWinding Proto
function getSignedAreaAlt(contours){
    //paper.setup(new paper.Size(1000, 1000));
    /*
    // 3. Создаем путь в Paper.js
    const item = new paper.CompoundPath( ? );
    
    item.children.forEach(contour => {
        console.log("Is Clockwise?", contour.clockwise);
        
        if (contour.clockwise) {
            contour.reverse(); 
        }
    });
    */

    return contours;
}

// Only Print Abot CW
function normalizeContours(contours){
    paper.setup(new paper.Size(1000, 1000));

    contours.forEach((contour, i) => {
        // 1. Создаем путь в Paper.js напрямую из твоих точек
        const paperPath = new paper.Path();
        
        contour.forEach((pt, idx) => {
            if (idx === 0) {
                paperPath.moveTo(new paper.Point(pt.anchor.x, pt.anchor.y));
            } else {
                if (pt.type === 'C') {
                    paperPath.cubicCurveTo(
                        new paper.Point(pt.handle1.x, pt.handle1.y),
                        new paper.Point(pt.handle2.x, pt.handle2.y),
                        new paper.Point(pt.anchor.x, pt.anchor.y)
                    );
                } else if (pt.type === 'Q') {
                    paperPath.quadraticCurveTo(
                        new paper.Point(pt.handle1.x, pt.handle1.y),
                        new paper.Point(pt.anchor.x, pt.anchor.y)
                    );
                } else {
                    paperPath.lineTo(new paper.Point(pt.anchor.x, pt.anchor.y));
                }
            }
        });

        if (contour[contour.length - 1]?.closed) paperPath.closePath();

        const isCW = paperPath.clockwise;

        let reverse = false;
        if (!isCW) {
            //contours[i] = reverseContour(contour);
            //contour.isClockwise = paperPath.clockwise;
            reverse = true;
        }
        console.log(`CW BEFORE ${isCW} REVERSE: ${reverse} AFTER: ${reverse ?"CCW":"CW"}`);

        paperPath.remove(); // Чистим память
    });

    return contours;
}

// Convertion text > doc > elements > paths > cmds from parsePathData() > editableContours
function convertSvgToContours(svgString, targetWidth) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    const elements = doc.querySelectorAll('path, rect, circle, polygon, polyline, ellipse');
    const allContours = [];

    Array.from(elements).forEach(el => {
        let d = '';

        const tag = el.tagName.toLowerCase();
        const elementId = Symbol(tag); // будет выводить Symbol(path) или Symbol(rect) // уникальный id для элемента
        const transformStr = el.getAttribute('transform');
        const fillRule = getFillRule(el);


        if (tag === 'path') {
            d = el.getAttribute('d') || '';
        } 
        else if (tag === 'rect') {
            const x = +el.getAttribute('x') || 0;
            const y = +el.getAttribute('y') || 0;
            const w = +el.getAttribute('width') || 0;
            const h = +el.getAttribute('height') || 0;

            // Вместо генерации строки d, мы сразу трансформируем углы
            const p1 = applyTransform(x, y, transformStr);
            const p2 = applyTransform(x + w, y, transformStr);
            const p3 = applyTransform(x + w, y + h, transformStr);
            const p4 = applyTransform(x, y + h, transformStr);

            d = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} L${p4.x} ${p4.y} Z`;
        } 
        else if (tag === 'circle' || tag === 'ellipse') {
            const cx = +el.getAttribute('cx') || 0;
            const cy = +el.getAttribute('cy') || 0;
            const rx = tag === 'circle'
                ? (+el.getAttribute('r') || 0)
                : (+el.getAttribute('rx') || 0);
            const ry = tag === 'circle'
                ? (+el.getAttribute('r') || 0)
                : (+el.getAttribute('ry') || 0);

            d = ellipseToPath(cx, cy, rx, ry, transformStr);
        }
        else if (tag === 'polygon' || tag === 'polyline') {
            const points = (el.getAttribute('points') || '').trim();
            if (points) {
                const coords = points.split(/[\s,]+/).map(Number);
                if (coords.length >= 2) {
                    d = `M${coords[0]} ${coords[1]}`;
                    for (let i = 2; i < coords.length; i += 2) {
                        d += ` L${coords[i]} ${coords[i + 1]}`;
                    }
                    if (tag === 'polygon') d += ' Z';
                }
            }
        }

        const commands = parsePathData(d, true);
        const contours = buildEditableContours(commands);

        const isSinglePath = tag === 'path';
        const isEvenOdd = fillRule === 'evenodd';

        const ignoreReverseCheckrule = isEvenOdd || (isSinglePath && contours.length > 1);
        // не трогаем c флагами isEvenOdd и обычные compound paths (обычное наслоение элементов)
        
        

        if (!ignoreReverseCheckrule){ // нормализуем 
            contours.forEach((contour, i) => {
                const area = getSignedArea(contour);
                if (area > 0) {
                    contours[i] = reverseContour(contour);
                }
            });
        } 
        
        contours.forEach(c => {
            c.sourceId = elementId;
        });

        allContours.push(...contours); 

    });

    if (allContours.length === 0) return [];


    // Нормализуем направление каждого контура через Paper.js


    // потом один раз:
    detectRolesByArea(allContours);
    //getSignedAreaAlt(allContours);
    //normalizeContours(allContours); // Only Console 

    // 2. Считаем BBox всей группы
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    allContours.forEach(contour => {
        contour.forEach(pt => {
            const points = [pt.anchor, pt.handle1, pt.handle2].filter(p => p);
            points.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
        });
    });

    const currentWidth = maxX - minX;
    const scale = targetWidth / currentWidth;

    allContours.forEach(contour => {
        contour.forEach(pt => {
            const points = [pt.anchor, pt.handle1, pt.handle2].filter(p => p);
            points.forEach(p => {
                p.x = (p.x - minX) * scale;
                p.y = (p.y - minY) * scale; 
            });
        });
    });

    return allContours;
}

// Base CopyPaste Paths from Adobe Illustrator Logic
window.addEventListener('paste', (e) => {
    if (!bezierMode) return;

    if(variableFont){
        specialAlpha = 1;
        isMouseDown = true; // Фиксируем нажатие
        renderEditorCanvas();
        e.preventDefault();
        return;
    }

    //if (generatedFont) return;

    // Получаем данные из буфера
    const text = (e.clipboardData || window.clipboardData).getData('text');

    if (text.includes('<svg')) {

        const oldWidth = getContoursWidth(currentContours);
        const targetWidth = oldWidth > 0 ? oldWidth : 500;

        currentContours = convertSvgToContours(text, targetWidth);
        //console.log("SVG из Illustrator пойман через Ctrl+V!", targetWidth, currentContours);
        
        // Делаем потверждение для обновление плитки и редактора
        commitGlyphEdits();

        pasteMessageActive = false;

        if(!cTransformMode){ // Сразу задаём режима перемещения элементов
            callSwitchBezierMode(true);
        }

        // Render
        renderEditorCanvas();  
        if (!sampleCanvasBlock.hidden) { 
            renderSampleCanvas();
        }
        // Опционально: предотвращаем вставку текста в другие поля, если они в фокусе
        e.preventDefault(); 
    }
});


// Отрисовка глифа в Canvas

function redrawActiveGlyphInCanvas(erender = true) { // Под Editor Canvas
    //console.log("redrawActiveGlyphInCanvas", currentGlyphIndex);      
    //let glyph = font.glyphs.get(currentGlyphIndex);

    let glyph;

    if(currentDataArray && currentItemIndex !== null){
        
        //console.log("ARRAY:", currentDataArray === compArray ? "COMP" : "GLYF");
        currentItem = currentDataArray[currentItemIndex];
        currentGlyph = currentItem?.glyph;
    }else{
        console.log("ARRAY:", currentDataArray ? "TRUE" : "FALSE");
        console.log("INDEX:", currentItemIndex );
        currentItem = null;
        currentGlyph = null;
    }

    if (!currentItem?.glyph){ 
        console.log("Глиф не определен", currentItem?.glyph);
        return renderEditorCanvas();  

        if (!tempItem?.glyph){
            console.log("Temp пустой");
            return
        }else{
           console.log("Temp пустой, Fallback on Temp?");
           //glyph = tempItem.glyph;
           return
        }
    }else{
        glyph = currentItem.glyph;
    }    

    const targetFont = currentItem?.font;

    if(targetFont && targetFont.variation){
        const transformed = font.variation.getTransform(glyph, currentSettings);
        if (transformed ) {
            glyph = transformed;
            
            //console.log("применили трансформацию");
        }
    }

    currentGlyph = glyph; // для рисовки в canvas

    if(currentProcedureGlyph){
        updateProcedureGlyph();
        currentProcedureGlyph.build();
        console.log("redrawActivePROCInCanvas 0")
    }else{
        if(generatedFont){
            createProcedureGlypth();

            if(currentProcedureGlyph){
                currentProcedureGlyph.build();
            } 
            console.log("redrawActivePROCInCanvas 1")
        }
    }

    if (!editorBlock.hidden) { 

        if(editMode){
            console.log("Draw from Bezier Mode", currentItem);
            const glyphCommands = glyph?.path?.commands ?? []; // currentGlyph
            currentContours = buildEditableContours(glyphCommands);
        }

        if(erender) renderEditorCanvas();  
    }

    if (!sampleCanvasBlock.hidden) { 
        renderSampleCanvas();
    }
}

function drawZoomStats(zoom) {
    if (!zoom) return;
    
    if (zoom>1.0) {
        ctx.save();
         
        const cx = canvas.width - 50;    
        ctx.textAlign = "right"; 
     
        ctx.font = "24px sans-serif";
        ctx.fillStyle = "#666";
        ctx.fillText("ZOOM", cx, 100);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText(`x${zoom.toFixed(1)}`, cx, 140);
        
        ctx.restore();
    }
}

function updateAlphas() {
    let changed = false;
    const step = 0.02; // Скорость затухания
    const stepb = 0.01; // Скорость затухания

    // 1. Special Message (затухает после отпускания мыши)
    if (!isMouseDown && specialAlpha > 0) {
        specialAlpha -= step;
        if (specialAlpha < 0) specialAlpha = 0;
        changed = true;
    }

    // 2. Paste Message (зависит от внешнего флага pasteMessageActive)
    const targetPaste = pasteMessageActive ? 1 : 0;
    if (Math.abs(pasteAlpha - targetPaste) > 0.01) {
        // Двигаем к цели (плавно или линейно)
        pasteAlpha += (targetPaste > pasteAlpha) ? stepb : -stepb;
        changed = true;
    } else {
        pasteAlpha = targetPaste;
    }

    // Если что-то изменилось, запрашиваем новый кадр отрисовки
    if (changed) {
        if (fadeRequest) cancelAnimationFrame(fadeRequest);
        fadeRequest = requestAnimationFrame(renderEditorCanvas);
    } else {
        fadeRequest = null;
    }
}

function drawMultiLineText(ctx, textArray, x, y, lineHeight = 30) {
    textArray.forEach((line, index) => {
        ctx.fillText(line, x, y + (index * lineHeight));
    });
}

function drawSpecialMessage() {
    if (specialAlpha <= 0) return;
    if (variableFont && (editMode || displayGuide) ) { //
        ctx.save();
        // Применяем текущую прозрачность к фону и тексту
        ctx.globalAlpha = specialAlpha;

        const colorBG = "rgba(15, 15, 15, 0.7)"; 
        ctx.fillStyle = colorBG;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#fff"; // Сделаем чуть ярче, так как есть прозрачность
        ctx.font = "bold 28px sans-serif";
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        
        ctx.textAlign = "center"; 
        ctx.textBaseline = "middle"; 
        ctx.fillText("PRESERVE VARIABLE FONT", cx, cy - 24);
        ctx.fillText("BEFORE EDIT", cx, cy + 24);
        
        ctx.restore();
    }
}

function drawPasteMessage() {
    if (pasteAlpha <= 0 || !bezierMode) return; // Уходим, если прозрачность 0
    ctx.save();
    ctx.globalAlpha = pasteAlpha; // Используем свою прозрачность
    
    const cx = canvas.width - 50;
    const linesb = [
        "You can copy", "a shape [ctrl+c]", "from Adobe Illustrator",
        "and paste it [ctrl+v]", "right here &_*", "", "it's svg..."
    ];

    ctx.textAlign = "right"; 
    ctx.font = "23px sans-serif";
    ctx.fillStyle = "#777";
    drawMultiLineText(ctx, linesb, cx, 460, 32);
    ctx.restore();
}

function drawGuidelinesOld(params) {
    if (!displayGuide) return;
    
    ctx.save();
    
    const { x, baseline, width, scale } = params;

    const ascY = font.ascender ? baseline - font.ascender * scale : null;
    const capY = (font.tables.os2 && font.tables.os2.sCapHeight) 
                 ? baseline - font.tables.os2.sCapHeight * scale : null;

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
        //console.log("Without LineGap")
    }

    // --- Вертикальные ---
    drawLineWithLabel(x , "LSB TRUE", "#777", null, true); 
    drawLineWithLabel(x + width, "RSB", "#777", null, true);

    ctx.restore();

}

let guidelines = []; // Глобальный массив или часть стейта
let draggedGuide = null;


function drawLineWithLabel(pos, isVertical = false, label = "", color = "666", dash = false, labelAlt = "") {
    if (isNaN(pos) || pos === null) return;

    ctx.save();
    ctx.font = "12px sans-serif"; 
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    if(dash){
        ctx.setLineDash([5, 5]); // Пунктир
    }

    ctx.beginPath();
    if (isVertical) {
        // Вертикальная линия (LSB/RSB)
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
    } else {
        // Горизонтальная линия (Baseline/Ascender)
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
    }
    ctx.stroke();

    // Отрисовка текста
    ctx.setLineDash([]); // Убираем пунктир для текста

    if (isVertical) {
        ctx.textAlign = "left";
        ctx.fillText(label, pos + 5, 15);
        if (labelAlt) {
            
            ctx.textAlign = "right";
            ctx.fillText(labelAlt, pos - 5, canvas.height - 10);
        }
    } else {
        ctx.textAlign = "left";
        ctx.fillText(label, 10, pos - 4);

        if (labelAlt) {
            console.log("Orange Accept");
            ctx.textAlign = "right";
            ctx.fillText(labelAlt, canvas.width - 10, pos - 4);
        }
    }
    
    ctx.restore();
}

let fontOverrides = {
    ascender: 0,
    descender: 0,
    sCapHeight: 0,
    sxHeight: 0,
    rsbDelta: 0 // для изменения ширины (RSB)
};


function updateParamsFromCanvas(label, value) {
    if (generatedFont){

        const clampValue = clamp(value, 0, 1000);
        const resultValue = Math.ceil(clampValue)
        
        // Обновляем параметры генератора (GFONT_PARAMS)
        if (label === "RSB"){
            if (typeof manualUpdateControlValue === "function") {
                manualUpdateControlValue("aw", resultValue, true); // без рендера
            }
        } 

        if (label === "Ascender") GFONT_PARAMS.as = resultValue;
        if (label === "CapHeight") GFONT_PARAMS.ch = resultValue;
        if (label === "X-Height") GFONT_PARAMS.xh = resultValue;
        if (label === "Descender") GFONT_PARAMS.ds = resultValue;        
    }

    

    // Также обновляем текущий объект font (для отрисовщика)
    /*
    if (label === "Ascender") font.ascender = value;
    if (label === "Descender") font.descender = value;
    if (label === "CapHeight" && font.tables?.os2) font.tables.os2.sCapHeight = value;
    if (label === "X-Height" && font.tables?.os2) font.tables.os2.sxHeight = value;
    */
    // Перерисовываем содержимое

}

function updateGuidelines(params) {
    if (!displayGuide) return;
    
    let targetFont;
    
    const compflag = currentItem?.componentFlag;

    /*
    if( currentItem && compflag ){ //arrayViewer.comp){
        targetFont = component_font; //buffer
    }
    else if ( currentItem && !compflag ){ //arrayViewer.glyf){
        targetFont = font; // general
    }
    */

    if( arrayViewer.comp){
        targetFont = component_font; //buffer
    }
    else if ( arrayViewer.glyf){
        targetFont = font; // general
    }

    if(!targetFont) return


    const { x, baseline, width, scale } = params;
    guidelines = []; // Очищаем перед обновлением

    // pos, vert, label, color, dash, labelAlt
    const addGuide = (pos, vert = false, drag = false, label, color, dash = false, labelAlt) => {
        if (pos === null || isNaN(pos)) return;
        guidelines.push({ pos, vert, drag, 
            label, color, dash,labelAlt, 
            cursor: vert ? "col-resize" : "row-resize"
        });
    };
    
    // Baseline   
    addGuide(baseline, false, false, "Baseline (Lock)", "#777", true, null); //Lock!

    // Вертикальные

    addGuide(x, true, false, "LSB", "#777", true, null); //Lock!

    //addGuide(x + width, true, true, "RSB", "#5e5ead", true, null); // (source)

    const curWidth = (fontOverrides.rsbDelta) ? fontOverrides.rsbDelta * scale : width;

    const rsbPos = (fontOverrides.rsbDelta !== 0) 
        ? fontOverrides.rsbDelta  // Это абсолютный mx из mousemove
        : x + width;             // А это значение из рецепта


    addGuide(rsbPos, true, true, "RSB", "#5e5ead", true, null); //x + curWidth

    //console.log("RSB REAL", curWidth);

    // Secondary

    //const ascY = targetFont.ascender ? baseline - targetFont.ascender * scale : null;
    //const capY = (targetFont.tables.os2?.sCapHeight) ? baseline - targetFont.tables.os2.sCapHeight * scale : null;

    // Tempory (Changeble)
    const aVal = fontOverrides.ascender || targetFont.ascender || 0;
    const cVal = fontOverrides.sCapHeight || targetFont.tables.os2?.sCapHeight || 0;
    const xVal = fontOverrides.sxHeight || targetFont.tables.os2?.sxHeight || 0;
    const dVal = fontOverrides.descender || targetFont.descender || 0;

    // Переводим их в координаты экрана (pos)
    const ascY = baseline - aVal * scale;
    const capY = cVal ? baseline - cVal * scale : null;
    const xHeightY = xVal ? baseline - xVal * scale : null;
    const descY = baseline - dVal * scale;

    const isSameHeight = ascY !== null && capY !== null && Math.abs(ascY - capY) < 1;

    if (isSameHeight) {  // combine
        addGuide(ascY, false, true, "Ascender", "#ffaa44", false, "CapHeight");
    } else {
        addGuide(ascY, false, true, "Ascender", "#ff4444", false, null);
        addGuide(capY, false, true, "CapHeight", "#44aa44", false, null);
    }

    if (xHeightY) {
        addGuide(xHeightY, false, true, "X-Height", "#aa6600", false, null);
    }
    
    if (descY) {
        addGuide(descY, false, true, "Descender", "#ff4444", false, null);
    } 

    //applyFontMetricsFromCanvas(params, scale);
}

function applyFontMetricsFromCanvas(scaleFactor) {

    /*
    if (fontOverrides.ascender) font.ascender = fontOverrides.ascender;
    if (fontOverrides.descender) font.descender = fontOverrides.descender;
    if (font.tables?.os2) {
        if (fontOverrides.sCapHeight) font.tables.os2.sCapHeight = fontOverrides.sCapHeight;
        if (fontOverrides.sxHeight) font.tables.os2.sxHeight = fontOverrides.sxHeight;
    }
    
    // Сбрасываем черновик
    
    */
    console.log("Метрики шрифта обновлены!");
}

function drawGuidelines() {
    if (!displayGuide) return;
    //pos, vert, label, color, dash, labelAlt
    guidelines.forEach(g => drawLineWithLabel(g.pos, g.vert, g.label, g.color, g.dash, g.labelAlt));
}



function drawBackground(params) {
    const bg = getCurrentEditorBg();
    if (!bg || !bg.img) return;

    const { x, baseline, yCenter, width, scale } = params;

    ctx.save();
    ctx.globalAlpha = bg.opacity;

    // 1. Переходим в центра canvas ( со смещением)
    ctx.translate(x + width / 2, yCenter);
    
    // 2. Переворачиваем систему (Y теперь идет ВВЕРХ)
    // Весь шрифт теперь рисуется правильно, но обычные картинки — вверх ногами
    ctx.scale(scale, -scale); 

    // 3. Применяем локальные смещения (в единицах шрифта)
    ctx.translate(bg.x, bg.y);
    ctx.scale(bg.scale, bg.scale);

    // 4. ИНВЕРСИЯ КАРТИНКИ: 
    ctx.scale(1, -1); 
    ctx.drawImage(bg.img, 0, -bg.img.height); 
    
    ctx.restore();
}

let currentPos = 0;
let targetPos = 0;
let animatingLabel = ""; 

function startSnapping() {
    const diff = targetPos - currentPos;

    if (Math.abs(diff) > 0.1) {
        currentPos += diff * 0.2; // Скорость доезжания
        
        // Записываем в юнитах! updateGuidelines сам умножит на scale
        if (animatingLabel === "RSB") {
            fontOverrides.rsbDelta = currentPos;
        } else if (animatingLabel === "Ascender") {
            fontOverrides.ascender = currentPos;
        }

        renderEditorCanvas(); 
        requestAnimationFrame(startSnapping); 
    } else {
        // Финал
        fontOverrides = { ascender: 0, descender: 0, sCapHeight: 0, sxHeight: 0, rsbDelta: 0 };
        renderEditorCanvas();
    }
}

function messageOnCanvas(ctx, text) {
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;

    ctx.fillStyle="#666";
    ctx.font = "bold 24px sans-serif";

    ctx.textAlign = "center"; 
    ctx.textBaseline = "middle"; 
    
    ctx.fillText(text, cx, cy);
}

function renderEditorCanvas() {
    updateAlphas(); 

    const params = getEditorTransformParams();
    const { renderSize, x, baseline, yCenter, width, scale, zoom } = params;

    updateGuidelines(params);

    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //console.log("renderEditorCanvas");

    //      renderSize, x, baseline,  width, scale // x и width могут быть нулями
    //const { renderSize, x, baseline,  width, scale, zoom } = getEditorTransformParams();

    drawBackground(params);

    if(!currentGlyph){
        messageOnCanvas(ctx, "Not Selected Object");
        return
    }

    drawGuidelines();
    drawPasteMessage();


    //console.log("MyPrint","renderSize, x, baseline, width, scale");
    //console.log("MyPrint", renderSize, x, baseline, width, scale);
    //drawLineWithLabel(x+width/2, "СС", "#333", null, true); // нарисует линию в центре

    ctx.translate(x, baseline)
    ctx.scale(scale, -scale); // revese GlyphLogic

    if (pEditMode && currentProcedureGlyph) {
      currentProcedureGlyph.drawCanvas(ctx, "editor");
      ctx.restore();

      // ZOOM VARIABLE
      drawZoomStats(zoom);

      return;
    }


    if(editMode && currentContours){
        ctx.lineWidth = 1 / scale
        ctx.strokeStyle = "#aaa"
        ctx.fillStyle = "rgba(180,180,180,0.1)"

        if (cTransformMode) { // NO HANDLES (FILL + STROKE) - NEED FOR TRANSFORM ALL PATH ON CANVAS
            ctx.beginPath()

            currentContours.forEach(contour=>{
                const p0 = contour[0].anchor
                ctx.moveTo(p0.x, p0.y)

                for (let i=1; i<contour.length; i++) {
                    const pt = contour[i]

                    if (pt.type === 'L' || !pt.type)
                        ctx.lineTo(pt.anchor.x, pt.anchor.y)
                    else if (pt.type === 'Q')
                        ctx.quadraticCurveTo(pt.handle1.x, pt.handle1.y, pt.anchor.x, pt.anchor.y)
                    else if (pt.type === 'C')
                        ctx.bezierCurveTo(pt.handle1.x, pt.handle1.y, pt.handle2.x, pt.handle2.y, pt.anchor.x, pt.anchor.y)
                }

                if (contour[contour.length - 1]?.closed) ctx.closePath()

            })
            ctx.lineWidth = 2 / scale
            ctx.fillStyle = "rgba(180,180,180,0.1)";
            ctx.fill(); // Это лечит case
            //ctx.fill("evenodd");   // ВАЖНО
            ctx.stroke()

        }else{ // WITH HANDLES (NO FILL MODE) - NEED FOR TRANSFORM SELECTED PTS
            currentContours.forEach(contour=>{
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

            currentContours.forEach((contour, ci) => {
                contour.forEach((pt, pi) => {
                    const ax = pt.anchor.x, ay = pt.anchor.y;

                    // Проверка выделения текущей точки
                    const isSelected = selectedPoints.some(sp => sp.ci === ci && sp.pi === pi);
                    
                    // Проверка выделения ПРЕДЫДУЩЕЙ точки (нужна для Handle1)
                    const isPrevSelected = pi > 0 && selectedPoints.some(sp => sp.ci === ci && sp.pi === pi - 1);

                    // Рисуем Anchor (якорь)
                    const fillColor = isSelected ? "#00ff00" : "#fff";
                    const strokeColor = isSelected ? "#006600" : "#000";
                    drawCircle(ax, ay, 5 / scale, fillColor, strokeColor);

                    // --- РЫЧАГ 1 (Handle1) ---
                    // Рисуем, если выделена ТЕКУЩАЯ точка (которой он принадлежит) 
                    // ИЛИ ПРЕДЫДУЩАЯ (из которой он визуально выходит)
                    if (pt.handle1 && pi > 0 && (isSelected || isPrevSelected)) {
                        const prevPt = contour[pi - 1];
                        ctx.beginPath();
                        ctx.moveTo(prevPt.anchor.x, prevPt.anchor.y);
                        ctx.lineTo(pt.handle1.x, pt.handle1.y);
                        ctx.strokeStyle = "#666";
                        ctx.stroke();
                        drawCircle(pt.handle1.x, pt.handle1.y, 4 / scale, "#f88", "#600");
                    }

                    // --- РЫЧАГ 2 (Handle2) ---
                    // Рисуем, если выделена ТЕКУЩАЯ точка (из которой он выходит)
                    if (pt.handle2 && isSelected) {
                        ctx.beginPath();
                        ctx.moveTo(ax, ay);
                        ctx.lineTo(pt.handle2.x, pt.handle2.y);
                        ctx.strokeStyle = "#666";
                        ctx.stroke();
                        drawCircle(pt.handle2.x, pt.handle2.y, 4 / scale, "#ff0", "#660");
                    }
                })
            })

        }

    }else{
        currentGlyph.path.draw(ctx);

        ctx.fillStyle = "grey";
        ctx.fill();
    }

    ctx.restore();


    // ТЕПЕРЬ рисуем рамку (когда 1 единица = 1 пиксель)
    if (isSelecting && activeCanvas === 'editor') {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 1;
        ctx.strokeRect(
            selBox.x1, 
            selBox.y1, 
            selBox.x2 - selBox.x1, 
            selBox.y2 - selBox.y1
        );
        ctx.setLineDash([]);
    }

    // ZOOM VARIABLE
    drawZoomStats(zoom);

    // Special Message for Variable
    drawSpecialMessage();


    ctx.restore(); // Закрываем самый первый save()

}

function renderSampleCanvas() {
    ctxSample.clearRect(0, 0, canvasSample.width, canvasSample.height);

    //console.log("renderSampleCanvas");

    // 1. Фон
    if (sampleBackgroundImage.img) {
        ctxSample.save();
        ctxSample.globalAlpha = sampleBackgroundImage.opacity !== undefined ? sampleBackgroundImage.opacity : 0.30;
        ctxSample.translate(sampleBackgroundImage.x, sampleBackgroundImage.y);
        ctxSample.scale(sampleBackgroundImage.scale, sampleBackgroundImage.scale);
        ctxSample.drawImage(sampleBackgroundImage.img, 0, 0);
        ctxSample.restore();
    }

    // 2. Глифы
    canvasObjects.forEach(obj => {
        
        //const font = obj.item.font;

        //let glyph = font.glyphs.get(obj.item.index);
        const selectItem = obj.item;
        let glyph = selectItem.glyph;

        //console.log(glyph);

        const params = getGlyphSVGParams(selectItem);
        
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

        if (isSelected && !sBackgroundSelected) {
            const bbox = glyph.getBoundingBox();
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

    if (isSelecting && activeCanvas === 'sample') {
        ctxSample.setLineDash([5, 5]); // Делаем рамку пунктирной
        ctxSample.strokeStyle = "#00ff00";
        ctxSample.lineWidth = 1;
        ctxSample.strokeRect(
            selBox.x1, 
            selBox.y1, 
            selBox.x2 - selBox.x1, 
            selBox.y2 - selBox.y1
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
        ctxSample.fillText("DRAG GLYPH FROM BELOW TO HERE", cx, cy - 20);
        ctxSample.fillText("AND U CAN DROP IMAGE REFERENCE", cx, cy + 30);
    }

    if (dragOverCanvas) {
        const dragColorOnCanvas = "rgba(200, 200, 200, 0.5)";
        ctxSample.fillStyle = dragColorOnCanvas;
        ctxSample.fillRect(0, 0, canvasSample.width, canvasSample.height);       
    }
}



// Сохранение изменённого глифа
function applyWindingFromRoles(contours) {
    return contours.map(contour => {

        if (contour.isHole) {
            // hole → CCW (area < 0)
            if (area > 0) {
                return reverseContour(contour);
            }
        } else {
            // outer → CW (area > 0)
            if (area < 0) {
                return reverseContour(contour);
            }
        }

        return contour;
    });
}


function forceClockwise(contours) {
    return contours.map(c => {
        const area = getSignedArea(c);
        if (area > 0) return reverseContour(c); // изменен знак, так как перевернуты
        return c;
    });
}



function checkCurrentItem(){ // может собрать быструю проверку?
    let item = null;
    return
}

function commitGlyphEdits(){
    if(!currentItem) return

    const glyph = currentItem?.glyph;
    if(!glyph) return

    let newPath;

    if(currentProcedureGlyph && pEditMode){
        const data = currentProcedureGlyph.exportData(); 
        newPath = data.path;

        glyph.advanceWidth = data.advanceWidth;
    }

    if(currentContours?.length>0 && !pEditMode){

        if (font.variation) {
            console.log("Шрифт вариативный - не применяем трансформацию")
            return
        }
        // правильная preview svg плитка и рендеринг в Canvas
        // проверяй дырки на пересечениях в windows
        // const pp = forceClockwise(currentContours);
        
        newPath = buildPathFromContours(currentContours); 

        console.log("CommitChange: Contour");
    }else{
        //console.log("Not CommitChange");
    }
    
    if (!newPath) return;

    glyph.path = newPath;

    // Обновляем плитку в cmap
    updateCurrentTile();
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

// Добавляем аргумент (e) и предотвращаем дефолт!

canvasSample.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverCanvas = false;
    renderSampleCanvas();
});

let tempScale = 0.1;
canvasSample.addEventListener("drop", (e) => { // Ужасная логика переписать
    e.preventDefault();
    e.stopPropagation();
    
    dragOverCanvas = false;
    document.body.classList.remove("drag");

    // 1. ПРОВЕРКА: Это плитка (arrayIndex)?
    const arrayIndex = e.dataTransfer.getData("arrayIndex");

    //console.log("флаг", componentFlag);
    
    if (arrayIndex !== "") {
        
        //console.log("Ищем индекс:", arrayIndex);
        //console.log("Доступен ли массив glyphArray?", typeof glyphArray !== 'undefined');

        const { x: mx, y: my } = getMousePosition(canvasSample, e);

        // Безопасный поиск
        const numericIndex = parseInt(arrayIndex);
        const originalItem = currentDataArray[numericIndex];
        //const originalItem = glyphArray.find(it => it.index === numericIndex);

        //console.log("MyFlagTest", originalItem.componentFlag);

        if(currentDataArray && originalItem){
            console.log("DRAGGED:", currentDataArray === compArray ? "component" : "glyph", numericIndex);
        }else{
            return
        }    

        //console.log("ВАУ 1 - Индекс распознан");

        if (originalItem) {
            canvasObjects.push({
                item: originalItem,
                array: currentDataArray,
                aindex: arrayIndex,
                x: mx, y: my,
                scale: tempScale 
            });
            //console.log("ВАУ 2 - Объект добавлен в список:", canvasObjects);
            messageSampleCanvas = false;
            renderSampleCanvas(); 
        } else {

            console.warn(`Элемент с индексом ${arrayIndex},${numericIndex} не найден в currentArray!`);
            //console.log(currentDataArray);
        }
        return 
    
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageFile(files[0], (img) => { sampleBackgroundImage = img; });
    }
});

// Слушатели
function saveHistoryState() {
    if (!currentGlyph || !currentContours) return;

    // Глубокое копирование текущих контуров
    const snapshot = {
        glyphIndex: currentGlyphIndex,
        contours: JSON.parse(JSON.stringify(currentContours))
    };

    history.undoStack.push(snapshot);
    if (history.undoStack.length > history.maxDepth) history.undoStack.shift();
    
    // При новом действии очищаем стек Redo
    history.redoStack = [];
}

// Универсальный "движок" выбора
function getItemsInBox(items, box, coordFn) {
    const l = Math.min(box.x1, box.x2), r = Math.max(box.x1, box.x2);
    const t = Math.min(box.y1, box.y2), b = Math.max(box.y1, box.y2);

    return items.filter(item => {
        const bounds = coordFn(item);
        
        // Если это область (есть left/right)
        if (bounds.left !== undefined) {
            // Проверка: пересекаются ли два прямоугольника?
            return !(bounds.left > r || 
                     bounds.right < l || 
                     bounds.top > b || 
                     bounds.bottom < t);
        }
        
        // Если это просто точка (для EditorCanvas)
        return bounds.x >= l && bounds.x <= r && bounds.y >= t && bounds.y <= b;
    });
}

function hitTestControls(mouseX, mouseY){
    const { scale, x, baseline } = getEditorTransformParams()
    const translateX = x
    const translateY = baseline

    if(currentContours==null){
        return null
    }

    for(let ci=0; ci<currentContours.length; ci++){
        const contour = currentContours[ci]
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

function getObjectAt(mx, my) {
    // Идем с конца массива (верхние слои приоритетнее)
    for (let i = canvasObjects.length - 1; i >= 0; i--) {
        const obj = canvasObjects[i];
        const bbox = obj.item.glyph.getBoundingBox();

        const left = obj.x + (bbox.x1 * obj.scale);
        const right = obj.x + (bbox.x2 * obj.scale);
        
        // По Y учитываем инверсию
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

function setSelectionBox(ex,ey){
    // начало выделения
    selBox.x1 = selBox.x2 = ex;
    selBox.y1 = selBox.y2 = ey;
}

function endSelectionBox(ex,ey){
    // конец выделения
    selBox.x2 = eX;
    selBox.y2 = eY;
}

canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const { x: mx, y: my } = getMousePosition(canvas, e);
    
    const bg = getCurrentEditorBg();
    const params = getEditorTransformParams();

    if (eBackgroundSelected && bg) {
        const screenDx = mx - (params.x + params.width / 2);
        const screenDy = params.yCenter - my; // Инверсия Y для шрифтовой системы
        const localMx = screenDx / params.scale;
        const localMy = screenDy / params.scale;
        bg.x = localMx + (bg.x - localMx) * delta;
        bg.y = localMy + (bg.y - localMy) * delta;
        bg.scale *= delta;
    }else{
        zoom *= delta;
        zoom = Math.max(1.0, Math.min(zoom, 10));
    }

    renderEditorCanvas();
}, { passive: false });


let startFontX = 0;
let startFontY = 0;
let currentFontX = 0;
let currentFontY = 0;
let initialValue = 0;

canvas.addEventListener("mousedown", e => {
    activeCanvas = 'editor';

    if (e.button === 1) { // middleMouseBut
        isPanning = true;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        
        editorCanvas.style.cursor = "grabbing";

        e.preventDefault();
        return; // Прерываем, чтобы не сработало выделение точек
    }

    if(variableFont){
        specialAlpha = 1;
        isMouseDown = true; // Фиксируем нажатие
        renderEditorCanvas();
        e.preventDefault();
        return;
    }



    saveHistoryState();
    
    let ProchitFound = false;
    const padding = 5; // Чувствительность клика

    const { x: mx, y: my } = getMousePosition(canvas, e);
    const { x: tx, baseline, yCenter, scale } = getEditorTransformParams();
    // ПЕРЕВОДИМ координаты мыши в пространство шрифта (fx, fy)
    const fx = (mx - tx) / scale;
    const fy = (baseline - my) / scale;

    dragTarget = hitTestControls(mx, my); // поиск editPoint в месте клика


    const bg = getCurrentEditorBg();
    if (eBackgroundSelected && bg) {
        isDragging = true;
        startMouseX = (mx / scale) - bg.x;
        startMouseY = (yCenter - my) / scale - bg.y; 
        editorCanvas.style.cursor = "grabbing";
        renderEditorCanvas();
        return
    }
    
    if (pEditMode && currentProcedureGlyph) { // Procedure Point Edit
        console.log("КЛИК КИЛК");
        
        currentProcedureGlyph.elements.forEach(el => {
            if (el instanceof stemLine) {
                if (el.checkHit(fx, fy)) {
                    ProchitFound = true;
                }
            }
        });

        if (!ProchitFound) {
            currentProcedureGlyph.elements.forEach(el => { 
                if (el.selectedIndex !== undefined) el.selectedIndex = null; 
            });
        }
    }
    
    const isSomethingUnderMouse = dragTarget || ProchitFound;
    const guideCheck = !isSomethingUnderMouse && displayGuide;

    // guideLogic
    const hitGuide = guideCheck ? guidelines.find(g => {
        // 1. Проверяем попадание в область (padding)
        const isUnderCursor = g.vert 
            ? Math.abs(mx - g.pos) < padding 
            : Math.abs(my - g.pos) < padding;

        return isUnderCursor && g.drag; 
    }) : null;

    if (hitGuide) {        
        startFontX = fx; startFontY = fy;
        if (hitGuide.label === "RSB"){
            initialValue = GFONT_PARAMS.aw;
            console.log("БЫЛО",initialValue)
        } 

        draggedGuide = hitGuide;

    }

    if (!pEditMode){
        if(dragTarget && !cTransformMode) { // Point Edit

            // 2. Логика выделения
            const isAlreadySelected = selectedPoints.some(sp => sp.ci === dragTarget.contourIdx && sp.pi === dragTarget.pointIdx);

            if (!e.shiftKey && !isAlreadySelected) {
                selectedPoints = [{ ci: dragTarget.contourIdx, pi: dragTarget.pointIdx }];
            } else if (e.shiftKey && !isAlreadySelected) {
                selectedPoints.push({ ci: dragTarget.contourIdx, pi: dragTarget.pointIdx });
            }

            // 3. Запоминаем смещения для всей группы
            // Мы сохраняем разницу между курсором и координатами каждой точки
            dragOffsets = selectedPoints.map(sp => {
                const pt = currentContours[sp.ci][sp.pi];
                return {
                    dx: fx - pt.anchor.x,
                    dy: fy - pt.anchor.y
                };
            });

        } else {
            isSelecting = true;
            setSelectionBox(mx,my);
            if (!e.shiftKey) selectedPoints = [];
        }
    }

    // Установка курсора (приоритеты)
    if (ProchitFound) {
        editorCanvas.style.cursor = "default";
    } 

    renderEditorCanvas();

});


canvas.addEventListener("mousemove", e => {

    if (isPanning) {
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;

        panX += dx;
        panY += dy;

        startMouseX = e.clientX;
        startMouseY = e.clientY;

        renderEditorCanvas();
        return;
    }

    const padding = 6;

    const { x: mx, y: my } = getMousePosition(canvas, e);
    const { x, baseline, yCenter, scale} = getEditorTransformParams();
    // Текущие координаты мыши в пространстве шрифта
    const fx = (mx - x) / scale;
    const fy = (baseline - my) / scale;

    const pointUnderMouse = hitTestControls(mx, my);
    

    // background Logic
    const bg = getCurrentEditorBg();
    if (isDragging && bg && eBackgroundSelected) {
        bg.x = (mx / scale) - startMouseX;
        bg.y = (yCenter - my) / scale - startMouseY;
        renderEditorCanvas();
        return
    }

    // guideLogic
    if (draggedGuide) {

        let deltaUnits;
        if (draggedGuide.vert) { deltaUnits = fx;
        } else { deltaUnits = fy;
        }

        // 1. Текущая позиция мыши в юнитах
        currentFontX = fx;
        currentFontY = fy;

        // 2. Дельа для глобальных переменных
        const deltaX = currentFontX - startFontX;
        const deltaY = currentFontY - startFontY;

        // 2. Сразу пишем в оверрайды (чтобы линия перерисовалась под мышкой)
        if (draggedGuide.label === "RSB"){
            // Для вертикальных линий (RSB)
            
            // Задаём смещение глобальной переменной
            const newAw = initialValue + deltaX;
            updateParamsFromCanvas(draggedGuide.label, newAw);

            //const br = GFONT_PARAMS.br || 0;

            // выравниваем отображение Guide по мыши
            fontOverrides.rsbDelta = mx; 
        } 

        if (draggedGuide.label === "Ascender") fontOverrides.ascender = deltaUnits;
        if (draggedGuide.label === "CapHeight") fontOverrides.sCapHeight = deltaUnits;
        if (draggedGuide.label === "X-Height") fontOverrides.sxHeight = deltaUnits;
        if (draggedGuide.label === "Descender") fontOverrides.descender = deltaUnits;

        editorCanvas.style.cursor = draggedGuide.cursor;

        renderEditorCanvas(); 

        return;
    }

    // 2. guideLogic Hover
    let procPoint = false;
    if (pEditMode && currentProcedureGlyph) {
        currentProcedureGlyph.elements.forEach(el => {
            if (el instanceof stemLine && el.checkHit(fx, fy)) {
                procPoint = true;
            }
        });
    }

    //  Флаг для гайдов
    const isOverAnyPoint = pointUnderMouse || procPoint || dragTarget;
    const guideCheck = !isOverAnyPoint && displayGuide;

    const hoverGuide = guideCheck ? guidelines.find(g => {
        const isUnderCursor = g.vert 
            ? Math.abs(mx - g.pos) < padding 
            : Math.abs(my - g.pos) < padding;
        return isUnderCursor && g.drag; 
    }) : null;


    // selector Pts

    if (dragTarget && currentGlyph) {
        if (dragTarget.kind === "anchor") {
            selectedPoints.forEach((sp, i) => {
                const contour = currentContours[sp.ci];
                const pt = contour[sp.pi];
                const offset = dragOffsets[i];

                const newX = fx - offset.dx;
                const newY = fy - offset.dy;
                const deltaX = newX - pt.anchor.x;
                const deltaY = newY - pt.anchor.y;

                // 1. Двигаем саму точку (Anchor)
                pt.anchor.x = newX;
                pt.anchor.y = newY;

                // 2. Двигаем ИСХОДЯЩИЙ рычаг этой точки (Handle2)
                if (pt.handle2) {
                    pt.handle2.x += deltaX;
                    pt.handle2.y += deltaY;
                }

                // 3. Двигаем ВХОДЯЩИЙ рычаг СЛЕДУЮЩЕЙ точки (Handle1 следующего сегмента)
                // Если точка последняя и контур замкнут — берем первую точку
                let nextIdx = sp.pi + 1;
                if (nextIdx >= contour.length && pt.closed) nextIdx = 0;
                
                const nextPt = contour[nextIdx];
                if (nextPt && nextPt.handle1) {
                    nextPt.handle1.x += deltaX;
                    nextPt.handle1.y += deltaY;
                }
            });

        } else {
            // Если тянем за конкретный рычаг — меняем только его координаты
            const pt = currentContours[dragTarget.contourIdx][dragTarget.pointIdx];
            if (dragTarget.kind === "handle1") { pt.handle1.x = fx; pt.handle1.y = fy; }
            if (dragTarget.kind === "handle2") { pt.handle2.x = fx; pt.handle2.y = fy; }
        }

        commitGlyphEdits();

    } else if (isSelecting) {
        selBox.x2 = mx;
        selBox.y2 = my;
    }

    // 3. Установка курсора (приоритеты)

    // 1. ПАНОРАМИРОВАНИЕ (Самый высокий приоритет - холст в движении)
    if (isPanning) {
        editorCanvas.style.cursor = "grabbing";
    } 
    // 2. ДЕЙСТВИЕ (Выделение рамкой ИЛИ перетаскивание точки)
    else if (isSelecting || isOverAnyPoint) {
        editorCanvas.style.cursor = "default"; 
    } 
    // 3. ХОВЕР ГАЙДА (Только если мы ничего не делаем и под мышкой нет точек)
    else if (hoverGuide) {
        editorCanvas.style.cursor = hoverGuide.cursor;
    } 
    else {
        editorCanvas.style.cursor = "default";
    }

    if (isSelecting || dragTarget || draggedGuide) {
        renderEditorCanvas();
    }
});

canvasSample.addEventListener("mousedown", e => {
    activeCanvas = 'sample'; // Метка
    const { x: mx, y: my } = getMousePosition(canvasSample, e);

    const clicked = getObjectAt(mx, my);

    if (sBackgroundSelected) {
        isDragging = true;
        startMouseX = mx - sampleBackgroundImage.x;
        startMouseY = my - sampleBackgroundImage.y;

    } else if (clicked) {
        isDragging = true;
        if (!e.shiftKey && !selectedObjects.includes(clicked)) {
            selectedObjects = [clicked];

            const item = clicked.item;

            if(currentItemIndex !== null){
                currentItem = item;
                currentDataArray = item.array;
                currentItemIndex = item.aindex;
                currentGlyph = item.glyph;
                //console.log("Клик по item:", indexInArray);
                redrawActiveGlyphInCanvas();
                updateCodeEditor();

            }



        } else if (e.shiftKey && !selectedObjects.includes(clicked)) {
            selectedObjects.push(clicked);
        }
        // Запоминаем смещения для группы
        dragOffsets = selectedObjects.map(obj => ({ x: mx - obj.x, y: my - obj.y }));
    } else {
        
        // --- НАЧАЛО РАМКИ ---
        if (e.button === 1) { // middleMouseBut
            e.preventDefault();
            return; 
        }

        isSelecting = true;
        setSelectionBox(mx,my);
        if (!e.shiftKey) selectedObjects = []; // Снимаем старое выделение, если нет Shift
    }

    renderSampleCanvas();

    if(isDragging){
        editorCanvas.style.cursor = "grabbing";
    }

    e.preventDefault();
});




canvasSample.addEventListener('mousemove', (e) => {
    const { x: mx, y: my } = getMousePosition(canvasSample, e);

    if (isDragging) {
        if (sBackgroundSelected) {
            sampleBackgroundImage.x = mx - startMouseX;
            sampleBackgroundImage.y = my - startMouseY;
        } else if (selectedObjects.length > 0) {
            selectedObjects.forEach((obj, i) => {
                obj.x = mx - dragOffsets[i].x;
                obj.y = my - dragOffsets[i].y;
            });
        }
    } else if (isSelecting) {
        selBox.x2 = mx;
        selBox.y2 = my;
    }

    if(isDragging || isSelecting){
        renderSampleCanvas();
    }
    
});


function cleanTempVariables() {
    isDragging = false;
    isSelecting = false;
    dragTarget = null;
    dragOffsets = [];

    // Перерисовываем, чтобы стереть рамку выбора (selBox)
    if (typeof renderSampleCanvas === 'function') renderSampleCanvas();
    if (typeof renderEditorCanvas === 'function') renderEditorCanvas();

    activeCanvas = null;
}

canvas.addEventListener('mouseleave', () => {
    if (isDragging || isSelecting) {
        cleanTempVariables();
    }
});

canvasSample.addEventListener('mouseleave', () => {
    if (isDragging || isSelecting) {
        cleanTempVariables();
    }
});

// Дополнительная страховка: если окно браузера потеряло фокус (Alt+Tab)
window.addEventListener('blur', () => {
    if (isDragging || isSelecting) {
        cleanTempVariables();
    }
});

/*
window.addEventListener('mouseup', () => {
    dragTarget = null;

    if (isSelecting) {
        const left = Math.min(selBox.x1, selBox.x2);
        const right = Math.max(selBox.x1, selBox.x2);
        const top = Math.min(selBox.y1, selBox.y2);
        const bottom = Math.max(selBox.y1, selBox.y2);

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
*/


window.addEventListener("mouseup", e => {

    isMouseDown = false;
    const params = getEditorTransformParams();

    if (draggedGuide) {
        //console.log(`Линия ${draggedGuide.label} установлена на: ${draggedGuide.pos}`);
        
        if (draggedGuide.vert) {
            // Для вертикальных
            currentPos = fontOverrides.rsbDelta;
            targetPos = params.width + params.x; 
        } 

        animatingLabel = draggedGuide.label;
        
        startSnapping(); 
        
        draggedGuide = null;
        startFontX = 0; startFontY = 0; initialValue = 0;
    }

    if (e.button === 1) { // колёсико
        isPanning = false;
    }

    if (isSelecting) {

        if (activeCanvas === 'sample') {
            const found = getItemsInBox(canvasObjects, selBox, obj => {
                const bbox = obj.item.glyph.getBoundingBox();

                return {
                    left: obj.x + (bbox.x1 * obj.scale),
                    right: obj.x + (bbox.x2 * obj.scale),
                    top: obj.y + (-bbox.y2 * obj.scale),
                    bottom: obj.y + (-bbox.y1 * obj.scale)
                };
            });
            
            found.forEach(obj => {
                if (!selectedObjects.includes(obj)) selectedObjects.push(obj);
            });


        } else if (activeCanvas === 'editor' && currentContours) {
            
            
            // Собираем все точки в плоский массив для фильтрации
            const allPts = [];
            currentContours.forEach((c, ci) => c.forEach((p, pi) => allPts.push({ ci, pi, p })));

            // Правило для точек: пересчитываем в экранные координаты
            const found = getItemsInBox(allPts, selBox, item => ({
                x: params.x + item.p.anchor.x * params.scale,
                y: params.baseline - item.p.anchor.y * params.scale
            }));

            found.forEach(item => {
                // Сохраняем индексы выбранных точек
                if (!selectedPoints.find(sp => sp.ci === item.ci && sp.pi === item.pi)) {
                    selectedPoints.push({ ci: item.ci, pi: item.pi });
                }
            });
        }
    }

    cleanTempVariables();
});


// Special Cases

canvasSample.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.98 : 1.02;

    // 1. Получаем точные координаты курсора на холсте
    const { x: mx, y: my } = getMousePosition(canvasSample, e);

    if (sBackgroundSelected) {
        // ЗУМ ФОНА В ТОЧКУ КУРСОРA
        // Формула: новое_полож = точка_курсора + (старое_полож - точка_курсора) * дельта
        sampleBackgroundImage.x = mx + (sampleBackgroundImage.x - mx) * delta;
        sampleBackgroundImage.y = my + (sampleBackgroundImage.y - my) * delta;
        sampleBackgroundImage.scale *= delta;

    } else if (selectedObjects.length > 0) {
        // ЗУМ ГРУППЫ ГЛИФОВ В ТОЧКУ КУРСОРA
        selectedObjects.forEach(obj => {
            // Каждый объект смещается относительно курсора
            obj.x = mx + (obj.x - mx) * delta;
            obj.y = my + (obj.y - my) * delta;
            obj.scale *= delta;
            tempScale = obj.scale;
        });
    }
    renderSampleCanvas();
};

function undo() {
    if (history.undoStack.length === 0) return;

    const currentState = {
        glyphIndex: currentGlyphIndex,
        contours: JSON.parse(JSON.stringify(currentContours))
    };
    history.redoStack.push(currentState);

    // Достаем последнее состояние
    const lastState = history.undoStack.pop();
    applyHistoryState(lastState);
}

function applyHistoryState(state) {

    if (currentGlyphIndex !== state.glyphIndex) {
        currentGlyphIndex = state.glyphIndex;
        currentGlyph = font.glyphs.get(currentGlyphIndex);
    }

    // 2. Восстанавливаем именно контуры
    currentContours = JSON.parse(JSON.stringify(state.contours));
    
    // 3. Сохраняем в шрифт и обновляем интерфейс
    commitGlyphEdits(); 
    
    // Перерисовываем ВСЁ, чтобы SampleCanvas тоже увидел изменения
    renderEditorCanvas();
    renderSampleCanvas(); 
}

let sortValue = null;

function LangDetect(char) {
    if (!char || char === " ") return;

    // Проверяем через встроенные категории Unicode
    const isCyrillic = /\p{Script=Cyrl}/u.test(char);
    const isLatin = /\p{Script=Latn}/u.test(char);
    const isGreek = /\p{Script=Grek}/u.test(char);

    if (isCyrillic) console.log(`Символ: ${char} | Код: U+${char.codePointAt(0).toString(16).toUpperCase()} | Это КИРИЛЛИЦА`);
    if (isLatin) console.log(`Символ: ${char} | Код: U+${char.codePointAt(0).toString(16).toUpperCase()} | Это ЛАТИНИЦА`);
}

// helper чтобы не дублировать console.log
function log(char, code, type) {
    //console.log(`Символ: ${char} | Код: U+${code} | Тип: ${type}`);    
    return type;
}

function detectScript(char) {
    if (!char || char.trim() === "") return null;

    const code = char.codePointAt(0).toString(16).toUpperCase();

    // 1. Быстрые проверки (самые частые)
    if (/\p{Script=Cyrl}/u.test(char)) return log(char, code, "Cyr..");
    if (/\p{Script=Latn}/u.test(char)) return log(char, code, "Latin");
    if (/\p{Script=Grek}/u.test(char)) return log(char, code, "Greek");

    // 2. Расширенный список
    const scripts = [
        "Arab","Hebr","Deva","Beng","Guru","Gujr","Orya",
        "Taml","Telu","Knda","Mlym","Sinh","Thai","Laoo","Mymr","Khmr",
        "Hang","Hani","Hira","Kana","Ethi","Geor","Armn"
    ];

    for (const script of scripts) {
        if (new RegExp(`\\p{Script=${script}}`, "u").test(char)) {
            return log(char, code, script);
        }
    }

    // 3. Общие символы (цифры, пунктуация и т.д.)
    if (/\p{Script=Zyyy}/u.test(char)) {
        if (/\p{Number}/u.test(char)) return log(char, code, "Number");
        if (/\p{Punctuation}/u.test(char)) return log(char, code, "Punc_?!.");
        if (/\p{Symbol}/u.test(char)) return log(char, code, "Symbol");
        return log(char, code, "Common");
    }

    // 4. Диакритика
    if (/\p{Script=Zinh}/u.test(char)) {
        return log(char, code, "Diacritic");
    }

    // 5. Неизвестное
    if (/\p{Script=Zzzz}/u.test(char)) {
        return log(char, code, "Unknown");
    }

    return log(char, code, "Unknown");
}

searchBar.addEventListener('input', () => {

    const lastchar = searchBar.value.slice(-1);
    const out = document.getElementById("sLogout");
    
    const rawValue = searchBar.value.trim();
    
    // 1. Если пусто — показываем всё
    const tiles = document.querySelectorAll('#cmap .tile');
    if (!rawValue) {
        out.textContent = ""; // ← ВАЖНО
        tiles.forEach(tile => tile.hidden = false);
        return;
    }

    out.textContent = detectScript(lastchar);

    const words = rawValue.split(/\s+/).filter(k => k);

    // 2. Создаём массив уникальных символов из всех слов
    const charKeys = Array.from(new Set(words.join("").split("")));

    // 3. Объединяем слова + символы для поиска
    const keys = [...words, ...charKeys];


    tiles.forEach(tile => {
        const name = tile.dataset.name || "";
        const isMatch = keys.some(key => key === name);

        tile.hidden = !isMatch;
    });
});


function openSearchBar(){
    searchWrapper.hidden = !searchWrapper.hidden;
}




function clickMap(element, arrayIndex){ // index > arrayIndex (from Font to Custom Array)
    //const item = glyphArray.find(it => it.index === index); 
    //console.log(item.unicode);

    // убирает активный статус с текущего
    if(tempElement !== null){ 
        tempElement.classList.remove("active");
    }
    
    arrayViewer.userInteraction = true;

    // выставляем активный статус выбранному
    element.classList.add("active");
    tempElement = element;

    // tech
    if(editMode==true && bezierMode ==true || pEditMode==true ){
        commitGlyphEdits();
    }
    
    if (arrayIndex !== undefined) {     

        //currentGlyphIndex = index;
        //console.log("Переключаем индекс на ", currentGlyphIndex);

        if(tempItem == null){ 
            tempItem = currentItem;
            tempItemIndex = currentItemIndex;
        }

        // Прямое обращение без лишних условий
        //currentItem = currentDataArray[arrayIndex];
        currentItemIndex = arrayIndex;
        //currentGlyph = currentItem?.glyph;

        if(arrayViewer.glyf){
            arrayViewer.glyfTempIndex = arrayIndex;
        }
        else if(arrayViewer.comp){
            arrayViewer.compTempIndex = arrayIndex;
        }

        //currentGlyphIndex = arrayIndex;
        
        console.log("Click on:", currentDataArray === compArray ? "component" : "glyph", currentItemIndex);
    }

    if (editorBlock.hidden) { 
        callGlypthEditor(true);
    }

    redrawActiveGlyphInCanvas();

    if(displayObjectInfo==true){
        updateObjectStats();
    }

    if (pEditMode){
        updateCodeEditor();
    }
}

function closeOverlays() {
    const oNote = document.getElementById("oNote");

    const wasOpen = !oNote.hidden || !exportPanel.hidden;

    // Закрываем всё (даже если уже закрыто, вреда не будет)
    oNote.hidden = true;
    exportPanel.hidden = true;
    exportButton.classList.remove("active")
    infoButton.classList.remove("active");
    return wasOpen;
}

// Перевести потом в единую функцию
function callSampleEditor(option){

    if (closeOverlays()) return;

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
    canvasSample.width = cmpaScrollWrapper.clientWidth;
    renderSampleCanvas();
}



let firstCallGEditor = true;

function checkActiveTileStyle() {
    // SET ACTIVE CLASS TO TILE (FROM LOADING ON START)
    // ADD SCROLL TO ACTIVE IN CMAP?

    // Если визуально активный элемент не задан, 
    // но индекс в массиве есть

    if (tempElement === null && currentItemIndex !== null) {
        const targetTile = document.querySelector(`#cmap .tile[data-array-index="${currentItemIndex}"]`);
        
        if (targetTile) {
            targetTile.classList.add("active");
            tempElement = targetTile;

            arrayViewer.userInteraction = true;

            if(arrayViewer.glyf ){
                arrayViewer.glyfTempIndex = currentItemIndex;

            }else if (arrayViewer.comp ){ 
                arrayViewer.compTempIndex = currentItemIndex;
            }

            if(!currentItem){
               currentItem = currentDataArray[currentItemIndex]; 
            }
            

            targetTile.scrollIntoView({ block: "center", behavior: "smooth" });
        }
    }

    console.log("checkActiveTileStyle",currentItemIndex,tempElement, arrayViewer)
}

function callGlypthEditor(option) {
    
    if (closeOverlays()) return;

	if (option !== undefined) {
		glyphEditor = option;
	}else{
		glyphEditor = !glyphEditor; 
	}
	
	console.log("callGlyphEditor:", glyphEditor);


	if(glyphEditor==true){ // открытие
        
        editorBlock.hidden = false;
        buttonGlyph.classList.add("active")
        
        if(pEditMode){
            //console.log("Открываем код вьювер");
            gEditBtn.classList.add("active");
            editorCodeBlock.hidden = false;
        }

        
        if(firstCallGEditor){
            checkActiveTileStyle()

            if(generatedFont){ callGuidesMode(true);
            }

            firstCallGEditor = false;
            redrawActiveGlyphInCanvas(false);
        }

        renderEditorCanvas();

	}else{ // закрытие

        callBezierMode(false, false); // Bezier сам сделаем комит в безье, но нам не нужна перерисовка

        //pEditMode = false;
        //removeProcedureGlyph();

        editorBlock.hidden = true;
        editorCodeBlock.hidden = true;

	    buttonGlyph.classList.remove("active");
        gEditBtn.classList.remove("active");
        bezierBtn.classList.remove("active");

	}

    resizeCanvas();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function callGlyphInfoMode(option) {
    if (option !== undefined) {
        displayObjectInfo = option;
    } else {
        displayObjectInfo = !displayObjectInfo; 
    }
    
    console.log("callInfoMode:", displayObjectInfo);

    if(displayObjectInfo==true){
        glyphInfoBtn.classList.add("active")
        informGlyphBlock.hidden = false;
        
    }else{
        glyphInfoBtn.classList.remove("active");
        informGlyphBlock.hidden = true;
    }

    updateObjectStats();
    
}


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

    redrawActiveGlyphInCanvas();
}

function callGEditMode(option, draw=true,) {
    if (closeOverlays()) return;

    if (option !== undefined) {
        pEditMode = option;
    } else {
        pEditMode = !pEditMode; 
    }
    
    console.log("callGEditMode:", pEditMode);

    if(pEditMode==true){

        if(bezierMode){ callBezierMode(false, false); }

        gEditBtn.classList.add("active");
        createProcedureGlypth();
        createCodeEditor();
        editorCodeBlock.hidden = false;
        updateCodeEditor();

    }else{
        gEditBtn.classList.remove("active");
        removeProcedureGlyph();
        editorCodeBlock.hidden = true;
    }
    if(draw == true){
        redrawActiveGlyphInCanvas();
    }
    
}

function callSwitchBezierMode(option) {
     if (option !== undefined) {
        cTransformMode = option;
    } else {
        cTransformMode = !cTransformMode; 
    }
    console.log("callSwitchBezierMode:", cTransformMode);
    renderEditorCanvas();

    const iconFilled = bezTransformModeBtn.querySelector("img");
    const iconCorner = bezPointEditModeBtn.querySelector("img");

    if(cTransformMode==true){
        bezTransformModeBtn.classList.add("active");
        bezPointEditModeBtn.classList.remove("active");  
    }else{
        bezTransformModeBtn.classList.remove("active"); 
        bezPointEditModeBtn.classList.add("active");
    }

    iconFilled.src = cTransformMode 
        ? "/assets/svg/triangleBlackFill.svg" 
        : "/assets/svg/triangleWhiteFill.svg";

    iconCorner.src = cTransformMode 
        ? "/assets/svg/triangleWhiteStroke.svg" 
        : "/assets/svg/triangleBlackStroke.svg";

}

bezTransformModeBtn.onclick = () => callSwitchBezierMode(true);
bezPointEditModeBtn.onclick = () => callSwitchBezierMode(false);

function callBezierMode(option, draw=true, save=true) {
    if (closeOverlays()) return;

     if (option !== undefined) {
        bezierMode = option;
    } else {
        bezierMode = !bezierMode; 
    }
    
    console.log("callBezierMode:", bezierMode);
        
    if(bezierMode==true){

        if(pEditMode){ callGEditMode(false); }

        bezierBtn.classList.add("active")
        
        if (!generatedFont){
            callSwitchBezierMode(cTransformMode);
        }

        hornersBtns.hidden = false;

        editMode = true
        const glyphCommands = currentGlyph?.path?.commands ?? [];
        currentContours = buildEditableContours(glyphCommands);
            
    }else{
        bezierBtn.classList.remove("active");
        
        commitGlyphEdits();

        hornersBtns.hidden = true;

        editMode = false
        currentContours = null

    }
    if(draw == true){
        redrawActiveGlyphInCanvas();
        //renderEditorCanvas();
    }
}

function switchArrayViewer(option, draw=true) {
    if (closeOverlays()) return;

     if (option !== undefined) {
        arrayViewer.bprevious = arrayViewer.bcurrent;
        arrayViewer.bcurrent = option;
    } else {
        arrayViewer.bprevious = arrayViewer.bcurrent;
        arrayViewer.bcurrent = !arrayViewer.bcurrent; 
    }

    arrayViewer.glyf = !arrayViewer.bcurrent;
    arrayViewer.comp = arrayViewer.bcurrent;

    console.log("switchArrayViewer:", arrayViewer);
    
    // GUI
    if(arrayViewer.glyf){ switchCmapViewer.classList.remove("active");
    }

    else if(arrayViewer.comp){ switchCmapViewer.classList.add("active");
    }

    zoom = 1.0;

    // INNER LOGIC

    if(arrayViewer.userInteraction){
        const currentIndex = currentItemIndex;
        
        if(arrayViewer.glyf){
            arrayViewer.compTempIndex = currentIndex;
            currentItemIndex = arrayViewer.glyfTempIndex;
        }

        else if(arrayViewer.comp){
            arrayViewer.glyfTempIndex = currentIndex;
            currentItemIndex = arrayViewer.compTempIndex;
        }
    }else{
        currentItemIndex = null;
    }

    //currentGlyph = null;

    if(generatedFont){
        redrawAllProcedure();

    }else{
        if(arrayViewer.comp){
            updateCMAP("component");
            //const tiles = document.querySelectorAll('#cmap .tile');
            //tiles.forEach(tile => tile.hidden = true);

        }
        else if(arrayViewer.glyf){
            updateCMAP();
            //const tiles = document.querySelectorAll('#cmap .tile');
            //tiles.forEach(tile => tile.hidden = false);

        }
    }


    // Обновляем данные внутренней кнопки
    const cMapPlusButton = cmap.querySelector('.PlusCMapButton');
    if (cMapPlusButton) {

        if (arrayViewer.bcurrent !== arrayViewer.bprevious) {
            const beforeChange = arrayViewer.bprevious ? "1" : "0";
            const currentValue = arrayViewer.bcurrent ? "1" : "0";
        
            cMapPlusButton.dataset.cmode = currentValue;      // Записываем "1" в cmode
            cMapPlusButton.dataset.tmode = beforeChange; // Записываем "0" в tmode
            
            console.log("Переключено:", beforeChange, "->", currentValue);
        }
    }

    if(displayObjectInfo){
        updateObjectStats();
    }

    if(draw == true){
        //redrawActiveGlyphInCanvas();
        //renderEditorCanvas();
    }
}

buttonGlyph.onclick = () => callGlypthEditor();
switchCmapViewer.onclick = () => switchArrayViewer();
glyphInfoBtn.onclick = () => callGlyphInfoMode();
gEditBtn.onclick = () => callGEditMode();
guidesBtn.onclick = () => callGuidesMode();
bezierBtn.onclick = () => callBezierMode();
closeBtn.onclick  = () => callGlypthEditor(false);

buttonSample.onclick = () => callSampleEditor();
exportButton.onclick = () => callPanelExport();

exportFromPanelBtn.onclick = () => exportFontRebuild();

genButton.onclick = () => initGenericFont();
applySettingBtn.onclick = () => startProcessGenerate();


function callReadme(){
    
    const oNote = document.getElementById("oNote");
    if(!oNote) return

    //if(!exportPanel.hidden) return;
    const hid = !oNote.hidden;
    oNote.hidden = hid;

    if(hid==false){
        infoButton.classList.add("active");
    }else{
        infoButton.classList.remove("active");
    }
}

infoButton.onclick =  () => callReadme();

closeNoteBtn.onclick = () => {
    infoButton.classList.remove("active");
    document.getElementById('oNote').hidden = true;
};


//let gState = 0;
window.onkeydown = (e) => {
    const target = e.target;

    const safeReturn = (cancel = true, blur = true) => {
        if (e && cancel) {
            e.preventDefault();
            //e.stopImmediatePropagation();
        }
        if (blur && document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur(); 
        }
        return
    }

    // Logic

    if (target.tagName === 'INPUT' && target.type === 'text') {
        console.log("return from text input")
        return safeReturn(false, false) // for user editable input
    }else if(target.tagName === 'INPUT' && target.type === 'range') {
        console.log("return from range")
        return safeReturn() 
    }else if(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        console.log("return from any editable")
        return safeReturn(false, false) 
    }

    const cod = e.code;
    const key = e.key;

    const pressedCtrl = e.ctrlKey;
    const pressedShift = e.shiftKey;

    const isZ = cod === 'KeyZ';
    const isY = cod === 'KeyY';
    const isF = cod === 'KeyF';

    if(startwindow){ 
        if ( (cod === "KeyF" || cod === "Enter" || cod === "Space") && !pressedCtrl){
            if(generatePBlock.hidden == true){
                console.log("SkipPress");
                genButton.click();
            }else{
                console.log("SkipPressX2");
                applySettingBtn.click();
            }
        } 
        return safeReturn(false) // чтобы можно сделать reload
    }


    // Ctrl + Z (Undo)
    if (pressedCtrl && isZ && !pressedShift) {
        //e.preventDefault()
        undo();
        return safeReturn()
    }

    // Ctrl + Y или Ctrl + Shift + Z (Redo)
    if (pressedCtrl && (isY || (pressedShift && isZ))) {
        //e.preventDefault();
        redo();
        return safeReturn()
    }

    if (pressedCtrl && isF && !pressedShift) {
        e.preventDefault(); // убирает всплывалку 
        openSearchBar();
        return safeReturn()
    }

    if (cod === "KeyG") {
        callGuidesMode();
        /*
        if (!glyphEditor) {
            callGlypthEditor(true);
            callGuidesMode(true);
            return safeReturn()
        } else if (glyphEditor && displayGuide) {
            callGuidesMode(false);
            return safeReturn()
        } else {
            callGlypthEditor(false);
            return safeReturn()
        }
        */
    } 
    else if (cod === "KeyC") {
        console.log("press C");
        if(generatedFont){
            switchArrayViewer();
            return safeReturn()
        }
        if (glyphEditor) {
            //callGEditMode();
            return safeReturn()
        }
    }
    else if (cod == "NumpadMultiply"){
        callReadme();
        return safeReturn();

    } else if (cod === "KeyS") callGlyphInfoMode(); //callSampleEditor();
    else if (cod === "KeyP" || cod === "KeyB" || cod === "KeyH") callBezierMode();
    else if (cod === "KeyF") {
       console.log("pressF!"); // Теперь дойдет!
       if (!glyphEditor) {
            callGlypthEditor(true);
            callGEditMode(true);
       } else {
            callGEditMode(!pEditMode);
       }
       return safeReturn()
    } 
    else if (cod === "KeyI") {
       if (!glyphEditor) {
            callGlypthEditor(true);
            callGlyphInfoMode(true);
       } else {
            callGlyphInfoMode(!displayObjectInfo);
       }
       return safeReturn()
    }
    

    if (key >= "1" && key <= "9") { //Numeration-1
        
        const i = key.charCodeAt(0) - 49;
    
        if(i==0) callSampleEditor(); 
        else if(i==1) callGlypthEditor();
        else if (i==2) {
            callPanelExport();
            // Component Logic
            //switchArrayViewer();
            /*
            if(!glyphEditor){
                callGlypthEditor(true); 
                callGEditMode(true);
            }else if(glyphEditor && !pEditMode) {
                callGEditMode(true);   
            }else{
                callGEditMode(false);
            }
            */
        }else if(i==3) {
            callReadme();
            //callPanelExport();
            //callBezierMode();
        }else if(i==4) {
            //callReadme();
        }else if(i==7){ //its8
            callReadme();
        }

        return safeReturn()
    }
    
    // Удаление объектов (Delete или Backspace)
    // e.code для них: 'Delete' и 'Backspace'
    if ((cod === "Delete" || cod === "Backspace") && selectedObjects.length > 0) {
        e.preventDefault();
        
        // Оставляем только те объекты, которых нет в списке выделенных
        canvasObjects = canvasObjects.filter(o => !selectedObjects.includes(o));
        selectedObjects = [];
        
        renderSampleCanvas()
        return safeReturn()
    }

    //return safeReturn()
}


async function loadReadme() {
    try {
        const response = await fetch('README.md');
        const markdown = await response.text();
        
        // Превращаем Markdown в HTML
        const htmlContent = marked.parse(markdown);
        
        // Вставляем в блок
        document.getElementById('readmeСontent').innerHTML = htmlContent;
    } catch (err) {
        console.error("Не удалось загрузить README:", err);
        document.getElementById('readmeСontent').innerText = "Ошибка загрузки документации.";
    }
}

loadReadme();

function dumpFontFull(font, label = "FONT DUMP") {
    console.log(`========== ${label} ==========`);
    if (!font) {
        console.error("No font");
        return;
    }

    console.log("familyName:", font.familyName);
    console.log("styleName:", font.styleName);
    console.log("unitsPerEm:", font.unitsPerEm);
    console.log("ascender:", font.ascender);
    console.log("descender:", font.descender);

    console.log("names:", font.names ? JSON.parse(JSON.stringify(font.names)) : null);
    console.log("tables keys:", font.tables ? Object.keys(font.tables) : null);

    if (font.tables) {
        for (const key of ["cmap", "head", "hhea", "hmtx", "maxp", "name", "os2", "post", "glyf", "loca"]) {
            const t = font.tables[key];
            console.log(`table ${key}:`, t ? JSON.parse(JSON.stringify(t)) : null);
        }
    }

    const seenUnicode = new Map();

    for (let i = 0; i < font.glyphs.length; i++) {
        const g = font.glyphs.get(i);
        console.group(`Glyph #${i} (${g.name})`);

        console.log("index:", g.index);
        console.log("name:", g.name);
        console.log("unicode:", g.unicode);
        console.log("advanceWidth:", g.advanceWidth);

        if (g.unicode != null) {
            if (seenUnicode.has(g.unicode)) {
                console.warn("DUPLICATE unicode with:", seenUnicode.get(g.unicode));
            } else {
                seenUnicode.set(g.unicode, g.name);
            }
        }

        const cmds = g.path?.commands || [];
        console.log("path command count:", cmds.length);

        cmds.forEach((cmd, idx) => {
            const info = { type: cmd.type };

            if ("x" in cmd) info.x = cmd.x;
            if ("y" in cmd) info.y = cmd.y;
            if ("x1" in cmd) info.x1 = cmd.x1;
            if ("y1" in cmd) info.y1 = cmd.y1;
            if ("x2" in cmd) info.x2 = cmd.x2;
            if ("y2" in cmd) info.y2 = cmd.y2;

            const bad = Object.values(info).some(v => typeof v === "number" && Number.isNaN(v));
            if (bad) {
                console.error("BAD CMD", idx, info);
            } else {
                console.log("cmd", idx, info);
            }
        });

        console.groupEnd();
    }

    console.log("========== END ==========");
}

function glyphDump(glyphs) {
glyphs.forEach((g, i) => {
    console.log("DumpGlyphs", {
        index: i,
        name: g.name,
        unicode: g.unicode,
        unicodes: g.unicodes,
        hex: g.unicode != null ? "U+" + g.unicode.toString(16).toUpperCase() : null
    });
});
}


function exportRawFont(filename, familyname, stylename, designer) {
    if (!font) { alert("No font in memory"); return;}

    const tFamilyName = font.familyname;
    const tStylename = font.stylename;

    font.familyname = familyname;
    font.stylename = stylename;

    try {
        // Никаких изменений — просто сериализация
        const buffer = font.toArrayBuffer();

        const blob = new Blob([buffer], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

    } catch (err) {
        font.familyname = tFamilyName;
        font.stylename = tStylename;
        alert("Raw export failed: " + err.message);
    }

    font.familyname = tFamilyName;
    font.stylename = tStylename;
}

let customParamInput = {};

function updateExportLines(){
    
    //const userInputs = Object.keys(customParamInput).length > 0;
    //console.log("userinp", userInputs);

    const gFamilyName = GFONT_PARAMS.name; 
    const gStyleName = getWeightName(GFONT_PARAMS.ts*4 || 400);
    const gDesigner = "I AM?";

    eFontnameLine.value = customParamInput.familyName || gFamilyName;
    eStylenameLine.value = customParamInput.styleName || gStyleName;
    eDesignerLine.value = customParamInput.designer || gDesigner;

}

eFontnameLine.addEventListener('input', () => {
    customParamInput.familyName = event.target.value;
    console.log("check", customParamInput);
});

eStylenameLine.addEventListener('input', () => {
    customParamInput.styleName = event.target.value;
    console.log("check", customParamInput);
});

eDesignerLine.addEventListener('input', () => {
    customParamInput.designer = event.target.value;
    console.log("check", customParamInput);
});



function callPanelExport(option) {
    console.log("callPanelExport");

    if (closeOverlays()) return;    

    if(!generatedFont){
        exportFontRebuild(); 
        return
    }

    updateExportLines()

    const val = !exportPanel.hidden;
    
    if(val){
        exportButton.classList.remove("active")
    }else{
        exportButton.classList.add("active")
    }

    exportPanel.hidden = val;
}

closeExportPanelBtn.onclick = () => {
    exportPanel.hidden = true;
    exportButton.classList.remove("active")
}

function convertByFontEditor(sArrayBuffer) {
    console.group('FontEditor: Начало конвертации CFF -> TTF');
    
    try {
        // 1. Получаем ArrayBuffer из opentype.js
        const sourceBuffer = sArrayBuffer;
        console.log(`Размер исходного CFF буфера: ${sourceBuffer.byteLength} байт`);


        //console.log('2. Инициализация fonteditor-core (тип: otf)...');
        const feFont = fonteditor.Font.create(sourceBuffer, {
            type: 'otf', 
            hinting: true 
        });
        console.log('Объект feFont успешно создан:', feFont);


        //console.log('3. Генерация выходного TTF байткода...');
        const ttfData = feFont.write({
            type: 'ttf'
        });

        // 4. Проверка типа возвращаемых данных (Buffer vs ArrayBuffer)
        let finalBuffer = ttfData;
        if (ttfData && ttfData.buffer && ttfData.byteOffset !== undefined) {
            console.log('Получен Node-style Buffer, извлекаем чистый ArrayBuffer...');
            finalBuffer = ttfData.buffer.slice(
                ttfData.byteOffset, 
                ttfData.byteOffset + ttfData.byteLength
            );
        }

        console.log(`Успех! Размер итогового TTF: ${finalBuffer.byteLength} байт`);
        console.groupEnd();
        
        return finalBuffer;

    } catch (error) {
        console.error('Критическая ошибка при конвертации в FontEditor:');
        console.error(error);
        console.groupEnd();
        return null;
    }
}

function exportFontRebuild() {
    if (!font) {
        alert("No font in memory");
        return;
    }

    const cleanBaseName = loadedFontName.trim(); 
    const fileformat = "ttf"; // opentype.js - only [.otf] ; but after fonteditor -  .ttf 

    let exportFileName;
    let newFamilyName; 
    let newStyleName;
    let newDesigner;


    if(!generatedFont){
        const postfix = " Fedit";
        
        newFamilyName = cleanBaseName + postfix; 
        newStyleName = getSafeName(font, 'fontSubfamily') || "Regular";
        newDesigner = getSafeName(font, 'designer') || "Unknown";

        exportFileName = `${loadedFileName.split('.').shift()+postfix + '.' + fileformat}`; 
    }else{

        const gFamilyName = GFONT_PARAMS.name; 
        const gStyleName = getWeightName(GFONT_PARAMS.ts*4 || 400);
        const gDesigner = "I AM?";

        newFamilyName = customParamInput.familyName || gFamilyName;
        newStyleName = customParamInput.styleName || gStyleName;
        newDesigner = customParamInput.designer || gDesigner;

        //console.log("FromLines", newFamilyName, gFamilyName);

        exportFileName = `${newFamilyName} ${newStyleName + '.' + fileformat }`;
    }
    
    if (preservedFont){

        /* PROBLEM 2 SOLVED
        Сейчас существует отдельный флаг под Variable Font на экспорт (он экспортирует через старый rawFont)
        Проблема с Epilogue-VariableFont_wght.ttf - после Preserve при попытки чтении сохранённого файла на Windows - происходит ошибка
        */

        //exportRawFont(exportFileName, newFamilyName, newStyleName, newDesigner);
        //return;
    }

    //console.log("fm:", newFamilyName, "st:", newStyleName, "fn:", exportFileName);

    try {
        // 1. Собираем исходные глифы
        const sourceGlyphs = [];
        for (let i = 0; i < font.glyphs.length; i++) {
            sourceGlyphs.push(font.glyphs.get(i));
        }

        // 2. Удаляем системные (чтобы не дублировать)
        /*
        const filteredGlyphs = sourceGlyphs.filter(g =>
            g.name !== '.notdef' &&
            g.name !== '.null' &&
            g.name !== 'nonmarkingreturn'
        );
        */
        const filteredGlyphs = sourceGlyphs.filter(g => !systemGlyphsNames.includes(g.name));

        // 4. Пересобираем пользовательские глифы
        const rebuiltGlyphs = filteredGlyphs
            .filter(g => {
                // 1. Проверяем, что unicode не пустой (не null и не undefined)
                const hasUnicode = g.unicode != null;

                // 2. Проверяем, что есть хотя бы одна команда рисования
                const hasCommands = g.path && g.path.commands && g.path.commands.length > 0;
                
                //console.log(g.name, hasUnicode, hasCommands);

                // Оставляем только те, где выполнены ОБА условия
                return hasCommands; //hasUnicode && 
                
            })
            .map(g => {
                const uni = g.unicode != null ? g.unicode : undefined;
                
                const targetOverlap = (g.data && g.data.overlap !== undefined) ? g.data.overlap : true;
                
                const makeSafeGlyphName = (g) => {
                    // 1. Если это стандартная латиница (A-Z, a-z) — оставляем имя как есть
                    if (g.name && /^[A-Za-z]+$/.test(g.name)) {
                        return g.name;
                    }
                    
                    // 2. Если есть Unicode (для кириллицы и прочего) — делаем uniXXXX
                    if (g.unicode != null) {
                        return `uni${g.unicode.toString(16).toUpperCase().padStart(4, '0')}`;
                    }
                    
                    // 3. Для всего остального — чистим спецсимволы
                    return String(g.name || 'glyph').replace(/[^\x20-\x7E]/g, '_');
                };

                const newGlyph = new opentype.Glyph({
                    name: makeSafeGlyphName(g), //// фикс на русскоязычные
                    unicode: uni,
                    advanceWidth: (g.advanceWidth && !isNaN(g.advanceWidth)) ? g.advanceWidth : 500,
                    path: g.path || new opentype.Path(),
                    //data: {overlap: targetOverlap} // не работает
                });

                // ПРИНУДИТЕЛЬНОЕ назначение свойства data напрямую объекту - под вопросом насколько это вообще адекватно
                //newGlyph.data = {overlap: targetOverlap};

                return newGlyph

            });

        // Все true - ок
        //console.log("DataOverlaps:", rebuiltGlyphs.map(g => g.data ? g.data.overlap : 'no-data').join(", "));

        /*
        Если у глифа был какой-то unicode (не null и не undefined), она его сохраняла. 
        Если нет — явно ставила undefined, чтобы opentype.js не заглючил от пустого значения.
        */

        /*
        const rebuiltGlyphs = filteredGlyphs.map(g => {const uni = g.unicode != null ? g.unicode : undefined;

            const makeSafeGlyphName = (g) => {
                if (g.unicode != null) {
                    return `uni${g.unicode.toString(16).toUpperCase().padStart(4, '0')}`;
                }
                return String(g.name || '').replace(/[^\x20-\x7E]/g, '_');
            };

            return new opentype.Glyph({
                name: makeSafeGlyphName(g), // фикс на русскоязычные из ProcedureFont
                unicode: uni,
                advanceWidth: (g.advanceWidth && !isNaN(g.advanceWidth)) ? g.advanceWidth : 500,
                path: g.path || new opentype.Path()
            });
        });
        */
        const finalGlyphs = [
            ...systemGlyphs,
            ...rebuiltGlyphs
        ];

        //glyphDump(finalGlyphs)
        
        // 6. Создаём объект шрифт под экспорт
        const NewTables = {};

        // Проверяем наличие каждой таблицы перед копированием (для preserve variables - это жёсткое правило - иначе не читаются)
        // CMAP НЕ БЕРЕМ!!!!! OPENTYPE сам его добавит (мы меняем порядок оригинального font)
        //if (font.tables.cmap) NewTables.cmap = Object.assign({}, font.tables.cmap); 
        if (font.tables.os2)  NewTables.os2  = Object.assign({}, font.tables.os2);
        if (font.tables.maxp) NewTables.maxp = Object.assign({}, font.tables.maxp);

        const cleanFont = new opentype.Font({
            familyName: newFamilyName || "Font",
            styleName: newStyleName,
            designer: newDesigner,
            unitsPerEm: font.unitsPerEm || 1000,
            ascender: font.ascender || 800,
            descender: font.descender || -200,
            glyphs: finalGlyphs,
            tables: NewTables
        });

        // DEBUG
        //console.log(cleanFont);
        //console.log("CFONT_DATA", cleanFont.names);
        //dumpFontFull(cleanFont, "REBUILT WITH SYSTEM");

        // 7. Экспорт
        const otfbuffer = cleanFont.toArrayBuffer();

        // this library support write ttf font format ()
        const ttfconvert = convertByFontEditor(otfbuffer); 

        const blob = new Blob([ttfconvert], { type: "application/octet-stream" });
        //const blob = new Blob([otfbuffer], { type: "font/opentype" });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = exportFileName;;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

    } catch (err) {
        console.error(err);
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
            //exportFont();
            exportFontRebuild();

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