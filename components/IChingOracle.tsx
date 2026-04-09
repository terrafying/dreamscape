'use client'

import { useState, useEffect } from 'react'
import { HEXAGRAMS, Hexagram } from '@/lib/iching'
import EntropyCollector from './EntropyCollector'

export default function IChingOracle() {
  const [lines, setLines] = useState<number[]>([]) // stores sums: 6, 7, 8, 9
  const [casting, setCasting] = useState(false)
  const [coins, setCoins] = useState<[number, number, number]>([0, 0, 0])
  const [quantumData, setQuantumData] = useState<number[]>([])
  const [entropySource, setEntropySource] = useState<'quantum' | 'pseudo' | 'somatic' | 'connecting'>('connecting')
  const [browsing, setBrowsing] = useState(false)
  const [browseIndex, setBrowseIndex] = useState(0)
  const [showSomaticCollector, setShowSomaticCollector] = useState(false)

  const allHexagrams = Object.values(HEXAGRAMS).sort((a, b) => a.number - b.number)

  useEffect(() => {
    async function fetchQuantum() {
      try {
        setEntropySource('connecting')
        // We need 3 coins * 6 lines = 18 bytes
        const res = await fetch('https://qrng.anu.edu.au/API/jsonI.php?length=18&type=uint8')
        if (!res.ok) throw new Error('API failed')
        const data = await res.json()
        if (data.success && data.data) {
          setQuantumData(data.data)
          setEntropySource('quantum')
        } else {
          setEntropySource('pseudo')
        }
      } catch (err) {
        setEntropySource('pseudo')
      }
    }
    if (!browsing) {
      fetchQuantum()
    }
  }, [browsing])

  const cast = () => {
    if (lines.length >= 6) return
    setCasting(true)

    // Current line index
    const lineIdx = lines.length
    // Base index in the quantum array (3 bytes per line)
    const baseIdx = lineIdx * 3

    let flips = 0
    const interval = setInterval(() => {
      // Visual spinning
      setCoins([
        Math.random() > 0.5 ? 2 : 3,
        Math.random() > 0.5 ? 2 : 3,
        Math.random() > 0.5 ? 2 : 3,
      ])
      flips++
      if (flips > 10) {
        clearInterval(interval)
        let finalCoins: [number, number, number]
        if ((entropySource === 'quantum' || entropySource === 'somatic') && quantumData.length >= baseIdx + 3) {
          // Use quantum/somatic bytes: map even to 2 (Yin), odd to 3 (Yang)
          finalCoins = [
            (quantumData[baseIdx] % 2) + 2,
            (quantumData[baseIdx + 1] % 2) + 2,
            (quantumData[baseIdx + 2] % 2) + 2,
          ] as [number, number, number]
        } else {
          // Fallback pseudorandom
          finalCoins = [
            Math.random() > 0.5 ? 2 : 3,
            Math.random() > 0.5 ? 2 : 3,
            Math.random() > 0.5 ? 2 : 3,
          ] as [number, number, number]
        }
        
        setCoins(finalCoins)
        const sum = finalCoins.reduce((a, b) => a + b, 0)
        setLines(prev => [...prev, sum]) // append to end (bottom line first)
        setCasting(false)
      }
    }, 50)
  }

  const reset = () => {
    setLines([])
    setCoins([0, 0, 0])
    // Fetch new quantum data for next cast
    setQuantumData([])
    setEntropySource('connecting')
    fetch('https://qrng.anu.edu.au/API/jsonI.php?length=18&type=uint8')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQuantumData(data.data)
          setEntropySource('quantum')
        } else setEntropySource('pseudo')
      })
      .catch(() => setEntropySource('pseudo'))
  }

  const binaryString = lines.map(sum => (sum === 7 || sum === 9) ? '1' : '0').join('')
  const hexagram = lines.length === 6 ? HEXAGRAMS[binaryString] : null

  const handleSomaticComplete = (bytes: number[]) => {
    setQuantumData(bytes)
    setEntropySource('somatic')
    setShowSomaticCollector(false)
  }

  if (browsing) {
    const currentHex = allHexagrams[browseIndex]
    return (
      <div className="flex flex-col items-center w-full max-w-xl mx-auto animate-in fade-in duration-500">
        <div className="w-full flex justify-between items-center mb-6">
          <button 
            onClick={() => setBrowsing(false)}
            className="text-xs font-mono text-amber-500 hover:text-amber-400"
          >
            ← Back to Oracle
          </button>
          <div className="text-xs font-mono uppercase tracking-widest text-slate-500">
            Archive of Changes
          </div>
        </div>

        <div className="w-full p-8 rounded-2xl bg-[#0a0512] border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.05)]">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setBrowseIndex(prev => prev > 0 ? prev - 1 : allHexagrams.length - 1)}
              className="p-2 text-slate-500 hover:text-amber-400 transition-colors"
            >
              ←
            </button>
            <div className="flex flex-col items-center">
              <div className="text-xs font-mono uppercase tracking-[0.3em] text-amber-400 mb-2">
                Hexagram {currentHex.number}
              </div>
              <h3 className="text-3xl font-serif text-slate-200 mb-1">
                {currentHex.name}
              </h3>
              <div className="text-sm font-serif italic text-slate-400">
                {currentHex.pinyin} — {currentHex.meaning}
              </div>
            </div>
            <button 
              onClick={() => setBrowseIndex(prev => prev < allHexagrams.length - 1 ? prev + 1 : 0)}
              className="p-2 text-slate-500 hover:text-amber-400 transition-colors"
            >
              →
            </button>
          </div>

          <div className="flex justify-center mb-8">
            <div className="flex flex-col-reverse gap-2 w-32">
              {/* Derive binary from hexagram to render lines */}
              {Object.entries(HEXAGRAMS).find(([, h]) => h.number === currentHex.number)?.[0].split('').map((bit, i) => (
                <div key={i} className="h-6 flex justify-center gap-1 w-full">
                  {bit === '1' ? (
                    <div className="h-4 w-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
                  ) : (
                    <>
                      <div className="h-4 w-full bg-slate-400" />
                      <div className="h-4 w-8 bg-transparent shrink-0" />
                      <div className="h-4 w-full bg-slate-400" />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 text-left">
            <div>
              <div className="text-xs font-mono text-amber-600 mb-1 uppercase tracking-widest">The Judgment</div>
              <p className="text-sm font-serif text-slate-300 leading-relaxed">
                {currentHex.judgment}
              </p>
            </div>
            <div>
              <div className="text-xs font-mono text-amber-600 mb-1 uppercase tracking-widest">The Image</div>
              <p className="text-sm font-serif text-slate-300 leading-relaxed">
                {currentHex.image}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-xl mx-auto">
      {/* Introduction / Quantum Info */}
      {!hexagram && lines.length === 0 && !showSomaticCollector && (
        <div className="text-center space-y-4 px-6 mb-4">
          <p className="text-sm font-serif italic leading-relaxed" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
            "The core mechanism has barely changed in thousands of years. But modern technologies offer a chance to genuinely improve it, not by changing the wisdom, but by improving the interface."
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: 'rgba(167, 139, 250, 0.2)', background: 'rgba(15, 15, 26, 0.5)' }}>
            <span className="relative flex h-2 w-2">
              {entropySource === 'connecting' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                entropySource === 'quantum' ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 
                entropySource === 'somatic' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' :
                entropySource === 'pseudo' ? 'bg-slate-400' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              {entropySource === 'quantum' ? 'Quantum Entropy Active' : 
               entropySource === 'somatic' ? 'Somatic Entropy Infused' :
               entropySource === 'pseudo' ? 'Local PRNG Fallback' : 'Establishing connection...'}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
            True quantum random number generators use vacuum fluctuations, the most fundamental source of randomness we know. They are uncontaminated by computational patterns or unconscious physical habits. Let the universe speak.
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-2">
            <button 
              onClick={() => setShowSomaticCollector(true)}
              className="text-xs font-mono underline underline-offset-4 text-amber-500 hover:text-amber-400 block"
            >
              Channel Somatic Entropy
            </button>
            <span className="text-slate-700 text-xs">|</span>
            <button 
              onClick={() => setBrowsing(true)}
              className="text-xs font-mono underline underline-offset-4 text-slate-500 hover:text-slate-300 block"
            >
              Browse 64 Hexagrams
            </button>
          </div>
        </div>
      )}

      {/* Somatic Collector */}
      {showSomaticCollector && (
        <EntropyCollector 
          onComplete={handleSomaticComplete} 
          bytesNeeded={18} 
          title="Channel Your Intent" 
          description="Focus on your question. Move your cursor, swipe, or tap across the screen to generate true somatic randomness for the oracle."
        />
      )}

      {/* Coin Casting Area */}
      {(!hexagram && !showSomaticCollector && lines.length < 6) && (
        <div className="flex flex-col items-center space-y-4">
          <div className="flex gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-75 ${
                  coins[i] === 0 ? 'bg-transparent border-slate-700/50' :
                  coins[i] === 2 ? 'bg-[#151025] border-indigo-500' : 'bg-amber-600 border-amber-400'
                }`}
                style={{
                  boxShadow: coins[i] > 0 ? (coins[i] === 2 ? '0 0 15px rgba(99,102,241,0.3)' : '0 0 15px rgba(251,191,36,0.3)') : 'none',
                  transform: casting ? `scale(${0.9 + Math.random() * 0.2}) translateY(${Math.random() * -10}px)` : 'none'
                }}
              >
                <span className="text-[10px] font-mono opacity-60 uppercase tracking-widest text-slate-200">
                  {coins[i] === 0 ? '?' : coins[i] === 2 ? 'Yin' : 'Yang'}
                </span>
              </div>
            ))}
          </div>
          
          {lines.length < 6 && (
            <button
              onClick={cast}
              disabled={casting || entropySource === 'connecting'}
              className="px-6 py-2 rounded-full font-mono text-sm tracking-wider uppercase border transition-all hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ 
                borderColor: (entropySource === 'quantum' || entropySource === 'somatic') ? 'rgba(129, 140, 248, 0.4)' : 'rgba(148, 163, 184, 0.4)', 
                color: (entropySource === 'quantum' || entropySource === 'somatic') ? '#818cf8' : '#94a3b8',
                boxShadow: (entropySource === 'quantum' || entropySource === 'somatic') && !casting ? '0 0 10px rgba(129,140,248,0.2)' : 'none'
              }}
            >
              {casting ? 'Casting...' : entropySource === 'connecting' ? 'Calibrating...' : `Cast Line ${lines.length + 1}`}
            </button>
          )}
        </div>
      )}

      {/* Lines Display */}
      {lines.length > 0 && (
        <div className="flex flex-col-reverse items-center gap-2 w-48 mb-8">
          {Array.from({ length: 6 }).map((_, i) => {
            const sum = lines[i]
            if (!sum) return (
              <div key={i} className="h-6 w-full flex items-center justify-center opacity-10">
                <div className="h-[2px] w-full bg-slate-500" />
              </div>
            )
            const isYang = sum === 7 || sum === 9
            const isChanging = sum === 6 || sum === 9
            
            return (
              <div key={i} className="flex items-center gap-2 w-full h-6 group relative">
                <span className="text-[10px] w-4 opacity-50 font-mono">{i + 1}</span>
                <div className="flex-1 flex justify-center gap-1">
                  {isYang ? (
                    <div className="h-3 w-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.3)] transition-all" />
                  ) : (
                    <>
                      <div className="h-3 w-full bg-slate-400 transition-all" />
                      <div className="h-3 w-8 bg-transparent shrink-0" />
                      <div className="h-3 w-full bg-slate-400 transition-all" />
                    </>
                  )}
                </div>
                <span className="text-[10px] w-4 text-amber-500 font-bold" title={isChanging ? 'Changing Line' : ''}>
                  {isChanging ? 'O' : ''}
                </span>
                
                {/* Tooltip for value */}
                <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                  Value: {sum} ({isYang ? 'Yang' : 'Yin'}{isChanging ? ', Changing' : ''})
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Hexagram Result */}
      {hexagram && (
        <div className="w-full p-8 rounded-2xl bg-[#0a0512] border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.08)] text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="text-xs font-mono uppercase tracking-[0.3em] text-indigo-400 mb-2">
              Hexagram {hexagram.number}
            </div>
            <h3 className="text-4xl font-serif text-slate-200 mb-2 drop-shadow-lg">
              {hexagram.name}
            </h3>
            <div className="text-sm font-serif italic text-slate-400 mb-8">
              {hexagram.pinyin} — {hexagram.meaning}
            </div>
            
            <div className="space-y-6 text-left">
              <div>
                <div className="text-xs font-mono text-indigo-500 mb-2 uppercase tracking-widest">The Judgment</div>
                <p className="text-base font-serif text-slate-300 leading-relaxed border-l-2 border-indigo-500/30 pl-4 py-1">
                  {hexagram.judgment}
                </p>
              </div>
              <div>
                <div className="text-xs font-mono text-amber-600 mb-2 uppercase tracking-widest">The Image</div>
                <p className="text-base font-serif text-slate-300 leading-relaxed border-l-2 border-amber-600/30 pl-4 py-1">
                  {hexagram.image}
                </p>
              </div>
            </div>
            
            <button
              onClick={reset}
              className="mt-10 px-6 py-2 rounded-full font-mono text-xs tracking-wider uppercase border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all hover:bg-slate-800"
            >
              Cast Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
