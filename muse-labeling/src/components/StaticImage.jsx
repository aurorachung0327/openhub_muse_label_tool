export function StaticImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        // objectFit: 'fill',
        display: 'block',
      }}
    />
  )
}

export default StaticImage
