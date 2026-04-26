const easeInQuad  = (t) => t * t;          // t^2 // quad 
const easeInCubic = (t) => t * t * t;      // t^3 // cubic

const easeIn = (t, p) => Math.pow(t, p);   // p = power
const easeOut = (t, p) => 1 - Math.pow(1 - t, p);

const easeLerp = (t) => {
  const a = easeIn(t, 1);
  const b = easeOut(t,5);
  return lerp(a, b, t); 
};

const easeMix = (t) => {
  const steep = Math.pow(t, 2);
  return 1 - Math.pow(1 - steep, 10);
};

const easeExp = (t) => {
  if (t === 0) return 0;
  if (t === 1) return 1;

  const p1 = Math.pow(t, 2); 
  return 1 - Math.pow(2, -15 * p1); 
};

const easeBlend = (t) => {
  const split = 0.2;
  const blendZone = 0.2; // Область lerp
  
  // 1. Считаем оба значения для всей дистанции
  const localIn = t / split;
  const valIn = easeIn(localIn, 2) * split;

  const localTOut = (t - split) / (1 - split);
  const valOut = easeOut(Math.max(0, localTOut), 8) * (1 - split) + split;

  if (t < split) return valIn;

  if (t < split + blendZone) {
    const alpha = (t - split) / blendZone; 
    return lerp(valIn, valOut, alpha);
  }

  return valOut;
};

const easeCustom = (t, startInf = 0.4, endInf = 0.9) => {
  
  const x1 = startInf; 
  const y1 = 0; 
  const x2 = 1 - endInf;
  const y2 = 1;

  // 1. Находим "внутреннее t" для оси X (времени)
  const solveT = (x) => {
    let t0 = 0, t1 = 1, t2 = x;
    for (let i = 0; i < 10; i++) {
      const currentX = 3 * Math.pow(1 - t2, 2) * t2 * x1 + 3 * (1 - t2) * Math.pow(t2, 2) * x2 + Math.pow(t2, 3);
      if (Math.abs(currentX - x) < 0.001) return t2;
      if (x > currentX) t0 = t2; else t1 = t2;
      t2 = (t0 + t1) * 0.5;
    }
    return t2;
  };

  const st = solveT(t);
  return 3 * Math.pow(1 - st, 2) * st * y1 + 3 * (1 - st) * Math.pow(st, 2) * y2 + Math.pow(st, 3);
};

window.easeExp = easeExp;
window.easeBlend = easeBlend;
window.easeCustom = easeCustom;


const easeCustomAlt = (t, startInf = 0.4, endInf = 0.9, p = 3) => {
  const x1 = startInf;
  const x2 = 1 - endInf;

  const solveT = (x) => {
    let t0 = 0, t1 = 1, t2 = x;
    for (let i = 0; i < 10; i++) {
      // Здесь оставляем куб (3), так как это стандарт кривизны времени
      const u = 1 - t2;
      const currentX = 3 * u * u * t2 * x1 + 3 * u * t2 * t2 * x2 + t2 * t2 * t2;
      if (Math.abs(currentX - x) < 0.001) return t2;
      if (x > currentX) t0 = t2; else t1 = t2;
      t2 = (t0 + t1) * 0.5;
    }
    return t2;
  };

  const st = solveT(t);

  const u = 1 - st;
  return 3 * u * Math.pow(st, p - 1) + Math.pow(st, p);
};