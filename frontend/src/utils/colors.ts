const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((r << 16) + (g << 8) + b).toString(16).padStart(6, '0');
}

const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;
  const v: number = Math.max(r, g, b);
  const n: number = Math.min(r, g, b);
  const d: number = v - n;
  const h: number = d === 0 ? 0 : v === r ? (g - b) / d : v === g ? 2 + (b - r) / d : 4 + (r - g) / d;
  return [60 * (h < 0 ? h + 6 : h), v && (1 - n / v) * 100, v * 100];
}

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
  s /= 100;
  v /= 100;
  const k = (n: number) => (n + h / 60) % 6;
  const f = (n: number) => v * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  return [255 * f(5), 255 * f(3), 255 * f(1)];
}

const RED_HSV: readonly [number, number, number] = rgbToHsv(0xAD, 0x17, 0x17);
const GREY_HSV: readonly [number, number, number] = rgbToHsv(0x80, 0x80, 0x80);
const GREEN_HSV: readonly [number, number, number] = rgbToHsv(0x31, 0x8C, 0x34);

export const redGreyGreenGradient = (value: number): string => {
  const clamped = Math.max(0, Math.min(1, value));
  let h: number, s: number, v: number;
  if (clamped <= 0.5) {
    const t = clamped * 2;
    h = RED_HSV[0] + (GREY_HSV[0] - RED_HSV[0]) * t;
    s = RED_HSV[1] + (GREY_HSV[1] - RED_HSV[1]) * t;
    v = RED_HSV[2] + (GREY_HSV[2] - RED_HSV[2]) * t;
  } else {
    const t = (clamped - 0.5) * 2;
    h = GREY_HSV[0] + (GREEN_HSV[0] - GREY_HSV[0]) * t;
    s = GREY_HSV[1] + (GREEN_HSV[1] - GREY_HSV[1]) * t;
    v = GREY_HSV[2] + (GREEN_HSV[2] - GREY_HSV[2]) * t;
  }
  const [r, g, b] = hsvToRgb(h, s, v);
  return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
};
