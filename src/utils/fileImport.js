import Papa from 'papaparse'
import { uid } from './uid'

/**
 * Parse an uploaded file into template categories + items.
 * Expected format for CSV/XLSX: two columns — Category, Item
 * Expected format for DOCX: lines of "Category: Item" or "Category" headers + indented items
 *
 * Returns: { name: string, categories: Category[] } or throws on failure.
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'csv') return parseCsv(file)
  if (ext === 'xlsx' || ext === 'xls') return parseXlsx(file)
  if (ext === 'docx' || ext === 'doc') return parseDocx(file)

  throw new Error(`Unsupported file type: .${ext}`)
}

async function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          resolve(rowsToTemplate(data, file.name))
        } catch (e) {
          reject(e)
        }
      },
      error: reject,
    })
  })
}

async function parseXlsx(file) {
  const buf = await file.arrayBuffer()
  const XLSX = await import('xlsx')
  let wb
  try {
    wb = XLSX.read(buf, { type: 'array' })
  } catch {
    throw new Error('Could not read Excel file — it may be corrupted.')
  }
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  return rowsToTemplate(rows, file.name)
}

async function parseDocx(file) {
  // mammoth is large; import dynamically to avoid bundle bloat if unused
  const mammoth = await import('mammoth')
  const buf = await file.arrayBuffer()
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf })
  const lines = value.split('\n').map(l => l.trim()).filter(Boolean)
  return linesToTemplate(lines, file.name)
}

/**
 * Converts 2-column rows [Category, Item] into template shape.
 * Rows where column B is empty are treated as category headers.
 */
function rowsToTemplate(rows, fileName) {
  const categoryMap = new Map()
  const categoryOrder = []

  // Skip header row if first row looks like column labels
  const start = isHeaderRow(rows[0]) ? 1 : 0

  for (let i = start; i < rows.length; i++) {
    const [cat, item] = rows[i]
    const catName = String(cat || '').trim()
    const itemName = String(item || '').trim()

    if (!catName) continue

    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, [])
      categoryOrder.push(catName)
    }

    if (itemName) {
      categoryMap.get(catName).push(itemName)
    }
  }

  if (categoryOrder.length === 0) throw new Error('No categories found in file.')

  return buildTemplate(categoryMap, categoryOrder, fileName)
}

function isHeaderRow(row) {
  if (!row) return false
  const first = String(row[0] || '').toLowerCase()
  const second = String(row[1] || '').toLowerCase()
  return (first === 'category' || first === 'cat') &&
    (second === 'item' || second === 'items' || second === 'name')
}

/**
 * Converts plain-text lines from DOCX into template shape.
 * Heuristic: a line with no leading whitespace and ending in ':' is a category.
 * Everything else is treated as an item under the last seen category.
 */
function linesToTemplate(lines, fileName) {
  const categoryMap = new Map()
  const categoryOrder = []
  let currentCat = null

  for (const line of lines) {
    const isCategoryLine = /^[A-Z]/.test(line) && (line.endsWith(':') || line.toUpperCase() === line)
    const catName = line.replace(/:$/, '').trim()

    if (isCategoryLine && catName.split(' ').length <= 4) {
      currentCat = catName
      if (!categoryMap.has(currentCat)) {
        categoryMap.set(currentCat, [])
        categoryOrder.push(currentCat)
      }
    } else if (currentCat) {
      const itemName = line.replace(/^[-•*]\s*/, '').trim()
      if (itemName) categoryMap.get(currentCat).push(itemName)
    } else {
      // No category seen yet — put in Misc
      if (!categoryMap.has('Misc')) {
        categoryMap.set('Misc', [])
        categoryOrder.push('Misc')
      }
      currentCat = 'Misc'
      const itemName = line.replace(/^[-•*]\s*/, '').trim()
      if (itemName) categoryMap.get('Misc').push(itemName)
    }
  }

  if (categoryOrder.length === 0) throw new Error('No items found in document.')

  return buildTemplate(categoryMap, categoryOrder, fileName)
}

/**
 * Parse an uploaded file into an array of gear items.
 * Expected format for CSV/XLSX: columns — Name, Category, Weight (Weight optional)
 * Expected format for DOCX: category headers followed by "Item - 2.5" lines
 *
 * Returns: { items: GearItem[] } or throws on failure.
 */
export async function parseGearFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'csv') return parseGearCsv(file)
  if (ext === 'xlsx' || ext === 'xls') return parseGearXlsx(file)
  if (ext === 'docx' || ext === 'doc') return parseGearDocx(file)

  throw new Error(`Unsupported file type: .${ext}`)
}

async function parseGearCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          resolve(rowsToGearItems(data))
        } catch (e) {
          reject(e)
        }
      },
      error: reject,
    })
  })
}

async function parseGearXlsx(file) {
  const buf = await file.arrayBuffer()
  const XLSX = await import('xlsx')
  let wb
  try {
    wb = XLSX.read(buf, { type: 'array' })
  } catch {
    throw new Error('Could not read Excel file — it may be corrupted.')
  }
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  return rowsToGearItems(rows)
}

async function parseGearDocx(file) {
  const mammoth = await import('mammoth')
  const buf = await file.arrayBuffer()
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf })
  const lines = value.split('\n').map(l => l.trim()).filter(Boolean)
  return linesToGearItems(lines)
}

/**
 * Converts rows with columns [Name, Category, Weight?] into gear items.
 * Also accepts [Category, Name, Weight?] — detected by header row.
 */
function rowsToGearItems(rows) {
  if (rows.length === 0) throw new Error('File is empty.')

  const start = isGearHeaderRow(rows[0]) ? 1 : 0
  // Detect column order from header if present
  let nameCol = 0, catCol = 1, weightCol = 2
  if (start === 1) {
    const headers = rows[0].map(h => String(h).toLowerCase().trim())
    const ni = headers.findIndex(h => h === 'name' || h === 'item')
    const ci = headers.findIndex(h => h === 'category' || h === 'cat')
    const wi = headers.findIndex(h => h === 'weight' || h === 'wt' || h === 'lbs' || h === 'lb')
    if (ni >= 0) nameCol = ni
    if (ci >= 0) catCol = ci
    if (wi >= 0) weightCol = wi
  }

  const items = []
  for (let i = start; i < rows.length; i++) {
    const row = rows[i]
    const name = String(row[nameCol] || '').trim()
    const category = String(row[catCol] || '').trim() || 'Misc'
    const rawWeight = parseFloat(String(row[weightCol] || ''))
    const weight = isNaN(rawWeight) || rawWeight < 0 ? null : rawWeight
    if (name) items.push({ id: uid(), name, category, weight })
  }

  if (items.length === 0) throw new Error('No items found in file.')
  return { items }
}

function isGearHeaderRow(row) {
  if (!row) return false
  const cells = row.map(c => String(c).toLowerCase().trim())
  return cells.some(c => c === 'name' || c === 'item') &&
    cells.some(c => c === 'category' || c === 'cat')
}

/**
 * Converts DOCX lines into gear items.
 * Category header heuristic: ALL-CAPS or ends with ':' and ≤4 words.
 * Item lines may include weight: "Hiking boots - 2.5" or "Hiking boots (2.5lb)"
 */
function linesToGearItems(lines) {
  const items = []
  let currentCat = 'Misc'

  for (const line of lines) {
    const isCategoryLine = /^[A-Z]/.test(line) && (line.endsWith(':') || line.toUpperCase() === line)
    const catName = line.replace(/:$/, '').trim()

    if (isCategoryLine && catName.split(' ').length <= 4) {
      currentCat = catName
    } else {
      // Try to extract weight from end: "Item name - 2.5" or "Item name (2.5 lb)" or "Item name 2.5lb"
      const weightMatch = line.match(/[-–]\s*(\d+\.?\d*)\s*(?:lb|oz|kg|g)?\s*$/) ||
        line.match(/\(\s*(\d+\.?\d*)\s*(?:lb|oz|kg|g)?\s*\)\s*$/) ||
        line.match(/\s(\d+\.?\d*)\s*(?:lb|oz|kg)\s*$/)
      const weight = weightMatch ? parseFloat(weightMatch[1]) : null
      const name = line
        .replace(/[-–]\s*\d+\.?\d*\s*(?:lb|oz|kg|g)?\s*$/, '')
        .replace(/\(\s*\d+\.?\d*\s*(?:lb|oz|kg|g)?\s*\)\s*$/, '')
        .replace(/\s\d+\.?\d*\s*(?:lb|oz|kg)\s*$/, '')
        .replace(/^[-•*]\s*/, '')
        .trim()
      if (name) items.push({ id: uid(), name, category: currentCat, weight: weight && weight > 0 ? weight : null })
    }
  }

  if (items.length === 0) throw new Error('No items found in document.')
  return { items }
}

function buildTemplate(categoryMap, categoryOrder, fileName) {
  const templateName = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

  const categories = categoryOrder.map(catName => ({
    id: uid(),
    name: catName,
    items: categoryMap.get(catName).map(itemName => ({
      id: uid(),
      name: itemName,
      quantity: 1,
    })),
  }))

  return { name: templateName, categories }
}
