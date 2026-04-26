// 01 PreviewGlyphTiles

// helper: create svg path from glyph path cmds, inverse y - warning!
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

// helper: for all svg tile generation (cmap previews)
function getGlyphRenderParams(item, glyph) {
    const activeFont = item.font;
    const upm = activeFont.unitsPerEm || 1000;
    const os2 = activeFont.tables.os2;
    const metrics = glyph.getMetrics();
    const charCase = getGlyphCase(glyph);

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

    const scaleFactor = (activeFont.variation && glyph !== item.glyph) ? 1 : 1; // variablefont case // what?
    const d = getSafePathNEW(glyph, scaleFactor);

    return { d, vBoxY, width, viewHeight };
}


// 02 editableContours Methods
// this structWrapper for easy manipulation paths data in canvas

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

// Convertion: glyph (from opentype.js) cmds to editableContours for glyphEditor 
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

// Convertion: editableContours to glyphPaths (opentype.js)
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


// 03 Parsing SVG from plaintext to create editableContours
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

// Convertion: svg ellipse to path (easy way)
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

// Convertion svg paths to cmds
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

function getSignedArea(contour) {
    let sum = 0;
    for (let i = 0; i < contour.length; i++) {
        const p1 = contour[i].anchor;
        const p2 = contour[(i + 1) % contour.length].anchor;
        sum += (p2.x - p1.x) * (p2.y + p1.y);
    }
    return sum;
}

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

// Pipeline: text > doc > elements > paths > cmds from parsePathData() > editableContours
function convertSvgToContours(svgString, targetWidth) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    const elements = doc.querySelectorAll('path, rect, circle, polygon, polyline, ellipse');
    const allContours = [];

    Array.from(elements).forEach(el => {
        let d = '';
        const tag = el.tagName.toLowerCase();
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

        const isSinglePath = el.tagName.toLowerCase() === 'path';

        if (isSinglePath && contours.length > 1) {
            // compound path = НЕ трогаем winding
            allContours.push(...contours);
        } else {
            // отдельные фигуры → можно нормализовать
            contours.forEach((contour, i) => {
                const area = getSignedArea(contour);
                if (area > 0) {
                    contours[i] = reverseContour(contour);
                }
            });

            allContours.push(...contours);
        }

    });

    if (allContours.length === 0) return [];

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

// Event: Base CopyPaste Paths from Adobe Illustrator Logic
window.addEventListener('paste', (e) => {
    if (!bezierMode) return;
    if (generatedFont) return;

    const text = (e.clipboardData || window.clipboardData).getData('text');

    if (text.includes('<svg')) {

        const oldWidth = getContoursWidth(currentContours);
        const targetWidth = oldWidth > 0 ? oldWidth : 500;

        currentContours = convertSvgToContours(text, targetWidth);
        
        // Делаем потверждение для обновление плитки и редактора
        commitGlyphEdits();

        if(!cTransformMode){ // Сразу задаём режима перемещения элементов
            callSwitchBezierMode(true);
        }

        // Render
        renderEditorCanvas();  
        if (!sampleCanvasBlock.hidden) { 
            renderSampleCanvas();
        }
        e.preventDefault(); 
    }
});


// 04 Canvas Rending Example

// helper: glyph params for glyphEditor (canvas element), using for global canvas transform
function getTransformParams(glyph) {
    const fontSize = 600;
    const targetGlyph = glyph || (typeof currentGlyph !== 'undefined' ? currentGlyph : null);
    const upm = (font && font.unitsPerEm) ? font.unitsPerEm : 1000;
    const renderSize = fontSize; 

    const baseScale = fontSize / upm;
    const scale = baseScale * zoom;

    const limitX = (canvas.width * zoom - canvas.width) / 2;
    const limitY = (canvas.height * zoom - canvas.height) / 2;
    panX = Math.max(-limitX, Math.min(limitX, panX));
    panY = Math.max(-limitY, Math.min(limitY, panY));

    const baseline = (canvas.height * 0.7) + panY;

    let x = null;
    let width = null;

    if (targetGlyph) {
        const glyphWidth = (targetGlyph.advanceWidth || upm) * scale; //glyphWidth
        x = ( (canvas.width - glyphWidth) / 2 ) + panX;
        width = glyphWidth;
    }

    return { renderSize, x, baseline,  width, scale };
}

// Pipeline: Rendering Canvas
function renderEditorCanvas() {
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(!currentGlyph) return

    const { renderSize, x, baseline,  width, scale } = getTransformParams(); 

    ctx.translate(x, baseline)
    ctx.scale(scale, -scale);

    if(editMode && currentContours){
        ctx.lineWidth = 1 / scale
        ctx.strokeStyle = "#aaa"
        ctx.fillStyle = "rgba(180,180,180,0.2)"

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
            ctx.fillStyle = "rgba(180,180,180,0.2)";
            ctx.fill(); // Это лечит case
            //ctx.fill("evenodd"); // Здесь будут дырки
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

                    const isSelected = selectedPoints.some(sp => sp.ci === ci && sp.pi === pi);
                    const isPrevSelected = pi > 0 && selectedPoints.some(sp => sp.ci === ci && sp.pi === pi - 1);

                    const fillColor = isSelected ? "#00ff00" : "#fff";
                    const strokeColor = isSelected ? "#006600" : "#000";
                    drawCircle(ax, ay, 5 / scale, fillColor, strokeColor);

                    if (pt.handle1 && pi > 0 && (isSelected || isPrevSelected)) {
                        const prevPt = contour[pi - 1];
                        ctx.beginPath();
                        ctx.moveTo(prevPt.anchor.x, prevPt.anchor.y);
                        ctx.lineTo(pt.handle1.x, pt.handle1.y);
                        ctx.strokeStyle = "#666";
                        ctx.stroke();
                        drawCircle(pt.handle1.x, pt.handle1.y, 4 / scale, "#f88", "#600");
                    }

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
}