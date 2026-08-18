import type { CSSProperties, ReactNode } from 'react'
import { formattaPunti, punteggioSquadra, useStore } from '../store'
import type { Sessione, Squadra } from '../tipi'

/** Blocco pieghevole con le regole trascritte dal PDF. */
export function Regolamento({ voci }: { voci: readonly string[] }) {
  return (
    <details className="regolamento card">
      <summary>Come si gioca</summary>
      <ul className="regole">
        {voci.map((v, i) => (
          <li key={i}>{v}</li>
        ))}
      </ul>
    </details>
  )
}

export function IntestazioneGioco({
  numero,
  titolo,
  sottotitolo,
  contatore,
}: {
  numero: number
  titolo: string
  sottotitolo?: string
  contatore?: string
}) {
  return (
    <div className="intestazione-gioco">
      <div>
        <h2>
          <span className="numero-gioco">{numero}</span>
          {titolo}
        </h2>
        {sottotitolo && <div className="sottotitolo">{sottotitolo}</div>}
      </div>
      {contatore && <div className="contatore">{contatore}</div>}
    </div>
  )
}

export function ValoreAttuale({ punti, nota }: { punti: number; nota?: string }) {
  return (
    <div className="valore-attuale">
      <span className="etichetta">Vale ora</span>
      <span className="numero">{formattaPunti(punti)}</span>
      <span className="etichetta">{punti === 1 ? 'punto' : 'punti'}</span>
      {nota && <span style={{ color: 'var(--testo-tenue)', fontSize: 13 }}>· {nota}</span>}
    </div>
  )
}

/**
 * Riga di bottoni "chi ha indovinato": uno per squadra, con il valore corrente.
 * Restano sempre attivi anche dopo l'assegnazione: cliccare l'altra squadra
 * sposta il punto, cliccare quella gia' segnata lo toglie. Nessun vicolo cieco.
 */
export function AssegnaASquadra({
  sessione,
  punti,
  assegnataA,
  puntiAssegnati,
  etichetta = 'Chi ha indovinato?',
  onAssegna,
  onRimuovi,
}: {
  sessione: Sessione
  punti: number
  /** Squadra che ha gia' preso questa voce, se c'e' */
  assegnataA?: string
  /** Punti effettivamente assegnati, che possono differire dal valore corrente */
  puntiAssegnati?: number
  etichetta?: string
  onAssegna: (squadra: Squadra) => void
  onRimuovi?: () => void
}) {
  const squadraAssegnata = sessione.squadre.find((s) => s.id === assegnataA)

  return (
    <div className="assegna">
      <div className="card-titolo">
        {squadraAssegnata ? (
          <>
            Assegnata a <span style={{ color: squadraAssegnata.colore }}>{squadraAssegnata.nome}</span>{' '}
            <span style={{ color: 'var(--testo-fioco)', fontWeight: 500, textTransform: 'none' }}>
              — clicca l’altra squadra per spostare il punto
            </span>
          </>
        ) : (
          etichetta
        )}
      </div>
      <div className="bottoni-squadre">
        {sessione.squadre.map((s) => {
          const sua = s.id === assegnataA
          return (
            <button
              key={s.id}
              className={`btn-squadra${sua ? ' btn-squadra--assegnata' : ''}`}
              style={{ '--colore': s.colore } as CSSProperties}
              onClick={() => (sua ? onRimuovi?.() : onAssegna(s))}
              title={sua ? 'Clicca per togliere il punto' : `Assegna a ${s.nome}`}
            >
              <span>
                {sua && <span className="segno-assegnata">✓ </span>}
                {s.nome}
              </span>
              <span className="premio">
                {sua ? formattaPunti(puntiAssegnati ?? punti) : `+${formattaPunti(punti)}`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Striscia di navigazione: una casella per voce, spuntata quando assegnata.
 * Serve a vedere a colpo d'occhio cosa manca e a saltarci sopra direttamente,
 * senza scorrere avanti e indietro con "precedente"/"successivo".
 */
export function StriscaAvanzamento({
  voci,
  indiceCorrente,
  assegnate,
  onVaiA,
}: {
  voci: { id: string; etichetta: string }[]
  indiceCorrente: number
  assegnate: Set<string>
  onVaiA: (i: number) => void
}) {
  return (
    <div className="striscia-avanzamento">
      {voci.map((v, i) => {
        const fatta = assegnate.has(v.id)
        return (
          <button
            key={v.id}
            className={`passo${i === indiceCorrente ? ' passo--corrente' : ''}${
              fatta ? ' passo--fatto' : ''
            }`}
            onClick={() => onVaiA(i)}
            title={`${v.etichetta}${fatta ? ' — già assegnata' : ''}`}
            aria-current={i === indiceCorrente}
          >
            {fatta ? '✓' : i + 1}
          </button>
        )
      })}
    </div>
  )
}

export function NavigazionePassi({
  onIndietro,
  onAvanti,
  etichettaIndietro = '← Precedente',
  etichettaAvanti = 'Successivo →',
  disabilitaIndietro,
  disabilitaAvanti,
  centro,
}: {
  onIndietro: () => void
  onAvanti: () => void
  etichettaIndietro?: string
  etichettaAvanti?: string
  disabilitaIndietro?: boolean
  disabilitaAvanti?: boolean
  centro?: ReactNode
}) {
  return (
    <div className="navigazione-passi">
      <button className="btn btn--fantasma" onClick={onIndietro} disabled={disabilitaIndietro}>
        {etichettaIndietro}
      </button>
      {centro}
      <button className="btn" onClick={onAvanti} disabled={disabilitaAvanti}>
        {etichettaAvanti}
      </button>
    </div>
  )
}

/** Schermata mostrata quando si apre un gioco senza aver creato la sessione. */
export function ServeSessione({ vaiASetup }: { vaiASetup: () => void }) {
  return (
    <div className="vuoto card">
      <h3>Nessuna sessione aperta</h3>
      <p>
        Prima di giocare crea la sessione: dai un nome alle due squadre e ai giocatori.
        <br />I punteggi vengono poi salvati automaticamente nel browser.
      </p>
      <button className="btn btn--primario btn--grande" onClick={vaiASetup}>
        Prepara la serata
      </button>
    </div>
  )
}

/** Pillole con il punteggio delle due squadre, mostrate nella barra in alto. */
export function PunteggiRapidi({ sessione }: { sessione: Sessione }) {
  return (
    <div className="topbar-punteggi">
      {sessione.squadre.map((s) => (
        <div key={s.id} className="pillola-squadra">
          <i style={{ background: s.colore }} />
          <span>{s.nome}</span>
          <b>{formattaPunti(punteggioSquadra(sessione, s.id))}</b>
        </div>
      ))}
    </div>
  )
}

/** Ultimo evento registrato, con possibilita' di annullarlo al volo. */
export function AnnullaUltimo() {
  const { sessione, annullaEvento } = useStore()
  if (!sessione || sessione.eventi.length === 0) return null
  const ultimo = sessione.eventi[sessione.eventi.length - 1]
  const squadra = sessione.squadre.find((s) => s.id === ultimo.squadraId)
  return (
    <button
      className="btn btn--piccolo btn--fantasma"
      onClick={() => annullaEvento(ultimo.id)}
      title={ultimo.etichetta}
    >
      ↩ Annulla ultimo ({squadra?.nome} {ultimo.punti > 0 ? '+' : ''}
      {formattaPunti(ultimo.punti)})
    </button>
  )
}
