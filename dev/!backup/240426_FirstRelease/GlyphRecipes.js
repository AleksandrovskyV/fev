
/** GlyphRecipes.js

 * Recipes Library
 * Библиотека процедурных инструкций для генерации символов
 * 
*/

const GLYPH_RECIPES_TEMPLATE = {
    "TemplateA":`
const { aw, br, ts, ch } = p // Unpack

const sPoint = ts / 2
const ePoint = aw - sPoint

const lLeg = new StemLine( [{x: sPoint, y: 0}, {x: ePoint, y: ch}], ts, 0, "#0366d6")

return [ lLeg ]
`,
    "TemplateB": `string2dsadasd`
};

window.GLYPH_RECIPES_TEMPLATE = GLYPH_RECIPES_TEMPLATE;


const GLYPH_RECIPES = {

"A": (p, self) => {
// Recipe A (65)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

self.advanceWidth = aw + ( br * 2 )
const nCenter = aw / 2 + br

const hwStem = ts / 2
const LX =  br + hwStem
const RX = ( aw + br ) - hwStem

// 1. Create left and right "legs" 
// StemLine( pStart, pEnd, thickness, anglePen, color in editor )
const lLeg = new StemLine( [{x: LX, y: 0}, {x: nCenter, y: ch}], ts, 0, "#0366d6")
const rLeg = new StemLine( [{x: RX, y: 0}, {x: nCenter, y: ch}], ts, 0, "yellow")

// 2. Constrain top point ( first arg: index pt )( last arg: stem pos)
rLeg.snap(1, lLeg, 1.0)

// 3. Create bridge and constrain with legs
const hBar = new StemLine( [{x: 0, y: 0}, {x: 0, y: 0}], ts, 90, "red")
hBar.bridge( [ lLeg, rLeg ] , 0.25, true)

return [ lLeg, rLeg, hBar ]

},


"O": (p, self) => {
// Recipe A (65)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

const cx = aw/2
const hc = ch/2

const a = {x: cx, y: ch-ts/2};
const b = {x: aw, y: hc};
const c = {x: cx, y: ts/2};
const d = {x: 0,  y: hc};

const myspline = new StemLine( [a, b,c,d,a], ts, -90, "#0366d6")

return [ myspline ]

},

"О": (p, self) => {
// Рецепт О (Cyrillic)(Заглавная)

const { aw, br, ts, ch } = p // Unpack

const r = 250;
const cy = ch/2;
const cx = aw/2

const a = {x: cx, y: cy+r};
const b = {x: cx+r, y: cy};
const c = {x: cx, y: cy-r};
const d = {x: cx-r,  y: cy};

const myspline = new StemLine( [a, b, c, d, a], ts, 90, "#0366d6")

return [ myspline ]

},

"H": (p, self) => {
// Recipe H (72)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

self.advanceWidth = aw + ( br * 2 )
const LS =  br + ts / 2
const RS = ( aw + br ) - ts / 2

// 1. Create left and right "legs" + bridge
const lLeg   = new StemLine( [{x: LS, y: 0}, {x: LS, y: ch}], ts, 0, "#0366d6")
const rLeg   = new StemLine( [{x: RS, y: 0}, {x: RS, y: ch}], ts, 0, "yellow")
const hBar = new StemLine( [{x: LS, y: ch/2}, {x: RS, y: ch/2}], ts, 90,  "red")

// 2. Constrian bridge to legs on 50% height (t = 0.5)
hBar.bridge( [ lLeg, rLeg ] , 0.5)

return [ lLeg, rLeg, hBar ]

},

"I": (p, self) => {
// Recipe I (73)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

const xPos = br+ts/2
const lLeg = new StemLine( [{x: xPos, y: 0}, {x: xPos, y: ch}], ts, 0, "#0366d6")

// set customWidth from Recipe
self.advanceWidth = ts + ( br * 2 )

return [ lLeg ]
},

"K": (p, self) => {
// Recipe K (75)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

self.advanceWidth = aw + ( br * 2 )
const LS =  br + ts / 2
const RS = ( aw + br ) - ts / 2

// 1. Create Objects (cld = centerDown / clu = centerLeftUp)
const sp = map( ts, 0, 120, ts/2, ts );

const lLeg  = new StemLine( [{x: LS, y: 0}, {x: LS, y: ch}], ts, 0, "#0366d6");
const cldLeg  = new StemLine( [{x: RS, y: 0}, {x: sp, y: ch/2}], ts, 0, "yellow");
const cluLeg  = new StemLine( [{x: LS, y: ch/2}, {x: RS, y: ch}], ts, 0,  "red");

const tc = fit( ts, 60, 140, 0.5, 0.65);
cldLeg.snap(1, lLeg, tc);

return [ lLeg, cldLeg, cluLeg ]

},

"L": (p, self) => {
// Recipe L (76)(Lat)(Uppercase)

const { aw, br, ts, ch } = p // Unpack

self.advanceWidth = aw + ( br * 2 )
const LS =  br + ts / 2
const RS = aw+br

const lLeg = new StemLine( [{x: LS, y: 0}, {x: LS, y: ch}], ts, 0, "#0366d6");
const bLeg = new StemLine( [{x: LS, y: ts/2}, {x: RS, y: ts/2}], ts, 90, "yellow");

return [ lLeg, bLeg ];

},

"k": (p, self) => {
// Recipe k (107)(Lat)(Lowercase)

const { aw, br, ts, ch, xh } = p // Unpack

const newWidth = Math.ceil( aw / 1.2 ) +  ( br * 2 )
self.advanceWidth = newWidth 

const htStem = ts / 2
const LX = br + htStem
const RX = newWidth - br - htStem

// 1. Create Objects
const offsetConstrX = map( ts, 0, 120, htStem, ts/1.525 ) + br // fit?
const clampConstrX = clamp(offsetConstrX, LX, RX)

const middleB = clamp( map( ts, 40, 120, 0, 50) , 0, 300)

const lLeg  = new StemLine( [ {x: LX, y: 0}, {x: LX, y: ch} ], ts, 0, "#0366d6")
const cluLeg  = new StemLine( [ {x: clampConstrX, y: xh/2}, {x: RX, y: xh} ], ts, 0,  "red")
const cldLeg  = new StemLine( [ {x: RX, y: 0}, {x: clampConstrX, y: xh/2 + middleB} ], ts, 0, "yellow")

return [ lLeg, cluLeg, cldLeg ]

},

"П": (p, self) => {
// Рецепт П (Cyrillic)(Заглавная)

const { aw, br, ts, ch } = p // Распаковка

self.advanceWidth = aw + ( br * 2 )
const LS =  br + ts / 2
const RS = ( aw + br ) - ts / 2

// 1. Создаем объекты - левую и правую "ногу"
const lLeg   = new StemLine( [{x: LS, y: 0}, {x: LS, y: ch}], ts, 0, "#0366d6")
const rLeg   = new StemLine( [{x: RS, y: 0}, {x: RS, y: ch}], ts, 0, "yellow")
const tBar = new StemLine( [{x: 0, y: ch/2}, {x: aw - ts, y: ch/2}], ts, 90,  "red")

// 2. Привязываем перекладину к ногам на высоте 100% c учётом ширины (t = 1.0)
tBar.bridge( [lLeg, rLeg] , 1.0)

return [ lLeg, rLeg, tBar ]

},

"н": (p, self) => {
// Рецепт н (1085)(Cyrillic)(Строчная)

const { aw, br, ts, ch, xh } = p // Распаковка

const newWidth = Math.ceil(aw/1.2)
self.advanceWidth = newWidth // задаем новую ширину глифу

// 1. Создаем объекты - левую и правую "ногу"
const lLeg   = new StemLine( [{x: ts/2, y: 0}, {x: ts/2, y: xh}], ts, 0, "#0366d6")
const rLeg   = new StemLine( [{x: newWidth-ts/2, y: 0}, {x: newWidth-ts/2, y: xh}], ts, 0, "yellow")
const hBar = new StemLine( [{x:newWidth-ts/2, y: ch/2}, {x: ts/2, y: ch/2}], ts, 90,  "red")

// 2. Привязываем перекладину к ногам на высоте 50% (t = 0.5)
hBar.bridge( [ rLeg, lLeg ] , 0.5)

return [ lLeg, hBar, rLeg ]

},

"у": (p, self) => {
// Рецепт у (1091)(Cyrillic)(Строчная)

const { aw, br, ts, ch, xh } = p // Распаковка

const newWidth = Math.ceil(aw/1.2) +  ( br * 2 )
self.advanceWidth = newWidth // задаем ширину глифу

const hwStem = ts / 2
const tConstr  = newWidth - hwStem - br
const bConstr = hwStem // + br

// 1. Создаем объекты  (base / second)
const bLeg   = new StemLine( [{x: bConstr, y: -140}, {x: tConstr, y: xh} ], ts, 0, "#0366d6")
const sLeg   = new StemLine( [{x: newWidth/2, y: 0}, {x: hwStem + br+26, y: xh} ], ts, 0, "yellow")

// 2. Привязываем seocnd к base
sLeg.snap(0, bLeg, 0.22)

return [ bLeg, sLeg ]

},

"!": (p, self) => {
// Recipe ! *Symbol

const { aw, br, ts, ch } = p // Unpack

self.advanceWidth = ts + br*2

const pBlock = ts
const cPoint = ts/2 + br
const iSpace  = map( ts, 40, 310, ts, ts/3 )

const bStem = new StemLine( [{x: cPoint, y: 0}, {x: cPoint, y: 0+pBlock}], ts, 0, "#0366d6")
const tStem = new StemLine( [{x: cPoint, y: pBlock+iSpace}, {x: cPoint, y: ch}], ts, 0, "#0366d6")

return [ bStem, tStem ]

},

};

window.GLYPH_RECIPES = GLYPH_RECIPES;