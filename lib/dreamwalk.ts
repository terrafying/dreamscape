export function generateDreamwalkCoordinates(
  lat: number,
  lng: number,
  radiusMeters: number,
  entropyBytes: number[]
): { lat: number; lng: number } {
  // We need 18 bytes of entropy. If less, we pad with Math.random() fallback.
  const bytes = [...entropyBytes]
  while (bytes.length < 18) {
    bytes.push(Math.floor(Math.random() * 256))
  }

  // Convert the first 9 bytes into a uniform float [0, 1)
  const u = bytes.slice(0, 9).reduce((acc, b, i) => acc + b / Math.pow(256, i + 1), 0)
  // Convert the next 9 bytes into another uniform float [0, 1)
  const v = bytes.slice(9, 18).reduce((acc, b, i) => acc + b / Math.pow(256, i + 1), 0)

  // Use a square root for uniform distribution in the circle
  const r = (radiusMeters / 111300) * Math.sqrt(u) // One degree is roughly 111.3km
  const t = 2 * Math.PI * v

  const dy = r * Math.cos(t)
  const dx = r * Math.sin(t)
  
  // Adjust longitude for the shrinking distance between meridians as latitude increases
  const newLng = lng + dx / Math.cos(lat * (Math.PI / 180))
  const newLat = lat + dy

  return { lat: newLat, lng: newLng }
}
