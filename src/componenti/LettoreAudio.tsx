import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface ApiLettore {
  alterna: () => void
  riavvia: () => void
  pausa: () => void
  cerca: (delta: number) => void
}

interface Props {
  src: string
  etichetta: string
  /** Mostrato al posto dei controlli quando l'indizio non e' ancora sbloccato */
  bloccatoCon?: string
  /** Riduce l'altezza: usato per il brano completo, secondario rispetto agli indizi */
  compatto?: boolean
}

/** Solo un audio alla volta: appena uno parte, gli altri si fermano. */
const attivi = new Set<() => void>()

function tempo(secondi: number) {
  if (!Number.isFinite(secondi)) return '0:00'
  const m = Math.floor(secondi / 60)
  const s = Math.floor(secondi % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const LettoreAudio = forwardRef<ApiLettore, Props>(function LettoreAudio(
  { src, etichetta, bloccatoCon, compatto },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const barraRef = useRef<HTMLDivElement>(null)
  const [inRiproduzione, setInRiproduzione] = useState(false)
  const [posizione, setPosizione] = useState(0)
  const [durata, setDurata] = useState(0)
  const [mancante, setMancante] = useState(false)
  const [caricato, setCaricato] = useState(false)

  // Cambio di brano: si riparte da zero, senza trascinarsi dietro lo stato vecchio.
  useEffect(() => {
    setMancante(false)
    setCaricato(false)
    setPosizione(0)
    setDurata(0)
    setInRiproduzione(false)
  }, [src])

  const pausa = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const riproduci = useCallback(() => {
    const a = audioRef.current
    if (!a || mancante) return
    for (const fermaAltro of attivi) if (fermaAltro !== pausa) fermaAltro()
    void a.play().catch(() => setMancante(true))
  }, [mancante, pausa])

  const alterna = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.paused ? riproduci() : a.pause()
  }, [riproduci])

  const riavvia = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = 0
    riproduci()
  }, [riproduci])

  const cerca = useCallback((delta: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.min(Math.max(0, a.currentTime + delta), a.duration || 0)
  }, [])

  useImperativeHandle(ref, () => ({ alterna, riavvia, pausa, cerca }), [
    alterna,
    riavvia,
    pausa,
    cerca,
  ])

  useEffect(() => {
    attivi.add(pausa)
    return () => {
      attivi.delete(pausa)
    }
  }, [pausa])

  const vaiA = useCallback((clientX: number) => {
    const a = audioRef.current
    const barra = barraRef.current
    if (!a || !barra || !a.duration) return
    const r = barra.getBoundingClientRect()
    const frazione = Math.min(Math.max((clientX - r.left) / r.width, 0), 1)
    a.currentTime = frazione * a.duration
    setPosizione(a.currentTime)
  }, [])

  const suPuntatore = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    vaiA(e.clientX)
  }
  const suTrascinamento = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1) vaiA(e.clientX)
  }

  if (bloccatoCon) {
    return (
      <div className={`lettore${compatto ? ' lettore--compatto' : ''} lettore--bloccato`}>
        <span className="lettore-etichetta">{etichetta}</span>
        <span className="lettore-messaggio">{bloccatoCon}</span>
      </div>
    )
  }

  if (mancante) {
    return (
      <div className={`lettore${compatto ? ' lettore--compatto' : ''} lettore--bloccato`}>
        <span className="lettore-etichetta">{etichetta}</span>
        <span className="lettore-messaggio">File audio non trovato — esegui npm run importa-media</span>
      </div>
    )
  }

  const percentuale = durata ? (posizione / durata) * 100 : 0

  return (
    <div className={`lettore${compatto ? ' lettore--compatto' : ''}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onLoadedMetadata={(e) => {
          setDurata(e.currentTarget.duration)
          setCaricato(true)
        }}
        onTimeUpdate={(e) => setPosizione(e.currentTarget.currentTime)}
        onPlay={() => setInRiproduzione(true)}
        onPause={() => setInRiproduzione(false)}
        onEnded={() => setInRiproduzione(false)}
        onError={() => setMancante(true)}
      />

      <button
        className="lettore-play"
        onClick={alterna}
        aria-label={inRiproduzione ? `Pausa ${etichetta}` : `Riproduci ${etichetta}`}
        title={inRiproduzione ? 'Pausa (spazio)' : 'Riproduci (spazio)'}
      >
        {inRiproduzione ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1.2" />
            <rect x="14" y="4" width="4" height="16" rx="1.2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4.5v15a1 1 0 0 0 1.53.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z" />
          </svg>
        )}
      </button>

      <span className="lettore-etichetta">{etichetta}</span>

      <div
        ref={barraRef}
        className="lettore-barra"
        onPointerDown={suPuntatore}
        onPointerMove={suTrascinamento}
        role="slider"
        tabIndex={0}
        aria-label={`Posizione in ${etichetta}`}
        aria-valuemin={0}
        aria-valuemax={Math.round(durata)}
        aria-valuenow={Math.round(posizione)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            cerca(2)
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            cerca(-2)
          }
        }}
      >
        <div className="lettore-riempimento" style={{ width: `${percentuale}%` }} />
        <div className="lettore-manopola" style={{ left: `${percentuale}%` }} />
      </div>

      <span className="lettore-tempo">
        {tempo(posizione)}
        <span className="lettore-tempo-totale"> / {caricato ? tempo(durata) : '—:—'}</span>
      </span>

      <button className="lettore-azione" onClick={riavvia} title="Da capo (R)" aria-label="Da capo">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 5V2L8 6l4 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  )
})
