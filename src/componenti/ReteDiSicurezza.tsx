import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Stato {
  errore: Error | null
}

/**
 * Ultima difesa: se qualcosa esplode durante il rendering, meglio una schermata
 * che spiega cosa fare che una pagina bianca a meta' serata. I punti stanno in
 * localStorage, quindi quasi sempre basta ricaricare senza perdere niente.
 */
export class ReteDiSicurezza extends Component<{ children: ReactNode }, Stato> {
  state: Stato = { errore: null }

  static getDerivedStateFromError(errore: Error): Stato {
    return { errore }
  }

  componentDidCatch(errore: Error, info: ErrorInfo) {
    console.error('Errore di rendering:', errore, info.componentStack)
  }

  private scaricaBackup = () => {
    const contenuto = {
      dati: localStorage.getItem('serata-giochi:dati:v1'),
      sessione: localStorage.getItem('serata-giochi:sessione:v1'),
    }
    const blob = new Blob([JSON.stringify(contenuto, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'serata-giochi-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  render() {
    if (!this.state.errore) return this.props.children

    return (
      <div className="contenuto" style={{ maxWidth: 620, paddingTop: 60 }}>
        <div className="card">
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Qualcosa si è inceppato</h2>
          <p style={{ color: 'var(--testo-tenue)', lineHeight: 1.6, fontSize: 14 }}>
            Punteggi e contenuti sono salvati nel browser, quindi ricaricare la pagina di solito
            basta e non perdi niente. Prima di azzerare, conviene scaricare una copia.
          </p>
          <pre
            style={{
              marginTop: 14,
              padding: 12,
              background: 'var(--sfondo)',
              border: '1px solid var(--bordo)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--ko)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {this.state.errore.message}
          </pre>
          <div className="riga-bottoni" style={{ marginTop: 18 }}>
            <button className="btn btn--primario" onClick={() => window.location.reload()}>
              Ricarica la pagina
            </button>
            <button className="btn" onClick={this.scaricaBackup}>
              ↓ Scarica copia di sicurezza
            </button>
            <button
              className="btn btn--ko"
              onClick={() => {
                localStorage.removeItem('serata-giochi:sessione:v1')
                window.location.reload()
              }}
            >
              Azzera solo la sessione
            </button>
          </div>
        </div>
      </div>
    )
  }
}
