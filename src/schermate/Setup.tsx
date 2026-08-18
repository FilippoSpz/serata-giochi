import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useConferma } from '../componenti/Conferma'
import type { Rotta } from '../rotte'
import { COLORI_SQUADRE, useStore } from '../store'
import type { Giocatore } from '../tipi'

const MIN_GIOCATORI = 2
const MAX_GIOCATORI = 16
const PREDEFINITI = 8

export function Setup({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { sessione, avviaSessione, aggiornaSessione, chiudiSessione } = useStore()
  const conferma = useConferma()

  const [nomiSquadre, setNomiSquadre] = useState<[string, string]>(() =>
    sessione
      ? [sessione.squadre[0].nome, sessione.squadre[1].nome]
      : ['Squadra A', 'Squadra B'],
  )
  const [nomi, setNomi] = useState<string[]>(() =>
    sessione
      ? sessione.giocatori.map((g) => g.nome)
      : Array.from({ length: PREDEFINITI }, (_, i) => `Giocatore ${i + 1}`),
  )

  const cambiaNumero = (n: number) => {
    setNomi((precedenti) => {
      if (n <= precedenti.length) return precedenti.slice(0, n)
      return [
        ...precedenti,
        ...Array.from({ length: n - precedenti.length }, (_, i) => `Giocatore ${precedenti.length + i + 1}`),
      ]
    })
  }

  const salva = () => {
    if (!sessione) {
      avviaSessione(nomi, nomiSquadre)
      vaiA('notizie')
      return
    }
    // Sessione gia' aperta: rinomina senza perdere i punti gia' assegnati.
    aggiornaSessione((s) => {
      const squadre = s.squadre.map((sq, i) => ({ ...sq, nome: nomiSquadre[i] }))
      const giocatori: Giocatore[] = nomi.map((nome, i) => {
        const esistente = s.giocatori[i]
        return {
          id: esistente?.id ?? `g-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
          nome: nome.trim() || `Giocatore ${i + 1}`,
          squadraId: squadre[i % 2].id,
        }
      })
      const idRimasti = new Set(giocatori.map((g) => g.id))
      return {
        ...s,
        squadre,
        giocatori,
        // Gli eventi dei giocatori rimossi restano a bilancio della squadra,
        // ma perdono il riferimento individuale.
        eventi: s.eventi.map((e) =>
          e.giocatoreId && !idRimasti.has(e.giocatoreId) ? { ...e, giocatoreId: undefined } : e,
        ),
        musica: { ...s.musica, turnoIndex: 0, eliminati: [] },
      }
    })
    vaiA('home')
  }

  const ricomincia = () =>
    void conferma({
      titolo: 'Azzerare la serata?',
      messaggio: `Verranno cancellati ${sessione?.eventi.length ?? 0} punti assegnati e l’avanzamento di tutti e quattro i giochi. Squadre e giocatori restano. L’operazione non è annullabile.`,
      conferma: 'Azzera tutto',
      pericolo: true,
    }).then((ok) => {
      if (!ok) return
      chiudiSessione()
      avviaSessione(nomi, nomiSquadre)
      vaiA('home')
    })

  return (
    <>
      <div className="intestazione-gioco">
        <div>
          <h2>Prepara la serata</h2>
          <div className="sottotitolo">
            I giocatori si siedono alternandosi A, B, A, B: l’ordine qui sotto è anche l’ordine dei
            turni nel gioco della musica.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-titolo">Squadre</div>
        <div className="griglia-campi griglia-campi--2">
          {nomiSquadre.map((nome, i) => (
            <div className="campo" key={i}>
              <label style={{ color: COLORI_SQUADRE[i] }}>Squadra {i === 0 ? 'A' : 'B'}</label>
              <input
                value={nome}
                onChange={(e) =>
                  setNomiSquadre((p) => (i === 0 ? [e.target.value, p[1]] : [p[0], e.target.value]))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-titolo">Giocatori ({nomi.length})</div>
        <div className="riga-bottoni" style={{ marginBottom: 16 }}>
          <button
            className="btn btn--piccolo"
            onClick={() => {
              const ultimo = nomi.length - 1
              const puntiSuoi = sessione
                ? sessione.eventi
                    .filter((e) => e.giocatoreId === sessione.giocatori[ultimo]?.id)
                    .reduce((t, e) => t + e.punti, 0)
                : 0
              if (puntiSuoi === 0) {
                cambiaNumero(Math.max(MIN_GIOCATORI, ultimo))
                return
              }
              void conferma({
                titolo: `Rimuovere ${nomi[ultimo]}?`,
                messaggio: `Ha ${puntiSuoi} punti individuali. Restano a bilancio della squadra, ma non saranno più attribuiti a nessuno.`,
                conferma: 'Rimuovi',
                pericolo: true,
              }).then((ok) => ok && cambiaNumero(Math.max(MIN_GIOCATORI, ultimo)))
            }}
            disabled={nomi.length <= MIN_GIOCATORI}
          >
            − Rimuovi
          </button>
          <button
            className="btn btn--piccolo"
            onClick={() => cambiaNumero(Math.min(MAX_GIOCATORI, nomi.length + 1))}
            disabled={nomi.length >= MAX_GIOCATORI}
          >
            + Aggiungi
          </button>
          <button className="btn btn--piccolo btn--fantasma" onClick={() => cambiaNumero(8)}>
            Torna a 8
          </button>
        </div>

        <div className="griglia-giocatori">
          {nomi.map((nome, i) => (
            <div
              key={i}
              className="riga-giocatore"
              style={{ '--colore': COLORI_SQUADRE[i % 2] } as CSSProperties}
            >
              <span className="indice">{i % 2 === 0 ? 'A' : 'B'}</span>
              <input
                value={nome}
                placeholder={`Giocatore ${i + 1}`}
                onChange={(e) =>
                  setNomi((p) => p.map((v, j) => (j === i ? e.target.value : v)))
                }
              />
            </div>
          ))}
        </div>

        <p className="avviso" style={{ marginTop: 16 }}>
          Con <b>{nomi.length} giocatori</b> ogni squadra ne ha {Math.ceil(nomi.length / 2)} e{' '}
          {Math.floor(nomi.length / 2)}. Nel gioco della musica il turno passa in quest’ordine, così
          le squadre si alternano da sole.
        </p>
      </div>

      <div className="riga-bottoni" style={{ marginTop: 18 }}>
        <button className="btn btn--primario btn--grande" onClick={salva}>
          {sessione ? 'Salva modifiche' : 'Inizia la serata'}
        </button>
        {sessione && (
          <button className="btn btn--ko" onClick={ricomincia}>
            Azzera tutto e ricomincia
          </button>
        )}
      </div>
    </>
  )
}
