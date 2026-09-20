import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createGameConfig } from '../game/config'
import { layoutGameFrame } from '../game/systems/GameViewport'
import { paintLetterboxSparkles } from '../game/ui/letterboxSparkles'

/** Module-level guard so HMR / StrictMode never leaves two live games. */
let activeGame = null

/**
 * Mounts a single Phaser.Game into a fixed-aspect frame centered in the
 * full-window starfield letterbox.
 */
function GameCanvas() {
  const shellRef = useRef(null)
  const frameRef = useRef(null)
  const sparkleRef = useRef(null)

  useEffect(() => {
    const shell = shellRef.current
    const frame = frameRef.current
    const sparkle = sparkleRef.current
    if (!shell || !frame || !sparkle) {
      return undefined
    }

    if (activeGame) {
      activeGame.destroy(true)
      activeGame = null
    }

    const blockGesture = (event) => {
      event.preventDefault()
    }

    const relayout = () => {
      layoutGameFrame(frame, shell)
      paintLetterboxSparkles(sparkle, shell.clientWidth, shell.clientHeight)
      activeGame?.scale?.refresh?.()
    }

    shell.addEventListener('touchmove', blockGesture, { passive: false })
    shell.addEventListener('gesturestart', blockGesture, { passive: false })
    shell.addEventListener('contextmenu', blockGesture)
    window.addEventListener('resize', relayout)

    layoutGameFrame(frame, shell)
    paintLetterboxSparkles(sparkle, shell.clientWidth, shell.clientHeight)
    activeGame = new Phaser.Game(createGameConfig(frame))

    const canvas = activeGame.canvas
    if (canvas) {
      canvas.tabIndex = 0
      canvas.style.outline = 'none'
    }

    requestAnimationFrame(relayout)

    return () => {
      window.removeEventListener('resize', relayout)
      shell.removeEventListener('touchmove', blockGesture)
      shell.removeEventListener('gesturestart', blockGesture)
      shell.removeEventListener('contextmenu', blockGesture)

      if (activeGame) {
        activeGame.destroy(true)
        activeGame = null
      }
    }
  }, [])

  return (
    <div ref={shellRef} id="phaser-game" style={shellStyle}>
      <canvas
        ref={sparkleRef}
        id="letterbox-sparkles"
        aria-hidden="true"
        style={sparkleStyle}
      />
      <div ref={frameRef} id="phaser-frame" style={frameStyle} />
    </div>
  )
}

const shellStyle = {
  position: 'relative',
  width: '100vw',
  height: '100dvh',
  margin: 0,
  padding: 0,
  overflow: 'hidden',
  touchAction: 'none',
  WebkitUserSelect: 'none',
  userSelect: 'none',
  backgroundColor: '#000000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const sparkleStyle = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  pointerEvents: 'none',
}

const frameStyle = {
  position: 'relative',
  zIndex: 1,
  flex: '0 0 auto',
  overflow: 'hidden',
  backgroundColor: '#000000',
}

export default GameCanvas
