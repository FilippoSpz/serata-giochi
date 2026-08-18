import { useEffect, useState } from 'react'
import { useStore } from '../store'

/**
 * Schermo dei giocatori: solo l'immagine in corso, niente comandi.
 * Si allinea da sola alla dashboard perche' lo store ascolta gli eventi
 * `storage`, che scattano quando l'altra finestra salva la sessione.
 */
export function Proiezione() {
  const { dati, sessione } = useStore()
  const [aSchermoIntero, setASchermoIntero] = useState(false)

  useEffect(() => {
    document.body.classList.add('corpo-proiezione')
    return () => document.body.classList.remove('corpo-proiezione')
  }, [])

  useEffect(() => {
    const suCambio = () => setASchermoIntero(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', suCambio)
    return () => document.removeEventListener('fullscreenchange', suCambio)
  }, [])

  const schermoIntero = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => {})
  }

  if (!sessione) {
    return (
      <div className="proiezione proiezione--attesa">
        <p>In attesa che la dashboard apra una sessione…</p>
      </div>
    )
  }

  const stato = sessione.immagini
  const categoria = dati.immagini[Math.min(stato.categoriaIndex, dati.immagini.length - 1)]
  const voce = categoria?.voci[Math.min(stato.voceIndex, categoria.voci.length - 1)]

  if (!categoria || !voce) {
    return (
      <div className="proiezione proiezione--attesa">
        <p>Nessuna immagine da mostrare.</p>
      </div>
    )
  }

  const totale = voce.immagini.length
  const mostrate = Math.min(stato.immagineIndex, totale)
  const punti = Math.max(1, categoria.puntiIniziali - (mostrate - 1))
  const sorgente = stato.rivelata && voce.reveal ? voce.reveal : voce.immagini[mostrate - 1]

  return (
    <div className="proiezione" data-gioco="immagini">
      <header className="proiezione-testa">
        <span className="proiezione-categoria">{categoria.nome}</span>
        <span className="proiezione-valore">
          {punti} {punti === 1 ? 'punto' : 'punti'}
          {totale > 1 && (
            <span className="proiezione-conteggio">
              {' '}
              · immagine {mostrate} di {totale}
            </span>
          )}
        </span>
      </header>

      <div className="proiezione-palco">
        {sorgente ? (
          <img src={sorgente} alt={stato.rivelata ? voce.nome : `Indizio ${mostrate}`} />
        ) : (
          <p className="proiezione-attesa-testo">Immagine non disponibile</p>
        )}
      </div>

      {stato.rivelata && <div className="proiezione-soluzione">{voce.nome}</div>}

      <button
        className="proiezione-schermo-intero"
        onClick={schermoIntero}
        title={aSchermoIntero ? 'Esci da schermo intero' : 'Schermo intero'}
      >
        {aSchermoIntero ? '⤡' : '⤢'}
      </button>
    </div>
  )
}
