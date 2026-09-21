import { SCENE_07_LETTERS } from './scene07'
import { assetUrl } from '../systems/assetUrl'
import { SEALED_LETTERS } from './sealedLetters'

/** @typedef {{ body: string, image: string | null }} LetterRecord */

/** @type {Record<string, LetterRecord> | null} */
let unlockedLetters = null
/** @type {string[]} */
const blobUrls = []

function emptyRecord() {
  return { body: '', image: null }
}

/**
 * @param {string} passphrase
 */
async function importAesKey(passphrase) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(String(passphrase ?? '').trim()),
  )
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['decrypt'])
}

/**
 * @param {string} b64
 */
function b64ToBytes(b64) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * @param {CryptoKey} key
 * @param {Uint8Array} packed
 */
async function decryptPacked(key, packed) {
  const iv = packed.slice(0, 12)
  const data = packed.slice(12)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new Uint8Array(plain)
}

/**
 * Unlock shipped letters with the chest passphrase. Returns false if decrypt fails.
 * @param {string} passphrase
 */
export async function unlockShippedLetters(passphrase) {
  lockShippedLetters()
  try {
    const key = await importAesKey(passphrase)
    /** @type {Record<string, LetterRecord>} */
    const map = {}
    for (const letter of SCENE_07_LETTERS) {
      const sealed = SEALED_LETTERS[letter.id]
      if (!sealed?.body) {
        map[letter.id] = emptyRecord()
        continue
      }
      const bodyBytes = await decryptPacked(key, b64ToBytes(sealed.body))
      const body = new TextDecoder().decode(bodyBytes)
      let image = null
      if (sealed.image) {
        const res = await fetch(assetUrl(sealed.image))
        if (!res.ok) throw new Error('image')
        const packed = new Uint8Array(await res.arrayBuffer())
        const raw = await decryptPacked(key, packed)
        const blob = new Blob([raw], { type: sealed.imageMime || 'image/png' })
        image = URL.createObjectURL(blob)
        blobUrls.push(image)
      }
      map[letter.id] = { body, image }
    }
    unlockedLetters = map
    return true
  } catch {
    lockShippedLetters()
    return false
  }
}

export function lockShippedLetters() {
  for (const url of blobUrls) URL.revokeObjectURL(url)
  blobUrls.length = 0
  unlockedLetters = null
}

export function lettersAreUnlocked() {
  return unlockedLetters !== null
}

/**
 * @param {string} id
 * @returns {LetterRecord}
 */
export function getLetter(id) {
  return unlockedLetters?.[id] ?? emptyRecord()
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
