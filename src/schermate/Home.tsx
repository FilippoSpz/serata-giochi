import type { Rotta } from '../rotte'
import { formattaPunti, punteggioSquadra, useStore, vociAssegnate } from '../store'

const GIOCHI: { rotta: Rotta; numero: number; titolo: string; descrizione: string }[] = [
  {
    rotta: 'notizie',
    numero: 1,
    titolo: 'Notizie false',
    descrizione:
      'Quattro possibilità, una sola vera. Si risponde a turno, 1 punto a chi trova quella giusta.',
  },
  {
    rotta: 'immagini',
    numero: 2,
    titolo: 'Immagini',
    descrizione:
      'Persone, loghi, fotogrammi e oggetti. Più immagini servono, meno vale la risposta.',
  },
  {
    rotta: 'qdcp',
    numero: 3,
    titolo: 'QDCP',
    descrizione:
      'Quando, dove, come, perché: quattro indizi per parola, da 4 punti a scendere.',
  },
  {
    rotta: 'musica',
    numero: 4,
    titolo: 'Musica',
    descrizione:
      'Ventiquattro brani in quattro categorie. Si gioca a giocatore singolo, titolo e artista.',
  },
]

export function Home({ vaiA }: { vaiA: (r: Rotta) => void }) {
  const { dati, sessione } = useStore()

  const fatti = (gioco: 'notizie' | 'immagini' | 'qdcp' | 'musica') =>
    sessione ? vociAssegnate(sessione, gioco).size : 0

  const avanzamento: Record<string, string> = {
    notizie: `${fatti('notizie')} / ${dati.notizie.length} notizie`,
    immagini: `${fatti('immagini')} / ${dati.immagini.reduce((n, c) => n + c.voci.length, 0)} immagini`,
    qdcp: `${fatti('qdcp')} / ${dati.qdcp.length} parole`,
    musica: `${fatti('musica')} / ${dati.musica.reduce((n, c) => n + c.brani.length, 0)} brani`,
  }

  return (
    <>
      <section className="eroe">
        <h1>Serata Giochi</h1>
        <p>Quattro giochi, due squadre, un solo tabellone.</p>
      </section>

      {sessione ? (
        <div className="card">
          <div className="card-titolo">Sessione in corso</div>
          <div className="griglia-classifica">
            {sessione.squadre.map((s) => (
              <div
                key={s.id}
                className="pannello-squadra"
                style={{ ['--colore' as string]: s.colore }}
              >
                <div className="nome">{s.nome}</div>
                <div className="totale">{formattaPunti(punteggioSquadra(sessione, s.id))}</div>
                <div className="dettaglio">
                  {sessione.giocatori
                    .filter((g) => g.squadraId === s.id)
                    .map((g) => (
                      <div key={g.id}>
                        <span>{g.nome}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <div className="riga-bottoni" style={{ marginTop: 16 }}>
            <button className="btn" onClick={() => vaiA('classifica')}>
              Vedi classifica
            </button>
            <button className="btn btn--fantasma" onClick={() => vaiA('setup')}>
              Modifica squadre
            </button>
          </div>
        </div>
      ) : (
        <div className="vuoto card">
          <h3>Benvenuto</h3>
          <p>
            Crea la sessione per iniziare: due squadre, fino a 16 giocatori.
            <br />
            Tutti i contenuti sono già caricati dal PDF e modificabili da <b>Gestione</b>.
          </p>
          <button className="btn btn--primario btn--grande" onClick={() => vaiA('setup')}>
            Prepara la serata
          </button>
        </div>
      )}

      <div className="griglia-giochi">
        {GIOCHI.map((g) => (
          <button key={g.rotta} className="tessera-gioco" onClick={() => vaiA(g.rotta)}>
            <span className="numero">{g.numero}</span>
            <h3>{g.titolo}</h3>
            <p>{g.descrizione}</p>
            <div className="avanzamento">{avanzamento[g.rotta]}</div>
          </button>
        ))}
      </div>
    </>
  )
}
