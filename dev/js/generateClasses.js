let generatedFont = false;
let pEditMode = false;

let currentGlyph = null;
let currentGlyphIndex = null;

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

  alignToPoints(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    this.angle = Math.atan2(dy, dx) * 180 / Math.PI;
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
        const scaleCircle = 14;
        ctx.fillRect(this.xStart() - 2, this.yStart() - 2, scaleCircle, scaleCircle);
        ctx.fillRect(this.xEnd() - 2, this.yEnd() - 2, scaleCircle, scaleCircle);
    }
  }
}

class stemLine { // Like A Skeletal Logic
    constructor(type = "vs", pts = [], w = 300, penAngle = 0) { //offset, 
        //vs - пресет Vertical Stem
        //hs - пресет Horizontal Stem

        this.type = type;
        this.w = w;
        this.penAngle = penAngle;
        // pts ожидает массив объектов {x, y}
        this.rawPts = pts; 
        this.pens = [];
        this.update();
    }

    update() {
        // Создаем экземпляры PenLine по точкам stemLine
        this.pens = this.rawPts.map(p => new penLine(p, this.w, this.penAngle));
    }

    constrain(index, targetStem, t = 0.5) {
        const p1 = targetStem.rawPts[0];
        const p2 = targetStem.rawPts[targetStem.rawPts.length - 1];

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
  constructor({h = 20, w = 30, iline = 0.5, side = "top", inv = false} = {}) {
    this.height = k;
    this.width = w;
    this.interline = iline;
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
    this.elements = [];
    this.dirty = true;
    this.build();
  }

  build() {
    this.elements = this.recipeFn(this.params);
    this.dirty = false;
  }

  drawCanvas(ctx, mode = "render") {
    this.elements.forEach(el => el.drawCanvas(ctx, mode));
  }

  exportPath() {
    // пересобирает путь из текущих элементов
    return generateGlyphPath(this.symbol, GLYPH_RECIPES, GFONT_PARAMS)
  }
}

const GLYPH_RECIPES = {
    "A": (p) => {
        // 1. Создаем левую и правую "ноги"
        const lLeg = new stemLine("vs", [{x: 0, y: 0}, {x: p.w/2, y: p.ch}], p.t, 0);
        const rLeg = new stemLine("vs", [{x: p.w, y: 0}, {x: p.w/2, y: p.ch}], p.t, 0);
        
        // 2. Склеиваем верхушки (индекс 1 у обеих линий — это верх)
        // t = 1.0 означает конец линии lLeg
        rLeg.constrain(1, lLeg, 1.0);

        // 3. Создаем перекладину (координаты 0,0 заменятся констрейнтами)
        const bridge = new stemLine("hs", [{x: 0, y: 0}, {x: 0, y: 0}], p.t, 90);

        // 4. Привязываем перекладину к ногам на высоте 40% (t = 0.4)
        bridge.constrain(0, lLeg, 0.4); 
        bridge.constrain(1, rLeg, 0.4);

        return [lLeg, rLeg, bridge];
    },

    "H": (p) => {
        // 1. Создаем объекты
        const left = new stemLine("vs", [{x: 0, y: 0}, {x: 0, y: p.ch}], p.t, 0);
        const right = new stemLine("vs", [{x: p.w - p.t, y: 0}, {x: p.w - p.t, y: p.ch}], p.t, 0);
        const bridge = new stemLine("hs", [{x: 0, y: p.ch/2}, {x: p.w - p.t, y: p.ch/2}], p.t, 90);

        // Привязываем 0-ю точку моста к середине (0.5) левой стойки
        bridge.constrain(0, left, 0.5); 
        // Привязываем 1-ю точку моста к середине (0.5) правой стойки
        bridge.constrain(1, right, 0.5);

        return [left, right, bridge];
    },

};

function createProcedureGlypth() {
  if (!currentGlyph) return;
  const recipeFn = GLYPH_RECIPES[currentGlyph.name];
  if (!recipeFn) return;

  currentProcedureGlyph = new procedureGlyph(currentGlyph.name, recipeFn, GFONT_PARAMS);
  
  if(glyphEditor==true){
    renderEditorCanvas();
  }

}

function removeProcedureGlyph() {
  if (currentProcedureGlyph && currentGlyph) {
    currentGlyph.path = currentProcedureGlyph.exportPath();
    currentProcedureGlyph = null;
  }
  
  if(glyphEditor==true){
    renderEditorCanvas();
  }

}


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
    
    // Готовим индексы
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
    generatedFont = true; 

    printInformation(0);

    parseGlyphs(); 
    
    compBtn.hidden = false;
    dropzone.hidden = true;
    cPanelBlock.hidden = false;

    gEditBtn.hidden = false;

    console.log(`Шрифт "${GFONT_PARAMS.name}" создан. Всего глифов в системе: ${font.glyphs.length}`);
}


function renderEditorCanvas() {
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGuidelines();

    // Для не процедурных букв
    if(!currentGlyph) return

    const { x, baseline, renderSize, scale } = getTransformParams();

    ctx.translate(x, baseline)
    ctx.scale(scale, scale)
    ctx.scale(1, -1)

    if (pEditMode && currentProcedureGlyph) {
      // место вызова рендер метода для процедурных букв
      currentProcedureGlyph.drawCanvas(ctx, "editor");
      ctx.restore();
      return;
    }


    if(editMode && currentContours){
        ctx.lineWidth = 1 / scale
        ctx.strokeStyle = "#aaa"
        ctx.fillStyle = "rgba(180,180,180,0.2)"

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
            selectionBox.x1, 
            selectionBox.y1, 
            selectionBox.x2 - selectionBox.x1, 
            selectionBox.y2 - selectionBox.y1
        );
        ctx.setLineDash([]);
    }

    // Special Message for Variable
    if (variableFont && editMode && messageAlpha > 0) {
        ctx.save();
        // Применяем текущую прозрачность к фону и тексту
        ctx.globalAlpha = messageAlpha;

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

    ctx.restore(); // Закрываем самый первый save()
}

function callGEditMode(option) {
    if (option !== undefined) {
        pEditMode = option;
    } else {
        pEditMode = !pEditMode; 
    }
    
    console.log("callGEditMode:", pEditMode);

    if(pEditMode==true){
        gEditBtn.classList.add("active");
        createProcedureGlypth();
    }else{
        gEditBtn.classList.remove("active");
        removeProcedureGlyph();
    }
}

applySettingBtn.onclick = () => processGenerate();
gEditBtn.onclick = () => callGEditMode();