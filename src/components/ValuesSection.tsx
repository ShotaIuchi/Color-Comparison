import { fmt, hexToRgb, lab, lch, luminance, oklch, onColor, rgbToHsl } from '../color'
import type { ColorEntry } from '../state'

interface Props {
  colors: ColorEntry[]
  onCopy: (text: string, label: string) => void
}

function valueRows(hex: string): Array<[string, string]> {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2])
  const l = lab(hex)
  const c = lch(hex)
  const o = oklch(hex)
  return [
    ['HEX', hex.toUpperCase()],
    ['RGB', `rgb(${rgb.join(' ')})`],
    ['HSL', `hsl(${fmt(hsl[0], 0)} ${fmt(hsl[1], 0)}% ${fmt(hsl[2], 0)}%)`],
    ['Lab', `lab(${fmt(l[0], 1)} ${fmt(l[1], 1)} ${fmt(l[2], 1)})`],
    ['LCH', `lch(${fmt(c[0], 1)} ${fmt(c[1], 1)} ${fmt(c[2], 1)})`],
    ['OKLCH', `oklch(${fmt(o[0], 3)} ${fmt(o[1], 3)} ${fmt(o[2], 1)})`],
    ['相対輝度', fmt(luminance(hex), 4)]
  ]
}

export function ValuesSection({ colors, onCopy }: Props) {
  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">色の値</h2>
      </div>
      <div className="values-grid">
        {colors.map((c) => {
          return (
            <div className="value-card" key={c.id}>
              <div className="value-card__head" style={{ background: c.hex }}>
                <span className="value-card__name" style={{ color: onColor(c.hex) }}>
                  {c.name}
                </span>
              </div>
              <div className="value-card__rows">
                {valueRows(c.hex).map(([label, text]) => (
                  <button
                    key={label}
                    className="value-row"
                    title="クリックでコピー"
                    onClick={() => onCopy(text, label)}
                  >
                    <span className="value-row__label">{label}</span>
                    <span className="value-row__text">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
