import type { CSSProperties } from 'react'
import {
  AnnullaUltimo,
  AssegnaASquadra,
  IntestazioneGioco,
  NavigazionePassi,
  Regolamento,
  ServeSessione,
} from '../componenti/Comuni'
import { REGOLE } from '../dati'
import type { Rotta } from '../rotte'
import { useStore } from '../store'

const LETTERE = ['A', 'B', 'C', 'D', 'E', 'F']

export function Notizie({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { dati, sessione, aggiornaSessione, assegnaPunti } = useStore()

  if (!sessione) return <ServeSessione vaiASetup={() => vaiA('setup')} />
  if (dati.notizie.length === 0)
    return <div className="vuoto card">Nessuna notizia: aggiungine una da Gestione.</div>

  const stato = sessione.notizie
  const indice = Math.min(stato.indice, dati.notizie.length - 1)
  const notizia = dati.notizie[indice]

  // Chi parte alterna a ogni notizia; poi si passa la parola a ogni errore.
  const squadraCorrente = sessione.squadre[(indice + stato.tentativi.length) % 2]
  const squadraSuccessiva = sessione.squadre[(indice + stato.tentativi.length + 1) % 2]
  const chiusa = stato.chiuse.includes(notizia.id)

  const patch = (p: Partial<typeof stato>) =>
    aggiornaSessione((s) => ({ ...s, notizie: { ...s.notizie, ...p } }))

  const indovinata = (squadraId: string, nomeSquadra: string) => {
    assegnaPunti({
      gioco: 'notizie',
      voceId: notizia.id,
      etichetta: `Notizia ${indice + 1} — ${nomeSquadra}`,
      squadraId,
      punti: 1,
    })
    patch({ rivelata: true, chiuse: [...new Set([...stato.chiuse, notizia.id])] })
  }

  const sbagliata = () =>
    patch({ tentativi: [...stato.tentativi, squadraCorrente.id] })

  const vaiAllaNotizia = (nuovo: number) =>
    patch({ indice: nuovo, tentativi: [], rivelata: false })

  return (
    <>
      <IntestazioneGioco
        numero={1}
        titolo="Notizie false"
        sottotitolo="Una sola delle quattro possibilità è vera. Ogni notizia indovinata vale 1 punto."
        contatore={`Notizia ${indice + 1} di ${dati.notizie.length}`}
      />
      <Regolamento voci={REGOLE.notizie} />

      <div className="card" style={{ marginTop: 18 }}>
        {!stato.rivelata && (
          <div
            className="valore-attuale"
            style={{ '--colore': squadraCorrente.colore } as CSSProperties}
          >
            <span className="etichetta">Tocca a</span>
            <span className="numero" style={{ color: squadraCorrente.colore, fontSize: 22 }}>
              {squadraCorrente.nome}
            </span>
            {stato.tentativi.length > 0 && (
              <span style={{ color: 'var(--testo-tenue)', fontSize: 13 }}>
                · {stato.tentativi.length} tentativ{stato.tentativi.length === 1 ? 'o' : 'i'} a vuoto
              </span>
            )}
          </div>
        )}

        <p className="domanda">{notizia.domanda}</p>

        <div className="opzioni">
          {notizia.opzioni.map((opzione, i) => {
            const giusta = i === notizia.correttaIndex
            const classe = !stato.rivelata
              ? 'opzione'
              : giusta
                ? 'opzione opzione--giusta'
                : 'opzione opzione--sbagliata'
            return (
              <button
                key={i}
                className={classe}
                onClick={() => patch({ rivelata: true })}
                title={stato.rivelata ? undefined : 'Clicca per rivelare la risposta'}
              >
                <span className="lettera">{LETTERE[i]}</span>
                <span>{opzione}</span>
              </button>
            )
          })}
        </div>

        {stato.rivelata && (
          <div className="spiegazione">
            <b>Risposta</b>
            {notizia.spiegazione}
          </div>
        )}

        {!chiusa && (
          <AssegnaASquadra
            sessione={sessione}
            punti={1}
            etichetta={`Chi ha indovinato? (tocca a ${squadraCorrente.nome})`}
            onAssegna={(s) => indovinata(s.id, s.nome)}
          />
        )}

        <div className="riga-bottoni" style={{ marginTop: 14 }}>
          {!stato.rivelata && (
            <>
              <button className="btn btn--ko" onClick={sbagliata}>
                {squadraCorrente.nome} sbaglia → passa a {squadraSuccessiva.nome}
              </button>
              <button className="btn btn--fantasma" onClick={() => patch({ rivelata: true })}>
                Nessuno l’ha presa · Rivela
              </button>
            </>
          )}
          <AnnullaUltimo />
        </div>
      </div>

      <NavigazionePassi
        onIndietro={() => vaiAllaNotizia(Math.max(0, indice - 1))}
        onAvanti={() => {
          if (indice === dati.notizie.length - 1) vaiA('immagini')
          else vaiAllaNotizia(indice + 1)
        }}
        disabilitaIndietro={indice === 0}
        etichettaAvanti={
          indice === dati.notizie.length - 1 ? 'Vai al gioco 2 · Immagini →' : 'Notizia successiva →'
        }
        centro={
          <span style={{ alignSelf: 'center', color: 'var(--testo-tenue)', fontSize: 13 }}>
            {stato.chiuse.length} / {dati.notizie.length} assegnate
          </span>
        }
      />
    </>
  )
}
