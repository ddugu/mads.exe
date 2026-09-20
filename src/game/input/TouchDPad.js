/**
 * Optional 4-way touch control for Scene 1 (coarse-pointer devices).
 * Provides movement vector only — animation is owned by Sude.
 */
export const touchState = {
  active: false,
  x: 0,
  y: 0,
}

/**
 * @param {Phaser.Scene} scene
 * @returns {{ destroy: () => void } | null}
 */
export function createTouchDPad(scene) {
  const coarse =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches

  if (!coarse) {
    return null
  }

  const { width, height } = scene.scale.gameSize
  const size = 52
  const gap = 8
  const cx = 120
  const cy = height - 140

  const root = scene.add.container(0, 0)
  root.setDepth(15000)
  root.setScrollFactor(0)
  root.setAlpha(0.72)

  const dirs = [
    { key: 'up', x: 0, y: -1, ox: 0, oy: -(size + gap) },
    { key: 'down', x: 0, y: 1, ox: 0, oy: size + gap },
    { key: 'left', x: -1, y: 0, ox: -(size + gap), oy: 0 },
    { key: 'right', x: 1, y: 0, ox: size + gap, oy: 0 },
  ]

  /** @type {Set<string>} */
  const held = new Set()

  const recompute = () => {
    let x = 0
    let y = 0
    for (const d of dirs) {
      if (held.has(d.key)) {
        x += d.x
        y += d.y
      }
    }
    if (x !== 0 || y !== 0) {
      const len = Math.hypot(x, y)
      x /= len
      y /= len
      touchState.active = true
    } else {
      touchState.active = false
    }
    touchState.x = x
    touchState.y = y
  }

  for (const d of dirs) {
    const btn = scene.add
      .rectangle(cx + d.ox, cy + d.oy, size, size, 0x222222, 0.85)
      .setStrokeStyle(2, 0xaaaaaa, 1)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)

    btn.on('pointerdown', () => {
      held.add(d.key)
      recompute()
    })
    btn.on('pointerup', () => {
      held.delete(d.key)
      recompute()
    })
    btn.on('pointerout', () => {
      held.delete(d.key)
      recompute()
    })

    root.add(btn)
  }

  return {
    setVisible(v) {
      root.setVisible(v)
      if (!v) {
        held.clear()
        touchState.active = false
        touchState.x = 0
        touchState.y = 0
      }
    },
    destroy() {
      held.clear()
      touchState.active = false
      touchState.x = 0
      touchState.y = 0
      root.destroy(true)
    },
  }
}
