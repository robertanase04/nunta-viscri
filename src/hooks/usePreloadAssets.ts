import { useEffect, useRef, useState } from 'react'

/**
 * Real load progress for the opening sequence.
 *
 * A fake timer would be easier and would look identical on a fast
 * connection, but it lies exactly when it matters — on a slow one, where
 * it finishes early and hands over to a card that is not there yet. This
 * counts settled requests, and treats a failure as settled: a missing
 * decorative layer must never strand someone on the preloader.
 */
export function usePreloadAssets(urls: readonly string[]): {
  progress: number
  done: boolean
} {
  const [loaded, setLoaded] = useState(0)
  const [done, setDone] = useState(urls.length === 0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current || urls.length === 0) return
    started.current = true

    let alive = true
    let settled = 0

    const tick = () => {
      if (!alive) return
      settled += 1
      setLoaded(settled)
      if (settled >= urls.length) setDone(true)
    }

    for (const url of urls) {
      const img = new Image()
      img.decoding = 'async'
      img.onload = tick
      img.onerror = tick
      img.src = url
    }

    // A slow third-party hop must not hold the door shut forever.
    const bail = window.setTimeout(() => {
      if (alive) setDone(true)
    }, 6000)

    return () => {
      alive = false
      window.clearTimeout(bail)
    }
  }, [urls])

  return { progress: urls.length === 0 ? 1 : loaded / urls.length, done }
}
