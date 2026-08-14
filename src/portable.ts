// Android / iOS / Web の色定義フォーマットとのインポート・エクスポート

import { parseColor, rgbToHex, hexToRgb } from './color'
import type { ColorEntry } from './state'

export interface PortEntry {
  name: string
  hex: string
}

export interface ParseResult {
  // 判別したフォーマットの表示名
  format: string
  entries: PortEntry[]
}

// 一度に取り込める色数の上限
export const IMPORT_LIMIT = 200

// ---------- インポート ----------

function expand3(s: string): string {
  return '#' + s.split('').map((c) => c + c).join('').toLowerCase()
}

// Android 表記（#RGB / #ARGB / #RRGGBB / #AARRGGBB、アルファは先頭）→ #rrggbb
function normAndroidHex(raw: string): string | null {
  const s = raw.replace('#', '').trim()
  if (/^[0-9a-f]{3}$/i.test(s)) return expand3(s)
  if (/^[0-9a-f]{4}$/i.test(s)) return expand3(s.slice(1))
  if (/^[0-9a-f]{6}$/i.test(s)) return '#' + s.toLowerCase()
  if (/^[0-9a-f]{8}$/i.test(s)) return '#' + s.slice(2).toLowerCase()
  return null
}

// Web 表記（#RGBA / #RRGGBBAA はアルファが末尾）も受け付けて #rrggbb へ
function normWebValue(raw: string): string | null {
  const s = raw.trim().replace(/\s*!(default|important)\s*$/, '')
  const m = s.match(/^#?([0-9a-f]{4}|[0-9a-f]{8})$/i)
  if (m) {
    const h = m[1]
    return h.length === 4 ? expand3(h.slice(0, 3)) : '#' + h.slice(0, 6).toLowerCase()
  }
  return parseColor(s)
}

function parseAndroidXml(text: string): PortEntry[] {
  const raw = new Map<string, string>()
  const order: string[] = []
  const re = /<color\s+name\s*=\s*"([^"]+)"[^>]*>\s*([^<]+?)\s*<\/color>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (!raw.has(m[1])) order.push(m[1])
    raw.set(m[1], m[2])
  }
  // @color/xxx のローカル参照を 1 段だけ解決する
  const out: PortEntry[] = []
  for (const name of order) {
    let v = raw.get(name)!
    const ref = v.match(/^@color\/(\S+)$/)
    if (ref && raw.has(ref[1])) v = raw.get(ref[1])!
    const hex = normAndroidHex(v)
    if (hex) out.push({ name, hex })
  }
  return out
}

// Swift の色コンポーネント式（red: 0.2 / red: 51 / red: 51 / 255）を 0-255 に変換
function swiftComp(expr: string, key: string): number | null {
  const m = expr.match(new RegExp('\\b' + key + '\\s*:\\s*([0-9.]+)(?:\\s*/\\s*([0-9.]+))?'))
  if (!m) return null
  let v = parseFloat(m[1])
  if (m[2]) v /= parseFloat(m[2])
  return v <= 1 ? Math.round(v * 255) : Math.round(v)
}

function swiftExprToHex(expr: string): string | null {
  const hx = expr.match(/0x([0-9a-f]{6})\b/i)
  if (hx) return '#' + hx[1].toLowerCase()
  const str = expr.match(/["']#?([0-9a-f]{6})["']/i)
  if (str) return '#' + str[1].toLowerCase()
  const r = swiftComp(expr, 'red')
  const g = swiftComp(expr, 'green')
  const b = swiftComp(expr, 'blue')
  if (r != null && g != null && b != null) return rgbToHex(r, g, b)
  const w = swiftComp(expr, 'white')
  if (w != null) return rgbToHex(w, w, w)
  return null
}

function parseSwift(text: string): PortEntry[] {
  const out: PortEntry[] = []
  const re = /(?:let|var)\s+([A-Za-z_]\w*)[^=\n]*=([^\n]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (!/\b(?:UIColor|NSColor|Color|colorLiteral)\b/.test(m[2])) continue
    const hex = swiftExprToHex(m[2])
    if (hex) out.push({ name: m[1], hex })
  }
  return out
}

// Asset Catalog（Contents.json）の components 値を 0-255 に変換
function assetComp(v: unknown): number {
  if (typeof v === 'number') return v <= 1 ? Math.round(v * 255) : Math.round(v)
  const s = String(v)
  if (/^0x/i.test(s)) return parseInt(s, 16)
  const f = parseFloat(s)
  return s.includes('.') || f <= 1 ? Math.round(f * 255) : Math.round(f)
}

function parseAssetJson(obj: { colors: unknown[] }): PortEntry[] {
  const out: PortEntry[] = []
  obj.colors.forEach((item, i) => {
    const c = item as {
      color?: { components?: Record<string, unknown> }
      appearances?: Array<{ value?: string }>
    }
    const comps = c?.color?.components
    if (!comps || comps.red == null) return
    const hex = rgbToHex(assetComp(comps.red), assetComp(comps.green), assetComp(comps.blue))
    const dark = c.appearances?.some((a) => a?.value === 'dark')
    out.push({ name: `色 ${i + 1}` + (dark ? ' (dark)' : ''), hex })
  })
  return out
}

function walkTokens(obj: Record<string, unknown>, path: string[], out: PortEntry[]): void {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      const hex = normWebValue(v)
      if (hex) out.push({ name: [...path, k].join('/'), hex })
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      const rec = v as Record<string, unknown>
      const leaf = rec.value ?? rec.$value
      if (typeof leaf === 'string') {
        const hex = normWebValue(leaf)
        if (hex) {
          out.push({ name: [...path, k].join('/'), hex })
          continue
        }
      }
      walkTokens(rec, [...path, k], out)
    }
  }
}

function parseVars(text: string, re: RegExp): PortEntry[] {
  const out: PortEntry[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const hex = normWebValue(m[2])
    if (hex) out.push({ name: m[1], hex })
  }
  return out
}

// 「名前: 値」または値のみの行リスト
function parsePlainList(text: string): PortEntry[] {
  const out: PortEntry[] = []
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('//') || t.startsWith('#!')) continue
    const m = t.match(/^(?:([^:=]+?)\s*[:=]\s*)?(\S.*)$/)
    if (!m) continue
    const hex = normWebValue(m[2]) ?? (m[1] ? null : normWebValue(t))
    if (hex) out.push({ name: m[1]?.trim() ?? '', hex })
  }
  return out
}

// テキストのフォーマットを自動判別してパースする。色が見つからなければ null
export function detectAndParse(text: string): ParseResult | null {
  const t = text.trim()
  if (!t) return null

  const done = (format: string, entries: PortEntry[]): ParseResult | null =>
    entries.length ? { format, entries: entries.slice(0, IMPORT_LIMIT) } : null

  if (/<color\s+name/.test(t)) return done('Android colors.xml', parseAndroidXml(t))

  if (/^[[{]/.test(t)) {
    try {
      const obj = JSON.parse(t)
      if (obj && typeof obj === 'object') {
        if (Array.isArray(obj.colors)) {
          const r = done('iOS Asset Catalog', parseAssetJson(obj))
          if (r) return r
        }
        if (!Array.isArray(obj)) {
          const entries: PortEntry[] = []
          walkTokens(obj, [], entries)
          const r = done('JSON トークン', entries)
          if (r) return r
        }
        if (Array.isArray(obj)) {
          const entries = obj
            .map((v, i) => {
              const hex = typeof v === 'string' ? normWebValue(v) : null
              return hex ? { name: `色 ${i + 1}`, hex } : null
            })
            .filter((e): e is PortEntry => e !== null)
          const r = done('JSON カラーリスト', entries)
          if (r) return r
        }
      }
    } catch {
      // JSON でなければ他の形式として続行
    }
  }

  if (/\b(?:UIColor|NSColor|Color|colorLiteral)\s*\(/.test(t)) {
    const r = done('iOS Swift', parseSwift(t))
    if (r) return r
  }

  if (/--[\w-]+\s*:/.test(t)) {
    const r = done('CSS 変数', parseVars(t, /--([\w-]+)\s*:\s*([^;{}]+)[;}]/g))
    if (r) return r
  }

  if (/\$[\w-]+\s*:/.test(t)) {
    const r = done('SCSS 変数', parseVars(t, /\$([\w-]+)\s*:\s*([^;\n]+);?/g))
    if (r) return r
  }

  return done('カラーリスト', parsePlainList(t))
}

// ---------- エクスポート ----------

export type ExportFormat = 'android' | 'swift' | 'css' | 'scss' | 'json'

export const EXPORT_FORMATS: Array<{ key: ExportFormat; label: string; file: string }> = [
  { key: 'android', label: 'Android XML', file: 'colors.xml' },
  { key: 'swift', label: 'iOS Swift', file: 'Colors.swift' },
  { key: 'css', label: 'CSS 変数', file: 'colors.css' },
  { key: 'scss', label: 'SCSS 変数', file: '_colors.scss' },
  { key: 'json', label: 'JSON', file: 'colors.json' }
]

// 名前を識別子に変換し、重複には連番を振る
function uniqueNames(
  colors: ColorEntry[],
  sanitize: (name: string, i: number) => string,
  sep: string
): string[] {
  const used = new Set<string>()
  return colors.map((c, i) => {
    const base = sanitize(c.name, i)
    let name = base
    let n = 2
    while (used.has(name)) name = base + sep + n++
    used.add(name)
    return name
  })
}

function snake(name: string, i: number): string {
  const t = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  if (!t) return `color_${i + 1}`
  return /^[a-z]/.test(t) ? t : 'color_' + t
}

function kebab(name: string, i: number): string {
  return snake(name, i).replace(/_/g, '-')
}

function camel(name: string, i: number): string {
  const parts = snake(name, i).split('_')
  return parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function exportColors(colors: ColorEntry[], format: ExportFormat): string {
  if (format === 'android') {
    const names = uniqueNames(colors, snake, '_')
    const body = colors
      .map((c, i) => {
        const note = names[i] !== c.name ? `    <!-- ${escapeXml(c.name)} -->\n` : ''
        return `${note}    <color name="${names[i]}">${c.hex.toUpperCase()}</color>`
      })
      .join('\n')
    return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${body}\n</resources>\n`
  }

  if (format === 'swift') {
    const names = uniqueNames(colors, camel, '')
    const body = colors
      .map((c, i) => {
        const [r, g, b] = hexToRgb(c.hex)
        const note = names[i] !== c.name ? `    /// ${c.name}\n` : ''
        return `${note}    static let ${names[i]} = Color(red: ${r} / 255, green: ${g} / 255, blue: ${b} / 255) // ${c.hex}`
      })
      .join('\n')
    return `import SwiftUI\n\nextension Color {\n${body}\n}\n`
  }

  if (format === 'css') {
    const names = uniqueNames(colors, kebab, '-')
    const body = colors
      .map((c, i) => {
        const note = names[i] !== c.name ? ` /* ${c.name} */` : ''
        return `  --${names[i]}: ${c.hex};${note}`
      })
      .join('\n')
    return `:root {\n${body}\n}\n`
  }

  if (format === 'scss') {
    const names = uniqueNames(colors, kebab, '-')
    return (
      colors
        .map((c, i) => {
          const note = names[i] !== c.name ? ` // ${c.name}` : ''
          return `$${names[i]}: ${c.hex};${note}`
        })
        .join('\n') + '\n'
    )
  }

  const names = uniqueNames(colors, (n, i) => n.trim() || `色 ${i + 1}`, ' ')
  return JSON.stringify(Object.fromEntries(colors.map((c, i) => [names[i], c.hex])), null, 2) + '\n'
}
