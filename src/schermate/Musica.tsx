import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { AnnullaUltimo, IntestazioneGioco, Regolamento, ServeSessione } from '../componenti/Comuni'
import { LettoreAudio } from '../componenti/LettoreAudio'
import type { ApiLettore } from '../componenti/LettoreAudio'
import { ANTICIPO_RITORNELLO, REGOLE, SECONDI_INDIZIO } from '../dati'
import type { Rotta } from '../rotte'
import { assegnazioneDi, formattaPunti, useStore, vociAssegnate } from '../store'
import type { Brano } from '../tipi'

const MOLTIPLICATORI = [
  { valore: 1, etichetta: 'pieno' },
  { valore: 0.5, etichetta: '½' },
  { valore: 0.25, etichetta: '¼' },
]

/** Ogni passaggio agli avversari vale meta', ma non si scende sotto un quarto. */
const MINIMO = 0.25

function mmss(secondi: number) {
  const m = Math.floor(secondi / 60)
  const s = Math.floor(secondi % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Musica({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { dati, sessione, aggiornaSessione, assegnaPunti, annullaEvento, setDati } = useStore()
  const lettori = useRef(new Map<string, ApiLettore | null>())
  const stato = sessione?.musica

  // Il brano in gioco serve anche alle scorciatoie, che vivono in un effetto
  // dichiarato prima delle uscite anticipate: lo calcoliamo qui, in chiaro.
  const categoriaAttiva = stato
    ? dati.musica[Math.min(stato.categoriaIndex, dati.musica.length - 1)]
    : undefined
  const branoInGioco = categoriaAttiva?.brani.length
    ? categoriaAttiva.brani[Math.min(stato!.branoIndex, categoriaAttiva.brani.length - 1)]
    : undefined
  const chiaveAttiva = stato ? `${stato.categoriaIndex}-${stato.branoIndex}` : ''
  const ritornelloAttivo = branoInGioco?.ritornello

  /**
   * Spazio, 2, 3 e R agiscono sul brano in gioco: mentre si conduce si guarda
   * il tavolo, non lo schermo. Disattivate mentre si scrive in un campo.
   */
  useEffect(() => {
    const suTasto = (e: KeyboardEvent) => {
      const bersaglio = e.target as HTMLElement | null
      if (bersaglio?.closest('input, textarea, select, [contenteditable="true"]')) return
      const primo = lettori.current.get(`${chiaveAttiva}-1`)
      const secondo = lettori.current.get(`${chiaveAttiva}-2`)
      const completo = lettori.current.get(`${chiaveAttiva}-c`)
      if (!primo) return
      // Il bottone appena cliccato trattiene il fuoco e si riattiverebbe con lo
      // spazio: glielo togliamo, cosi' spazio vuol dire solo "play".
      const togliFuoco = () => {
        const attivo = document.activeElement
        if (attivo instanceof HTMLButtonElement) attivo.blur()
      }
      if (e.code === 'Space') {
        e.preventDefault()
        togliFuoco()
        primo.alterna()
      } else if (e.key === '2') {
        e.preventDefault()
        togliFuoco()
        secondo?.alterna()
      } else if (e.key === '3') {
        e.preventDefault()
        togliFuoco()
        if (completo && ritornelloAttivo !== undefined) {
          completo.riproduciDa(ritornelloAttivo - ANTICIPO_RITORNELLO)
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        primo.riavvia()
      }
    }
    window.addEventListener('keydown', suTasto)
    return () => window.removeEventListener('keydown', suTasto)
  }, [chiaveAttiva, ritornelloAttivo])

  if (!sessione || !stato) return <ServeSessione vaiASetup={() => vaiA('setup')} />
  if (dati.musica.length === 0)
    return <div className="vuoto card">Nessuna categoria musicale: aggiungine una da Gestione.</div>

  const categoria = dati.musica[Math.min(stato.categoriaIndex, dati.musica.length - 1)]
  const assegnati = vociAssegnate(sessione, 'musica')

  const iSquadra = Math.min(Math.max(stato.squadraIndex, 0), sessione.squadre.length - 1)
  const squadra = sessione.squadre[iSquadra]
  const iAltra = (iSquadra + 1) % sessione.squadre.length
  const altra = sessione.squadre[iAltra]

  const iBrano = Math.min(stato.branoIndex, categoria.brani.length - 1)
  const branoCorrente = categoria.brani[iBrano]

  const patch = (p: Partial<typeof stato>) =>
    aggiornaSessione((s) => ({ ...s, musica: { ...s.musica, ...p } }))

  const moltiplicatoreDi = (branoId: string) => stato.moltiplicatori?.[branoId] ?? 1

  const impostaMoltiplicatore = (branoId: string, valore: number) =>
    patch({ moltiplicatori: { ...(stato.moltiplicatori ?? {}), [branoId]: valore } })

  /** Il punto del ritornello sta nei contenuti, non nella sessione: si segna
   *  una volta e resta anche per le serate successive. */
  const impostaRitornello = (branoId: string, secondi: number) =>
    setDati((d) => ({
      ...d,
      musica: d.musica.map((c) =>
        c.id === categoria.id
          ? {
              ...c,
              brani: c.brani.map((b) =>
                b.id === branoId ? { ...b, ritornello: Math.round(secondi * 10) / 10 } : b,
              ),
            }
          : c,
      ),
    }))

  /** Primo brano non ancora assegnato dopo `da`, girando in tondo. */
  const prossimoBrano = (da: number) => {
    const n = categoria.brani.length
    for (let k = 1; k <= n; k++) {
      const i = (da + k) % n
      if (!assegnati.has(categoria.brani[i].id)) return i
    }
    return da
  }

  const indovina = (brano: Brano, indice: number, conArtista: boolean) => {
    assegnaPunti({
      gioco: 'musica',
      voceId: brano.id,
      etichetta: `${categoria.nome} · ${brano.titolo}${conArtista ? ' + artista' : ''} — ${squadra.nome}`,
      squadraId: squadra.id,
      punti: (conArtista ? 2 : 1) * moltiplicatoreDi(brano.id),
    })
    // Brano chiuso: tocca agli avversari, e si passa a un brano nuovo.
    patch({ squadraIndex: iAltra, branoIndex: prossimoBrano(indice) })
  }

  /** La squadra di turno sbaglia: il brano passa agli avversari a meta' valore. */
  const sbaglia = () =>
    patch({
      squadraIndex: iAltra,
      moltiplicatori: {
        ...(stato.moltiplicatori ?? {}),
        [branoCorrente.id]: Math.max(MINIMO, moltiplicatoreDi(branoCorrente.id) / 2),
      },
    })

  const chiudiSenzaPunti = () =>
    patch({ squadraIndex: iAltra, branoIndex: prossimoBrano(iBrano) })

  const cambiaCategoria = (i: number) =>
    patch({ categoriaIndex: i, branoIndex: 0, moltiplicatori: {} })

  return (
    <>
      <IntestazioneGioco
        numero={4}
        titolo="Musica"
        sottotitolo={`Si sfidano le squadre, a turno. Ogni indizio dura ${SECONDI_INDIZIO} secondi. Titolo 1 punto, artista 1 punto.`}
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
        <div>
          <div className="etichetta">Tocca a</div>
          <div className="nome">{squadra.nome}</div>
        </div>
        <span className="squadra-turno">
          brano {iBrano + 1} · {branoCorrente.titolo}
        </span>
        <div className="riga-bottoni" style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn--piccolo btn--ko"
            onClick={sbaglia}
            title="Dimezza il valore del brano e passa la mano agli avversari"
          >
            Sbaglia → {altra.nome} a metà
          </button>
          <button className="btn btn--piccolo btn--fantasma" onClick={chiudiSenzaPunti}>
            Nessuno · brano successivo →
          </button>
          <button
            className="btn btn--piccolo btn--fantasma"
            onClick={() => patch({ squadraIndex: iAltra })}
            title="Scambia il turno senza toccare il valore"
          >
            ⇄ Passa a {altra.nome}
          </button>
        </div>
      </div>

      <div className="elenco-brani">
        {categoria.brani.map((brano, i) => {
          const assegnazione = assegnazioneDi(sessione, 'musica', brano.id)
          const chi = assegnazione
            ? sessione.squadre.find((s) => s.id === assegnazione.squadraId)
            : undefined
          const m = moltiplicatoreDi(brano.id)
          const corrente = i === iBrano
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
                title="Rendi questo il brano in gioco"
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
                    lettori.current.set(`${chiave}-1`, api)
                  }}
                  src={brano.indizio1}
                  etichetta="Indizio 1"
                  compatto
                />
                <LettoreAudio
                  ref={(api) => {
                    lettori.current.set(`${chiave}-2`, api)
                  }}
                  src={brano.indizio2}
                  etichetta="Indizio 2"
                  compatto
                />
                {brano.completo && (
                  <>
                    <LettoreAudio
                      ref={(api) => {
                        lettori.current.set(`${chiave}-c`, api)
                      }}
                      src={brano.completo}
                      etichetta="Completo"
                      compatto
                      // Sei brani interi per categoria sono decine di MB: si
                      // scaricano solo quando qualcuno preme davvero play.
                      precarica="none"
                    />
                    <div className="riga-ritornello">
                      <button
                        className="btn btn--piccolo btn--fantasma"
                        disabled={brano.ritornello === undefined}
                        onClick={() =>
                          lettori.current
                            .get(`${chiave}-c`)
                            ?.riproduciDa((brano.ritornello ?? 0) - ANTICIPO_RITORNELLO)
                        }
                        title={
                          brano.ritornello === undefined
                            ? 'Ritornello non ancora segnato'
                            : `Parte da ${mmss(Math.max(0, brano.ritornello - ANTICIPO_RITORNELLO))}, poco prima del ritornello`
                        }
                      >
                        ▶ Ritornello
                        {brano.ritornello !== undefined && (
                          <span className="ritornello-tempo"> {mmss(brano.ritornello)}</span>
                        )}
                      </button>
                      <button
                        className="btn btn--piccolo btn--fantasma"
                        onClick={() => {
                          const p = lettori.current.get(`${chiave}-c`)?.posizione() ?? 0
                          if (p > 0) impostaRitornello(brano.id, p)
                        }}
                        title="Mentre il brano suona, premi quando attacca il ritornello: il punto resta salvato"
                      >
                        ⌖ Segna qui
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="brano-punti">
                {assegnazione ? (
                  <div className="brano-esito">
                    <span className="brano-vincitore" style={{ color: chi?.colore }}>
                      {chi?.nome ?? '—'}
                    </span>
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
                        onClick={() => indovina(brano, i, false)}
                        title={`Titolo indovinato da ${squadra.nome}`}
                      >
                        Titolo +{formattaPunti(m)}
                      </button>
                      <button
                        className="btn btn--piccolo btn--primario"
                        onClick={() => indovina(brano, i, true)}
                        title={`Titolo e artista indovinati da ${squadra.nome}`}
                      >
                        + artista +{formattaPunti(2 * m)}
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
            <kbd>Spazio</kbd> indizio 1 <kbd>2</kbd> indizio 2 <kbd>3</kbd> ritornello{' '}
            <kbd>R</kbd> da capo
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
