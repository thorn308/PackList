import { useState } from 'react'
import { uid } from '../utils/uid'
import ProgressBar from './ProgressBar'
import GearPicker from './GearPicker'
import { parseWeightInput, formatWeight } from '../utils/weight'

const WEIGHT_UNITS = ['oz', 'lb', 'kg', 'g']

function totalWeight(items) {
  return items.reduce((sum, i) => {
    if (!i.weight) return sum
    return sum + i.weight * (i.quantity || 1)
  }, 0)
}

export default function TripDetail({ trip, onBack, onUpdateTrip, gearItems = [] }) {
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState(trip.categories[0] || 'Misc')
  const [newItemWeight, setNewItemWeight] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [filter, setFilter] = useState('all')
  const [collapsed, setCollapsed] = useState(new Set())
  const [showMenu, setShowMenu] = useState(false)
  const [editingWeightId, setEditingWeightId] = useState(null)
  const [editWeightValue, setEditWeightValue] = useState('')
  const [showGearPicker, setShowGearPicker] = useState(false)
  const [inlineAddCat, setInlineAddCat] = useState(null)
  const [inlineName, setInlineName] = useState('')
  const [inlineWeight, setInlineWeight] = useState('')
  const [inlineQty, setInlineQty] = useState('1')
  const [editingItemId, setEditingItemId] = useState(null)
  const [editItemName, setEditItemName] = useState('')
  const [editItemCategory, setEditItemCategory] = useState('')
  const [editItemWeight, setEditItemWeight] = useState('')
  const [editItemQty, setEditItemQty] = useState('1')

  const weightUnit = trip.weightUnit || 'lb'
  const packed = trip.items.filter(i => i.checked).length
  const total = trip.items.length
  const packedWeight = totalWeight(trip.items.filter(i => i.checked))
  const allWeight = totalWeight(trip.items)
  const hasAnyWeight = allWeight > 0

  function setWeightUnit(unit) {
    onUpdateTrip({ ...trip, weightUnit: unit })
  }

  function toggleCollapsed(cat) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function toggleItem(itemId) {
    const updated = trip.items.map(i =>
      i.id === itemId ? { ...i, checked: !i.checked } : i
    )
    const changedItem = updated.find(i => i.id === itemId)
    if (changedItem?.checked) {
      const catItems = updated.filter(i => i.category === changedItem.category)
      if (catItems.every(i => i.checked)) {
        setCollapsed(prev => new Set([...prev, changedItem.category]))
      }
    }
    onUpdateTrip({ ...trip, items: updated })
  }

  function deleteItem(itemId) {
    onUpdateTrip({ ...trip, items: trip.items.filter(i => i.id !== itemId) })
  }

  function inlineAddItem(catName) {
    if (!inlineName.trim()) return
    const qty = Math.max(1, parseInt(inlineQty) || 1)
    onUpdateTrip({
      ...trip,
      items: [...trip.items, {
        id: uid(),
        name: inlineName.trim(),
        category: catName,
        quantity: qty,
        weight: parseWeightInput(inlineWeight),
        checked: false,
      }],
    })
    setInlineName('')
    setInlineWeight('')
    setInlineQty('1')
    setInlineAddCat(null)
  }

  function startEditItem(item) {
    setEditingItemId(item.id)
    setEditItemName(item.name)
    setEditItemCategory(item.category)
    setEditItemWeight(item.weight != null ? formatWeight(item.weight, weightUnit) : '')
    setEditItemQty(String(item.quantity || 1))
  }

  function saveEditItem(itemId) {
    if (!editItemName.trim()) return
    const qty = Math.max(1, parseInt(editItemQty) || 1)
    onUpdateTrip({
      ...trip,
      items: trip.items.map(i =>
        i.id === itemId
          ? { ...i, name: editItemName.trim(), category: editItemCategory || i.category, weight: parseWeightInput(editItemWeight), quantity: qty }
          : i
      ),
    })
    setEditingItemId(null)
  }

  function saveItemWeight(itemId, rawValue) {
    const weight = parseWeightInput(rawValue)
    onUpdateTrip({
      ...trip,
      items: trip.items.map(i => i.id === itemId ? { ...i, weight } : i),
    })
    setEditingWeightId(null)
  }

  function addFromLibrary(gearSelections) {
    const newItems = gearSelections.map(g => ({
      id: uid(),
      name: g.name,
      category: trip.categories.includes(g.category) ? g.category : (trip.categories[0] || 'Misc'),
      quantity: g.quantity || 1,
      weight: g.weight || null,
      checked: false,
    }))
    onUpdateTrip({ ...trip, items: [...trip.items, ...newItems] })
    setShowGearPicker(false)
  }

  function addItem() {
    if (!newItemName.trim()) return
    const item = {
      id: uid(),
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: 1,
      weight: parseWeightInput(newItemWeight),
      checked: false,
    }
    onUpdateTrip({ ...trip, items: [...trip.items, item] })
    setNewItemName('')
    setNewItemWeight('')
    setShowAddItem(false)
  }

  function addCategory() {
    if (!newCategoryName.trim()) return
    const name = newCategoryName.trim()
    if (trip.categories.includes(name)) return
    onUpdateTrip({ ...trip, categories: [...trip.categories, name] })
    setNewCategoryName('')
    setShowAddCategory(false)
  }

  function renameCategory(oldName, newName) {
    if (!newName.trim() || newName === oldName) {
      setEditingCategoryId(null)
      return
    }
    onUpdateTrip({
      ...trip,
      categories: trip.categories.map(c => c === oldName ? newName.trim() : c),
      items: trip.items.map(i => i.category === oldName ? { ...i, category: newName.trim() } : i),
    })
    setEditingCategoryId(null)
  }

  function deleteCategory(catName) {
    onUpdateTrip({
      ...trip,
      categories: trip.categories.filter(c => c !== catName),
      items: trip.items.filter(i => i.category !== catName),
    })
  }

  function uncheckAll() {
    onUpdateTrip({ ...trip, items: trip.items.map(i => ({ ...i, checked: false })) })
    setCollapsed(new Set())
  }

  function checkAll() {
    onUpdateTrip({ ...trip, items: trip.items.map(i => ({ ...i, checked: true })) })
  }

  const itemsByCategory = trip.categories.reduce((acc, cat) => {
    const items = trip.items.filter(i => i.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const uncategorized = trip.items.filter(i => !trip.categories.includes(i.category))
  if (uncategorized.length > 0) itemsByCategory['Uncategorized'] = uncategorized

  function visibleItems(items) {
    if (filter === 'unpacked') return items.filter(i => !i.checked)
    if (filter === 'packed') return items.filter(i => i.checked)
    return items
  }

  const inputCls = 'w-full bg-white/[0.08] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#D6CFC2]/35 focus:outline-none focus:ring-1 focus:ring-[#D9A441]/60'

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="tap text-[#D9A441] text-sm font-medium transition-all duration-300">← Trips</button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[#F5F5F5] truncate">{trip.name}</h1>
          {trip.destination && <p className="text-xs text-[#D6CFC2]/60">{trip.destination}</p>}
        </div>
        {/* Settings menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="tap w-9 h-9 flex items-center justify-center rounded-full border border-white/15 text-[#D6CFC2]/70 text-xl leading-none transition-all duration-300"
            aria-label="Trip options"
          >
            ⋯
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 z-20 bg-[#1C1C1C]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-52 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="text-xs text-[#D6CFC2]/50 mb-2 uppercase tracking-wide font-medium">Weight unit</p>
                  <div className="flex gap-1">
                    {WEIGHT_UNITS.map(u => (
                      <button
                        key={u}
                        onClick={() => { setWeightUnit(u); setShowMenu(false) }}
                        className={`tap flex-1 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                          weightUnit === u
                            ? 'bg-[#D9A441] text-[#2B2B2B]'
                            : 'bg-white/8 text-[#D6CFC2]/70'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { checkAll(); setShowMenu(false) }}
                  className="tap w-full text-left px-4 py-3 text-sm text-[#F5F5F5] hover:bg-white/5 border-b border-white/8 transition-colors"
                >
                  ✓ Pack all
                </button>
                <button
                  onClick={() => { uncheckAll(); setShowMenu(false) }}
                  className="tap w-full text-left px-4 py-3 text-sm text-[#F5F5F5] hover:bg-white/5 transition-colors"
                >
                  ↺ Unpack all
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-3">
        <ProgressBar packed={packed} total={total} />
      </div>

      {/* Pack weight summary */}
      {hasAnyWeight && (
        <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#D6CFC2]/50 mb-0.5 uppercase tracking-wide">Pack Weight</p>
            <p className="text-base font-semibold text-[#F5F5F5]">{formatWeight(allWeight, weightUnit)}</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-xs text-[#D6CFC2]/50 mb-0.5 uppercase tracking-wide">Packed</p>
            <p className={`text-base font-semibold ${packedWeight > 0 ? 'text-[#D9A441]' : 'text-white/30'}`}>
              {packedWeight > 0 ? formatWeight(packedWeight, weightUnit) : '—'}
            </p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-xs text-[#D6CFC2]/50 mb-0.5 uppercase tracking-wide">Remaining</p>
            <p className={`text-base font-semibold ${allWeight - packedWeight > 0 ? 'text-[#D6CFC2]/80' : 'text-white/30'}`}>
              {allWeight - packedWeight > 0 ? formatWeight(allWeight - packedWeight, weightUnit) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {['all', 'unpacked', 'packed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`tap flex-1 py-2 rounded-full text-xs font-medium capitalize transition-all duration-300 ${
              filter === f
                ? 'bg-[#D9A441] text-[#2B2B2B]'
                : 'bg-white/[0.07] border border-white/10 text-[#D6CFC2]/70'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add item form */}
      {showAddItem && (
        <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-3">Add Item</h3>
          <input
            type="text"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            placeholder="Item name"
            className={`${inputCls} mb-2`}
            autoFocus
          />
          <select
            value={newItemCategory}
            onChange={e => setNewItemCategory(e.target.value)}
            className={`${inputCls} mb-2`}
          >
            {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newItemWeight}
              onChange={e => setNewItemWeight(e.target.value)}
              placeholder="e.g. 24 oz, 1 lb 4 oz, 680 g"
              className="flex-1 bg-white/[0.08] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#D6CFC2]/35 focus:outline-none focus:ring-1 focus:ring-[#D9A441]/60"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddItem(false)}
              className="tap flex-1 py-2.5 border border-white/15 text-[#D6CFC2]/70 rounded-full text-sm transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={addItem}
              disabled={!newItemName.trim()}
              className="tap flex-1 py-2.5 bg-[#D9A441] text-[#2B2B2B] font-semibold rounded-full text-sm disabled:opacity-40 transition-all duration-300"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Add category form */}
      {showAddCategory && (
        <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-3">Add Category</h3>
          <input
            type="text"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className={`${inputCls} mb-3`}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddCategory(false)}
              className="tap flex-1 py-2.5 border border-white/15 text-[#D6CFC2]/70 rounded-full text-sm transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={addCategory}
              disabled={!newCategoryName.trim()}
              className="tap flex-1 py-2.5 bg-[#D9A441] text-[#2B2B2B] font-semibold rounded-full text-sm disabled:opacity-40 transition-all duration-300"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="text-center py-12 text-[#D6CFC2]/40">
          <p className="text-sm">No items yet. Tap <strong className="text-[#D9A441]">+ Custom</strong> below.</p>
        </div>
      )}

      {/* Category sections */}
      <div className="space-y-3">
        {Object.entries(itemsByCategory).map(([cat, items]) => {
          const visible = visibleItems(items)
          const catPacked = items.filter(i => i.checked).length
          if (visible.length === 0) return null
          const isCollapsed = collapsed.has(cat)
          const allPacked = catPacked === items.length

          return (
            <div key={cat} className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              <div className={`flex items-center justify-between px-4 py-3 border-b border-white/8 ${allPacked ? 'bg-[#D9A441]/10' : 'bg-white/[0.03]'}`}>
                <button
                  onClick={() => toggleCollapsed(cat)}
                  className="flex items-center gap-2 flex-1 text-left min-w-0"
                  aria-label={isCollapsed ? `Expand ${cat}` : `Collapse ${cat}`}
                >
                  <span className={`text-xs transition-transform duration-200 text-[#D6CFC2]/40 ${isCollapsed ? '' : 'rotate-90'}`}>
                    ▶
                  </span>
                  {editingCategoryId === cat ? (
                    <input
                      autoFocus
                      defaultValue={cat}
                      onClick={e => e.stopPropagation()}
                      onBlur={e => renameCategory(cat, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') renameCategory(cat, e.target.value)
                        if (e.key === 'Escape') setEditingCategoryId(null)
                      }}
                      className="flex-1 bg-white/10 border border-[#D9A441]/60 rounded-lg px-2 py-0.5 text-sm text-[#F5F5F5] mr-2 focus:outline-none"
                    />
                  ) : (
                    <span
                      onDoubleClick={e => { e.stopPropagation(); setEditingCategoryId(cat); setEditCategoryName(cat) }}
                      className={`text-sm font-semibold truncate ${allPacked ? 'text-[#D9A441]' : 'text-[#F5F5F5]'}`}
                    >
                      {cat}
                      {allPacked && <span className="ml-1.5 text-xs font-normal text-[#D9A441]/70">✓ done</span>}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-[#D6CFC2]/40">{catPacked}/{items.length}</span>
                  <button
                    onClick={() => deleteCategory(cat)}
                    className="text-white/20 hover:text-red-400 text-lg leading-none transition-colors"
                    aria-label={`Delete ${cat} category`}
                  >
                    ×
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <ul>
                  {visible.map((item, idx) => (
                    <li
                      key={item.id}
                      className={`px-4 py-3 ${idx < visible.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      {editingItemId === item.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            autoFocus
                            value={editItemName}
                            onChange={e => setEditItemName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEditItem(item.id); if (e.key === 'Escape') setEditingItemId(null) }}
                            placeholder="Item name"
                            className={`${inputCls} w-full`}
                          />
                          <div className="flex gap-2">
                            <select
                              value={editItemCategory}
                              onChange={e => setEditItemCategory(e.target.value)}
                              className={`${inputCls} flex-1`}
                            >
                              {trip.categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input
                              type="number"
                              value={editItemQty}
                              onChange={e => setEditItemQty(e.target.value)}
                              min="1"
                              placeholder="Qty"
                              className={`${inputCls} w-16`}
                            />
                          </div>
                          <input
                            type="text"
                            value={editItemWeight}
                            onChange={e => setEditItemWeight(e.target.value)}
                            placeholder="e.g. 24 oz, 1 lb 4 oz"
                            className={`${inputCls} w-full`}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingItemId(null)} className="tap flex-1 border border-white/15 text-[#D6CFC2]/60 py-1.5 rounded-full text-xs transition-all duration-300">Cancel</button>
                            <button onClick={() => saveEditItem(item.id)} disabled={!editItemName.trim()} className="tap flex-1 bg-[#D9A441] text-[#2B2B2B] font-semibold py-1.5 rounded-full text-xs disabled:opacity-40 transition-all duration-300">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleItem(item.id)}
                            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                              item.checked ? 'bg-[#D9A441] border-[#D9A441]' : 'border-white/25'
                            }`}
                          >
                            {item.checked && (
                              <svg className="w-3 h-3 text-[#2B2B2B]" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <span className={`text-sm transition-all duration-300 ${item.checked ? 'line-through text-[#D6CFC2]/35' : 'text-[#F5F5F5]'}`}>
                              {item.name}
                              {item.quantity > 1 && <span className="text-[#D6CFC2]/40 ml-1">×{item.quantity}</span>}
                            </span>
                            {editingWeightId === item.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editWeightValue}
                                  onChange={e => setEditWeightValue(e.target.value)}
                                  onBlur={() => saveItemWeight(item.id, editWeightValue)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') saveItemWeight(item.id, editWeightValue)
                                    if (e.key === 'Escape') setEditingWeightId(null)
                                  }}
                                  placeholder="e.g. 24 oz"
                                  className="w-28 bg-white/10 border border-[#D9A441]/60 rounded-lg px-1.5 py-0.5 text-xs text-[#F5F5F5] focus:outline-none"
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingWeightId(item.id)
                                  setEditWeightValue(item.weight != null ? formatWeight(item.weight, weightUnit) : '')
                                }}
                                className="block text-xs text-[#D6CFC2]/40 hover:text-[#D9A441] mt-0.5 transition-colors"
                              >
                                {item.weight ? formatWeight(item.weight * (item.quantity || 1), weightUnit) : '+ weight'}
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => startEditItem(item)}
                            className="text-[#D6CFC2]/30 hover:text-[#D9A441] text-xs leading-none flex-shrink-0 transition-colors px-1"
                            aria-label={`Edit ${item.name}`}
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-white/15 hover:text-red-400 text-lg leading-none flex-shrink-0 transition-colors"
                            aria-label={`Remove ${item.name}`}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Per-category inline add */}
              {!isCollapsed && (
                inlineAddCat === cat ? (
                  <div className="px-3 py-2.5 border-t border-white/8 space-y-2">
                    <input
                      type="text"
                      autoFocus
                      value={inlineName}
                      onChange={e => setInlineName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') inlineAddItem(cat); if (e.key === 'Escape') setInlineAddCat(null) }}
                      placeholder="Item name"
                      className={`${inputCls} w-full`}
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inlineWeight}
                        onChange={e => setInlineWeight(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') inlineAddItem(cat); if (e.key === 'Escape') setInlineAddCat(null) }}
                        placeholder="e.g. 8 oz"
                        className={`${inputCls} flex-1`}
                      />
                      <input
                        type="number"
                        value={inlineQty}
                        onChange={e => setInlineQty(e.target.value)}
                        min="1"
                        placeholder="Qty"
                        className={`${inputCls} w-16`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setInlineAddCat(null)} className="tap flex-1 border border-white/15 text-[#D6CFC2]/60 py-1.5 rounded-full text-xs transition-all duration-300">Cancel</button>
                      <button onClick={() => inlineAddItem(cat)} disabled={!inlineName.trim()} className="tap flex-1 bg-[#D9A441] text-[#2B2B2B] font-semibold py-1.5 rounded-full text-xs disabled:opacity-40 transition-all duration-300">Add</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex border-t border-white/8">
                    <button
                      onClick={() => { setInlineAddCat(cat); setInlineName(''); setInlineWeight(''); setInlineQty('1') }}
                      className="tap flex-1 text-xs text-[#D9A441] py-2 px-3 text-left transition-colors"
                    >
                      + Custom item
                    </button>
                    <button
                      onClick={() => setShowGearPicker(true)}
                      className="tap text-xs text-[#D6CFC2]/60 py-2 px-3 border-l border-white/8 transition-colors"
                    >
                      📦 Library
                    </button>
                  </div>
                )
              )}
            </div>
          )
        })}
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-4 left-4 right-4 bg-[#1C1C1C]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2.5 flex gap-2 z-20">
        <button
          onClick={() => { setShowAddItem(v => !v); setShowAddCategory(false) }}
          className="tap flex-1 bg-[#D9A441] text-[#2B2B2B] font-semibold py-2.5 rounded-xl text-sm transition-all duration-300"
        >
          + Custom
        </button>
        <button
          onClick={() => setShowGearPicker(true)}
          className="tap flex-1 bg-white/[0.08] border border-white/15 text-[#D6CFC2] py-2.5 rounded-xl text-sm transition-all duration-300"
        >
          📦 Library
        </button>
        <button
          onClick={() => { setShowAddCategory(v => !v); setShowAddItem(false) }}
          className="tap flex-1 border border-white/15 text-[#D6CFC2]/70 py-2.5 rounded-xl text-sm transition-all duration-300"
        >
          + Category
        </button>
      </div>

      {showGearPicker && (
        <GearPicker
          gearItems={gearItems}
          existingNames={new Set(trip.items.map(i => i.name.toLowerCase()))}
          onAdd={addFromLibrary}
          onClose={() => setShowGearPicker(false)}
        />
      )}
    </div>
  )
}
