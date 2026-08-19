import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface ApiLettore {
  alterna: () => void
  riavvia: () => void
  pausa: () => void
  cerca: (delta: number) => void
  /** Posizione corrente in secondi; 0 se il file non e' ancora pronto. */
  posizione: () => number
  /** Salta a un punto preciso del brano e parte da li'. */
  riproduciDa: (secondi: number) => void
}

interface Props {
  src: string
  etichetta: string
  /** Mostrato al posto dei controlli quando l'indizio non e' ancora sbloccato */
  bloccatoCon?: string
  /** Riduce l'altezza: usato per il brano completo, secondario rispetto agli indizi */
  compatto?: boolean
  /**
   * Quanto scaricare prima che si prema play. Gli indizi pesano 200 KB e
   * devono partire istantanei; i brani interi pesano fino a 19 MB e in una
   * pagina con sei brani sarebbero 100 MB scaricati per niente — quelli
   * vanno lasciati a 'none'.
   */
  precarica?: 'auto' | 'metadata' | 'none'
}

/** Solo un audio alla volta: appena uno parte, gli altri si fermano. */
const attivi = new Set<() => void>()

function tempo(secondi: number) {
  if (!Number.isFinite(secondi)) return '0:00'
  const m = Math.floor(secondi / 60)
  const s = Math.floor(secondi % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function descriviErrore(codice: number | undefined) {
  switch (codice) {
    case 1:
      return 'caricamento interrotto'
    case 2:
      return 'errore di rete'
    case 3:
      return 'file danneggiato o incompleto'
    default:
      return 'file non trovato — esegui npm run importa-media'
  }
}

export const LettoreAudio = forwardRef<ApiLettore, Props>(function LettoreAudio(
  { src, etichetta, bloccatoCon, compatto, precarica = 'auto' },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const barraRef = useRef<HTMLDivElement>(null)
  const saltoInSospeso = useRef<number | null>(null)
  /** Qualcuno ha premuto play e la riproduzione non e' ancora partita. */
  const volevaSuonare = useRef(false)
  const [inRiproduzione, setInRiproduzione] = useState(false)
  const [posizioneAttuale, setPosizione] = useState(0)
  const [durata, setDurata] = useState(0)
  const [guasto, setGuasto] = useState<string | null>(null)
  const [caricato, setCaricato] = useState(false)
  /**
   * Marcatore anti-cache. Chrome puo' conservare una copia troncata del file
   * (una richiesta interrotta a meta' che l'header `immutable` gli impedisce
   * di ricontrollare): il file sul server e' intero, ma il browser serve i
   * suoi 600 byte e il lettore sembra rotto. Cambiare l'URL cambia la voce di
   * cache, quindi il primo errore lo curiamo da soli riscaricando.
   */
  const [rimedio, setRimedio] = useState<number | null>(null)
  const sorgente = rimedio === null ? src : `${src}${src.includes('?') ? '&' : '?'}riprova=${rimedio}`

  // Cambio di brano: si riparte da zero, senza trascinarsi dietro lo stato vecchio.
  useEffect(() => {
    setGuasto(null)
    setRimedio(null)
    setCaricato(false)
    setPosizione(0)
    setDurata(0)
    setInRiproduzione(false)
    saltoInSospeso.current = null
    volevaSuonare.current = false
  }, [src])

  const suErrore = useCallback(() => {
    const a = audioRef.current
    if (rimedio === null) {
      setRimedio(Date.now())
      return
    }
    setGuasto(descriviErrore(a?.error?.code))
  }, [rimedio])

  const pausa = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const riproduci = useCallback(() => {
    const a = audioRef.current
    if (!a || guasto) return
    volevaSuonare.current = true
    for (const fermaAltro of attivi) if (fermaAltro !== pausa) fermaAltro()
    void a.play().catch((e: unknown) => {
      // Un play() rifiutato non vuol dire file mancante: succede anche quando
      // la riproduzione viene interrotta da un altro comando. Lo trattiamo come
      // guasto solo se il media element ha davvero un errore suo.
      if (a.error) suErrore()
      else console.warn(`play() rifiutato su ${etichetta}:`, e)
    })
  }, [guasto, pausa, suErrore, etichetta])

  const alterna = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.paused ? riproduci() : a.pause()
  }, [riproduci])

  const riavvia = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.readyState >= 1) a.currentTime = 0
    else saltoInSospeso.current = 0
    riproduci()
  }, [riproduci])

  const cerca = useCallback((delta: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.min(Math.max(0, a.currentTime + delta), a.duration || 0)
  }, [])

  const posizione = useCallback(() => audioRef.current?.currentTime ?? 0, [])

  /**
   * Con precarica 'none' i metadati non ci sono ancora e scrivere currentTime
   * non avrebbe effetto: il salto resta in sospeso e lo applichiamo appena il
   * browser sa quanto e' lungo il brano.
   */
  const riproduciDa = useCallback(
    (secondi: number) => {
      const a = audioRef.current
      if (!a) return
      const punto = Math.max(0, secondi)
      if (a.readyState >= 1) a.currentTime = punto
      else saltoInSospeso.current = punto
      riproduci()
    },
    [riproduci],
  )

  useImperativeHandle(
    ref,
    () => ({ alterna, riavvia, pausa, cerca, posizione, riproduciDa }),
    [alterna, riavvia, pausa, cerca, posizione, riproduciDa],
  )

  /**
   * Ripartenza dopo il rimedio anti-cache: chi aveva premuto play non deve
   * accorgersi di niente, tanto meno premere una seconda volta. L'eventuale
   * salto al ritornello e' ancora in sospeso, quindi si riapplica da solo.
   */
  useEffect(() => {
    if (rimedio === null || !volevaSuonare.current) return
    riproduci()
  }, [rimedio, riproduci])

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

  if (guasto) {
    return (
      <div className={`lettore${compatto ? ' lettore--compatto' : ''} lettore--bloccato`}>
        <span className="lettore-etichetta">{etichetta}</span>
        <span className="lettore-messaggio">Audio non disponibile — {guasto}</span>
        <button
          className="lettore-azione"
          onClick={() => {
            setGuasto(null)
            setRimedio(Date.now())
          }}
          title="Riprova scaricandolo di nuovo"
          aria-label={`Riprova ${etichetta}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5V2L8 6l4 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" fill="currentColor" />
          </svg>
        </button>
      </div>
    )
  }

  const percentuale = durata ? (posizioneAttuale / durata) * 100 : 0

  return (
    <div className={`lettore${compatto ? ' lettore--compatto' : ''}`}>
      <audio
        ref={audioRef}
        src={sorgente}
        preload={precarica}
        onLoadedMetadata={(e) => {
          setDurata(e.currentTarget.duration)
          setCaricato(true)
          if (saltoInSospeso.current !== null) {
            e.currentTarget.currentTime = Math.min(
              saltoInSospeso.current,
              Math.max(0, (e.currentTarget.duration || 0) - 1),
            )
            saltoInSospeso.current = null
          }
        }}
        onTimeUpdate={(e) => setPosizione(e.currentTarget.currentTime)}
        onPlay={() => {
          volevaSuonare.current = false
          setInRiproduzione(true)
        }}
        onPause={() => setInRiproduzione(false)}
        onEnded={() => setInRiproduzione(false)}
        onError={suErrore}
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
        aria-valuenow={Math.round(posizioneAttuale)}
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
        {tempo(posizioneAttuale)}
        <span className="lettore-tempo-totale"> / {caricato ? tempo(durata) : '—:—'}</span>
      </span>

      <button className="lettore-azione" onClick={riavvia} title="Da capo (R)" aria-label="Da capo">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5V2L8 6l4 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
})
