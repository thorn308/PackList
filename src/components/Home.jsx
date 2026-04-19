import { useState } from 'react'
import { uid } from '../utils/uid'
import ProgressBar from './ProgressBar'

const DEFAULT_CATEGORIES = [
  'Clothing', 'Outerwear', 'Gear', 'Toiletries',
  'Documents', 'Electronics', 'Food & Drink', 'Misc',
]

export default function Home({ trips, templates, onSaveTrip, onDeleteTrip, onSelectTrip, tripForm, onTripFormChange }) {
  const { showForm, name, destination, templateId, nameTouched } = tripForm
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const sortedTrips = [...trips].sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0
    if (!a.createdAt) return 1
    if (!b.createdAt) return -1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  function packedCount(trip) {
    return trip.items.filter(i => i.checked).length
  }

  function createTrip() {
    if (!name.trim()) { onTripFormChange(p => ({ ...p, nameTouched: true })); return }

    let items = []
    if (templateId) {
      const tpl = templates.find(t => t.id === templateId)
      if (tpl) {
        items = tpl.categories.flatMap(cat =>
          cat.items.map(item => ({
            id: uid(),
            name: item.name,
            quantity: item.quantity,
            weight: item.weight || null,
            category: cat.name,
            checked: false,
          }))
        )
      }
    }

    const trip = {
      id: uid(),
      name: name.trim(),
      destination: destination.trim(),
      templateId: templateId || null,
      items,
      categories: templateId
        ? templates.find(t => t.id === templateId)?.categories.map(c => c.name) || DEFAULT_CATEGORIES
        : DEFAULT_CATEGORIES,
      weightUnit: 'lb',
      createdAt: new Date().toISOString(),
    }

    onSaveTrip(trip)
    onTripFormChange({ showForm: false, name: '', destination: '', templateId: '', nameTouched: false })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[32px] font-bold text-[#F5F5F5] tracking-tight leading-tight">My Trips</h1>
        <button
          onClick={() => onTripFormChange(p => ({ ...p, showForm: !p.showForm }))}
          className="tap bg-[#D9A441] text-[#2B2B2B] font-semibold px-5 py-2 rounded-full text-sm transition-all duration-300"
        >
          {showForm ? 'Cancel' : '+ New Trip'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-[#F5F5F5] mb-4 text-base">New Trip</h2>

          <label className="block text-xs text-[#D6CFC2]/70 mb-1.5 font-medium uppercase tracking-wide">Trip name *</label>
          <input
            type="text"
            value={name}
            onChange={e => onTripFormChange(p => ({ ...p, name: e.target.value }))}
            onBlur={() => onTripFormChange(p => ({ ...p, nameTouched: true }))}
            placeholder="e.g. Fall Elk Hunt"
            autoFocus
            className={`w-full bg-white/[0.08] border rounded-xl px-3 py-2.5 text-base text-[#F5F5F5] placeholder:text-[#D6CFC2]/35 focus:outline-none focus:ring-1 mb-1 ${nameTouched && !name.trim() ? 'border-red-400/60 focus:ring-red-400/40' : 'border-white/15 focus:ring-[#D9A441]/60'}`}
          />
          {nameTouched && !name.trim() && (
            <p className="text-xs text-red-400 mb-2 px-1">Trip name is required</p>
          )}

          <label className="block text-xs text-[#D6CFC2]/70 mb-1.5 font-medium uppercase tracking-wide">Destination</label>
          <input
            type="text"
            value={destination}
            onChange={e => onTripFormChange(p => ({ ...p, destination: e.target.value }))}
            placeholder="e.g. Rocky Mountain National Park"
            className="w-full bg-white/[0.08] border border-white/15 rounded-xl px-3 py-2.5 text-base text-[#F5F5F5] placeholder:text-[#D6CFC2]/35 focus:outline-none focus:ring-1 focus:ring-[#D9A441]/60 mb-3"
          />

          <label className="block text-xs text-[#D6CFC2]/70 mb-1.5 font-medium uppercase tracking-wide">Template</label>
          <select
            value={templateId}
            onChange={e => onTripFormChange(p => ({ ...p, templateId: e.target.value }))}
            className="w-full bg-white/[0.08] border border-white/15 rounded-xl px-3 py-2.5 text-base text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#D9A441]/60 mb-5"
          >
            <option value="">— Blank list —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <button
            onClick={createTrip}
            disabled={!name.trim()}
            className="tap w-full bg-[#D9A441] text-[#2B2B2B] font-semibold py-3 rounded-full text-sm disabled:opacity-40 transition-all duration-300"
          >
            Create Trip
          </button>
        </div>
      )}

      {trips.length === 0 && !showForm && (
        <div className="text-center py-20 text-[#D6CFC2]/50">
          <div className="text-5xl mb-4">⛺</div>
          <p className="text-base text-[#F5F5F5]/70">No trips yet.</p>
          <p className="text-sm mt-1">Tap <strong className="text-[#D9A441]">+ New Trip</strong> to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {sortedTrips.map(trip => {
          const packed = packedCount(trip)
          const total = trip.items.length
          return (
            <div
              key={trip.id}
              onClick={() => onSelectTrip(trip.id)}
              className="tap bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl p-4 cursor-pointer transition-all duration-300 active:bg-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-[#F5F5F5] text-base">{trip.name}</h3>
                  {trip.destination && (
                    <p className="text-xs text-[#D6CFC2]/60 mt-0.5">{trip.destination}</p>
                  )}
                </div>
                {pendingDeleteId === trip.id ? (
                  <div className="flex gap-1.5 ml-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => { e.stopPropagation(); setPendingDeleteId(null) }}
                      className="tap text-xs text-[#D6CFC2]/60 border border-white/15 rounded-full px-2.5 py-1 transition-all duration-300"
                    >Cancel</button>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteTrip(trip.id) }}
                      className="tap text-xs text-red-400 border border-red-400/30 rounded-full px-2.5 py-1 transition-all duration-300"
                    >Delete</button>
                  </div>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); setPendingDeleteId(trip.id) }}
                    className="text-white/20 hover:text-red-400 text-xl leading-none ml-2 p-1 transition-colors flex-shrink-0"
                    aria-label="Delete trip"
                  >×</button>
                )}
              </div>
              {total === 0
                ? <p className="text-xs text-[#D6CFC2]/40">No items yet — tap to add some.</p>
                : <ProgressBar packed={packed} total={total} />
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
