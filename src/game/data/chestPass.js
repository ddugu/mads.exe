/** SHA-256 digest of the chest passphrase. Plaintext is not kept in the repo. */
const CHEST_PASS_SHA256 =
  'c1d7e8a4443011dee8980fa32d0885781e4473d595602f4f356e87f31ace8a58'

/**
 * @param {ArrayBuffer} buf
 */
function toHex(buf) {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * @param {string} input
 * @returns {Promise<boolean>}
 */
export async function isChestPassphrase(input) {
  const text = String(input ?? '').trim()
  if (!text || typeof crypto === 'undefined' || !crypto.subtle) return false
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return toHex(digest) === CHEST_PASS_SHA256
}
