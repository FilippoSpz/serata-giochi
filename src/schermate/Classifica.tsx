import type { CSSProperties } from 'react'
import { ServeSessione } from '../componenti/Comuni'
import type { Rotta } from '../rotte'
import {
  formattaPunti,
  punteggioGiocatore,
  punteggioSquadra,
  punteggioSquadraPerGioco,
  useStore,
} from '../store'

const GIOCHI = [
  { id: 'notizie', nome: '1 · Notizie false' },
  { id: 'immagini', nome: '2 · Immagini' },
  { id: 'qdcp', nome: '3 · QDCP' },
  { id: 'musica', nome: '4 · Musica' },
  { id: 'manuale', nome: 'Rettifiche' },
] as const

export function Classifica({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { sessione, assegnaPunti, annullaEvento } = useStore()

  if (!sessione) return <ServeSessione vaiASetup={() => vaiA('setup')} />

  const totali = sessione.squadre.map((s) => ({ s, punti: punteggioSquadra(sessione, s.id) }))
  const massimo = Math.max(...totali.map((t) => t.punti))
  const pareggio = totali.filter((t) => t.punti === massimo).length > 1

  const giocatoriOrdinati = [...sessione.giocatori]
    .map((g) => ({ g, punti: punteggioGiocatore(sessione, g.id) }))
    .sort((a, b) => b.punti - a.punti)

  const rettifica = (squadraId: string, giocatoreId: string | undefined, delta: number) =>
    assegnaPunti({
      gioco: 'manuale',
      voceId: 'rettifica',
      etichetta: `Rettifica manuale ${delta > 0 ? '+' : ''}${delta}`,
      squadraId,
      giocatoreId,
      punti: delta,
    })

  return (
    <>
      <div className="intestazione-gioco">
        <div>
          <h2>Classifica</h2>
          <div className="sottotitolo">
            {massimo === 0
              ? 'Nessun punto assegnato per ora.'
              : pareggio
                ? 'Situazione di parità.'
                : `In testa ${totali.find((t) => t.punti === massimo)!.s.nome}.`}
          </div>
        </div>
        <button className="btn btn--fantasma btn--piccolo" onClick={() => window.print()}>
          Stampa
        </button>
      </div>

      <div className="griglia-classifica">
        {sessione.squadre.map((s) => (
          <div key={s.id} className="pannello-squadra" style={{ '--colore': s.colore } as CSSProperties}>
            <div className="nome">{s.nome}</div>
            <div className="totale">{formattaPunti(punteggioSquadra(sessione, s.id))}</div>
            <div className="dettaglio">
              {GIOCHI.map((g) => {
                const p = punteggioSquadraPerGioco(sessione, s.id, g.id)
                if (g.id === 'manuale' && p === 0) return null
                return (
                  <div key={g.id}>
                    <span>{g.nome}</span>
                    <b>{formattaPunti(p)}</b>
                  </div>
                )
              })}
            </div>
            <div className="riga-bottoni" style={{ marginTop: 14 }}>
              <button className="btn btn--piccolo" onClick={() => rettifica(s.id, undefined, 1)}>
                +1
              </button>
              <button className="btn btn--piccolo" onClick={() => rettifica(s.id, undefined, -1)}>
                −1
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-titolo">Punteggi individuali ({sessione.giocatori.length} giocatori)</div>
        <p className="avviso" style={{ marginBottom: 14 }}>
          I punti individuali arrivano dal gioco della musica, l’unico che si gioca a giocatore
          singolo. Gli altri tre assegnano punti direttamente alla squadra, quindi il totale di
          squadra è sempre maggiore o uguale alla somma dei suoi giocatori.
        </p>
        <div className="scorri">
          <table className="tabella">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Giocatore</th>
                <th>Squadra</th>
                <th className="num">Punti musica</th>
                <th className="num" style={{ width: 120 }}>
                  Rettifica
                </th>
              </tr>
            </thead>
            <tbody>
              {giocatoriOrdinati.map(({ g, punti }, i) => {
                const sq = sessione.squadre.find((s) => s.id === g.squadraId)!
                return (
                  <tr key={g.id}>
                    <td style={{ color: 'var(--testo-tenue)' }}>{i + 1}</td>
                    <td>
                      <b>{g.nome}</b>
                    </td>
                    <td style={{ color: sq.colore, fontWeight: 700 }}>{sq.nome}</td>
                    <td className="num punti-forte">{formattaPunti(punti)}</td>
                    <td className="num">
                      <button
                        className="btn btn--piccolo"
                        onClick={() => rettifica(g.squadraId, g.id, 1)}
                      >
                        +1
                      </button>{' '}
                      <button
                        className="btn btn--piccolo"
                        onClick={() => rettifica(g.squadraId, g.id, -1)}
                      >
                        −1
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-titolo">Registro punti ({sessione.eventi.length})</div>
        {sessione.eventi.length === 0 ? (
          <p style={{ color: 'var(--testo-tenue)' }}>Ancora nessun punto assegnato.</p>
        ) : (
          <div className="registro">
            {[...sessione.eventi].reverse().map((e) => {
              const sq = sessione.squadre.find((s) => s.id === e.squadraId)
              return (
                <div
                  key={e.id}
                  className="voce-registro"
                  style={{ '--colore': sq?.colore ?? 'var(--testo)' } as CSSProperties}
                >
                  <span className="chi">{sq?.nome ?? '—'}</span>
                  <span className="cosa">{e.etichetta}</span>
                  <span className="pt">
                    {e.punti > 0 ? '+' : ''}
                    {formattaPunti(e.punti)}
                  </span>
                  <button
                    className="btn btn--piccolo btn--fantasma"
                    onClick={() => annullaEvento(e.id)}
                    title="Annulla questa assegnazione"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
