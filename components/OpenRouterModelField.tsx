'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { DEFAULT_OPENROUTER_MODEL, RECOMMENDED_OPENROUTER_MODELS } from '@/lib/openrouterModels'

type OpenRouterModelFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  hint?: string
}

export default function OpenRouterModelField({
  value,
  onChange,
  label = 'OpenRouter model',
  hint = 'Type any model id or pick one of the current OpenRouter options.',
}: OpenRouterModelFieldProps) {
  const selectId = useId()
  const inputId = useId()
  const [models, setModels] = useState<string[]>([...RECOMMENDED_OPENROUTER_MODELS].slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const isCustomValue = Boolean(value.trim()) && !models.includes(value.trim())

  useEffect(() => {
    void loadModels()
  }, [])

  useEffect(() => {
    if (isCustomValue) setShowCustom(true)
  }, [isCustomValue])

  const selectedValue = useMemo(
    () => (showCustom || isCustomValue ? '__custom__' : value.trim() || DEFAULT_OPENROUTER_MODEL),
    [isCustomValue, showCustom, value],
  )

  const loadModels = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/openrouter/models', { cache: 'no-store' })
      const json = (await res.json()) as { models?: string[] }
      const next = Array.isArray(json.models) && json.models.length > 0
        ? json.models
        : [...RECOMMENDED_OPENROUTER_MODELS].slice(0, 10)
      setModels(Array.from(new Set(next)).slice(0, 10))
    } catch {
      setError('Using fallback model list.')
      setModels([...RECOMMENDED_OPENROUTER_MODELS].slice(0, 10))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="text-xs" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <select
        id={selectId}
        aria-label={label}
        value={selectedValue}
        onChange={(event) => {
          const next = event.target.value
          if (next === '__custom__') {
            setShowCustom(true)
            return
          }
          setShowCustom(false)
          onChange(next)
        }}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        {models.map((model) => (
          <option key={model} value={model}>{model}</option>
        ))}
        <option value="__custom__">Custom model…</option>
      </select>
      {(showCustom || isCustomValue) && (
        <input
          id={inputId}
          aria-label="Custom OpenRouter model"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={DEFAULT_OPENROUTER_MODEL}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      )}
      <div className="flex items-center justify-between gap-3 text-[11px]" style={{ color: 'var(--muted)' }}>
        <span>{loading ? 'Refreshing model list...' : `${models.length} recommended models`}</span>
        <button
          type="button"
          onClick={() => void loadModels()}
          className="rounded px-2 py-1 transition-opacity hover:opacity-80"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Refresh
        </button>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        {error || hint}
      </p>
    </div>
  )
}
