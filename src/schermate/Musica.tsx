import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { AnnullaUltimo, IntestazioneGioco, Regolamento, ServeSessione } from '../componenti/Comuni'
import { LettoreAudio } from '../componenti/LettoreAudio'
import type { ApiLettore } from '../componenti/LettoreAudio'
import { REGOLE, SECONDI_INDIZIO } from '../dati'
import type { Rotta } from '../rotte'
import { assegnazioneDi, formattaPunti, useStore, vociAssegnate } from '../store'
import type { Brano, Giocatore } from '../tipi'

/** Primo giocatore non eliminato a partire da `da`, girando in tondo. */
function indiceDiTurno(giocatori: Giocatore[], da: number, eliminati: string[]) {
  const n = giocatori.length
  for (let k = 0; k < n; k++) {
    const i = (da + k) % n
    if (!eliminati.includes(giocatori[i].id)) return i
  }
  return -1
}

const MOLTIPLICATORI = [
  { valore: 1, etichetta: 'pieno' },
  { valore: 0.5, etichetta: '½' },
  { valore: 0.25, etichetta: '¼' },
]

export function Musica({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { dati, sessione, aggiornaSessione, assegnaPunti, annullaEvento } = useStore()
  const lettori = useRef(new Map<string, ApiLettore | null>())
  const stato = sessione?.musica

  /**
   * Spazio e R agiscono sul brano evidenziato: durante il gioco si guarda il
   * tavolo, non lo schermo. Disattivate mentre si scrive in un campo.
   */
  const branoAttivo = stato ? `${stato.categoriaIndex}-${stato.branoIndex}` : ''
  useEffect(() => {
    const suTasto = (e: KeyboardEvent) => {
      const bersaglio = e.target as HTMLElement | null
      if (bersaglio?.closest('input, textarea, select, [contenteditable="true"]')) return
      const corrente = lettori.current.get(branoAttivo)
      if (!corrente) return
      if (e.code === 'Space') {
        e.preventDefault()
        // Il bottone appena cliccato trattiene il fuoco e si riattiverebbe
        // con lo spazio: glielo togliamo, cosi' spazio vuol dire solo "play".
        const attivo = document.activeElement
        if (attivo instanceof HTMLButtonElement) attivo.blur()
        corrente.alterna()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        corrente.riavvia()
      }
    }
    window.addEventListener('keydown', suTasto)
    return () => window.removeEventListener('keydown', suTasto)
  }, [branoAttivo])

  if (!sessione || !stato) return <ServeSessione vaiASetup={() => vaiA('setup')} />
  if (dati.musica.length === 0)
    return <div className="vuoto card">Nessuna categoria musicale: aggiungine una da Gestione.</div>

  const categoria = dati.musica[Math.min(stato.categoriaIndex, dati.musica.length - 1)]
  const assegnati = vociAssegnate(sessione, 'musica')

  const idxTurno = indiceDiTurno(sessione.giocatori, stato.turnoIndex, stato.eliminati)
  const giocatore = idxTurno >= 0 ? sessione.giocatori[idxTurno] : null
  const squadra = giocatore
    ? sessione.squadre.find((s) => s.id === giocatore.squadraId)!
    : sessione.squadre[0]

  const patch = (p: Partial<typeof stato>) =>
    aggiornaSessione((s) => ({ ...s, musica: { ...s.musica, ...p } }))

  const moltiplicatoreDi = (branoId: string) => stato.moltiplicatori?.[branoId] ?? 1

  const impostaMoltiplicatore = (branoId: string, valore: number) =>
    patch({ moltiplicatori: { ...(stato.moltiplicatori ?? {}), [branoId]: valore } })

  const avanzaTurno = () =>
    patch({
      turnoIndex: idxTurno < 0 ? 0 : indiceDiTurno(sessione.giocatori, idxTurno + 1, stato.eliminati),
    })

  const indovina = (brano: Brano, conArtista: boolean) => {
    if (!giocatore) return
    const m = moltiplicatoreDi(brano.id)
    assegnaPunti({
      gioco: 'musica',
      voceId: brano.id,
      etichetta: `${categoria.nome} · ${brano.titolo}${conArtista ? ' + artista' : ''} — ${giocatore.nome}`,
      squadraId: giocatore.squadraId,
      giocatoreId: giocatore.id,
      punti: (conArtista ? 2 : 1) * m,
    })
    avanzaTurno()
  }

  const sbaglia = () => {
    if (!giocatore) return
    const eliminati = [...new Set([...stato.eliminati, giocatore.id])]
    patch({
      eliminati,
      turnoIndex: Math.max(0, idxTurno < 0 ? 0 : indiceDiTurno(sessione.giocatori, idxTurno + 1, eliminati)),
    })
  }

  const cambiaCategoria = (i: number) =>
    patch({
      categoriaIndex: i,
      branoIndex: 0,
      moltiplicatori: {},
      eliminati: [], // l'eliminazione vale solo per la categoria in corso
    })

  return (
    <>
      <IntestazioneGioco
        numero={4}
        titolo="Musica"
        sottotitolo={`Giocatore singolo, nell’ordine in cui siete seduti. Ogni indizio dura ${SECONDI_INDIZIO} secondi. Titolo 1 punto, artista 1 punto.`}
        contatore={`${categoria.brani.filter((b) => assegnati.has(b.id)).length} di ${categoria.brani.length} · ${categoria.nome}`}
      />
      <Regolamento voci={REGOLE.musica} />

      <div className="selettore-categorie" style={{ marginTop: 14 }}>
        {dati.musica.map((c, i) => {
          const fatti = c.brani.filter((b) => assegnati.has(b.id)).length
          return (
            <button
              key={c.id}
              className={`chip${fatti === c.brani.length ? ' chip--fatto' : ''}`}
              aria-pressed={i === stato.categoriaIndex}
              onClick={() => cambiaCategoria(i)}
            >
              {c.nome}{' '}
              <span style={{ opacity: 0.6 }}>
                {fatti}/{c.brani.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Barra del turno: resta appiccicata in alto mentre si scorre l'elenco. */}
      <div className="barra-turno" style={{ '--colore': squadra.colore } as CSSProperties}>
        {giocatore ? (
          <>
            <div>
              <div className="etichetta">Tocca a</div>
              <div className="nome">{giocatore.nome}</div>
            </div>
            <span className="squadra-turno">{squadra.nome}</span>
            <div className="riga-bottoni" style={{ marginLeft: 'auto' }}>
              <button className="btn btn--piccolo btn--ko" onClick={sbaglia}>
                Sbaglia → esce dalla categoria
              </button>
              <button className="btn btn--piccolo btn--fantasma" onClick={avanzaTurno}>
                Passa al prossimo →
              </button>
            </div>
          </>
        ) : (
          <>
            <span>Tutti i giocatori sono usciti da questa categoria.</span>
            <button
              className="btn btn--piccolo"
              style={{ marginLeft: 'auto' }}
              onClick={() => patch({ eliminati: [] })}
            >
              Riammetti tutti
            </button>
          </>
        )}
      </div>

      <div className="giro-giocatori">
        {sessione.giocatori.map((g, i) => {
          const sq = sessione.squadre.find((s) => s.id === g.squadraId)!
          const eliminato = stato.eliminati.includes(g.id)
          return (
            <button
              key={g.id}
              className={`gettone-giocatore${i === idxTurno ? ' gettone-giocatore--attivo' : ''}${
                eliminato ? ' gettone-giocatore--eliminato' : ''
              }`}
              title={eliminato ? 'Fuori per questa categoria — clicca per riammettere' : `Passa il turno a ${g.nome}`}
              onClick={() =>
                eliminato
                  ? patch({ eliminati: stato.eliminati.filter((x) => x !== g.id) })
                  : patch({ turnoIndex: i })
              }
            >
              <i style={{ background: sq.colore }} />
              {g.nome}
            </button>
          )
        })}
      </div>

      <div className="elenco-brani">
        {categoria.brani.map((brano, i) => {
          const assegnazione = assegnazioneDi(sessione, 'musica', brano.id)
          const chi = assegnazione
            ? sessione.giocatori.find((g) => g.id === assegnazione.giocatoreId)
            : undefined
          const m = moltiplicatoreDi(brano.id)
          const corrente = i === stato.branoIndex
          const chiave = `${stato.categoriaIndex}-${i}`

          return (
            <div
              key={brano.id}
              className={`brano${corrente ? ' brano--corrente' : ''}${
                assegnazione ? ' brano--assegnato' : ''
              }`}
              onFocus={() => !corrente && patch({ branoIndex: i })}
            >
              <button
                className="brano-testa"
                onClick={() => patch({ branoIndex: i })}
                title="Rendi questo il brano attivo per le scorciatoie"
              >
                <span className="brano-numero">{assegnazione ? '✓' : i + 1}</span>
                <span className="brano-titoli">
                  <span className="brano-titolo">{brano.titolo}</span>
                  <span className="brano-artista">{brano.artista}</span>
                </span>
              </button>

              <div className="brano-lettori">
                <LettoreAudio
                  ref={(api) => {
                    lettori.current.set(chiave, api)
                  }}
                  src={brano.indizio1}
                  etichetta="Indizio 1"
                  compatto
                />
                <LettoreAudio src={brano.indizio2} etichetta="Indizio 2" compatto />
                {brano.completo && (
                  <LettoreAudio src={brano.completo} etichetta="Completo" compatto />
                )}
              </div>

              <div className="brano-punti">
                {assegnazione ? (
                  <div className="brano-esito">
                    <span className="brano-vincitore">{chi?.nome ?? '—'}</span>
                    <span className="brano-valore">+{formattaPunti(assegnazione.punti)}</span>
                    <button
                      className="btn btn--piccolo btn--fantasma"
                      onClick={() => annullaEvento(assegnazione.id)}
                      title="Togli il punto e riassegna"
                    >
                      ↩ Togli
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="brano-moltiplicatore">
                      {MOLTIPLICATORI.map((mm) => (
                        <button
                          key={mm.valore}
                          className={`gradino${m === mm.valore ? ' gradino--scelto' : ''}`}
                          onClick={() => impostaMoltiplicatore(brano.id, mm.valore)}
                          title={`Vale ${formattaPunti(2 * mm.valore)} punti al massimo`}
                        >
                          {mm.etichetta}
                        </button>
                      ))}
                    </div>
                    <div className="riga-bottoni">
                      <button
                        className="btn btn--piccolo btn--ok"
                        disabled={!giocatore}
                        onClick={() => indovina(brano, false)}
                      >
                        Titolo +{formattaPunti(m)}
                      </button>
                      <button
                        className="btn btn--piccolo btn--primario"
                        disabled={!giocatore}
                        onClick={() => indovina(brano, true)}
                      >
                        Titolo + artista +{formattaPunti(2 * m)}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="navigazione-passi">
        <button
          className="btn btn--fantasma"
          onClick={() => cambiaCategoria(Math.max(0, stato.categoriaIndex - 1))}
          disabled={stato.categoriaIndex === 0}
        >
          ← Categoria precedente
        </button>
        <span style={{ color: 'var(--testo-fioco)', fontSize: 12.5 }}>
          {assegnati.size} / {dati.musica.reduce((n, c) => n + c.brani.length, 0)} brani ·{' '}
          <span className="scorciatoie-inline">
            <kbd>Spazio</kbd> play <kbd>R</kbd> da capo
          </span>
        </span>
        <div className="riga-bottoni">
          <AnnullaUltimo />
          <button
            className="btn"
            onClick={() =>
              stato.categoriaIndex === dati.musica.length - 1
                ? vaiA('classifica')
                : cambiaCategoria(stato.categoriaIndex + 1)
            }
          >
            {stato.categoriaIndex === dati.musica.length - 1
              ? 'Classifica finale →'
              : 'Categoria successiva →'}
          </button>
        </div>
      </div>
    </>
  )
}
