// All Classes for Procedure Glyph

const GLYPH_DELTAS = {};
window.GLYPH_DELTAS = GLYPH_DELTAS;


function drawCap(ctx, pos, r = 8, color, state = "noselect") {
    // в зависимости от типа входных данных
    const x = pos.x ?? pos[0];
    const y = pos.y ?? pos[1];

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);

    if (state === "select") {
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.fillStyle = "#1c1c1c";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}


class ShapeData {
    static idCounter = 0;
    constructor(type, pos, editor_pts) { // type 'bspline'  'bezier-cubic'
        
        ShapeData.idCounter++;

        this.id = 'C' + ShapeData.idCounter; 
        this.type = type;
        
        this.epts = editor_pts.map(p => [...p]); // копия
        this.pos = { x: 0, y: 0 };
        this.center = { x: 0, y: 0 };

        this.steps = 124; 
        this.degree = 3; 

        this.closed = false; 
        this.magnetPower = 200; // сила притяжения

        this.pathPoints = []; 
        this.totalLength = 0;
        this.bakeAngle = true;

        this.displayMode = "editor"; // editor

        this.animationProgress = 1; // 0 - 1
        this.color = "grey";

        this.refreshPath(); 
    }
    
    replicate() {
        const newPts = this.epts.map(p => [...p]);
        return new ShapeData(this.type, { ...this.pos }, newPts);
    }

    alignToCenter(){
        if (editor_pts && pos) {

            const center = this.getCenter();

            // смещаем локальные точки к центру
            this.epts = editor_pts.map(p => [
                p[0] - center.x,
                p[1] - center.y
            ]);

            // сохраняем мировой центр
            this.pos = { x: pos.x, y: pos.y };
        }
    }

    getCenter() {
        if (!this.epts || this.epts.length === 0) return { x: 0, y: 0 };

        let sumX = 0, sumY = 0;
        this.epts.forEach(p => {
            sumX += p[0];
            sumY += p[1];
        });
        return { x: sumX / this.epts.length, y: sumY / this.epts.length };
    }
    

    getPoint(progress, smoothZone = 0) {
            if (this.pathPoints.length === 0) return { x: 0, y: 0, angle: 0 };
            
            const targetDist = progress * this.totalLength;
            
            // 1. Поиск сегмента
            let i = 1;
            for (; i < this.pathPoints.length; i++) {
                if (this.pathPoints[i].dist >= targetDist) break;
            }
            if (i >= this.pathPoints.length) i = this.pathPoints.length - 1;

            const idx = i - 1;
            const p0 = this.pathPoints[idx];
            const p1 = this.pathPoints[i];
            const segmentLen = p1.dist - p0.dist;
            const t = (segmentLen > 0) ? (targetDist - p0.dist) / segmentLen : 0;

            // 2. Внутренняя функция получения чистого угла сегмента
            const max = this.pathPoints.length - 1;
            
            const getRawAngle = (index) => {
                let id = index;
                if (this.closed) {
                    id = (index + max) % max;
                } else {
                    id = Math.max(0, Math.min(index, max - 1));
                }
                return this.bakeAngle ? this.pathPoints[id].angle : Math.atan2(this.pathPoints[id+1].y - this.pathPoints[id].y, this.pathPoints[id+1].x - this.pathPoints[id].x);
            };

            const lerpAngle  = (a, b, t) => {
                // Вспомогательная функция для плавного перехода углов
                let d = b - a;if (d > Math.PI) d -= Math.PI * 2;
                if (d < -Math.PI) d += Math.PI * 2;
                return a + d * t;
            }

            // 3. Расчет угла (сглаженного или прямого)
            let finalAngle = getRawAngle(idx);

            if (smoothZone > 0) {
                if (t > (1 - smoothZone)) {
                    // Переход к следующему
                    const nextAngle = getRawAngle(idx + 1);
                    const localT = (t - (1 - smoothZone)) / (smoothZone * 2);
                    finalAngle = lerpAngle(finalAngle, nextAngle, localT);
                } else if (t < smoothZone) {
                    // Переход от предыдущего
                    const prevAngle = getRawAngle(idx - 1);
                    const localT = (t + smoothZone) / (smoothZone * 2);
                    finalAngle = lerpAngle(prevAngle, finalAngle, localT);
                }
            }

            return {
                x: p0.x + (p1.x - p0.x) * t,
                y: p0.y + (p1.y - p0.y) * t,
                angle: finalAngle
            };

    }

    // Для B-сплайна // deBoor
    getBSplinePoint(t, knots, pts, k) { 
        let s = 0;
        
        const n = pts.length - 1;
        
        if (t >= knots[n + 1]) {
            s = n;
        } else {
            for (let i = k; i < knots.length - 1; i++) {
                if (t >= knots[i] && t < knots[i + 1]) {
                    s = i;
                    break;
                }
            }
        }

        let d = [];
        for (let i = 0; i <= k; i++) {
            d.push({ x: pts[s - k + i][0], y: pts[s - k + i][1] });
        }

        for (let r = 1; r <= k; r++) {
            for (let i = k; i >= r; i--) {
                const denom = knots[s + 1 + i - r] - knots[s - k + i];
                const alpha = denom === 0 ? 0 : (t - knots[s - k + i]) / denom;
                d[i].x = (1 - alpha) * d[i - 1].x + alpha * d[i].x;
                d[i].y = (1 - alpha) * d[i - 1].y + alpha * d[i].y;
            }
        }
        return d[k];
    }

    // Для Кубического Безье
    getBezierPoint(t, pts) {
        // pts[0][0] - это X, pts[0][1] - это Y
        const p0  = { x: pts[0][0], y: pts[0][1] };
        const cp1 = { x: pts[1][0], y: pts[1][1] };
        const cp2 = { x: pts[2][0], y: pts[2][1] };
        const p1  = { x: pts[3][0], y: pts[3][1] };
        
        const invT = 1 - t;
        const b0 = invT ** 3;
        const b1 = 3 * invT ** 2 * t;
        const b2 = 3 * invT * t ** 2;
        const b3 = t ** 3;

        return {
            x: b0 * p0.x + b1 * cp1.x + b2 * cp2.x + b3 * p1.x,
            y: b0 * p0.y + b1 * cp1.y + b2 * cp2.y + b3 * p1.y
        };
    }

    refreshPath() {
        // Метод генерации равномерного пути и запись данных во внутрениий массив 
        // - для отрисовки и для взаимодействия с другими объектами

        this.pathPoints = [];
        this.totalLength = 0;
        if (this.epts.length < 2) return;

        // --- ПОДГОТОВКА ДАННЫХ ---
        let tStart = 0, tEnd = 1;
        let knots = [], pts = [...this.epts];

        const isBezier = this.type === 'bezier-cubic';
        const ptsCount = pts.length;
        const effectiveDegree = Math.min(this.degree, ptsCount - 1); 

        if (!isBezier) {

            //console.log(" b spline");

            // Логика knots и tStart/tEnd для B-сплайна

            if (this.closed) {
                const head = this.epts.slice(0, effectiveDegree);
                const tail = this.epts.slice(-effectiveDegree);
                pts = [...tail, ...this.epts, ...head];
                for (let i = 0; i <= pts.length + effectiveDegree; i++) knots.push(i);
            } else {
                const n = ptsCount - 1;
                for (let i = 0; i <= n + effectiveDegree + 1; i++) {
                    if (i < effectiveDegree + 1) knots.push(0);
                    else if (i > n) knots.push(n - effectiveDegree + 1);
                    else knots.push(i - effectiveDegree);
                }
            }

            if (this.closed) {
                // Для закрытого: пропускаем "нахлест" из добавленных точек
                tStart = knots[effectiveDegree + effectiveDegree]; 
                tEnd = tStart + ptsCount;
            } else {
                // Для открытого "clamped": валидный диапазон от первого узла до последнего "активного"
                tStart = knots[effectiveDegree];
                tEnd = knots[knots.length - 1 - effectiveDegree];
            }

        }

        // --- ОБЩИЙ ЦИКЛ ГЕНЕРАЦИИ ---
        let prevPos = null;

        for (let i = 0; i <= this.steps; i++) {
            const progress = i / this.steps;
            const t = tStart + progress * (tEnd - tStart);
            let pos;

            // ВЫБОР МАТЕМАТИКИ
            if(isBezier){
                pos = this.getBezierPoint(t, this.epts) 
            }else{

                if(this.closed){
                    pos = this.getBSplinePoint(t, knots, pts, effectiveDegree);
                }else{
                    const ct = Math.min(t, tEnd - 0.000001);
                    pos = this.getBSplinePoint(ct, knots, pts, effectiveDegree);
                }

            }            

            if (prevPos) {
                const dx = pos.x - prevPos.x;
                const dy = pos.y - prevPos.y;
                this.totalLength += Math.sqrt(dx * dx + dy * dy);
                if (this.bakeAngle) {
                    this.pathPoints[this.pathPoints.length - 1].angle = Math.atan2(dy, dx);
                }
            }

            this.pathPoints.push({ x: pos.x, y: pos.y, dist: this.totalLength, angle: 0 });
            prevPos = pos;
        }

        // Angle Bake
        if (this.bakeAngle && this.pathPoints.length > 1) {
            const lastIdx = this.pathPoints.length - 1;
            if (this.closed) {
                // Угол последней точки — это направление к следующей после стыка (второй) точке
                const dx = this.pathPoints[1].x - this.pathPoints[0].x;
                const dy = this.pathPoints[1].y - this.pathPoints[0].y;
                this.pathPoints[lastIdx].angle = Math.atan2(dy, dx);
                //this.pathPoints[lastIdx].angle = this.pathPoints[0].angle = Math.atan2(dy, dx);
                this.pathPoints[0].angle = this.pathPoints[lastIdx].angle;
            } else {
                this.pathPoints[lastIdx].angle = this.pathPoints[lastIdx - 1].angle;
            }
        }
    }

    getClosestProgress(mx, my) {
        if (this.pathPoints.length === 0) return 0;

        let minCharsDistSq = Infinity;
        let closestIdx = 0;

        // Переводим мировые координаты мыши в локальные координаты сплайна
        const localX = mx - this.pos.x;
        const localY = my - this.pos.y;

        for (let i = 0; i < this.pathPoints.length; i++) {
            const pt = this.pathPoints[i];
            const dx = localX - pt.x;
            const dy = localY - pt.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < minCharsDistSq) {
                minCharsDistSq = distSq;
                closestIdx = i;
            }
        }

        // Возвращаем нормализованный прогресс (0.0 - 1.0)
        return this.pathPoints[closestIdx].dist / this.totalLength;
    }

    checkHit() { 
         // Используется для нахождении точки на canvas

    }
    
    setAnimValue(value){
        this.animationProgress = value;
    }

    drawCanvas(ctx) {

        if ( !this.pathPoints.length>0 ) return
        
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);

        // !!! ГЛАВНОЕ ИСПРАВЛЕНИЕ: НЕ ИСПОЛЬЗУЕМ closePath() здесь, 
        // так как кривая уже должна быть замкнута математически.
        // ctx.closePath();                

        // Path
        if(this.animationProgress==1){ // один путь когда анимация закончилась

            if (this.displayMode === "editor") {

                ctx.beginPath();
                ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
                for (let i = 1; i < this.pathPoints.length; i++) {
                    ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
                }

                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 1;
                ctx.stroke(); 

            } 

            if (this.displayMode === "dash") {

                
                ctx.setLineDash([5, 5]);

                ctx.beginPath();
                ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
                for (let i = 1; i < this.pathPoints.length; i++) {
                    ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
                }

                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 1;
                ctx.stroke();

                ctx.setLineDash([]);
                ctx.globalAlpha = 1.0

            } 

        }else{

            if (this.displayMode === "editor") {

                const points = this.pathPoints;
                const mid = Math.floor(points.length / 2);

                const halfLength = this.totalLength /2 ; // Берем полную длину для запаса
                const dashLen = (this.totalLength / 2) * fit(this.animationProgress,0.0,0.8,0.0,1.0);;

                ctx.globalAlpha = fit(this.animationProgress,0.0,0.6,0.0,1.0);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.lineCap = "round"; 

                ctx.setLineDash([dashLen, this.totalLength]); 

                // left side 0.0 - 0.5
                ctx.beginPath();
                ctx.moveTo(points[mid].x, points[mid].y);
                for (let i = mid - 1; i >= 0; i--) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();

                // right side 0.5 - 1.0
                ctx.beginPath();
                ctx.moveTo(points[mid].x, points[mid].y);
                for (let i = mid + 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();

                ctx.setLineDash([]);
                ctx.globalAlpha = 1.0
            }

        }

        // Fill
        if (this.closed) {
            ctx.fillStyle = "rgba(50, 50, 50, 0.2)"; 
            ctx.fill(); 
        }        

        // Anchors
        if (this.displayMode === "editor" ) {
            /*
            // Центр объекта (0,0)
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            */
            // Контрольные точки (editor points)
            ctx.fillStyle = "white";

            this.epts.forEach((p, index) => { 
                ctx.beginPath();
                
                let val;
                if (index == 1) {
                    val = fit(this.animationProgress, 0.0, 0.2, 0.0, 3.6);
                } else {
                    val = fit(this.animationProgress, 0.8, 1.0, 0.0, 3.6);
                }
            
                //const radius = val;
                const radius = Math.sqrt(val) * 1.9
                
                ctx.arc(p[0], p[1], radius, 0, Math.PI * 2); 
                ctx.fill();
            });
        }

        ctx.restore();
    }
}


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


    drawCanvas(ctx, mode = "noselect") {
        // 1. Рисуем перекладину
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2
        ctx.moveTo(this.xStart(), this.yStart());
        ctx.lineTo(this.xEnd(), this.yEnd());
        ctx.stroke();

        // 2. Рисуем центральную точку (узел StemLine)
        drawCap(ctx, this.pos, 8, this.color, mode);

        // Если выбрано — закрашиваем, если нет — только контур
        if (mode === "select") {                
            // 3. Рисуем крайние точки только при выделении
            const startPos = [this.xStart(), this.yStart()];
            const endPos = [this.xEnd(), this.yEnd()];
            drawCap(ctx, startPos, 8, this.color, "noselect" );
            drawCap(ctx, endPos, 8, this.color, "noselect" );
        }
    }
}

        
class StemLine { // Like A Skeletal Logic // close - last flag (is bug delete)
    constructor(pts = [], w = 300, penAngle = 0, color = "blue", closed = false, ownerSymbol = null, index = null) { //offset, 
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
        

        this.midPoint = mid(this.rawPts[0], this.rawPts[1]);
        this.currentMid = { x: this.midPoint.x, y: this.midPoint.y };
        this.midSelect = false;
        
        // 2. Массив сегментов (кривых между перьями)
        this.segments = [];
        
        for (let i = 0; i < this.rawPts.length - 1; i++) {
            const pStart = this.rawPts[i];
            const pEnd = this.rawPts[i + 1];
            
            // Нам нужны ДВЕ контрольные точки между PenLine
            // Для старта просто распределим их равномерно по линии
            const cp1 = { x: pStart.x + (pEnd.x - pStart.x) * 0.33, y: pStart.y + (pEnd.y - pStart.y) * 0.33 };
            const cp2 = { x: pStart.x + (pEnd.x - pStart.x) * 0.66, y: pStart.y + (pEnd.y - pStart.y) * 0.66 };

            const segment = new ShapeData('bezier-cubic', { x: 0, y: 0 }, [
                [pStart.x, pStart.y], // P0
                [cp1.x, cp1.y],       // CP1
                [cp2.x, cp2.y],       // CP2
                [pEnd.x, pEnd.y]      // P1
            ]);

            segment.steps = 32;
            segment.color = this.color;
            segment.displayMode = "dash";
            segment.bakeAngle = true;
            segment.animationProgress = 1
            segment.refreshPath();
            
            this.segments.push(segment);
        }
        /*
        // 3. Создаем сегменты для каждой пары точек
        // Если точек 2 — будет 1 сегмент. Если 4 — будет 3 сегмента.
        for (let i = 0; i < this.rawPts.length - 1; i++) {
            const pStart = this.rawPts[i];
            const pEnd = this.rawPts[i + 1];
            
            // Начальный mid для сегмента (просто геом. центр для старта)
            const initialMid = mid(pStart, pEnd);

            const segment = new ShapeData('bezier-cubic', { x: 0, y: 0 }, [
                [pStart.x, pStart.y],
                [initialMid.x, initialMid.y],
                [pEnd.x, pEnd.y]
            ]);

            segment.steps = 32; // Можно меньше шагов на сегмент, так как их много
            segment.color = this.color;
            segment.displayMode = "dash";
            segment.bakeAngle = true; // Обязательно для вычисления нормалей шлейфа
            segment.refreshPath();
            
            this.segments.push(segment);
        }
        */
        this.pens = this.rawPts.map(p => new PenLine(p, this.w, this.penAngle, this.color));
        
        this.selectedIndex = null; // stem inner index
        this.customDeltas = false;
        this.animationTime = 1.0;

        this.update();
    }

    getDeltas(pointIndex) {
        if (!GLYPH_DELTAS) return { dx: 0, dy: 0 };
        const deltaObj = GLYPH_DELTAS[this.ownerSymbol]?.[this.index];
        if (!deltaObj) return { dx: 0, dy: 0 };

        let dx = 0, dy = 0;

        // ПРОВЕРКА: Если это мид-точка (строка типа "mid_0")
        if (typeof pointIndex === 'string' && pointIndex.startsWith('mid_')) {
            const idx = parseInt(pointIndex.split('_')[1]);
            dx = deltaObj.mids?.[idx]?.x || 0;
            dy = deltaObj.mids?.[idx]?.y || 0;
        } 
        // Иначе это обычное перо (числовой индекс)
        else {
            dx = deltaObj.pts?.[pointIndex]?.x || 0;
            dy = deltaObj.pts?.[pointIndex]?.y || 0;
        }

        // Твоя логика флага customDeltas
        if (this.customDeltas == false && deltaObj.customDeltas == true) {
            this.customDeltas = true;
            if (currentProcedureGlyph) currentProcedureGlyph.customDeltas = true;
        }

        return { dx, dy };
    }
    
    updateSegmentCurveFree() {
        // Free

        this.segments.forEach((segment, i) => {

            const penStart = this.pens[i].pos; // Точка А
            const penEnd = this.pens[i + 1].pos; // Точка Б

            const { dx, dy } = this.getDeltas(`mid_${i}`);

            // Вычисляем базу (середину хорды)
            const baseMid = mid(penStart, penEnd);

            const spread = 0.55228; 

            const segDx = penEnd.x - penStart.x;
            const segDy = penEnd.y - penStart.y;

            const apexX = baseMid.x + dx * 1.33;
            const apexY = baseMid.y + dy * 1.33;

            const cp1 = {
                x: apexX - segDx * 0.28, 
                y: apexY - segDy * 0.28
            };

            const cp2 = {
                x: apexX + segDx * 0.28,
                y: apexY + segDy * 0.28
            };

            segment.epts = [
                [penStart.x, penStart.y], // Точка А
                [cp1.x, cp1.y], 
                [cp2.x, cp2.y], 
                [penEnd.x, penEnd.y] // Точка Б
            ];


            segment.refreshPath();
        });
    }
    
    updateSegmentCurveSym() {

        const k = 0.2761423749; //коэффициент для 90° 

        this.segments.forEach((segment, i) => {

            const penStart = this.pens[i].pos;
            const penEnd = this.pens[i + 1].pos;

            const { dx, dy } = this.getDeltas(`mid_${i}`); 

            // 1) Базовые векторы сегмента
            
            const segDx = penEnd.x - penStart.x, segDy = penEnd.y - penStart.y;
            const len = Math.hypot(segDx, segDy);
            
            if (len === 0) return; // degenerate
            
            const ux = segDx / len, uy = segDy / len;   // единичный вдоль сегмента
            const vx = -uy, vy = ux;                          // единичный перпендикуляр

            // 2) Проекции ручки на сегмент и перпендикуляр
            const h_par = dx * ux + dy * uy;
            const h_perp = dx * vx + dy * vy;

            // 3) Середина хорды
            const midX = 0.5*(penStart.x + penEnd.x), midY = 0.5*(penStart.y + penEnd.y);
            const d = len * (k); 

            // 5) Вычисление базовых CP без ручки
            const base1x = midX - ux * d;
            const base1y = midY - uy * d;
            const base2x = midX + ux * d;
            const base2y = midY + uy * d;

            // 6) Вклад ручки: перпендикулярный — одинаково к обеим,
            //    параллельный — с противоположными знаками
            const alpha = 1.0; // коэф. распределения параллельной компоненты 
            const cp1x = base1x + vx * h_perp - ux * (alpha * h_par);
            const cp1y = base1y + vy * h_perp - uy * (alpha * h_par);
            const cp2x = base2x + vx * h_perp + ux * (alpha * h_par);
            const cp2y = base2y + vy * h_perp + uy * (alpha * h_par);

            segment.epts = [
                [penStart.x, penStart.y],
                [cp1x, cp1y],
                [cp2x, cp2y],
                [penEnd.x, penEnd.y]
            ];

            segment.refreshPath();
        });
    }
    
    updateSegmentArcFix() {
        // ARC FIX TYPE
        
        const k = 0.2761423749; // DontTouch

        this.segments.forEach((segment, i) => {

            const penStart = this.pens[i].pos;
            const penEnd = this.pens[i + 1].pos;

            const segDx = penEnd.x - penStart.x;
            const segDy = penEnd.y - penStart.y;

            const len = Math.hypot(segDx, segDy);
            if (!len) return;

            const ux = segDx / len;
            const uy = segDy / len;

            const vx = -uy;
            const vy = ux;

            const midX = (penStart.x + penEnd.x) * 0.5;
            const midY = (penStart.y + penEnd.y) * 0.5;

            const hRaw =
                this.getDeltas(`mid_${i}`).dx * vx +
                this.getDeltas(`mid_${i}`).dy * vy;

            // =====  1/4 КРУГА =====
            
            const MAX = len * k; // половина от 0.55228
            const h = Math.max(-MAX, Math.min(MAX, hRaw));
            const d = len * k;

            const cp1 = {
                x: midX - ux * d + vx * h,
                y: midY - uy * d + vy * h
            };

            const cp2 = {
                x: midX + ux * d + vx * h,
                y: midY + uy * d + vy * h
            };

            segment.epts = [
                [penStart.x, penStart.y],
                [cp1.x, cp1.y],
                [cp2.x, cp2.y],
                [penEnd.x, penEnd.y]
            ];

            segment.refreshPath();

            //console.log("Checker", segment)
            // ClampingDeltas // DontTouch

            const deltaObj = GLYPH_DELTAS?.[this.ownerSymbol]?.[this.index];
            const mids = deltaObj?.mids?.[i];

            if (mids) {

                const limit = len * k;
                const newDx = Math.max(-limit, Math.min(limit, mids.x));
                const newDy = Math.max(-limit, Math.min(limit, mids.y));

                mids.x = newDx;
                mids.y = newDy;
            }

        });
    }

    updateSegmentArcParallel(){

        const k = 0.32;
        
        this.segments.forEach((segment, i) => {

            const penStart = this.pens[i].pos;
            const penEnd = this.pens[i + 1].pos;

            const { dx, dy } = this.getDeltas(`mid_${i}`);

            // 2. Вершина, куда тянет юзер
            const baseMid = mid(penStart, penEnd);

            const segDx = penEnd.x - penStart.x;
            const segDy = penEnd.y - penStart.y;

            // 2. Вершина изгиба, куда тянет юзер
            const userHandle = {
                x: baseMid.x + dx,
                y: baseMid.y + dy
            };

            const offsetValue = 1.33;
            // разносим  в стороны от центра
            const cp1 = {
                x: (baseMid.x + dx * offsetValue) - segDx * k,
                y: (baseMid.y + dy * offsetValue) - segDy * k
            };

            const cp2 = {
                x: (baseMid.x + dx * offsetValue) + segDx * k,
                y: (baseMid.y + dy * offsetValue) + segDy * k
            };

            segment.epts = [
                [penStart.x, penStart.y], 
                [cp1.x, cp1.y], 
                [cp2.x, cp2.y], 
                [penEnd.x, penEnd.y]
            ];

            segment.refreshPath();
   
        });
    }

    // Sync and Updates
    update() {

        let length = 0;

        this.pens.forEach((pen, i) => {            
            const pt = this.rawPts[i];
            
            // 1. Управляем связями (если они есть)
            if (pt.origin) {
                this.updateConstrains(i); 
                if (pt.autoAngle) this.alignPensAngle(i);
            }

            // 2. Управляем финальной позицией пера
            const { dx, dy } = this.getDeltas(i);

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

        // 2. Обновляем геометрию каждого сегмента
        /*
        this.segments.forEach((segment, i) => {

            const { dx, dy } = this.getDeltas(`mid_${i}`);


            const pStart = this.pens[i].pos;
            const pEnd = this.pens[i+1].pos;            

            // Вычисляем "идеальный" мид (на прямой), к которому приложим дельту
            const baseMid = mid(pStart, pEnd);

            const currentMid = {
                x: baseMid.x + dx,
                y: baseMid.y + dy
            };

            // Обновляем контрольные точки ShapeData
            segment.epts = [
                [pStart.x, pStart.y],
                [currentMid.x, currentMid.y],
                [pEnd.x, pEnd.y]
            ];

            segment.refreshPath();
            //totalPathLength += segment.totalLength;
        });
        */

        const updateCurveMode = 0;
        if(updateCurveMode===0) this.updateSegmentArcFix();
        if(updateCurveMode===1) this.updateSegmentCurveSym()
        if(updateCurveMode===2) this.updateSegmentCurveFree()
        if(updateCurveMode===3) this.updateSegmentArcParallel()
        

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
        const deltaObj = GLYPH_DELTAS[this.ownerSymbol]?.[this.index];
        if (!deltaObj) return { dx: 0, dy: 0 };

        let dx = 0, dy = 0;

        // ПРОВЕРКА: Если это мид-точка (строка типа "mid_0")
        if (typeof pointIndex === 'string' && pointIndex.startsWith('mid_')) {
            const idx = parseInt(pointIndex.split('_')[1]);
            dx = deltaObj.mids?.[idx]?.x || 0;
            dy = deltaObj.mids?.[idx]?.y || 0;
        } 
        // Иначе это обычное перо (числовой индекс)
        else {
            dx = deltaObj.pts?.[pointIndex]?.x || 0;
            dy = deltaObj.pts?.[pointIndex]?.y || 0;
        }

        // Твоя логика флага customDeltas
        if (this.customDeltas == false && deltaObj.customDeltas == true) {
            this.customDeltas = true;
            if (currentProcedureGlyph) currentProcedureGlyph.customDeltas = true;
        }

        return { dx, dy };
    }

    checkHit(localX, localY, shouldSelect = false) {
        let foundIndex = null;
        let tempSelect = null;

        const gap = 25;
        
        // 1. Проверяем центральную точку
        this.segments.forEach((seg, i) => {
            const onCurve = seg.getPoint(0.5); // Точка на сплайне
            const dist = Math.hypot(onCurve.x - localX, onCurve.y - localY);
            if (dist < gap) {
                foundIndex = `mid_${i}`; // Уникальный ID для этого рычага
                tempSelect = true;
            }
        });
        // 2. Если в центр не попали, проверяем угловые точки
        if (foundIndex === null) {
            this.pens.forEach((pen, i) => {
                const { dx, dy } = this.getDeltas(i);
                const currentX = this.rawPts[i].x + dx;
                const currentY = this.rawPts[i].y + dy;
                const dist = Math.hypot(currentX - localX, currentY - localY);

                if (dist < gap) {
                    foundIndex = i;
                }
            });
        }

        // 3. Если всё ещё не нашли (промах по точкам), проверяем попадание ВНУТРЬ фигуры
        if (foundIndex === null && this.isPointInsideArea(localX, localY)) {
            foundIndex = -1; //'body'; 
            tempSelect = false;
        }

        // Применяем выбор
        if (shouldSelect) {
            this.selectedIndex = foundIndex;
            this.midSelect = tempSelect;
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

    isPointInsideArea(x, y) {
        // Получаем текущие границы области (в статичном состоянии time = 1)
        const pts = this.revealPts(1).all;
        
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i].x, yi = pts[i].y;
            const xj = pts[j].x, yj = pts[j].y;
            
            // Алгоритм Ray-casting
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                
            if (intersect) inside = !inside;
        }
        
        return inside;
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


            this.segments.forEach(seg => seg.drawCanvas(ctx));
            
            this.segments.forEach((seg, i) => {
                // Контрольная точка b-spline (Handle) — это второй элемент в epts
                const a = seg.getPoint(0.5,0.5)
                drawCap(ctx, a, 8, this.color, this.midSelect ? "select" : "noselect");
            });

            // 2. Рисуем сами PenLines
            this.pens.forEach((pen, i) => {
                const isSelected = (this.selectedIndex === i);
                pen.drawCanvas(ctx, isSelected ? "select" : "noselect");
            });



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
        //console.log("whatt",this.symbol)
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
    //console.log("exportData")

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


window.ShapeData = ShapeData;
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


