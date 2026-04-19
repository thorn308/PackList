const KEYS = {
  trips: 'packlist_trips',
  templates: 'packlist_templates',
  gear: 'packlist_gear',
}

function normalizeItem(item) {
  return {
    id: item.id || uid(),
    name: item.name || '',
    category: item.category || 'Misc',
    quantity: item.quantity ?? 1,
    weight: item.weight ?? null,
    checked: item.checked ?? false,
  }
}

function normalizeTrip(trip) {
  return {
    destination: '',
    templateId: null,
    weightUnit: 'lb',
    createdAt: new Date(0).toISOString(),
    ...trip,
    id: trip.id || uid(),
    name: trip.name || 'Unnamed Trip',
    items: (trip.items || []).map(normalizeItem),
    categories: trip.categories?.length ? trip.categories : ['Misc'],
  }
}

function normalizeTemplateItem(item) {
  return {
    id: item.id || uid(),
    name: item.name || '',
    quantity: item.quantity ?? 1,
    weight: item.weight ?? null,
  }
}

function normalizeTemplateCategory(cat) {
  return {
    id: cat.id || uid(),
    name: cat.name || 'Misc',
    items: (cat.items || []).map(normalizeTemplateItem),
  }
}

function normalizeTemplate(tpl) {
  return {
    ...tpl,
    id: tpl.id || uid(),
    name: tpl.name || 'Unnamed Template',
    categories: (tpl.categories || []).map(normalizeTemplateCategory),
  }
}

function normalizeGearItem(item) {
  return {
    quantity: 1,
    weight: null,
    ...item,
    id: item.id || uid(),
    name: item.name || '',
    category: item.category || 'Misc',
  }
}

export function loadTrips() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.trips))
    return (stored || []).map(normalizeTrip)
  } catch {
    return []
  }
}

function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      window.dispatchEvent(new CustomEvent('storage-quota-exceeded'))
    }
  }
}

export function saveTrips(trips) { safeSave(KEYS.trips, trips) }

export function loadTemplates() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.templates))
    if (!stored) {
      const seeded = getDefaultTemplates()
      saveTemplates(seeded)
      return seeded
    }
    // Merge in any default templates the user doesn't have yet (by name)
    const storedNames = new Set(stored.map(t => t.name))
    const missing = getDefaultTemplates().filter(t => !storedNames.has(t.name))
    if (missing.length > 0) {
      const merged = [...stored, ...missing].map(normalizeTemplate)
      saveTemplates(merged)
      return merged
    }
    return stored.map(normalizeTemplate)
  } catch {
    return getDefaultTemplates()
  }
}

export function saveTemplates(templates) { safeSave(KEYS.templates, templates) }

export function loadGearItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.gear))
    if (stored) return stored.map(normalizeGearItem)
    const seeded = getDefaultGearItems()
    saveGearItems(seeded)
    return seeded
  } catch {
    return getDefaultGearItems()
  }
}

export function saveGearItems(items) { safeSave(KEYS.gear, items) }

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function getDefaultGearItems() {
  const item = (name, category, weight = null) => ({ id: uid(), name, category, weight })
  return [
    // Clothing
    item('Moisture-wicking shirt', 'Clothing', 0.4),
    item('Hiking pants', 'Clothing', 0.8),
    item('Convertible pants', 'Clothing', 0.9),
    item('Base layer top', 'Clothing', 0.5),
    item('Base layer bottom', 'Clothing', 0.4),
    item('Wool socks', 'Clothing', 0.2),
    item('Liner socks', 'Clothing', 0.1),
    item('Underwear', 'Clothing', 0.1),
    item('Sun hat', 'Clothing', 0.2),
    item('Gaiters', 'Clothing', 0.4),
    item('Buff / neck gaiter', 'Clothing', 0.1),
    // Outerwear
    item('Rain jacket', 'Outerwear', 1.0),
    item('Fleece jacket', 'Outerwear', 1.2),
    item('Down jacket', 'Outerwear', 1.5),
    item('Softshell jacket', 'Outerwear', 1.3),
    item('Wind shirt', 'Outerwear', 0.5),
    item('Ski jacket', 'Outerwear', 2.5),
    item('Ski pants / bibs', 'Outerwear', 2.0),
    item('Beanie', 'Outerwear', 0.2),
    item('Balaclava', 'Outerwear', 0.2),
    item('Gloves (liner)', 'Outerwear', 0.2),
    item('Gloves (insulated)', 'Outerwear', 0.5),
    // Footwear
    item('Hiking boots', 'Footwear', 2.5),
    item('Trail runners', 'Footwear', 1.8),
    item('Camp sandals', 'Footwear', 0.9),
    item('Wading boots', 'Footwear', 2.8),
    // Shelter & Sleep
    item('Tent (2-person)', 'Shelter & Sleep', 4.5),
    item('Tent (1-person)', 'Shelter & Sleep', 2.8),
    item('Bivy sack', 'Shelter & Sleep', 1.0),
    item('Tarp (silnylon)', 'Shelter & Sleep', 1.2),
    item('Sleeping bag (20°F)', 'Shelter & Sleep', 3.0),
    item('Sleeping bag (0°F)', 'Shelter & Sleep', 4.0),
    item('Quilt (30°F)', 'Shelter & Sleep', 1.8),
    item('Sleeping pad (inflatable)', 'Shelter & Sleep', 1.0),
    item('Sleeping pad (foam)', 'Shelter & Sleep', 0.8),
    // Gear
    item('Backpack (65L)', 'Gear', 4.5),
    item('Backpack (45L)', 'Gear', 3.5),
    item('Daypack (20L)', 'Gear', 1.5),
    item('Dry bags (set)', 'Gear', 0.5),
    item('Headlamp', 'Gear', 0.3),
    item('Lantern', 'Gear', 0.8),
    item('Trekking poles (pair)', 'Gear', 1.0),
    item('Bear canister', 'Gear', 2.8),
    item('Bear hang rope & bag', 'Gear', 0.5),
    item('Emergency blanket', 'Gear', 0.1),
    item('Paracord (50 ft)', 'Gear', 0.3),
    item('Multi-tool', 'Gear', 0.6),
    item('Fixed-blade knife', 'Gear', 0.5),
    item('Folding saw', 'Gear', 0.7),
    item('Hatchet', 'Gear', 1.8),
    item('Duct tape (small roll)', 'Gear', 0.2),
    // Navigation
    item('Topographic map', 'Navigation', 0.1),
    item('Compass', 'Navigation', 0.2),
    item('GPS device', 'Navigation', 0.4),
    item('Satellite communicator (inReach)', 'Navigation', 0.3),
    item('PLB', 'Navigation', 0.3),
    // Hunting
    item('Rifle', 'Hunting', 7.5),
    item('Shotgun', 'Hunting', 7.0),
    item('Muzzleloader', 'Hunting', 8.5),
    item('Bow (compound)', 'Hunting', 4.0),
    item('Crossbow', 'Hunting', 7.5),
    item('Ammunition (box of 20)', 'Hunting', 1.5),
    item('Shotgun shells (box of 25)', 'Hunting', 2.0),
    item('Arrows (dozen)', 'Hunting', 1.2),
    item('Hunting license', 'Hunting', 0.0),
    item('Tags / harvest permit', 'Hunting', 0.0),
    item('Binoculars (10x42)', 'Hunting', 1.6),
    item('Rangefinder', 'Hunting', 0.6),
    item('Spotting scope', 'Hunting', 3.5),
    item('Spotting scope tripod', 'Hunting', 2.5),
    item('Shooting sticks / bipod', 'Hunting', 1.2),
    item('Elk calls (set)', 'Hunting', 0.5),
    item('Deer calls (set)', 'Hunting', 0.3),
    item('Predator calls', 'Hunting', 0.3),
    item('Turkey calls', 'Hunting', 0.4),
    item('Decoys', 'Hunting', 2.0),
    item('Scent eliminator spray', 'Hunting', 0.6),
    item('Scent wafers', 'Hunting', 0.2),
    item('Orange vest', 'Hunting', 0.5),
    item('Orange hat', 'Hunting', 0.2),
    item('Tree stand', 'Hunting', 18.0),
    item('Climbing sticks (set)', 'Hunting', 8.0),
    item('Safety harness', 'Hunting', 2.5),
    item('Ground blind', 'Hunting', 12.0),
    item('Field dressing kit', 'Hunting', 0.8),
    item('Game bags (set of 4)', 'Hunting', 1.2),
    item('Meat pole / pack frame', 'Hunting', 3.0),
    item('Disposable gloves', 'Hunting', 0.1),
    item('Bone saw', 'Hunting', 0.6),
    item('Headlamp (hunting)', 'Hunting', 0.3),
    item('Trail cameras', 'Hunting', 0.8),
    // Fishing
    item('Fishing rod & reel', 'Fishing', 1.5),
    item('Tackle box', 'Fishing', 2.0),
    item('Fly fishing vest', 'Fishing', 1.0),
    item('Waders', 'Fishing', 4.0),
    item('Fishing license', 'Fishing', 0.0),
    item('Net', 'Fishing', 0.8),
    item('Cooler (small)', 'Fishing', 3.5),
    // Hydration
    item('Water bottle (1L)', 'Hydration', 0.3),
    item('Hydration bladder (2L)', 'Hydration', 0.4),
    item('Water filter (Sawyer Squeeze)', 'Hydration', 0.2),
    item('Water filter (Katadyn)', 'Hydration', 1.0),
    item('Purification tablets', 'Hydration', 0.1),
    item('UV purifier (Steripen)', 'Hydration', 0.3),
    // Food & Cooking
    item('Camp stove (canister)', 'Food & Cooking', 0.8),
    item('Fuel canister (100g)', 'Food & Cooking', 0.5),
    item('Cook pot (0.9L)', 'Food & Cooking', 0.5),
    item('Utensil set', 'Food & Cooking', 0.2),
    item('Lightweight spork', 'Food & Cooking', 0.05),
    item('Freeze-dried meal', 'Food & Cooking', 0.5),
    item('Energy bars (box of 6)', 'Food & Cooking', 0.8),
    item('Trail mix (1 lb)', 'Food & Cooking', 1.0),
    item('Instant coffee (pack)', 'Food & Cooking', 0.1),
    item('Bear spray', 'Food & Cooking', 0.9),
    // First Aid
    item('First aid kit', 'First Aid', 1.0),
    item('Blister kit', 'First Aid', 0.2),
    item('Tourniquet (CAT)', 'First Aid', 0.4),
    item('Ace bandage', 'First Aid', 0.3),
    item('SAM splint', 'First Aid', 0.2),
    item('Ibuprofen', 'First Aid', 0.1),
    item('Antihistamine', 'First Aid', 0.1),
    item('Moleskin', 'First Aid', 0.1),
    item('Medical tape', 'First Aid', 0.1),
    item('Irrigation syringe', 'First Aid', 0.1),
    // Toiletries
    item('Toothbrush & toothpaste', 'Toiletries', 0.3),
    item('Biodegradable soap', 'Toiletries', 0.5),
    item('Hand sanitizer', 'Toiletries', 0.3),
    item('Sunscreen SPF 50+', 'Toiletries', 0.5),
    item('Insect repellent (DEET)', 'Toiletries', 0.4),
    item('Lip balm with SPF', 'Toiletries', 0.1),
    item('Toilet paper', 'Toiletries', 0.3),
    item('Trowel (cat hole)', 'Toiletries', 0.2),
    item('Waste bags', 'Toiletries', 0.1),
    item('Deodorant', 'Toiletries', 0.3),
    item('Razor', 'Toiletries', 0.2),
    // Electronics
    item('Headlamp (spare batteries)', 'Electronics', 0.2),
    item('Power bank (10000mAh)', 'Electronics', 0.7),
    item('Solar charger panel', 'Electronics', 0.8),
    item('Walkie-talkie (pair)', 'Electronics', 1.0),
    item('Action camera', 'Electronics', 0.4),
    item('Camera battery (spare)', 'Electronics', 0.1),
    item('Charging cables', 'Electronics', 0.2),
    // Documents
    item('Government-issued ID', 'Documents', 0.0),
    item('Passport', 'Documents', 0.1),
    item('Land access permit', 'Documents', 0.0),
    item('Vehicle registration', 'Documents', 0.0),
    item('Emergency contact sheet', 'Documents', 0.0),
    item('Topo map (printed)', 'Documents', 0.1),
  ]
}

export function getDefaultTemplates() {
  return [
    {
      id: uid(),
      name: 'Beach Trip',
      categories: [
        {
          id: uid(),
          name: 'Clothing',
          items: [
            { id: uid(), name: 'Swimsuit', quantity: 2 },
            { id: uid(), name: 'Cover-up', quantity: 1 },
            { id: uid(), name: 'Shorts', quantity: 3 },
            { id: uid(), name: 'T-shirts', quantity: 3 },
            { id: uid(), name: 'Sandals', quantity: 1 },
            { id: uid(), name: 'Flip flops', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Gear',
          items: [
            { id: uid(), name: 'Beach towel', quantity: 2 },
            { id: uid(), name: 'Sunscreen SPF 50+', quantity: 1 },
            { id: uid(), name: 'Sunglasses', quantity: 1 },
            { id: uid(), name: 'Beach bag', quantity: 1 },
            { id: uid(), name: 'Umbrella / shade tent', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Toiletries',
          items: [
            { id: uid(), name: 'Toothbrush & toothpaste', quantity: 1 },
            { id: uid(), name: 'Shampoo & conditioner', quantity: 1 },
            { id: uid(), name: 'After-sun lotion', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Documents',
          items: [
            { id: uid(), name: 'ID / passport', quantity: 1 },
            { id: uid(), name: 'Travel insurance', quantity: 1 },
            { id: uid(), name: 'Hotel confirmation', quantity: 1 },
          ],
        },
      ],
    },
    {
      id: uid(),
      name: 'Camping / Backpacking',
      categories: [
        {
          id: uid(),
          name: 'Clothing',
          items: [
            { id: uid(), name: 'Moisture-wicking shirts', quantity: 3 },
            { id: uid(), name: 'Hiking pants', quantity: 2 },
            { id: uid(), name: 'Wool socks', quantity: 4 },
            { id: uid(), name: 'Underwear', quantity: 4 },
            { id: uid(), name: 'Hiking boots', quantity: 1 },
            { id: uid(), name: 'Camp shoes / sandals', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Outerwear',
          items: [
            { id: uid(), name: 'Rain jacket', quantity: 1 },
            { id: uid(), name: 'Fleece / mid layer', quantity: 1 },
            { id: uid(), name: 'Hat / beanie', quantity: 1 },
            { id: uid(), name: 'Gloves', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Gear',
          items: [
            { id: uid(), name: 'Tent', quantity: 1 },
            { id: uid(), name: 'Sleeping bag', quantity: 1 },
            { id: uid(), name: 'Sleeping pad', quantity: 1 },
            { id: uid(), name: 'Backpack', quantity: 1 },
            { id: uid(), name: 'Headlamp + batteries', quantity: 1 },
            { id: uid(), name: 'Water filter / purification tabs', quantity: 1 },
            { id: uid(), name: 'Trekking poles', quantity: 1 },
            { id: uid(), name: 'Map & compass', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Toiletries',
          items: [
            { id: uid(), name: 'Toothbrush & toothpaste', quantity: 1 },
            { id: uid(), name: 'Biodegradable soap', quantity: 1 },
            { id: uid(), name: 'Sunscreen', quantity: 1 },
            { id: uid(), name: 'Insect repellent', quantity: 1 },
            { id: uid(), name: 'Toilet paper', quantity: 1 },
            { id: uid(), name: 'Hand sanitizer', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Food & Drink',
          items: [
            { id: uid(), name: 'Camp stove + fuel', quantity: 1 },
            { id: uid(), name: 'Cook pot & utensils', quantity: 1 },
            { id: uid(), name: 'Water bottles (1L)', quantity: 2 },
            { id: uid(), name: 'Trail snacks', quantity: 1 },
            { id: uid(), name: 'Freeze-dried meals', quantity: 3 },
          ],
        },
      ],
    },
    {
      id: uid(),
      name: 'Business Travel',
      categories: [
        {
          id: uid(),
          name: 'Clothing',
          items: [
            { id: uid(), name: 'Dress shirts / blouses', quantity: 3 },
            { id: uid(), name: 'Dress pants / skirts', quantity: 2 },
            { id: uid(), name: 'Blazer / jacket', quantity: 1 },
            { id: uid(), name: 'Dress shoes', quantity: 1 },
            { id: uid(), name: 'Casual outfit', quantity: 1 },
            { id: uid(), name: 'Socks & underwear', quantity: 4 },
          ],
        },
        {
          id: uid(),
          name: 'Electronics',
          items: [
            { id: uid(), name: 'Laptop', quantity: 1 },
            { id: uid(), name: 'Laptop charger', quantity: 1 },
            { id: uid(), name: 'Phone charger', quantity: 1 },
            { id: uid(), name: 'Power bank', quantity: 1 },
            { id: uid(), name: 'Universal adapter', quantity: 1 },
            { id: uid(), name: 'Earbuds / headphones', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Documents',
          items: [
            { id: uid(), name: 'Passport / ID', quantity: 1 },
            { id: uid(), name: 'Business cards', quantity: 1 },
            { id: uid(), name: 'Flight itinerary', quantity: 1 },
            { id: uid(), name: 'Hotel confirmation', quantity: 1 },
            { id: uid(), name: 'Expense receipts folder', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Toiletries',
          items: [
            { id: uid(), name: 'Toothbrush & toothpaste', quantity: 1 },
            { id: uid(), name: 'Deodorant', quantity: 1 },
            { id: uid(), name: 'Razor', quantity: 1 },
            { id: uid(), name: 'Hair products', quantity: 1 },
          ],
        },
      ],
    },
    {
      id: uid(),
      name: 'Ski Trip',
      categories: [
        {
          id: uid(),
          name: 'Clothing',
          items: [
            { id: uid(), name: 'Thermal base layer (top)', quantity: 2 },
            { id: uid(), name: 'Thermal base layer (bottom)', quantity: 2 },
            { id: uid(), name: 'Ski socks', quantity: 3 },
            { id: uid(), name: 'Underwear', quantity: 4 },
            { id: uid(), name: 'Après-ski outfit', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Outerwear',
          items: [
            { id: uid(), name: 'Ski jacket', quantity: 1 },
            { id: uid(), name: 'Ski pants / bibs', quantity: 1 },
            { id: uid(), name: 'Fleece / mid layer', quantity: 1 },
            { id: uid(), name: 'Ski gloves / mittens', quantity: 1 },
            { id: uid(), name: 'Neck gaiter / balaclava', quantity: 1 },
            { id: uid(), name: 'Warm hat', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Gear',
          items: [
            { id: uid(), name: 'Ski helmet', quantity: 1 },
            { id: uid(), name: 'Goggles', quantity: 1 },
            { id: uid(), name: 'Ski boots', quantity: 1 },
            { id: uid(), name: 'Skis / snowboard (or rental info)', quantity: 1 },
            { id: uid(), name: 'Ski poles', quantity: 1 },
            { id: uid(), name: 'Boot bag', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Toiletries',
          items: [
            { id: uid(), name: 'Lip balm with SPF', quantity: 1 },
            { id: uid(), name: 'Sunscreen SPF 50+', quantity: 1 },
            { id: uid(), name: 'Moisturizer', quantity: 1 },
            { id: uid(), name: 'Toothbrush & toothpaste', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Documents',
          items: [
            { id: uid(), name: 'Lift tickets / ski pass', quantity: 1 },
            { id: uid(), name: 'ID / passport', quantity: 1 },
            { id: uid(), name: 'Lodging confirmation', quantity: 1 },
          ],
        },
      ],
    },
    {
      id: uid(),
      name: 'Hunting Pack List',
      categories: [
        {
          id: uid(),
          name: 'Individual',
          items: [
            { id: uid(), name: 'Rifle', quantity: 1 },
            { id: uid(), name: 'Ammo', quantity: 80 },
            { id: uid(), name: 'Cleaning kit — plastic case', quantity: 1 },
            { id: uid(), name: 'Cleaning kit — brush', quantity: 1 },
            { id: uid(), name: 'Cleaning kit — oil', quantity: 1 },
            { id: uid(), name: 'Cleaning kit — patches w/ rod', quantity: 1 },
            { id: uid(), name: 'Cleaning kit — bore snake', quantity: 1 },
            { id: uid(), name: 'Tool kit', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'Pistol',
          items: [
            { id: uid(), name: 'Pistol ammo', quantity: 40 },
            { id: uid(), name: 'Pistol cleaning kit', quantity: 1 },
            { id: uid(), name: 'Bear spray', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'In Camp',
          items: [
            { id: uid(), name: 'Camp chair', quantity: 1 },
            { id: uid(), name: 'External battery (phone charger)', quantity: 1 },
            { id: uid(), name: 'Air mattress', quantity: 1 },
            { id: uid(), name: 'Sleeping bag / quilt', quantity: 1 },
            { id: uid(), name: 'Pillow', quantity: 1 },
            { id: uid(), name: 'Hygiene kit', quantity: 1 },
            { id: uid(), name: 'Camp coffee cup (non-spill)', quantity: 1 },
            { id: uid(), name: 'Camp water bottle', quantity: 1 },
            { id: uid(), name: 'Extra batteries', quantity: 1 },
            { id: uid(), name: 'Bug spray', quantity: 1 },
          ],
        },
        {
          id: uid(),
          name: 'In Your Pack',
          items: [
            { id: uid(), name: 'Water / CamelBak / water bladder', quantity: 1 },
            { id: uid(), name: 'Water filter / Steripen', quantity: 1 },
            { id: uid(), name: '550 cord', quantity: 1 },
            { id: uid(), name: 'Jet Boil / cook stove', quantity: 1 },
            { id: uid(), name: 'Coffee cup or shaker bottle', quantity: 1 },
            { id: uid(), name: 'Snacks / food', quantity: 1 },
            { id: uid(), name: 'Ultima packets', quantity: 1 },
            { id: uid(), name: 'Coffee packets', quantity: 1 },
            { id: uid(), name: 'Spoon', quantity: 1 },
            { id: uid(), name: 'Game bags (enough for whole animal)', quantity: 1 },
            { id: uid(), name: 'Kill kit — 550 cord', quantity: 1 },
            { id: uid(), name: 'Kill kit — plastic bag', quantity: 1 },
            { id: uid(), name: 'Game knife w/ extra blades or sharpener', quantity: 1 },
            { id: uid(), name: 'Headlamp (bright)', quantity: 1 },
            { id: uid(), name: 'Lighter / fire kit', quantity: 1 },
          ],
        },
      ],
    },
  ]
}
