import type { CSSProperties } from 'react'
import { contrast, fmt, onColor } from '../color'
import { PART_LABELS, type ColorEntry, type PageKey, type PartKey, type ThemeKey } from '../state'

interface Props {
  colors: ColorEntry[]
  part: PartKey
  page: PageKey
  theme: ThemeKey
  onPart: (part: PartKey) => void
  onPage: (page: PageKey) => void
  onTheme: (theme: ThemeKey) => void
}

// サンプルページのニュートラル配色。比較対象パーツだけが各色に置き換わる
interface Palette {
  pg: string
  tx: string
  mu: string
  nav: string
  navTx: string
  card: string
  cardTx: string
  btn: string
  btnTx: string
  badge: string
  badgeTx: string
  alert: string
  alertTx: string
  bd: string
  hd?: string
  body?: string
}

const NEUTRAL_LIGHT: Palette = {
  pg: '#ffffff',
  tx: '#17171a',
  mu: '#6f6e77',
  nav: '#eceae5',
  navTx: '#17171a',
  card: '#f6f5f2',
  cardTx: '#17171a',
  btn: '#26262b',
  btnTx: '#ffffff',
  badge: '#e4e3de',
  badgeTx: '#17171a',
  alert: '#f1efea',
  alertTx: '#17171a',
  bd: '#e2e1dc'
}

const NEUTRAL_DARK: Palette = {
  pg: '#1a1a1e',
  tx: '#f2f2ef',
  mu: '#a0a0a8',
  nav: '#26262b',
  navTx: '#f2f2ef',
  card: '#232328',
  cardTx: '#f2f2ef',
  btn: '#f2f2ef',
  btnTx: '#1a1a1e',
  badge: '#33333a',
  badgeTx: '#f2f2ef',
  alert: '#26262b',
  alertTx: '#f2f2ef',
  bd: '#33333a'
}

interface PreviewModel {
  entry: ColorEntry
  vars: CSSProperties
  warn: string | null
  warnShort: string
}

// 色 1 つぶんのプレビュー用テーマと、コントラスト警告を組み立てる
function buildPreview(entry: ColorEntry, part: PartKey, theme: ThemeKey): PreviewModel {
  const base = theme === 'dark' ? NEUTRAL_DARK : NEUTRAL_LIGHT
  const t: Palette = { ...base }
  const col = entry.hex

  // [ラベル, 実測コントラスト, 推奨下限]
  const checks: Array<[string, number, number]> = []
  if (part === 'button') {
    t.btn = col
    t.btnTx = onColor(col)
    checks.push(['文字', contrast(col, t.btnTx), 4.5], ['背景との境界', contrast(col, t.pg), 3])
  } else if (part === 'card') {
    t.card = col
    t.cardTx = onColor(col)
    checks.push(['文字', contrast(col, t.cardTx), 4.5], ['背景との境界', contrast(col, t.pg), 3])
  } else if (part === 'nav') {
    t.nav = col
    t.navTx = onColor(col)
    checks.push(['文字', contrast(col, t.navTx), 4.5], ['背景との境界', contrast(col, t.pg), 3])
  } else if (part === 'badge') {
    t.badge = col
    t.badgeTx = onColor(col)
    checks.push(['文字', contrast(col, t.badgeTx), 4.5], ['背景との境界', contrast(col, t.pg), 3])
  } else if (part === 'alert') {
    t.alert = col
    t.alertTx = onColor(col)
    checks.push(['文字', contrast(col, t.alertTx), 4.5], ['背景との境界', contrast(col, t.pg), 3])
  } else if (part === 'heading') {
    t.hd = col
    checks.push(['本文背景', contrast(col, t.pg), 3])
  } else if (part === 'body') {
    t.body = col
    checks.push(['本文背景', contrast(col, t.pg), 4.5])
  }

  let worst: [string, number, number] | null = null
  for (const c of checks) {
    if (c[1] < c[2] && (!worst || c[1] / c[2] < worst[1] / worst[2])) worst = c
  }
  const warn = worst
    ? `${PART_LABELS[part]}の${worst[0]}とのコントラストが ${fmt(worst[1], 2)}:1（推奨 ${worst[2]} 以上）`
    : null

  const vars = {
    '--c': col,
    '--pg': t.pg,
    '--tx': t.tx,
    '--mu': t.mu,
    '--nav': t.nav,
    '--navTx': t.navTx,
    '--card': t.card,
    '--cardTx': t.cardTx,
    '--btn': t.btn,
    '--btnTx': t.btnTx,
    '--badge': t.badge,
    '--badgeTx': t.badgeTx,
    '--alert': t.alert,
    '--alertTx': t.alertTx,
    '--bd': t.bd,
    '--hd': t.hd ?? t.tx,
    '--body': t.body ?? t.mu
  } as CSSProperties

  return { entry, vars, warn, warnShort: worst ? `${fmt(worst[1], 1)}:1` : '' }
}

function LpSample() {
  return (
    <div className="sample">
      <NavBar />
      <div className="sample__body">
        <h3 className="sample__heading">見出しのサンプル</h3>
        <p className="sample__text">
          本文のサンプルテキストです。実際のUIの文脈で色がどう見えるかを確認できます。
        </p>
        <div className="sample__actions">
          <button className="sample__btn">申し込む</button>
          <span className="sample__badge">NEW</span>
        </div>
        <div className="sample__card">
          <span className="sample__card-title">カードタイトル</span>
          <span className="sample__card-text">カード内の補足テキスト。</span>
        </div>
        <div className="sample__alert">保存されていない変更があります。</div>
      </div>
    </div>
  )
}

function EcSample() {
  return (
    <div className="sample">
      <NavBar />
      <div className="sample__body">
        <div className="sample__ec-head">
          <h3 className="sample__ec-heading">新着アイテム</h3>
          <span className="sample__badge">SALE</span>
        </div>
        <div className="sample__ec-grid">
          <div className="sample__product">
            <div className="sample__product-img" />
            <span className="sample__product-name">リネンシャツ</span>
            <span className="sample__product-price">¥12,800</span>
          </div>
          <div className="sample__product">
            <div className="sample__product-img" />
            <span className="sample__product-name">レザーバッグ</span>
            <span className="sample__product-price">¥28,000</span>
          </div>
        </div>
        <p className="sample__text">在庫はカートに入れた時点で確保されます。</p>
        <button className="sample__btn">カートに追加</button>
        <div className="sample__alert">¥15,000 以上で送料無料。</div>
      </div>
    </div>
  )
}

function NavBar() {
  return (
    <div className="sample__nav">
      <span className="sample__nav-brand">Acme</span>
      <span className="sample__nav-links">
        <span>製品</span>
        <span>料金</span>
        <span>サポート</span>
      </span>
    </div>
  )
}

function AppSample() {
  return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="phone__screen">
          <div className="phone__status">
            <span>9:41</span>
            <span style={{ opacity: 0.8 }}>▮▮▮ ▮</span>
          </div>
          <div className="phone__appbar">
            <span className="phone__appbar-title">ホーム</span>
            <span className="phone__appbar-badge">3</span>
          </div>
          <div className="phone__body">
            <h3 className="phone__heading">こんにちは、佐藤さん</h3>
            <p className="phone__text">今日のタスクが 3 件あります。</p>
            <div className="phone__card">
              <span className="phone__card-title">今週のまとめ</span>
              <span className="phone__card-text">達成率 68%</span>
            </div>
            <div className="phone__alert">通信環境が不安定です。</div>
            <button className="phone__btn">タスクを追加</button>
          </div>
          <div className="phone__tabbar">
            <span className="phone__tab--active">ホーム</span>
            <span className="phone__tab">検索</span>
            <span className="phone__tab">通知</span>
            <span className="phone__tab">設定</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PreviewSection(props: Props) {
  const { colors, part, page, theme } = props
  const previews = colors.map((c) => buildPreview(c, part, theme))

  const seg = (active: boolean) => `seg__btn${active ? ' seg__btn--active' : ''}`

  return (
    <section className="panel">
      <div className="preview-head">
        <h2 className="panel__title">パーツプレビュー</h2>
        <div className="preview-controls">
          <label className="field-label">
            比較対象
            <select
              className="select"
              value={part}
              onChange={(e) => props.onPart(e.target.value as PartKey)}
            >
              {(Object.keys(PART_LABELS) as PartKey[]).map((k) => (
                <option key={k} value={k}>
                  {PART_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <div className="seg">
            <button className={seg(page === 'lp')} onClick={() => props.onPage('lp')}>
              LP
            </button>
            <button className={seg(page === 'ec')} onClick={() => props.onPage('ec')}>
              商品一覧
            </button>
            <button className={seg(page === 'app')} onClick={() => props.onPage('app')}>
              モバイル
            </button>
          </div>
          <div className="seg">
            <button className={seg(theme === 'light')} onClick={() => props.onTheme('light')}>
              ライト
            </button>
            <button className={seg(theme === 'dark')} onClick={() => props.onTheme('dark')}>
              ダーク
            </button>
          </div>
        </div>
      </div>

      <div className="preview-grid">
        {previews.map((p) => (
          <div key={p.entry.id} style={p.vars}>
            <div className="preview__head">
              <span className="preview__name">
                <span className="preview__chip" />
                <span className="preview__name-text">{p.entry.name}</span>
              </span>
              {p.warn && (
                <span className="preview__warn" title={p.warn}>
                  ⚠ {p.warnShort}
                </span>
              )}
            </div>
            {page === 'app' ? <AppSample /> : page === 'ec' ? <EcSample /> : <LpSample />}
          </div>
        ))}
      </div>
    </section>
  )
}
