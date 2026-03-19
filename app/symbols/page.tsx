'use client'

import { useEffect, useMemo, useState } from 'react'
import baseSymbols from '@/data/symbols.json'

type Entry = { name: string; aliases?: string[]; category?: string; meaning: string }

export default function SymbolsEditorPage() {
  const [custom, setCustom] = useState<Entry[]>([])
  const [filter, setFilter] = useState('')
  const [draft, setDraft] = useState<Entry>({ name: '', meaning: '' })

  useEffect(() => {
    const raw = localStorage.getItem('dreamscape_symbols_custom')
    setCustom(raw ? JSON.parse(raw) : [])
  }, [])

  const symbols = useMemo(() => {
    const all = [...(baseSymbols as Entry[]), ...custom]
    const f = filter.trim().toLowerCase()
    return f ? all.filter(s => s.name.toLowerCase().includes(f) || (s.aliases||[]).some(a => a.toLowerCase().includes(f))) : all
  }, [custom, filter])

  const saveLocal = (entries: Entry[]) => {
    setCustom(entries)
    localStorage.setItem('dreamscape_symbols_custom', JSON.stringify(entries))
  }

  const addOrUpdate = () => {
    if (!draft.name.trim() || !draft.meaning.trim()) return
    const name = draft.name.trim()
    const next = [...custom]
    const idx = next.findIndex(e => e.name.toLowerCase() === name.toLowerCase())
    if (idx >= 0) next[idx] = { ...draft, name }
    else next.push({ ...draft, name })
    saveLocal(next)
    setDraft({ name: '', meaning: '' })
  }

  const remove = (name: string) => {
    saveLocal(custom.filter(e => e.name.toLowerCase() !== name.toLowerCase()))
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(custom, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'symbols.custom.json'
    a.click()
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-6 space-y-4">
      <h1 className="text-2xl" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>Symbol Library</h1>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Curate bespoke meanings. Local edits are merged at run‑time with the built‑in set.
      </p>

      <div className="flex gap-2">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search" className="flex-1 rounded px-3 py-2 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        <button onClick={exportJson} className="px-3 py-2 rounded text-sm" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>Export</button>
      </div>

      <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
        <div className="grid gap-2">
          <input value={draft.name} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Name (e.g., Ladder)" className="rounded px-3 py-2 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <input value={(draft.aliases||[]).join(', ')} onChange={(e) => setDraft(d => ({ ...d, aliases: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="Aliases (comma‑separated)" className="rounded px-3 py-2 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <input value={draft.category || ''} onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))} placeholder="Category (optional)" className="rounded px-3 py-2 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <textarea value={draft.meaning} onChange={(e) => setDraft(d => ({ ...d, meaning: e.target.value }))} placeholder="Bespoke meaning (2–4 sentences)" rows={4} className="rounded px-3 py-2 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <div className="flex justify-end"><button onClick={addOrUpdate} className="px-3 py-1.5 rounded text-sm" style={{ background: 'var(--violet)', color: '#07070f' }}>Save</button></div>
        </div>
      </div>

      <div className="space-y-2">
        {symbols.map((s) => (
          <div key={s.name} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm" style={{ color: 'var(--text)' }}>{s.name}{s.category ? <span style={{ color: 'var(--muted)' }}> · {s.category}</span> : null}</div>
              {custom.some(c => c.name.toLowerCase() === s.name.toLowerCase()) && (
                <button onClick={() => remove(s.name)} className="text-xs px-2 py-0.5 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>Remove</button>
              )}
            </div>
            {s.aliases?.length ? <div className="text-[11px]" style={{ color: 'var(--muted)' }}>{s.aliases.join(', ')}</div> : null}
            <p className="text-sm mt-1" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>{s.meaning}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
        Supabase sync coming next (per‑account symbol sets). For now, your edits are local and exportable.
      </p>
    </div>
  )
}
