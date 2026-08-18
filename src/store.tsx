import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DATI_INIZIALI } from './dati'
import type { DatiGiochi, EventoPunti, Giocatore, Sessione, Squadra } from './tipi'

const CHIAVE_DATI = 'serata-giochi:dati:v1'
const CHIAVE_SESSIONE = 'serata-giochi:sessione:v1'

export const COLORI_SQUADRE = ['#ff5c7a', '#3ddc97'] as const

function leggi<T>(chiave: string, fallback: T): T {
  try {
    const grezzo = localStorage.getItem(chiave)
    return grezzo ? (JSON.parse(grezzo) as T) : fallback
  } catch {
    return fallback
  }
}

function scrivi(chiave: string, valore: unknown) {
  try {
    localStorage.setItem(chiave, JSON.stringify(valore))
  } catch {
    /* quota piena o storage disabilitato: la sessione resta comunque in memoria */
  }
}

export function nuovoId(prefisso = 'id') {
  return `${prefisso}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Crea una sessione con squadre e giocatori disposti come dice il regolamento
 * della musica: A, B, A, B... L'ordine dell'array e' l'ordine dei turni.
 */
export function creaSessione(nomiGiocatori: string[], nomiSquadre: [string, string]): Sessione {
  const squadre: Squadra[] = nomiSquadre.map((nome, i) => ({
    id: `squadra-${i + 1}`,
    nome,
    colore: COLORI_SQUADRE[i],
  }))

  const giocatori: Giocatore[] = nomiGiocatori
    .map((nome, i) => ({
      id: `g-${i + 1}`,
      nome: nome.trim() || `Giocatore ${i + 1}`,
      squadraId: squadre[i % 2].id,
    }))

  return {
    id: nuovoId('sessione'),
    nome: 'Serata giochi',
    creataIl: Date.now(),
    squadre,
    giocatori,
    eventi: [],
    notizie: { indice: 0, tentativi: [], rivelata: false, chiuse: [] },
    immagini: { categoriaIndex: 0, voceIndex: 0, immagineIndex: 1, rivelata: false, chiuse: [] },
    qdcp: { indice: 0, indiziLetti: 1, rivelata: false, chiuse: [] },
    musica: {
      categoriaIndex: 0,
      branoIndex: 0,
      turnoIndex: 0,
      moltiplicatore: 1,
      indizioSbloccato: 1,
      rivelato: false,
      eliminati: [],
      chiusi: [],
    },
  }
}

interface ValoreStore {
  dati: DatiGiochi
  sessione: Sessione | null
  setDati: (aggiorna: (d: DatiGiochi) => DatiGiochi) => void
  ripristinaDati: () => void
  avviaSessione: (nomiGiocatori: string[], nomiSquadre: [string, string]) => void
  aggiornaSessione: (aggiorna: (s: Sessione) => Sessione) => void
  chiudiSessione: () => void
  assegnaPunti: (evento: Omit<EventoPunti, 'id' | 'ts'>) => void
  annullaEvento: (id: string) => void
}

const Contesto = createContext<ValoreStore | null>(null)

export function ProviderStore({ children }: { children: ReactNode }) {
  const [dati, setDatiState] = useState<DatiGiochi>(() => leggi(CHIAVE_DATI, DATI_INIZIALI))
  const [sessione, setSessione] = useState<Sessione | null>(() => leggi(CHIAVE_SESSIONE, null))

  useEffect(() => scrivi(CHIAVE_DATI, dati), [dati])
  useEffect(() => scrivi(CHIAVE_SESSIONE, sessione), [sessione])

  const setDati = useCallback((aggiorna: (d: DatiGiochi) => DatiGiochi) => {
    setDatiState((d) => aggiorna(d))
  }, [])

  const ripristinaDati = useCallback(() => setDatiState(DATI_INIZIALI), [])

  const avviaSessione = useCallback((nomi: string[], nomiSquadre: [string, string]) => {
    setSessione(creaSessione(nomi, nomiSquadre))
  }, [])

  const aggiornaSessione = useCallback((aggiorna: (s: Sessione) => Sessione) => {
    setSessione((s) => (s ? aggiorna(s) : s))
  }, [])

  const chiudiSessione = useCallback(() => setSessione(null), [])

  const assegnaPunti = useCallback((evento: Omit<EventoPunti, 'id' | 'ts'>) => {
    setSessione((s) =>
      s ? { ...s, eventi: [...s.eventi, { ...evento, id: nuovoId('ev'), ts: Date.now() }] } : s,
    )
  }, [])

  const annullaEvento = useCallback((id: string) => {
    setSessione((s) => (s ? { ...s, eventi: s.eventi.filter((e) => e.id !== id) } : s))
  }, [])

  const valore = useMemo<ValoreStore>(
    () => ({
      dati,
      sessione,
      setDati,
      ripristinaDati,
      avviaSessione,
      aggiornaSessione,
      chiudiSessione,
      assegnaPunti,
      annullaEvento,
    }),
    [
      dati,
      sessione,
      setDati,
      ripristinaDati,
      avviaSessione,
      aggiornaSessione,
      chiudiSessione,
      assegnaPunti,
      annullaEvento,
    ],
  )

  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>
}

export function useStore() {
  const v = useContext(Contesto)
  if (!v) throw new Error('useStore fuori da ProviderStore')
  return v
}

// ---------------------------------------------------------------------------
// Selettori di punteggio
// ---------------------------------------------------------------------------

export function punteggioSquadra(sessione: Sessione, squadraId: string) {
  return sessione.eventi
    .filter((e) => e.squadraId === squadraId)
    .reduce((tot, e) => tot + e.punti, 0)
}

export function punteggioGiocatore(sessione: Sessione, giocatoreId: string) {
  return sessione.eventi
    .filter((e) => e.giocatoreId === giocatoreId)
    .reduce((tot, e) => tot + e.punti, 0)
}

export function punteggioSquadraPerGioco(sessione: Sessione, squadraId: string, gioco: string) {
  return sessione.eventi
    .filter((e) => e.squadraId === squadraId && e.gioco === gioco)
    .reduce((tot, e) => tot + e.punti, 0)
}

/** Arrotonda a 2 decimali eliminando lo zero finale: 1.5 -> "1,5", 2 -> "2" */
export function formattaPunti(n: number) {
  const arrotondato = Math.round(n * 100) / 100
  return arrotondato.toString().replace('.', ',')
}
