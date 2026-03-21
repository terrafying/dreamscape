// 31-EDO microtonal tuning library
// Based on f(step) = f_ref × 2^(step/31)

export const F_REF_A3 = 220
export const F_REF_C4 = 261.63

export type TuningMode = '12tet' | '31edo'
export type RefFreq = 220 | 261.63
export type ScaleSet = 'neutral' | 'teleology' | 'diatonic31'

// ─── Core math ────────────────────────────────────────────────────────────────

export function stepToHz(step: number, fRef: number): number {
  return fRef * Math.pow(2, step / 31)
}

export function hzToStep(hz: number, fRef: number): number {
  return 31 * Math.log2(hz / fRef)
}

export function closestStep(hz: number, fRef: number): number {
  return Math.round(hzToStep(hz, fRef))
}

export function quantizeFreq(hz: number, fRef: number): number {
  return stepToHz(closestStep(hz, fRef), fRef)
}

export function stepToCents(step: number): number {
  return (step / 31) * 1200
}

export function centsBetween(aHz: number, bHz: number): number {
  return 1200 * Math.log2(bHz / aHz)
}

// ─── 31-EDO Scale sets ───────────────────────────────────────────────────────

// All 31 steps of an octave, rounded to 2 decimal places
export const EDO31_SCALE: number[] = Array.from({ length: 32 }, (_, i) =>
  parseFloat((F_REF_A3 * Math.pow(2, i / 31)).toFixed(2))
)

export const EDO31_SCALE_C4: number[] = Array.from({ length: 32 }, (_, i) =>
  parseFloat((F_REF_C4 * Math.pow(2, i / 31)).toFixed(2))
)

// Symmetric teleology: 0, ±5, ±10, ±15, ±20, ±25 — maximally consonant guidance tones
// Step 0  = f_ref (unison)
// Step 5  ≈ 193.2 cents — perfect fourth
// Step 10 ≈ 387.1 cents — neutral third approximation
// Step 15 = 580.6 cents — tritone
// Step 20 ≈ 774.2 cents — neutral sixth
// Step 25 ≈ 967.7 cents — octave below
// Step 26 ≈ 1007.7 cents — nearly just octave
export function teleologyScale(fRef: number): number[] {
  const steps = [0, 5, 10, 15, 20, 25, 26]
  // Mirror: add negative steps as octave above
  const neg = [-5, -10, -15, -20, -25, -26]
  const all = [...neg, ...steps]
  return all.map(s => stepToHz(s, fRef))
}

// Neutral stack: ±10 steps (387.1¢) and ±20 steps (774.2¢)
// These sound distinctly non-12TET — no 12TET equivalent close to them
export function neutralStack(fRef: number): number[] {
  const steps = [0, 10, 20]
  const neg = [-10, -20]
  const all = [...neg, ...steps]
  return all.map(s => stepToHz(s, fRef))
}

// Well-tempered diatonic approximation in 31-EDO
// Maps 7 degrees of western diatonic to closest 31-EDO steps
// Using just intonation ratios for the "ideal" intervals
const DIATONIC_RATIOS = [
  1,        // I    — C (unison)
  9/8,      // II   — D (major second)
  5/4,      // III  — E (major third)
  4/3,      // IV   — F (perfect fourth)
  3/2,      // V    — G (perfect fifth)
  5/3,      // VI   — A (major sixth)
  15/8,     // VII  — B (major seventh)
]

export function diatonic31(fRef: number): number[] {
  const base = DIATONIC_RATIOS.map(r => hzToStep(fRef * r, fRef))
  const snap = (s: number) => closestStep(stepToHz(s, fRef), fRef)
  const snapped = base.map(snap)
  // Add octave above and below
  const octaveDown = snapped.map(s => s - 31)
  const octaveUp = snapped.map(s => s + 31)
  return [...octaveDown, ...snapped, ...octaveUp].map(s => stepToHz(s, fRef))
}

// ─── Discovery chords ────────────────────────────────────────────────────────

// Stacked neutral thirds: 3 voices at ±10 and ±20 steps from root
// Sounds distinctly non-Western — no close 12TET equivalent
export function discoveryNeutralThirds(rootHz: number, fRef: number): number[] {
  const rootStep = closestStep(rootHz, fRef)
  return [rootStep - 20, rootStep, rootStep + 10, rootStep + 20].map(s => stepToHz(s, fRef))
}

// Stacked neutral sixths: root + ±20 steps — open, shimmering quality
export function discoveryNeutralSixths(rootHz: number, fRef: number): number[] {
  const rootStep = closestStep(rootHz, fRef)
  return [rootStep - 20, rootStep, rootStep + 20, rootStep + 31].map(s => stepToHz(s, fRef))
}

// Teleological completion chord: all teleology scale tones at octave
export function teleologyChord(rootHz: number, fRef: number): number[] {
  const rootStep = closestStep(rootHz, fRef)
  const teleSteps = [-26, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 26]
  return teleSteps.map(s => stepToHz(rootStep + s, fRef))
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function scaleSet(scale: ScaleSet, fRef: number): number[] {
  switch (scale) {
    case 'neutral':    return neutralStack(fRef)
    case 'teleology':  return teleologyScale(fRef)
    case 'diatonic31': return diatonic31(fRef)
    default:           return []
  }
}

// TuningMode-aware frequency conversion
export function toTuning(hz: number, mode: TuningMode, fRef: number): number {
  if (mode === '31edo') return quantizeFreq(hz, fRef)
  return hz // 12TET: return as-is
}

// Bearing alignment: how close is the player's angle to the optimal angle
// 0 = misaligned, 1 = perfectly aligned (step size = 0)
export function alignmentScore(angleDelta: number): number {
  const normalized = Math.abs(angleDelta) % (2 * Math.PI)
  const closest = Math.min(normalized, 2 * Math.PI - normalized)
  return Math.max(0, 1 - closest / Math.PI)
}
