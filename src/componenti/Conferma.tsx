import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface Richiesta {
  titolo: string
  messaggio?: string
  conferma?: string
  annulla?: string
  pericolo?: boolean
}

type Risolvi = (ok: boolean) => void

const Contesto = createContext<((r: Richiesta) => Promise<boolean>) | null>(null)

/**
 * Conferma modale al posto di `confirm()`: si puo' annullare con Esc, il fuoco
 * parte sul bottone sicuro, e l'aspetto e' quello dell'app invece che del sistema.
 */
export function ProviderConferma({ children }: { children: ReactNode }) {
  const [richiesta, setRichiesta] = useState<Richiesta | null>(null)
  const risolviRef = useRef<Risolvi | null>(null)
  const annullaRef = useRef<HTMLButtonElement>(null)

  const chiedi = useCallback((r: Richiesta) => {
    setRichiesta(r)
    return new Promise<boolean>((risolvi) => {
      risolviRef.current = risolvi
    })
  }, [])

  const chiudi = useCallback((ok: boolean) => {
    risolviRef.current?.(ok)
    risolviRef.current = null
    setRichiesta(null)
  }, [])

  useEffect(() => {
    if (!richiesta) return
    annullaRef.current?.focus()
    const suTasto = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        chiudi(false)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        chiudi(true)
      }
    }
    window.addEventListener('keydown', suTasto)
    return () => window.removeEventListener('keydown', suTasto)
  }, [richiesta, chiudi])

  return (
    <Contesto.Provider value={chiedi}>
      {children}
      {richiesta && (
        <div className="velo" onClick={() => chiudi(false)}>
          <div
            className="modale"
            role="alertdialog"
            aria-modal="true"
            aria-label={richiesta.titolo}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{richiesta.titolo}</h3>
            {richiesta.messaggio && <p>{richiesta.messaggio}</p>}
            <div className="modale-azioni">
              <button ref={annullaRef} className="btn btn--fantasma" onClick={() => chiudi(false)}>
                {richiesta.annulla ?? 'Annulla'}
              </button>
              <button
                className={`btn ${richiesta.pericolo ? 'btn--ko' : 'btn--primario'}`}
                onClick={() => chiudi(true)}
              >
                {richiesta.conferma ?? 'Conferma'}
              </button>
            </div>
            <p className="modale-nota">Invio per confermare · Esc per annullare</p>
          </div>
        </div>
      )}
    </Contesto.Provider>
  )
}

export function useConferma() {
  const v = useContext(Contesto)
  if (!v) throw new Error('useConferma fuori da ProviderConferma')
  return v
}
