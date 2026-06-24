export async function getFileURL(dirHandle, relativePath) {
  try {
    const parts = relativePath.split('/')
    let handle = dirHandle
    for (let i = 0; i < parts.length - 1; i++) {
      handle = await handle.getDirectoryHandle(parts[i])
    }
    const fh = await handle.getFileHandle(parts[parts.length - 1])
    return URL.createObjectURL(await fh.getFile())
  } catch {
    return ''
  }
}

export function padIndex(idx) {
  return String(idx).padStart(5, '0')
}

// Reads a file as a Float32Array (for the .raw RD-map matrices).
// .raw is written by process.py via rd_power.astype(np.float32).tofile(),
// so it's little-endian float32, row-major, 256x256 = 65536 values.
export async function getFileFloat32(dirHandle, relativePath) {
  try {
    const parts = relativePath.split('/')
    let handle = dirHandle
    for (let i = 0; i < parts.length - 1; i++) {
      handle = await handle.getDirectoryHandle(parts[i])
    }
    const fh = await handle.getFileHandle(parts[parts.length - 1])
    const buf = await (await fh.getFile()).arrayBuffer()
    return new Float32Array(buf)
  } catch {
    return null
  }
}