import './TopBar.css'

export default function TopBar({
  onOpen, frameIdx, frameTotal, frameData, onPrev, onNext, labeled
}) {
  const frameLabel = frameData
    ? `Frame ${String(frameData.frame_index).padStart(5,'0')} / ${frameTotal}`
    : 'No folder opened'

  return (
    <div className="topbar">
      <span className="topbar-title">MUSE Labeling Tool</span>
      <button className="tb-btn" onClick={onOpen}>📂 Open Folder</button>

      <div className="frame-nav">
        <button className="tb-btn" onClick={onPrev} disabled={!frameTotal || frameIdx === 0}>◀</button>
        <span className="frame-label">{frameLabel}</span>
        <button className="tb-btn" onClick={onNext} disabled={!frameTotal || frameIdx === frameTotal - 1}>▶</button>
      </div>

      {frameTotal > 0 && (
        <span className="progress-label">
          Labeled: {labeled} / {frameTotal}
        </span>
      )}
    </div>
  )
}
