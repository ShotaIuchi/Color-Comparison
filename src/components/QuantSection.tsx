import { contrast, deltaE2000, deltaE76, fmt, lch } from '../color'
import type { ColorEntry } from '../state'

interface Props {
  colors: ColorEntry[]
  pair: [number, number]
  onSelectPair: (pair: [number, number]) => void
}

function deVerdict(de: number): string {
  if (de < 1) return 'ほぼ見分けがつかない差'
  if (de < 2) return '注意して見れば分かる差'
  if (de < 10) return 'はっきり違う色に見える'
  if (de < 50) return '明確に別の色'
  return 'まったく異なる色'
}

function crColor(cr: number): string {
  if (cr >= 4.5) return '#1d6b3f'
  if (cr >= 3) return '#9a5b12'
  return '#a32c2c'
}

export function QuantSection({ colors, pair, onSelectPair }: Props) {
  const n = colors.length
  const pi = Math.min(pair[0], n - 1)
  const pj = Math.min(pair[1], n - 1)
  const A = colors[pi]
  const B = colors[pj] ?? colors[0]

  const de = deltaE2000(A.hex, B.hex)
  const cr = contrast(A.hex, B.hex)
  const la = lch(A.hex)
  const lb = lch(B.hex)
  let dh = Math.abs(la[2] - lb[2])
  if (dh > 180) dh = 360 - dh

  const wcag = [
    { label: 'AA 通常', ok: cr >= 4.5 },
    { label: 'AA 大', ok: cr >= 3 },
    { label: 'AAA 通常', ok: cr >= 7 },
    { label: 'AAA 大', ok: cr >= 4.5 }
  ]

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">定量比較</h2>
        <span className="panel__note">
          {n > 2 ? '3色以上：マトリクスからペアを選択' : '2色のペア指標'}
        </span>
      </div>

      {n > 2 && (
        <div className="matrix-wrap">
          <table className="matrix">
            <tbody>
              {colors.map((row, i) => (
                <tr key={row.id}>
                  <th>{row.name}</th>
                  {colors.map((col, j) => {
                    const same = i === j
                    const d = same ? 0 : deltaE2000(row.hex, col.hex)
                    const c = same ? 1 : contrast(row.hex, col.hex)
                    const selected = (i === pi && j === pj) || (i === pj && j === pi)
                    const cls = [
                      'matrix__cell',
                      selected && 'matrix__cell--selected',
                      same && 'matrix__cell--diag'
                    ]
                      .filter(Boolean)
                      .join(' ')
                    return (
                      <td key={col.id}>
                        <button
                          className={cls}
                          onClick={() => {
                            if (!same) onSelectPair([i, j])
                          }}
                        >
                          <span className="matrix__de">{same ? '—' : fmt(d, 1)}</span>
                          <span className="matrix__cr" style={{ color: crColor(c) }}>
                            {same ? '' : `${fmt(c, 2)}:1`}
                          </span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr>
                <th></th>
                {colors.map((c) => (
                  <td className="matrix__col-name" key={c.id}>
                    {c.name}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="matrix-note">
            上段 = 色差 ΔE2000 / 下段 = コントラスト比。セルをクリックすると下に詳細が出ます。
          </p>
        </div>
      )}

      <div className="metrics">
        <div className="metric metric--pair">
          <div className="metric__swatches">
            <span className="metric__swatch" style={{ background: A.hex }} />
            <span className="metric__arrow">→</span>
            <span className="metric__swatch" style={{ background: B.hex }} />
          </div>
          <div className="metric__names">
            {A.name} と {B.name}
          </div>
        </div>

        <div className="metric">
          <span className="metric__label">色差 ΔE2000</span>
          <span className="metric__value">{fmt(de, 2)}</span>
          <span className="metric__verdict">{deVerdict(de)}</span>
          <span className="metric__sub">CIE76: {fmt(deltaE76(A.hex, B.hex), 2)}</span>
        </div>

        <div className="metric">
          <span className="metric__label">コントラスト比（WCAG 2.x）</span>
          <span className="metric__value">{fmt(cr, 2)}:1</span>
          <div className="metric__badges">
            {wcag.map((w) => (
              <span
                key={w.label}
                className={`wcag-badge ${w.ok ? 'wcag-badge--pass' : 'wcag-badge--fail'}`}
              >
                {w.label} {w.ok ? '合格' : '不合格'}
              </span>
            ))}
          </div>
        </div>

        <div className="metric">
          <span className="metric__label">成分の差</span>
          <div className="metric__diff-row">
            <span className="metric__diff-label">明度差 ΔL</span>
            <span className="metric__diff-value">{fmt(Math.abs(la[0] - lb[0]), 1)}</span>
          </div>
          <div className="metric__diff-row">
            <span className="metric__diff-label">彩度差 ΔC</span>
            <span className="metric__diff-value">{fmt(Math.abs(la[1] - lb[1]), 1)}</span>
          </div>
          <div className="metric__diff-row">
            <span className="metric__diff-label">色相差 ΔH</span>
            <span className="metric__diff-value">{fmt(dh, 1)}°</span>
          </div>
        </div>
      </div>

      <details className="glossary">
        <summary>用語について</summary>
        <div className="glossary__body">
          <div className="glossary__term">
            <h3 className="glossary__name">色差 ΔE2000（デルタイー）</h3>
            <p className="glossary__desc">
              2色が「どれくらい違って見えるか」を表す数値。大きいほど別の色に見えます。
            </p>
            <div className="glossary__scale">
              <span className="glossary__range">0 〜 1</span>
              <span>ほぼ同じ色に見える</span>
              <span className="glossary__range">1 〜 2</span>
              <span>よく見比べると分かる</span>
              <span className="glossary__range">2 〜 10</span>
              <span>はっきり違って見える</span>
              <span className="glossary__range">10 〜 50</span>
              <span>明確に別の色</span>
              <span className="glossary__range">50 〜</span>
              <span>まったく別の色</span>
            </div>
          </div>
          <div className="glossary__term">
            <h3 className="glossary__name">コントラスト比</h3>
            <p className="glossary__desc">
              文字色と背景色の明るさの差。1:1（差がない）から 21:1（白と黒）までの値で、
              大きいほど文字が読みやすくなります。
            </p>
            <p className="glossary__desc glossary__desc--spaced">
              合格判定の AA / AAA は、Webアクセシビリティの国際基準 WCAG が定める合格ライン。
              AA が実務上の標準、AAA はより厳しい上位基準です。
              「通常」は本文サイズの文字、「大」は見出しなど大きな文字（約24px以上）を指します。
            </p>
            <div className="glossary__scale">
              <span className="glossary__range">AA 通常</span>
              <span>4.5:1 以上 — 本文の文字に使える標準ライン</span>
              <span className="glossary__range">AA 大</span>
              <span>3:1 以上 — 大きな文字なら使えるライン</span>
              <span className="glossary__range">AAA 通常</span>
              <span>7:1 以上 — 本文の文字のより厳しい基準</span>
              <span className="glossary__range">AAA 大</span>
              <span>4.5:1 以上 — 大きな文字のより厳しい基準</span>
            </div>
          </div>
        </div>
      </details>
    </section>
  )
}
