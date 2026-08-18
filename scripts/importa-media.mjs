/**
 * Copia i media dalla cartella "Serata giochi" dentro public/media,
 * normalizzando nomi di cartelle e file in slug ASCII.
 *
 *   node scripts/importa-media.mjs [percorso-cartella-Serata-giochi]
 *
 * Default: ../Serata giochi (relativo alla root del progetto).
 * I brani completi (completo.mp3) pesano ~219 MB e sono esclusi da git:
 * restano in locale e l'app li usa se ci sono, altrimenti mostra solo il titolo.
 */
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sorgente = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '..', 'Serata giochi')
const destinazione = join(root, 'public', 'media')

if (!existsSync(sorgente)) {
  console.error(`Cartella sorgente non trovata: ${sorgente}`)
  console.error('Uso: node scripts/importa-media.mjs "percorso/Serata giochi"')
  process.exit(1)
}

/** Mappa cartella-sorgente -> slug usato dall'app. Deve restare allineata a src/dati.ts */
const CARTELLE_IMMAGINI = {
  'Persone famose': {
    slug: 'persone',
    voci: {
      '1. Zendaya': 'zendaya',
      '2. De Niro': 'de-niro',
      '3. Dipiazza': 'dipiazza',
      '4. Madonna': 'madonna',
    },
  },
  Loghi: {
    slug: 'loghi',
    voci: {
      '1. Ford': 'ford',
      '2. Corsair': 'corsair',
      '3. Rummo': 'rummo',
      '4. Google Earth': 'google-earth',
    },
  },
  Film: {
    slug: 'film',
    voci: {
      '1. Tenet': 'tenet',
      '2. Harry Potter e i Doni della Morte - Parte 1': 'harry-potter-7',
      '3. Mamma ho perso l_aereo': 'mamma-ho-perso-laereo',
      '4. Shining': 'shining',
    },
  },
  Oggetti: {
    slug: 'oggetti',
    voci: {
      '1. Semaforo': 'semaforo',
      '2. Aereo': 'aereo',
      '3. Penna': 'penna',
      '4. Cato': 'gatto',
    },
  },
}

const CARTELLE_MUSICA = {
  '80-90': {
    slug: 'anni-80-90',
    voci: {
      'P.Y.T': 'pyt',
      '99 Luftballons': '99-luftballons',
      Funkytown: 'funkytown',
      "We didn_t start the fire": 'we-didnt-start-the-fire',
      Vogue: 'vogue',
      Californication: 'californication',
    },
  },
  EDM: {
    slug: 'edm',
    voci: {
      Stay: 'stay',
      'Sweet Nothing': 'sweet-nothing',
      'Without you': 'without-you',
      '#SELFIE': 'selfie',
      'The Fox': 'the-fox',
      'Lovers on the sun': 'lovers-on-the-sun',
    },
  },
  Italiana: {
    slug: 'italiana',
    voci: {
      'Da zero a cento': 'da-zero-a-cento',
      'Ma quale idea': 'ma-quale-idea',
      'Figli delle stelle': 'figli-delle-stelle',
      'Se bruciasse la città': 'se-bruciasse-la-citta',
      'Che ne sanno i 2000': 'che-ne-sanno-i-2000',
      'Tran Tran': 'tran-tran',
    },
  },
  'Billions Club': {
    slug: 'billions-club',
    voci: {
      'MILLION DOLLAR BABY': 'million-dollar-baby',
      Circles: 'circles',
      Finesse: 'finesse',
      Timeless: 'timeless',
      'you should see me in a crown': 'crown',
      Physical: 'physical',
    },
  },
}

let copiati = 0
let mancanti = []

function copia(da, a) {
  if (!existsSync(da)) {
    mancanti.push(da)
    return false
  }
  mkdirSync(dirname(a), { recursive: true })
  copyFileSync(da, a)
  copiati++
  return true
}

// --- Immagini -------------------------------------------------------------
for (const [cartella, { slug, voci }] of Object.entries(CARTELLE_IMMAGINI)) {
  for (const [sottocartella, voceSlug] of Object.entries(voci)) {
    const daDir = join(sorgente, 'Immagini', cartella, sottocartella)
    if (!existsSync(daDir)) {
      mancanti.push(daDir)
      continue
    }
    const files = readdirSync(daDir).filter((f) => statSync(join(daDir, f)).isFile())
    // I loghi hanno un solo indizio, nominato con l'indice della voce (1.jpg, 2.jpg...).
    // Lo rinominiamo in 1.<ext> per uniformità con le altre categorie.
    const indizi = files.filter((f) => !/^reveal\./i.test(f)).sort()
    indizi.forEach((f, i) => {
      const ext = f.split('.').pop().toLowerCase()
      copia(join(daDir, f), join(destinazione, 'immagini', slug, voceSlug, `${i + 1}.${ext}`))
    })
    const reveal = files.find((f) => /^reveal\./i.test(f))
    if (reveal) {
      const ext = reveal.split('.').pop().toLowerCase()
      copia(join(daDir, reveal), join(destinazione, 'immagini', slug, voceSlug, `reveal.${ext}`))
    }
  }
}

// --- Musica ---------------------------------------------------------------
for (const [cartella, { slug, voci }] of Object.entries(CARTELLE_MUSICA)) {
  for (const [sottocartella, branoSlug] of Object.entries(voci)) {
    const daDir = join(sorgente, 'Musica', cartella, sottocartella)
    if (!existsSync(daDir)) {
      mancanti.push(daDir)
      continue
    }
    const files = readdirSync(daDir).filter((f) => f.toLowerCase().endsWith('.mp3'))
    const uno = files.find((f) => /indizio 1\.mp3$/i.test(f))
    const due = files.find((f) => /indizio 2\.mp3$/i.test(f))
    const completo = files.find((f) => !/indizio \d\.mp3$/i.test(f))
    const base = join(destinazione, 'musica', slug, branoSlug)
    if (uno) copia(join(daDir, uno), join(base, 'indizio-1.mp3'))
    else mancanti.push(`${daDir}\\*indizio 1.mp3`)
    if (due) copia(join(daDir, due), join(base, 'indizio-2.mp3'))
    else mancanti.push(`${daDir}\\*indizio 2.mp3`)
    if (completo) copia(join(daDir, completo), join(base, 'completo.mp3'))
  }
}

console.log(`Copiati ${copiati} file in ${destinazione}`)
if (mancanti.length) {
  console.log(`\nNon trovati (${mancanti.length}):`)
  for (const m of mancanti) console.log(`  - ${m}`)
}
