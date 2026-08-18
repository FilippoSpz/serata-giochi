import {
  AnnullaUltimo,
  AssegnaASquadra,
  IntestazioneGioco,
  NavigazionePassi,
  Regolamento,
  ServeSessione,
  StriscaAvanzamento,
  ValoreAttuale,
} from '../componenti/Comuni'
import { REGOLE } from '../dati'
import type { Rotta } from '../rotte'
import { assegnazioneDi, useStore, vociAssegnate } from '../store'
import type { ParolaQdcp } from '../tipi'

const CHIAVI: { chiave: keyof ParolaQdcp; etichetta: string }[] = [
  { chiave: 'quando', etichetta: 'Quando' },
  { chiave: 'dove', etichetta: 'Dove' },
  { chiave: 'come', etichetta: 'Come' },
  { chiave: 'perche', etichetta: 'Perché' },
]

export function Qdcp({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { dati, sessione, aggiornaSessione, assegnaPunti, annullaEvento } = useStore()

  if (!sessione) return <ServeSessione vaiASetup={() => vaiA('setup')} />
  if (dati.qdcp.length === 0)
    return <div className="vuoto card">Nessuna parola: aggiungine una da Gestione.</div>

  const stato = sessione.qdcp
  const indice = Math.min(stato.indice, dati.qdcp.length - 1)
  const parola = dati.qdcp[indice]
  const letti = Math.min(Math.max(stato.indiziLetti, 1), CHIAVI.length)
  const punti = Math.max(1, CHIAVI.length + 1 - letti)

  const assegnate = vociAssegnate(sessione, 'qdcp')
  const assegnazione = assegnazioneDi(sessione, 'qdcp', parola.id)

  const patch = (p: Partial<typeof stato>) =>
    aggiornaSessione((s) => ({ ...s, qdcp: { ...s.qdcp, ...p } }))

  const vaiAParola = (nuovo: number) =>
    patch({ indice: nuovo, indiziLetti: 1, rivelata: false })

  const indovinata = (squadraId: string, nomeSquadra: string) => {
    assegnaPunti({
      gioco: 'qdcp',
      voceId: parola.id,
      etichetta: `QDCP · ${parola.parola} — ${nomeSquadra}`,
      squadraId,
      punti,
    })
    patch({ rivelata: true })
  }

  return (
    <>
      <IntestazioneGioco
        numero={3}
        titolo="QDCP — Quando, dove, come, perché"
        sottotitolo="Gli indizi si leggono uno alla volta, sempre nello stesso ordine. Si parte da 4 punti."
        contatore={`Parola ${indice + 1} di ${dati.qdcp.length}`}
      />

      <StriscaAvanzamento
        voci={dati.qdcp.map((p) => ({ id: p.id, etichetta: p.parola }))}
        indiceCorrente={indice}
        assegnate={assegnate}
        onVaiA={vaiAParola}
      />

      <Regolamento voci={REGOLE.qdcp} />

      <div className="card" style={{ marginTop: 18 }}>
        <ValoreAttuale punti={punti} nota={`indizio ${letti} di ${CHIAVI.length}`} />

        <div className={`parola-nascosta${stato.rivelata ? '' : ' coperta'}`}>
          {stato.rivelata ? parola.parola : '? ? ? ?'}
        </div>

        <div className="indizi">
          {CHIAVI.map((c, i) => {
            const coperto = i >= letti
            return (
              <div key={c.chiave} className={`indizio${coperto ? ' indizio--coperto' : ''}`}>
                <span className="chiave">{c.etichetta}</span>
                <span className="valore">{String(parola[c.chiave])}</span>
              </div>
            )
          })}
        </div>

        <AssegnaASquadra
          sessione={sessione}
          punti={punti}
          assegnataA={assegnazione?.squadraId}
          puntiAssegnati={assegnazione?.punti}
          onAssegna={(s) => indovinata(s.id, s.nome)}
          onRimuovi={() => assegnazione && annullaEvento(assegnazione.id)}
        />

        <div className="riga-bottoni" style={{ marginTop: 12 }}>
          {letti < CHIAVI.length && (
            <button className="btn btn--primario" onClick={() => patch({ indiziLetti: letti + 1 })}>
              Leggi «{CHIAVI[letti].etichetta}» → vale {punti - 1}
            </button>
          )}
          {letti > 1 && (
            <button className="btn btn--fantasma" onClick={() => patch({ indiziLetti: letti - 1 })}>
              ← Nascondi ultimo indizio
            </button>
          )}
          <button
            className="btn btn--fantasma"
            onClick={() => patch({ rivelata: !stato.rivelata })}
          >
            {stato.rivelata ? 'Nascondi parola' : 'Rivela parola'}
          </button>
          <AnnullaUltimo />
        </div>
      </div>

      <NavigazionePassi
        onIndietro={() => vaiAParola(Math.max(0, indice - 1))}
        onAvanti={() => {
          if (indice === dati.qdcp.length - 1) vaiA('musica')
          else vaiAParola(indice + 1)
        }}
        disabilitaIndietro={indice === 0}
        etichettaAvanti={
          indice === dati.qdcp.length - 1 ? 'Vai al gioco 4 · Musica →' : 'Parola successiva →'
        }
        centro={
          <span style={{ color: 'var(--testo-fioco)', fontSize: 12.5 }}>
            {assegnate.size} / {dati.qdcp.length} assegnate
          </span>
        }
      />
    </>
  )
}
