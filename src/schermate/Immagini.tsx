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

export function Immagini({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { dati, sessione, aggiornaSessione, assegnaPunti, annullaEvento } = useStore()

  if (!sessione) return <ServeSessione vaiASetup={() => vaiA('setup')} />
  if (dati.immagini.length === 0)
    return <div className="vuoto card">Nessuna categoria: aggiungine una da Gestione.</div>

  const stato = sessione.immagini
  const categoria = dati.immagini[Math.min(stato.categoriaIndex, dati.immagini.length - 1)]
  const voce = categoria.voci[Math.min(stato.voceIndex, categoria.voci.length - 1)]
  const totaleImmagini = voce.immagini.length
  const mostrate = Math.min(stato.immagineIndex, totaleImmagini)
  const punti = Math.max(1, categoria.puntiIniziali - (mostrate - 1))
  const assegnate = vociAssegnate(sessione, 'immagini')
  const assegnazione = assegnazioneDi(sessione, 'immagini', voce.id)
  const ultimaVoce =
    stato.categoriaIndex === dati.immagini.length - 1 && stato.voceIndex === categoria.voci.length - 1

  const patch = (p: Partial<typeof stato>) =>
    aggiornaSessione((s) => ({ ...s, immagini: { ...s.immagini, ...p } }))

  const vaiAVoce = (categoriaIndex: number, voceIndex: number) =>
    patch({ categoriaIndex, voceIndex, immagineIndex: 1, rivelata: false })

  const indovinata = (squadraId: string, nomeSquadra: string) => {
    assegnaPunti({
      gioco: 'immagini',
      voceId: voce.id,
      etichetta: `${categoria.nome} · ${voce.nome} — ${nomeSquadra}`,
      squadraId,
      punti,
    })
    patch({ rivelata: true })
  }

  const avanti = () => {
    if (stato.voceIndex < categoria.voci.length - 1) vaiAVoce(stato.categoriaIndex, stato.voceIndex + 1)
    else if (stato.categoriaIndex < dati.immagini.length - 1) vaiAVoce(stato.categoriaIndex + 1, 0)
    else vaiA('qdcp')
  }

  const indietro = () => {
    if (stato.voceIndex > 0) vaiAVoce(stato.categoriaIndex, stato.voceIndex - 1)
    else if (stato.categoriaIndex > 0) {
      const precedente = dati.immagini[stato.categoriaIndex - 1]
      vaiAVoce(stato.categoriaIndex - 1, precedente.voci.length - 1)
    }
  }

  const immagineMostrata = stato.rivelata && voce.reveal ? voce.reveal : voce.immagini[mostrate - 1]

  return (
    <>
      <IntestazioneGioco
        numero={2}
        titolo="Immagini"
        sottotitolo={categoria.descrizione}
        contatore={`${voce.nome ? stato.voceIndex + 1 : 0} di ${categoria.voci.length} · ${categoria.nome}`}
      />

      <div className="avviso avviso--accento" style={{ marginBottom: 14 }}>
        Questo è l’unico gioco che vedono anche i giocatori.{' '}
        <button
          className="btn btn--piccolo"
          style={{ marginLeft: 8 }}
          onClick={() =>
            window.open(
              `${window.location.pathname}#/proiezione`,
              'proiezione-serata-giochi',
              'width=1280,height=800',
            )
          }
        >
          ⧉ Apri schermo giocatori
        </button>{' '}
        <span style={{ color: 'var(--testo-fioco)' }}>
          Si aggiorna da solo mentre comandi da qui. Trascinalo sulla TV e metti a schermo intero.
        </span>
      </div>

      <Regolamento voci={REGOLE.immagini} />

      <div className="selettore-categorie" style={{ marginTop: 14 }}>
        {dati.immagini.map((c, i) => {
          const completa = c.voci.every((v) => assegnate.has(v.id))
          return (
            <button
              key={c.id}
              className={`chip${completa ? ' chip--fatto' : ''}`}
              aria-pressed={i === stato.categoriaIndex}
              onClick={() => vaiAVoce(i, 0)}
            >
              {c.nome}
            </button>
          )
        })}
      </div>

      <StriscaAvanzamento
        voci={categoria.voci.map((v) => ({ id: v.id, etichetta: v.nome }))}
        indiceCorrente={stato.voceIndex}
        assegnate={assegnate}
        onVaiA={(i) => vaiAVoce(stato.categoriaIndex, i)}
      />

      <div className="card">
        <ValoreAttuale
          punti={punti}
          nota={
            categoria.tipo === 'progressiva'
              ? `immagine ${mostrate} di ${totaleImmagini}`
              : 'valore fisso'
          }
        />

        <div className="palco">
          {immagineMostrata ? (
            <img src={immagineMostrata} alt={stato.rivelata ? voce.nome : `Indizio ${mostrate}`} />
          ) : (
            <div className="segnaposto">
              Immagine non trovata.
              <br />
              Esegui <code>npm run importa-media</code> per copiare la cartella «Serata giochi».
            </div>
          )}
        </div>

        {totaleImmagini > 1 && (
          <div className="striscia-miniature">
            {voce.immagini.map((src, i) => {
              const sbloccata = i < mostrate
              return (
                <button
                  key={src}
                  className={`miniatura${i === mostrate - 1 && !stato.rivelata ? ' miniatura--attiva' : ''}${
                    sbloccata ? '' : ' miniatura--bloccata'
                  }`}
                  style={sbloccata ? { backgroundImage: `url(${src})` } : undefined}
                  disabled={!sbloccata}
                  onClick={() => patch({ immagineIndex: i + 1, rivelata: false })}
                  title={sbloccata ? `Torna all’immagine ${i + 1}` : 'Non ancora mostrata'}
                >
                  {sbloccata ? '' : i + 1}
                </button>
              )
            })}
          </div>
        )}

        {stato.rivelata && <div className="nome-soluzione">{voce.nome}</div>}

        <AssegnaASquadra
          sessione={sessione}
          punti={punti}
          assegnataA={assegnazione?.squadraId}
          puntiAssegnati={assegnazione?.punti}
          onAssegna={(s) => indovinata(s.id, s.nome)}
          onRimuovi={() => assegnazione && annullaEvento(assegnazione.id)}
        />

        <div className="riga-bottoni" style={{ marginTop: 12 }}>
          {mostrate < totaleImmagini && !stato.rivelata && (
            <button
              className="btn btn--primario"
              onClick={() => patch({ immagineIndex: mostrate + 1 })}
            >
              Mostra immagine {mostrate + 1} → vale {Math.max(1, punti - 1)}
            </button>
          )}
          {!stato.rivelata && (
            <button className="btn btn--fantasma" onClick={() => patch({ rivelata: true })}>
              Rivela soluzione
            </button>
          )}
          {stato.rivelata && (
            <button className="btn btn--fantasma" onClick={() => patch({ rivelata: false })}>
              Nascondi soluzione
            </button>
          )}
          <AnnullaUltimo />
        </div>
      </div>

      <NavigazionePassi
        onIndietro={indietro}
        onAvanti={avanti}
        disabilitaIndietro={stato.categoriaIndex === 0 && stato.voceIndex === 0}
        etichettaAvanti={ultimaVoce ? 'Vai al gioco 3 · QDCP →' : 'Prossima immagine →'}
        centro={
          <span style={{ color: 'var(--testo-fioco)', fontSize: 12.5 }}>
            {assegnate.size} / {dati.immagini.reduce((n, c) => n + c.voci.length, 0)} assegnate
          </span>
        }
      />
    </>
  )
}
