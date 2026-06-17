import { useEffect, useRef } from 'react'
import './RightPanel.css'

const LABELS = [
  { key:'object', icon:'🟢', text:'Object' },
  { key:'pair',   icon:'🟠', text:'Pair (ghost)' },
  { key:'noise',  icon:'⚫', text:'Noise' },
]

export default function RightPanel({
  boxes, setBoxes, selectedBox, setSelectedBox,
  clusters, selectedCluster,
  activeLabel, setActiveLabel,
  onSave, logs
}) {
  const logRef = useRef(null)
  const b = selectedBox >= 0 ? boxes[selectedBox] : null
  const c = selectedCluster >= 0 ? clusters[selectedCluster] : null

  // auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const setField = (field, val) => {
    if (selectedBox < 0) return
    setBoxes(prev => {
      const next = prev.map(b => ({...b, pos1:[...b.pos1], pos2:[...b.pos2]}))
      if (field === 'x1') next[selectedBox].pos1[0] = val
      if (field === 'y1') next[selectedBox].pos1[1] = val
      if (field === 'x2') next[selectedBox].pos2[0] = val
      if (field === 'y2') next[selectedBox].pos2[1] = val
      return next
    })
  }

  const nudge = (field, delta) => {
    if (!b) return
    const vals = { x1:b.pos1[0], y1:b.pos1[1], x2:b.pos2[0], y2:b.pos2[1] }
    setField(field, vals[field] + delta)
  }

  const deleteBox = () => {
    if (selectedBox < 0) return
    setBoxes(prev => prev.filter((_,i) => i !== selectedBox))
    setSelectedBox(-1)
  }

  return (
    <div className="panel">

      {/* Camera box editor */}
      <div className="panel-section">
        <div className="panel-title">CAMERA BOX</div>
        {b ? (
          <>
            <div className="box-info">{b.label} — track #{b.track_id}</div>
            {[
              ['x1', b.pos1[0]], ['y1', b.pos1[1]],
              ['x2', b.pos2[0]], ['y2', b.pos2[1]]
            ].map(([field, val]) => (
              <div className="coord-row" key={field}>
                <label>{field}</label>
                <button className="spin" onClick={() => nudge(field, -1)}>−</button>
                <input
                  type="number"
                  value={Math.round(val)}
                  onChange={e => setField(field, parseFloat(e.target.value))}
                />
                <button className="spin" onClick={() => nudge(field, 1)}>+</button>
              </div>
            ))}
            <button className="delete-btn" onClick={deleteBox}>🗑 Delete box</button>
          </>
        ) : (
          <div className="empty-hint">Click a box to select<br/>or drag to draw a new one</div>
        )}
      </div>

      {/* Cluster labeler */}
      <div className="panel-section">
        <div className="panel-title">RADAR CLUSTER</div>
        {c ? (
          <div className="box-info">
            ID {c.track_id} — {c.is_confirmed ? 'confirmed' : 'unconfirmed'}<br/>
            {c.label
              ? <span style={{color: labelColor(c.label)}}>▶ {c.label}</span>
              : 'unlabeled'}
          </div>
        ) : (
          <div className="empty-hint">Click a centroid (✕) to label</div>
        )}
        <div className="label-group">
          {LABELS.map(l => (
            <button
              key={l.key}
              className={`label-btn label-${l.key}${activeLabel === l.key ? ' active' : ''}`}
              onClick={() => setActiveLabel(l.key)}
            >
              {l.icon} {l.text}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="panel-section">
        <div className="panel-title">SAVE</div>
        <button className="save-btn" onClick={onSave}>💾 Save</button>
        <div className="hint">
          <kbd>Ctrl+S</kbd> save &nbsp;·&nbsp; <kbd>←→</kbd> navigate &nbsp;·&nbsp; <kbd>Del</kbd> delete box
        </div>
      </div>

      {/* Terminal log */}
      <div className="panel-section panel-log-section">
        <div className="panel-title">LOG</div>
        <div className="log-box" ref={logRef}>
          {logs.length === 0
            ? <span className="log-empty">No activity yet</span>
            : logs.map((l, i) => <div key={i} className="log-line">{l}</div>)
          }
        </div>
      </div>

    </div>
  )
}

function labelColor(label) {
  return { object:'#2ecc71', pair:'#f39c12', noise:'#7f8c8d' }[label] || '#aaa'
}