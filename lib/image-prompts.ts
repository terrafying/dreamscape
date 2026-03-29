import type { DreamLog, VisionExtraction } from '@/lib/types'

interface CardOptions {
  dreams: DreamLog[]
  storyTitle?: string
  subtitle?: string
}

function buildSharedArtDirection(mood: string, extra = ''): string {
  return [
    `Style: dark atmospheric fantasy illustration with a ceremonial, tarot-card sensibility. ${mood}.`,
    'Deep indigo and midnight blue dominate. Luminescent gold, violet, and silver accents. Ethereal mist. Stars.',
    'Details: fine art illustration, cinematic composition, hyper-detailed, ethereal lighting, dreamlike atmosphere.',
    'Wide border with subtle sacred geometry in silver. The composition is centered, balanced, and iconic.',
    extra,
  ].filter(Boolean).join(' ')
}

export function buildDreamCardPrompt(opts: CardOptions): { prompt: string; title: string } {
  const recent = opts.dreams.slice(0, 3)
  const dominantSymbol = recent[0]?.extraction?.symbols?.[0]?.name ?? 'moon'
  const setting = recent[0]?.extraction?.setting?.type ?? 'vast open spaces'
  const tone = recent[0]?.extraction?.tone ?? 'mysterious and contemplative'
  const arc = recent[0]?.extraction?.narrative_arc ?? 'liminal'
  const emotion = recent[0]?.extraction?.emotions?.[0]?.name ?? 'wonder'
  const subtitle = opts.subtitle ?? ''
  const titleText = opts.storyTitle || (arc === 'ascending' ? 'The Ascent' : arc === 'descending' ? 'The Descent' : arc === 'cyclical' ? 'The Return' : arc === 'liminal' ? 'The Threshold' : 'The Dream')

  const symbolDescs: Record<string, string> = {
    Library: 'an ancient floating library of silver and obsidian books, moonlight streaming through stained glass windows',
    'Glass City': 'a city of translucent glass towers reflecting a violet twilight sky',
    'Childhood Home': 'a vast familiar house with rooms that extend into forest and sky',
    'Deep Ocean': 'an ocean of liquid starlight, luminous creatures drifting in crystalline depths',
    Maze: 'a labyrinth of living hedges in perpetual golden-hour light, paths rearranging slowly',
    Snake: 'a serpent of liquid gold coiled beneath a sacred fig tree, light radiating from within',
    Flight: 'wings of light soaring over a dreamlike cityscape, shadows far below',
    Concert: 'a concert hall of light where music is visible as color and shape',
    default: `a single ${dominantSymbol.toLowerCase()} glowing with ethereal light in a cosmic landscape`,
  }

  const symbolDesc = symbolDescs[dominantSymbol] || symbolDescs.default

  const sceneMap: Record<string, string> = {
    Interior: 'inside a grand dreamlike chamber',
    Aerial: 'floating in a vast dream sky above clouds',
    Oceanic: 'at the surface of an infinite dream ocean',
    Domestic: 'in a home that opens into impossible landscapes',
    Labyrinth: 'within a shifting eternal space',
    default: `in ${setting.toLowerCase()}`,
  }
  const scene = sceneMap[setting] || sceneMap.default

  const titleLine = subtitle ? '' : `Title rendered in ornate calligraphy at the bottom: "${titleText}"`
  const subtitleLine = subtitle ? ` Subtitle rendered in delicate italic script: "${subtitle}"` : ''

  return {
    title: titleText,
    prompt: [
      `A single tarot card illustration. ${symbolDesc}, ${scene}.`,
      titleLine + subtitleLine,
      buildSharedArtDirection(`The ${emotion.toLowerCase()} mood is palpable - ${tone}.`),
    ].filter(Boolean).join(' '),
  }
}

export function buildStoryCardPrompt(opts: CardOptions): { prompt: string; title: string } {
  const titleText = opts.storyTitle || 'Sleep Story'
  const subtitle = opts.subtitle ?? ''
  const titleLine = subtitle ? '' : `Title rendered in ornate calligraphy at the bottom: "${titleText}"`
  const subtitleLine = subtitle ? ` Subtitle rendered in delicate italic script: "${subtitle}"` : ''

  return {
    title: titleText,
    prompt: [
      'A single tarot card illustration. A serene dreamer floats in a cosmic sleep between two worlds - below, a dark peaceful earth with distant city lights; above, a violet starfield with a luminous path.',
      titleLine + subtitleLine,
      buildSharedArtDirection('Peaceful, contemplative, liminal mood.'),
    ].filter(Boolean).join(' '),
  }
}

function describeSigil(extraction: VisionExtraction): string {
  const recipe = extraction.sigil_recipe
  const letters = recipe.glyph_letters.slice(0, 6).join(' ')
  const borderMode = recipe.style.border_mode === 'none' ? 'open aura' : recipe.style.border_mode.replace('-', ' ')
  return [
    'Integrate the sigil as an elegant ceremonial seal that feels truly embedded in the artwork, not pasted on top.',
    `The sigil is built from the glyph letters ${letters || 'V S N'}, with ${recipe.geometry.symmetry}-fold symmetry, ${recipe.geometry.rings} concentric rings, ${recipe.geometry.spokes} radiating spokes, and a ${borderMode}.`,
    'Render it as luminous etched gold and violet geometry within the environment: on glass, smoke, halo light, floor inlay, mirror reflection, or celestial diagram.',
    'Do not include readable alphabetic text inside the sigil.',
  ].join(' ')
}

export function buildVisionBoardPrompt(extraction: VisionExtraction): string {
  const motifLine = extraction.visual_motifs.length > 0
    ? extraction.visual_motifs.slice(0, 5).join(', ')
    : 'altar cloth, candle glow, sacred geometry'
  const paletteLine = extraction.color_palette.length > 0
    ? extraction.color_palette.join(', ')
    : extraction.sigil_recipe.style.palette.join(', ')
  const symbols = extraction.symbols.slice(0, 4).map((symbol) => symbol.name).join(', ')
  const emotionalTone = extraction.emotions.slice(0, 3).map((emotion) => emotion.name).join(', ') || 'hopeful, ceremonial, magnetic'

  return [
    `Create a single ceremonial vision card illustration for "${extraction.title}".`,
    `The future-facing intention is: ${extraction.distilled_intention || extraction.invocation}.`,
    `Scene motifs: ${motifLine}. Supporting symbols: ${symbols || 'candles, moonlight, threshold, altar'}.`,
    `Color palette: ${paletteLine}. Emotional tone: ${emotionalTone}.`,
    describeSigil(extraction),
    buildSharedArtDirection(
      'Hopeful, mystical, embodied, and aspirational.',
      'No readable text. The image should feel shareable, iconic, and poster-worthy.'
    ),
  ].join(' ')
}
