
// REMOVE - секции под удаление

// CODEMIRROR V5 (1763 - 1944)

console.log("Check Libs:", {
    opentype: !!window.opentype,
    recipes: !!window.GLYPH_RECIPES,
    classes: !!window.ProcedureGlyph
    //console.log(polygonClipping);
});


// Прострел Для кликов
const cmapWrapper = document.getElementById('cmpaScrollWrapper');

cmapWrapper.addEventListener('mousedown', (e) => {
    if (e.target === cmapWrapper) {
        // Запрещаем браузеру начинать выделение текста
        e.preventDefault();

        cmapWrapper.style.pointerEvents = 'none';
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        
        if (elementBelow) {
            elementBelow.dispatchEvent(new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: e.clientX,
                clientY: e.clientY
            }));
            
            // сбрасываем всё, что успело выделиться
            window.getSelection().removeAllRanges();
        }
        
        cmapWrapper.style.pointerEvents = 'auto';
    }
});


const generateApply = document.getElementById("generateApply");
const cmap = document.getElementById("cmap");
const editorCodeBlock = document.getElementById("recieptContainer");


let startwindow = true;
let startWindowPost = true;
let startCloseAnim = 1;

// Canvases

let activeCanvas = 'global'; // 'global' или 'editor'

const globalCanvas = document.getElementById("globalCanvas");
const gctx = globalCanvas.getContext("2d");

const canvas = document.getElementById("editorCanvas");
const ctx = canvas.getContext("2d");

const world = {
    // Теперь это свойства самого объекта
    offsetX: 0, offsetY: 0,

    get x() { return (globalCanvas.width / 2) + (this.offsetX)  },
    get y() { return (globalCanvas.height / 2) + (this.offsetY)  },

    // ИЗ экрана В локальные (для mousedown, drop, autoPush)
    toLocalX: (screenX) => screenX - world.x,
    toLocalY: (screenY) => screenY - world.y,

    // ИЗ локальных НА экран (для отрисовки UI рамок)
    toScreenX: (localX) => localX + world.x,
    toScreenY: (localY) => localY + world.y,

    // Групповые методы для удобства
    toLocal: (mx, my) => ({ x: mx - world.x, y: my - world.y }),
    toScreen: (ox, oy) => ({ x: ox + world.x, y: oy + world.y })
};


function resizeGlobalCanvas() {
    globalCanvas.width = window.innerWidth;
    globalCanvas.height = window.innerHeight;    
    updateElementsDatas();
    renderGlobalCanvas();
}

window.onload = resizeGlobalCanvas;
window.addEventListener('resize', resizeGlobalCanvas);



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

document.getElementById('gCanvasRowBtns').addEventListener('click', (e) => {
    expandBtns(e);
});

document.getElementById('eCanvasRowBtns').addEventListener('click', (e) => {
    expandBtns(e);
});



// Image Reference Upload (Diffirent Canvas)

let gBackgroundImage = { 
    img: null, 
    x: 0, y: 0,
    scale: 1.2, 
    opacity: 0.18 
};

let gBackgroundSelected = false;

let editorBackgrounds = {};
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

const gOpacityWrap = document.getElementById('gSliderRow');
const eOpacityWrap = document.getElementById('eSliderRow');


const gOpacitySlider = document.getElementById('gBgOpacityRange');
gOpacitySlider.addEventListener('input', (e) => {
    gBackgroundImage.opacity = parseFloat(e.target.value);
    renderGlobalCanvas();
});

const eOpacitySlider = document.getElementById('eBgOpacityRange');
eOpacitySlider.addEventListener('input', (e) => {
    const bg = getCurrentEditorBg();
    if (bg) { bg.opacity = parseFloat(e.target.value);
        renderEditorCanvas();
    }
});

const gCanvasBgLoadBtn = document.getElementById("gLoadBg");
gCanvasBgLoadBtn.onclick = () => {
    const bgFileInput = document.getElementById("bgFileInput");

    bgFileInput.onchange = (e) => {
        const file = e.target.files[0];

        if (file) handleImageFile(file, (img) => {
            gBackgroundImage.img = img;

            gBackgroundImage.x = - (img.width / 2);
            gBackgroundImage.y = - (img.height / 2);
            gBackgroundSelected = true;

            if(gOpacityWrap.hidden !== false){
                gOpacityWrap.classList.remove("expandable");
                gOpacityWrap.hidden = false;
            }
            console.log(gBackgroundImage)
            renderGlobalCanvas();

        });
        bgFileInput.onchange = null;
        bgFileInput.value = "";
    };
    bgFileInput.click();
};

const eCanvasBgLoadBtn = document.getElementById("eLoadBg");
eCanvasBgLoadBtn.onclick = () => {
    const bgFileInput = document.getElementById("bgFileInput");

    bgFileInput.onchange = (e) => {
        const file = e.target.files[0];
        const idx = currentGlyph.index;

        if (file) handleImageFile(file, (img) => {
            editorBackgrounds[idx] = { img: img,
                x: -(img.width/2), 
                y: -(img.height/2), 
                scale: 1.0, opacity: 0.18
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

const gCanvasBgExpandBtn = document.getElementById("gExpandBgLine");
gCanvasBgExpandBtn.onclick = () => {
    gBackgroundSelected = !gBackgroundSelected;
    renderGlobalCanvas();
}

const eCanvasBgExpandBtn = document.getElementById("eExpandBgLine");
eCanvasBgExpandBtn.onclick = () => {
    eBackgroundSelected = !eBackgroundSelected;
}

///

// Debug Section

const debug = false;
let handleChange = true;

function slog(text, mode="log") {
    if(handleChange) return

    if(mode==="log"){
        console.log(text);
    }else if(mode==="warn"){
        console.warn(text);
    }
}

// Visible Modes Flags

let globalCanvasFlag = false; 
let glyphEditorFlag = false;

let shiftMode = false;
let displayObjectInfo = false;
let displayGuide = false;
let glyphMapViewer = true;

let arrayViewer = {
    glyf: true,
    comp: false,
    
    glyfTempIndex: null,
    compTempIndex: null,

    userInteraction: false,

    bcurrent: false,
    bprevious: false,
};

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

// Font Variables

let loadedFileName = "font"; 
let loadedFontName = "unknow";
let originalFormat = 'ttf';

let generatedFont = false;
let variableFont = false;
let preservedFont = false;
let isSameHeightTemp = false;

let font = null; // активный
let component_font = null; // буфер для компонентов
 
let currentSettings = {}; // хранит настройки variableFont
let tempVariableSettings = {}; // хранит настройки variableFont

let currentContours = null;

 // Внутренние массивы хранения данных

let selectedTiles = [];

let glyphArray = [];
let compArray = [];
let currentDataArray = glyphArray;

const addGlyphsArray = []; // Динамически добавляемые (рассчитан на процедурные)
const addCompsArray = [];

// TempItems

let currentItem = null; 
let currentItemIndex = null;

let tempItem = null;
let tempItemIndex = null;
let tempBWA_ItemIndex = null; // Это между переключениями режимов

let currentGlyph = null;
let currentProcedureGlyph = null;

let currentGlyphIndex = null; // NEED REMOVE


// Interface Flags

let isMouseDown = true; // флаг для opacity
let isSelecting = false; 
let isDragging = false;
let isPanning = false;



let startMouseX, startMouseY;
let selBox = { x1: 0, y1: 0, x2: 0, y2: 0 }; 
let zoom = 1.0;
let panX = 0;
let panY = 0;

// animation Flags

let fadeRequest = null; // ID анимации
let fadeRequestSample = null; // ID анимации

let splineExampleAnim = 0;
let splineExampleActive = false; 
let splineExampleComplete = false;

let splineDownAnim = 0;
let splineDownActive = false; 
let splineDownComplete = false;

let specialAlpha = 0; // Для клика (SpecialMessage)
let pasteAlpha = 1;   // Для подсказки (PasteMessage), начинаем с 1
let pasteMessageActive = true; // for OpacityDownMessage in Canvas

let mHeaderAlpha = 1;
let mHeaderActive = true; 
let mHeaderComplete = false;

let mSublineAlpha = 1;
let mSublineActive = true; // ReverseInit
let mSublineComplete = false;

let charAnim = 0;
let openingAnimFlag = true; 

///

let selectedPoints = []; // Для хранения выделенных точек в Editor

let gCanvasObjects = []; // Глифы на холсте
let selectedObjects = []; // Массив выделенных объектов
let dragOffsets = []; 

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


////////////////////////////////////////////////// INIT


let targetHeight = 90;
let targetYPosition = null;
let targetDatas = {};
let tempScale = 0.1;

let animationLetters = [];
let animationActive = true;


let tracking  = 0.75;
/*
let spOffset = 0;
if(index === 0) spOffset = 18;
if(index === 1) spOffset = 8;
if(index === 2) spOffset = -8;
*/

function autoPushOnCanvas() {

    if(!currentDataArray) return
    
    gCanvasObjects = [];
    animationLetters = []; 
    
    const scaleFactor = 1;

    if (currentDataArray.length > 0) {
        let sampleItem;

        if(generatedFont){
            // мой можно брать первым
            sampleItem = currentDataArray[0]; 
        }else{
            // первый может быть пустышкой не знаю
            sampleItem = currentDataArray[2]; 
        }
         
        const params = getGlyphSVGParams(sampleItem);

        tempScale = targetHeight / params.capHeight;
        
        //console.log("tempsScale", tempScale,params.capHeight, targetHeight);

        tempScale = tempScale*scaleFactor
        targetHeight = targetHeight*scaleFactor
 
        //console.log("targetHeight (px):", targetHeight, "tScale:", tempScale)
    }


    const cx = 0;
    const cy = targetYPosition ? world.toLocalY(targetYPosition) : 0;


    const arrayLetter = USER_INPUT_VAL;

    //console.log("arrayLetter", arrayLetter, "DataArray", currentDataArray );

    const totalCount = arrayLetter.length; 
    
    const totalTextWidth = arrayLetter.reduce((acc, symbol, index) => {
        //const foundItem = currentDataArray.find(item => item.name === symbol);
        let foundItem = currentDataArray.find(item => item.unicode === symbol.charCodeAt(0));

        if (!foundItem) {
            const altSymbols = ["#", "0"]; // Массив запасных символов
            for (const alt of altSymbols) {
                foundItem = currentDataArray.find(item => item.unicode === alt.charCodeAt(0));
                arrayLetter[index] = alt
                if (foundItem) break ; 
            }
        }

        const glyphAW = foundItem ? foundItem.glyph?.advanceWidth : 0;
        return acc + (glyphAW * tempScale * tracking); 
    }, 0);

    //console.log("ResultLetterMap", arrayLetter);
    
    const cxOffset = cx - (totalTextWidth / 2);
    const cyOffset = cy + (targetHeight/2)

    let canvasOffset = 0; 
    const prelast = totalCount - 2;

    let prelastObj=null;
    let errorAnimation = false;
    
    const allItems = arrayLetter.map((symbol, index) => { // Добавили index сюда

        let foundItem = currentDataArray.find(item => item.unicode === symbol.charCodeAt(0));
        //console.log(symbol.charCodeAt(0))
        //const foundItem = currentDataArray.find(item => item.name === symbol);
        
        if (foundItem) {

            const glyphAW = foundItem.glyph.advanceWidth;
            
            const currentGlyphWidth = glyphAW * tempScale * tracking;
            const halfWidth = currentGlyphWidth / 2;

            const resultX = cxOffset + canvasOffset + halfWidth; 
            const resultY = cyOffset;

            const newCanvasObject = {
                item: foundItem, // ссылка на "обертку"
                array: currentDataArray,
                aindex: foundItem.aindex,
                logicalIndex: index, // позиция user input
                animIndex: -1, // Если анимации нет
                x: resultX,
                y: resultY,
                scale: tempScale,
                angle: 0,
            };

            // 2. Сразу создаем анимационный объект и связываем их
            if(generatedFont){
                try {
                    const recipeFn = GLYPH_RECIPES[symbol];
                    if (recipeFn) {
                        const genObject = new ProcedureGlyph(symbol, recipeFn, GFONT_PARAMS);
                        genObject.linkedPos = newCanvasObject; 
                        
                        newCanvasObject.animIndex = animationLetters.length; 
                        animationLetters.push(genObject);
                    }
                } catch (e) {
                    console.error(`Ошибка при создании анимации для ${symbol}:`, e);
                    errorAnimation = true;
                }
            }else{
                animationLetters = [];
                animationActive = false; 
            }

            gCanvasObjects.push(newCanvasObject);

            if (index === (prelast) ) { // предпоследний
                selectedObjects.push(newCanvasObject);
                prelastObj = newCanvasObject;
            }

            canvasOffset += currentGlyphWidth;

        } else {
            console.warn(`autoPushOnCanvas: не найден!`, symbol, symbol.charCodeAt(0) );
        }

    });

    if(gCanvasObjects.length<1){
        console.warn("autoPushOnCanvas empty" );
        skipAllAnimation("errorAutopush");
    }

    if (errorAnimation) {
        animationLetters = [];
        animationActive = false; 
    }

    // Bonus: turn to front Z-order
    if (prelastObj) {
        const currentIndex = gCanvasObjects.indexOf(prelastObj);
        
        if (currentIndex !== -1) {
            const moved = gCanvasObjects.splice(currentIndex, 1)[0];
            gCanvasObjects.push(moved);
        }
    }

    renderGlobalCanvas(); 
}

function getActualHeightFromDOM(element) {
    const text = element.innerText;
    const style = window.getComputedStyle(element);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    
    const metrics = ctx.measureText(text);
    const physicalHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    
    return physicalHeight;
}

let splinePos = null;
function updateElementsDatas(){
    const line = document.getElementById('mainLetterLine');
    const btn = document.getElementById('generateApply');
    if (!line || !btn) return

    const lineRect = line.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    if (lineRect.width === 0 && lineRect.height === 0) return


    targetDatas['aWidth'] = lineRect.width;
    targetDatas['aLeft']  = lineRect.left;

    targetDatas['bWidth']  = btnRect.width;
    targetDatas['bLeft']   = btnRect.left;  
    targetDatas['bHeight'] = btnRect.height;

    targetDatas['cPos'] = btnRect.top; // Y координата

    const b = world.toLocalY(btnRect.top + btnRect.height) + 150;
    

    // 2. Если мы еще ни разу не инициализировали позицию — создаем её
    if (typeof b === 'number' && !isNaN(b)) {
        initSpline(0, b);

    }
}





function closeStartWindow() {
    startwindow = false;
    startWindowPost = false;

    // Calculation Data
    const btn = document.getElementById('generateApply');
    const btnRect = btn.getBoundingClientRect();

    const topFromViewport = btnRect.top;

    const text = btn.innerText;

    btn.innerHTML = `<span id="temp-measurer" style="line-height: 1; display: inline-block; padding: 0; margin: 0;">${text}</span>`;
    
    const span = document.getElementById('temp-measurer');
    const charRect = span.getBoundingClientRect();
    
    const symbolHeight = getActualHeightFromDOM(span);

    targetHeight = btnRect.height;
    targetYPosition = btnRect.top + (btnRect.height / 2);

    //console.log(`Кнопка: ${btnRect.width} x ${btnRect.height}`);
    //console.log(`Позиция кнопки: ${targetYPosition}, Высота ${targetHeight}`);
    //console.log(`Высота символа: ${symbolHeight}`);
    
    // Close HTML Element Section
    const startWindow = document.getElementById("startWindow");

    const startTextRow = document.getElementById("startTextRow");

    const startHeader = document.getElementById("startHeader");
    const mainComment = document.getElementById("mainComment");

    // Блокируем интерактивные элементы внутри (input и button)
    const elements = startWindow.querySelectorAll('input, button, p, h2');
    elements.forEach(el => {
        el.setAttribute('disabled', 'true'); // Отключает взаимодействие на уровне браузера
        el.setAttribute('tabindex', '-1');   // Убирает из навигации кнопкой Tab
        el.classList.add("lock");
    });

    if(!generatedFont){
        startHeader.innerHTML = `It's a Сanvas?`;
    }
    
    mainComment.innerHTML = `<text style="color: rgba(0, 0, 0, 0.0);">G</text>... Drag Glyph or reference image `; // for D

    startWindow.classList.add("lock");
    startTextRow.classList.add("lock");
    startTextRow.style.opacity = "0.0"; 


    //startWindow.hidden = true;
}

function openMainWindow() {
    const main = document.getElementById("mainWindow");
    const gControls = document.getElementById("gCanvasControls");
    const cViewer = document.getElementById("switchCmapViewer");

    if (main) main.hidden = false;
    if (gControls) gControls.hidden = false;
    if (cViewer) cViewer.hidden = false;
}

////////////////////////////////////////////////// GENERIC 

// возможно стоит перейти на исходные данные по типу as = ascender, это унифицирует работу с исходными данными
const GFONT_PARAMS = {
    name: "Fenerated",
    style: "Regular",
    unitsPerEm: 1000, // Размер площадки
    aw: 500,  // ширина всей площади 
    br: 40,   // ширина отступа c обоих сторон
    ts: 160,  // tickness штриха?
    as: 800,  // ascender - максимальная высота глифа - всё что выше отрежется
    ch: 700,  // capHeight из os2 - высота Uppercase символов
    xh: 500,  // xHeight  из os2 - высота Lovercase символов
    ds: -200, // descender - насколько низко опускаются элементы вниз - всё что ниже отрежется
};

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


let ALL_RECIEPT_MAP = ""; // для дебага без ввода
let USER_INPUT = []
let USER_INPUT_VAL;
let USER_INPUT_GLYPH = "";
let USER_APPEND_GLYPH = "";

let GENERIC_TABLE = [];

const GLYPH_RECIPES_TEXT = {}; // буфер
//const GLYPH_DELTAS = {};


function initRecipesText() {
    ALL_RECIEPT_MAP = "" // для дебага без ввода
    for (let sym in GLYPH_RECIPES) {
        GLYPH_RECIPES_TEXT[sym] = GLYPH_RECIPES[sym].toString();
        ALL_RECIEPT_MAP+=sym;
        //console.log("InitRecipesText", sym.charCodeAt(0))
    }
}

initRecipesText();

function updateUserMapInputs(from="main") {
    
    let fromMain = [];

    if(from==="main"){
        fromMain = [...mainLetterLine.value].filter(char => char !== ' ' && char !== '!');

        USER_INPUT_VAL = [...fromMain, ..."!"]; // c повторами для надписи
        USER_INPUT_GLYPH = [...new Set(fromMain), "!"].join(''); // Без повторов Для генерации?

        console.log("update fMain", USER_INPUT_GLYPH)
        return
    }

    if(from==="append"){
        const newValues = [...new Set([...oMultiAddInput.value].filter(char => char !== ' '))]; 

        for (const char of newValues) {

            // Проверяем: если такого символа еще НЕТ в массиве
            if (!addGlyphsArray.includes(char)) { // у нас ещё нет объектов на этом этапе
                //addGlyphsArray.push(char); 
            }
        }

        USER_APPEND_GLYPH = [...newValues];
        console.log("update fAppend", USER_APPEND_GLYPH)
        return
    }
    
}

function getTable(mode) {
    let map;
    
    if(USER_INPUT_GLYPH.length == 2 && USER_INPUT_GLYPH[0]==="?" ){ // Beta Debug
        map = Array.from(ALL_RECIEPT_MAP) || ["A"];
        console.log("special getTable", map);

    }else if(USER_INPUT_GLYPH.length>0){
        
        const fromStartWindow = Array.from(USER_INPUT_GLYPH);
        const fromAppendWindow = Array.from(USER_APPEND_GLYPH);

        if(addGlyphsArray.length > 0) {
            //if(!handleChange) console.log("gTableX1")
            map = [...fromStartWindow, ...addGlyphsArray];
            
        }else{
            //if(!handleChange) console.log("gTableX2")
            map = fromStartWindow;
        }
    }else{
        map = Array.from(ALL_RECIEPT_MAP) || ["A"];
        console.log("debug getTable", map);
    }
    
    
    return map;
}

let lastInputValue = ""; // Хранилище для отката

const mainLetterLine = document.getElementById("mainLetterLine"); // При старте
mainLetterLine.addEventListener('input', () => {
    lastInputValue = mainLetterLine.value; 
    updateUserMapInputs();

    updateElementsDatas();
    renderGlobalCanvas();
});

const oMultiAddInput = document.getElementById("oMultiAddInput"); // Из Append (multiline)
oMultiAddInput.addEventListener('input', () => {
    lastInputValue = oMultiAddInput.value; 
    updateUserMapInputs("append");
});


function focusAtEnd(el) {
    el.focus();
    const length = el.value.length;
    const index = 1;
    //el.setSelectionRange(length, length);
    el.setSelectionRange(index, index);
}

focusAtEnd(mainLetterLine);


///////////////////


function createProcedureGlypth() {
  if(!handleChange) console.log("CreateProcedureGlyph")
  
  if(currentProcedureGlyph) return;
  if (!currentItem) return;
  
  const recipeFn = GLYPH_RECIPES[currentItem.name];
  if (!recipeFn) return;

  currentProcedureGlyph = new ProcedureGlyph(currentItem.name, recipeFn, GFONT_PARAMS);
  //console.log(currentProcedureGlyph);
}

function updateProcedureGlyph() {

  if(!handleChange) console.log("updateProcedureGlyph");

  if (currentProcedureGlyph && currentItem) {
    const recipeFn = GLYPH_RECIPES[currentItem.name];
    
    if (recipeFn) {
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
    //console.log("RemoveProcedureGlyph");
  }
}



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

function generateGlyphPathOldNormal(char, recipes, p) { // с нормализацией (без Merge)
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

function generateGlyphPathWrap(char, recipes, p) {
    const tempGlyph = new ProcedureGlyph(char, recipes[char], p);
    const data = tempGlyph.exportData();
    return {
        path: data.path,
        width: data.width
    };
}

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

function getRecipeBodyFromSymbol(symbol, code) {
    // Если code передан (при загрузке), используем его. 
    // Если нет (старый вызов) — берем из глобального хранилища.
    const fullCode = code || GLYPH_RECIPES_TEXT[symbol];
    
    //if (!fullCode) return ""; // Защита от пустых данных

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
        //if(!handleChange) console.log("Recipe Found.");
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
                        //console.log("Alt Recipe for ", targetSymbol.charCodeAt(0), "found. Copied from", caseChar.charCodeAt(0));
                        foundRecipe = true;
                        bufferSymbol = caseChar; // Обновляем буфер символ

                        altCase = true;
                        break; // Выходим из цикла, так как нашли альтернативный символ с рецептом
                    }
                }

            }

        } else {
            if(!handleChange) console.log('case не найден в symbolCases');
            if(!handleChange) console.log("Recipe Not Found... GenerateBlank");
        }
        
    }

    if(foundRecipe){

        if (symbolReceiptTemplate.has(targetSymbol)) {
            template = true;
        }

        if(altCase){ // добавляем в рецепты как converted
            const bSymbol = bufferSymbol;

            const trimmedBody = getRecipeBodyFromSymbol(bSymbol);
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
        const comment = "// Recipe for " + targetSymbol + " not found. Creating blank template..." + "\n";
        const resultString = comment + trimmedBody;
        const codeString = `(p, self) => {\n${resultString}\n}`;

        symbolReceiptTemplate.add(targetSymbol);

        GLYPH_RECIPES_TEXT[targetSymbol] = codeString.trim();
        //GLYPH_RECIPES[targetSymbol] = eval(codeString);
        GLYPH_RECIPES[targetSymbol] = new Function("p", "self", resultString);
    }

    altCase = false; 

    const glyphData = generateGlyphPathWrap(targetSymbol, GLYPH_RECIPES, GFONT_PARAMS); //generateGlyphPath

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
        GENERIC_TABLE = getTable();
        
        //if(!handleChange) console.log("Финальная карта", GENERIC_TABLE);

        const generatedGlyphs = GENERIC_TABLE.map(symbol => {
            return creteGlyphPromProcedure(symbol);
        });

        const resultGlyphs = [...systemGlyphs, ...generatedGlyphs];

        //console.log("Данные перед созданием", GFONT_PARAMS);

        const newFamilyName = customParamInput?.familyName || GFONT_PARAMS.name;
        const newDesigner = customParamInput?.designer || "you...";

        font = new opentype.Font({
            familyName: newFamilyName,
            styleName: GFONT_PARAMS.style,
            unitsPerEm: GFONT_PARAMS.unitsPerEm,
            ascender: GFONT_PARAMS.as,
            descender: GFONT_PARAMS.ds,
            designer: newDesigner,
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

        //if(!handleChange) console.log("comp generated", generatedGlyphs);

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



function startProcessGenerate(skip=false) {

    generatedFont = true; 
    originalFormat = 'fe';
    document.title = "fenerate.";
    
    // Интерфейс
    closeStartWindow();

    if(skip==false){
        updateUserMapInputs();
    }else{
        // Подставляем для генерации при draganddrop
        updateUserMapInputs();
        USER_INPUT_GLYPH = Array.from(ALL_RECIEPT_MAP) // < по ним будет генерация
        console.log(USER_INPUT_GLYPH, USER_INPUT_VAL);
    }

    

    redrawAllProcedure(false, false); //(без рендера канваса и апдейт инфо)
    
    // Здесь уже всё сгенерирована значит можно заполнить канвас
    
    autoPushOnCanvas()

    openMainWindow()

    eProcedBtn.hidden = false;

    setupVariationControls();
}

// CODEMIRROR START (1763 - 1944)

// Need change currentGlyph to currentItem.name;

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

      if (stream.match(/\b(map|clamp|ceil|fit|lerp)\b/)) {
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

function getCanvasMousePosOrig(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function getCanvasMousePosAlt(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const wx = (typeof world !== 'undefined') ? mx - world.x : mx;
    const wy = (typeof world !== 'undefined') ? my - world.y : my;

    return { x: mx, y: my,
        wx: wx, wy: wy
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

function printFontInformation(variable, fullwrite = true, id = "") {
    
    const InfoSection = document.getElementById("InfoSection");
    if (!InfoSection) return;

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
        InfoSection.innerHTML = ""; 

        InfoSection.innerHTML = `
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
    const eCanvasTextInfo = document.getElementById("eCanvasTextInfo");

    if (!eCanvasTextInfo) return;

    eCanvasTextInfo.innerHTML = ""; 

    let glyph = currentItem?.glyph;
    
    if (!glyph){
         console.log("Глиф не определен", glyph);
        return
    }

    //console.log();
    let NameVariable = currentItem.componentFlag ? "ComponentName" : "GlyphName";

    eCanvasTextInfo.innerHTML = `
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

function updateLogIndices() {
    // 1. Сортируем копию массива по X (от меньшему к большего )
    // Если нужно «чем левее — тем меньше», поменяй на b.x - a.x
    const sorted = [...gCanvasObjects].sort((a, b) => a.x - b.x);

    // 2. Расставляем индексы по порядку
    sorted.forEach((obj, i) => {
        obj.logicalIndex = i;
    });

    console.log("LogIndices updated based on X position", gCanvasObjects.length);
}

function updateSplineLogic(mode="mouse", newBatch, pos){
    if(gCanvasMode !== "align" && !splineObject) return

    // 1. Сначала считаем базовые tOffset для новой пачки
    // (внутренний трекинг группы относительно её собственного центра)

    //splineObject.refreshPath()
    updateLogIndices(); // если добавили новых букв пересчитываем, чтобы они были в правильном порядке на сплайне
    updateTracking(gCanvasObjects, false); 

    // 2. Находим, куда именно на сплайне упала мышь (в пикселях)
    const mouseProgress = splineObject.getClosestProgress(pos.x, pos.y);
    const mousePosPx = mouseProgress * splineObject.totalLength;

    // 3. Устанавливаем customAlignOffset так, чтобы центр группы совпал с мышью
    newBatch.forEach(obj => {
        // Центр группы на сплайне — это mousePosPx
        // Позиция буквы внутри группы — это obj.tOffset
        // Нам нужно, чтобы (basePos + customOffset) равнялось желаемой точке
        
        const lineLen = splineObject.totalLength;
        const textLen = obj.tTotalWidth || 0;
        const centerOffsetPx = (lineLen / 2) - (textLen / 2);
        const halfWidth = (obj.item.glyph.advanceWidth * obj.scale * tracking) / 2;

        // Формула обратного вычисления оффсета:
        obj.customAlignOffset = mousePosPx - (centerOffsetPx + obj.tOffset + halfWidth);
    });
}

function updateTracking(objArray, align = true, pos ){
    if (!objArray || !objArray.length) return;

    //const tracking = 0.75;
    // swtich tempScale on obj.scale >> need recalc 

    let targetX,targetY;

    if(pos !== undefined){
         targetX = pos.x;
         targetY = pos.y;
     }else{
         targetX = globalCanvas.width / 2;
         targetY = globalCanvas.height / 2;
     }

    // 2. Общая ширина строки
    const totalTextWidth = objArray.reduce((acc, obj) => {
        const glyphAW = obj.item.glyph.advanceWidth ?? 500; 
        return acc + (glyphAW * obj.scale * tracking);
    }, 0);

    const startOffset = targetX - (totalTextWidth / 2);

    // 3. calc & bake totalTextWidth + локальных смещений
    // Данные для будущего использования на сплайне

    const posMap = {};
    let currentPos = 0;

    [...objArray]
        .sort((a, b) => a.logicalIndex - b.logicalIndex)
        .forEach((obj) => {
           
            obj.tOffset = currentPos; 
            obj.tTotalWidth = totalTextWidth;

            posMap[obj.logicalIndex] = currentPos;
            const glyphAW = obj.item.glyph.advanceWidth ?? 500;
            currentPos += (glyphAW * obj.scale * tracking);
        });

    // 4. Apply position
    if(align){
        objArray.forEach((obj) => {
            const xInGroup = posMap[obj.logicalIndex];
            if (xInGroup !== undefined) {
                const resultX = startOffset + xInGroup;
                obj.x = resultX;
                obj.y = targetY; 
            }
        });
    }
}

function getShapeStats() {
    if (!gCanvasObjects.length || !splineObject) return console.log("Нет объектов или сплайна");

    const lineLen = splineObject.totalLength;
    const textLen = gCanvasObjects[0]?.tTotalWidth || 0;
    const centerOffsetPx = (lineLen / 2) - (textLen / 2);

    console.log("=== СТАТИСТИКА СПЛАЙНА ===");
    console.log(`Длина сплайна: ${lineLen.toFixed(2)}px`);
    console.log(`Длина текста (из tTotalWidth): ${textLen.toFixed(2)}px`);
    console.log(`Базовый центр (centerOffsetPx): ${centerOffsetPx.toFixed(2)}px`);

    const stats = [...gCanvasObjects].sort((a, b) => a.logicalIndex - b.logicalIndex).map(obj => {
        const glyphAW = obj.item.glyph.advanceWidth ?? 500;
        const halfCharWidth = (glyphAW * obj.scale * tracking) / 2;
        

        const currentPosOnLine = centerOffsetPx + (obj.tOffset || 0) + halfCharWidth + (obj.customAlignOffset || 0);
        
        return {
            char: obj.item.name,
            index: obj.logicalIndex,
            tOffset: obj.tOffset?.toFixed(2),
            custom: obj.customAlignOffset?.toFixed(2),
            finalPos: currentPosOnLine.toFixed(2),
            progress: (currentPosOnLine / lineLen).toFixed(4)
        };
    });

    console.table(stats);
    return stats;
}

let shapeSequenceData = null;
function recordShapeSequence(debug=false) {
    // Вызов в oninput
    if (!gCanvasObjects.length || !splineObject) return;

    shapeSequenceData = gCanvasObjects.map((obj, index) => {
        const glyphAW = obj.item.glyph.advanceWidth ?? 500;
        const halfWidth = (glyphAW * obj.scale * tracking) / 2;
        
        return {
            originIdx: index,
            initialAbsPos: (obj.tOffset || 0) + (obj.customAlignOffset || 0) + halfWidth,
            initialAW: glyphAW
        };
    })
    .sort((a, b) => a.initialAbsPos - b.initialAbsPos);

    if(debug){
        const sequence = [...gCanvasObjects]
            .sort((a, b) => {
                const posA = (a.tOffset || 0) + (a.customAlignOffset || 0);
                const posB = (b.tOffset || 0) + (b.customAlignOffset || 0);
                return posA - posB;
            })
            .map(obj => obj.item.name).join(' → '); 
        console.log("Порядок на сплайне:", sequence);
    }

    return shapeSequenceData;
}

function updateShapeTracking() {
    if (!shapeSequenceData) return;

    // 1. Берем первую букву в последовательности как "якорь"
    const firstSnap = shapeSequenceData[0];
    const anchorPos = firstSnap.initialAbsPos;

    // 2. Вычисляем общий коэффициент изменения для этого кадра
    // Возьмем отношение текущей ширины к начальной (по первой букве или средней)
    const firstObj = gCanvasObjects[firstSnap.originIdx];
    const currentAW = firstObj.item.glyph.advanceWidth ?? 500;
    const ratio = currentAW / firstSnap.initialAW; 

    let totalShift = 0;
    
    shapeSequenceData.forEach((snap, i) => {
        const obj = gCanvasObjects[snap.originIdx];
        if (!obj) return;

        const curAW = obj.item.glyph.advanceWidth ?? 500;
        const halfWidth = (curAW * obj.scale * tracking) / 2;

        // --- ГЛАВНОЕ ИЗМЕНЕНИЕ ---
        // Вместо того чтобы просто прибавлять diff, мы масштабируем 
        // изначальную дистанцию от якоря до этой буквы
        const initialDistFromAnchor = snap.initialAbsPos - anchorPos;
        const scaledDistFromAnchor = initialDistFromAnchor * ratio;

        // Новая абсолютная позиция = Якорь + Масштабированная дистанция
        const newAbsPos = anchorPos + scaledDistFromAnchor;

        // Записываем в оффсет
        obj.customAlignOffset = newAbsPos - (obj.tOffset + halfWidth);
    });
}

function refreshCanvasObjects() {
    if(!gCanvasObjects) return console.log("Объектов нет")

    gCanvasObjects.forEach((obj, i) => {
        
        // Берем  индекс с объекта Canvas
        const sourceIndex = obj.aindex; //item.index 
        const sourceArray = obj.array; 
        const newItem = sourceArray[sourceIndex]; //

        if (newItem) { // refresh link
            obj.item = newItem;
            //if(!handleChange) console.log("Меняю", sourceIndex);
        } else {
            //if(!handleChange) console.log("Нового нет", sourceIndex);
        }
    });
    
    if(gCanvasMode === "free"){
        //updateTracking(gCanvasObjects);    
    }else if(gCanvasMode === "align"){
        updateShapeTracking();
    }

    renderGlobalCanvas();
}

function redrawAllProcedure(erender=true, updateInfo=true){ // ЭТО ПРОСТО КУСОК ГОВНА
    // Перерисовываем весь генеративный шрифт (hard rewrite)

    // Почему так? SVG в плитках строятся от команд шрифта (значит требуется шрифт)
    // А шрифт рисуется по рецептам
    if(!handleChange) console.log("redrawAllProcedure: erender = ", erender);
    if(!handleChange) console.log("redrawAllProc from:", arrayViewer.comp ? "comp" : "glyf");

    if (animationLetters.length > 0) {
        animationLetters.forEach((el, i) => {
            const symbol = el.symbol;
            const recipeFn = GLYPH_RECIPES[symbol];
            if (recipeFn) el.update(symbol, recipeFn, GFONT_PARAMS);
        });
    }

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

    if(globalCanvas && erender){
        refreshCanvasObjects();
    }

    redrawActiveGlyphInCanvas(erender);

    if(updateInfo){
        if(font || component_font){
            //if(!handleChange) console.log("PROMPROC", GFONT_PARAMS.style); 

        }
        
        printFontInformation(0, false, "info-name");
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
            { key: "ts", label: "ts < thickness", min: 2, max: 300 },
            { key: "aw", label: "aw < advanceWidth", min: 100, max: 1000 },
            { key: "br", label: "br < bearings", min: -50, max: 200 },
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

            // "onpointerdown "  работает и с мышкой, и с тачскринами

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
                
                if (!shapeSequenceData && gCanvasMode === "align") {
                    recordShapeSequence();
                }

                // Перерисовываем весь генеративный шрифт
                redrawAllProcedure()
                
            };

            input.onchange = (e) => {
                handleChange = false;

                shapeSequenceData = null; // Очищаем слепок
                redrawAllProcedure();
                //printFontInformation(0);
            }

            spControls.appendChild(row);
        });
        spControls.appendChild(pusher); // толкатель


        variableFont = false;
        printFontInformation(0);
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

        printFontInformation(0);
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

    printFontInformation(1);

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

        if (glyphEditorFlag === true) { renderEditorCanvas(); }
        
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
    removeProcedureGlyph();

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
    
    switchCmapViewer.hidden = true;
    
    eProcedBtn.hidden = true;

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

    if (glyphEditorFlag) renderEditorCanvas();    

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

    return { d, vBoxY, width, viewHeight, capHeight };
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



// Search Logic

function LangDetect(char) {
    if (!char || char === " ") return;

    // Проверяем через встроенные категории Unicode
    const isCyrillic = /\p{Script=Cyrl}/u.test(char);
    const isLatin = /\p{Script=Latn}/u.test(char);
    const isGreek = /\p{Script=Grek}/u.test(char);

    if (isCyrillic) console.log(`Символ: ${char} | Код: U+${char.codePointAt(0).toString(16).toUpperCase()} | Это КИРИЛЛИЦА`);
    if (isLatin) console.log(`Символ: ${char} | Код: U+${char.codePointAt(0).toString(16).toUpperCase()} | Это ЛАТИНИЦА`);
}

function detectScript(char) {
    if (!char || char.trim() === "") return null;

    const code = char.codePointAt(0).toString(16).toUpperCase();

    // helper чтобы не дублировать console.log
    const mlog = (char, code, type) => {
        //console.log(`Символ: ${char} | Код: U+${code} | Тип: ${type}`);    
        return type;
    };

    // 1. Быстрые проверки (самые частые)
    if (/\p{Script=Cyrl}/u.test(char)) return mlog(char, code, "Cyr..");
    if (/\p{Script=Latn}/u.test(char)) return mlog(char, code, "Latin");
    if (/\p{Script=Grek}/u.test(char)) return mlog(char, code, "Greek");

    // 2. Расширенный список
    const scripts = [
        "Arab","Hebr","Deva","Beng","Guru","Gujr","Orya",
        "Taml","Telu","Knda","Mlym","Sinh","Thai","Laoo","Mymr","Khmr",
        "Hang","Hani","Hira","Kana","Ethi","Geor","Armn"
    ];

    for (const script of scripts) {
        if (new RegExp(`\\p{Script=${script}}`, "u").test(char)) {
            return mlog(char, code, script);
        }
    }

    // 3. Общие символы (цифры, пунктуация и т.д.)
    if (/\p{Script=Zyyy}/u.test(char)) {
        if (/\p{Number}/u.test(char)) return mlog(char, code, "Number");
        if (/\p{Punctuation}/u.test(char)) return mlog(char, code, "Punc_?!.");
        if (/\p{Symbol}/u.test(char)) return mlog(char, code, "Symbol");
        return mlog(char, code, "Common");
    }

    // 4. Диакритика
    if (/\p{Script=Zinh}/u.test(char)) {
        return mlog(char, code, "Diacritic");
    }

    // 5. Неизвестное
    if (/\p{Script=Zzzz}/u.test(char)) {
        return mlog(char, code, "Unknown");
    }

    return mlog(char, code, "Unknown");
}

function checkScroll() {
    const searchWrapper = document.getElementById("searchWrapper");
    const scrollWrapper = document.getElementById("cmpaScrollWrapper");
    requestAnimationFrame(() => {
        const hasScroll = scrollWrapper.scrollHeight -20 > scrollWrapper.clientHeight;
        //searchWrapper.hidden = !hasScroll; 
        callSearchBar(true)
    });
}

function checkScrollNow(){
    const searchWrapper = document.getElementById("searchWrapper");
    const scrollWrapper = document.getElementById("cmpaScrollWrapper");
    const hasScroll =  scrollWrapper.scrollHeight -20 > scrollWrapper.clientHeight
    //searchWrapper.hidden = !hasScroll
    //console.log(scrollWrapper.scrollHeight -20, scrollWrapper.clientHeight, hasScroll)
    if(hasScroll){
        callSearchBar(true)
    }

}


let searchBarFlag = false;
let textInSearchBar = false;
function callSearchBar(action){ // true for open false for close

    const searchWrapper = document.getElementById("searchWrapper");

    if(action === undefined){
        searchWrapper.hidden = !searchWrapper.hidden;
    }else{
        searchWrapper.hidden = !action;
    }
    
    searchBarFlag = !searchWrapper.hidden;

    //console.log("searchBarFlag", searchBarFlag)
}

let extraTiles = []; // Массив для хранения плиток, открытых вручную
function hideSelTiles(mode, value) { 

    // Метод открытия\закрытия тайлов из Canvas
    // mode = "soloClick", "shiftClick", "unhideAll"
    // value = unicode[s]

    const tiles = document.querySelectorAll('#cmap .tile');
    const stringUnicodes = (Array.isArray(value) ? value : [value]).map(String);

    if (mode === "soloClick" && value) {
        if (textInSearchBar) {

            // логика: показываем плитку вместе с теми, что выбраны через searchBar
            // мы не трогаем searchBar, просто показываем новые плитки вместе c отобразившими searchBarом
            // + cкрываем предыдущие временные плитки, если их нет в поиске

            extraTiles.forEach(t => {
                if (!searchKeys.includes(t.dataset.name)) t.hidden = true;
            });
            extraTiles = [];

            const targetTile = document.querySelector(`#cmap .tile[data-unicode="${stringUnicodes[0]}"]`);
            if (targetTile) {
                targetTile.hidden = false;
                extraTiles.push(targetTile);
            }
            return;
        } else {
            // Обычный режим: скрываем всё, кроме одной
            tiles.forEach(tile => tile.hidden = !stringUnicodes.includes(tile.dataset.unicode));
        }
    }

    if (mode === "shiftClick" && value) {
        if (textInSearchBar) {
            // Добавляем новые плитки к текущим временным, не скрывая старые
            stringUnicodes.forEach(uni => {
                const targetTile = document.querySelector(`#cmap .tile[data-unicode="${uni}"]`);
                if (targetTile && targetTile.hidden) {
                    targetTile.hidden = false;
                    extraTiles.push(targetTile);
                }
            });
        } else {
            // Обычный режим: показываем только диапазон
            tiles.forEach(tile => tile.hidden = !stringUnicodes.includes(tile.dataset.unicode));
        }
    }

    if (mode === "unhideAll") {
        if (textInSearchBar) {
            // При клике в пустоту скрываем всё "лишнее", что не в поиске
            extraTiles.forEach(t => {
                if (!searchKeys.includes(t.dataset.name)) t.hidden = true;
            });
            extraTiles = [];
        } else {
            tiles.forEach(tile => tile.hidden = false);
            extraTiles = [];
        }
    }
}

let hideTilesFlag = false;
let unhideTilesFromSearch = false;
function hideAllTiles(option){  
    // Метод открытия\закрытия wrapper в котором лежат тайлы (отдельная кнопка)

    if (option !== undefined) {
        hideTilesFlag = option;
    } else {
        hideTilesFlag = !hideTilesFlag; 
    }

    const hideAllTilesBtn = document.getElementById("hideAllTilesBtn");
    const currentImage = hideAllTilesBtn.querySelector("img");

    currentImage.src = hideTilesFlag 
        ? "./assets/svg/triangleBlackFill.svg" 
        : "./assets/svg/triangleWhiteFill.svg";

    const scrollWrapper = document.getElementById("cmpaScrollWrapper");
    scrollWrapper.hidden = hideTilesFlag;
    
    console.log("hideAllTiles", hideTilesFlag)

    if(hideTilesFlag){
       callSearchBar(true); 
    }else{
        if(!unhideTilesFromSearch){
            const tiles = document.querySelectorAll('#cmap .tile');
            tiles.forEach(tile => tile.hidden = false);

            //callSearchBar(false); 
        }
    }
}

let searchKeys = [];
function updateSearchBar(value){ // в value сейчас приходит только unicode из другой ветки
    
    const searchBar = document.getElementById("searchBar");

    /* это очень плохо убрано
    if (value) {
        const newChar = String.fromCharCode(value);
        
        // 1. Игнорируем пробелы
        if (newChar.trim() === "") return; 

        let currentValue = searchBar.value;

        // 2. Удаляем символ и схлопываем лишние пробелы
        searchBar.value = currentValue
            .split(newChar).join('')      // Удаляем символ
            .replace(/\s\s+/g, ' ')       // Заменяем два и более пробелов на один
            .trimStart()                  // Убираем пробел в начале, если он там возник
            + newChar;                    // Добавляем символ в конец
    }
    */
    
    const lastchar = searchBar.value.slice(-1);
    const out = document.getElementById("sLogout");
    
    let rawValue = searchBar.value.trim();
    
    const tiles = document.querySelectorAll('#cmap .tile');
    
    // 1. Если пусто ввод пустой - показываем плитки
    if (!rawValue) {
        textInSearchBar = false;

        out.textContent = ""; // очистка input
        tiles.forEach(tile => tile.hidden = false);

        if(unhideTilesFromSearch){
           unhideTilesFromSearch = false
           hideAllTiles(true) // закрывает враппер, как был
        } 

        return;
    }else{
        textInSearchBar = true;

        if(hideTilesFlag && !unhideTilesFromSearch){
            unhideTilesFromSearch = true
            hideAllTiles(false) // открывает враппер, но с флагом
        }
    }

    out.textContent = detectScript(lastchar);

    const words = rawValue.split(/\s+/).filter(k => k);

    // 2. Создаём массив уникальных символов из всех слов
    const charKeys = Array.from(new Set(words.join("").split("")));

    // 3. Объединяем слова + символы для поиска
    searchKeys = [...words, ...charKeys];

    console.log("ResultSearch", searchKeys);

    const searchUnicodes = searchKeys.map(key => {
        if (key.length > 1) {
            return isNaN(key) ? key : key.toString(); 
        }
        return String(key.charCodeAt(0));
    });

    tiles.forEach(tile => {
        const tileName = tile.dataset.name || "";
        const tileUnicode = tile.dataset.unicode || "";

        const isMatch = searchKeys.includes(tileName) || // Поиск по имени ("exclam")
                        searchUnicodes.includes(tileUnicode); // Поиск по коду (33)

        tile.hidden = !isMatch;
    });
}

const searchBar = document.getElementById("searchBar");

searchBar.addEventListener('input', () => {
    updateSearchBar()
});



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

    selectedTiles.length = 0;
    tempElement = null;

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
    checkScrollNow();
    //updateSearchBar();
}


//// Add Glyph [s] and Add Component Panel Section

function createBlankPath(){
    const myPath = new opentype.Path();
    myPath.moveTo(100, 100);
    myPath.lineTo(100, 400);
    myPath.lineTo(400, 100);
    myPath.closePath();
    return myPath
}

function appendGraphOject(mutlimode=false, inputName="", closeAfter=true) {
    
    if(bezierMode) callBezierMode(false, false); // отключаем bezier с сохранением

    console.log("appendGraphOject == START");
    
    //let templateFlag;
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
        return false
    };

    let newName;
    const oNameInput = document.getElementById("oNameInput");
    
    if(!mutlimode){
        newName = oNameInput?.value;
        if(newName==="") return addComment("EnterName")
    }else{
        newName = inputName;
        if(newName==="") return true // skip
    }

    const targetArray = currentDataArray;
    const foundName = targetArray.find(item => item.name === newName);

    const newIndex = targetArray.length;
    let resultIndex = newIndex;

    if(arrayViewer.glyf){

        if(!mutlimode){
            if(foundName) return addComment(`Глиф с этим "name" уже существует`)

            const oUnicodeInput = document.getElementById("oUnicodeInput");
            ucode = oUnicodeInput?.value;
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

        }else{
            if(foundName) return true // skip
            ucode = newName.charCodeAt(0);
        }

        //const lastElement = glyphArray.length - 1;
        //const lastIndex = glyphArray[lastElement].index;
        //const newIndex = lastIndex+1;
        targetFont = font;
        
    }else if(arrayViewer.comp){
        
        if(mutlimode) return addComment(`Компоненты не поддерживают multimode`)

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
        advW = GFONT_PARAMS.aw || 400;
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

    if(closeAfter){
        const oAddElementBlock = document.getElementById("oAddElementBlock");
        oAddElementBlock.hidden = true;

        if(!mutlimode){
            oUnicodeInput.value = "";
        }

        const oNameInput = document.getElementById("oNameInput");   
        oNameInput.value = "";

        createCMapPlusButton(); // двигает кнопку в конец

        // Обновляет в EditorView
        redrawActiveGlyphInCanvas(true);
        updateObjectStats();

    }

    console.log("appendGraphOject == END", newName);
}

function addRequirement(key, button, charArray) {
    setupFlags[key] = !setupFlags[key];
    button.classList.toggle("active", setupFlags[key]);

    if (setupFlags[key]) {
        let currentChars = oMultiAddInput.value.split('');
        let newChars = [...currentChars, ...charArray];
        const cleanString = [...new Set(newChars)].join('');
        oMultiAddInput.value = cleanString;
        USER_APPEND_GLYPH = cleanString;
    } else {
        refreshFromScratch(); 
    }
}

function refreshFromScratch() {
    let result = (setupFlags.lang === "RU") ? [...UCASE_RU] : [...UCASE_EN];
    
    if (setupFlags.lowercase) result.push(...(setupFlags.lang === "RU" ? LCASE_RU : LCASE_EN));
    if (setupFlags.numbers) result.push(...NUMBERS);
    if (setupFlags.symbols) result.push(...SYMBOLS);

    oMultiAddInput.value = [...new Set(result)].join('');
    
    updateUserMapInputs("append");
}

const SMART_CLEANUP = true;
function toggleAndAdd(key, button, charArray) {
    if (!setupFlags[key]) {
        lastInputValue = oMultiAddInput.value; 
        oMultiAddInput.value += charArray.join('');
    } 
    else {

        if (SMART_CLEANUP) {
            const charsToRemove = new Set(charArray);
            oMultiAddInput.value = oMultiAddInput.value
                .split('')
                .filter(char => !charsToRemove.has(char))
                .join('');
        } else {
            oMultiAddInput.value = lastInputValue;
        }
    }

    setupFlags[key] = !setupFlags[key];
    button.classList.toggle("active", setupFlags[key]);

    updateUserMapInputs("append");
}

function resetToLanguageBase() {
    let base = (setupFlags.lang === "RU") ? UCASE_RU : UCASE_EN;
    
    [symbolsBtn, numbersBtn, lowercaseBtn].forEach(btn => btn.classList.remove("active"));
    
    setupFlags.symbols = false;
    setupFlags.numbers = false;
    setupFlags.lowercase = false;

    const cleanString = base.join('');
    oMultiAddInput.value = cleanString;
    USER_APPEND_GLYPH = cleanString;
    updateUserMapInputs("append");

}

//resetToLanguageBase();

const langSelect = document.getElementById('languageSelect');
const lowercaseBtn = document.getElementById("oAddLovercases");
const numbersBtn = document.getElementById("oAddNumbers");
const symbolsBtn = document.getElementById("oAddSymbols");

langSelect.addEventListener('change', (event) => {
    setupFlags.lang = event.target.value; 
    resetToLanguageBase();
});

lowercaseBtn.onclick = () => {
    const chars = (setupFlags.lang === "RU") ? LCASE_RU : LCASE_EN;
    toggleAndAdd('lowercase', lowercaseBtn, chars);
};

numbersBtn.onclick = () => { toggleAndAdd('numbers', numbersBtn, NUMBERS);
};

symbolsBtn.onclick = () => { toggleAndAdd('symbols', symbolsBtn, SYMBOLS);
};


let addPlusMultiMode = false;
function funcPlusCMapBtn(){
    const oAddElementBlock = document.getElementById("oAddElementBlock"); 
    const pushBtn = document.getElementById("pushBtn");
    const cancelPushBtn = document.getElementById("cancelPushBtn");
    const oCommentLine = document.getElementById("oCommentLine");

    const allObjectFlag = oAddElementBlock && pushBtn && cancelPushBtn && oCommentLine;
    if (!allObjectFlag) return;

    // Inside Elements
    
    const oPanelLabel = document.getElementById("oPanelLabel");

    const oNameLine = document.getElementById("oNameLine");
    const oNameLabel = document.getElementById("oNameLabel");
    const oNameInput = document.getElementById("oNameInput");

    const oTypeSelectLine = document.getElementById("oTypeSelectLine");
    const oTypeSelect = document.getElementById("oTypeSelect");

    const oUnicodeLine = document.getElementById("oUnicodeLine");
    const oUnicodeInput = document.getElementById("oUnicodeInput");

    const oMultiSettingBtnsLine = document.getElementById("oMultiSettingBtnsLine");
    const oMultiLine = document.getElementById("oMultiLine");
    const oMultiAddInput = document.getElementById("oMultiAddInput");

    console.log(arrayViewer.bcurrent);

    addPlusMultiMode = false;
    oNameLine.hidden = false
    oUnicodeLine.hidden = false
    oMultiSettingBtnsLine.hidden = true
    oMultiLine.hidden = true
    oMultiAddInput.value = "";
    [symbolsBtn, numbersBtn, lowercaseBtn].forEach(btn => btn.classList.remove("active"));

    if (arrayViewer.bcurrent !== arrayViewer.bprevious) {
        oNameInput.value = "";
        oUnicodeInput.value = "";
    }

    if(arrayViewer.glyf){ // Add Glyph Process (Global Variable)

        //oPanelLabel.textContent = "Create mew glyph....";
        oPanelLabel.innerHTML = `Create mew glyph <button id="oMultiLineBtn" class="pbutton">s...</button>`;

        oNameLabel.textContent = "GlyphName";

        if(oUnicodeLine){ oUnicodeLine.hidden = false; }
        if(oTypeSelectLine){ oTypeSelectLine.hidden = true; }
        
        const switchMode = document.getElementById("oMultiLineBtn");

        switchMode.onclick = () => {
            addPlusMultiMode = !addPlusMultiMode;
            
            if(addPlusMultiMode){
                oNameLine.hidden = true
                oUnicodeLine.hidden = true
                oMultiSettingBtnsLine.hidden = false
                oMultiLine.hidden = false
                switchMode.classList.add("active")
                oMultiAddInput.focus()
            }else{
                oNameLine.hidden = false
                oUnicodeLine.hidden = false
                oMultiSettingBtnsLine.hidden = true
                oMultiLine.hidden = true
                switchMode.classList.remove("active")
                oNameInput.focus()
            }

        };

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
    
    pushBtn.onclick = () => {
       if(addPlusMultiMode){
            updateUserMapInputs("append");

            lastIndex = USER_APPEND_GLYPH.length - 1;

            USER_APPEND_GLYPH.forEach((newName, index) => {
                console.log(`Символ №${index}: ${newName}`); 
                
                closeFlag = (lastIndex === index);
                appendGraphOject(true, newName, closeFlag);
            });

       }else{
           appendGraphOject();

       }
        
    };

    const cancelPushFunc = () => {
        oAddElementBlock.hidden = true;
    };

    cancelPushBtn.onclick = () => cancelPushFunc();

    // OpenWindow 
    oCommentLine.innerHTML = "";
    oCommentLine.hidden = true;

    oAddElementBlock.hidden = false;

    oNameInput.focus()
}

function createCMapPlusButton() {
    const cmap = document.getElementById('cmap');
    if (!cmap) return

    const existingBtn = cmap.querySelector('.PlusCMapButton');

    if (!existingBtn) { // > create

        //if(!handleChange) console.log("Пересоздаю кнопку");

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

// 1. ПРОВЕРКА: proxyContainer создаем ОДИН РАЗ вне функции createTile
const proxyContainer = document.getElementById('drag-proxy') || (function() {
    const el = document.createElement('div');
    el.id = 'drag-proxy';
    Object.assign(el.style, { position: 'fixed', left: '-1000px', top: '-1000px', pointerEvents: 'none' });
    document.body.appendChild(el);
    return el;
})();

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
    tile.dataset.unicode = item.unicode;
    tile.dataset.arrayIndex = arrayIndex;// Позиция в массиве
    //tile.dataset.fontIndex = item.findex; // Индекс в шрифте (напр. 42)

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

            //if(!handleChange) console.log("Auto-selected firstTile:", arrayViewer);


        }else if( lastIndex !== null && lastIndex === arrayIndex ){ 
            
            currentItemIndex = arrayIndex;

            tile.classList.add("active");
            tempElement = tile;
            
            //if(!handleChange) console.log("Select From Temp");
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
    /*
    tile.ondragstart = (e) => {
        //console.log("ПРЕ", item.componentFlag);
        tile.classList.add('selected'); 
        e.dataTransfer.setData("componentFlag", item.componentFlag); 
        e.dataTransfer.setData("arrayIndex", arrayIndex); // создать специальный id?
    };

    tile.ondragend = (e) => {
        // Вызывается, когда перетаскивание завершено (успешно или нет)
        tile.classList.remove('selected'); 
        console.log("Перетаскивание завершено для индекса:", arrayIndex);
    };
    */

    tile.ondragstart = (e) => {

        // Проверяем, входит ли текущая плитка в выделение
        if (!selectedTiles.includes(tile)) {
            selectedTiles.forEach(t => t.classList.remove('selected'));
            selectedTiles.length = 0;
            selectedTiles.push(tile);
            tile.classList.add('selected');
        }

        const indices = selectedTiles.map(t => t.dataset.arrayIndex).join(',');
        e.dataTransfer.setData("arrayIndices", indices);
        e.dataTransfer.setData("arrayIndex", tile.dataset.arrayIndex);        

        proxyContainer.innerHTML = ''; 
        const stack = document.createElement('div');
        stack.style.position = 'relative';

        const itemsToShow = [...selectedTiles].slice(-3).reverse();
        
        itemsToShow.forEach((sourceTile, index) => {
            const clone = sourceTile.cloneNode(true);
            
            clone.style.position = 'absolute';
            clone.style.top = (index * -6) + 'px';   
            clone.style.left = (index * 6) + 'px';  
            clone.style.zIndex = 100 - index;
            clone.style.opacity = index === 0 ? "1" : "0.7"; 
            clone.style.transform = `scale(${1 - index * 0.05})`; 

            stack.appendChild(clone);
        });

        // Бейдж со счетчиком (всегда поверх всех)
        if (selectedTiles.length > 1) {
            const badge = document.createElement('div');
            badge.className = 'ghost-badge';
            badge.innerText = selectedTiles.length;
            badge.style.zIndex = 200;
            badge.style.right = "-15px";
            badge.style.top = "-15px";
            stack.appendChild(badge);
        }

        proxyContainer.appendChild(stack);
        
        // Центрируем захват по первой (верхней) плитке
        let offsetX = selectedTiles.length > 1 ? 70 : 50; 
        let offsetY = selectedTiles.length > 1 ? 45 : 45; 

        e.dataTransfer.setDragImage(stack, offsetX, offsetY);

        //selectedTiles.forEach(t => t.classList.remove('selected'));
    };

    tile.ondragend = (e) => {
        document.body.classList.remove("drag");
        selectedTiles.forEach(t => t.classList.remove('selected'));
        selectedTiles.length = 0; 
        proxyContainer.innerHTML = ''; 
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

    renderGlobalCanvas();
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
        InfoSection.innerHTML = `
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

// glyph params for CanvasTransformation (EditorCanvas)
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

    let as = null
    let ds = null;
    let ch = null;
    let xh = null;

    if (targetGlyph) {
        const glyphWidth = (targetGlyph.advanceWidth || upm) * scale; //glyphWidth

        const myCustom = GFONT_PARAMS;

        const glyphAscender = (font.ascender * scale) || (myCustom.as * scale);
        const glyphDescender = (font.descender * scale) || (myCustom.ds * scale);

        x = ( (canvas.width - glyphWidth) / 2 ) + panX;
        width = glyphWidth;
        
        const tables = font?.tables?.os2 ? font.tables.os2 : null;
        
        let glyphCapHeight, glyphXHeight;

        if(tables){
            glyphCapHeight = tables.sCapHeight ? (tables.sCapHeight * scale) : null;
            glyphXHeight   = tables.sxHeight ? (tables.sxHeight * scale) : null;
        }

        as = baseline - glyphAscender;
        ds = baseline - glyphDescender;

        ch = glyphCapHeight ? baseline - glyphCapHeight : null;
        xh = glyphXHeight ? baseline - glyphXHeight : null;

        //console.log()

        //console.log( as, ds, ch, xh );
    }

    return { renderSize, x, baseline,  yCenter, width, scale, zoom, as, ds, ch, xh };
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

// Convertion glyph (from opentype.js) cmds to editableContours for glyph Editor (structWrapper)
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
        renderGlobalCanvas();

        // Опционально: предотвращаем вставку текста в другие поля, если они в фокусе
        e.preventDefault(); 
    }
});


// Отрисовка глифа в Canvas

function redrawActiveGlyphInCanvas(erender = true) { // Под Editor Canvas

    let glyph;

    if(currentDataArray && currentItemIndex !== null){
        
        //console.log("ARRAY:", currentDataArray === compArray ? "COMP" : "GLYF");
        currentItem = currentDataArray[currentItemIndex];
        currentGlyph = currentItem?.glyph;
     
        if(!handleChange) console.log("redrawActiveGlyphInCanvas:"  ); //currentGlyph
    
    }else{
        if(!handleChange)  console.log("ARRAY:", currentDataArray ? "TRUE" : "FALSE");
        if(!handleChange)  console.log("INDEX:", currentItemIndex );
    
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
            currentGlyph = glyph;
            console.log("Transformed");
        }
    }

    // REMOVE Убрал вызов build (скорее всего лишний)

    if(currentProcedureGlyph){
        updateProcedureGlyph();
        //if(!handleChange) console.log("redrawActivePROCInCanvas A")
    }else{
        if(generatedFont){
            createProcedureGlypth();
 
            //if(!handleChange) console.log("redrawActivePROCInCanvas B")
        }
    }

    if(editMode){
        console.log("Draw from Bezier Mode");
        const glyphCommands = glyph?.path?.commands ?? []; // currentGlyph
        currentContours = buildEditableContours(glyphCommands);
    }

    if(erender) renderEditorCanvas();  

    
    renderGlobalCanvas();

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

let fullHide = false;
let firstSkip = false;
let totalSkip = false;
let hardTurnSpline = false;

function updateGlobalAlphas() {
    let changed = false;
    const step = 0.018; // Скорость затухания

    const mainComment = document.getElementById("mainComment");

    // 1. main subline (затухает после действия user) 
    if (!mSublineActive && !mSublineComplete) { // Работаем, пока флаг в состоянии true
        const targetSubline = 0;

        if (Math.abs(mSublineAlpha - targetSubline) > 0.01) {
            // Двигаем к цели
            mSublineAlpha += (targetSubline > mSublineAlpha) ? step : -step;
            changed = true;
        } else {
            // Когда дошли до цели
            mSublineAlpha = targetSubline;
            mSublineComplete = true;
        }
        
        

        if (mainComment)mainComment.style.opacity = mSublineAlpha;
        startHeader.style.opacity = mSublineAlpha; //newOpacity.toString();
    }                
////


    if(!splineExampleComplete){

        const splineStep = 0.01; //75 speed
        const splineExampleTargetAnim = splineExampleActive ? 1 : 0;

        // Проверяем, нужно ли еще двигать значение
        if (Math.abs(splineExampleAnim - splineExampleTargetAnim) > 0.01) {
            splineExampleAnim += (splineExampleTargetAnim > splineExampleAnim) ? splineStep : -splineStep;
            changed = true;

            if(splineExampleAnim > .4){
               splineDownActive = true; // Запускаем смещение
            }

            

        } else if (splineExampleAnim !== splineExampleTargetAnim) {
            // Фиксируем финальное значение
            splineExampleAnim = splineExampleTargetAnim;
            changed = true; 
            
            if (splineExampleAnim === 1) {
                splineExampleComplete = true;
            }
        }
    }

    if(!splineDownComplete){

        const splineStep = 0.007; //0.01
        const splineDownTargetAnim = splineDownActive ? 1 : 0;

        // Проверяем, нужно ли еще двигать значение
        if (Math.abs(splineDownAnim - splineDownTargetAnim) > 0.01) {
            splineDownAnim += (splineDownTargetAnim > splineDownAnim) ? splineStep : -splineStep;
            changed = true;

            if(!splineDownComplete){
                

                const startHeader = document.getElementById("startHeader");
                let newTitle = `It's a Сanvas?`;
                
                if (startHeader){
                    // Обновляем DOM только если текст реально изменился
                    if (startHeader.innerHTML !== newTitle) {
                        startHeader.innerHTML = newTitle;
                    }

                    startHeader.style.opacity = fit(splineDownAnim, 0.4, 0.9, 0.0, 1.0);
                }

                if (mainComment){
                    mainComment.style.opacity = fit(splineDownAnim, 0.0, 0.3, 0.8, 0.0);
                    if (mainComment.style.opacity < 0.05) {
                        mainComment.style.color = "rgba(0, 0, 0, 0.0)";
                    }
                }

                const easedProgress = easeCustom(splineDownAnim); //0 - 1
                splineObject.epts[1][1] = initHeightSpline + (easedProgress * 140.0); //140 куда опустится

                splineObject.refreshPath();

            }



        } else if (splineDownAnim !== splineDownTargetAnim) {
            // Фиксируем финальное значение
            splineDownAnim = splineDownTargetAnim;
            changed = true; 
            
            if (splineExampleAnim === 1) {
                splineDownComplete = true;
            }
        }
    }


///
    const stepm = 0.015; //75
    if (!startwindow ) { // Работаем, пока флаг в состоянии true
        if(!totalSkip){

            if(!firstSkip){
                firstSkip = true;
                startCloseAnim = 0.7;
            }
            const targetAnimation = 0;

            if (Math.abs(startCloseAnim - targetAnimation) > 0.01) {
                startCloseAnim += (targetAnimation > startCloseAnim) ? stepm : -stepm;
                changed = true;

                const startHeader = document.getElementById("startHeader");
                startHeader.style.opacity = startCloseAnim.toString();

            } else {
                startCloseAnim = targetAnimation;
            }


        }
        

    }

    /*
    const startTextRow = document.getElementById("startTextRow");
    startTextRow.style.opacity = startCloseAnim;     
    */
    

    const stepb = 0.0075; //75

 
    if (!startwindow) { // Работаем, пока флаг в состоянии true
        const targetAnimation = 1;

        if (Math.abs(charAnim - targetAnimation) > 0.01) {
            // Двигаем к цели
            charAnim += (targetAnimation > charAnim) ? stepb : -stepb;
            changed = true; 

            const gCanvasRowBtns = document.getElementById("gCanvasRowBtns");
            const gCanvasLbBtns = document.getElementById("gCanvasLbBtns");
            const mainWindow = document.getElementById("mainWindow");

            const startDescriptor = document.getElementById("startDescriptor");

            const opacityValue = fit(charAnim, 0.0, 0.8, 0.0, 1.0);

            gCanvasLbBtns.style.opacity = opacityValue.toString();
            gCanvasRowBtns.style.opacity = opacityValue.toString();

            const opacityMenu = fit(charAnim, 0.0, 0.8 , 0.0, 1.0);
            mainWindow.style.opacity = opacityMenu.toString();
            
            const opacityDescr = fit(charAnim, 0.0, 0.8 , 1.0, 0.0);

            startDescriptor.style.opacity = opacityDescr.toString();


            // Вычисляем нужное состояние один раз
            let newTitle = "fenerate";
            
            if (charAnim > 0.9) newTitle = "fenerate!";
            else if (charAnim > 0.6) newTitle = "fenerate.";
            else if (charAnim > 0.4) newTitle = "fenerate...";
            else if (charAnim > 0.2) newTitle = "fenerate..";
            else if (charAnim > 0.0) newTitle = "fenerate.";

            // Обновляем DOM только если текст реально изменился
            if (document.title !== newTitle) {
                document.title = newTitle;
            }
                    

        } else {
            // Когда дошли до цели
            charAnim = targetAnimation;
            //animationLetters.length = 0;

            const gCanvasRowBtns = document.getElementById("gCanvasRowBtns");
            const gCanvasLbBtns = document.getElementById("gCanvasLbBtns");
            const mainWindow = document.getElementById("topMenu");

            const startDescriptor = document.getElementById("startDescriptor");
            startDescriptor.hidden = true;

            gCanvasLbBtns.style.opacity = "1.0";
            gCanvasRowBtns.style.opacity = "1.0";
            mainWindow.style.opacity = "1.0";

            const finalTitle = generatedFont ? "fenerate!" : "edit!";
            if (document.title !== finalTitle) {
                document.title = finalTitle;
            }
            

            if (generatedFont && !hardTurnSpline) {
                hardTurnSpline = true;
                
                // Запуск через 1000 миллисекунд (1 секунда)
                setTimeout(() => {
                    callSwitchCanvasMode();
                }, 800);
            }
        }
    }    



    if (!fullHide && (mHeaderComplete && mSublineComplete) ) {
        //console.log("Оба элемента погасли");
        fullHide = true;
        startWindow.hidden = true;
        // onAllFadedOut(); 
    }

    // Если что-то изменилось, запрашиваем новый кадр отрисовки
    if (changed) {
        if (fadeRequestSample) cancelAnimationFrame(fadeRequestSample);
        fadeRequestSample = requestAnimationFrame(renderGlobalCanvas);
    } else {
        fadeRequestSample = null;
    }
}

function updateAlphasEditor() {
    let changed = false;
    const step = 0.02; // Скорость затухания
    const stepb = 0.01; // Скорость затухания

    // 2. Special Message (затухает после отпускания мыши)
    if (!isMouseDown && specialAlpha > 0) {
        specialAlpha -= step;
        if (specialAlpha < 0) specialAlpha = 0;
        changed = true;
    }

    // 3. Paste Message (зависит от внешнего флага pasteMessageActive)
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
    drawMultiLineText(ctx, linesb, cx, 455, 32);
    ctx.restore();
}

function drawShiftMessage() {

}

function messageOnCanvas(ctx, text, mode ="simple") {
    let cx = ctx.canvas.width / 2;
    let cy = ctx.canvas.height / 2;

    ctx.fillStyle="#666";
    ctx.font = "bold 24px sans-serif";

    ctx.textAlign = "center"; 

    if(mode==="simple") {};
    if(mode==="snap"){
        cy = 80;
        cx = ctx.canvas.width - 50;
        ctx.textAlign = "right"; 
    }
    if(mode==="delta"){
        ctx.font = "24px sans-serif";
        ctx.fillStyle="#d4d421"; //yellow
        cy = 80;
    }


    
    ctx.textBaseline = "middle"; 

    ctx.fillText(text, cx, cy);
}


let guidelines = []; // Глобальный массив или часть стейта
let draggedGuide = null;


function drawLineWithLabel(pos, offsetX, widthX, isVertical = false, label = "", color = "666", dash = false, labelAlt = "") {
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

    ctx.setLineDash([]); // Убираем пунктир для текста
    
    if (label === "RSB") {
        ctx.filter = "brightness(1.3) saturate(0.9)";
    }

    // Отрисовка текста
    if(!displayObjectInfo){
        if (label !== "Baseline (Lock)" && label !== "RSB") {
            return ctx.restore();  
        } 

        if(label === "RSB"){
            label = "advanceWidth"
        }
    } 


    if (isVertical) {
        ctx.textAlign = "left";
    

        if(displayObjectInfo && label === "RSB"){
            label = "RSB / advanceWidth"
            ctx.fillText(label, pos + 25, canvas.height - 20);
        }else if( label === "LSB"){
            ctx.textAlign = "right";
            ctx.fillText(label, pos - 35, canvas.height - 20);
        }else{
            ctx.fillText(label, pos + 25, canvas.height - 20);
        }
        
        
        if (labelAlt) {
            ctx.textAlign = "right";
            ctx.fillText(labelAlt, pos - 300, canvas.height - 10);
        }

    } else {
        
        let myOffset;

        if(label === "Ascender" || label ==="Descender"){
           ctx.textAlign = "right"; 
           myOffset = canvas.width-50 ; //offsetX+widthX+50;
        }else{
           ctx.textAlign = "right";
           myOffset = offsetX-35;
        }
        
        
        ctx.fillText(label, myOffset, pos - 4);

        if (labelAlt) {
            //console.log("Orange Accept");
            ctx.textAlign = "right";
            ctx.fillText(labelAlt, offsetX-35, pos - 4);
        }
    }
    ctx.filter = "none"; // Обязательно сбрасываем!
    ctx.restore();
}

let fontOverrides = {
    ascender: 0,
    sCapHeight: 0,
    sxHeight: 0,
    descender: 0,
    rsbDelta: 0 // для изменения ширины (RSB)
};




function updateParamsFromCanvas(label, value) {
    
    const floorVal = Math.ceil(value);
    const clampDesc = clamp(floorVal, -1000, -1); // des only negative

    if (generatedFont){

        const clampValue = clamp(floorVal, 0, 1000); // 
        

        // Обновляем параметры GFONT_PARAMS

        if (typeof manualUpdateControlValue === "function") {

            if (label === "RSB") manualUpdateControlValue("aw", clampValue, true); // c рендером или без?
            if (label === "CapHeight") manualUpdateControlValue("ch", clampValue, true);
            if (label === "X-Height") manualUpdateControlValue("xh", clampValue, true);

            if (label === "Ascender") manualUpdateControlValue("as", clampValue, true);

            if (label === "Descender") manualUpdateControlValue("ds", clampDesc, true);
        }
    
    }else if (!variableFont){

        if(!font) return

        if (label === "RSB"){ // advancedWidth уникальный для глифа

            let glyph = currentItem?.glyph;
            if (!glyph) return console.log("Глиф не определен", glyph);
            
            glyph.advanceWidth = floorVal;
            
            // Перерисовываем текущий
            commitGlyphEdits(); // внутри updateCurrentTile
            redrawActiveGlyphInCanvas();

        } else { // ascender и descender общие

            // Также обновляем текущий объект font (для отрисовщика)

            if (label === "Ascender") font.ascender = floorVal;
            if (label === "Descender") font.descender = clampDesc;

            //if (fontOverrides.ascender) font.ascender = fontOverrides.ascender;
            //if (fontOverrides.descender) font.descender = fontOverrides.descender;
            //if (fontOverrides.sCapHeight) font.tables.os2.sCapHeight = fontOverrides.sCapHeight;
            //if (fontOverrides.sxHeight) font.tables.os2.sxHeight = fontOverrides.sxHeight;

            const tables = font?.tables?.os2 ? font.tables.os2 : null;

            if (font.tables?.os2) {

                if(isSameHeightTemp && tables.sCapHeight && (label === "Ascender"  ) ){  //|| label === "CapHeight"
                    tables.sCapHeight = floorVal; 
                }

                if (label === "CapHeight") tables.sCapHeight = floorVal;
                if (label === "X-Height") tables.sxHeight = floorVal;
            }

            // Перерисовываем всё содержимое
            updateCMAP("glyph", true);
        }
        
    }
    
    console.log("Метрики шрифта обновлены!");
}


function updateGuidelines(params) {
    if (!displayGuide) return;
    
    let targetFont;
    
    const compflag = currentItem?.componentFlag;

    if( arrayViewer.comp){
        targetFont = component_font; //buffer
    }
    else if ( arrayViewer.glyf){
        targetFont = font; // general
    }

    if(!targetFont) return


    const { x, baseline, width, scale, as, ds, ch, xh} = params;
    guidelines = []; // Очищаем

    // pos, vert, label, color, dash, labelAlt
    const addGuide = (pos, offsetX, vert = false, drag = false, label, color, dash = false, labelAlt) => {
        if (pos === null || isNaN(pos)) return;
        guidelines.push({ pos, offsetX, vert, drag, 
            label, color, dash,labelAlt, 
            cursor: vert ? "e-resize" : "s-resize" // "col-resize" : "row-resize" // глючат
        });
    };
    
    let ascY, descY, capY, xHeightY; 
    
    if(ch){
        const curCapHeight = (fontOverrides.sCapHeight) ? fontOverrides.sCapHeight * scale : ch;
        capY = (fontOverrides.sCapHeight !== 0) 
            ? fontOverrides.sCapHeight  // Это абсолютный my из mousemove
            : ch;  // А это значение из рецепта
    }

    if(xh){
        const curXHeight = (fontOverrides.sxHeight) ? fontOverrides.sxHeight * scale : xh;
        xHeightY = (fontOverrides.sxHeight !== 0) 
            ? fontOverrides.sxHeight 
            : xh;
    }

    const curWidth = (fontOverrides.rsbDelta) ? fontOverrides.rsbDelta * scale : width;
    const rsbPos = (fontOverrides.rsbDelta !== 0) 
        ? fontOverrides.rsbDelta 
        : x + width;

    const curAscHeight = (fontOverrides.ascender) ? fontOverrides.ascender  * scale : as;
    ascY =  (fontOverrides.ascender !== 0)
        ? fontOverrides.ascender
        : as;

    if(ds){
        //console.log ("fo",fontOverrides.descender);
        const curDescHeight = (fontOverrides.descender) ? fontOverrides.descender  * scale : ds;
        descY = (fontOverrides.descender !== 0) 
            ? fontOverrides.descender
            : ds;
    }


    // Baseline   
    addGuide(baseline, x, false, false, "Baseline (Lock)", "#777", true, null); //Lock!

    // Вертикальные

    addGuide(x, x, true, false, "LSB", "#777", true, null); //Lock!


    addGuide(rsbPos, x, true, true, "RSB", "#5e5ead", true, null); //x + curWidth


    const isSameHeight = ascY !== null && capY !== null && Math.abs(ascY - capY) < 1;
    
    if (!generatedFont && isSameHeight ) {  // combine // bad
        if(!isSameHeightTemp) isSameHeightTemp = isSameHeight;
        addGuide(ascY, x, false, true, "Ascender", "#ffaa44", false, "CapHeight");
    } else {
        addGuide(ascY, x, false, true, "Ascender", "#ff4444", false, null);
        addGuide(capY, x, false, true, "CapHeight", "#44aa44", false, null);
    }

    if (xHeightY) {
        addGuide(xHeightY, x, false, true, "X-Height", "#aa6600", false, null); //xHeightY
    }
    
    if (descY) {
        addGuide(descY, x, false, true, "Descender", "#ff4444", false, null);
    } 

    //console.log(guidelines);

}



function drawGuidelines(params) {
    if (!displayGuide) return;

    //pos, vert, label, color, dash, labelAlt
    guidelines.forEach(g => drawLineWithLabel(g.pos, params.x, params.width, g.vert, g.label, g.color, g.dash, g.labelAlt));
}



function drawBackground(ctx, mode, params) {

    const padding = 5;

    if(mode==="gCanvas"){

        if (!gBackgroundImage.img) return
            
            ctx.save();
            ctx.translate(gBackgroundImage.x, gBackgroundImage.y);
            ctx.scale(gBackgroundImage.scale, gBackgroundImage.scale);

            const opacityValue = gBackgroundImage.opacity !== undefined ? gBackgroundImage.opacity : 0.18;
            ctx.globalAlpha = opacityValue + 0.35;

            if(gBackgroundSelected){
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]); 
                ctx.strokeRect(-padding, -padding, 
                    gBackgroundImage.img.width + (padding * 2), 
                    gBackgroundImage.img.height + (padding * 2)
                );
                ctx.setLineDash([]);
            }
            ctx.globalAlpha = opacityValue;
            ctx.drawImage(gBackgroundImage.img, 0, 0);

            ctx.restore();


    }else if( mode === "editorCanvas"){

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
        } else if (animatingLabel === "CapHeight") {
            fontOverrides.sCapHeight = currentPos;
        } else if (animatingLabel === "X-Height") {
            fontOverrides.sxHeight = currentPos;
        } else if (animatingLabel === "Ascender"){
            fontOverrides.ascender = currentPos;
        } else if (animatingLabel === "Descender") {
            fontOverrides.descender = currentPos;
        }

        renderEditorCanvas(); 
        requestAnimationFrame(startSnapping); 
    } else {
        // Финал
        fontOverrides = { ascender: 0, descender: 0, sCapHeight: 0, sxHeight: 0, rsbDelta: 0 };
        renderEditorCanvas();
    }
}



function renderEditorCanvas() {
    const eCanvasWrapper = document.getElementById("eCanvasWrapper");
    if (eCanvasWrapper?.hidden) return;
    //console.log("renderEditorCanvas");

    updateAlphasEditor();

    const params = getEditorTransformParams();
    const { renderSize, x, baseline, yCenter, width, scale, zoom } = params;
    updateGuidelines(params);

    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save()

    //      renderSize, x, baseline,  width, scale // x и width могут быть нулями
    //const { renderSize, x, baseline,  width, scale, zoom } = getEditorTransformParams();

    drawBackground(ctx, "editorCanvas", params);
    if(!currentGlyph) return messageOnCanvas(ctx, "Not Selected Object");


    drawGuidelines(params);
    drawPasteMessage();

    if(shiftMode) messageOnCanvas(ctx, "snap mode", "snap");

    if (pEditMode && currentProcedureGlyph){
        //console.log(currentProcedureGlyph.customDeltas);

        if (currentProcedureGlyph.customDeltas == true){
            checkDeltasBtn(true);
            messageOnCanvas(ctx, "! user deltas !", "delta");
        }else{
            checkDeltasBtn(false);
        }
    }

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



function alignPath(shape, progress, isAbsolute = false) {

    const animationProgress = 0;
    const smoothAngleAlign = 0.50;

    // Если isAbsolute, значит мы уже посчитали прогресс с учетом смещений
    let charProgress = isAbsolute ? progress : (animationProgress + progress) % 1.0;
    
    // Защита от выхода за границы [0, 1]
    if (charProgress < 0) charProgress += 1.0;
    if (charProgress > 1) charProgress %= 1.0;

    const data = shape.getPoint(charProgress, smoothAngleAlign);
    const visualAngle = data.angle; // += Math.PI;

    return { 
        x: data.x + shape.pos.x, 
        y: data.y + shape.pos.y,
        angle: visualAngle 
    };
}

// Add Objects

const pathObjects = []; 

let initHeightSpline = 0;
function initSpline(cx,cy){
    if (!splineObject || splinePos) return
    console.log("BTN",cx, cy)
    splinePos = { x: cx, y: cy };
    splineObject.pos.x = cx;
    splineObject.pos.y = cy;

    initHeightSpline = splineObject.epts[1][1];

    splineObject.refreshPath();
}

function resetSpline() {
    // Чистим старый объект из массива
    if (splineObject) {
        const idx = pathObjects.indexOf(splineObject);
        if (idx > -1) pathObjects.splice(idx, 1);
    }
    splineObject = new ShapeData('bspline', { x: 0, y: 0 } ,
        [ [-300, -150], [0, -150], [300, -150] ] //100
    );
    console.log("BTN",splinePos)
    splineObject.pos.x = 0;
    splineObject.pos.y = splinePos.y;

    pathObjects.push(splineObject);
    splineObject.refreshPath();

    renderGlobalCanvas();
}

const resetSplineBtn = document.getElementById('resetSplineBtn');
resetSplineBtn.onclick = () => {
    if(gCanvasMode === "align"){
        resetSpline();
        // нужен новый метод
    }else{
        // нужен новый метод
    }
    
    renderGlobalCanvas();
}

let splineObject = new ShapeData('bspline', { x: 0, y: 0 },
[ [-300, -150], [0, -150/*100*/], [300, -150] ] 
);
/*let splineObjectAlt = new ShapeData('bspline', { x: 150, y: 150 },
[ [-100, 100], [100, 100], [100, -100], [-100, 100] ] 
);
*/
splineObject.animationProgress = 0;
pathObjects.push(splineObject);
//pathObjects.push(splineObjectAlt);

//
function checkCenter(){
    gctx.save();
    gctx.fillStyle = "red"; 
    gctx.beginPath();
    gctx.arc(0, 0, 4, 0, Math.PI * 2); 
    gctx.fill();
    gctx.restore();
}

function domRender(){
    const spbox = true
    if (Object.keys(targetDatas).length > 0 && spbox) {

        gctx.save();

        gctx.strokeStyle = "#444"; 
        gctx.lineWidth = 2; 
        
        gctx.globalAlpha = startCloseAnim;

        const xa = Math.round(targetDatas['aLeft']);
        const wa = Math.round(targetDatas['aWidth']);
        const xb = Math.round(targetDatas['bLeft']);
        const wb = Math.round(targetDatas['bWidth']);
        const bh = Math.round(targetDatas['bHeight']);
        const ry = Math.round(targetDatas['cPos']);
        const offset = -1;

        // 1. Рисуем одну большую общую рамку
        const totalWidth = (xb + wb) - xa; 
        gctx.strokeRect(xa + offset, ry + offset, totalWidth - offset * 2, bh - offset * 2);

        // 2. Рисуем перемычку ровно по правому краю первого элемента (A)
        const separatorX = xa + wa;
        
        gctx.beginPath();
        gctx.moveTo(separatorX, ry + offset);
        gctx.lineTo(separatorX, ry + bh - offset);
        gctx.stroke();
        gctx.restore();
    }
}

function renderGlobalCanvas(timestamp) {
    const gCanvasWrapper = document.getElementById("gCanvasWrapper");
    if (gCanvasWrapper?.hidden) return;
    
    //console.log("renderGlobalCanvas");

    updateGlobalAlphas();
    updateElementsDatas(); //targetDatas

    gctx.clearRect(0, 0, globalCanvas.width, globalCanvas.height);
    gctx.save(); 
 

    domRender();


    gctx.translate(world.x, world.y)
    //checkCenter();


    // 1. Background
    drawBackground(gctx, "gCanvas");

    // Path Objects
    splineObject.setAnimValue(splineExampleAnim);


    if(pathObjects.length>0 && gCanvasMode==="align"){
       pathObjects.forEach(obj => obj.drawCanvas(gctx)); 
    }
    
    // Glyph Objects
    
    const count = gCanvasObjects.length;

    gCanvasObjects.forEach((obj) => {

        if (gCanvasMode === "align" && splineObject) {
            const lineLen = splineObject.totalLength; // Реальная длина сплайна
            const textLen = gCanvasObjects[0]?.tTotalWidth || 0; // Длина нашей строки

            // Находим начальный отступ в пикселях, чтобы текст был по центру
            // Если текст длиннее линии, получится отрицательное число (уйдет за край)
            const centerOffsetPx = (lineLen / 2) - (textLen / 2);

            gCanvasObjects.forEach((obj) => {
                // 1. Считаем позицию буквы относительно начала линии в пикселях
                // animationProgress * lineLen — это текущий сдвиг анимации
                // centerOffsetPx — сдвиг всей группы к центру
                // obj.tOffset — положение конкретной буквы в слове
                
                const glyphAW = obj.item.glyph.advanceWidth ?? 500;
                const halfCharWidth = (glyphAW * obj.scale * tracking) / 2; // Половина физической ширины

                // Добавляем halfCharWidth, чтобы на точку сплайна попадал центр буквы, а не левый край
                
                const customShift = obj.customAlignOffset || 0;
                let absolutePosPx = centerOffsetPx + obj.tOffset + halfCharWidth + customShift;

                //let absolutePosPx = centerOffsetPx + obj.tOffset + halfCharWidth;


                const animationProgress = 0;
                // Добавляем движение анимации (если нужно, чтобы текст полз)
                absolutePosPx += (animationProgress * lineLen);

                // 2. Переводим пиксели в нормализованный прогресс (0.0 - 1.0)
                let charProgress = absolutePosPx / lineLen;

                // 3. Клэмпим (зажимаем) у краев,
                // Если без клэмпа, используйте % 1.0 для зацикливания
                charProgress = Math.max(0, Math.min(0.999, charProgress));

                const newPos = alignPath(splineObject, charProgress, true); // true — флаг прямой передачи

                obj.x = newPos.x;
                obj.y = newPos.y;
                obj.angle = newPos.angle;
            });

        }

        const glyphAW = obj.item.glyph.advanceWidth ?? 0; // смещение под центру?

        // (animation intro)

        let charValue = 1;

        if (animationActive && obj.animIndex !== -1) {
            
            const animLetter = animationLetters[obj.animIndex];

            const start = obj.animIndex / count;
            const end = (obj.animIndex + 1) / count;
            const localTime = (charAnim - start) / (end - start);
            
            charValue = Math.min(Math.max(localTime, 0), 1);

            if (charValue < 1 && animLetter) {
                gctx.save();
                gctx.scale(1, -1); 
                gctx.translate(obj.x, -obj.y);

                if (gCanvasMode === "align" && obj.angle !== undefined ) {
                    gctx.rotate(-obj.angle); // +90 градусов, если буквы "лежат"
                }
                gctx.scale(obj.scale, obj.scale);
                gctx.translate(-glyphAW / 2, 0);

                animLetter.updateData(charValue);
                animLetter.drawCanvas(gctx, "render");
                
                gctx.restore();
            }            
        }

        // (base svg)

        const selectItem = obj.item;
        let glyph = selectItem.glyph;
        const params = getGlyphSVGParams(selectItem);

        if (params.d){
            const pathData = new Path2D(params.d);

            gctx.save();
            gctx.translate(obj.x, obj.y);

            //checkCenter();

            if (gCanvasMode === "align" && obj.angle !== undefined ) {
                gctx.rotate(obj.angle); // +90 градусов, если буквы "лежат"
            }

            gctx.scale(obj.scale, obj.scale);
            gctx.translate(-glyphAW / 2, 0); // Смещение глифа
            
            const glyfOpacity = (charValue >= 1) ? 1 : 0;
            gctx.globalAlpha = glyfOpacity;

            gctx.fillStyle = "white"; 
            gctx.fill(pathData);

            // РАМКА ВЫДЕЛЕНИЯ (уже внутри save/restore и правильных координат)
            const isSelected = selectedObjects.includes(obj);

            if (isSelected ) { //&& !gBackgroundSelected
                const bbox = glyph.getBoundingBox();
                const w = bbox.x2 - bbox.x1;
                const h = bbox.y2 - bbox.y1;
                const centerX = (bbox.x1 + bbox.x2) / 2;
                const centerY = (bbox.y1 + bbox.y2) / 2;
                gctx.globalAlpha = charValue;
                gctx.strokeStyle = obj.item?.template ? "#8b0909" : "grey"; // "#00ff00"
                gctx.lineWidth = 2 / obj.scale; 
                const padding = 20;

                gctx.strokeRect(
                    centerX - (w / 2) - padding, 
                    -centerY - (h / 2) - padding, 
                    w + padding * 2, 
                    h + padding * 2
                );
            }
            gctx.restore();

        }
    });

    // 4. Очистка анимированных букв
    if (charAnim >= 1 && animationLetters.length > 0) {
        animationLetters = [];
        animationActive = false;
        console.log("Память очищена", animationLetters)
    }

    
    if (isSelecting && activeCanvas === 'global') {
        gctx.setLineDash([5, 5]); // Делаем рамку пунктирной
        gctx.strokeStyle = "#00ff00";
        gctx.lineWidth = 1;
        gctx.strokeRect(
            selBox.x1, 
            selBox.y1, 
            selBox.x2 - selBox.x1, 
            selBox.y2 - selBox.y1
        );
        gctx.setLineDash([]); // Сбрасываем пунктир
    }

    gctx.restore()
    //requestAnimationFrame(renderGlobalCanvas);
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
    console.log("commitGlyphEdits");

    let newPath;

    if(currentProcedureGlyph && generatedFont){
        
        //const data = currentProcedureGlyph.exportDataOld(); // Без Дельт но с нормализацией
        const data = currentProcedureGlyph.exportData();
        newPath = data.path;

        glyph.advanceWidth = data.width;
        console.log("commitGlyphEdits - Proc");
    }else{
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
            console.log("Not CommitChange");
        }
    }


    
    if (!newPath) return;

    glyph.path = newPath;

    // Обновляем плитку в cmap
    updateCurrentTile();

    console.log("commitGlyphEdits - End");
}


// Слушатели

// drag drop File Overlay Logic Section

window.addEventListener("dragover", e => {
    e.preventDefault()
});

window.addEventListener("dragenter", (e) => {
    e.preventDefault();
    document.body.classList.add("drag");
    cmap.style.opacity = "0.5"; 
});

window.addEventListener("dragleave", (e) => {
    if (!e.relatedTarget) {
        document.body.classList.remove("drag");
        cmap.style.opacity = "1.0";
    }
});

function skipAllAnimation(mode = "simple"){

    animationLetters = [];
    animationActive = false;
    console.log("skipAllAnimation", animationLetters)


    if(startwindow || mode === "dragFromMain"){
        const baseIcon = canvasSwitchBtn.querySelector("img");
        baseIcon.src = "./assets/svg/free.svg" 

        hardTurnSpline = true;
    }

    charAnim = 1;
    totalSkip = true
    startCloseAnim = 0;
    animationActive = false; 
    
    if(mode === "errorAutopush"){
        
        startTextRow.hidden = true;

        const startWindow = document.getElementById("startWindow");
        const mainComment = document.getElementById("mainComment");

        startWindow.style.padding = 0;
        mainComment.style.padding = 0;
        mainComment.style.margin = '0';
        mainComment.innerHTML = `... drag Glyph or reference image <text style="color: rgba(0, 0, 0, 0.0);">...</text>`; // for D
    }


    //if(gCanvasMode = "free" // align

    
}

function handleFontFile(file) {
    if (!file) return false;

    

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
                    return false;
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

            if(gCanvasMode === "align"){
                callSwitchCanvasMode();
            }

            setupVariationControls();

            updateCMAP();

            closeStartWindow();

            skipAllAnimation("dragFromMain");

            //animationActive = false;

            updateUserMapInputs();

            autoPushOnCanvas()

            openMainWindow();

            checkScrollNow();

            renderEditorCanvas();
            //renderGlobalCanvas();

            clearFontlib();
            saveFontlib(font, fontData, loadedFileName);
            return true

        } catch (err) {
            return false
            alert("Error parsing font: " + err.message);
        }
    };
    const complete = reader.readAsArrayBuffer(file);

    return complete
}

function handleImageFile(file, callback) { 
    if (!file || !file.type.startsWith("image/")) return console.log("problem");

    const reader = new FileReader();

    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            if (typeof callback === "function") callback(img); 
        };
        console.log("еыав",event.target)
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function handleTileDrop(arrayIndex, e, offset = 0) {
    cmap.style.opacity = "1.0";

    const target = e.target;
        const { x: mx, y: my } = getCanvasMousePosOrig(globalCanvas, e);

        const numericIndex = parseInt(arrayIndex);
        const originalItem = currentDataArray[numericIndex];

        if(currentDataArray && originalItem){
            //console.log("DRAGGED:", currentDataArray === compArray ? "component" : "glyph", numericIndex);
        }else{
            return
        }    

        if (originalItem) {
            gCanvasObjects.push({
                item: originalItem,
                array: currentDataArray,
                aindex: numericIndex,
                x: mx + offset, 
                y: my + offset,
                scale: tempScale
            });

            mSublineActive = false;
            
            updateGlobalAlphas();
            renderGlobalCanvas(); 

        }

        console.log("MYTEST",gCanvasObjects);
        return 
}

function hardUpdateAllRecipes(new_data){
    
    Object.assign(GFONT_PARAMS, new_data.GFONT_PARAMS);
    const newRecipes = new_data.GLYPH_RECIPES_TEXT
    
    if(customParamInput){
        customParamInput.designer = new_data.designer;
        customParamInput.familyName = new_data.familyName;
    }
    
    // 1 Remove
    USER_INPUT_GLYPH = "";
    USER_APPEND_GLYPH = "";
    ALL_RECIEPT_MAP = "";

    addGlyphsArray.length = 0;

    for (let key in GLYPH_RECIPES) delete GLYPH_RECIPES[key]; // Если поменять на let можно быстрее (но пока так)

    //console.log("step_1", GLYPH_RECIPES);

    // 2  for new_data to push keys to USER_INPUT_GLYPH and write new GLYPH_RECIPES
    for (let symbol in newRecipes) {
        //console.log("su",symbol, symbol.charCodeAt(0))

        const fullCode = newRecipes[symbol]; // Получаем текст функции из JSON
        const trimmedBody = getRecipeBodyFromSymbol(symbol, fullCode); 

        // Записываем в справочники
        GLYPH_RECIPES_TEXT[symbol] = fullCode;
        GLYPH_RECIPES[symbol] = new Function("p", "self", trimmedBody);
        
        ALL_RECIEPT_MAP += symbol;
    }

    //console.log("pre", GLYPH_RECIPES_TEXT);
    //console.log("step_2", ALL_RECIEPT_MAP);
    //console.log("step_3", USER_INPUT_GLYPH);
    

    if(startwindow){
        // 3 Он работает по USER_INPUT_GLYPH + готовым рецептам
        USER_INPUT_GLYPH = Array.from(ALL_RECIEPT_MAP)
        startProcessGenerate(true);
    }else{
        startProcessGenerate(true); //skip == true
    }
}

function handleFeDrop(file){
        const reader = new FileReader();
        reader.onload = (event) => {
            const importedData = JSON.parse(event.target.result);
            hardUpdateAllRecipes(importedData); 
        };
        reader.readAsText(file);
}

window.addEventListener('dragstart', (e) => {
    // Если это не плитка — рубим на корню любой перенос
    if (!e.target.closest || !e.target.closest('.tile')) {
        e.preventDefault();
        return false;
    }
}, { capture: true });

// три кейса: шрифт, внутренний элемент плитки, изображение для canvas



window.addEventListener("drop", (e) => { 
    e.preventDefault();
    
    const target = e.target;
    console.log("DROP", target);

    document.body.classList.remove("drag");
    cmap.style.opacity = "1.0";

    const files = e.dataTransfer.files;
    const firstFile = files[0];

    const rawIndices = e.dataTransfer.getData("arrayIndices");

    if (rawIndices) {
        const indices = rawIndices.split(',');
        const { wx, wy } = getCanvasMousePosAlt(globalCanvas, e);
        
        // Создаем временный массив для текущей пачки объектов
        const newBatch = [];

        indices.forEach((idx, i) => {
            const numericIndex = parseInt(idx);
            const originalItem = currentDataArray[numericIndex];

            if (originalItem) {

                const newCanvasObject = {
                    item: originalItem,
                    array: currentDataArray,
                    aindex: numericIndex,
                    logicalIndex: i, // Важно! Присваиваем порядок в пачке
                    animIndex: -1, // анимации нет
                    x: wx, 
                    y: wy,
                    scale: tempScale,
                    angle: 0,

                };
                gCanvasObjects.push(newCanvasObject);
                newBatch.push(newCanvasObject);
            }
        });
    

        if(gCanvasMode === "align" && splineObject){
            updateSplineLogic("mouse", newBatch, { x: wx, y: wy });
        }else{
            updateTracking(newBatch, true, { x: wx, y: wy });
        }
        
        updateGlobalAlphas();
        renderGlobalCanvas();
        return;
    }



    if(!firstFile) return


    const fileName = firstFile.name.toLowerCase();
    const isFont = ['.ttf', '.otf', '.woff', '.woff2'].some(ext => fileName.endsWith(ext));
    const isFenerate = fileName.endsWith('.fe')

    if(isFont){
        console.log("DROP FONT");
        handleFontFile(firstFile);
        return
    }

    if (isFenerate){
        console.log("DROP FENERATE");        
        handleFeDrop(firstFile)
        return
    }

    if(startwindow) return

    if(target!==editorCanvas){
        handleImageFile(firstFile, (img) => {

                gBackgroundImage.img = img;
                gBackgroundImage.x = 0;
                gBackgroundImage.y = 0;

                //gBackgroundSelected = true;

                if(gOpacityWrap.hidden !== false){
                    gOpacityWrap.classList.remove("expandable");
                    //gOpacityWrap.hidden = false;
                    gCanvasBgExpandBtn.click();
                }
                
                renderGlobalCanvas();
            });

        return
    }
    if(target===editorCanvas){

        const idx = currentGlyph.index;
        handleImageFile(firstFile, (img) => {
            editorBackgrounds[idx] = { img: img,
                x: -(img.width/2), 
                y: -(img.height/2), 
                scale: 1.0, opacity: 0.3
            };

            if (firstUploadedIndex === null) {
                firstUploadedIndex = idx;
            }

            //eBackgroundSelected = true;
            if(eOpacityWrap.hidden !== false){
                eOpacityWrap.classList.remove("expandable");
                //eOpacityWrap.hidden = false;
                eCanvasBgExpandBtn.click();
            }
            renderEditorCanvas();

        });
    }

});

// Canvas Logics



let fMouseX = 0; // current mousePosition in Font Units
let fMouseY = 0;
let fMouseTempX = 0; // init mousePosition in Font Units (reset on dragstart)
let fMouseTempY = 0;

let initialValue = 0;

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

    const pad = 15; // Порог попадания (удобно для точек)

    // 1. Сначала проверяем сплайны (точки сплайна обычно "выше" в интерфейсе)
    if(gCanvasMode==="align"){
        for (let i = pathObjects.length - 1; i >= 0; i--) {
            const shape = pathObjects[i];

            // Проверяем локальные точки (epts)
            for (let j = 0; j < shape.epts.length; j++) {
                const px = shape.pos.x + shape.epts[j][0];
                const py = shape.pos.y + shape.epts[j][1];
                if (Math.hypot(mx - px, my - py) < pad) {
                    return { type: 'spoint', shape: shape, pointIdx: j };
                }
            }
        }
    }


    for (let i = gCanvasObjects.length - 1; i >= 0; i--) {
        const obj = gCanvasObjects[i];
        const glyph = obj.item.glyph;
        const bbox = glyph.getBoundingBox();
        const glyphAW = glyph.advanceWidth ?? 0;

        // 1. Переходим к локальным координатам буквы
        // Сначала компенсируем глобальный сдвиг
        let dx = mx - obj.x;
        let dy = my - obj.y;

        // 2. Если есть поворот, вращаем точку клика ОБРАТНО
        if (gCanvasMode === "align" && obj.angle !== undefined) {
            const cos = Math.cos(-obj.angle);
            const sin = Math.sin(-obj.angle);
            const rx = dx * cos - dy * sin;
            const ry = dx * sin + dy * cos;
            dx = rx;
            dy = ry;
        }

        // 3. Учитываем наш translate(-glyphAW / 2, 0) и масштаб
        // Теперь точка (0,0) — это левый нижний угол буквы на базовой линии
        const localX = dx / obj.scale + (glyphAW / 2);
        const localY = dy / obj.scale; 

        // 4. Проверяем попадание в BBox (с учетом инверсии Y в шрифтах)
        // В шрифтовом BBox y2 обычно выше y1, а координата y клика в шрифте 
        // должна быть инвертирована относительно Canvas
        const fontY = -localY; 

        const pad = 20 / obj.scale; // Паддинг тоже масштабируем

        if (localX >= bbox.x1 - pad && localX <= bbox.x2 + pad &&
            fontY >= bbox.y1 - pad && fontY <= bbox.y2 + pad) {
            
            const clickedObj = gCanvasObjects.splice(i, 1)[0];
            gCanvasObjects.push(clickedObj);
            return { type: 'gobject', item: clickedObj };
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

let dragTargetG = null;
let dragTargetE = null;

function cleanTempVariables() {
    //activeCanvas = null;

    isDragging = false;
    isSelecting = false;

    selBox.x1 = 0; selBox.y1 = 0;
    selBox.x2 = 0; selBox.y2 = 0;

    dragTargetE = null;
    dragOffsets = [];

    // Перерисовываем, чтобы стереть рамку выбора (selBox)
    if (typeof renderGlobalCanvas === 'function') renderGlobalCanvas();
    if (typeof renderEditorCanvas === 'function') renderEditorCanvas();
}


// Дополнительная страховка: если окно браузера потеряло фокус (Alt+Tab)
window.addEventListener('blur', () => {
    if (isDragging || isSelecting) {
        //cleanTempVariables();
    }
});

canvas.addEventListener("wheel", e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1; // deltaY - системная
    const { x: mx, y: my } = getCanvasMousePosOrig(canvas, e);
    
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



let procSelected = null;
let procDragged = false;
let tempDeltas = null;
let tempMidDeltas = null;
function updateProcedureGlyphDeltas(el, delta = null, tDelta = null) {
    if (!currentProcedureGlyph || !el) return;

    const char = currentProcedureGlyph.symbol;
    const elIndex = currentProcedureGlyph.elements.indexOf(el);
    const ptIndex = el.selectedIndex;
    //console.log(elIndex)


    if (!GLYPH_DELTAS[char]) GLYPH_DELTAS[char] = {};

    if (!GLYPH_DELTAS[char][elIndex]) {

        GLYPH_DELTAS[char][elIndex] = {
            //pts: [{x: 0, y: 0}, {x: 0, y: 0}],
            //mids: [{x: 0, y: 0}],
            //mids: [{x: 0, y: 0}, {x: 0, y: 0}],

            pts: el.pens.map(() => ({x: 0, y: 0})),
            mids: el.pens.map(() => ({x: 0, y: 0})), // Теперь Mids столько же, сколько Pens

            customDeltas: false,
            w: el.w ?? 300,
            penAngle: el.penAngle ?? 0,
            tOffsets: [0, 0]
        };
        console.log("DELT CHECK ", GLYPH_DELTAS);
    }
    
    let changed = false;
    const stemDelta = GLYPH_DELTAS[char][elIndex];
    
    // 1. Обновляем tDelta (проверяем на null, так как 0 — это валидное значение)
    if (tDelta !== null && ptIndex !== null) {
        changed = true;

        stemDelta.customDeltas = true;
        stemDelta.tOffsets[ptIndex] = tDelta;
    }

    // 2. Обновляем обычную дельту
    if (delta && ptIndex !== null) {
        changed = true;

        stemDelta.customDeltas = true;

            if (el.selectedIndex === -1 && !el.midSelect) { // двигаем пачку (-1)

                const moveX = delta.x - el.startMidDelta.dx;
                const moveY = delta.y - el.startMidDelta.dy;

                // tempMidDeltas = null;
                
                Object.keys(tempDeltas).forEach(i => {
                    // Прибавляем только ЧИСТЫЙ СДВИГ мыши к старым координатам
                     if (i == -1) return; 

                    stemDelta.pts[i] = { 
                        x: tempDeltas[i].x + moveX, 
                        y: tempDeltas[i].y + moveY 
                    };
                });

            } else { // двигаем соло

                if (typeof ptIndex === 'string' && ptIndex.startsWith('mid_')) {
                    
                    const idx = parseInt(ptIndex.split('_')[1]);
                    
                    //console.log("пришло", idx);

                    stemDelta.mids[idx] = { x: delta.x, y: delta.y };

                } else if (typeof ptIndex === 'number' && ptIndex >= 0) { // СЛУЧАЙ В: Двигаем конкретное ПЕРО
                    stemDelta.pts[ptIndex] = { x: delta.x, y: delta.y };
                }
        }
        
    }

    if(changed){
        currentProcedureGlyph.customDeltas = true;
    }
}



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
    
    const padding = 5; // Чувствительность клика
    const { x: mx, y: my } = getCanvasMousePosOrig(canvas, e);
    const { x: tx, baseline, yCenter, scale } = getEditorTransformParams();
    
    // ПЕРЕВОДИМ координаты мыши в пространство шрифта (fx, fy)
    const fx = (mx - tx) / scale;
    const fy = (baseline - my) / scale;
    fMouseTempX = fx; 
    fMouseTempY = fy;

    // Background Selection Logic

    const bg = getCurrentEditorBg();
    if (eBackgroundSelected && bg) {
        isDragging = true;
        startMouseX = (mx / scale) - bg.x;
        startMouseY = (yCenter - my) / scale - bg.y; 
        editorCanvas.style.cursor = "grabbing";
        renderEditorCanvas();
        return
    }
    

     // Procedure Selection Logic

    let procHitFound = false;
    if (pEditMode && currentProcedureGlyph) {
        console.log("MouseDown Procedure");
        procDragged = false;

        currentProcedureGlyph.elements.forEach(el => {
            if (el instanceof StemLine) {
                if ( el.checkHit(fx, fy, true) ){
                    procHitFound = true;
                    procSelected = el;

                    const ptIdx = el.selectedIndex;
                    const char = currentProcedureGlyph.symbol;
                    const elIndex = currentProcedureGlyph.elements.indexOf(el);
                    
                    updateProcedureGlyphDeltas(el, null); // проинициализирует GLYPH_DELTAS чтобы map не выдал ошибок

                    if (ptIdx === -1 ) { // Если mid хранится в pts[-1]
                        const deltaObj = GLYPH_DELTAS[char]?.[elIndex];
                        // Сохраняем "срез" всех дельт в момент нажатия
                        //tempDeltas = deltaObj.pts.map(p => ({ ...p })); //JSON.parse(JSON.stringify(deltaObj.pts)); 
                        tempDeltas = structuredClone(deltaObj.pts);
                        
                        tempMidDeltas = structuredClone(deltaObj.mids || []); 
                        el.startMidDelta = { ...el.getDeltas(-1) }; 
                    
                        //console.log(tempDeltas);
                    }

                    updateProcedureGlyphDeltas(el, null); 
                    
                    const deltaObj = GLYPH_DELTAS[char]?.[elIndex];
                    const current = el.getDeltas(ptIdx);

                    fMouseTempX = fx - current.dx;
                    fMouseTempY = fy - current.dy;
                    
                    // Фиксируем стартовый tOffset
                    el.startTOffset = deltaObj?.tOffsets?.[ptIdx] || 0;
                    
                    editorCanvas.style.cursor = "default";
                    renderEditorCanvas();
                    return;

                }
            }
        });

        if (!procHitFound) {
            procSelected = null;
            currentProcedureGlyph.elements.forEach(el => { 
                if (el.selectedIndex !== undefined){
                    el.selectedIndex = null; 
                    el.midSelect = null;
                }
            });

        }
    }
    
    dragTargetE = hitTestControls(mx, my); // поиск BeziePoints в месте клика

    // Guides Selection Logic

    const isSomethingUnderMouse = dragTargetE || procHitFound;
    const guideCheck = !isSomethingUnderMouse && displayGuide;

    const hitGuide = guideCheck ? guidelines.find(g => {
        // 1. Проверяем попадание в область (padding)
        const isUnderCursor = g.vert 
            ? Math.abs(mx - g.pos) < padding 
            : Math.abs(my - g.pos) < padding;

        return isUnderCursor && g.drag; 
    }) : null;

    if (hitGuide) {  
        //console.log(hitGuide);
        if (!shapeSequenceData && gCanvasMode === "align") {
            recordShapeSequence();
        }

        if(generatedFont){
            if (hitGuide.label === "RSB"){
                initialValue = GFONT_PARAMS.aw;
            } else if (hitGuide.label === "CapHeight"){
                initialValue = GFONT_PARAMS.ch;
            } else if (hitGuide.label === "X-Height"){
                initialValue = GFONT_PARAMS.xh;
            } else if (hitGuide.label === "Ascender"){
                initialValue = GFONT_PARAMS.as;
            } else if (hitGuide.label === "Descender"){
                initialValue = GFONT_PARAMS.ds;
            } 
        }else{

            const tables = font?.tables?.os2 ? font.tables.os2 : null;
        
            let glyphCapHeight, glyphXHeight;

            if(tables){
                glyphCapHeight = tables.sCapHeight ? tables.sCapHeight : null;
                glyphXHeight   = tables.sxHeight ? tables.sxHeight : null;
            }

            if (hitGuide.label === "RSB"){
                
                const glyph = currentItem?.glyph;
                if(!glyph) return console.log("ПУММУМУМ");
                const aw = glyph.advanceWidth
                initialValue = aw ? aw : null;

            } else if (hitGuide.label === "CapHeight"){
                const capHeight =  glyphCapHeight ? glyphCapHeight : font.ascender;

                if(!generatedFont && isSameHeightTemp){
                    hitGuide.label = "Ascender";
                    initialValue = font.ascender;
                }else{
                    initialValue = capHeight;
                }

                initialValue = capHeight;
            } else if (hitGuide.label === "X-Height"){
                initialValue = glyphXHeight;
                //console.log("ИЩЩЩ")
            } else if (hitGuide.label === "Ascender"){
                initialValue = font.ascender;
            } else if (hitGuide.label === "Descender"){
                initialValue = font.descender;
            } 
        }
   
        //console.log("БЫЛО", initialValue)
        draggedGuide = hitGuide;
    }

    // BeziePoints Selection Logic

    if (!pEditMode){ 
        if(dragTargetE && !cTransformMode) { 

            // 2. Логика выделения
            const isAlreadySelected = selectedPoints.some(sp => sp.ci === dragTargetE.contourIdx && sp.pi === dragTargetE.pointIdx);

            if (!e.shiftKey && !isAlreadySelected) {
                selectedPoints = [{ ci: dragTargetE.contourIdx, pi: dragTargetE.pointIdx }];
            } else if (e.shiftKey && !isAlreadySelected) {
                selectedPoints.push({ ci: dragTargetE.contourIdx, pi: dragTargetE.pointIdx });
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
            if(!draggedGuide){}
            setSelectionBox(mx,my);
            if (!e.shiftKey) selectedPoints = [];
        }
    }

    renderEditorCanvas();
});

canvas.addEventListener("mousemove", e => {

    const safeReturn = (forceRender) => {
        // Если forceRender не передан (undefined), проверяем состояния
        const rulesflags = ( isSelecting || dragTargetE || draggedGuide || procDragged )
        const shouldRender = forceRender ?? rulesflags;
        
        if (shouldRender){
            //updateProcedureGlyphDeltas(); // выводим в консоль 
            //commitGlyphEdits();
            renderEditorCanvas();
        } 
    };

    if (isPanning) {
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;

        panX += dx;
        panY += dy;

        startMouseX = e.clientX;
        startMouseY = e.clientY;

        return safeReturn(true);
    }

    const padding = 6;
    const { x: mx, y: my } = getCanvasMousePosOrig(canvas, e);
    const { x, baseline, yCenter, scale} = getEditorTransformParams();
    
    // Текущая поизиция мыши в единцах пространства шрифта
    const fx = (mx - x) / scale;
    const fy = (baseline - my) / scale;

    fMouseX = fx;
    fMouseY = fy;

    // 2. Дельта в юнитах для глобальных переменных
    const fDeltaX = fMouseX - fMouseTempX;
    const fDeltaY = fMouseY - fMouseTempY;
    
    // Background Move Logic

    const bg = getCurrentEditorBg();
    if (isDragging && bg && eBackgroundSelected) {
        bg.x = (mx / scale) - startMouseX;
        bg.y = (yCenter - my) / scale - startMouseY;
        
        return safeReturn(true);
    }


     // Procedure Move Logic

    let procHitFound = false;

    if (pEditMode && currentProcedureGlyph) {
        
        if (procSelected) {
            procDragged = true; // deltaFlag

            const pt = procSelected.rawPts[procSelected.selectedIndex];

            if (e.shiftKey && pt.origin) { // Shift Mode
                const pStart = pt.origin.rawPts[0];
                const pEnd = pt.origin.rawPts[pt.origin.rawPts.length - 1];
                const dx = pEnd.x - pStart.x;
                const dy = pEnd.y - pStart.y;

                let moveT = Math.abs(dx) > Math.abs(dy) ? fDeltaX / dx : fDeltaY / dy;

                // Прибавляем к тому, что БЫЛО в момент mousedown
                let finalTDelta = (procSelected.startTOffset || 0) + moveT;

                // Ограничение
                const totalT = pt.t + finalTDelta;
                if (totalT < 0) finalTDelta = -pt.t;
                if (totalT > 1) finalTDelta = 1 - pt.t;
                updateProcedureGlyphDeltas(procSelected, {x: 0, y: 0}, finalTDelta);
            } else {

                // Обычная логика: двигаем дельту
                updateProcedureGlyphDeltas(procSelected, { x: fDeltaX, y: fDeltaY });
            }
        
            return safeReturn();  
        
        } else {
            // Используем for...of вместо forEach
            for (const el of currentProcedureGlyph.elements) {
                if (el instanceof StemLine) {
                    if (el.checkHit(fx, fy)) {
                        editorCanvas.style.cursor = "default";
                        procHitFound = true;
                        return safeReturn(true);
                    }
                }
            }
        }
    }


    // Guides Move Logic
    
    // Align Guide !strong! on Mouse Position
    // + Set Animation Deltas Attributes

    if (draggedGuide) { 

         // Для вертикальных
        if(initialValue != null){

            if (draggedGuide.label === "RSB"){
                const newValue = initialValue + fDeltaX;
                // Задаём смещение глобальной переменной
                updateParamsFromCanvas(draggedGuide.label, newValue);
                fontOverrides.rsbDelta = mx;  
            }else{

                // Для горизонтальных
                const newValue = initialValue + fDeltaY;
                //console.log ("sad", draggedGuide.label, newValue);

                if(isSameHeightTemp && (draggedGuide.label === "Ascender" || draggedGuide.label === "CapHeight") ){

                    updateParamsFromCanvas(draggedGuide.label, newValue);
                    
                    fontOverrides.ascender = my;
                    //fontOverrides.sCapHeight = my;
                    
                    //console.log("ПЛОХО")

                }else{

                    updateParamsFromCanvas(draggedGuide.label, newValue);

                    if (draggedGuide.label === "CapHeight"){
                         //fontOverrides.sCapHeight = fy;
                        fontOverrides.sCapHeight = my;
                    
                    } else if (draggedGuide.label === "X-Height"){
                        //fontOverrides.sxHeight = fy;
                        fontOverrides.sxHeight = my;
                        //console.log("ХОРОШО")
                    
                    } else if (draggedGuide.label === "Ascender"){
                        //fontOverrides.ascender = fy;
                        fontOverrides.ascender = my;
                    
                    } else if (draggedGuide.label === "Descender"){
                        //fontOverrides.descender = fy
                        fontOverrides.descender = my;
                    } 
                }
            }

            return safeReturn(true); 
        }    
    }


    // Hover Guides 

    const pointUnderMouse = hitTestControls(mx, my);

    const isOverAnyPoint = pointUnderMouse || dragTargetE;
    const guideCheck = !isOverAnyPoint && displayGuide;

    const hoverGuide = guideCheck ? guidelines.find(g => {
        const isUnderCursor = g.vert 
            ? Math.abs(mx - g.pos) < padding 
            : Math.abs(my - g.pos) < padding;
        return isUnderCursor && g.drag; 
    }) : null;


    // BeziePoints Move Logic

    if (dragTargetE && currentGlyph) {
        if (dragTargetE.kind === "anchor") {
            selectedPoints.forEach((sp, i) => {
                const contour = currentContours[sp.ci];
                const pt = contour[sp.pi];
                const offset = dragOffsets[i];

                const newX = fx - offset.dx;
                const newY = fy - offset.dy;
                
                const fDeltaX = newX - pt.anchor.x;
                const fDeltaY = newY - pt.anchor.y;

                // 1. Двигаем саму точку (Anchor)
                pt.anchor.x = newX;
                pt.anchor.y = newY;

                // 2. Двигаем ИСХОДЯЩИЙ рычаг этой точки (Handle2)
                if (pt.handle2) {
                    pt.handle2.x += fDeltaX;
                    pt.handle2.y += fDeltaY;
                }

                // 3. Двигаем ВХОДЯЩИЙ рычаг СЛЕДУЮЩЕЙ точки (Handle1 следующего сегмента)
                // Если точка последняя и контур замкнут — берем первую точку
                let nextIdx = sp.pi + 1;
                if (nextIdx >= contour.length && pt.closed) nextIdx = 0;
                
                const nextPt = contour[nextIdx];
                if (nextPt && nextPt.handle1) {
                    nextPt.handle1.x += fDeltaX;
                    nextPt.handle1.y += fDeltaY;
                }
            });

        } else {
            // Если тянем за конкретный рычаг — меняем только его координаты
            const pt = currentContours[dragTargetE.contourIdx][dragTargetE.pointIdx];
            if (dragTargetE.kind === "handle1") { pt.handle1.x = fx; pt.handle1.y = fy; }
            if (dragTargetE.kind === "handle2") { pt.handle2.x = fx; pt.handle2.y = fy; }
        }

        commitGlyphEdits();

    } else if (isSelecting) {
        selBox.x2 = mx;
        selBox.y2 = my;
    }

    // Cursors

    if (isPanning) {
        editorCanvas.style.cursor = "grabbing";
    } 
    // Выделение рамкой ИЛИ перетаскивание точки)
    else if (isSelecting || isOverAnyPoint) {
        editorCanvas.style.cursor = "default"; 
    } 
    else if (hoverGuide) {
        //console.log("Setting cursor to:", hoverGuide.cursor);
        //"row-resize"; //Под Буквой  // используем "s-resize"
        editorCanvas.style.cursor = hoverGuide.cursor;
    } 
    else {
        editorCanvas.style.cursor = "default";
    }

    safeReturn();
});

canvas.addEventListener('mouseleave', () => {
    if (isDragging || isSelecting) {
        cleanTempVariables();
    }
});

globalCanvas.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.98 : 1.02; // e.deltaY - системная

    const { x: mx, y: my , wx, wy} = getCanvasMousePosAlt(globalCanvas, e);

    if (gBackgroundSelected) {
        // ЗУМ ФОНА В ТОЧКУ КУРСОРA
        // Формула: новое_полож = точка_курсора + (старое_полож - точка_курсора) * дельта
        const newX = wx + (gBackgroundImage.x - wx) * delta;
        const newY = wy + (gBackgroundImage.y - wy) * delta;

        gBackgroundImage.x = newX;
        gBackgroundImage.y = newY;
        gBackgroundImage.scale *= delta;

    } else if (selectedObjects.length > 0) {
        // ЗУМ ГРУППЫ ГЛИФОВ В ТОЧКУ КУРСОРA

        mHeaderActive = false;
        mHeaderComplete = true;
        mSublineActive = false;

        const mouseProgress = splineObject.getClosestProgress(wx, wy);
        const mousePosPx = mouseProgress * splineObject.totalLength;
        
        if (gCanvasMode === "align") {
            selectedObjects.forEach(o => {
                o.tOffset += (o.customAlignOffset || 0);
                o.customAlignOffset = 0;
            });
            updateLogIndices(); 
        }

        selectedObjects.forEach((obj,i) => {
            // Каждый объект смещается относительно курсора
                if (gCanvasMode === "align") {

                    const lineLen = splineObject.totalLength;
                    const textLen = obj.tTotalWidth || 0;
                    const centerOffsetPx = (lineLen / 2) - (textLen / 2);
                    const glyphAW = obj.item.glyph.advanceWidth ?? 500;
                    const halfCharWidth = (glyphAW * obj.scale * tracking) / 2;
                    
                    const currentAbsolutePos = centerOffsetPx + obj.tOffset + halfCharWidth + (obj.customAlignOffset || 0);
                    const newAbsolutePos = mousePosPx + (currentAbsolutePos - mousePosPx) * delta;

                    obj.customAlignOffset = newAbsolutePos - (centerOffsetPx + obj.tOffset + halfCharWidth);

                }else{
                    // логика free
                    const newX = wx + (obj.x - wx) * delta;
                    const newY = wy + (obj.y - wy) * delta;
                    obj.x = newX;
                    obj.y = newY;
                }

            obj.scale *= delta;
            tempScale = obj.scale;
        });
    }
    renderGlobalCanvas();
};



let gCanvasMode = "free" // align
function callSwitchCanvasMode() {

    if( !splineExampleComplete && splineExampleActive ) return
    if( generatedFont && !hardTurnSpline) return

    gCanvasObjects.forEach(obj => {
        if (gCanvasMode === "free") {
            // Сохраняем состояние свободного режима
            obj.freeX = obj.x;
            obj.freeY = obj.y;
            obj.freeScale = obj.scale;
            obj.freeAngle = obj.angle || 0;
        } else {
            // Сохраняем состояние режима сплайна
            obj.alignX = obj.x;
            obj.alignY = obj.y;
            obj.alignScale = obj.scale;
            obj.alignAngle = obj.angle || 0;
            //obj.alignCustomOffset = obj.customAlignOffset || 0; 
            obj.alignTotalOffset = (obj.tOffset || 0) + (obj.customAlignOffset || 0); 
        }
    });

    // 2. МЕНЯЕМ режим
    gCanvasMode = (gCanvasMode === "free") ? "align" : "free";    
    console.log("Switched to:", gCanvasMode);

    // 3. ПРИМЕНЯЕМ данные НОВОГО режима
    if (gCanvasMode === "align") {
        updateLogIndices(); // если добавили новых букв пересчитываем, чтобы они были в правильном порядке на сплайне
        updateTracking(gCanvasObjects, false); 

        gCanvasObjects.forEach(obj => {

            if (obj.alignScale !== undefined) {
                obj.x = obj.alignX;
                obj.y = obj.alignY;
                obj.scale = obj.alignScale;
                obj.angle = obj.alignAngle;
            }

            // ИСПРАВЛЕНО: Проверяем TotalOffset
            if (obj.alignTotalOffset !== undefined) {
                // Восстанавливаем дельту относительно нового (свежего) tOffset
                obj.customAlignOffset = obj.alignTotalOffset - (obj.tOffset || 0);
            } else {
                // Если это самый первый вход в жизни этого объекта — обнуляем дельту
                obj.customAlignOffset = 0;
            }

        });
        if(!splineExampleActive){
            splineExampleActive = true;

        }

    } else {
        // Возвращаемся в Free
        gCanvasObjects.forEach(obj => {
            if (obj.freeScale !== undefined) {
                obj.x = obj.freeX;
                obj.y = obj.freeY;
                obj.scale = obj.freeScale;
                obj.angle = obj.freeAngle;
            }
        });
    }

    // Обновление иконки
    const canvasSwitchBtn = document.getElementById("canvasSwitchBtn");
    if (canvasSwitchBtn) {
        const baseIcon = canvasSwitchBtn.querySelector("img");
        baseIcon.src = (gCanvasMode === "free")
            ? "./assets/svg/free.svg" 
            : "./assets/svg/spline.svg";
    }

    renderGlobalCanvas();
}

const canvasSwitchBtn = document.getElementById("canvasSwitchBtn");
canvasSwitchBtn.onclick = () => callSwitchCanvasMode()

globalCanvas.addEventListener("mousedown", e => {

    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        // Убирает синее выделение текста мгновенно
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }

    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur(); 
    }

    if(startwindow){
        e.preventDefault();
        return
    }

    activeCanvas = 'global'; // Метка
    console.log("Click!");

    if (selectedTiles.length > 0){
        // 1. Мгновенно гасим всё выделенное ранее (через наш хак с Reflow)
        const tilesToReset = document.querySelectorAll('.tile.selected');
        tilesToReset.forEach(t => {
            t.style.transition = 'none'; 
            t.classList.remove('selected');
            void t.offsetWidth; 
            t.style.transition = ''; 
        });

        // 2. Обнуляем массив
        selectedTiles.length = 0;
    }

    
    const { x: mx, y: my , wx, wy} = getCanvasMousePosAlt(globalCanvas, e);

    startMouseX = e.clientX; // Canvas = на всю страницу
    startMouseY = e.clientY;
    //startMouseX = mx; 
    //startMouseY = my; //replace lastMouse

    const clicked = getObjectAt(wx, wy);

    if (gBackgroundSelected) {
        isDragging = true;
        startMouseX = mx - gBackgroundImage.x;
        startMouseY = my - gBackgroundImage.y;

    } else if (clicked) {
        isDragging = true;
        dragTargetG = clicked; // Важно: dragTargetG хранит информацию ЧТО именно мы тянем

        if (clicked.type === 'gobject') {
            
            const obj = clicked.item;
            
            if (!e.shiftKey && !selectedObjects.includes(obj)) {
                
                const selectedItem = obj.item;

                selectedObjects = [obj];
                
                //if(currentItemIndex !== null){

                if(currentDataArray?.length>0){
                    currentDataArray = selectedItem.array; //+

                    // Select One Char Logic

                    if(!glyphMapViewer || (hideTilesFlag && !textInSearchBar) ) {
                        //console.log("Click withoutViewer!", selectedItem.aindex, glyphMapViewer )
                        const targetTile = document.querySelector(`#cmap .tile[data-array-index="${selectedItem.aindex}"]`);
                        console.log("Click withoutViewer!", selectedItem.aindex, targetTile )
                        clickMap(targetTile, selectedItem.aindex);
                    }else{
                        
                        const char = selectedItem.name; //+
                        const unicode = selectedItem.unicode;

                        console.log("Click gobject!", currentItemIndex, char, unicode);

                        hideSelTiles("soloClick", unicode)
                    }

                }


            } else if (e.shiftKey && !selectedObjects.includes(obj)) {
                
                selectedObjects.push(obj);
                
                //const selectedNamesArray = selectedObjects.map(o => o.item.name);
                const selectedUnicodesArray = selectedObjects.map(obj => obj.item.unicode);
                
                hideSelTiles("shiftClick", selectedUnicodesArray);
            }

            // Логика смещения (Dragging) для группы объектов

            if (gCanvasMode === "align") {
                // Для сплайна нам важно, насколько далеко мышь ушла от текущего tOffset
                const mouseProgress = splineObject.getClosestProgress(wx, wy);
                const mousePosPx = mouseProgress * splineObject.totalLength;
                
                dragOffsets = selectedObjects.map(o => ({ 
                    clickOffsetDelta: mousePosPx - (o.customAlignOffset || 0)
                }));
            } else {
                // Старая логика для free mode
                dragOffsets = selectedObjects.map(o => ({ x: mx - o.x, y: my - o.y }));
            }

            // Z-Order: выносим на передний план (только для обычных объектов)
            /*
            const idx = gCanvasObjects.indexOf(obj);
            if (idx > -1) {
                gCanvasObjects.push(gCanvasObjects.splice(idx, 1)[0]);
            }
            */

        } else if (clicked.type === 'spoint') {
            // Для точки сплайна
            if (!e.shiftKey) selectedObjects = [];
            const pt = clicked.shape.epts[clicked.pointIdx];
            dragOffsets = { x: mx - pt[0], y: my - pt[1] };
        }

    } else {
        
        // --- НАЧАЛО РАМКИ ---
        if (e.button === 1) { // middleMouseBut
            e.preventDefault();
            return; 
        }

        isSelecting = true;
        setSelectionBox(wx,wy);
        if (!e.shiftKey){
            selectedObjects = []; // Снимаем старое выделение, если нет Shift
            hideSelTiles("unhideAll") 
        }
    }

    renderGlobalCanvas();

    if(isDragging){
        editorCanvas.style.cursor = "grabbing";
    }
    e.preventDefault();
});



window.addEventListener("mousemove", e => { 
// Вся логика перемещение мыши из Canvas перемещена в глобалку

    if(startwindow) return e.preventDefault();

    if (activeCanvas !== 'editor') {

        const { x: mx, y: my , wx, wy} = getCanvasMousePosAlt(globalCanvas, e);

        if (isDragging) {

            const dx = mx - startMouseX;
            const dy = my - startMouseY;

            if (gBackgroundSelected) {
                gBackgroundImage.x = dx;
                gBackgroundImage.y = dy;

            } else if (dragTargetG) {

                // 1. Считаем, на сколько сдвинулась мышь с ПРЕДЫДУЩЕГО кадра

                if (dragTargetG.type === 'gobject') {
                    // Перемещение группы обычных объектов
                    if (selectedObjects.length > 0) {

                        if (gCanvasMode === "align") {
                            // 1. Считаем положение мыши на сплайне ОДИН РАЗ для всех
                            const mouseProgress = splineObject.getClosestProgress(wx, wy);
                            const mousePosPx = mouseProgress * splineObject.totalLength;

                            // 2. Один цикл для обновления всех выделенных объектов
                            selectedObjects.forEach((obj, i) => {
                                obj.customAlignOffset = mousePosPx - dragOffsets[i].clickOffsetDelta;
                            });
                            
                        } else {
                            // Логика свободного режима (один цикл)
                            selectedObjects.forEach((obj, i) => {
                                const newX = mx - dragOffsets[i].x;
                                const newY = my - dragOffsets[i].y;
                                obj.x = newX;
                                obj.y = newY;
                            });
                        }
                    }

                }else if (dragTargetG.type === 'spoint') {

                    const shape = dragTargetG.shape;
                    
                    if (e.shiftKey) {
                        // Если Shift зажат — двигаем "базу" всего сплайна
                        shape.pos.x += dx;
                        shape.pos.y += dy;
                    } else {
                        // Если Shift не зажат — двигаем конкретную локальную точку
                        const pt = shape.epts[dragTargetG.pointIdx];
                        pt[0] += dx;
                        pt[1] += dy;
                    }

                    shape.refreshPath();
                }

                if(mHeaderActive){

                    const distance = Math.sqrt(dx * dx + dy * dy);

                    //const startHeader = document.getElementById("startHeader");

                    let newOpacity = mHeaderAlpha - (distance / 50);
                    
                    if (newOpacity < 0){
                        newOpacity = 0;
                        mHeaderActive = false;
                        mHeaderComplete = true;
                        mSublineActive = false;
                    }
                    //startHeader.style.opacity = newOpacity.toString();

                    mHeaderAlpha = newOpacity;
                }

                // 2. Обновляем "точку отсчета" для следующего кадра
                if (dragTargetG.type === 'spoint' || mHeaderActive) {
                    startMouseX = mx;
                    startMouseY = my;
                }

               // console.log(distance,newOpacity)
            }

        } else if (isSelecting) {
            selBox.x2 = wx;
            selBox.y2 = wy;
        }

        if(isDragging || isSelecting){
            renderGlobalCanvas();
        }

    }else{
        const { x: mx, y: my } = getCanvasMousePosOrig(canvas, e);
        if(draggedGuide){
            cleanTempVariables();
        }else{

            if (isSelecting) {
                selBox.x2 = mx;
                selBox.y2 = my;
            }
        }

        renderEditorCanvas();
    }
});

window.addEventListener("mouseup", e => {
    if(startwindow){
        e.preventDefault();
        return
    }

    isMouseDown = false;
    const params = getEditorTransformParams();

    if (draggedGuide) {
        //console.log(`Линия ${draggedGuide.label} установлена на: ${draggedGuide.pos}`);
        
        if (draggedGuide.vert) {
            
            // Для вертикальных
            
            currentPos = fontOverrides.rsbDelta;
            targetPos = params.x + params.width; 
        
        }else{

            // Для горизонтальных
            if(isSameHeightTemp && draggedGuide.label === "Ascender"){
                    currentPos = fontOverrides.ascender;
                    targetPos = params.as;
            }else{

                if (draggedGuide.label === "CapHeight"){
                    currentPos = fontOverrides.sCapHeight;
                    targetPos = params.ch;
                }             

                if(draggedGuide.label === "X-Height"){
                    currentPos = fontOverrides.sxHeight;
                    targetPos = params.xh;
                }

                if(draggedGuide.label === "Ascender"){
                    currentPos = fontOverrides.ascender;
                    targetPos = params.as;
                }
                
                if(draggedGuide.label === "Descender"){
                    currentPos = fontOverrides.descender;
                    targetPos = params.ds;
                } 
            }


        }

        animatingLabel = draggedGuide.label;
        //console.log(animatingLabel, "ТЕКУЩАЯ", currentPos, "ИДЕМ К", targetPos)

        startSnapping(); 
        
        draggedGuide = null;
        shapeSequenceData = null; // Очищаем слепок
        
    }

    fMouseTempX = 0; fMouseTempY = 0; initialValue = 0;

    if (e.button === 1) { // колёсико
        isPanning = false;
    }

    if (pEditMode && currentProcedureGlyph && procSelected) { // Procedure Letter
        procDragged = false

        updateProcedureGlyphDeltas(); // выводим в консоль

        const ptIndex = procSelected.selectedIndex;
        if (typeof ptIndex === 'string' && ptIndex.startsWith('mid_')) {
            procSelected.selectedIndex = null;
            procSelected.midSelect = null; // флаг для отображения
        }

        procSelected = null; 
        tempDeltas = null;
        tempMidDeltas = null;
        commitGlyphEdits();
    }

    if (isSelecting) {

        if (activeCanvas === 'global') {
            const found = getItemsInBox(gCanvasObjects, selBox, obj => {
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

            if(found.length>0){
                
                //const selectedNamesArray = selectedObjects.map(obj => obj.item.name);
                const selectedUnicodesArray = selectedObjects.map(obj => obj.item.unicode);
                
                hideSelTiles("shiftClick", selectedUnicodesArray) 
            }
            


        } else if (activeCanvas === 'editor') {
                        
            if(bezierMode && currentContours){

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

            renderEditorCanvas();

        }

        if (activeCanvas !== 'editor') {
            // Считаем размер рамки
            const boxWidth = Math.abs(selBox.x2 - selBox.x1);
            const boxHeight = Math.abs(selBox.y2 - selBox.y1);

            if (boxWidth > 3 || boxHeight > 3) {
                
                const p1 = world.toScreen(selBox.x1, selBox.y1);
                const p2 = world.toScreen(selBox.x2, selBox.y2);

                const screenRect = {
                    l: Math.min(p1.x, p2.x),
                    r: Math.max(p1.x, p2.x),
                    t: Math.min(p1.y, p2.y),
                    b: Math.max(p1.y, p2.y)
                };

                selectedTiles.length = 0;
                document.querySelectorAll('#cmap .tile').forEach(tile => {
                    const r = tile.getBoundingClientRect();
                    const isInside = !(r.left > screenRect.r || r.right < screenRect.l || 
                                       r.top > screenRect.b || r.bottom < screenRect.t);

                    if (isInside) {
                        selectedTiles.push(tile);
                        tile.classList.add('selected'); 
                    } else {
                        tile.classList.remove('selected');
                    }

                    //tile.classList.toggle('selected', isInside);
                    //if (isInside) selectedTiles.push(tile);
                });
                
                console.log('Выбрано плиток:', selectedTiles.length);
            }
        }

    }

    console.log('Selected Tiles:', selectedTiles.map(t => t.dataset.arrayIndex));

    cleanTempVariables();

    e.preventDefault();
});



///////////

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
    
    // Перерисовываем ВСЁ, чтобы GlobalCanvas тоже увидел изменения
    renderEditorCanvas();
    renderGlobalCanvas(); 
}



function clickMap(element, arrayIndex){ // index > arrayIndex (from Font to Custom Array)
    //const item = glyphArray.find(it => it.index === index); 
    //console.log(item.unicode);
    console.log("clickMap")

    const tilesToReset = document.querySelectorAll('.tile.selected, .tile.active');
    tilesToReset.forEach(t => {
        t.style.transition = 'none'; 
        t.classList.remove('selected', 'active'); // Удаляем оба класса разом
        void t.offsetWidth; 
        t.style.transition = ''; 
    });
    selectedTiles.length = 0; // Теперь массив точно чист


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
        
        console.log("Click on:", currentDataArray === compArray ? "component" : "glyph", currentItemIndex);
    }

    callGlypthEditor(true);

    redrawActiveGlyphInCanvas();

    if(displayObjectInfo==true){
        updateObjectStats();
    }

    if (pEditMode){
        updateCodeEditor();
    }
}

function closeOverlays() {
    const aboutPanel = document.getElementById("aboutPanel");
    const exportPanel = document.getElementById("exportPanel");

    const wasOpen = !aboutPanel.hidden || !exportPanel.hidden;

    // Закрываем всё (даже если уже закрыто, вреда не будет)
    aboutPanel.hidden = true;
    
    exportPanel.hidden = true;
    mExportBtn.classList.remove("active")

    mAboutBtn.classList.remove("active");
    return wasOpen;
}

// Перевести потом в единую функцию
function callGlobalCanvas(option){

    if (closeOverlays()) return;

	if (option !== undefined) {
		globalCanvasFlag = option;
	}else{
		globalCanvasFlag = !globalCanvasFlag;
	}
	
	console.log("CallSampleEditor", globalCanvasFlag);
    
    const gCanvasWrapper = document.getElementById("gCanvasWrapper");
	
    if(globalCanvasFlag==true){
		
        if (gCanvasWrapper) gCanvasWrapper.hidden = false;

	}else{

        if (gCanvasWrapper) gCanvasWrapper.hidden = true;

	}

    resizeGlobalCanvas();
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

    //console.log("checkActiveTileStyle",currentItemIndex,tempElement, arrayViewer)
}

function callGlypthEditor(option) {
    
    if (closeOverlays()) return;

	if (option !== undefined) {
		glyphEditorFlag = option;
	}else{
		glyphEditorFlag = !glyphEditorFlag; 
	}
	
	console.log("callGlyphEditor:", glyphEditorFlag);

    const eCanvasWrapper = document.getElementById("eCanvasWrapper");
    
    if(glyphEditorFlag==true){ // открытие
        
        //eCanvasWrapper.hidden = false;
        if(eCanvasWrapper) eCanvasWrapper.hidden = false;

        mGlyphMapBtn.classList.add("active")
        
        if(pEditMode){
            //console.log("Открываем код вьювер");
            eProcedBtn.classList.add("active");
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

        //eCanvasWrapper.hidden = true;
        if(eCanvasWrapper) eCanvasWrapper.hidden = true;

        editorCodeBlock.hidden = true;

	    mGlyphMapBtn.classList.remove("active");
        eProcedBtn.classList.remove("active");
        eBezierBtn.classList.remove("active");

	}

    resizeGlobalCanvas();
}


function callGlyphMap(option) {
    
    if (closeOverlays()) return;

    if (option !== undefined) {
        glyphMapViewer = option;
    }else{
        glyphMapViewer = !glyphMapViewer; 
    }
    
    console.log("callGlyphMap:", glyphMapViewer);

    const cmapContainer = document.getElementById("cmapContainer");

    if(glyphMapViewer==true){ // открытие
        
        cmapContainer.hidden = false;
        mGlyphMapBtn.classList.add("active")

    }else{ // закрытие

        cmapContainer.hidden = true;
        mGlyphMapBtn.classList.remove("active");
    }

    resizeGlobalCanvas();
}


function callGlyphInfoMode(option) {
    if (option !== undefined) {
        displayObjectInfo = option;
    } else {
        displayObjectInfo = !displayObjectInfo; 
    }
    
    console.log("callInfoMode:", displayObjectInfo);

    const eCanvasTextInfo = document.getElementById("eCanvasTextInfo");
    const eStatsBtn = document.getElementById("eStatsBtn");

    if(displayObjectInfo==true){
        eStatsBtn.classList.add("active")
        eCanvasTextInfo.hidden = false;
        
    }else{
        eStatsBtn.classList.remove("active");
        eCanvasTextInfo.hidden = true;
    }

    updateObjectStats();

    renderEditorCanvas();
    
}


function callGuidesMode(option) {
    if (option !== undefined) {
        displayGuide = option;
    } else {
        displayGuide = !displayGuide; 
    }
    
    console.log("callGuidesMode:", displayGuide);

    if(displayGuide==true){
        eGuidesBtn.classList.add("active")
        
    }else{
        eGuidesBtn.classList.remove("active");
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

        eProcedBtn.classList.add("active");
        createProcedureGlypth();
        createCodeEditor();
        editorCodeBlock.hidden = false;
        updateCodeEditor();

    }else{
        eProcedBtn.classList.remove("active");
        //removeProcedureGlyph(); / BETA
        editorCodeBlock.hidden = true;
    }
    if(draw == true){
        redrawActiveGlyphInCanvas();
    }
    
}
function checkDeltasBtn(option){
    const resetDeltasBtn = document.getElementById("resetDeltasBtn");
    let state;

    if (option !== undefined) {
        state = option;
    } else {
        state = !state; 
    }

    if(state==true){
        resetDeltasBtn.hidden = false;
        //resetDeltasBtn.classList.add("active");
    }else{
        resetDeltasBtn.hidden = true;
        //resetDeltasBtn.classList.remove("active"); 
    }

    resetDeltasBtn.onclick = () => {
        resetDeltasBtn.hidden = true;
        if(currentProcedureGlyph){
            const char = currentProcedureGlyph.symbol;

            if (GLYPH_DELTAS[char]) GLYPH_DELTAS[char] = {};
            currentProcedureGlyph.customDeltas = false;

            procDragged = false
            updateProcedureGlyphDeltas(); // выводим в консоль
            procSelected = null; 
            
            commitGlyphEdits();

            redrawActiveGlyphInCanvas();

        }
        renderEditorCanvas()
        
    };
}

function callSwitchBezierMode(option) {
     if (option !== undefined) {
        cTransformMode = option;
    } else {
        cTransformMode = !cTransformMode; 
    }
    console.log("callSwitchBezierMode:", cTransformMode);
    renderEditorCanvas();
    
    const bezTransformModeBtn = document.getElementById("bezFill");
    const bezPointEditModeBtn = document.getElementById("bezCorner");

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
        ? "./assets/svg/triangleBlackFill.svg" 
        : "./assets/svg/triangleWhiteFill.svg";

    iconCorner.src = cTransformMode 
        ? "./assets/svg/triangleWhiteStroke.svg" 
        : "./assets/svg/triangleBlackStroke.svg";

}
const bezTransformModeBtn = document.getElementById("bezFill");
bezTransformModeBtn.onclick = () => callSwitchBezierMode(true);

const bezPointEditModeBtn = document.getElementById("bezCorner");
bezPointEditModeBtn.onclick = () => callSwitchBezierMode(false);


function callBezierMode(option, draw=true, save=true) {
    if (closeOverlays()) return;

     if (option !== undefined) {
        bezierMode = option;
    } else {
        bezierMode = !bezierMode; 
    }
    
    console.log("callBezierMode:", bezierMode);

    const hornersBtns = document.getElementById("HornersBtns");
        
    if(bezierMode==true){

        if(pEditMode){ callGEditMode(false); }

        eBezierBtn.classList.add("active")
        
        if (!generatedFont){
            callSwitchBezierMode(cTransformMode);
        }

        hornersBtns.hidden = false;

        editMode = true
        const glyphCommands = currentGlyph?.path?.commands ?? [];
        currentContours = buildEditableContours(glyphCommands);
            
    }else{
        eBezierBtn.classList.remove("active");
        
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

let topMenuExpanded = false;
function expandTopMenu(option) {
    if (closeOverlays()) return;

    if (option !== undefined) {
        topMenuExpanded = option;
    } else {
        topMenuExpanded = !topMenuExpanded; 
    }
    
    console.log("expandTopMenu:", topMenuExpanded);

    const mAboutBtn = document.getElementById("mAboutBtn");
    const mExportBtn = document.getElementById("mExportBtn");
    
    if(topMenuExpanded==true){

        mExpandMenuBtn.classList.add("active")
        
        mAboutBtn.hidden = false;
        mExportBtn.hidden = false;
        mGlyphMapBtn.hidden = false;
    }else{
        mExpandMenuBtn.classList.remove("active")

        mAboutBtn.hidden = true;
        mExportBtn.hidden = true;
        mGlyphMapBtn.hidden = true;
    }

}






function switchArrayViewer(option, draw=true) {
    if (closeOverlays()) return;
    //if (hideTilesFlag) return;

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

function callAboutPanel(){
    
    const aboutPanel = document.getElementById("aboutPanel");
    if(!aboutPanel) return

    const hid = !aboutPanel.hidden;
    aboutPanel.hidden = hid;

    if(hid==false){
        mAboutBtn.classList.add("active");
    }else{
        mAboutBtn.classList.remove("active");
    }
}




// Buttons Section

generateApply.onclick = () => startProcessGenerate();

// TopMenu Buttons : callAboutPanel, callExportPanel, callCMAP < ExpandMenu

const mAboutBtn = document.getElementById("mAboutBtn");
const mExportBtn = document.getElementById("mExportBtn");
const mGlyphMapBtn = document.getElementById("mGlyphMapBtn");
const mExpandMenuBtn = document.getElementById("mExpandMenuBtn");

mAboutBtn.onclick = () => callAboutPanel();
mExportBtn.onclick = () => callExportPanel();
mGlyphMapBtn.onclick = () => callGlyphMap();
mExpandMenuBtn.onclick = () => expandTopMenu();


// OtherButtons

// Switch Diffirent Mode CMAP
const hideAllTilesBtn = document.getElementById("hideAllTilesBtn");
hideAllTilesBtn.onclick = () => hideAllTiles();

const switchCmapViewer = document.getElementById("switchCmapViewer");
switchCmapViewer.onclick = () => switchArrayViewer();

const closeAboutBtn = document.getElementById("closeAboutBtn");
closeAboutBtn.onclick = () => callAboutPanel();

// editorCanvas Bottom Buttons
const eCloseBtn = document.getElementById("eCloseBtn");
const eProcedBtn = document.getElementById("eProcedBtn");
const eGuidesBtn = document.getElementById("eGuidesBtn");
const eBezierBtn = document.getElementById("eBezierBtn");
const eStatsBtn = document.getElementById("eStatsBtn");

eCloseBtn.onclick = () => callGlypthEditor(false);
eProcedBtn.onclick = () => callGEditMode();
eGuidesBtn.onclick = () => callGuidesMode();
eBezierBtn.onclick = () => callBezierMode();
eStatsBtn.onclick = () => callGlyphInfoMode();

// globalCanvas Buttons
const gCanvasExportBtn = document.getElementById('gCanvasExportBtn');
gCanvasExportBtn.onclick = () => callExportPanel();





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

    const cod = e.code;
    const key = e.key;

    const pressedCtrl = e.ctrlKey;
    const pressedShift = shiftMode = e.shiftKey;

    if(pressedShift) renderEditorCanvas();

    const isZ = cod === 'KeyZ';
    const isY = cod === 'KeyY';
    const isF = cod === 'KeyF';

    if(startwindow){
        const skipbtns = (cod === "KeyF" || cod === "Space");

        // for user editable input
        if (target.tagName === 'INPUT' && skipbtns){
            if(cod === "Space") return safeReturn(true,false) // heh

            return safeReturn(false, false)
        }

        if ( (cod === "Enter" || skipbtns) && !pressedCtrl ){
            
            console.log("SkipPress");
            generateApply.click();
            return safeReturn(); // останавливаем срабатывание шорткатов
        }

        return safeReturn(false, false) // пропускает ввод
    }

    if (target.tagName === 'INPUT' && target.type === 'text') {
        console.log("return from text input")
        if(cod === "Enter"){
            const oAddElementBlock = document.getElementById("oAddElementBlock"); 
            if(oAddElementBlock?.hidden == false){
                const pushBtn = document.getElementById("pushBtn");
                pushBtn.click();
                return safeReturn()
            }
        }
        return safeReturn(false, false) // for user editable input

    }else if(target.tagName === 'INPUT' && target.type === 'range') {
        console.log("return from range")
        return safeReturn() 
    }else if(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        console.log("return from any editable")
        return safeReturn(false, false) 
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
        callSearchBar();
        return safeReturn()
    }

    if (cod === "KeyG") {
        callGuidesMode();
        /*
        if (!glyphEditorFlag) {
            callGlypthEditor(true)
            callGuidesMode(true)
            return safeReturn()
        } else if (glyphEditorFlag && displayGuide) {
            callGuidesMode(false)
            return safeReturn()
        } else {
            callGlypthEditor(false)
            return safeReturn()
        }
        */
    } 
    else if (cod === "KeyC") {
        console.log("pressC");
        if(generatedFont){
            switchArrayViewer()
            return safeReturn()
        }
        if (glyphEditorFlag) {
            //callGEditMode()
            return safeReturn()
        }
    }
    else if (cod == "NumpadMultiply"){
        expandTopMenu();
        return safeReturn();

    } else if(cod === "Backquote"){
        expandTopMenu();
        return safeReturn();     
    }
    else if (cod === "KeyU") recordShapeSequence(true);
    else if (cod === "KeyA" || cod === "Enter" || cod === "Space") callSwitchCanvasMode();
    else if (cod === "KeyS") callGlyphInfoMode(); //callGlobalCanvas();
    else if (cod === "KeyP" || cod === "KeyB" || cod === "KeyH") callBezierMode();
    else if (cod === "KeyF"){
       
       console.log("pressF!"); 
       
       if (!glyphEditorFlag) {
            callGlypthEditor(true);
            callGEditMode(true)
       } else {
            callGEditMode(!pEditMode)
       }
       return safeReturn()
    } 
    else if (cod === "KeyI") {
       if (!glyphEditorFlag) {
            callGlypthEditor(true)
            callGlyphInfoMode(true)
       } else {
            callGlyphInfoMode(!displayObjectInfo)
       }
       return safeReturn()
    }
    else if (cod === "KeyM") callGlyphMap();
    

    if (key >= "1" && key <= "9") { //Numeration-1
        
        const i = key.charCodeAt(0) - 49;
    
        if (i == 0)      topMenuExpanded && callAboutPanel();
        else if (i == 1) topMenuExpanded && callExportPanel();
        else if (i == 2) topMenuExpanded && callGlyphMap();
        else if (i == 3) expandTopMenu();
        else if (i == 7) expandTopMenu();

        return safeReturn()
    }
    

    // Удаление объектов (Delete или Backspace)
    if ((cod === "Delete" || cod === "Backspace") && selectedObjects.length > 0) {
        e.preventDefault();
        
        gCanvasObjects = gCanvasObjects.filter(o => !selectedObjects.includes(o));
        selectedObjects = [];
        
        renderGlobalCanvas()
        return safeReturn()
    }

    // return safeReturn() // Чтобы ctrl+r не сбрасывал
}
window.onkeyup = (e) => {
    if (e.key === 'Shift') { // из условия что отпущен именно shift
        shiftMode = false;
        console.log(shiftMode)
        if(glyphEditorFlag) renderEditorCanvas();
    }
};

function showIframeFallback() {

    const container = document.getElementById('readmeFramePast');
    const rdm = document.getElementById('readmeContent'); 
    rdm.style.padding = "0";
    rdm.style.paddingTop = "24px"; // Большое T, без дефиса
    rdm.style.paddingRight = "12px"; // Большое T, без дефиса
    container.style.width = "100%";
    container.style.height = "70vh"; 

    container.innerHTML = `
        <iframe id="readmeFrame" src="./README.md" frameborder="0" ></iframe>
    `;

    const readmeFrame = document.getElementById('readmeFrame');

    document.getElementById('readmeContent').innerHTML  = "Ошибка загрузки документации<br> Fallback on iFrame Readme";

    const frame = document.getElementById('readmeFrame');
    const isDark = window.getComputedStyle(frame).colorScheme === 'dark' || 
                   window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDark) {
        frame.style.filter = 'none';
    } else {
        frame.style.filter = 'invert(1)';
    }

    readmeFrame.hidden = false;
}


async function loadReadme() {
    if (window.location.protocol === 'file:') {
        showIframeFallback();
        return; 
    }

    try {
        const response = await fetch('README.md');
        const markdown = await response.text();
        
        // Превращаем Markdown в HTML
        const htmlContent = marked.parse(markdown);
        document.getElementById('readmeContent').innerHTML = htmlContent;

    } catch (err) {
        //console.error("Не удалось загрузить README:", err);
        showIframeFallback();
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


// Export Panel Section


const eFontnameLine = document.getElementById("eFontname");
const eStylenameLine = document.getElementById("eStylename");
const eDesignerLine = document.getElementById("eDesigner");
const eCommentLine = document.getElementById("eComment");

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



function callExportPanel(option) {
    console.log("callExportPanel");

    if (closeOverlays()) return;    

    if(!generatedFont){
        exportFontRebuild(); 
        return
    }

    updateExportLines()
    
    const exportPanel = document.getElementById("exportPanel");

    const val = !exportPanel.hidden;
    
    if(val){
        mExportBtn.classList.remove("active")
    }else{
        mExportBtn.classList.add("active")
    }

    exportPanel.hidden = val;
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
        
        if(startwindow) return

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



function exportJSON() {

  initRecipesText();


  const gFamilyName = GFONT_PARAMS.name; 
  const familyName = customParamInput.familyName || gFamilyName;

  const gDesigner = "I AM?";
  const designer = customParamInput.designer || gDesigner;

  const data = JSON.stringify({ 
      GLYPH_RECIPES_TEXT, 
      GFONT_PARAMS,
      familyName,
      designer
  });

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); 
  
  a.href = url; 
  a.download = `${GFONT_PARAMS.name.toLowerCase()}.fe`

  a.click();
  URL.revokeObjectURL(url); // очистить память
}



const eBtnClosePanel = document.getElementById("eBtnClosePanel");
const eBtnExportRecipe = document.getElementById("eBtnExportRecipe");
const eBtnExportFont = document.getElementById("eBtnExportFont");

eBtnClosePanel.onclick = () => callExportPanel();
eBtnExportRecipe.onclick = () => exportJSON();
eBtnExportFont.onclick = () => exportFontRebuild();


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

//createButton(topMenuBtnRow, "CBOARD", "COMPONENTS", openComponents);
//createButton(panel, "ID2", "NAME2", () => openComponents("аргумент"));

*/