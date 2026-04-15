/**
 * Parse a flexible weight string into a stored lb value.
 *
 * Accepts:
 *   "2.5"           → 2.5 lb (bare number treated as lb)
 *   "2.5 lb"        → 2.5 lb
 *   "24 oz"         → 1.5 lb
 *   "1 lb 4 oz"     → 1.25 lb
 *   "500 g"         → 1.102 lb
 *   "1.2 kg"        → 2.646 lb
 *
 * Returns null for empty / unparseable input.
 */
export function parseWeightInput(str) {
  if (!str || !str.trim()) return null
  const s = str.trim().toLowerCase()

  // Combined: "1 lb 4 oz", "1lb4oz", etc.
  const combined = s.match(/(\d+\.?\d*)\s*lbs?\s+(\d+\.?\d*)\s*oz/)
  if (combined) {
    const lbs = parseFloat(combined[1]) + parseFloat(combined[2]) / 16
    return round(lbs)
  }

  // oz only
  const ozMatch = s.match(/^(\d+\.?\d*)\s*oz/)
  if (ozMatch) return round(parseFloat(ozMatch[1]) / 16)

  // lb / lbs
  const lbMatch = s.match(/^(\d+\.?\d*)\s*lbs?/)
  if (lbMatch) return round(parseFloat(lbMatch[1]))

  // kg
  const kgMatch = s.match(/^(\d+\.?\d*)\s*kg/)
  if (kgMatch) return round(parseFloat(kgMatch[1]) * 2.20462)

  // g (must end with g to avoid matching "lbs" etc.)
  const gMatch = s.match(/^(\d+\.?\d*)\s*g$/)
  if (gMatch) return round(parseFloat(gMatch[1]) / 453.592)

  // Plain number → lb
  const plain = parseFloat(s)
  if (!isNaN(plain) && plain >= 0) return round(plain)

  return null
}

function round(n) {
  return Math.round(n * 10000) / 10000
}

/**
 * Convert a stored lb value to the display unit.
 */
export function convertWeight(lbs, unit) {
  if (lbs == null) return null
  switch (unit) {
    case 'oz': return Math.round(lbs * 16 * 100) / 100
    case 'kg': return Math.round(lbs * 0.453592 * 1000) / 1000
    case 'g':  return Math.round(lbs * 453.592 * 10) / 10
    default:   return Math.round(lbs * 100) / 100 // lb
  }
}

/**
 * Format a stored lb value into a display string.
 */
export function formatWeight(lbs, unit = 'lb') {
  if (!lbs) return null
  return `${convertWeight(lbs, unit)} ${unit}`
}
