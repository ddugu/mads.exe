import { createCipheriv, createHash, randomBytes } from 'node:crypto'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const keyText = String(process.env.SEAL_KEY ?? '').trim()
if (!keyText) {
  console.error('SEAL_KEY missing')
  process.exit(1)
}

const key = createHash('sha256').update(keyText, 'utf8').digest()
const storeSrc = await readFile(
  path.join(root, 'src/game/data/letterStore.js'),
  'utf8',
)
const match = storeSrc.match(
  /export const DEFAULT_LETTERS = ({[\s\S]*?})\r?\n\r?\n/,
)
if (!match) {
  console.error('DEFAULT_LETTERS not found')
  process.exit(1)
}
const DEFAULT_LETTERS = Function(`"use strict"; return (${match[1]})`)()

function sealBytes(plain) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const packed = Buffer.concat([
    cipher.update(plain),
    cipher.final(),
    cipher.getAuthTag(),
  ])
  return Buffer.concat([iv, packed])
}

const imageFiles = {
  yurin: 'yurin-mektup.png',
  dilara: 'dilara-mektup.png',
  burce: 'burce-mektup.png',
  zera: 'zera-mektup.png',
  duygu: 'duygu-mektup.png',
}

const mime = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

const sealed = {}
for (const [id, rec] of Object.entries(DEFAULT_LETTERS)) {
  sealed[id] = {
    body: sealBytes(Buffer.from(rec.body ?? '', 'utf8')).toString('base64'),
  }
  const file = imageFiles[id]
  if (!file) continue
  const src = path.join(root, 'public/assets/letters', file)
  const raw = await readFile(src)
  const encName = `${path.parse(file).name}.bin`
  await writeFile(path.join(root, 'public/assets/letters', encName), sealBytes(raw))
  sealed[id].image = `assets/letters/${encName}`
  sealed[id].imageMime = mime[path.extname(file).slice(1)] ?? 'image/png'
  await unlink(src)
}

const out = `/** AES-GCM sealed letter payload. Plaintext is not stored here. */
export const SEALED_LETTERS = ${JSON.stringify(sealed, null, 2)}
`
await writeFile(path.join(root, 'src/game/data/sealedLetters.js'), out)
console.log('sealed', Object.keys(sealed).join(','))
