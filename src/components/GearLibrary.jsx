import { useState, useMemo, useRef } from 'react'
import { uid } from '../utils/uid'
import { parseGearFile } from '../utils/fileImport'
import { parseWeightInput } from '../utils/weight'

const inputCls = 'bg-white/[0.08] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#D6CFC2]/35 focus:outline-none focus:ring-1 focus:ring-[#D9A441]/60'

export default function GearLibrary({ gearItems, onSaveGearItems }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)
  const fileRef = useRef(null)

  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newWeight, setNewWeight] = useState('')
  const [newQty, setNewQty] = useState('1')

  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editWeight, setEditWeight] = useState('')
  const [editQty, setEditQty] = useState('1')

  const [showFormatHelp, setShowFormatHelp] = useState(false)
  const [quickAddCat, setQuickAddCat] = useState(null)
  const [quickName, setQuickName] = useState('')
  const [quickWeight, setQuickWeight] = useState('')
  const [quickQty, setQuickQty] = useState('1')

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

  function addItem() {
    if (!newName.trim()) return
    const qty = Math.max(1, parseInt(newQty) || 1)
    onSaveGearItems([...gearItems, {
      id: uid(),
      name: newName.trim(),
      category: newCategory.trim() || 'Misc',
      weight: parseWeightInput(newWeight),
      quantity: qty,
    }])
    setNewName('')
    setNewCategory('')
    setNewWeight('')
    setNewQty('1')
    setShowAddForm(false)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditCategory(item.category)
    setEditWeight(item.weight != null ? String(item.weight) : '')
    setEditQty(String(item.quantity || 1))
  }

  function saveEdit(id) {
    const qty = Math.max(1, parseInt(editQty) || 1)
    onSaveGearItems(gearItems.map(i =>
      i.id === id
        ? { ...i, name: editName.trim() || i.name, category: editCategory.trim() || i.category, weight: parseWeightInput(editWeight), quantity: qty }
        : i
    ))
    setEditingId(null)
  }

  function deleteItem(id) {
    onSaveGearItems(gearItems.filter(i => i.id !== id))
  }

  function quickAddItem(catName) {
    if (!quickName.trim()) return
    const qty = Math.max(1, parseInt(quickQty) || 1)
    onSaveGearItems([...gearItems, {
      id: uid(),
      name: quickName.trim(),
      category: catName,
      weight: parseWeightInput(quickWeight),
      quantity: qty,
    }])
    setQuickName('')
    setQuickWeight('')
    setQuickQty('1')
    setQuickAddCat(null)
  }

  async function handleFileImport(e) {
    const file = e.target.files[0]
    if (!file) return
    setImportError(null)
    setImportSuccess(null)
    setImporting(true)
    try {
      const { items } = await parseGearFile(file)
      const existingNames = new Set(gearItems.map(i => i.name.toLowerCase()))
      const newOnes = items.filter(i => !existingNames.has(i.name.toLowerCase()))
      if (newOnes.length === 0) {
        setImportSuccess('All items already exist in library — nothing added.')
      } else {
        onSaveGearItems([...gearItems, ...newOnes])
        setImportSuccess(`Added ${newOnes.length} item${newOnes.length !== 1 ? 's' : ''} to library.`)
      }
    } catch (err) {
      setImportError(err.message || 'Failed to parse file.')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const existingCategories = [...new Set(gearItems.map(i => i.category))].sort()

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[32px] font-bold text-[#F5F5F5] tracking-tight leading-tight">Gear Library</h1>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="tap bg-[#D9A441] text-[#2B2B2B] font-semibold px-5 py-2 rounded-full text-sm transition-all duration-300"
        >
          {showAddForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      <p className="text-xs text-[#D6CFC2]/50 mb-4">
        {gearItems.length} items · select from this library when building trips or templates
      </p>

      {/* File import */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls,.docx,.doc"
        onChange={handleFileImport}
        className="hidden"
      />
      <button
        onClick={() => { setImportError(null); setImportSuccess(null); fileRef.current?.click() }}
        disabled={importing}
        className="tap w-full border border-dashed border-white/20 text-[#D6CFC2]/50 text-sm py-2.5 rounded-2xl mb-1 transition-all duration-300 disabled:opacity-50"
      >
        {importing ? 'Importing…' : '📁 Import from file (.csv, .xlsx, .docx)'}
      </button>
      <div className="flex items-center justify-between px-1 mb-3">
        <div>
          {importError && <p className="text-xs text-red-400">{importError}</p>}
          {importSuccess && <p className="text-xs text-[#D9A441]">{importSuccess}</p>}
        </div>
        <button
          onClick={() => setShowFormatHelp(v => !v)}
          className="text-xs text-[#D6CFC2]/40 hover:text-[#D6CFC2]/70 transition-colors"
        >
          {showFormatHelp ? 'Hide format ↑' : 'Format guide ↓'}
        </button>
      </div>
      {showFormatHelp && (
        <div className="bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 mb-3 space-y-2">
          <div>
            <p className="text-xs text-[#D6CFC2]/70 font-medium mb-0.5">CSV / XLSX</p>
            <p className="text-xs text-[#D6CFC2]/45">
              Columns: <span className="text-[#D6CFC2]/70">Name</span>, <span className="text-[#D6CFC2]/70">Category</span>, <span className="text-[#D6CFC2]/70">Weight</span> (lb, optional). Header row optional.
            </p>
          </div>
          <div>
            <p className="text-xs text-[#D6CFC2]/70 font-medium mb-0.5">DOCX</p>
            <p className="text-xs text-[#D6CFC2]/45">
              ALL CAPS or colon-ending lines = category. Weight inline: <span className="text-[#D6CFC2]/70">Tent - 4.5</span> or <span className="text-[#D6CFC2]/70">Tent (4.5 lb)</span>.
            </p>
          </div>
        </div>
      )}

      {/* Add item form */}
      {showAddForm && (
        <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-3">New Gear Item</h3>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Item name *"
            autoFocus
            className={`${inputCls} w-full mb-2`}
          />
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Category"
              list="cat-suggestions"
              className={`${inputCls} flex-1`}
            />
            <datalist id="cat-suggestions">
              {existingCategories.map(c => <option key={c} value={c} />)}
            </datalist>
            <input
              type="text"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              placeholder="e.g. 8 oz"
              className={`${inputCls} w-24`}
            />
            <input
              type="number"
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              min="1"
              placeholder="Qty"
              className={`${inputCls} w-16`}
            />
          </div>
          <button
            onClick={addItem}
            disabled={!newName.trim()}
            className="tap w-full bg-[#D9A441] text-[#2B2B2B] font-semibold py-2.5 rounded-full text-sm disabled:opacity-40 transition-all duration-300"
          >
            Add to Library
          </button>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search gear..."
        className={`${inputCls} w-full mb-3`}
      />

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`tap flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
              activeCategory === cat
                ? 'bg-[#D9A441] text-[#2B2B2B]'
                : 'bg-white/[0.08] border border-white/10 text-[#D6CFC2]/70'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-[#D6CFC2]/40">
          <p className="text-sm">No items match your search.</p>
        </div>
      )}

      {/* Grouped item list */}
      <div className="space-y-3">
        {grouped.map(([cat, items]) => (
          <div key={cat} className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-white/[0.04] border-b border-white/8 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#F5F5F5]">{cat}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#D6CFC2]/40">{items.length}</span>
                <button
                  onClick={() => { setQuickAddCat(cat); setQuickName(''); setQuickWeight('') }}
                  className="tap text-xs text-[#D9A441] font-medium transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
            <ul>
              {quickAddCat === cat && (
                <li className="px-3 py-2.5 border-b border-white/8 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={quickName}
                      onChange={e => setQuickName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') quickAddItem(cat)
                        if (e.key === 'Escape') setQuickAddCat(null)
                      }}
                      placeholder="Item name"
                      className={`${inputCls} flex-1`}
                    />
                    <input
                      type="text"
                      value={quickWeight}
                      onChange={e => setQuickWeight(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') quickAddItem(cat)
                        if (e.key === 'Escape') setQuickAddCat(null)
                      }}
                      placeholder="e.g. 8 oz"
                      className={`${inputCls} w-24`}
                    />
                    <input
                      type="number"
                      value={quickQty}
                      onChange={e => setQuickQty(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') quickAddItem(cat)
                        if (e.key === 'Escape') setQuickAddCat(null)
                      }}
                      min="1"
                      placeholder="Qty"
                      className={`${inputCls} w-16`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setQuickAddCat(null)} className="tap flex-1 border border-white/15 text-[#D6CFC2]/60 py-1.5 rounded-full text-xs transition-all duration-300">Cancel</button>
                    <button onClick={() => quickAddItem(cat)} disabled={!quickName.trim()} className="tap flex-1 bg-[#D9A441] text-[#2B2B2B] font-semibold py-1.5 rounded-full text-xs disabled:opacity-40 transition-all duration-300">Add</button>
                  </div>
                </li>
              )}
              {items.map((item, idx) => (
                <li
                  key={item.id}
                  className={`px-4 py-3 ${idx < items.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                        className={`${inputCls} w-full`}
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          list="cat-suggestions-edit"
                          placeholder="Category"
                          className={`${inputCls} flex-1`}
                        />
                        <datalist id="cat-suggestions-edit">
                          {existingCategories.map(c => <option key={c} value={c} />)}
                        </datalist>
                        <input
                          type="text"
                          value={editWeight}
                          onChange={e => setEditWeight(e.target.value)}
                          placeholder="e.g. 8 oz"
                          className={`${inputCls} w-24`}
                        />
                        <input
                          type="number"
                          value={editQty}
                          onChange={e => setEditQty(e.target.value)}
                          min="1"
                          placeholder="Qty"
                          className={`${inputCls} w-16`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="tap flex-1 border border-white/15 text-[#D6CFC2]/60 py-1.5 rounded-full text-xs transition-all duration-300">Cancel</button>
                        <button onClick={() => saveEdit(item.id)} className="tap flex-1 bg-[#D9A441] text-[#2B2B2B] font-semibold py-1.5 rounded-full text-xs transition-all duration-300">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[#F5F5F5]">{item.name}</span>
                        {(item.quantity > 1) && (
                          <span className="text-xs text-[#D9A441]/70 ml-2">×{item.quantity}</span>
                        )}
                        {item.weight != null && item.weight > 0 && (
                          <span className="text-xs text-[#D6CFC2]/45 ml-1.5">
                            {item.quantity > 1
                              ? `${Math.round(item.weight * (item.quantity) * 100) / 100} lb total`
                              : `${item.weight} lb`}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => startEdit(item)}
                        className="tap text-xs text-[#D9A441] border border-[#D9A441]/30 rounded-full px-2.5 py-1 transition-all duration-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-white/15 hover:text-red-400 text-lg leading-none transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
