import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { DATI_INIZIALI } from './dati'
import type { DatiGiochi, EventoPunti, Giocatore, IdGioco, Sessione, Squadra } from './tipi'

/**
 * La versione nella chiave e' il modo per far ripartire tutti dai contenuti
 * del codice: alzarla scarta la copia rimasta nel browser. Serve quando i
 * contenuti di partenza cambiano, o quando una modifica fatta da Gestione —
 * una notizia cancellata per sbaglio — e' rimasta incollata li' dentro.
 */
export const CHIAVE_DATI = 'serata-giochi:dati:v3'
export const CHIAVE_SESSIONE = 'serata-giochi:sessione:v2'

export const COLORI_SQUADRE = ['#ff5c7a', '#3ddc97'] as const

/**
 * Legge da localStorage senza fidarsi di cio' che ci trova. Dati scritti da
 * versioni precedenti, o troncati a meta', non devono lasciare la serata con
 * una schermata bianca: se la forma non torna si riparte dal valore di base.
 */
function leggi<T>(chiave: string, fallback: T, valido: (v: unknown) => boolean): T {
  try {
    const grezzo = localStorage.getItem(chiave)
    if (!grezzo) return fallback
    let valore: unknown = JSON.parse(grezzo)
    // Tolleranza: una versione intermedia ha salvato il JSON gia' serializzato.
    if (typeof valore === 'string') valore = JSON.parse(valore)
    return valido(valore) ? (valore as T) : fallback
  } catch {
    return fallback
  }
}

const eLista = (v: unknown) => Array.isArray(v)

function datiValidi(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false
  const d = v as DatiGiochi
  return eLista(d.notizie) && eLista(d.immagini) && eLista(d.qdcp) && eLista(d.musica)
}

/**
 * Stati di avanzamento di partenza. E' una funzione, non una costante, perche'
 * ogni sessione deve avere i propri array: condividerli fra sessioni diverse
 * sarebbe una trappola silenziosa.
 */
function avanzamentoIniziale() {
  return {
    notizie: { indice: 0 },
    immagini: { categoriaIndex: 0, voceIndex: 0, immagineIndex: 1, rivelata: false },
    qdcp: { indice: 0, indiziLetti: 1 },
    musica: { categoriaIndex: 0, branoIndex: 0, squadraIndex: 0, moltiplicatori: {} },
  } satisfies Pick<Sessione, 'notizie' | 'immagini' | 'qdcp' | 'musica'>
}

function sessioneValida(v: unknown): boolean {
  if (v === null) return true
  if (!v || typeof v !== 'object') return false
  const s = v as Sessione
  return eLista(s.squadre) && s.squadre.length >= 2 && eLista(s.giocatori) && eLista(s.eventi)
}

/**
 * Completa una sessione a cui manchi un pezzo di avanzamento. Perdere i punti
 * gia' assegnati per un campo mancante sarebbe peggio del problema originale.
 */
function riparaSessione(s: Sessione | null): Sessione | null {
  if (!s) return null
  const base = avanzamentoIniziale()
  return {
    ...s,
    eventi: (s.eventi ?? []).filter((e) => e && typeof e.punti === 'number'),
    notizie: { ...base.notizie, ...s.notizie },
    immagini: { ...base.immagini, ...s.immagini },
    qdcp: { ...base.qdcp, ...s.qdcp },
    musica: { ...base.musica, ...s.musica },
  }
}

function scrivi(chiave: string, serializzato: string) {
  try {
    localStorage.setItem(chiave, serializzato)
  } catch {
    /* quota piena o storage disabilitato: la sessione resta comunque in memoria */
  }
}

export function nuovoId(prefisso = 'id') {
  return `${prefisso}-${Math.random().toString(36).slice(2, 9)}`
}

/** Le due formazioni nell'ordine di Setup: [giocatori di A, giocatori di B]. */
export type Formazioni = [string[], string[]]

/**
 * Crea una sessione. I giocatori restano elencati squadra per squadra: dicono
 * chi c'e' al tavolo, non segnano punti — quelli sono sempre della squadra.
 */
export function creaSessione(formazioni: Formazioni, nomiSquadre: [string, string]): Sessione {
  const squadre: Squadra[] = nomiSquadre.map((nome, i) => ({
    id: `squadra-${i + 1}`,
    nome,
    colore: COLORI_SQUADRE[i],
  }))

  const giocatori: Giocatore[] = formazioni.flatMap((nomi, iSquadra) =>
    nomi.map((nome, i) => ({
      id: `g${iSquadra + 1}-${i + 1}`,
      nome: nome.trim() || `Giocatore ${i + 1}`,
      squadraId: squadre[iSquadra].id,
    })),
  )

  return {
    id: nuovoId('sessione'),
    nome: 'Serata giochi',
    creataIl: Date.now(),
    squadre,
    giocatori,
    eventi: [],
    ...avanzamentoIniziale(),
  }
}

interface ValoreStore {
  dati: DatiGiochi
  sessione: Sessione | null
  setDati: (aggiorna: (d: DatiGiochi) => DatiGiochi) => void
  ripristinaDati: () => void
  avviaSessione: (formazioni: Formazioni, nomiSquadre: [string, string]) => void
  aggiornaSessione: (aggiorna: (s: Sessione) => Sessione) => void
  chiudiSessione: () => void
  assegnaPunti: (evento: Omit<EventoPunti, 'id' | 'ts'>) => void
  annullaEvento: (id: string) => void
}

const Contesto = createContext<ValoreStore | null>(null)

export function ProviderStore({ children }: { children: ReactNode }) {
  const [dati, setDatiState] = useState<DatiGiochi>(() =>
    leggi(CHIAVE_DATI, DATI_INIZIALI, datiValidi),
  )
  const [sessione, setSessione] = useState<Sessione | null>(() =>
    riparaSessione(leggi<Sessione | null>(CHIAVE_SESSIONE, null, sessioneValida)),
  )

  /**
   * Ultimo valore che questa finestra ha scritto o ricevuto. Serve a non
   * riscrivere cio' che e' appena arrivato da un'altra finestra: senza questo
   * guardia la proiezione rimanda indietro lo stato che ha appena ricevuto, e
   * se nel frattempo la dashboard e' andata avanti l'eco la fa tornare al
   * valore precedente — cioe' un punto assegnato che sparisce da solo.
   */
  const ultimoDati = useRef<string | null>(null)
  const ultimaSessione = useRef<string | null>(null)

  useEffect(() => {
    const serializzato = JSON.stringify(dati)
    if (ultimoDati.current === serializzato) return
    ultimoDati.current = serializzato
    scrivi(CHIAVE_DATI, serializzato)
  }, [dati])

  useEffect(() => {
    const serializzato = JSON.stringify(sessione)
    if (ultimaSessione.current === serializzato) return
    ultimaSessione.current = serializzato
    scrivi(CHIAVE_SESSIONE, serializzato)
  }, [sessione])

  /**
   * Allinea le finestre aperte sulla stessa app: `storage` scatta solo negli
   * ALTRI documenti. Segnando il valore ricevuto come "gia' noto", l'effetto
   * qui sopra non lo rimanda indietro.
   */
  useEffect(() => {
    const suStorage = (e: StorageEvent) => {
      try {
        if (e.key === CHIAVE_DATI && e.newValue) {
          const v = JSON.parse(e.newValue)
          if (!datiValidi(v)) return
          ultimoDati.current = e.newValue
          setDatiState(v as DatiGiochi)
        }
        if (e.key === CHIAVE_SESSIONE) {
          const v = e.newValue ? JSON.parse(e.newValue) : null
          if (!sessioneValida(v)) return
          ultimaSessione.current = e.newValue
          setSessione(riparaSessione(v as Sessione | null))
        }
      } catch {
        /* scrittura parziale: la prossima notifica rimette in pari */
      }
    }
    window.addEventListener('storage', suStorage)
    return () => window.removeEventListener('storage', suStorage)
  }, [])

  const setDati = useCallback((aggiorna: (d: DatiGiochi) => DatiGiochi) => {
    setDatiState((d) => aggiorna(d))
  }, [])

  const ripristinaDati = useCallback(() => setDatiState(DATI_INIZIALI), [])

  const avviaSessione = useCallback((formazioni: Formazioni, nomiSquadre: [string, string]) => {
    setSessione(creaSessione(formazioni, nomiSquadre))
  }, [])

  const aggiornaSessione = useCallback((aggiorna: (s: Sessione) => Sessione) => {
    setSessione((s) => (s ? aggiorna(s) : s))
  }, [])

  const chiudiSessione = useCallback(() => setSessione(null), [])

  /**
   * Assegna i punti di una voce sostituendo un'eventuale assegnazione
   * precedente della stessa voce nello stesso gioco. Cosi' sbagliare squadra
   * si corregge cliccando quella giusta, senza passare da annulla.
   */
  const assegnaPunti = useCallback((evento: Omit<EventoPunti, 'id' | 'ts'>) => {
    setSessione((s) =>
      s
        ? {
            ...s,
            eventi: [
              ...s.eventi.filter(
                (e) => !(e.gioco === evento.gioco && e.voceId === evento.voceId),
              ),
              { ...evento, id: nuovoId('ev'), ts: Date.now() },
            ],
          }
        : s,
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

// ---------------------------------------------------------------------------
// Avanzamento — sempre ricavato dagli eventi, mai memorizzato a parte.
//
// Tenere un elenco separato di voci "chiuse" sembra comodo finche' non si
// annulla un punto: l'elenco resta indietro, i bottoni spariscono e la voce
// diventa impossibile da riassegnare. Derivandolo, annulla e riassegna
// tornano coerenti da soli.
// ---------------------------------------------------------------------------

/** L'evento con cui una voce e' stata assegnata, se esiste. */
export function assegnazioneDi(sessione: Sessione, gioco: IdGioco, voceId: string) {
  return sessione.eventi.find((e) => e.gioco === gioco && e.voceId === voceId)
}

/** Insieme degli id gia' assegnati in un gioco: per contatori e spunte. */
export function vociAssegnate(sessione: Sessione, gioco: IdGioco): Set<string> {
  const insieme = new Set<string>()
  for (const e of sessione.eventi) if (e.gioco === gioco) insieme.add(e.voceId)
  return insieme
}
