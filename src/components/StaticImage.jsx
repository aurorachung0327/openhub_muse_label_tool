export default function StaticImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',   // preserves the saved JPEG's original aspect ratio — never distort
        display: 'block',
      }}
    />
  )
}
