import { SCENE_07_LETTERS } from './scene07'

const STORAGE_KEY = 'sude.exe.letters.v1'

function emptyMap() {
  /** @type {Record<string, string>} */
  const map = {}
  for (const letter of SCENE_07_LETTERS) {
    map[letter.id] = ''
  }
  return map
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
      const value = parsed[letter.id]
      base[letter.id] = typeof value === 'string' ? value : ''
    }
  } catch {
    return base
  }
  return base
}

function writeAll(map) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore quota / private mode
  }
}

/**
 * @param {string} id
 * @returns {string}
 */
export function getLetterBody(id) {
  return readAll()[id] ?? ''
}

/**
 * @param {string} id
 * @param {string} body
 */
export function setLetterBody(id, body) {
  const map = readAll()
  map[id] = body
  writeAll(map)
}

/**
 * @param {string} id
 */
export function clearLetterBody(id) {
  setLetterBody(id, '')
}
