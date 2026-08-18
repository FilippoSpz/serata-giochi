import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

/**
 * Mostra un'immagine ingrandita quanto serve ma senza mai uscire dal riquadro.
 *
 * I ritagli-indizio sono piccoli (il piu' minuto e' 132x111): lasciando fare al
 * CSS con width/height al 100% l'immagine veniva gonfiata fino a 14 volte e
 * sbordava dallo schermo, che e' esattamente l'effetto "tagliata male".
 * Qui la scala si calcola sulle misure reali del contenitore, quindi non puo'
 * debordare, e si ferma a `fattoreMax` perche' oltre un certo ingrandimento
 * resta solo poltiglia sfocata.
 */
export function ImmagineScalata({
  src,
  alt,
  fattoreMax = 4,
  className,
}: {
  src: string
  alt: string
  fattoreMax?: number
  className?: string
}) {
  const contenitore = useRef<HTMLDivElement>(null)
  const [naturale, setNaturale] = useState<{ w: number; h: number } | null>(null)
  const [stile, setStile] = useState<CSSProperties | undefined>()
  const [mancante, setMancante] = useState(false)

  useEffect(() => {
    setNaturale(null)
    setStile(undefined)
    setMancante(false)
  }, [src])

  const calcola = useCallback(() => {
    const c = contenitore.current
    if (!c || !naturale) return
    const { width, height } = c.getBoundingClientRect()
    if (!width || !height) return
    const scala = Math.min(width / naturale.w, height / naturale.h, fattoreMax)
    setStile({ width: Math.round(naturale.w * scala), height: Math.round(naturale.h * scala) })
  }, [naturale, fattoreMax])

  useEffect(calcola, [calcola])

  // Rotazione del tablet, finestra ridimensionata, trascinamento sulla TV.
  useEffect(() => {
    const c = contenitore.current
    if (!c || typeof ResizeObserver === 'undefined') return
    const osservatore = new ResizeObserver(calcola)
    osservatore.observe(c)
    return () => osservatore.disconnect()
  }, [calcola])

  return (
    <div ref={contenitore} className={`riquadro-immagine${className ? ` ${className}` : ''}`}>
      {mancante ? (
        <p className="riquadro-vuoto">
          Immagine non trovata.
          <br />
          Esegui <code>npm run importa-media</code>.
        </p>
      ) : (
        <img
          src={src}
          alt={alt}
          style={stile}
          onLoad={(e) =>
            setNaturale({
              w: e.currentTarget.naturalWidth || 1,
              h: e.currentTarget.naturalHeight || 1,
            })
          }
          onError={() => setMancante(true)}
        />
      )}
    </div>
  )
}
