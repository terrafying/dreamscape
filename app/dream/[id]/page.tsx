import { Metadata } from 'next'
import { getSupabase } from '@/lib/supabaseClient'
import { SITE_URL } from '@/lib/site'
import { DreamDetailClient } from '@/components/DreamDetailClient'

type DreamRow = {
  share_handle: string
  dream_data: unknown
  symbols: string[]
  created_at: string
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const supabase = getSupabase()
  if (!supabase) return {}

  const { data: dream } = await supabase
    .from('shared_dreams')
    .select('share_handle, dream_data, symbols')
    .eq('id', params.id)
    .single() as { data: DreamRow | null }

  const dreamData = dream?.dream_data as {
    transcript?: string
    extraction?: { symbols?: { name: string }[] }
  } | undefined
  const transcript = dreamData?.transcript ?? ''
  const handle = dream?.share_handle ?? 'dreamer'
  const symbols = (dreamData?.extraction?.symbols ?? []).map(s => s.name).slice(0, 3)
  const symbolStr = symbols.length > 0 ? ` · ${symbols.join(' · ')}` : ''

  return {
    title: `@${handle} shared a dream · Dreamscape`,
    description: `${transcript.slice(0, 160)}${transcript.length > 160 ? '…' : ''}${symbolStr}`,
    openGraph: {
      title: `A dream from @${handle}`,
      description: `${transcript.slice(0, 160)}${transcript.length > 160 ? '…' : ''}${symbolStr}`,
      images: [`${SITE_URL}/api/og/${params.id}`],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `A dream from @${handle} · Dreamscape`,
      description: `${transcript.slice(0, 160)}${transcript.length > 160 ? '…' : ''}`,
      images: [`${SITE_URL}/api/og/${params.id}`],
    },
  }
}

export default async function DreamDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return <DreamDetailClient dreamId={params.id} />
}
