import { Resend } from 'resend'
import { selectAstrologicalNote } from '@/lib/spiritual-content'
import type { DreamLog, DreamExtraction } from '@/lib/types'

const resend = new Resend(process.env.RESEND_API_KEY)

type WeeklyDigestData = {
  dreams: DreamLog[]
  userName?: string
  moonSign?: string
  weekLabel: string
}

type Arc = DreamExtraction['narrative_arc']

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getTopSymbols(dreams: DreamLog[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>()

  for (const dream of dreams) {
    const symbols = dream.extraction?.symbols ?? []
    for (const symbol of symbols) {
      const key = symbol.name.trim()
      if (!key) continue
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

function getArcDistribution(dreams: DreamLog[]): Array<{ arc: Arc; count: number }> {
  const counts = new Map<Arc, number>()

  for (const dream of dreams) {
    const arc = dream.extraction?.narrative_arc
    if (!arc) continue
    counts.set(arc, (counts.get(arc) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([arc, count]) => ({ arc, count }))
    .sort((a, b) => b.count - a.count)
}

function getDominantArc(dreams: DreamLog[]): Arc {
  const dist = getArcDistribution(dreams)
  return dist[0]?.arc ?? 'liminal'
}

function getWeeklySynthesis(dreams: DreamLog[], symbols: Array<{ name: string; count: number }>): string {
  const arcs = getArcDistribution(dreams)
  const dominantArc = arcs[0]?.arc ?? 'liminal'
  const topSymbolText = symbols.slice(0, 2).map((s) => s.name).join(' and ')

  const arcLine: Record<Arc, string> = {
    ascending: 'Your week carried an ascending movement toward clarity, momentum, and emergence.',
    descending: 'Your week moved through a descending phase of release, integration, and inward repair.',
    cyclical: 'Your dreams traced a cyclical pattern, returning to core themes with deeper layers each time.',
    fragmented: 'Your week showed a fragmented but meaningful collage, with insight appearing in flashes.',
    liminal: 'Your dreamscape held a liminal threshold quality, suggesting you are between identities or phases.',
  }

  const symbolLine = topSymbolText
    ? `Recurring symbols like ${topSymbolText} suggest your psyche is emphasizing a focused thread rather than random noise.`
    : 'Even without repeated symbols, the emotional atmosphere suggests a coherent process of change unfolding.'

  return `${arcLine[dominantArc]} ${symbolLine}`
}

export async function sendWeeklyDigest(to: string, data: WeeklyDigestData) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY')
  }

  const userName = data.userName?.trim() || 'Dreamer'
  const dreamCount = data.dreams.length
  const topSymbols = getTopSymbols(data.dreams)
  const arcDistribution = getArcDistribution(data.dreams)
  const dominantArc = getDominantArc(data.dreams)
  const synthesis = getWeeklySynthesis(data.dreams, topSymbols)
  const moonSign = data.moonSign?.trim() || data.dreams.find((d) => d.extraction?.astro_context?.moon_sign)?.extraction?.astro_context?.moon_sign || ''
  const celestialNote = moonSign ? selectAstrologicalNote(moonSign, dominantArc) : ''
  const accountUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dreamscape.quest'}/account?tab=notifications`

  const symbolsHtml =
    topSymbols.length > 0
      ? `<ul style="margin:8px 0 0;padding-left:20px;color:#ddd6fe;">${topSymbols
          .map(
            (symbol) =>
              `<li style="margin-bottom:6px;"><span style="color:#f5f3ff;">${escapeHtml(symbol.name)}</span> <span style="color:#a1a1aa;">× ${symbol.count}</span></li>`
          )
          .join('')}</ul>`
      : `<p style="margin:8px 0 0;color:#a1a1aa;">No major repeated symbols this week — your dream field was varied.</p>`

  const arcHtml =
    arcDistribution.length > 0
      ? `<ul style="margin:8px 0 0;padding-left:20px;color:#ddd6fe;">${arcDistribution
          .map(
            ({ arc, count }) =>
              `<li style="margin-bottom:6px;"><span style="color:#f5f3ff;text-transform:capitalize;">${escapeHtml(arc)}</span> <span style="color:#a1a1aa;">${count}</span></li>`
          )
          .join('')}</ul>`
      : `<p style="margin:8px 0 0;color:#a1a1aa;">Not enough extraction data yet for arc distribution.</p>`

  const html = `
  <div style="background:#0c0c18;padding:40px 20px;font-family:Georgia, 'Times New Roman', serif;color:#f5f3ff;line-height:1.65;">
    <div style="max-width:680px;margin:0 auto;background:linear-gradient(180deg,#131328 0%,#0f1020 100%);border:1px solid #312e81;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.45);">
      <div style="padding:28px 28px 20px;border-bottom:1px solid #27274b;">
        <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;color:#a78bfa;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Weekly Dream Letter</div>
        <h1 style="margin:8px 0 0;font-size:30px;font-weight:500;color:#ede9fe;">Your Dream Letter — ${escapeHtml(data.weekLabel)}</h1>
      </div>

      <div style="padding:26px 28px 30px;">
        <p style="margin:0 0 16px;font-size:17px;">Dear ${escapeHtml(userName)},</p>
        <p style="margin:0 0 20px;color:#ddd6fe;">This week you recorded <strong style="color:#c4b5fd;">${dreamCount}</strong> dream${dreamCount === 1 ? '' : 's'}. Your unconscious has been speaking in symbols, rhythm, and repeating motifs — here is what it emphasized.</p>

        <div style="margin:18px 0;padding:16px;border:1px solid #2e2a64;border-radius:12px;background:#111126;">
          <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8b80db;">Top Symbols</div>
          ${symbolsHtml}
        </div>

        <div style="margin:18px 0;padding:16px;border:1px solid #2e2a64;border-radius:12px;background:#111126;">
          <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8b80db;">Narrative Arc Distribution</div>
          ${arcHtml}
        </div>

        <div style="margin:18px 0;padding:18px;border-radius:12px;background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.35);">
          <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#b9a8ff;">Weekly Synthesis</div>
          <p style="margin:10px 0 0;color:#e9ddff;">${escapeHtml(synthesis)}</p>
        </div>

        ${
          celestialNote
            ? `<div style="margin:18px 0 0;padding:18px;border-radius:12px;background:rgba(76,29,149,0.35);border:1px solid rgba(167,139,250,0.45);">
          <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#c4b5fd;">Celestial Note — Moon in ${escapeHtml(moonSign)}</div>
          <p style="margin:10px 0 0;color:#ede9fe;">${escapeHtml(celestialNote)}</p>
        </div>`
            : ''
        }

        <p style="margin:24px 0 0;color:#cfc3ff;">Until next week, keep recording what the night reveals.</p>
      </div>

      <div style="padding:18px 28px;border-top:1px solid #27274b;background:#0b0b17;">
        <p style="margin:0;font-size:12px;color:#8b8b9d;">
          You’re receiving this because weekly dream letters are enabled.
          <a href="${escapeHtml(accountUrl)}" style="color:#a78bfa;text-decoration:underline;">Manage notifications / unsubscribe</a>
        </p>
      </div>
    </div>
  </div>`

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'dreams@dreamscape.quest',
    to,
    subject: `Your Dream Letter — ${data.weekLabel}`,
    html,
  })
}
