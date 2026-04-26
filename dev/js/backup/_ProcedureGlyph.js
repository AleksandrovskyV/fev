// All Classes for Procedure Glyph

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const lerp = (a,b,t)=>a+(b-a)*t;
const map = (n, start1, stop1, start2, stop2) => 
  ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;

const mapClamp = (n, start1, stop1, start2, stop2) => {
  const val = ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
  return Math.max(Math.min(val, Math.max(start2, stop2)), Math.min(start2, stop2));
};

const getMid = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

window.mapClamp = mapClamp;
window.clamp = clamp;
window.lerp = lerp;
window.map = map;

const GLYPH_DELTAS = {};
window.GLYPH_DELTAS = GLYPH_DELTAS;

class PenLine {
    constructor(pos = { x: 0, y: 0 }, w = 300, a = 0, c="yellow") {
        this.pos = pos;
        this.width = w;
        this.angle = a;
        this.color = c;
        this.updateOffsets();
    }

    // Sync and Updates
    updateOffsets() {
        const rad = this.angle * (Math.PI / 180);
        const hWidth = this.width / 2;
        this.dx = hWidth * Math.cos(rad);
        this.dy = hWidth * Math.sin(rad);
    }
    
    updateFromBase(x, y, width) {
        this.pos = { x, y };
        this.width = width;
        this.updateOffsets();
    }

    // Helpers
    setAngle(a) {
        this.angle = a;
        this.updateOffsets();
    }

    // Теперь это просто свойства
    xStart() { return this.pos.x - this.dx; }
    yStart() { return this.pos.y - this.dy; }
    xEnd() { return this.pos.x + this.dx; }
    yEnd() { return this.pos.y + this.dy; }

    // Теперь это просто свойства
    /*
    xHandleA() { return this.pos.x  } //- this.dx;
    yHandleA() { return this.pos.y + this.dy; }
    xHandleB() { return this.pos.x  } //+ this.dx;
    yHandleB() { return this.pos.y - this.dy; }
    */

    // Rendering
    drawCap(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "#1c1c1c";
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.stroke();
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

            // 2. Рисуем центральную точку (узел StemLine)
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
}


        
class StemLine { // Like A Skeletal Logic
    constructor(pts = [], w = 300, penAngle = 0, color = "blue", ownerSymbol = null, index = null) { //offset, 
        //vs - пресет Vertical Stem
        //hs - пресет Horizontal Stem
        //cp - пресет Constrain Stem ?
        //this.type = type;

        this.w = w; //width stem
        this.penAngle = penAngle;
        this.color = color;
        
        this.ownerSymbol = ownerSymbol; // "А", "у" и т.д.
        this.index = index;   // 0, 1, 2...

        // pts ожидает массив объектов {x, y}
        this.rawPts = pts; 
        this.cPts = null; // constrain generated pts
        

        //this.iPts = null; // innerSegmantation
        this.mid = getMid(this.rawPts[0], this.rawPts[1]);
        
        this.splineObject = new ShapeData('bspline-open', { x: 0, y: 0 } ,
            [ 
                [ this.rawPts[0].x, -this.rawPts[0].y], 
                [ this.mid.x, this.mid.y], 
                [ this.rawPts[1].x, this.rawPts[1].y ] 
            ] 
        );
        this.splineObject.steps = 64;
        this.splineObject.color = this.color;
        this.splineObject.displayMode = "dash"
        this.splineObject.refreshPath();

        console.log("SplineInit", this.splineObject.epts);

        
        this.pens = this.rawPts.map(p => new PenLine(p, this.w, this.penAngle, this.color));
        
        this.selectedIndex = null; // stem inner index
        this.customDeltas = false;
        this.animationTime = 1.0;

        this.update();

    }


    // Sync and Updates
    update() {

        let length = 0;

        const finalCoords = []; // Для сплайна

        //this.rawPts

        this.pens.forEach((pen, i) => {            
            const pt = this.rawPts[i];
            
            // 1. Управляем связями (если они есть)
            if (pt.origin) {
                this.updateConstrains(i); 
                if (pt.autoAngle) this.alignPensAngle(i);
            }

            // 2. Управляем финальной позицией пера
            const { dx, dy } = this.getDeltas(i);
            
             // Для сплайна
            const finalX = pt.x + dx;
            const finalY = pt.y + dy;
            finalCoords.push({ x: finalX, y: finalY });

            // Вынесли установку координат в само перо
            pen.updateFromBase(pt.x + dx, pt.y + dy, this.w);

            // 3. Расчет длины (начинаем со второй точки)
            if (i > 0) {
                const p1 = this.pens[i - 1].pos;
                const p2 = pen.pos;
                
                const segmentDx = p2.x - p1.x;
                const segmentDy = p2.y - p1.y;
                
                length += Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy);
            }

        });

        this.mid = getMid(finalCoords[0], finalCoords[1]);

        this.splineObject.epts = [
            [finalCoords[0].x, finalCoords[0].y], 
            [this.mid.x, this.mid.y ], // подумайте над логикой этой точки
            [finalCoords[1].x, finalCoords[1].y]
        ];


        this.splineObject.refreshPath();

        this.totalLength = length;
        //console.log("totalLe", this.totalLength)

    }

    updateConstrains(index) {
        const pt = this.rawPts[index];
        const target = pt.origin;
        if (!target) return;

        const baseT = pt.t;
        const owner = this.ownerSymbol;
        const sIndex = this.index;

        // Выносим общую логику расчета финального T и координат донора
        const getPointData = () => {
            const p0 = target.rawPts[0];
            const p1 = target.rawPts[target.rawPts.length - 1];
            const d0 = target.getDeltas(0);
            const d1 = target.getDeltas(target.rawPts.length - 1);

            const x0 = p0.x + d0.dx;
            const x1 = p1.x + d1.dx;
            const y0 = p0.y + d0.dy;
            const y1 = p1.y + d1.dy;

            const tOff = window.GLYPH_DELTAS?.[owner]?.[sIndex]?.tOffsets?.[index] || 0;
            const userT = Math.max(0, Math.min(1, baseT + tOff));

            let finalT = userT;
            if (pt.isInsert) {
                const len = Math.hypot(x1 - x0, y1 - y0) || 1;
                const dt = (this.w / 2) / len;
                finalT = dt + userT * (1 - 2 * dt);
            }

            return { t: Math.max(0, Math.min(1, finalT)), x0, x1, y0, y1 };
        };

        Object.defineProperties(pt, {
            x: {
                get: () => { const data = getPointData();
                    return data.x0 + (data.x1 - data.x0) * data.t;
                }, configurable: true
            },
            y: {
                get: () => { const data = getPointData();
                    return data.y0 + (data.y1 - data.y0) * data.t;
                }, configurable: true
            }
        });
    }

    // Helpers
    getDeltas(pointIndex) {
        if (!GLYPH_DELTAS) return { dx: 0, dy: 0 };
        const deltaObj = GLYPH_DELTAS[this.ownerSymbol]?.[this.index]; // StemIndex
        
        // Берем дельту именно для точки с индексом pointIndex
        const dx = deltaObj?.pts[pointIndex]?.x || 0;
        const dy = deltaObj?.pts[pointIndex]?.y || 0;
        
        if(this.customDeltas == false && deltaObj?.customDeltas == true ){

            this.customDeltas = true;

            console.log("User Moved Deltas", this.customDeltas)
            if(currentProcedureGlyph){
                currentProcedureGlyph.customDeltas = true; // это пиздец
                
            }
        }

        return { dx, dy };
    }

    checkHit(localX, localY, shouldSelect = false) { // shouldSelect - делает её selectable
         // Используется для нахождении точки на canvas

        let foundIndex = null;

        this.pens.forEach((pen, i) => {
            const { dx, dy } = this.getDeltas(i);
            const currentX = this.rawPts[i].x + dx;
            const currentY = this.rawPts[i].y + dy;
            const dist = Math.hypot(currentX - localX, currentY - localY);

            if (dist < 25) { 
                foundIndex = i;
            }
        });

        if (shouldSelect) {
            this.selectedIndex = foundIndex; 
        }

        return foundIndex !== null;
    }

    alignPensAngle(index) {
        const pt = this.rawPts[index];
        const target = pt.origin;
        const pen = this.pens[index];

        if (!target || !pen) return;

        // Берем точки донора
        const p0 = target.rawPts[0];
        const p1 = target.rawPts[target.rawPts.length - 1];

        // Берем дельты донора (чтобы угол менялся, когда донор наклоняется)
        const d0 = target.getDeltas(0);
        const d1 = target.getDeltas(target.rawPts.length - 1);

        // Считаем угол по актуальным координатам на экране
        const angle = Math.atan2(
            (p1.y + d1.dy) - (p0.y + d0.dy),
            (p1.x + d1.dx) - (p0.x + d0.dx)
        ) * 180 / Math.PI;

        pen.setAngle(angle);
    }


    // Specials User Methods
    snap(index, targetStem, t = 0.5, a = false) {
        const pt = this.rawPts[index];
        pt.origin = targetStem;
        pt.t = t;
        pt.isInsert = false; // По умолчанию для простого констрейна инсет НЕ нужен
        pt.autoAngle = a;

        this.updateConstrains(index); // Сразу вешаем геттеры
    }

    bridge(targetStems, t = 0.5, a = false, insert = true, idx = null) {
        // 1. Приводим всё к массивам для единообразия
        const targets = Array.isArray(targetStems) ? targetStems : [targetStems];
        const tValues = Array.isArray(t) ? t : Array(targets.length).fill(t);
        const aValues = Array.isArray(a) ? a : Array(targets.length).fill(a);
        const iValues = Array.isArray(insert) ? insert : Array(targets.length).fill(insert);
        
        // Определяем, какие индексы текущего StemLine мы будем привязывать
        // Если idx не передан, берем по порядку: 0, 1, 2...
        const pointIndices = idx !== null ? (Array.isArray(idx) ? idx : [idx]) : targets.map((_, i) => i);

        // 2. Проходим по списку и настраиваем каждую точку
        targets.forEach((target, i) => {
            const currentPtIdx = pointIndices[i];
            const currentT = tValues[i];
            const currentA = aValues[i];
            const currentInsert = iValues[i];

            // Сохраняем базовые настройки в саму точку для reApply
            const pt = this.rawPts[currentPtIdx];
            pt.origin = target;
            pt.t = currentT;
            pt.isInsert = currentInsert;
            pt.autoAngle = currentA;

            // 3. Вызываем рендер геттеров
            // Теперь нам достаточно одного метода reApply, который сам решит вопрос с инсетом
            this.updateConstrains(currentPtIdx);
        });

        this.update();
    }

    prepareAnim(){

    }

    revealPts(time, reverse = true) {
        const leftSide = [];
        const rightSide = [];
        const nTime = 1 - time;

        // Определяем индексы: кто движется (targetIdx), а кто стоит как якорь (anchorIdx)
        const targetIdx = reverse ? 0 : 1;
        const anchorIdx = reverse ? 1 : 0;

        for (let i = 0; i < this.pens.length; i++) {
            const pen = this.pens[i];

            let lx = pen.xStart();
            let ly = pen.yStart();
            let rx = pen.xEnd();
            let ry = pen.yEnd();

            // Проверяем, является ли текущее перо тем, которое должно двигаться
            // И проверяем наличие "якоря", к которому тянемся
            if (i === targetIdx && this.pens[anchorIdx]) {
                const anchor = this.pens[anchorIdx];
                
                lx = lx + (anchor.xStart() - lx) * nTime;
                ly = ly + (anchor.yStart() - ly) * nTime;
                rx = rx + (anchor.xEnd() - rx) * nTime;
                ry = ry + (anchor.yEnd() - ry) * nTime;
            }

            leftSide.push({ x: lx, y: ly });
            rightSide.push({ x: rx, y: ry });
        }

        const rightSideReversed = [...rightSide].reverse();

        return {
            left: leftSide, 
            right: rightSideReversed, 
            all: [...leftSide, ...rightSideReversed]
        };
    }


    // Rendering
    drawCanvas(ctx, mode = "render") {
        this.update(); 

        if (mode === "render") {
            const contour = this.revealPts(this.animationTime, this.ownerSymbol==="!" ? false : true );

            ctx.beginPath();
            ctx.fillStyle = "white";

            if (contour.all.length > 0) {
                ctx.moveTo(contour.all[0].x, contour.all[0].y);
                for (let i = 1; i < contour.all.length; i++) {
                    ctx.lineTo(contour.all[i].x, contour.all[i].y);
                }
                ctx.closePath();
                ctx.fill();
            }

            /*
            if (this.pens.length > 0) {
                // 1. Левая грань (0 - 1)
                ctx.moveTo(this.pens[0].xStart(), this.pens[0].yStart());

                for (let i = 1; i < this.pens.length; i++) {
                    ctx.lineTo(this.pens[i].xStart(), this.pens[i].yStart());
                }

                // 2.  Правая грань (2 - 3)
                for (let i = this.pens.length - 1; i >= 0; i--) {
                    
                    ctx.lineTo(this.pens[i].xEnd(), this.pens[i].yEnd());
                }

                ctx.closePath();
                ctx.fill();
            }
            */

            /*
            const path = this.getOpenPath(); // получаем opentype.Path
            ctx.beginPath();
            ctx.fillStyle = "grey";

            // Вместо Path2D и строк, "проигрываем" команды напрямую
            path.commands.forEach(cmd => {
                if (cmd.type === 'M') ctx.moveTo(cmd.x, cmd.y);
                else if (cmd.type === 'L') ctx.lineTo(cmd.x, cmd.y);
                else if (cmd.type === 'C') ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
                else if (cmd.type === 'Q') ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
                else if (cmd.type === 'Z') ctx.closePath();
            });

            ctx.fill(); 
            */

            /*
            const path = this.getOpenPath();
            ctx.fillStyle = "grey";
            ctx.fill(new Path2D(path.toPathData())); 
            */


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

            // 3. Рисуем скелетную линию (StemLine) (пунктир по центрам)
            /*
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = this.color; 
            this.pens.forEach((pen, i) => {
                if (i === 0) ctx.moveTo(pen.pos.x, pen.pos.y);
                else ctx.lineTo(pen.pos.x, pen.pos.y);
            });
            ctx.stroke();
            ctx.setLineDash([]);
            */

            // 2. Рисуем сами PenLines
            this.pens.forEach((pen, i) => {
                const isSelected = (this.selectedIndex === i);
                pen.drawCanvas(ctx, isSelected ? "selection" : "editor");
            });


            this.splineObject.drawCanvas(ctx);

        }

    }

    // Utils
    getOpenPath() {
        this.update(); // Гарантируем актуальность координат перед отрисовкой

        const path = new opentype.Path();
        if (this.pens.length === 0) return path;

        // 2. Левая сторона контура (проход по стартовым точкам перьев)
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


class ProcedureGlyph {
  // класс содержащий объекты процедурной буквы
  constructor(symbol, recipeFn, params) {
    this.symbol = symbol;
    this.recipeFn = recipeFn;
    
    this.params = params;
    this.advanceWidth = params.aw; // Дефолт  +100

    this.elements = [];
    this.dirty = true;
    this.customDeltas = false;
    this.build();
  }

  build() {
    const context = { advanceWidth: this.advanceWidth };
    
    // Запускаем рецепт
    this.elements = this.recipeFn(this.params, context) || []; 

    if (context.advanceWidth !== this.advanceWidth) {
        this.advanceWidth = context.advanceWidth;
    }

    this.dirty = false;
    this.customDeltas = false;
    
    //console.log("whay", this.advanceWidth)

    this.elements.forEach((el, idx) => {
        if (el instanceof StemLine) {
            el.ownerSymbol = this.symbol;
            el.index = idx;

            if(this.customDeltas==false){
                //if(el.customDeltas==true) this.customDeltas = true; // not work
            }
            
        }
    });

    if (typeof renderEditorCanvas === 'function') renderEditorCanvas(); // это пиздец
  }

  update(symbol, recipeFn, params) {
        this.symbol = symbol;
        this.recipeFn = recipeFn;
        this.params = params;
        this.advanceWidth = params.aw; // Дефолт  +100
        this.dirty = true;
        console.log("whatt",this.symbol)
        this.build();
  }


  updateData(globalProgress) { 
    // globalProgress от 0 до 1
    const totalGlyphLength = this.elements.reduce((sum, el) => sum + el.totalLength, 0);
    const currentDistance = globalProgress * totalGlyphLength;

    let accumulatedLength = 0;

    this.elements.forEach(el => {
        const startDist = accumulatedLength;
        const endDist = accumulatedLength + el.totalLength;

        // Вычисляем прогресс конкретно для этого отрезка пути
        const localTime = (currentDistance - startDist) / (endDist - startDist);
        el.animationTime = Math.min(Math.max(localTime, 0), 1);

        accumulatedLength += el.totalLength;
    });

  }


  updateDataOld(value) {
    const count = this.elements.length;
    this.elements.forEach((el, i) => {
        const start = i / count;
        const end = (i + 1) / count;
        const localTime = (value - start) / (end - start);
        
        el.animationTime = Math.min(Math.max(localTime, 0), 1);
    });
  }

  drawCanvas(ctx, mode = "render") {
    this.elements.forEach(el => el.drawCanvas(ctx, mode));
  }
  
  exportData() {
    //this.build();
    console.log("exportData")

    const data = this.generateGlyphPath(this.symbol, GLYPH_RECIPES, GFONT_PARAMS, this.elements);
    return { 
        path: data.path, 
        width: data.width 
    };
  }

  exportDataOld() { // Умеет работать со сложными точками + нормализовывать пути под ttf 
    const data = generateGlyphPathSimpleMerge(this.symbol, GLYPH_RECIPES, GFONT_PARAMS); 
    return { 
        path: data.path, 
        advanceWidth: data.width || this.advanceWidth
    };
  }
/*
  Как будет время перенести логику generateGlyphPath из AppMain.js сюда
  Вызываются из commitGlyphEdits()
*/

  // Ещё три реализации лежат в AppMain.js
  generateGlyphPath(char, recipes, p, existingElements = null) {
    const context = { advanceWidth: p.aw };
    const elements = existingElements || (recipes[char] ? recipes[char](p, context) : []);
    
    // Если элементы живые — берем ширину, которую УЖЕ вычислил build()
    // Если элементы новые — берем то, что насчитал свежий прогон рецепта в context

    if (!existingElements) {
        elements.forEach((el, idx) => {
            if (el instanceof StemLine) { 
                el.ownerSymbol = char; 
                el.index = idx; 
                el.update(); 
            }
        });
    }

    // Инициализация Paper.js
    if (!paper.project) paper.setup(new paper.Size(p.unitsPerEm, p.unitsPerEm));
    else paper.project.clear(); // Очистка, чтобы не множить сущности в памяти

    const finalPath = new opentype.Path();

    elements.forEach(el => {
        const opentypePath = el.getOpenPath();
        const paperPath = new paper.Path();

        // Перенос команд в Paper.js
        opentypePath.commands.forEach(cmd => {
            if (cmd.type === 'M') paperPath.moveTo([cmd.x, cmd.y]);
            else if (cmd.type === 'L') paperPath.lineTo([cmd.x, cmd.y]);
            else if (cmd.type === 'C') paperPath.cubicCurveTo([cmd.x1, cmd.y1], [cmd.x2, cmd.y2], [cmd.x, cmd.y]);
            else if (cmd.type === 'Q') paperPath.quadraticCurveTo([cmd.x1, cmd.y1], [cmd.x, cmd.y]);
            else if (cmd.type === 'Z') paperPath.closePath();
        });

        if (!paperPath.clockwise) paperPath.reverse();

        // Сборка из сегментов Paper.js
        paperPath.segments.forEach((seg, i) => {
            if (i === 0) finalPath.moveTo(seg.point.x, seg.point.y);
            else {
                const prev = paperPath.segments[i - 1];
                if (seg.handleIn.isZero() && prev.handleOut.isZero()) finalPath.lineTo(seg.point.x, seg.point.y);
                else {
                    finalPath.curveTo(
                        prev.point.x + prev.handleOut.x, prev.point.y + prev.handleOut.y,
                        seg.point.x + seg.handleIn.x, seg.point.y + seg.handleIn.y,
                        seg.point.x, seg.point.y
                    );
                }
            }
        });

        if (paperPath.closed) finalPath.close();
        paperPath.remove(); 
    });

    // Если элементы уже были — берем ширину инстанса, если нет — из контекста рецепта
    const finalWidth = existingElements ? this.advanceWidth : context.advanceWidth;
    return { path: finalPath, width: finalWidth };
  }




}



window.PenLine = PenLine;
window.StemLine = StemLine;
window.ProcedureGlyph = ProcedureGlyph;

class SerifElement {
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
window.SerifElement = SerifElement;


