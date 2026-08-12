import type { ColorEntry } from '../state'

interface Props {
  colors: ColorEntry[]
  onPick: (i: number, hex: string) => void
  onName: (i: number, name: string) => void
  onTextChange: (i: number, text: string) => void
  onTextCommit: (i: number, text: string) => void
  onUp: (i: number) => void
  onDown: (i: number) => void
  onRemove: (i: number) => void
  onAdd: () => void
}

export function ColorListPanel(props: Props) {
  const { colors } = props
  return (
    <aside className="aside">
      <div className="aside__head">
        <h2 className="aside__title">色リスト</h2>
        <span className="aside__count">{colors.length} 色</span>
      </div>

      {colors.map((c, i) => (
        <div className="color-item" key={c.id}>
          <div className="color-item__row">
            <label className="color-item__swatch">
              <span className="color-item__swatch-fill" style={{ background: c.hex }} />
              <input
                className="color-item__picker"
                type="color"
                value={c.hex}
                onInput={(e) => props.onPick(i, e.currentTarget.value)}
              />
            </label>
            <div className="color-item__fields">
              <input
                className="color-item__name"
                value={c.name}
                placeholder="名前"
                onChange={(e) => props.onName(i, e.target.value)}
              />
              <input
                className="color-item__text"
                value={c.text}
                spellCheck={false}
                onChange={(e) => props.onTextChange(i, e.target.value)}
                onBlur={(e) => props.onTextCommit(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') props.onTextCommit(i, e.currentTarget.value)
                }}
              />
            </div>
          </div>
          <div className="color-item__btns">
            <button className="color-item__btn" title="上へ" onClick={() => props.onUp(i)}>
              ↑
            </button>
            <button className="color-item__btn" title="下へ" onClick={() => props.onDown(i)}>
              ↓
            </button>
            <button
              className="color-item__btn color-item__btn--danger"
              title="削除"
              onClick={() => props.onRemove(i)}
            >
              ×
            </button>
          </div>
        </div>
      ))}

      <button className="add-btn" onClick={props.onAdd}>
        ＋ 色を追加
      </button>
      <p className="aside__hint">HEX / rgb() / hsl() を入力できます。</p>
    </aside>
  )
}
