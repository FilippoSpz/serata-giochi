import type { CSSProperties } from 'react'
import {
  AnnullaUltimo,
  AssegnaASquadra,
  IntestazioneGioco,
  NavigazionePassi,
  Regolamento,
  ServeSessione,
  StriscaAvanzamento,
} from '../componenti/Comuni'
import { REGOLE } from '../dati'
import type { Rotta } from '../rotte'
import { assegnazioneDi, useStore, vociAssegnate } from '../store'

const LETTERE = ['A', 'B', 'C', 'D', 'E', 'F']

export function Notizie({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { dati, sessione, aggiornaSessione, assegnaPunti, annullaEvento } = useStore()

  if (!sessione) return <ServeSessione vaiASetup={() => vaiA('setup')} />
  if (dati.notizie.length === 0)
    return <div className="vuoto card">Nessuna notizia: aggiungine una da Gestione.</div>

  const stato = sessione.notizie
  const indice = Math.min(stato.indice, dati.notizie.length - 1)
  const notizia = dati.notizie[indice]

  // Le squadre si alternano una notizia a testa: la parita' dell'indice basta,
  // niente stato da tenere allineato.
  const squadraCorrente = sessione.squadre[indice % 2]

  const assegnate = vociAssegnate(sessione, 'notizie')
  const assegnazione = assegnazioneDi(sessione, 'notizie', notizia.id)

  const vaiAllaNotizia = (nuovo: number) =>
    aggiornaSessione((s) => ({ ...s, notizie: { ...s.notizie, indice: nuovo } }))

  const indovinata = (squadraId: string, nomeSquadra: string) =>
    assegnaPunti({
      gioco: 'notizie',
      voceId: notizia.id,
      etichetta: `Notizia ${indice + 1} — ${nomeSquadra}`,
      squadraId,
      punti: 1,
    })

  return (
    <>
      <IntestazioneGioco
        numero={1}
        titolo="Notizie false"
        sottotitolo="Una sola delle quattro possibilità è vera. Ogni notizia indovinata vale 1 punto."
        contatore={`Notizia ${indice + 1} di ${dati.notizie.length}`}
      />

      <StriscaAvanzamento
        voci={dati.notizie.map((n, i) => ({ id: n.id, etichetta: `Notizia ${i + 1}` }))}
        indiceCorrente={indice}
        assegnate={assegnate}
        onVaiA={vaiAllaNotizia}
      />

      <Regolamento voci={REGOLE.notizie} />

      <div className="card" style={{ marginTop: 14 }}>
        <div
          className="valore-attuale"
          style={{ '--colore': squadraCorrente.colore } as CSSProperties}
        >
          <span className="etichetta">Tocca a</span>
          <span className="numero" style={{ color: squadraCorrente.colore, fontSize: 18 }}>
            {squadraCorrente.nome}
          </span>
          <span style={{ color: 'var(--testo-fioco)', fontSize: 12.5 }}>
            · le squadre si alternano una notizia a testa
          </span>
        </div>

        <p className="domanda">{notizia.domanda}</p>

        {/* Questa schermata la vede solo chi conduce: la risposta e' gia' in
            chiaro, senza rivelazioni da azionare mentre si legge ad alta voce. */}
        <div className="opzioni">
          {notizia.opzioni.map((opzione, i) => {
            const giusta = i === notizia.correttaIndex
            return (
              <div key={i} className={`opzione opzione--statica${giusta ? ' opzione--giusta' : ''}`}>
                <span className="lettera">{LETTERE[i]}</span>
                <span>{opzione}</span>
                {giusta && <span className="segno-giusta">vera</span>}
              </div>
            )
          })}
        </div>

        <div className="spiegazione">
          <b>Risposta</b>
          {notizia.spiegazione}
        </div>

        <AssegnaASquadra
          sessione={sessione}
          punti={1}
          assegnataA={assegnazione?.squadraId}
          puntiAssegnati={assegnazione?.punti}
          etichetta={`Chi ha indovinato? (tocca a ${squadraCorrente.nome})`}
          onAssegna={(s) => indovinata(s.id, s.nome)}
          onRimuovi={() => assegnazione && annullaEvento(assegnazione.id)}
        />

        <div className="riga-bottoni" style={{ marginTop: 12 }}>
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
          <span style={{ color: 'var(--testo-fioco)', fontSize: 12.5 }}>
            {assegnate.size} / {dati.notizie.length} assegnate
          </span>
        }
      />
    </>
  )
}
