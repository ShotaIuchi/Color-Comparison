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
        <p>
          ΔE（デルタイー）は2色の「見た目の違い」を数値にしたものです。おおよそ 1
          未満は見分けがつかず、2〜10 で違いがはっきりし、50
          を超えるとまったく別の色に見えます。コントラスト比は文字の読みやすさの指標で、通常サイズの文字は
          4.5 以上（AA）、大きな文字は 3 以上あれば読みやすいとされています。
        </p>
      </details>
    </section>
  )
}
