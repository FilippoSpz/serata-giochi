import { useRef, useState } from 'react'
import { useConferma } from '../componenti/Conferma'
import { DATI_INIZIALI } from '../dati'
import { nuovoId, useStore } from '../store'
import type {
  Brano,
  CategoriaImmagini,
  CategoriaMusica,
  DatiGiochi,
  Notizia,
  ParolaQdcp,
  VoceImmagine,
} from '../tipi'

type Scheda = 'notizie' | 'immagini' | 'qdcp' | 'musica' | 'file'

const SCHEDE: { id: Scheda; nome: string }[] = [
  { id: 'notizie', nome: '1 Notizie false' },
  { id: 'immagini', nome: '2 Immagini' },
  { id: 'qdcp', nome: '3 QDCP' },
  { id: 'musica', nome: '4 Musica' },
  { id: 'file', nome: 'Backup e ripristino' },
]

/** Chiede conferma, esegue, e tiene da parte lo stato precedente per annullare. */
type Elimina = (cosa: string, dettaglio: string | undefined, azione: () => void) => void

type Props = {
  dati: DatiGiochi
  setDati: (f: (d: DatiGiochi) => DatiGiochi) => void
  elimina: Elimina
}

export function Gestione() {
  const { dati, setDati, ripristinaDati } = useStore()
  const conferma = useConferma()
  const [scheda, setScheda] = useState<Scheda>('notizie')
  const [annullabile, setAnnullabile] = useState<{ dati: DatiGiochi; cosa: string } | null>(null)

  const elimina: Elimina = (cosa, dettaglio, azione) => {
    const istantanea = dati
    void conferma({
      titolo: `Eliminare ${cosa}?`,
      messaggio: dettaglio,
      conferma: 'Elimina',
      pericolo: true,
    }).then((ok) => {
      if (!ok) return
      setAnnullabile({ dati: istantanea, cosa })
      azione()
    })
  }

  const annulla = () => {
    if (!annullabile) return
    setDati(() => annullabile.dati)
    setAnnullabile(null)
  }

  const props: Props = { dati, setDati, elimina }

  return (
    <>
      <div className="intestazione-gioco">
        <div>
          <h2>Gestione contenuti</h2>
          <div className="sottotitolo">
            Ogni modifica è salvata subito nel browser. Le eliminazioni chiedono conferma e restano
            annullabili finché non cambi scheda.
          </div>
        </div>
      </div>

      {annullabile && (
        <div className="avviso avviso--accento" style={{ marginBottom: 14 }}>
          Eliminato: <b>{annullabile.cosa}</b>
          <button className="btn btn--piccolo" style={{ marginLeft: 12 }} onClick={annulla}>
            ↩ Annulla eliminazione
          </button>
          <button
            className="btn btn--piccolo btn--fantasma"
            style={{ marginLeft: 6 }}
            onClick={() => setAnnullabile(null)}
          >
            Va bene così
          </button>
        </div>
      )}

      <div className="selettore-categorie">
        {SCHEDE.map((s) => (
          <button
            key={s.id}
            className="chip"
            aria-pressed={scheda === s.id}
            onClick={() => {
              setScheda(s.id)
              setAnnullabile(null)
            }}
          >
            {s.nome}
          </button>
        ))}
      </div>

      {scheda === 'notizie' && <ModificaNotizie {...props} />}
      {scheda === 'immagini' && <ModificaImmagini {...props} />}
      {scheda === 'qdcp' && <ModificaQdcp {...props} />}
      {scheda === 'musica' && <ModificaMusica {...props} />}
      {scheda === 'file' && (
        <BackupRipristino {...props} ripristina={ripristinaDati} setAnnullabile={setAnnullabile} />
      )}
    </>
  )
}

// ---------------------------------------------------------------- notizie
function ModificaNotizie({ dati, setDati, elimina }: Props) {
  const aggiorna = (id: string, campo: Partial<Notizia>) =>
    setDati((d) => ({
      ...d,
      notizie: d.notizie.map((n) => (n.id === id ? { ...n, ...campo } : n)),
    }))

  return (
    <div className="card">
      <div className="card-titolo">Notizie ({dati.notizie.length})</div>
      <div className="elenco-modifica">
        {dati.notizie.map((n, i) => (
          <div key={n.id} className="blocco-modifica">
            <div className="testa">
              <strong>Notizia {i + 1}</strong>
              <button
                className="btn btn--piccolo btn--ko"
                onClick={() =>
                  elimina(`la notizia ${i + 1}`, n.domanda.slice(0, 120), () =>
                    setDati((d) => ({ ...d, notizie: d.notizie.filter((x) => x.id !== n.id) })),
                  )
                }
              >
                Elimina
              </button>
            </div>
            <div className="griglia-campi">
              <div className="campo">
                <label>Domanda</label>
                <textarea
                  value={n.domanda}
                  onChange={(e) => aggiorna(n.id, { domanda: e.target.value })}
                />
              </div>
              <div className="campo">
                <label>Opzioni — spunta quella vera</label>
                {n.opzioni.map((o, j) => (
                  <div key={j} className="riga-opzione-modifica">
                    <input
                      type="radio"
                      name={`giusta-${n.id}`}
                      checked={n.correttaIndex === j}
                      onChange={() => aggiorna(n.id, { correttaIndex: j })}
                    />
                    <input
                      type="text"
                      value={o}
                      onChange={(e) =>
                        aggiorna(n.id, {
                          opzioni: n.opzioni.map((v, k) => (k === j ? e.target.value : v)),
                        })
                      }
                    />
                    <button
                      className="btn btn--piccolo btn--fantasma"
                      disabled={n.opzioni.length <= 2}
                      title="Elimina questa opzione"
                      onClick={() =>
                        elimina(`l’opzione «${o.slice(0, 60)}»`, undefined, () =>
                          aggiorna(n.id, {
                            opzioni: n.opzioni.filter((_, k) => k !== j),
                            correttaIndex:
                              n.correttaIndex === j
                                ? 0
                                : n.correttaIndex > j
                                  ? n.correttaIndex - 1
                                  : n.correttaIndex,
                          }),
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  className="btn btn--piccolo"
                  style={{ alignSelf: 'flex-start', marginTop: 6 }}
                  onClick={() => aggiorna(n.id, { opzioni: [...n.opzioni, 'Nuova opzione'] })}
                >
                  + Opzione
                </button>
              </div>
              <div className="campo">
                <label>Spiegazione letta dopo la risposta</label>
                <textarea
                  value={n.spiegazione}
                  onChange={(e) => aggiorna(n.id, { spiegazione: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn btn--primario"
        style={{ marginTop: 14 }}
        onClick={() =>
          setDati((d) => ({
            ...d,
            notizie: [
              ...d.notizie,
              {
                id: nuovoId('not'),
                domanda: 'Nuova domanda',
                opzioni: ['Opzione 1', 'Opzione 2', 'Opzione 3', 'Opzione 4'],
                correttaIndex: 0,
                spiegazione: '',
              },
            ],
          }))
        }
      >
        + Aggiungi notizia
      </button>
    </div>
  )
}

// --------------------------------------------------------------- immagini
function ModificaImmagini({ dati, setDati, elimina }: Props) {
  const aggiornaCategoria = (id: string, campo: Partial<CategoriaImmagini>) =>
    setDati((d) => ({
      ...d,
      immagini: d.immagini.map((c) => (c.id === id ? { ...c, ...campo } : c)),
    }))

  const aggiornaVoce = (catId: string, voceId: string, campo: Partial<VoceImmagine>) =>
    setDati((d) => ({
      ...d,
      immagini: d.immagini.map((c) =>
        c.id === catId
          ? { ...c, voci: c.voci.map((v) => (v.id === voceId ? { ...v, ...campo } : v)) }
          : c,
      ),
    }))

  return (
    <>
      {dati.immagini.map((c) => (
        <div key={c.id} className="card">
          <div className="griglia-campi griglia-campi--2" style={{ marginBottom: 12 }}>
            <div className="campo">
              <label>Nome categoria</label>
              <input
                value={c.nome}
                onChange={(e) => aggiornaCategoria(c.id, { nome: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Punti alla prima immagine</label>
              <input
                type="number"
                min={1}
                max={10}
                value={c.puntiIniziali}
                onChange={(e) =>
                  aggiornaCategoria(c.id, { puntiIniziali: Number(e.target.value) || 1 })
                }
              />
            </div>
          </div>
          <div className="campo" style={{ marginBottom: 12 }}>
            <label>Descrizione mostrata durante il gioco</label>
            <input
              value={c.descrizione}
              onChange={(e) => aggiornaCategoria(c.id, { descrizione: e.target.value })}
            />
          </div>

          <div className="elenco-modifica">
            {c.voci.map((v) => (
              <div key={v.id} className="blocco-modifica">
                <div className="testa">
                  <strong>{v.nome}</strong>
                  <button
                    className="btn btn--piccolo btn--ko"
                    onClick={() =>
                      elimina(
                        `«${v.nome}» da ${c.nome}`,
                        `${v.immagini.length} immagini collegate. I file restano su disco.`,
                        () =>
                          setDati((d) => ({
                            ...d,
                            immagini: d.immagini.map((cc) =>
                              cc.id === c.id
                                ? { ...cc, voci: cc.voci.filter((vv) => vv.id !== v.id) }
                                : cc,
                            ),
                          })),
                      )
                    }
                  >
                    Elimina
                  </button>
                </div>
                <div className="griglia-campi">
                  <div className="campo">
                    <label>Soluzione</label>
                    <input
                      value={v.nome}
                      onChange={(e) => aggiornaVoce(c.id, v.id, { nome: e.target.value })}
                    />
                  </div>
                  <div className="campo">
                    <label>Percorsi immagini — uno per riga, in ordine di rivelazione</label>
                    <textarea
                      value={v.immagini.join('\n')}
                      onChange={(e) =>
                        aggiornaVoce(c.id, v.id, {
                          immagini: e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div className="campo">
                    <label>Immagine di soluzione (facoltativa)</label>
                    <input
                      value={v.reveal ?? ''}
                      placeholder="/media/immagini/…/reveal.jpg"
                      onChange={(e) =>
                        aggiornaVoce(c.id, v.id, { reveal: e.target.value.trim() || undefined })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn--primario"
            style={{ marginTop: 14 }}
            onClick={() =>
              setDati((d) => ({
                ...d,
                immagini: d.immagini.map((cc) =>
                  cc.id === c.id
                    ? {
                        ...cc,
                        voci: [...cc.voci, { id: nuovoId('voce'), nome: 'Nuova voce', immagini: [] }],
                      }
                    : cc,
                ),
              }))
            }
          >
            + Aggiungi voce a «{c.nome}»
          </button>
        </div>
      ))}
    </>
  )
}

// ------------------------------------------------------------------- qdcp
function ModificaQdcp({ dati, setDati, elimina }: Props) {
  const aggiorna = (id: string, campo: Partial<ParolaQdcp>) =>
    setDati((d) => ({ ...d, qdcp: d.qdcp.map((p) => (p.id === id ? { ...p, ...campo } : p)) }))

  return (
    <div className="card">
      <div className="card-titolo">Parole ({dati.qdcp.length})</div>
      <div className="elenco-modifica">
        {dati.qdcp.map((p) => (
          <div key={p.id} className="blocco-modifica">
            <div className="testa">
              <strong>{p.parola}</strong>
              <button
                className="btn btn--piccolo btn--ko"
                onClick={() =>
                  elimina(`la parola «${p.parola}»`, 'Con tutti e quattro i suoi indizi.', () =>
                    setDati((d) => ({ ...d, qdcp: d.qdcp.filter((x) => x.id !== p.id) })),
                  )
                }
              >
                Elimina
              </button>
            </div>
            <div className="griglia-campi griglia-campi--2">
              <div className="campo">
                <label>Parola</label>
                <input value={p.parola} onChange={(e) => aggiorna(p.id, { parola: e.target.value })} />
              </div>
              <div className="campo">
                <label>Quando</label>
                <input value={p.quando} onChange={(e) => aggiorna(p.id, { quando: e.target.value })} />
              </div>
              <div className="campo">
                <label>Dove</label>
                <input value={p.dove} onChange={(e) => aggiorna(p.id, { dove: e.target.value })} />
              </div>
              <div className="campo">
                <label>Come</label>
                <input value={p.come} onChange={(e) => aggiorna(p.id, { come: e.target.value })} />
              </div>
              <div className="campo">
                <label>Perché</label>
                <input value={p.perche} onChange={(e) => aggiorna(p.id, { perche: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn btn--primario"
        style={{ marginTop: 14 }}
        onClick={() =>
          setDati((d) => ({
            ...d,
            qdcp: [
              ...d.qdcp,
              { id: nuovoId('qdcp'), parola: 'Nuova parola', quando: '', dove: '', come: '', perche: '' },
            ],
          }))
        }
      >
        + Aggiungi parola
      </button>
    </div>
  )
}

// ----------------------------------------------------------------- musica
function ModificaMusica({ dati, setDati, elimina }: Props) {
  const aggiornaCategoria = (id: string, campo: Partial<CategoriaMusica>) =>
    setDati((d) => ({ ...d, musica: d.musica.map((c) => (c.id === id ? { ...c, ...campo } : c)) }))

  const aggiornaBrano = (catId: string, branoId: string, campo: Partial<Brano>) =>
    setDati((d) => ({
      ...d,
      musica: d.musica.map((c) =>
        c.id === catId
          ? { ...c, brani: c.brani.map((b) => (b.id === branoId ? { ...b, ...campo } : b)) }
          : c,
      ),
    }))

  return (
    <>
      {dati.musica.map((c) => (
        <div key={c.id} className="card">
          <div className="campo" style={{ marginBottom: 12 }}>
            <label>Nome categoria</label>
            <input value={c.nome} onChange={(e) => aggiornaCategoria(c.id, { nome: e.target.value })} />
          </div>
          <div className="elenco-modifica">
            {c.brani.map((b, i) => (
              <div key={b.id} className="blocco-modifica">
                <div className="testa">
                  <strong>
                    {i + 1}. {b.titolo}
                  </strong>
                  <button
                    className="btn btn--piccolo btn--ko"
                    onClick={() =>
                      elimina(
                        `«${b.titolo}» da ${c.nome}`,
                        'I file audio restano su disco.',
                        () =>
                          setDati((d) => ({
                            ...d,
                            musica: d.musica.map((cc) =>
                              cc.id === c.id
                                ? { ...cc, brani: cc.brani.filter((bb) => bb.id !== b.id) }
                                : cc,
                            ),
                          })),
                      )
                    }
                  >
                    Elimina
                  </button>
                </div>
                <div className="griglia-campi griglia-campi--2">
                  <div className="campo">
                    <label>Titolo</label>
                    <input
                      value={b.titolo}
                      onChange={(e) => aggiornaBrano(c.id, b.id, { titolo: e.target.value })}
                    />
                  </div>
                  <div className="campo">
                    <label>Artista</label>
                    <input
                      value={b.artista}
                      onChange={(e) => aggiornaBrano(c.id, b.id, { artista: e.target.value })}
                    />
                  </div>
                  <div className="campo">
                    <label>Indizio 1 (primi 5s)</label>
                    <input
                      value={b.indizio1}
                      onChange={(e) => aggiornaBrano(c.id, b.id, { indizio1: e.target.value })}
                    />
                  </div>
                  <div className="campo">
                    <label>Indizio 2 (5s successivi)</label>
                    <input
                      value={b.indizio2}
                      onChange={(e) => aggiornaBrano(c.id, b.id, { indizio2: e.target.value })}
                    />
                  </div>
                  <div className="campo">
                    <label>Brano completo</label>
                    <input
                      value={b.completo ?? ''}
                      onChange={(e) =>
                        aggiornaBrano(c.id, b.id, { completo: e.target.value.trim() || undefined })
                      }
                    />
                  </div>
                  <div className="campo">
                    <label>Ritornello (secondi dall’inizio)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={b.ritornello ?? ''}
                      placeholder="es. 47"
                      onChange={(e) =>
                        aggiornaBrano(c.id, b.id, {
                          ritornello: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn btn--primario"
            style={{ marginTop: 14 }}
            onClick={() =>
              setDati((d) => ({
                ...d,
                musica: d.musica.map((cc) =>
                  cc.id === c.id
                    ? {
                        ...cc,
                        brani: [
                          ...cc.brani,
                          { id: nuovoId('brano'), titolo: 'Nuovo brano', artista: '', indizio1: '', indizio2: '' },
                        ],
                      }
                    : cc,
                ),
              }))
            }
          >
            + Aggiungi brano a «{c.nome}»
          </button>
        </div>
      ))}
    </>
  )
}

// ----------------------------------------------------------- backup / file
function BackupRipristino({
  dati,
  setDati,
  ripristina,
  setAnnullabile,
}: Props & {
  ripristina: () => void
  setAnnullabile: (v: { dati: DatiGiochi; cosa: string } | null) => void
}) {
  const inputFile = useRef<HTMLInputElement>(null)
  const conferma = useConferma()
  const [messaggio, setMessaggio] = useState('')

  const esporta = () => {
    const blob = new Blob([JSON.stringify(dati, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'serata-giochi-contenuti.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importa = async (file: File) => {
    try {
      const nuovi = JSON.parse(await file.text()) as DatiGiochi
      if (!nuovi.notizie || !nuovi.immagini || !nuovi.qdcp || !nuovi.musica) {
        throw new Error('Struttura non riconosciuta')
      }
      const ok = await conferma({
        titolo: 'Sostituire tutti i contenuti?',
        messaggio: `Il file contiene ${nuovi.notizie.length} notizie, ${nuovi.qdcp.length} parole e ${nuovi.musica.reduce((n, c) => n + c.brani.length, 0)} brani. I contenuti attuali verranno sostituiti, ma potrai annullare subito dopo.`,
        conferma: 'Sostituisci',
        pericolo: true,
      })
      if (!ok) return
      setAnnullabile({ dati, cosa: 'i contenuti precedenti (import JSON)' })
      setDati(() => nuovi)
      setMessaggio('Contenuti importati correttamente.')
    } catch (e) {
      setMessaggio(`Import fallito: ${(e as Error).message}`)
    }
  }

  const conteggi = [
    `${dati.notizie.length} notizie`,
    `${dati.immagini.reduce((n, c) => n + c.voci.length, 0)} immagini`,
    `${dati.qdcp.length} parole`,
    `${dati.musica.reduce((n, c) => n + c.brani.length, 0)} brani`,
  ].join(' · ')

  return (
    <div className="card">
      <div className="card-titolo">Backup e ripristino</div>
      <p className="avviso" style={{ marginBottom: 14 }}>
        Contenuti attuali: <b>{conteggi}</b>. Sono salvati nel browser di questo computer: esportali
        se vuoi portarli altrove o tenerne una copia.
      </p>
      <div className="riga-bottoni">
        <button className="btn btn--primario" onClick={esporta}>
          ↓ Esporta JSON
        </button>
        <button className="btn" onClick={() => inputFile.current?.click()}>
          ↑ Importa JSON
        </button>
        <button
          className="btn btn--ko"
          onClick={() =>
            void conferma({
              titolo: 'Ripristinare i contenuti del PDF?',
              messaggio:
                'Tutte le modifiche fatte da Gestione verranno sostituite dalla versione trascritta da lista-giochi.pdf. Potrai annullare subito dopo.',
              conferma: 'Ripristina',
              pericolo: true,
            }).then((ok) => {
              if (!ok) return
              setAnnullabile({ dati, cosa: 'i contenuti precedenti (ripristino PDF)' })
              ripristina()
              setMessaggio('Contenuti riportati alla versione del PDF.')
            })
          }
        >
          Ripristina contenuti del PDF
        </button>
      </div>
      <input
        ref={inputFile}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void importa(f)
          e.target.value = ''
        }}
      />
      {messaggio && (
        <p className="avviso" style={{ marginTop: 14 }}>
          {messaggio}
        </p>
      )}
      <p className="avviso" style={{ marginTop: 14 }}>
        <b>Contenuti di partenza:</b> {DATI_INIZIALI.notizie.length} notizie,{' '}
        {DATI_INIZIALI.qdcp.length} parole QDCP,{' '}
        {DATI_INIZIALI.musica.reduce((n, c) => n + c.brani.length, 0)} brani in{' '}
        {DATI_INIZIALI.musica.length} categorie, trascritti da <code>lista-giochi.pdf</code>.
      </p>
    </div>
  )
}
