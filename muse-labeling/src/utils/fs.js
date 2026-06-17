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