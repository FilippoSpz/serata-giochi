import { useRef, useState } from 'react'
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
  { id: 'notizie', nome: '1 · Notizie false' },
  { id: 'immagini', nome: '2 · Immagini' },
  { id: 'qdcp', nome: '3 · QDCP' },
  { id: 'musica', nome: '4 · Musica' },
  { id: 'file', nome: 'Backup e ripristino' },
]

export function Gestione() {
  const { dati, setDati, ripristinaDati } = useStore()
  const [scheda, setScheda] = useState<Scheda>('notizie')

  return (
    <>
      <div className="intestazione-gioco">
        <div>
          <h2>Gestione contenuti</h2>
          <div className="sottotitolo">
            Ogni modifica è salvata subito nel browser e vale per le prossime sessioni.
          </div>
        </div>
      </div>

      <div className="selettore-categorie">
        {SCHEDE.map((s) => (
          <button
            key={s.id}
            className="chip"
            aria-pressed={scheda === s.id}
            onClick={() => setScheda(s.id)}
          >
            {s.nome}
          </button>
        ))}
      </div>

      {scheda === 'notizie' && <ModificaNotizie dati={dati} setDati={setDati} />}
      {scheda === 'immagini' && <ModificaImmagini dati={dati} setDati={setDati} />}
      {scheda === 'qdcp' && <ModificaQdcp dati={dati} setDati={setDati} />}
      {scheda === 'musica' && <ModificaMusica dati={dati} setDati={setDati} />}
      {scheda === 'file' && <BackupRipristino dati={dati} setDati={setDati} ripristina={ripristinaDati} />}
    </>
  )
}

type Props = { dati: DatiGiochi; setDati: (f: (d: DatiGiochi) => DatiGiochi) => void }

// ---------------------------------------------------------------- notizie
function ModificaNotizie({ dati, setDati }: Props) {
  const aggiorna = (id: string, campo: Partial<Notizia>) =>
    setDati((d) => ({
      ...d,
      notizie: d.notizie.map((n) => (n.id === id ? { ...n, ...campo } : n)),
    }))

  const aggiungi = () =>
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

  const elimina = (id: string) =>
    setDati((d) => ({ ...d, notizie: d.notizie.filter((n) => n.id !== id) }))

  return (
    <div className="card">
      <div className="card-titolo">Notizie ({dati.notizie.length})</div>
      <div className="elenco-modifica">
        {dati.notizie.map((n, i) => (
          <div key={n.id} className="blocco-modifica">
            <div className="testa">
              <strong>Notizia {i + 1}</strong>
              <button className="btn btn--piccolo btn--ko" onClick={() => elimina(n.id)}>
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
                      onClick={() =>
                        aggiorna(n.id, {
                          opzioni: n.opzioni.filter((_, k) => k !== j),
                          correttaIndex: Math.min(n.correttaIndex, n.opzioni.length - 2),
                        })
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
      <button className="btn btn--primario" style={{ marginTop: 16 }} onClick={aggiungi}>
        + Aggiungi notizia
      </button>
    </div>
  )
}

// --------------------------------------------------------------- immagini
function ModificaImmagini({ dati, setDati }: Props) {
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
          <div className="griglia-campi griglia-campi--2" style={{ marginBottom: 16 }}>
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
          <div className="campo" style={{ marginBottom: 16 }}>
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
                      setDati((d) => ({
                        ...d,
                        immagini: d.immagini.map((cc) =>
                          cc.id === c.id
                            ? { ...cc, voci: cc.voci.filter((vv) => vv.id !== v.id) }
                            : cc,
                        ),
                      }))
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
                          immagini: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
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
            style={{ marginTop: 16 }}
            onClick={() =>
              setDati((d) => ({
                ...d,
                immagini: d.immagini.map((cc) =>
                  cc.id === c.id
                    ? {
                        ...cc,
                        voci: [
                          ...cc.voci,
                          { id: nuovoId('voce'), nome: 'Nuova voce', immagini: [] },
                        ],
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
function ModificaQdcp({ dati, setDati }: Props) {
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
                onClick={() => setDati((d) => ({ ...d, qdcp: d.qdcp.filter((x) => x.id !== p.id) }))}
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
        style={{ marginTop: 16 }}
        onClick={() =>
          setDati((d) => ({
            ...d,
            qdcp: [
              ...d.qdcp,
              {
                id: nuovoId('qdcp'),
                parola: 'Nuova parola',
                quando: '',
                dove: '',
                come: '',
                perche: '',
              },
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
function ModificaMusica({ dati, setDati }: Props) {
  const aggiornaCategoria = (id: string, campo: Partial<CategoriaMusica>) =>
    setDati((d) => ({
      ...d,
      musica: d.musica.map((c) => (c.id === id ? { ...c, ...campo } : c)),
    }))

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
          <div className="campo" style={{ marginBottom: 16 }}>
            <label>Nome categoria</label>
            <input
              value={c.nome}
              onChange={(e) => aggiornaCategoria(c.id, { nome: e.target.value })}
            />
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
                      setDati((d) => ({
                        ...d,
                        musica: d.musica.map((cc) =>
                          cc.id === c.id
                            ? { ...cc, brani: cc.brani.filter((bb) => bb.id !== b.id) }
                            : cc,
                        ),
                      }))
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
                    <label>Indizio 1 (primi 10s)</label>
                    <input
                      value={b.indizio1}
                      onChange={(e) => aggiornaBrano(c.id, b.id, { indizio1: e.target.value })}
                    />
                  </div>
                  <div className="campo">
                    <label>Indizio 2 (10s successivi)</label>
                    <input
                      value={b.indizio2}
                      onChange={(e) => aggiornaBrano(c.id, b.id, { indizio2: e.target.value })}
                    />
                  </div>
                  <div className="campo">
                    <label>Brano completo (facoltativo)</label>
                    <input
                      value={b.completo ?? ''}
                      onChange={(e) =>
                        aggiornaBrano(c.id, b.id, { completo: e.target.value.trim() || undefined })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn btn--primario"
            style={{ marginTop: 16 }}
            onClick={() =>
              setDati((d) => ({
                ...d,
                musica: d.musica.map((cc) =>
                  cc.id === c.id
                    ? {
                        ...cc,
                        brani: [
                          ...cc.brani,
                          {
                            id: nuovoId('brano'),
                            titolo: 'Nuovo brano',
                            artista: '',
                            indizio1: '',
                            indizio2: '',
                          },
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
}: Props & { ripristina: () => void }) {
  const inputFile = useRef<HTMLInputElement>(null)
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
      const testo = await file.text()
      const nuovi = JSON.parse(testo) as DatiGiochi
      if (!nuovi.notizie || !nuovi.immagini || !nuovi.qdcp || !nuovi.musica) {
        throw new Error('Struttura non riconosciuta')
      }
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
      <p className="avviso" style={{ marginBottom: 16 }}>
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
          onClick={() => {
            if (confirm('Ripristinare i contenuti originali del PDF? Le modifiche andranno perse.')) {
              ripristina()
              setMessaggio('Contenuti riportati alla versione del PDF.')
            }
          }}
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
          if (f) importa(f)
          e.target.value = ''
        }}
      />
      {messaggio && (
        <p className="avviso" style={{ marginTop: 16 }}>
          {messaggio}
        </p>
      )}
      <p className="avviso" style={{ marginTop: 16 }}>
        <b>Contenuti di partenza:</b> {DATI_INIZIALI.notizie.length} notizie,{' '}
        {DATI_INIZIALI.qdcp.length} parole QDCP,{' '}
        {DATI_INIZIALI.musica.reduce((n, c) => n + c.brani.length, 0)} brani in{' '}
        {DATI_INIZIALI.musica.length} categorie, trascritti da <code>lista-giochi.pdf</code>.
      </p>
    </div>
  )
}
