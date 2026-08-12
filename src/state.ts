export interface ColorEntry {
  id: number
  name: string
  hex: string
  // 入力欄の生テキスト（確定時に hex へ正規化される）
  text: string
}

export type PartKey = 'button' | 'card' | 'heading' | 'body' | 'nav' | 'badge' | 'alert'
export type PageKey = 'lp' | 'ec' | 'app'
export type ThemeKey = 'light' | 'dark'

export interface AppState {
  colors: ColorEntry[]
  part: PartKey
  page: PageKey
  theme: ThemeKey
  // 定量比較で選択中のペア（colors のインデックス）
  pair: [number, number]
  seq: number
}

export const PART_LABELS: Record<PartKey, string> = {
  button: 'ボタン',
  card: 'カード背景',
  heading: '見出しテキスト',
  body: '本文テキスト',
  nav: 'ナビゲーションバー',
  badge: 'バッジ',
  alert: 'アラート'
}

const STORAGE_KEY = 'color-diff:state'

function defaultState(): AppState {
  return {
    colors: [
      { id: 1, name: '色 1', hex: '#3563e9', text: '#3563e9' },
      { id: 2, name: '色 2', hex: '#f4f2ec', text: '#f4f2ec' }
    ],
    part: 'button',
    page: 'lp',
    theme: 'light',
    pair: [0, 1],
    seq: 3
  }
}

export function serialize(st: AppState): string {
  const p = new URLSearchParams()
  p.set('c', st.colors.map((c) => c.hex.slice(1) + '~' + encodeURIComponent(c.name)).join(','))
  p.set('p', st.part)
  p.set('g', st.page)
  p.set('t', st.theme)
  return p.toString()
}

const PARTS: PartKey[] = ['button', 'card', 'heading', 'body', 'nav', 'badge', 'alert']
const PAGES: PageKey[] = ['lp', 'ec', 'app']
const THEMES: ThemeKey[] = ['light', 'dark']

function pick<T extends string>(list: readonly T[], v: string | null, fallback: T): T {
  return list.includes(v as T) ? (v as T) : fallback
}

// URL クエリ → localStorage の順で状態を復元する
export function loadInitial(): AppState {
  const def = defaultState()
  let src: URLSearchParams | null = null
  try {
    const q = new URLSearchParams(location.search)
    if (q.get('c')) src = q
    else {
      const s = localStorage.getItem(STORAGE_KEY)
      if (s) src = new URLSearchParams(s)
    }
  } catch {
    return def
  }
  if (!src) return def
  try {
    const colors = (src.get('c') ?? '')
      .split(',')
      .map((t, i): ColorEntry => {
        const parts = t.split('~')
        const hex = '#' + parts[0].replace('#', '')
        return {
          id: i + 1,
          name: parts[1] ? decodeURIComponent(parts[1]) : '色 ' + (i + 1),
          hex,
          text: hex
        }
      })
      .filter((c) => /^#[0-9a-f]{6}$/i.test(c.hex))
    if (!colors.length) return def
    return {
      ...def,
      colors,
      part: pick(PARTS, src.get('p'), def.part),
      page: pick(PAGES, src.get('g'), def.page),
      theme: pick(THEMES, src.get('t'), def.theme),
      pair: [0, Math.min(1, colors.length - 1)],
      seq: colors.length + 1
    }
  } catch {
    return def
  }
}

export function persist(st: AppState): void {
  const s = serialize(st)
  try {
    history.replaceState(null, '', '?' + s)
    localStorage.setItem(STORAGE_KEY, s)
  } catch {
    // プライベートモード等で失敗しても無視
  }
}
