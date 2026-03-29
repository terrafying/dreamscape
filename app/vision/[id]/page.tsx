import type { Metadata } from 'next'
import { getSupabase } from '@/lib/supabaseClient'
import { SITE_URL } from '@/lib/site'
import VisionDetailClient from '@/components/VisionDetailClient'

type VisionRow = {
  title: string
  distilled_intention: string
  board_image_url?: string
  share_handle: string
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = getSupabase()
  if (!supabase) return {}
  const { data } = await supabase
    .from('shared_visions')
    .select('title, distilled_intention, board_image_url, share_handle')
    .eq('id', params.id)
    .single() as { data: VisionRow | null }

  const title = data?.title || 'Vision Ritual'
  const description = data?.distilled_intention || 'A future-facing sigil ritual from Dreamscape.'
  const image = data?.board_image_url || `${SITE_URL}/og.png`

  return {
    title: `${title} · Dreamscape Vision Ritual`,
    description,
    openGraph: {
      title: `${title} · Dreamscape`,
      description,
      images: [image],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · Dreamscape`,
      description,
      images: [image],
    },
  }
}

export default function VisionDetailPage({ params }: { params: { id: string } }) {
  return <VisionDetailClient visionId={params.id} />
}
