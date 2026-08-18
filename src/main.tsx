import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ProviderConferma } from './componenti/Conferma'
import { ProviderStore } from './store'
import './stili.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProviderStore>
      <ProviderConferma>
        <App />
      </ProviderConferma>
    </ProviderStore>
  </StrictMode>,
)
