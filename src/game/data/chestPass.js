/** SHA-256 digest of the chest passphrase. Plaintext is not kept in the repo. */
const CHEST_PASS_SHA256 =
  'c1d7e8a4443011dee8980fa32d0885781e4473d595602f4f356e87f31ace8a58'

/** SHA-256 digest of the boot passphrase. Plaintext is not kept in the repo. */
const BOOT_PASS_SHA256 =
  'b69886ac9b554f94c834c713e2951a07bb3769db5a9f48e21fc773a6f0eaa44e'

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
 * @param {string} expectedHex
 * @returns {Promise<boolean>}
 */
async function matchesSha256(input, expectedHex) {
  const text = String(input ?? '').trim()
  if (!text || typeof crypto === 'undefined' || !crypto.subtle) return false
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return toHex(digest) === expectedHex
}

/**
 * @param {string} input
 * @returns {Promise<boolean>}
 */
export function isChestPassphrase(input) {
  return matchesSha256(input, CHEST_PASS_SHA256)
}

/**
 * @param {string} input
 * @returns {Promise<boolean>}
 */
export function isBootPassphrase(input) {
  return matchesSha256(input, BOOT_PASS_SHA256)
}
