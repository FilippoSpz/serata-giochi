// ---------------------------------------------------------------------------
// Contenuti dei giochi (modificabili dalla sezione Gestione)
// ---------------------------------------------------------------------------

export type IdGioco = 'notizie' | 'immagini' | 'qdcp' | 'musica'

export interface Notizia {
  id: string
  domanda: string
  opzioni: string[]
  correttaIndex: number
  spiegazione: string
}

/**
 * 'progressiva' = piu immagini per la stessa voce, il valore scala a ogni scoperta.
 * 'singola'     = una sola immagine, valore fisso.
 */
export type TipoCategoriaImmagini = 'progressiva' | 'singola'

export interface VoceImmagine {
  id: string
  nome: string
  /** Percorsi relativi a /media/immagini, in ordine di rivelazione */
  immagini: string[]
  /** Immagine di soluzione mostrata dopo la risposta */
  reveal?: string
}

export interface CategoriaImmagini {
  id: string
  nome: string
  tipo: TipoCategoriaImmagini
  /** Punti assegnati alla prima immagine; scala di 1 a ogni immagine successiva */
  puntiIniziali: number
  descrizione: string
  voci: VoceImmagine[]
}

export interface ParolaQdcp {
  id: string
  parola: string
  quando: string
  dove: string
  come: string
  perche: string
}

export interface Brano {
  id: string
  titolo: string
  artista: string
  /** Percorsi relativi a /media/musica */
  indizio1: string
  indizio2: string
  completo?: string
  /**
   * Secondo in cui parte il ritornello del brano completo. Il lettore comincia
   * qualche istante prima, cosi' si sente arrivare. Si corregge dal vivo con
   * «Segna qui» mentre il brano suona.
   */
  ritornello?: number
}

export interface CategoriaMusica {
  id: string
  nome: string
  brani: Brano[]
}

export interface DatiGiochi {
  notizie: Notizia[]
  immagini: CategoriaImmagini[]
  qdcp: ParolaQdcp[]
  musica: CategoriaMusica[]
}

// ---------------------------------------------------------------------------
// Sessione di gioco
// ---------------------------------------------------------------------------

export interface Squadra {
  id: string
  nome: string
  colore: string
}

export interface Giocatore {
  id: string
  nome: string
  squadraId: string
}

/**
 * Un punto assegnato. La serata si gioca a squadre: il punto e' sempre della
 * squadra, mai del singolo. Cosi' la classifica ha una sola colonna e non ci
 * sono due totali da tenere allineati.
 */
export interface EventoPunti {
  id: string
  gioco: IdGioco | 'manuale'
  /** id della notizia / voce immagine / parola / brano */
  voceId: string
  etichetta: string
  squadraId: string
  punti: number
  ts: number
}

/** Stato di avanzamento per il gioco delle notizie */
export interface StatoNotizie {
  indice: number
}

export interface StatoImmagini {
  categoriaIndex: number
  voceIndex: number
  /** Quante immagini sono state mostrate per la voce corrente (1..n) */
  immagineIndex: number
  rivelata: boolean
}

export interface StatoQdcp {
  indice: number
  /** Quanti indizi sono stati letti (1..4) */
  indiziLetti: number
}

export interface StatoMusica {
  categoriaIndex: number
  /** Brano evidenziato: e' quello su cui agiscono turno e scorciatoie */
  branoIndex: number
  /** Squadra di turno: indice in `Sessione.squadre` (0 o 1) */
  squadraIndex: number
  /** Moltiplicatore per brano: 1, 0.5, 0.25. Assente = pieno. */
  moltiplicatori?: Record<string, number>
}

export interface Sessione {
  id: string
  nome: string
  creataIl: number
  squadre: Squadra[]
  giocatori: Giocatore[]
  eventi: EventoPunti[]
  notizie: StatoNotizie
  immagini: StatoImmagini
  qdcp: StatoQdcp
  musica: StatoMusica
}
