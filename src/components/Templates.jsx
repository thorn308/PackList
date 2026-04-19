import { useState } from 'react'

export default function Templates({ templates, onEdit, onDeleteTemplate }) {
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[32px] font-bold text-[#F5F5F5] tracking-tight leading-tight">Templates</h1>
        <button
          onClick={() => onEdit('new')}
          className="tap bg-[#D9A441] text-[#2B2B2B] font-semibold px-5 py-2 rounded-full text-sm transition-all duration-300"
        >
          + New
        </button>
      </div>

      {templates.length === 0 && (
        <div className="text-center py-20 text-[#D6CFC2]/50">
          <div className="text-5xl mb-4">🗺️</div>
          <p className="text-sm">No templates yet. Create one or import from a file.</p>
        </div>
      )}

      <div className="space-y-3">
        {templates.map(tpl => {
          const itemCount = tpl.categories.reduce((n, c) => n + c.items.length, 0)
          return (
            <div key={tpl.id} className="tap bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#F5F5F5]">{tpl.name}</h3>
                  <p className="text-xs text-[#D6CFC2]/50 mt-0.5">
                    {tpl.categories.length} categories · {itemCount} items
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tpl.categories.slice(0, 4).map(c => (
                      <span key={c.id} className="text-xs bg-white/[0.08] text-[#D6CFC2]/70 rounded-full px-2.5 py-0.5 border border-white/8">
                        {c.name}
                      </span>
                    ))}
                    {tpl.categories.length > 4 && (
                      <span className="text-xs text-[#D6CFC2]/40 px-1">+{tpl.categories.length - 4} more</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-3 flex-shrink-0">
                  <button
                    onClick={() => onEdit(tpl)}
                    className="tap text-xs text-[#D9A441] border border-[#D9A441]/30 rounded-full px-3 py-1.5 transition-all duration-300"
                  >
                    Edit
                  </button>
                  {pendingDeleteId === tpl.id ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setPendingDeleteId(null)}
                        className="tap text-xs text-[#D6CFC2]/60 border border-white/15 rounded-full px-2.5 py-1.5 transition-all duration-300"
                      >Cancel</button>
                      <button
                        onClick={() => onDeleteTemplate(tpl.id)}
                        className="tap text-xs text-red-400 border border-red-400/30 rounded-full px-2.5 py-1.5 transition-all duration-300"
                      >Delete</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPendingDeleteId(tpl.id)}
                      className="tap text-xs text-red-400/80 border border-red-400/20 rounded-full px-3 py-1.5 transition-all duration-300"
                    >Delete</button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
