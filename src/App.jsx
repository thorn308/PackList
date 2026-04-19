import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { loadTrips, saveTrips, loadTemplates, saveTemplates, loadGearItems, saveGearItems } from './utils/storage'
import Home from './components/Home'
import TripDetail from './components/TripDetail'
const Templates = lazy(() => import('./components/Templates'))
const TemplateEditor = lazy(() => import('./components/TemplateEditor'))
const GearLibrary = lazy(() => import('./components/GearLibrary'))

const TABS = [
  { id: 'Trips', label: '⛺ Trips' },
  { id: 'Templates', label: '🗺️ Templates' },
  { id: 'Gear', label: '📦 Gear' },
]

function toCsvRows(rows) {
  return rows.map(r => r.map(cell => {
    const s = String(cell ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')).join('\n')
}

function downloadCsv(filename, rows) {
  const blob = new Blob([toCsvRows(rows)], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportTrips(trips) {
  const rows = [['Trip', 'Destination', 'Category', 'Item', 'Packed', 'Weight (lb)']]
  for (const trip of trips) {
    if (trip.items.length === 0) {
      rows.push([trip.name, trip.destination || '', '', '', '', ''])
    } else {
      for (const item of trip.items) {
        rows.push([trip.name, trip.destination || '', item.category, item.name, item.checked ? 'Yes' : 'No', item.weight ?? ''])
      }
    }
  }
  downloadCsv('trips.csv', rows)
}

function exportGear(gearItems) {
  const rows = [['Name', 'Category', 'Weight (lb)']]
  for (const item of gearItems) {
    rows.push([item.name, item.category, item.weight ?? ''])
  }
  downloadCsv('gear-library.csv', rows)
}

function exportTemplates(templates) {
  const rows = [['Template', 'Category', 'Item', 'Weight (lb)']]
  for (const tpl of templates) {
    for (const cat of tpl.categories) {
      if (cat.items.length === 0) {
        rows.push([tpl.name, cat.name, '', ''])
      } else {
        for (const item of cat.items) {
          rows.push([tpl.name, cat.name, item.name, item.weight ?? ''])
        }
      }
    }
  }
  downloadCsv('templates.csv', rows)
}

function TopoBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g stroke="#D6CFC2" strokeWidth="1.2" opacity="0.06">
          <path d="M-60,80 C60,30 160,110 280,60 S420,10 520,80" />
          <path d="M-60,160 C70,105 180,190 300,135 S440,80 520,155" />
          <path d="M-60,250 C50,195 170,275 300,215 S440,165 520,245" />
          <path d="M-60,345 C65,285 185,370 310,305 S445,255 520,340" />
          <path d="M-60,445 C75,390 195,465 315,405 S450,355 520,440" />
          <path d="M-60,550 C80,495 200,570 325,510 S455,460 520,545" />
          <path d="M-60,660 C70,605 195,680 320,620 S455,570 520,655" />
          <path d="M-60,775 C85,720 205,795 330,735 S460,685 520,770" />
          <path d="M-60,880 C90,830 210,895 335,840 S460,795 520,875" />
          {/* Inner relief lines */}
          <path d="M-60,115 C65,68 170,148 290,98 S430,48 520,118" opacity="0.5" />
          <path d="M-60,295 C58,242 175,322 305,260 S443,210 520,292" opacity="0.5" />
          <path d="M-60,500 C78,445 198,518 320,458 S452,408 520,495" opacity="0.5" />
          <path d="M-60,710 C72,655 198,728 322,668 S456,618 520,705" opacity="0.5" />
        </g>
      </svg>
    </div>
  )
}

export default function App() {
  const [trips, setTrips] = useState(() => loadTrips())
  const [templates, setTemplates] = useState(() => loadTemplates())
  const [gearItems, setGearItems] = useState(() => loadGearItems())
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('packlist_tab') || 'Trips')
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null) // null | 'new' | template object
  const [storageWarning, setStorageWarning] = useState(false)
  const [undoState, setUndoState] = useState(null)
  const undoTimer = useRef(null)
  const [tripForm, setTripForm] = useState({ showForm: false, name: '', destination: '', templateId: '', nameTouched: false })

  const showUndo = useCallback((message, onUndo) => {
    clearTimeout(undoTimer.current)
    setUndoState({ message, onUndo })
    undoTimer.current = setTimeout(() => setUndoState(null), 5000)
  }, [])

  useEffect(() => { saveTrips(trips) }, [trips])
  useEffect(() => { saveTemplates(templates) }, [templates])
  useEffect(() => { saveGearItems(gearItems) }, [gearItems])

  useEffect(() => {
    const handler = () => setStorageWarning(true)
    window.addEventListener('storage-quota-exceeded', handler)
    return () => window.removeEventListener('storage-quota-exceeded', handler)
  }, [])

  function handleSaveTrip(trip) {
    setTrips(prev => {
      const existing = prev.findIndex(t => t.id === trip.id)
      return existing >= 0
        ? prev.map(t => t.id === trip.id ? trip : t)
        : [...prev, trip]
    })
  }

  function handleDeleteTrip(id) {
    const deleted = trips.find(t => t.id === id)
    setTrips(prev => prev.filter(t => t.id !== id))
    if (selectedTripId === id) setSelectedTripId(null)
    if (deleted) showUndo(`"${deleted.name}" deleted`, () => setTrips(prev => [...prev, deleted]))
  }

  function handleUpdateTrip(trip) {
    setTrips(prev => prev.map(t => t.id === trip.id ? trip : t))
  }

  function handleSaveTemplate(tpl) {
    setTemplates(prev => {
      const existing = prev.findIndex(t => t.id === tpl.id)
      return existing >= 0
        ? prev.map(t => t.id === tpl.id ? tpl : t)
        : [...prev, tpl]
    })
  }

  function handleDeleteTemplate(id) {
    const deleted = templates.find(t => t.id === id)
    setTemplates(prev => prev.filter(t => t.id !== id))
    if (deleted) showUndo(`"${deleted.name}" deleted`, () => setTemplates(prev => [...prev, deleted]))
  }

  const selectedTrip = trips.find(t => t.id === selectedTripId) || null

  return (
    <div className="min-h-screen bg-[#2B2B2B] relative">
      {storageWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/90 backdrop-blur-sm text-white text-sm px-4 py-3 flex items-center justify-between" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}>
          <span>Storage full — some changes may not have saved. Free up space by exporting and deleting old trips.</span>
          <button onClick={() => setStorageWarning(false)} className="ml-4 text-white/70 hover:text-white flex-shrink-0">×</button>
        </div>
      )}
      <TopoBackground />

      <div className="relative z-10">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 rounded-full border-2 border-[#D9A441] border-t-transparent animate-spin" /></div>}>
        {selectedTrip ? (
          <TripDetail
            trip={selectedTrip}
            onBack={() => setSelectedTripId(null)}
            onUpdateTrip={handleUpdateTrip}
            gearItems={gearItems}
          />
        ) : editingTemplate !== null ? (
          <TemplateEditor
            template={editingTemplate === 'new' ? null : editingTemplate}
            gearItems={gearItems}
            onSave={tpl => { handleSaveTemplate(tpl); setEditingTemplate(null) }}
            onCancel={() => setEditingTemplate(null)}
          />
        ) : (
          <>
            <main style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
              {activeTab === 'Trips' && (
                <Home
                  trips={trips}
                  templates={templates}
                  onSaveTrip={handleSaveTrip}
                  onDeleteTrip={handleDeleteTrip}
                  onSelectTrip={setSelectedTripId}
                  tripForm={tripForm}
                  onTripFormChange={setTripForm}
                  onExportTrips={() => exportTrips(trips)}
                  onExportTemplates={() => exportTemplates(templates)}
                  onExportGear={() => exportGear(gearItems)}
                />
              )}
              {activeTab === 'Templates' && (
                <Templates
                  templates={templates}
                  onEdit={setEditingTemplate}
                  onDeleteTemplate={handleDeleteTemplate}
                />
              )}
              {activeTab === 'Gear' && (
                <GearLibrary
                  gearItems={gearItems}
                  onSaveGearItems={setGearItems}
                />
              )}
            </main>

            {/* Undo toast */}
            {undoState && (
              <div className="fixed left-4 right-4 z-30 bg-[#1C1C1C]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
                <span className="text-sm text-[#F5F5F5]">{undoState.message}</span>
                <button onClick={() => { undoState.onUndo(); clearTimeout(undoTimer.current); setUndoState(null) }} className="tap text-[#D9A441] font-semibold text-sm ml-4 flex-shrink-0">Undo</button>
              </div>
            )}

            {/* Floating pill nav */}
            <nav className="fixed left-4 right-4 bg-[#1C1C1C]/90 backdrop-blur-xl border border-white/10 rounded-2xl flex overflow-hidden z-20" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); localStorage.setItem('packlist_tab', tab.id) }}
                  className={`flex-1 py-3.5 text-sm font-medium transition-colors duration-300 tap ${
                    activeTab === tab.id
                      ? 'text-[#D9A441]'
                      : 'text-[#D6CFC2]/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </>
        )}
        </Suspense>
      </div>
    </div>
  )
}
