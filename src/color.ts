// 色計算ユーティリティ（依存なしの純関数群）

export type Rgb = [number, number, number]

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export function hexToRgb(hex: string): Rgb {
  const s = hex.replace('#', '')
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s
  return [
    parseInt(f.slice(0, 2), 16),
    parseInt(f.slice(2, 4), 16),
    parseInt(f.slice(4, 6), 16)
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0'))
      .join('')
  )
}

// HEX / rgb() / hsl() のテキストを正規化HEXに変換。解釈できなければ null
export function parseColor(str: string): string | null {
  if (!str) return null
  const s = String(str).trim().toLowerCase()
  let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/)
  if (m) {
    const [r, g, b] = hexToRgb(m[1])
    return rgbToHex(r, g, b)
  }
  m = s.match(/^rgba?\(([^)]+)\)$/)
  if (m) {
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat)
    if (p.length >= 3) return rgbToHex(p[0], p[1], p[2])
  }
  m = s.match(/^hsla?\(([^)]+)\)$/)
  if (m) {
    const p = m[1].split(/[,\s/%]+/).filter(Boolean).map(parseFloat)
    if (p.length >= 3) {
      const [r, g, b] = hslToRgb(p[0], p[1], p[2])
      return rgbToHex(r, g, b)
    }
  }
  return null
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  const d = mx - mn
  let h = 0
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l = (mx + mn) / 2
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0
  return [h, s * 100, l * 100]
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  s /= 100
  l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const i = Math.floor((((h % 360) + 360) % 360) / 60)
  const t = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x]
  ][i]
  return [(t[0] + m) * 255, (t[1] + m) * 255, (t[2] + m) * 255]
}

function linearize(c: number): number {
  c /= 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

// WCAG 相対輝度
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(linearize)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// WCAG 2.x コントラスト比
export function contrast(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

export function lab(hex: string): [number, number, number] {
  const p = hexToRgb(hex).map(linearize)
  const X = (0.4124564 * p[0] + 0.3575761 * p[1] + 0.1804375 * p[2]) * 100
  const Y = (0.2126729 * p[0] + 0.7151522 * p[1] + 0.072175 * p[2]) * 100
  const Z = (0.0193339 * p[0] + 0.119192 * p[1] + 0.9503041 * p[2]) * 100
  const w = [95.047, 100, 108.883]
  const v = [X / w[0], Y / w[1], Z / w[2]].map((t) =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116
  )
  return [116 * v[1] - 16, 500 * (v[0] - v[1]), 200 * (v[1] - v[2])]
}

export function lch(hex: string): [number, number, number] {
  const [L, a, b] = lab(hex)
  const C = Math.sqrt(a * a + b * b)
  let h = (Math.atan2(b, a) * 180) / Math.PI
  if (h < 0) h += 360
  return [L, C, h]
}

export function oklab(hex: string): [number, number, number] {
  const p = hexToRgb(hex).map(linearize)
  const l = Math.cbrt(0.4122214708 * p[0] + 0.5363325363 * p[1] + 0.0514459929 * p[2])
  const m = Math.cbrt(0.2119034982 * p[0] + 0.6806995451 * p[1] + 0.1073969566 * p[2])
  const s = Math.cbrt(0.0883024619 * p[0] + 0.2817188376 * p[1] + 0.6299787005 * p[2])
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ]
}

export function oklch(hex: string): [number, number, number] {
  const [L, a, b] = oklab(hex)
  const C = Math.sqrt(a * a + b * b)
  let h = (Math.atan2(b, a) * 180) / Math.PI
  if (h < 0) h += 360
  return [L, C, h]
}

// 色差 CIE76
export function deltaE76(a: string, b: string): number {
  const x = lab(a)
  const y = lab(b)
  return Math.sqrt((x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2)
}

// 色差 CIEDE2000
export function deltaE2000(hexA: string, hexB: string): number {
  const [L1, a1, b1] = lab(hexA)
  const [L2, a2, b2] = lab(hexB)
  const rad = Math.PI / 180
  const deg = 180 / Math.PI
  const C1 = Math.sqrt(a1 * a1 + b1 * b1)
  const C2 = Math.sqrt(a2 * a2 + b2 * b2)
  const Cb = (C1 + C2) / 2
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
  const ap1 = (1 + G) * a1
  const ap2 = (1 + G) * a2
  const Cp1 = Math.sqrt(ap1 * ap1 + b1 * b1)
  const Cp2 = Math.sqrt(ap2 * ap2 + b2 * b2)
  const hp = (b: number, ap: number) => {
    if (b === 0 && ap === 0) return 0
    let h = Math.atan2(b, ap) * deg
    return h < 0 ? h + 360 : h
  }
  const hp1 = hp(b1, ap1)
  const hp2 = hp(b2, ap2)
  const dLp = L2 - L1
  const dCp = Cp2 - Cp1
  let dhp = 0
  if (Cp1 * Cp2 !== 0) {
    dhp = hp2 - hp1
    if (dhp > 180) dhp -= 360
    else if (dhp < -180) dhp += 360
  }
  const dHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dhp * rad) / 2)
  const Lpb = (L1 + L2) / 2
  const Cpb = (Cp1 + Cp2) / 2
  let hpb: number
  if (Cp1 * Cp2 === 0) {
    hpb = hp1 + hp2
  } else {
    const d = Math.abs(hp1 - hp2)
    hpb = d > 180 ? (hp1 + hp2 + 360) / 2 : (hp1 + hp2) / 2
    if (hpb >= 360) hpb -= 360
  }
  const T =
    1 -
    0.17 * Math.cos((hpb - 30) * rad) +
    0.24 * Math.cos(2 * hpb * rad) +
    0.32 * Math.cos((3 * hpb + 6) * rad) -
    0.2 * Math.cos((4 * hpb - 63) * rad)
  const dTh = 30 * Math.exp(-(((hpb - 275) / 25) ** 2))
  const Rc = 2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7))
  const Sl = 1 + (0.015 * (Lpb - 50) ** 2) / Math.sqrt(20 + (Lpb - 50) ** 2)
  const Sc = 1 + 0.045 * Cpb
  const Sh = 1 + 0.015 * Cpb * T
  const Rt = -Math.sin(2 * dTh * rad) * Rc
  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh)
  )
}

// 背景色に対して読みやすい文字色（白 or 黒）を返す
export function onColor(bg: string): string {
  return contrast(bg, '#ffffff') >= contrast(bg, '#111111') ? '#ffffff' : '#111111'
}

export function fmt(n: number, digits = 2): string {
  return Number(n).toFixed(digits)
}
