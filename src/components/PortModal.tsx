import { useEffect, useMemo, useState } from 'react'
import type { ColorEntry } from '../state'
import {
  detectAndParse,
  exportColors,
  EXPORT_FORMATS,
  IMPORT_LIMIT,
  type ExportFormat,
  type PortEntry
} from '../portable'

export type PortTab = 'import' | 'export'

interface Props {
  colors: ColorEntry[]
  initialTab: PortTab
  onClose: () => void
  onImport: (entries: PortEntry[], mode: 'append' | 'replace') => void
  onCopy: (text: string, label: string) => void
}

const IMPORT_PLACEHOLDER = `色定義を貼り付けてください。形式は自動判別されます。

<color name="primary">#3563E9</color>
static let primary = Color(red: 53 / 255, green: 99 / 255, blue: 233 / 255)
--primary: #3563e9;
$primary: #3563e9;
{ "primary": "#3563e9" }
primary: #3563e9`

export function PortModal(props: Props) {
  const [tab, setTab] = useState<PortTab>(props.initialTab)
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'append' | 'replace'>('append')
  const [format, setFormat] = useState<ExportFormat>('android')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [props])

  const parsed = useMemo(() => detectAndParse(text), [text])
  const exported = useMemo(() => exportColors(props.colors, format), [props.colors, format])
  const fmtMeta = EXPORT_FORMATS.find((f) => f.key === format)!

  const readFile = (file: File | undefined) => {
    if (!file) return
    file.text().then(setText)
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([exported], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = fmtMeta.file
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="modal-overlay" onClick={props.onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="seg">
            <button
              className={'seg__btn' + (tab === 'import' ? ' seg__btn--active' : '')}
              onClick={() => setTab('import')}
            >
              インポート
            </button>
            <button
              className={'seg__btn' + (tab === 'export' ? ' seg__btn--active' : '')}
              onClick={() => setTab('export')}
            >
              エクスポート
            </button>
          </div>
          <button className="modal__close" title="閉じる" onClick={props.onClose}>
            ×
          </button>
        </div>

        {tab === 'import' ? (
          <div className="modal__body">
            <textarea
              className="modal__textarea"
              value={text}
              placeholder={IMPORT_PLACEHOLDER}
              spellCheck={false}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="modal__row">
              <label className="modal__file-btn">
                ファイルを開く
                <input
                  type="file"
                  accept=".xml,.json,.css,.scss,.swift,.txt,.kt"
                  hidden
                  onChange={(e) => {
                    readFile(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
              <span className="modal__status">
                {text.trim()
                  ? parsed
                    ? `${parsed.format} として ${parsed.entries.length} 色を検出`
                    : '色を検出できませんでした'
                  : `対応形式: Android XML / iOS Swift・Asset Catalog / CSS / SCSS / JSON（最大 ${IMPORT_LIMIT} 色）`}
              </span>
            </div>
            {parsed && (
              <div className="modal__preview">
                {parsed.entries.map((e, i) => (
                  <span className="modal__chip" key={i} title={`${e.name || '名前なし'} ${e.hex}`}>
                    <span className="modal__chip-fill" style={{ background: e.hex }} />
                    {e.name || e.hex}
                  </span>
                ))}
              </div>
            )}
            <div className="modal__row modal__row--end">
              <label className="modal__radio">
                <input
                  type="radio"
                  name="import-mode"
                  checked={mode === 'append'}
                  onChange={() => setMode('append')}
                />
                リストに追加
              </label>
              <label className="modal__radio">
                <input
                  type="radio"
                  name="import-mode"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                />
                リストを置き換え
              </label>
              <button
                className="modal__primary"
                disabled={!parsed}
                onClick={() => parsed && props.onImport(parsed.entries, mode)}
              >
                取り込む
              </button>
            </div>
          </div>
        ) : (
          <div className="modal__body">
            <div className="seg">
              {EXPORT_FORMATS.map((f) => (
                <button
                  key={f.key}
                  className={'seg__btn' + (format === f.key ? ' seg__btn--active' : '')}
                  onClick={() => setFormat(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <textarea className="modal__textarea modal__textarea--code" value={exported} readOnly />
            <div className="modal__row modal__row--end">
              <span className="modal__status">{fmtMeta.file}</span>
              <button className="modal__secondary" onClick={download}>
                ダウンロード
              </button>
              <button
                className="modal__primary"
                onClick={() => props.onCopy(exported, fmtMeta.label)}
              >
                コピー
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
