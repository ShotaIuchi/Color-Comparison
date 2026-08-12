interface Props {
  onShare: () => void
}

export function Header({ onShare }: Props) {
  return (
    <header className="header">
      <div className="header__brand">
        <h1 className="header__title">カラー比較</h1>
        <span className="header__tagline">色を並べて、数値と見た目で比べる</span>
      </div>
      <div className="header__controls">
        <button className="share-btn" onClick={onShare}>
          共有URLをコピー
        </button>
      </div>
    </header>
  )
}
