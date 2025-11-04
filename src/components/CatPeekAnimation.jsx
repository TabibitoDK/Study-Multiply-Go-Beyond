import { useEffect, useRef, useState, useCallback } from 'react'

const SPRITE_SOURCE = '/assets/character/catPeekTile.png'
const FRAME_SIZE = 240
const DEFAULT_FRAME_RATE = 14

export default function CatPeekAnimation({
  className = '',
  size = 160,
  frameRate = DEFAULT_FRAME_RATE,
}) {
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const prefersReducedMotionRef = useRef(false)
  const rafRef = useRef(null)
  const frameIndexRef = useRef(0)
  const lastTickRef = useRef(0)
  const totalFramesRef = useRef(1)
  const framesPerRowRef = useRef(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const drawFrame = useCallback(
    frameIndex => {
      const canvas = canvasRef.current
      const sprite = imageRef.current
      if (!canvas || !sprite) return

      const context = canvas.getContext('2d')
      if (!context) return

      const totalFrames = Math.max(1, totalFramesRef.current)
      const safeFrame = ((frameIndex % totalFrames) + totalFrames) % totalFrames
      const framesPerRow = Math.max(1, framesPerRowRef.current)
      const column = safeFrame % framesPerRow
      const row = Math.floor(safeFrame / framesPerRow)

      context.clearRect(0, 0, FRAME_SIZE, FRAME_SIZE)
      context.drawImage(
        sprite,
        column * FRAME_SIZE,
        row * FRAME_SIZE,
        FRAME_SIZE,
        FRAME_SIZE,
        0,
        0,
        FRAME_SIZE,
        FRAME_SIZE,
      )
    },
    [],
  )

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      const update = event => {
        prefersReducedMotionRef.current = event.matches
        if (event.matches) {
          setIsPlaying(false)
          frameIndexRef.current = 0
          drawFrame(0)
        }
      }

      prefersReducedMotionRef.current = mediaQuery.matches
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', update)
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(update)
      }

      return () => {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', update)
        } else if (typeof mediaQuery.removeListener === 'function') {
          mediaQuery.removeListener(update)
        }
      }
    }

    return undefined
  }, [drawFrame])

  useEffect(() => {
    const sprite = new Image()
    sprite.src = SPRITE_SOURCE
    sprite.onload = () => {
      imageRef.current = sprite

      const framesPerRow = Math.max(1, Math.floor(sprite.width / FRAME_SIZE))
      const rows = Math.max(1, Math.floor(sprite.height / FRAME_SIZE))
      framesPerRowRef.current = framesPerRow
      totalFramesRef.current = framesPerRow * rows
      frameIndexRef.current = 0
      setIsLoaded(true)
      drawFrame(0)
    }

    sprite.onerror = () => {
      imageRef.current = null
      setIsLoaded(false)
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [drawFrame])

  useEffect(() => {
    if (!isLoaded || !isPlaying || prefersReducedMotionRef.current) return undefined

    const frameDuration = 1000 / Math.max(1, frameRate)

    const step = timestamp => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp
        rafRef.current = requestAnimationFrame(step)
        return
      }

      const delta = timestamp - lastTickRef.current
      if (delta >= frameDuration) {
        lastTickRef.current = timestamp
        frameIndexRef.current = (frameIndexRef.current + 1) % Math.max(1, totalFramesRef.current)
        drawFrame(frameIndexRef.current)
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTickRef.current = 0
    }
  }, [isLoaded, isPlaying, frameRate, drawFrame])

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTickRef.current = 0
      frameIndexRef.current = 0
      drawFrame(0)
    }
  }, [isPlaying, drawFrame])

  const handleStart = () => {
    if (!isLoaded || prefersReducedMotionRef.current) return
    setIsPlaying(true)
  }

  const handleStop = () => {
    setIsPlaying(false)
  }

  return (
    <div
      className={`cat-peek-animation ${className}`.trim()}
      onMouseEnter={handleStart}
      onMouseLeave={handleStop}
      onFocus={handleStart}
      onBlur={handleStop}
      onTouchStart={handleStart}
      onTouchEnd={handleStop}
      role="img"
      aria-label="Cat peeking animation"
    >
      <canvas
        ref={canvasRef}
        width={FRAME_SIZE}
        height={FRAME_SIZE}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  )
}

