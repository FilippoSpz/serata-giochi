/**
 * Crea il repository su GitHub e fa il push, leggendo le credenziali da `.env`.
 *
 *   npm run pubblica -- --verifica    controlla token e stato senza modificare nulla
 *   npm run pubblica                  crea il repo (se manca) e pusha il branch corrente
 *
 * Il token non viene mai scritto su disco ne' passato sulla riga di comando:
 * arriva a git tramite un credential helper temporaneo che lo legge dall'ambiente.
 */
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const soloVerifica = process.argv.includes('--verifica')

// ---------------------------------------------------------------- utilita'
const c = {
  ok: (t) => `\x1b[32m${t}\x1b[0m`,
  ko: (t) => `\x1b[31m${t}\x1b[0m`,
  info: (t) => `\x1b[36m${t}\x1b[0m`,
  tenue: (t) => `\x1b[90m${t}\x1b[0m`,
}

function esci(messaggio, suggerimento) {
  console.error(`\n${c.ko('✗')} ${messaggio}`)
  if (suggerimento) console.error(`  ${c.tenue(suggerimento)}`)
  process.exit(1)
}

/** Legge un .env minimale: KEY=VALUE, commenti con #, virgolette opzionali. */
function leggiEnv(percorso) {
  const valori = {}
  for (const riga of readFileSync(percorso, 'utf8').split(/\r?\n/)) {
    const pulita = riga.trim()
    if (!pulita || pulita.startsWith('#')) continue
    const uguale = pulita.indexOf('=')
    if (uguale === -1) continue
    const chiave = pulita.slice(0, uguale).trim()
    let valore = pulita.slice(uguale + 1).trim()
    if (valore.startsWith('"') && valore.endsWith('"')) valore = valore.slice(1, -1)
    if (valore.startsWith("'") && valore.endsWith("'")) valore = valore.slice(1, -1)
    valori[chiave] = valore
  }
  return valori
}

function git(argomenti, opzioni = {}) {
  return spawnSync('git', argomenti, {
    cwd: root,
    encoding: 'utf8',
    ...opzioni,
  })
}

async function api(percorso, token, opzioni = {}) {
  const risposta = await fetch(`https://api.github.com${percorso}`, {
    ...opzioni,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'serata-giochi-publisher',
      ...(opzioni.body ? { 'Content-Type': 'application/json' } : {}),
      ...opzioni.headers,
    },
  })
  let corpo = null
  try {
    corpo = await risposta.json()
  } catch {
    /* 204 e simili non hanno corpo */
  }
  return { stato: risposta.status, corpo, headers: risposta.headers }
}

// ------------------------------------------------------------ configurazione
const percorsoEnv = join(root, '.env')
if (!existsSync(percorsoEnv)) {
  esci(
    'Manca il file .env',
    'Crealo copiando il modello:  cp .env.example .env  (poi riempi GITHUB_TOKEN e GITHUB_USER)',
  )
}

const env = leggiEnv(percorsoEnv)
const token = env.GITHUB_TOKEN
const utente = env.GITHUB_USER
const nomeRepo = env.GITHUB_REPO || 'serata-giochi'
const organizzazione = env.GITHUB_ORG || ''
const privato = (env.GITHUB_PRIVATE || 'true').toLowerCase() !== 'false'
const descrizione = env.GITHUB_DESC || 'Webapp per condurre e gestire la serata giochi'

if (!token) esci('GITHUB_TOKEN non valorizzato in .env')
if (!utente) esci('GITHUB_USER non valorizzato in .env')

const proprietario = organizzazione || utente

console.log(`\n${c.info('Repository')}  ${proprietario}/${nomeRepo}  ${privato ? '(privato)' : '(pubblico)'}`)

// --------------------------------------------------------------- 1. identita'
const io = await api('/user', token)
if (io.stato === 401) {
  esci(
    'Token rifiutato da GitHub (401)',
    'E’ scaduto, revocato, o incollato male. Rigenerane uno e riprova.',
  )
}
if (io.stato !== 200) {
  esci(`GitHub ha risposto ${io.stato} alla verifica del token`, io.corpo?.message)
}
console.log(`${c.ok('✓')} Token valido, autenticato come ${c.info(io.corpo.login)}`)

if (io.corpo.login.toLowerCase() !== utente.toLowerCase() && !organizzazione) {
  console.log(
    `${c.tenue('!')} ${c.tenue(`GITHUB_USER dice "${utente}" ma il token appartiene a "${io.corpo.login}". Uso quest’ultimo.`)}`,
  )
}
const proprietarioReale = organizzazione || io.corpo.login

const scope = io.headers.get('x-oauth-scopes')
if (scope !== null && scope !== '' && !scope.includes('repo')) {
  console.log(`${c.tenue('!')} ${c.tenue(`Scope del token: "${scope}" — potrebbe non bastare per creare o pushare.`)}`)
}

// ------------------------------------------------------- 2. il repo esiste?
const esistente = await api(`/repos/${proprietarioReale}/${nomeRepo}`, token)
let urlRepo = `https://github.com/${proprietarioReale}/${nomeRepo}.git`
let daCreare = false

if (esistente.stato === 200) {
  console.log(`${c.ok('✓')} Repository gia’ presente su GitHub`)
  urlRepo = esistente.corpo.clone_url
} else if (esistente.stato === 404) {
  daCreare = true
  console.log(`${c.tenue('·')} ${c.tenue('Repository non ancora presente: verra’ creato')}`)
} else {
  esci(`Controllo del repository fallito (${esistente.stato})`, esistente.corpo?.message)
}

// ------------------------------------------------------------- 3. stato git
const branch = git(['branch', '--show-current']).stdout.trim() || 'main'
const sporco = git(['status', '--porcelain']).stdout.trim()
const commit = git(['log', '--oneline', '-1']).stdout.trim()

console.log(`${c.ok('✓')} Branch ${c.info(branch)} — ultimo commit: ${commit || 'nessuno'}`)
if (sporco) {
  console.log(`${c.tenue('!')} ${c.tenue('Ci sono modifiche non committate: non verranno pubblicate.')}`)
  for (const riga of sporco.split('\n').slice(0, 10)) console.log(`   ${c.tenue(riga)}`)
}
if (!commit) esci('Nessun commit da pubblicare')

if (soloVerifica) {
  console.log(
    `\n${c.info('Verifica completata.')} ${
      daCreare ? 'Il repository verrebbe creato ora.' : 'Il repository esiste gia’.'
    } Nessuna modifica effettuata.\n`,
  )
  process.exit(0)
}

// ---------------------------------------------------------- 4. crea il repo
if (daCreare) {
  const percorsoCreazione = organizzazione ? `/orgs/${organizzazione}/repos` : '/user/repos'
  const creato = await api(percorsoCreazione, token, {
    method: 'POST',
    body: JSON.stringify({
      name: nomeRepo,
      description: descrizione,
      private: privato,
      has_issues: true,
      has_wiki: false,
      auto_init: false,
    }),
  })
  if (creato.stato === 201) {
    urlRepo = creato.corpo.clone_url
    console.log(`${c.ok('✓')} Repository creato: ${c.info(creato.corpo.html_url)}`)
  } else if (creato.stato === 403) {
    esci(
      'GitHub ha negato la creazione (403)',
      'Al token manca il permesso Administration (fine-grained) o lo scope `repo` (classic).',
    )
  } else if (creato.stato === 422) {
    esci(
      'GitHub ha rifiutato il nome (422)',
      creato.corpo?.errors?.[0]?.message || 'Probabilmente esiste gia’ un repo con questo nome.',
    )
  } else {
    esci(`Creazione fallita (${creato.stato})`, creato.corpo?.message)
  }
}

// ---------------------------------------------------- 5. identita' dei commit
if (env.GIT_AUTHOR_NAME) git(['config', 'user.name', env.GIT_AUTHOR_NAME])
if (env.GIT_AUTHOR_EMAIL) git(['config', 'user.email', env.GIT_AUTHOR_EMAIL])

// ------------------------------------------------------------- 6. il remoto
const remotiEsistenti = git(['remote']).stdout.split(/\s+/).filter(Boolean)
if (remotiEsistenti.includes('origin')) {
  git(['remote', 'set-url', 'origin', urlRepo])
} else {
  git(['remote', 'add', 'origin', urlRepo])
}
console.log(`${c.ok('✓')} Remoto origin → ${urlRepo}`)

// ----------------------------------------------------------------- 7. push
// Il credential helper legge il token dall'ambiente del processo git: non
// compare in .git/config, ne' negli argomenti, ne' nella cronologia della shell.
const helper = '!f() { echo username=x-access-token; echo "password=$GITHUB_TOKEN"; }; f'

console.log(`${c.tenue('·')} ${c.tenue('Push in corso — con ~50 MB di media puo’ richiedere qualche minuto...')}`)

const push = git(
  ['-c', `credential.helper=${helper}`, 'push', '--set-upstream', 'origin', `${branch}:${branch}`],
  {
    stdio: ['ignore', 'inherit', 'pipe'],
    env: { ...process.env, GITHUB_TOKEN: token, GIT_TERMINAL_PROMPT: '0' },
  },
)

if (push.status !== 0) {
  const errore = (push.stderr || '').replace(new RegExp(token, 'g'), '***')
  console.error(errore)
  if (/non-fast-forward|rejected/i.test(errore)) {
    esci(
      'Push rifiutato: il repository remoto ha commit che non hai in locale',
      'Recuperali con:  git pull --rebase origin ' + branch + '   poi rilancia npm run pubblica',
    )
  }
  if (/Authentication failed|could not read Username/i.test(errore)) {
    esci(
      'Autenticazione fallita durante il push',
      'Al token manca il permesso Contents: Read and write (fine-grained) o lo scope `repo` (classic).',
    )
  }
  esci('Push fallito')
}

const urlWeb = urlRepo.replace(/\.git$/, '')
console.log(`\n${c.ok('✓ Pubblicato')}  ${c.info(urlWeb)}`)
console.log(
  c.tenue(
    '\nSu Netlify: Add new site → Import an existing project → GitHub → scegli il repo.\n' +
      'netlify.toml e’ gia’ configurato, non serve impostare build o publish directory.\n',
  ),
)
