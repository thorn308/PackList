import { useState, useMemo, useEffect, useRef } from 'react'

export default function GearPicker({ gearItems, existingNames = new Set(), onAdd, onClose }) {
  const modalRef = useRef(null)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const modal = modalRef.current
      if (!modal) return
      const focusable = [...modal.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selected, setSelected] = useState(new Set())

  const categories = useMemo(() => {
    const cats = [...new Set(gearItems.map(i => i.category))].sort()
    return ['All', ...cats]
  }, [gearItems])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return gearItems.filter(item => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
      const matchesCat = activeCategory === 'All' || item.category === activeCategory
      return matchesSearch && matchesCat
    })
  }, [gearItems, search, activeCategory])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const item of filtered) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category).push(item)
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cat, items]) => [cat, items.sort((a, b) => a.name.localeCompare(b.name))])
  }, [filtered])

  function toggleItem(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleAdd() {
    const items = gearItems.filter(i => selected.has(i.id))
    onAdd(items)
  }

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Select from Gear Library" className="fixed inset-0 z-50 bg-[#2B2B2B] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-[#1C1C1C]/90 backdrop-blur-xl border-b border-white/10">
        <button onClick={onClose} className="tap text-[#D6CFC2]/60 text-sm transition-colors">✕</button>
        <h2 className="text-base font-semibold text-[#F5F5F5] flex-1">Select from Gear Library</h2>
        {selected.size > 0 && (
          <button
            onClick={handleAdd}
            className="tap bg-[#D9A441] text-[#2B2B2B] font-semibold px-4 py-1.5 rounded-full text-sm transition-all duration-300"
          >
            Add {selected.size}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2 bg-[#2B2B2B] border-b border-white/8">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search gear..."
          autoFocus
          className="w-full bg-white/[0.08] border border-white/15 rounded-2xl px-4 py-2.5 text-base text-[#F5F5F5] placeholder:text-[#D6CFC2]/35 focus:outline-none focus:ring-1 focus:ring-[#D9A441]/60"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5 bg-[#2B2B2B] border-b border-white/8 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`tap flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              activeCategory === cat
                ? 'bg-[#D9A441] text-[#2B2B2B]'
                : 'bg-white/[0.08] border border-white/10 text-[#D6CFC2]/70'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-[#D6CFC2]/40">
            <p className="text-sm">No items match.</p>
          </div>
        )}
        {grouped.map(([cat, items]) => (
          <div key={cat} className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-white/[0.04] border-b border-white/8">
              <span className="text-sm font-semibold text-[#F5F5F5]">{cat}</span>
            </div>
            <ul>
              {items.map((item, idx) => {
                const isSelected = selected.has(item.id)
                const alreadyAdded = existingNames.has(item.name.toLowerCase())
                return (
                  <li
                    key={item.id}
                    onClick={() => !alreadyAdded && toggleItem(item.id)}
                    className={`tap flex items-center px-4 py-3 gap-3 cursor-pointer ${
                      idx < items.length - 1 ? 'border-b border-white/5' : ''
                    } ${alreadyAdded ? 'opacity-35 cursor-default' : ''}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#D9A441] border-[#D9A441]'
                        : 'border-white/25'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-[#2B2B2B]" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[#F5F5F5]">{item.name}</span>
                      {item.quantity > 1 && <span className="text-xs text-[#D9A441]/70 ml-1.5">×{item.quantity}</span>}
                      {alreadyAdded && <span className="text-xs text-[#D6CFC2]/40 ml-2">already added</span>}
                    </div>
                    {item.weight != null && item.weight > 0 && (
                      <span className="text-xs text-[#D6CFC2]/50 flex-shrink-0">
                        {item.quantity > 1
                          ? `${Math.round(item.weight * item.quantity * 100) / 100} lb`
                          : `${item.weight} lb`}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="px-4 py-3 bg-[#1C1C1C]/90 backdrop-blur-xl border-t border-white/10">
          <button
            onClick={handleAdd}
            className="tap w-full bg-[#D9A441] text-[#2B2B2B] font-semibold py-3.5 rounded-2xl text-sm transition-all duration-300"
          >
            Add {selected.size} item{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
