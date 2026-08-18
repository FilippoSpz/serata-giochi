import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  AnnullaUltimo,
  IntestazioneGioco,
  NavigazionePassi,
  Regolamento,
  ServeSessione,
} from '../componenti/Comuni'
import { REGOLE } from '../dati'
import type { Rotta } from '../rotte'
import { formattaPunti, useStore } from '../store'
import type { Giocatore } from '../tipi'

/** Primo giocatore non eliminato a partire da `da`, girando in tondo. */
function indiceDiTurno(giocatori: Giocatore[], da: number, eliminati: string[]) {
  const n = giocatori.length
  for (let k = 0; k < n; k++) {
    const i = (da + k) % n
    if (!eliminati.includes(giocatori[i].id)) return i
  }
  return -1
}

/** Lettore del brano completo: se il file non c'e' (escluso dal repo) lo dice. */
function LettoreCompleto({ src }: { src: string }) {
  const [mancante, setMancante] = useState(false)
  useEffect(() => setMancante(false), [src])

  if (mancante) {
    return (
      <p className="nota-audio">
        Il brano completo non è disponibile su questa installazione: i file{' '}
        <code>completo.mp3</code> pesano ~219 MB e restano fuori dal repository. Per averli in
        locale: <code>npm run importa-media</code>.
      </p>
    )
  }
  return (
    <div className="lettore-riga">
      <span className="titolo-indizio">Completo</span>
      <audio controls src={src} onError={() => setMancante(true)} />
    </div>
  )
}

export function Musica({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { dati, sessione, aggiornaSessione, assegnaPunti } = useStore()

  if (!sessione) return <ServeSessione vaiASetup={() => vaiA('setup')} />
  if (dati.musica.length === 0)
    return <div className="vuoto card">Nessuna categoria musicale: aggiungine una da Gestione.</div>

  const stato = sessione.musica
  const categoria = dati.musica[Math.min(stato.categoriaIndex, dati.musica.length - 1)]
  const brano = categoria.brani[Math.min(stato.branoIndex, categoria.brani.length - 1)]
  const chiuso = stato.chiusi.includes(brano.id)

  const idxTurno = indiceDiTurno(sessione.giocatori, stato.turnoIndex, stato.eliminati)
  const giocatore = idxTurno >= 0 ? sessione.giocatori[idxTurno] : null
  const squadra = giocatore
    ? sessione.squadre.find((s) => s.id === giocatore.squadraId)!
    : sessione.squadre[0]

  const valoreTitolo = 1 * stato.moltiplicatore
  const valorePieno = 2 * stato.moltiplicatore
  const ultimoBrano =
    stato.categoriaIndex === dati.musica.length - 1 &&
    stato.branoIndex === categoria.brani.length - 1

  const patch = (p: Partial<typeof stato>) =>
    aggiornaSessione((s) => ({ ...s, musica: { ...s.musica, ...p } }))

  const prossimoIndice = (eliminati = stato.eliminati) =>
    idxTurno < 0 ? 0 : indiceDiTurno(sessione.giocatori, idxTurno + 1, eliminati)

  const indovina = (conArtista: boolean) => {
    if (!giocatore) return
    assegnaPunti({
      gioco: 'musica',
      voceId: brano.id,
      etichetta: `${categoria.nome} · ${brano.titolo}${conArtista ? ' + artista' : ''} — ${giocatore.nome}`,
      squadraId: giocatore.squadraId,
      giocatoreId: giocatore.id,
      punti: conArtista ? valorePieno : valoreTitolo,
    })
    patch({ rivelato: true, chiusi: [...new Set([...stato.chiusi, brano.id])] })
  }

  const sbaglia = () => {
    if (!giocatore) return
    const eliminati = [...new Set([...stato.eliminati, giocatore.id])]
    patch({ eliminati, turnoIndex: Math.max(0, prossimoIndice(eliminati)) })
  }

  const cambiaBrano = (nuovoIndice: number, moltiplicatore: number, avanzaTurno: boolean) =>
    patch({
      branoIndex: nuovoIndice,
      moltiplicatore,
      indizioSbloccato: 1,
      rivelato: false,
      turnoIndex: avanzaTurno ? Math.max(0, prossimoIndice()) : stato.turnoIndex,
    })

  const cambiaCategoria = (i: number) =>
    patch({
      categoriaIndex: i,
      branoIndex: 0,
      moltiplicatore: 1,
      indizioSbloccato: 1,
      rivelato: false,
      eliminati: [], // l'eliminazione vale solo per la categoria in corso
    })

  const avanti = () => {
    if (stato.branoIndex < categoria.brani.length - 1) cambiaBrano(stato.branoIndex + 1, 1, true)
    else if (stato.categoriaIndex < dati.musica.length - 1) cambiaCategoria(stato.categoriaIndex + 1)
    else vaiA('classifica')
  }

  const indietro = () => {
    if (stato.branoIndex > 0) cambiaBrano(stato.branoIndex - 1, 1, false)
    else if (stato.categoriaIndex > 0) cambiaCategoria(stato.categoriaIndex - 1)
  }

  return (
    <>
      <IntestazioneGioco
        numero={4}
        titolo="Musica"
        sottotitolo="Si gioca a giocatore singolo, nell’ordine in cui siete seduti. Titolo 1 punto, artista 1 punto."
        contatore={`Brano ${stato.branoIndex + 1} di ${categoria.brani.length} · ${categoria.nome}`}
      />
      <Regolamento voci={REGOLE.musica} />

      <div className="selettore-categorie" style={{ marginTop: 16 }}>
        {dati.musica.map((c, i) => {
          const completa = c.brani.every((b) => stato.chiusi.includes(b.id))
          return (
            <button
              key={c.id}
              className={`chip${completa ? ' chip--fatto' : ''}`}
              aria-pressed={i === stato.categoriaIndex}
              onClick={() => cambiaCategoria(i)}
            >
              {c.nome}
            </button>
          )
        })}
      </div>

      {giocatore ? (
        <div className="turno" style={{ '--colore': squadra.colore } as CSSProperties}>
          <div>
            <div className="etichetta">Tocca a</div>
            <div className="nome">{giocatore.nome}</div>
            <div className="squadra">{squadra.nome}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="etichetta">Vale ora</div>
            <div className="nome" style={{ color: 'var(--accento)' }}>
              {formattaPunti(valoreTitolo)} + {formattaPunti(valoreTitolo)}
            </div>
            <div className="squadra" style={{ color: 'var(--testo-tenue)' }}>
              titolo + artista = {formattaPunti(valorePieno)}
            </div>
          </div>
        </div>
      ) : (
        <div className="avviso" style={{ marginBottom: 18 }}>
          Tutti i giocatori sono usciti da questa categoria.{' '}
          <button className="btn btn--piccolo" onClick={() => patch({ eliminati: [] })}>
            Riammetti tutti
          </button>
        </div>
      )}

      <div className="giro-giocatori" style={{ marginBottom: 18 }}>
        {sessione.giocatori.map((g, i) => {
          const sq = sessione.squadre.find((s) => s.id === g.squadraId)!
          const eliminato = stato.eliminati.includes(g.id)
          return (
            <span
              key={g.id}
              className={`gettone-giocatore${i === idxTurno ? ' gettone-giocatore--attivo' : ''}${
                eliminato ? ' gettone-giocatore--eliminato' : ''
              }`}
              title={eliminato ? 'Fuori per questa categoria' : sq.nome}
            >
              <i style={{ background: sq.colore }} />
              {g.nome}
            </span>
          )
        })}
      </div>

      <div className="card">
        <div className="lettore">
          <div className="lettore-riga">
            <span className="titolo-indizio">Indizio 1</span>
            <audio controls src={brano.indizio1} preload="none" />
          </div>
          <div
            className={`lettore-riga${stato.indizioSbloccato < 2 ? ' lettore-riga--bloccata' : ''}`}
          >
            <span className="titolo-indizio">Indizio 2</span>
            {stato.indizioSbloccato >= 2 ? (
              <audio controls src={brano.indizio2} preload="none" />
            ) : (
              <span style={{ color: 'var(--testo-tenue)', fontSize: 14 }}>
                Si sblocca dimezzando il punteggio
              </span>
            )}
          </div>
          {stato.rivelato && brano.completo && <LettoreCompleto src={brano.completo} />}
        </div>

        {stato.rivelato && (
          <div className="soluzione-brano">
            <div className="titolo">{brano.titolo}</div>
            <div className="artista">{brano.artista}</div>
          </div>
        )}

        {!chiuso && giocatore && (
          <div className="assegna">
            <div className="card-titolo">{giocatore.nome} risponde</div>
            <div className="bottoni-squadre">
              <button
                className="btn-squadra"
                style={{ '--colore': 'var(--ok)' } as CSSProperties}
                onClick={() => indovina(false)}
              >
                <span>Solo il titolo</span>
                <span className="premio">+{formattaPunti(valoreTitolo)}</span>
              </button>
              <button
                className="btn-squadra"
                style={{ '--colore': 'var(--accento)' } as CSSProperties}
                onClick={() => indovina(true)}
              >
                <span>Titolo + artista</span>
                <span className="premio">+{formattaPunti(valorePieno)}</span>
              </button>
            </div>
            <div className="riga-bottoni" style={{ marginTop: 12 }}>
              <button className="btn btn--ko" onClick={sbaglia}>
                Sbaglia → esce dalla categoria
              </button>
            </div>
          </div>
        )}

        <div className="assegna">
          <div className="card-titolo">Chi riceve il brano</div>
          <div className="riga-bottoni">
            <button
              className="btn"
              disabled={stato.indizioSbloccato >= 2}
              onClick={() =>
                patch({ indizioSbloccato: 2, moltiplicatore: stato.moltiplicatore / 2 })
              }
            >
              Ascolta i 10s successivi · dimezza a {formattaPunti(valorePieno / 2)}
            </button>
            <button
              className="btn"
              disabled={stato.branoIndex >= categoria.brani.length - 1}
              onClick={() => cambiaBrano(stato.branoIndex + 1, stato.moltiplicatore / 2, false)}
            >
              Passa al brano successivo · dimezza a {formattaPunti(valorePieno / 2)}
            </button>
          </div>
        </div>

        <div className="riga-bottoni" style={{ marginTop: 14 }}>
          <button
            className="btn btn--fantasma"
            onClick={() => patch({ rivelato: !stato.rivelato })}
          >
            {stato.rivelato ? 'Nascondi soluzione' : 'Rivela titolo e artista'}
          </button>
          <button
            className="btn btn--fantasma"
            onClick={() => patch({ moltiplicatore: 1, indizioSbloccato: 1 })}
            disabled={stato.moltiplicatore === 1 && stato.indizioSbloccato === 1}
          >
            Ripristina valore pieno
          </button>
          {stato.eliminati.length > 0 && (
            <button className="btn btn--fantasma" onClick={() => patch({ eliminati: [] })}>
              Riammetti tutti ({stato.eliminati.length})
            </button>
          )}
          <AnnullaUltimo />
        </div>
      </div>

      <NavigazionePassi
        onIndietro={indietro}
        onAvanti={avanti}
        disabilitaIndietro={stato.categoriaIndex === 0 && stato.branoIndex === 0}
        etichettaAvanti={ultimoBrano ? 'Vai alla classifica finale →' : 'Brano successivo →'}
        centro={
          <span style={{ alignSelf: 'center', color: 'var(--testo-tenue)', fontSize: 13 }}>
            {stato.chiusi.length} / {dati.musica.reduce((n, c) => n + c.brani.length, 0)} brani
          </span>
        }
      />
    </>
  )
}
