import type { CSSProperties } from 'react'
import { ServeSessione } from '../componenti/Comuni'
import type { Rotta } from '../rotte'
import {
  formattaPunti,
  nuovoId,
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

  const rettifica = (squadraId: string, delta: number) =>
    assegnaPunti({
      gioco: 'manuale',
      // Identificativo unico: le rettifiche si sommano, non si sostituiscono
      // come fanno le assegnazioni di una stessa voce di gioco.
      voceId: nuovoId('rettifica'),
      etichetta: `Rettifica manuale ${delta > 0 ? '+' : ''}${delta}`,
      squadraId,
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

      {/* Un solo punteggio per squadra: tutti e quattro i giochi assegnano li'. */}
      <div className="griglia-classifica">
        {sessione.squadre.map((s) => {
          const formazione = sessione.giocatori.filter((g) => g.squadraId === s.id)
          return (
            <div
              key={s.id}
              className="pannello-squadra"
              style={{ '--colore': s.colore } as CSSProperties}
            >
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
              {formazione.length > 0 && (
                <div className="formazione-squadra">
                  {formazione.map((g) => g.nome).join(' · ')}
                </div>
              )}
              <div className="riga-bottoni" style={{ marginTop: 14 }}>
                <button className="btn btn--piccolo" onClick={() => rettifica(s.id, 1)}>
                  +1
                </button>
                <button className="btn btn--piccolo" onClick={() => rettifica(s.id, -1)}>
                  −1
                </button>
              </div>
            </div>
          )
        })}
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
