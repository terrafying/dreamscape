/**
 * 4D Game Module
 * Central export point for all 4D visualization and interaction systems
 */

// Hyperspace adapter (projection methods)
export * from './hyperspace-adapter'
export type { Hyperspace4DPoint, ProjectionConfig, ProjectionMethod } from './hyperspace-adapter'

// Clifford algebra (rotations)
export * from './clifford-algebra'
export type { Rotor } from './clifford-algebra'

// Polytopes (geometry definitions)
export * from './polytopes'
export type { Polytope } from './polytopes'

// Re-export commonly used functions
export {
  project4Dto3D,
  normalize4D,
  distance4D,
  lerp4D,
  getColorFrom4D,
} from './hyperspace-adapter'

export {
  createRotor,
  createMultiPlaneRotor,
  applyRotor,
  composeRotors,
  slerpRotor,
} from './clifford-algebra'

export {
  generateCliffordTorus,
  generateHopfFibration,
  generate5Cell,
  generateTesseract,
  generate24Cell,
  generate16Cell,
  getAllPolytopes,
} from './polytopes'
