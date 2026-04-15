import { useState, useRef } from 'react'
import { uid } from '../utils/uid'
import { parseFile } from '../utils/fileImport'
import { parseWeightInput } from '../utils/weight'
import GearPicker from './GearPicker'

const DEFAULT_CATEGORIES = [
  'Clothing', 'Outerwear', 'Gear', 'Toiletries',
  'Documents', 'Electronics', 'Food & Drink', 'Misc',
]

const inputCls = 'w-full bg-white/[0.08] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#D6CFC2]/35 focus:outline-none focus:ring-1 focus:ring-[#D9A441]/60'

export default function TemplateEditor({ template, onSave, onCancel, gearItems = [] }) {
  const isNew = !template
  const [name, setName] = useState(template?.name || '')
  const [categories, setCategories] = useState(template?.categories || [])
  const [importError, setImportError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const fileRef = useRef(null)

  const [newItems, setNewItems] = useState({})
  const [newItemWeights, setNewItemWeights] = useState({})
  const [addingItemFor, setAddingItemFor] = useState(null)
  const [editingWeightId, setEditingWeightId] = useState(null)
  const [editWeightValue, setEditWeightValue] = useState('')
  const [showGearPicker, setShowGearPicker] = useState(false)
  const [gearPickerTargetCat, setGearPickerTargetCat] = useState(null)

  function save() {
    if (!name.trim()) return
    onSave({ id: template?.id || uid(), name: name.trim(), categories })
  }

  async function handleFileImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setImportError(null)
    setImporting(true)
    try {
      const result = await parseFile(file)
      if (!name.trim()) setName(result.name)
      setCategories(prev => {
        const existing = new Map(prev.map(c => [c.name.toLowerCase(), c]))
        const merged = [...prev]
        for (const cat of result.categories) {
          const key = cat.name.toLowerCase()
          if (existing.has(key)) {
            const idx = merged.findIndex(c => c.name.toLowerCase() === key)
            const existingIds = new Set(merged[idx].items.map(i => i.name.toLowerCase()))
            const newOnes = cat.items.filter(i => !existingIds.has(i.name.toLowerCase()))
            merged[idx] = { ...merged[idx], items: [...merged[idx].items, ...newOnes] }
          } else {
            merged.push(cat)
          }
        }
        return merged
      })
    } catch (err) {
      setImportError(err.message || 'Failed to parse file.')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  function addCategory() {
    if (!newCatName.trim()) return
    if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) return
    setCategories(prev => [...prev, { id: uid(), name: newCatName.trim(), items: [] }])
    setNewCatName('')
    setShowNewCat(false)
  }

  function renameCategory(catId, newName) {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, name: newName } : c))
  }

  function deleteCategory(catId) {
    setCategories(prev => prev.filter(c => c.id !== catId))
  }

  function addItem(catId) {
    const itemName = (newItems[catId] || '').trim()
    if (!itemName) return
    const weight = parseWeightInput(newItemWeights[catId] || '')
    setCategories(prev => prev.map(c =>
      c.id === catId
        ? { ...c, items: [...c.items, { id: uid(), name: itemName, quantity: 1, weight }] }
        : c
    ))
    setNewItems(prev => ({ ...prev, [catId]: '' }))
    setNewItemWeights(prev => ({ ...prev, [catId]: '' }))
    setAddingItemFor(null)
  }

  function addFromLibrary(catId, gearSelections) {
    setCategories(prev => {
      let updated = [...prev]

      for (const g of gearSelections) {
        // Find a category matching the gear item's own category, then fall back to catId
        const targetName = g.category
        let cat = updated.find(c => c.name.toLowerCase() === targetName.toLowerCase())
        if (!cat) {
          // Create the category if it doesn't exist
          cat = { id: uid(), name: targetName, items: [] }
          updated = [...updated, cat]
        }
        const existingNames = new Set(cat.items.map(i => i.name.toLowerCase()))
        if (!existingNames.has(g.name.toLowerCase())) {
          updated = updated.map(c =>
            c.id === cat.id
              ? { ...c, items: [...c.items, { id: uid(), name: g.name, quantity: g.quantity || 1, weight: g.weight || null }] }
              : c
          )
        }
      }

      return updated
    })
    setShowGearPicker(false)
    setGearPickerTargetCat(null)
  }

  function saveItemWeight(catId, itemId, rawValue) {
    const weight = parseWeightInput(rawValue)
    setCategories(prev => prev.map(c =>
      c.id === catId
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, weight } : i) }
        : c
    ))
    setEditingWeightId(null)
  }

  function deleteItem(catId, itemId) {
    setCategories(prev => prev.map(c =>
      c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
    ))
  }

  function addDefaultCategories() {
    const existing = new Set(categories.map(c => c.name.toLowerCase()))
    const toAdd = DEFAULT_CATEGORIES
      .filter(n => !existing.has(n.toLowerCase()))
      .map(n => ({ id: uid(), name: n, items: [] }))
    setCategories(prev => [...prev, ...toAdd])
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-28">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel} className="tap text-[#D9A441] text-sm font-medium transition-all duration-300">← Templates</button>
        <h1 className="text-xl font-bold text-[#F5F5F5] flex-1">{isNew ? 'New Template' : 'Edit Template'}</h1>
      </div>

      {/* Name */}
      <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-4">
        <label className="block text-xs text-[#D6CFC2]/60 mb-1.5 uppercase tracking-wide font-medium">Template name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Deer Season"
          className={inputCls}
        />
      </div>

      {/* File import */}
      <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-[#F5F5F5] mb-1">Import from file</h3>
        <p className="text-xs text-[#D6CFC2]/50 mb-3">
          CSV / XLSX: two columns — <em>Category</em>, <em>Item</em>.<br/>
          DOCX: category headers followed by item lines.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,.docx,.doc"
          onChange={handleFileImport}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="tap w-full border border-dashed border-white/20 text-[#D6CFC2]/60 text-sm py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
        >
          {importing ? 'Importing…' : '📁 Choose file (.csv, .xlsx, .docx)'}
        </button>
        {importError && <p className="text-xs text-red-400 mt-2">{importError}</p>}
      </div>

      {/* Categories */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#F5F5F5]">Categories & Items</h3>
        {categories.length === 0 && (
          <button
            onClick={addDefaultCategories}
            className="text-xs text-[#D9A441] underline"
          >
            Add defaults
          </button>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.04] border-b border-white/8">
              <input
                type="text"
                value={cat.name}
                onChange={e => renameCategory(cat.id, e.target.value)}
                className="flex-1 text-sm font-semibold text-[#F5F5F5] bg-transparent focus:outline-none border-b border-transparent focus:border-[#D9A441]/60"
              />
              <span className="text-xs text-[#D6CFC2]/40">{cat.items.length}</span>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-white/20 hover:text-red-400 text-lg leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {/* Items */}
            <ul>
              {cat.items.map((item, idx) => (
                <li
                  key={item.id}
                  className={`flex items-center px-3 py-2.5 gap-2 ${idx < cat.items.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[#F5F5F5]">{item.name}</span>
                    {editingWeightId === `${cat.id}-${item.id}` ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="text"
                          autoFocus
                          value={editWeightValue}
                          onChange={e => setEditWeightValue(e.target.value)}
                          onBlur={() => saveItemWeight(cat.id, item.id, editWeightValue)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveItemWeight(cat.id, item.id, editWeightValue)
                            if (e.key === 'Escape') setEditingWeightId(null)
                          }}
                          placeholder="e.g. 8 oz"
                          className="w-28 bg-white/10 border border-[#D9A441]/60 rounded-lg px-1.5 py-0.5 text-xs text-[#F5F5F5] focus:outline-none"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingWeightId(`${cat.id}-${item.id}`)
                          setEditWeightValue(item.weight != null ? String(item.weight) : '')
                        }}
                        className="block text-xs text-[#D6CFC2]/40 hover:text-[#D9A441] mt-0.5 transition-colors"
                      >
                        {item.weight ? `${item.weight} (per unit)` : '+ weight'}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => deleteItem(cat.id, item.id)}
                    className="text-white/15 hover:text-red-400 text-lg leading-none flex-shrink-0 transition-colors"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            {/* Add item inline */}
            {addingItemFor === cat.id ? (
              <div className="px-3 py-2.5 border-t border-white/8 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newItems[cat.id] || ''}
                    onChange={e => setNewItems(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addItem(cat.id)
                      if (e.key === 'Escape') setAddingItemFor(null)
                    }}
                    placeholder="Item name"
                    className="flex-1 bg-white/[0.08] border border-white/15 rounded-lg px-2 py-1.5 text-sm text-[#F5F5F5] placeholder:text-[#D6CFC2]/35 focus:outline-none focus:ring-1 focus:ring-[#D9A441]/60"
                  />
                  <input
                    type="text"
                    value={newItemWeights[cat.id] || ''}
                    onChange={e => setNewItemWeights(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    placeholder="e.g. 8 oz"
                    className="w-24 bg-white/[0.08] border border-white/15 rounded-lg px-2 py-1.5 text-sm text-[#F5F5F5] placeholder:text-[#D6CFC2]/35 focus:outline-none focus:ring-1 focus:ring-[#D9A441]/60"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addItem(cat.id)}
                    className="tap flex-1 text-sm text-[#2B2B2B] font-semibold bg-[#D9A441] rounded-full px-3 py-1.5 transition-all duration-300"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAddingItemFor(null)}
                    className="tap text-sm text-[#D6CFC2]/60 px-3 py-1.5 border border-white/15 rounded-full transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex border-t border-white/8">
                <button
                  onClick={() => setAddingItemFor(cat.id)}
                  className="tap flex-1 text-xs text-[#D9A441] py-2 text-left px-3 transition-colors"
                >
                  + Custom item
                </button>
                <button
                  onClick={() => { setGearPickerTargetCat(cat.id); setShowGearPicker(true) }}
                  className="tap text-xs text-[#D6CFC2]/60 py-2 px-3 border-l border-white/8 transition-colors"
                >
                  📦 Library
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add category */}
      {showNewCat ? (
        <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-4">
          <input
            type="text"
            autoFocus
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addCategory()
              if (e.key === 'Escape') setShowNewCat(false)
            }}
            placeholder="Category name"
            className={`${inputCls} mb-3`}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowNewCat(false)} className="tap flex-1 border border-white/15 text-[#D6CFC2]/60 py-2 rounded-full text-sm transition-all duration-300">Cancel</button>
            <button onClick={addCategory} disabled={!newCatName.trim()} className="tap flex-1 bg-[#D9A441] text-[#2B2B2B] font-semibold py-2 rounded-full text-sm disabled:opacity-40 transition-all duration-300">Add</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewCat(true)}
          className="tap w-full border border-dashed border-white/20 text-[#D6CFC2]/50 text-sm py-3 rounded-2xl mb-4 transition-all duration-300"
        >
          + Add Category
        </button>
      )}

      {/* Fixed save bar */}
      <div className="fixed bottom-4 left-4 right-4 bg-[#1C1C1C]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2.5 flex gap-2 z-20">
        <button onClick={onCancel} className="tap flex-1 border border-white/15 text-[#D6CFC2]/70 py-2.5 rounded-xl text-sm transition-all duration-300">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!name.trim()}
          className="tap flex-1 bg-[#D9A441] text-[#2B2B2B] font-semibold py-2.5 rounded-xl text-sm disabled:opacity-40 transition-all duration-300"
        >
          Save Template
        </button>
      </div>

      {showGearPicker && gearPickerTargetCat && (
        <GearPicker
          gearItems={gearItems}
          existingNames={new Set(
            (categories.find(c => c.id === gearPickerTargetCat)?.items || [])
              .map(i => i.name.toLowerCase())
          )}
          onAdd={items => addFromLibrary(gearPickerTargetCat, items)}
          onClose={() => { setShowGearPicker(false); setGearPickerTargetCat(null) }}
        />
      )}
    </div>
  )
}
