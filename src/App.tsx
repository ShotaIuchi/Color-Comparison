import { useCallback, useEffect, useRef, useState } from 'react'
import { hslToRgb, parseColor, rgbToHex } from './color'
import {
  loadInitial,
  persist,
  serialize,
  type AppState,
  type PageKey,
  type PartKey,
  type ThemeKey
} from './state'
import { Header } from './components/Header'
import { ColorListPanel } from './components/ColorListPanel'
import { QuantSection } from './components/QuantSection'
import { ValuesSection } from './components/ValuesSection'
import { PreviewSection } from './components/PreviewSection'

export default function App() {
  const [state, setState] = useState<AppState>(loadInitial)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    persist(state)
  }, [state])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 1800)
  }, [])

  const copy = useCallback(
    (text: string, label: string) => {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast(`${label} をコピーしました`))
        .catch(() => showToast('コピーできませんでした'))
    },
    [showToast]
  )

  const updateColor = (i: number, patch: Partial<AppState['colors'][number]>) => {
    setState((s) => ({
      ...s,
      colors: s.colors.map((c, j) => (j === i ? { ...c, ...patch } : c))
    }))
  }

  const commitText = (i: number, text: string) => {
    const parsed = parseColor(text)
    setState((s) => ({
      ...s,
      colors: s.colors.map((c, j) =>
        j === i ? (parsed ? { ...c, hex: parsed, text: parsed } : { ...c, text: c.hex }) : c
      )
    }))
  }

  const moveColor = (i: number, dir: -1 | 1) => {
    setState((s) => {
      const j = i + dir
      if (j < 0 || j >= s.colors.length) return s
      const colors = s.colors.slice()
      ;[colors[i], colors[j]] = [colors[j], colors[i]]
      return { ...s, colors }
    })
  }

  const removeColor = (i: number) => {
    setState((s) => {
      if (s.colors.length <= 2) return s
      const colors = s.colors.filter((_, j) => j !== i)
      const pair = s.pair.map((k) => Math.min(k, colors.length - 1)) as [number, number]
      if (pair[0] === pair[1]) pair[1] = (pair[0] + 1) % colors.length
      return { ...s, colors, pair }
    })
  }

  const addColor = () => {
    setState((s) => {
      // 追加のたびに色相を 67° ずつ回して、かぶりにくい初期色を与える
      const [r, g, b] = hslToRgb((s.seq * 67) % 360, 62, 55)
      const hex = rgbToHex(r, g, b)
      return {
        ...s,
        colors: [...s.colors, { id: s.seq, name: `色 ${s.colors.length + 1}`, hex, text: hex }],
        seq: s.seq + 1
      }
    })
  }

  const setPart = (part: PartKey) => setState((s) => ({ ...s, part }))
  const setPage = (page: PageKey) => setState((s) => ({ ...s, page }))
  const setTheme = (theme: ThemeKey) => setState((s) => ({ ...s, theme }))
  const setPair = (pair: [number, number]) => setState((s) => ({ ...s, pair }))

  const share = () => {
    copy(`${location.origin}${location.pathname}?${serialize(state)}`, '共有URL')
  }

  return (
    <div className="app">
      <Header onShare={share} />
      <div className="layout">
        <ColorListPanel
          colors={state.colors}
          onPick={(i, hex) => updateColor(i, { hex, text: hex })}
          onName={(i, name) => updateColor(i, { name })}
          onTextChange={(i, text) => updateColor(i, { text })}
          onTextCommit={commitText}
          onUp={(i) => moveColor(i, -1)}
          onDown={(i) => moveColor(i, 1)}
          onRemove={removeColor}
          onAdd={addColor}
        />
        <main className="main">
          <QuantSection colors={state.colors} pair={state.pair} onSelectPair={setPair} />
          <ValuesSection colors={state.colors} onCopy={copy} />
          <PreviewSection
            colors={state.colors}
            part={state.part}
            page={state.page}
            theme={state.theme}
            onPart={setPart}
            onPage={setPage}
            onTheme={setTheme}
          />
        </main>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
