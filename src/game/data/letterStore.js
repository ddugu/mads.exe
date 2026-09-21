import { SCENE_07_LETTERS } from './scene07'

const STORAGE_KEY = 'sude.exe.letters.v1'

/** @typedef {{ body: string, image: string | null }} LetterRecord */

function emptyRecord() {
  return { body: '', image: null }
}

function emptyMap() {
  /** @type {Record<string, LetterRecord>} */
  const map = {}
  for (const letter of SCENE_07_LETTERS) {
    map[letter.id] = emptyRecord()
  }
  return map
}

/**
 * @param {unknown} value
 * @returns {LetterRecord}
 */
function normalize(value) {
  if (typeof value === 'string') {
    return { body: value, image: null }
  }
  if (value && typeof value === 'object') {
    const rec = /** @type {Record<string, unknown>} */ (value)
    return {
      body: typeof rec.body === 'string' ? rec.body : '',
      image: typeof rec.image === 'string' && rec.image ? rec.image : null,
    }
  }
  return emptyRecord()
}

function readAll() {
  const base = emptyMap()
  if (typeof localStorage === 'undefined') return base
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return base
    for (const letter of SCENE_07_LETTERS) {
      base[letter.id] = normalize(parsed[letter.id])
    }
  } catch {
    return base
  }
  return base
}

function writeAll(map) {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
    return true
  } catch {
    return false
  }
}

/**
 * @param {string} id
 * @returns {LetterRecord}
 */
export function getLetter(id) {
  return readAll()[id] ?? emptyRecord()
}

/**
 * @param {string} id
 * @returns {string}
 */
export function getLetterBody(id) {
  return getLetter(id).body
}

/**
 * @param {string} id
 * @returns {string | null}
 */
export function getLetterImage(id) {
  return getLetter(id).image
}

/**
 * @param {string} id
 * @param {string} body
 * @returns {boolean}
 */
export function setLetterBody(id, body) {
  const map = readAll()
  map[id] = { ...map[id], body }
  return writeAll(map)
}

/**
 * @param {string} id
 * @param {string | null} image
 * @returns {boolean}
 */
export function setLetterImage(id, image) {
  const map = readAll()
  map[id] = { ...map[id], image }
  return writeAll(map)
}

/**
 * @param {string} id
 */
export function clearLetterBody(id) {
  const map = readAll()
  map[id] = emptyRecord()
  writeAll(map)
}

const MAX_EDGE = 720
const JPEG_QUALITY = 0.72

/**
 * Shrink a user photo for localStorage.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function compressLetterImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('image'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('canvas'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.onerror = () => reject(new Error('decode'))
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
