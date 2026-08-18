import { useEffect, useState } from 'react'

export const ROTTE = [
  'home',
  'setup',
  'notizie',
  'immagini',
  'qdcp',
  'musica',
  'classifica',
  'gestione',
] as const

export type Rotta = (typeof ROTTE)[number]

function daHash(): Rotta {
  const grezzo = window.location.hash.replace(/^#\/?/, '')
  return (ROTTE as readonly string[]).includes(grezzo) ? (grezzo as Rotta) : 'home'
}

/** Router minimale basato su hash: niente dipendenze, e il tasto indietro funziona. */
export function useRotta(): [Rotta, (r: Rotta) => void] {
  const [rotta, setRotta] = useState<Rotta>(daHash)

  useEffect(() => {
    const suCambio = () => setRotta(daHash())
    window.addEventListener('hashchange', suCambio)
    return () => window.removeEventListener('hashchange', suCambio)
  }, [])

  const vaiA = (r: Rotta) => {
    window.location.hash = `/${r}`
    window.scrollTo({ top: 0 })
  }

  return [rotta, vaiA]
}
