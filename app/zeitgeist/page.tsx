import ZeitgeistDashboard from '@/components/ZeitgeistDashboard'

export const metadata = {
  title: 'Collective Dream Zeitgeist | Dreamscape',
  description: 'See what humanity is dreaming right now',
}

export default function ZeitgeistPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8">
      <ZeitgeistDashboard />
    </div>
  )
}
