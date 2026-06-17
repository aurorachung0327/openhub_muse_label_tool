import { useState, useEffect, useCallback } from 'react'
import TopBar from './components/TopBar'
import CameraCanvas from './components/CameraCanvas'
import ClusterCanvas from './components/ClusterCanvas'
import TrackCanvas from './components/TrackCanvas'
import StaticImage from './components/StaticImage'
import RightPanel from './components/RightPanel'
import Toast from './components/Toast'
import { getFileURL, padIndex } from './utils/fs'
import './App.css'

export default function App() {
  const [dirHandle,       setDirHandle]       = useState(null)
  const [jsonData,        setJsonData]        = useState({})
  const [frameKeys,       setFrameKeys]       = useState([])
  const [frameIdx,        setFrameIdx]        = useState(0)
  const [frameData,       setFrameData]       = useState(null)
  const [boxes,           setBoxes]           = useState([])
  const [clusters,        setClusters]        = useState([])
  const [trackHistories,  setTrackHistories]  = useState([])
  const [selectedBox,     setSelectedBox]     = useState(-1)
  const [selectedCluster, setSelectedCluster] = useState(-1)
  const [activeLabel,     setActiveLabel]     = useState('object')
  const [rdURL,           setRdURL]           = useState('')
  const [cameraURL,       setCameraURL]       = useState('')
  const [toast,           setToast]           = useState(null)
  const [logs,            setLogs]            = useState([])

  const addLog = (msg) => setLogs(prev => [...prev.slice(-99), msg])

  // ── Open folder ─────────────────────────────────────────────────────────
  const openFolder = async () => {
    try {
      const dh = await window.showDirectoryPicker({ mode: 'readwrite' })
      const jh = await dh.getFileHandle('yolo_tracking_data.json')
      const jf = await jh.getFile()
      const data = JSON.parse(await jf.text())
      const keys = Object.keys(data).sort()
      setDirHandle(dh)
      setJsonData(data)
      setFrameKeys(keys)
      setFrameIdx(0)
      addLog(`[System] Opened folder — ${keys.length} frames found`)
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Error: ' + e.message, true)
    }
  }

  // ── Load frame ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dirHandle || !frameKeys.length) return
    loadFrame()
  }, [frameIdx, dirHandle, frameKeys])

  const loadFrame = async () => {
    const key  = frameKeys[frameIdx]
    const data = jsonData[key]
    if (!data) return
    setFrameData(data)
    setBoxes(JSON.parse(JSON.stringify(data.detections      || [])))
    setClusters(JSON.parse(JSON.stringify(data.radar_clusters || [])))
    setTrackHistories(JSON.parse(JSON.stringify(data.track_histories || [])))
    setSelectedBox(-1)
    setSelectedCluster(-1)
    const fi = padIndex(data.frame_index)
    setRdURL(    await getFileURL(dirHandle, `rd/frame_${fi}_rd.jpeg`))
    setCameraURL(await getFileURL(dirHandle, `camera/frame_${fi}_camera.jpeg`))
    addLog(`[Frame ${fi}] Loaded`)
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!dirHandle || !frameData) return
    const key = frameKeys[frameIdx]
    const updated = {
      ...jsonData,
      [key]: { ...jsonData[key], detections: boxes, radar_clusters: clusters }
    }
    try {
      const fh = await dirHandle.getFileHandle('yolo_tracking_data.json', { create: true })
      const w  = await fh.createWritable()
      await w.write(JSON.stringify(updated, null, 2))
      await w.close()
      setJsonData(updated)
      showToast('Saved')
      addLog(`[Frame ${padIndex(frameData.frame_index)}] Saved`)
    } catch (e) {
      showToast('Save failed: ' + e.message, true)
      addLog(`[Error] Save failed: ${e.message}`)
    }
  }, [dirHandle, frameData, frameKeys, frameIdx, jsonData, boxes, clusters])

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); save(); return }
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowLeft')  gotoFrame(frameIdx - 1)
      if (e.key === 'ArrowRight') gotoFrame(frameIdx + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [frameIdx, save])

  const gotoFrame = (idx) => {
    if (!frameKeys.length) return
    setFrameIdx(Math.max(0, Math.min(frameKeys.length - 1, idx)))
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (msg, isError = false) => {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 1800)
  }

  // ── Cluster label click ──────────────────────────────────────────────────
  const handleClusterClick = (idx) => {
    setSelectedCluster(idx)
    setClusters(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], label: activeLabel }
      return next
    })
    addLog(`[Cluster ID ${clusters[idx]?.track_id}] Labeled as ${activeLabel}`)
  }

  // ── Progress ─────────────────────────────────────────────────────────────
  const labeledCount = frameKeys.filter(k =>
    jsonData[k]?.radar_clusters?.some(c => c.label)
  ).length

  return (
    <div className="app">
      <TopBar
        onOpen={openFolder}
        frameIdx={frameIdx}
        frameTotal={frameKeys.length}
        frameData={frameData}
        onPrev={() => gotoFrame(frameIdx - 1)}
        onNext={() => gotoFrame(frameIdx + 1)}
        labeled={labeledCount}
      />

      <div className="main-grid">
        {/* RD map — top left */}
        <div className="cell cell-rd">
          <div className="cell-title">Range-Doppler Map</div>
          <div className="cell-body">
            <StaticImage src={rdURL} alt="RD map" />
          </div>
        </div>

        {/* Camera — top right */}
        <div className="cell cell-camera">
          <div className="cell-title">Camera — draw or adjust boxes</div>
          <div className="cell-body">
            <CameraCanvas
              imageURL={cameraURL}
              boxes={boxes}
              setBoxes={setBoxes}
              selectedBox={selectedBox}
              setSelectedBox={setSelectedBox}
            />
          </div>
        </div>

        {/* Right panel — spans both rows */}
        <div className="cell cell-panel">
          <RightPanel
            boxes={boxes}
            setBoxes={setBoxes}
            selectedBox={selectedBox}
            setSelectedBox={setSelectedBox}
            clusters={clusters}
            selectedCluster={selectedCluster}
            activeLabel={activeLabel}
            setActiveLabel={setActiveLabel}
            onSave={save}
            logs={logs}
          />
        </div>

        {/* Track History — bottom left */}
        <div className="cell cell-track">
          <div className="cell-title">Track History</div>
          <div className="cell-body">
            <TrackCanvas trackHistories={trackHistories} />
          </div>
        </div>

        {/* Cluster — bottom right */}
        <div className="cell cell-cluster">
          <div className="cell-title">Radar Cluster — click ✕ to label</div>
          <div className="cell-body">
            <ClusterCanvas
              clusters={clusters}
              selectedCluster={selectedCluster}
              onClusterClick={handleClusterClick}
            />
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} isError={toast.isError} />}
    </div>
  )
}