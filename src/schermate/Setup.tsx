import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useConferma } from '../componenti/Conferma'
import type { Rotta } from '../rotte'
import { COLORI_SQUADRE, useStore } from '../store'
import type { Formazioni } from '../store'
import type { Giocatore } from '../tipi'

const MIN_PER_SQUADRA = 1
const MAX_PER_SQUADRA = 8
const PREDEFINITI = 4

const LETTERE = ['A', 'B'] as const

/** Divide i giocatori di una sessione gia' aperta nelle due formazioni. */
function formazioniDa(giocatori: Giocatore[], idSquadre: string[]): Formazioni {
  const per = (id: string) => giocatori.filter((g) => g.squadraId === id).map((g) => g.nome)
  return [per(idSquadre[0]), per(idSquadre[1])]
}

export function Setup({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { sessione, avviaSessione, aggiornaSessione, chiudiSessione } = useStore()
  const conferma = useConferma()

  const [nomiSquadre, setNomiSquadre] = useState<[string, string]>(() =>
    sessione ? [sessione.squadre[0].nome, sessione.squadre[1].nome] : ['Squadra A', 'Squadra B'],
  )
  const [formazioni, setFormazioni] = useState<Formazioni>(() => {
    if (sessione) {
      const divise = formazioniDa(
        sessione.giocatori,
        sessione.squadre.map((s) => s.id),
      )
      // Una squadra senza nessuno bloccherebbe la schermata su una colonna vuota.
      return [
        divise[0].length ? divise[0] : ['Giocatore 1'],
        divise[1].length ? divise[1] : ['Giocatore 1'],
      ]
    }
    const base = (offset: number) =>
      Array.from({ length: PREDEFINITI }, (_, i) => `Giocatore ${offset + i + 1}`)
    return [base(0), base(PREDEFINITI)]
  })

  const totale = formazioni[0].length + formazioni[1].length

  const cambiaNome = (squadra: number, i: number, nome: string) =>
    setFormazioni(
      (p) =>
        p.map((nomi, s) => (s === squadra ? nomi.map((v, j) => (j === i ? nome : v)) : nomi)) as Formazioni,
    )

  const aggiungi = (squadra: number) =>
    setFormazioni(
      (p) =>
        p.map((nomi, s) =>
          s === squadra && nomi.length < MAX_PER_SQUADRA
            ? [...nomi, `Giocatore ${nomi.length + 1}`]
            : nomi,
        ) as Formazioni,
    )

  const togli = (squadra: number, i: number) =>
    setFormazioni(
      (p) =>
        p.map((nomi, s) =>
          s === squadra && nomi.length > MIN_PER_SQUADRA ? nomi.filter((_, j) => j !== i) : nomi,
        ) as Formazioni,
    )

  const salva = () => {
    if (!sessione) {
      avviaSessione(formazioni, nomiSquadre)
      vaiA('notizie')
      return
    }
    // Sessione gia' aperta: rinomina senza perdere i punti gia' assegnati.
    // I punti sono della squadra, quindi cambiare la formazione non ne sposta
    // nessuno: l'elenco dei giocatori dice solo chi c'e' al tavolo.
    aggiornaSessione((s) => {
      const squadre = s.squadre.map((sq, i) => ({ ...sq, nome: nomiSquadre[i] }))
      const giocatori: Giocatore[] = formazioni.flatMap((nomi, iSquadra) =>
        nomi.map((nome, i) => ({
          id: `g${iSquadra + 1}-${i + 1}`,
          nome: nome.trim() || `Giocatore ${i + 1}`,
          squadraId: squadre[iSquadra].id,
        })),
      )
      return { ...s, squadre, giocatori }
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
      avviaSessione(formazioni, nomiSquadre)
      vaiA('home')
    })

  return (
    <>
      <div className="intestazione-gioco">
        <div>
          <h2>Prepara la serata</h2>
          <div className="sottotitolo">
            Due squadre che si sfidano a turno: prima una, poi l’altra. I punti sono sempre della
            squadra, l’elenco dei giocatori serve solo a sapere chi c’è al tavolo.
          </div>
        </div>
      </div>

      <div className="griglia-squadre">
        {formazioni.map((nomi, iSquadra) => (
          <div
            key={iSquadra}
            className="pannello-formazione"
            style={{ '--colore': COLORI_SQUADRE[iSquadra] } as CSSProperties}
          >
            <div className="testa-formazione">
              <span className="sigla-squadra">{LETTERE[iSquadra]}</span>
              <input
                className="nome-squadra"
                value={nomiSquadre[iSquadra]}
                aria-label={`Nome della squadra ${LETTERE[iSquadra]}`}
                onChange={(e) =>
                  setNomiSquadre((p) =>
                    iSquadra === 0 ? [e.target.value, p[1]] : [p[0], e.target.value],
                  )
                }
              />
              <span className="conta-formazione">
                {nomi.length} {nomi.length === 1 ? 'giocatore' : 'giocatori'}
              </span>
            </div>

            <div className="elenco-formazione">
              {nomi.map((nome, i) => (
                <div key={i} className="riga-giocatore">
                  <span className="indice">{i + 1}</span>
                  <input
                    value={nome}
                    placeholder={`Giocatore ${i + 1}`}
                    onChange={(e) => cambiaNome(iSquadra, i, e.target.value)}
                  />
                  <button
                    className="togli-giocatore"
                    onClick={() => togli(iSquadra, i)}
                    disabled={nomi.length <= MIN_PER_SQUADRA}
                    title="Togli dalla formazione"
                    aria-label={`Togli ${nome || `Giocatore ${i + 1}`}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              className="btn btn--piccolo"
              onClick={() => aggiungi(iSquadra)}
              disabled={nomi.length >= MAX_PER_SQUADRA}
            >
              + Aggiungi giocatore
            </button>
          </div>
        ))}
      </div>

      <p className="avviso" style={{ marginTop: 16 }}>
        <b>{totale} giocatori</b> in tutto: {formazioni[0].length} in {nomiSquadre[0]} e{' '}
        {formazioni[1].length} in {nomiSquadre[1]}. Le formazioni possono anche essere di numero
        diverso: si gioca squadra contro squadra, non uno contro uno.
      </p>

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
