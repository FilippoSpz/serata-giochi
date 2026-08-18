import { PunteggiRapidi } from './componenti/Comuni'
import { useRotta } from './rotte'
import type { Rotta } from './rotte'
import { useStore } from './store'
import { Classifica } from './schermate/Classifica'
import { Gestione } from './schermate/Gestione'
import { Home } from './schermate/Home'
import { Immagini } from './schermate/Immagini'
import { Musica } from './schermate/Musica'
import { Notizie } from './schermate/Notizie'
import { Qdcp } from './schermate/Qdcp'
import { Setup } from './schermate/Setup'

const VOCI_NAV: { rotta: Rotta; etichetta: string }[] = [
  { rotta: 'home', etichetta: 'Home' },
  { rotta: 'notizie', etichetta: '1 · Notizie' },
  { rotta: 'immagini', etichetta: '2 · Immagini' },
  { rotta: 'qdcp', etichetta: '3 · QDCP' },
  { rotta: 'musica', etichetta: '4 · Musica' },
  { rotta: 'classifica', etichetta: 'Classifica' },
  { rotta: 'gestione', etichetta: 'Gestione' },
]

export function App() {
  const [rotta, vaiA] = useRotta()
  const { sessione } = useStore()

  return (
    <div className="app">
      <header className="topbar">
        <div className="marchio">
          <span>🎲</span>
          <span>Serata Giochi</span>
        </div>
        <nav className="nav">
          {VOCI_NAV.map((v) => (
            <button
              key={v.rotta}
              aria-current={rotta === v.rotta}
              onClick={() => vaiA(v.rotta)}
            >
              {v.etichetta}
            </button>
          ))}
        </nav>
        {sessione && <PunteggiRapidi sessione={sessione} />}
      </header>

      <main className={`contenuto${rotta === 'immagini' ? ' contenuto--largo' : ''}`}>
        {rotta === 'home' && <Home vaiA={vaiA} />}
        {rotta === 'setup' && <Setup vaiA={vaiA} />}
        {rotta === 'notizie' && <Notizie vaiA={vaiA} />}
        {rotta === 'immagini' && <Immagini vaiA={vaiA} />}
        {rotta === 'qdcp' && <Qdcp vaiA={vaiA} />}
        {rotta === 'musica' && <Musica vaiA={vaiA} />}
        {rotta === 'classifica' && <Classifica vaiA={vaiA} />}
        {rotta === 'gestione' && <Gestione />}
      </main>
    </div>
  )
}
