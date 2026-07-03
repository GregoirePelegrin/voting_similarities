const hexToRgb = (hex_in: string): number[] => {
  let alpha: boolean = false;
  let hex: string = hex_in.slice(hex_in.startsWith("#") ? 1: 0);
  if (hex.length === 3) hex = [...hex].map(x => x+x).join('');
  else if (hex.length === 8) alpha = true;
  const h: number = parseInt(hex, 16);
  return [
    h >>> (alpha ? 24 : 16),
    ((h & (alpha ? 0x00ff0000 : 0x00ff00)) >>> (alpha ? 16 : 8)),
    ((h & (alpha ? 0x0000ff00 : 0x0000ff)) >>> (alpha ? 8 : 0))
  ];
}

const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((r << 16) + (g << 8) + b).toString(16).padStart(6, '0');
}

const rgbToHsv = (r: number, g: number, b: number): number[] => {
  r /= 255;
  g /= 255;
  b /= 255;
  const v: number = Math.max(r, g, b);
  const n: number = Math.min(r, g, b);
  const d: number = v - n;
  const h: number = d === 0 ? 0 : v === r ? (g - b) / d : v === g ? 2 + (b - r) / d : 4 + (r - g) / d;
  return [60 * (h < 0 ? h + 6 : h), v && (1 - n / v) * 100, v * 100];
}

const hsvToRgb = (h: number, s: number, v: number): number[] => {
  s /= 100;
  v /= 100;
  const k = (n: number) => (n + h / 60) % 6;
  const f = (n: number) => v * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  return [255 * f(5), 255 * f(3), 255 * f(1)];
}

const customSigmoid = (val: number): number => {
  return Math.min(Math.max(1.2 / (1 + Math.exp(-10 * (val - 0.5))), 0), 1);
}

const sigmoidInterpolator = (value: number, h1: number, s1: number, v1: number, h2: number, s2: number, v2: number, h3: number, s3: number, v3: number): number[] => {
  const sigmoidedValue: number = customSigmoid(value);
  if (sigmoidedValue <= 0.5) {
    return [
      h1 + (h2 - h1) * sigmoidedValue,
      s1 + (s2 - s1) * sigmoidedValue,
      v1 + (v2 - v1) * sigmoidedValue,
    ];
  } else {
    return [
      h2 + (h3 - h2) * sigmoidedValue,
      s2 + (s3 - s2) * sigmoidedValue,
      v2 + (v3 - v2) * sigmoidedValue,
    ];
  }
}

const RED_HSV = rgbToHsv(0xAD, 0x17, 0x17);
const GREY_HSV = rgbToHsv(0x80, 0x80, 0x80);
const GREEN_HSV = rgbToHsv(0x31, 0x8C, 0x34);

export const redGreyGreenGradient = (value: number): string => {
  const clamped = Math.max(0, Math.min(1, value));
  const [h, s, v] = sigmoidInterpolator(clamped, ...RED_HSV, ...GREY_HSV, ...GREEN_HSV);
  const [r, g, b] = hsvToRgb(h, s, v);
  return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
};