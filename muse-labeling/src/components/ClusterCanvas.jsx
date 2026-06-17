import { useRef, useEffect, useCallback } from 'react'

const TAB20 = [
  '#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c',
  '#98df8a','#d62728','#ff9896','#9467bd','#c5b0d5',
  '#8c564b','#c49c94','#e377c2','#f7b6d2','#7f7f7f',
  '#c7c7c7','#bcbd22','#dbdb8d','#17becf','#9edae5'
]
const LABEL_COLOR = { object:'#2ecc71', pair:'#f39c12', noise:'#7f8c8d' }

const VEL_MIN = -80, VEL_MAX = 80, RNG_MIN = 0, RNG_MAX = 70
const PAD = 32

export default function ClusterCanvas({ clusters, selectedCluster, onClusterClick }) {
  const canvasRef = useRef(null)

  const toCanvas = useCallback((vel, range, W, H) => {
    const x = PAD + (vel - VEL_MIN) / (VEL_MAX - VEL_MIN) * (W - 2*PAD)
    const y = H - PAD - (range - RNG_MIN) / (RNG_MAX - RNG_MIN) * (H - 2*PAD)
    return { x, y }
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    ctx.clearRect(0,0,W,H)
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0,0,W,H)

    // grid
    ctx.strokeStyle = '#1e2d3d'
    ctx.lineWidth = 0.5
    ctx.font = '9px Segoe UI'

    for (let v = -80; v <= 80; v += 20) {
      const { x } = toCanvas(v, 0, W, H)
      ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, H-PAD); ctx.stroke()
      ctx.fillStyle = '#555'; ctx.textAlign = 'center'
      ctx.fillText(v, x, H-PAD+12)
    }
    for (let r = 0; r <= 70; r += 10) {
      const { y } = toCanvas(0, r, W, H)
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W-PAD, y); ctx.stroke()
      ctx.fillStyle = '#555'; ctx.textAlign = 'right'
      ctx.fillText(r+'m', PAD-4, y+3)
    }

    // v=0 axis
    const { x:zx } = toCanvas(0, 0, W, H)
    ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(zx, PAD); ctx.lineTo(zx, H-PAD); ctx.stroke()

    // axis labels
    ctx.fillStyle = '#555'; ctx.font = '10px Segoe UI'
    ctx.textAlign = 'center'
    ctx.fillText('Velocity (km/h)', W/2, H-2)
    ctx.save(); ctx.translate(10, H/2); ctx.rotate(-Math.PI/2)
    ctx.fillText('Range (m)', 0, 0); ctx.restore()

    if (!clusters.length) return

    clusters.forEach((c, i) => {
      const color  = TAB20[(c.track_id >= 0 ? c.track_id : 19) % 20]
      const lcolor = c.label ? LABEL_COLOR[c.label] : null
      const isSel  = i === selectedCluster

      // points
      if (c.points) {
        c.points.forEach(p => {
          const { x, y } = toCanvas(p.velocity_kmh, p.range_m, W, H)
          ctx.fillStyle = color + '66'
          ctx.fillRect(x-2, y-2, 4, 4)
        })
      }

      // centroid X
      const { x:cx, y:cy } = toCanvas(c.centroid.velocity_kmh, c.centroid.range_m, W, H)
      const sz = isSel ? 9 : 6

      // label ring
      if (lcolor) {
        ctx.strokeStyle = lcolor
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(cx, cy, sz+5, 0, Math.PI*2); ctx.stroke()
      }

      // X marker
      ctx.strokeStyle = isSel ? '#e94560' : color
      ctx.lineWidth   = isSel ? 3 : 2
      ctx.beginPath()
      ctx.moveTo(cx-sz, cy-sz); ctx.lineTo(cx+sz, cy+sz)
      ctx.moveTo(cx+sz, cy-sz); ctx.lineTo(cx-sz, cy+sz)
      ctx.stroke()

      // ID label
      ctx.fillStyle = color; ctx.font = '9px Segoe UI'; ctx.textAlign = 'left'
      ctx.fillText(`ID ${c.track_id}`, cx+sz+3, cy+3)
      if (!c.is_confirmed) {
        ctx.fillStyle = '#555'
        ctx.fillText('unconfirmed', cx+sz+3, cy+13)
      }

      // label badge
      if (c.label) {
        ctx.fillStyle = lcolor; ctx.font = 'bold 8px Segoe UI'
        ctx.fillText(c.label.toUpperCase(), cx+sz+3, cy+22)
      }
    })
  }, [clusters, selectedCluster, toCanvas])

  // resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      render()
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [render])

  useEffect(() => { render() }, [render])

  const onClick = (e) => {
    if (!clusters.length) return
    const r  = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - r.left, my = e.clientY - r.top
    const W  = canvasRef.current.width, H = canvasRef.current.height
    let best = -1, bestD = 18
    clusters.forEach((c, i) => {
      const { x, y } = toCanvas(c.centroid.velocity_kmh, c.centroid.range_m, W, H)
      const d = Math.hypot(mx-x, my-y)
      if (d < bestD) { bestD = d; best = i }
    })
    if (best >= 0) onClusterClick(best)
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', cursor:'pointer' }}
      onClick={onClick}
    />
  )
}
