# Serata Giochi

Webapp per **condurre** e **gestire** la serata: quattro giochi, due squadre, punteggi in tempo
reale. I contenuti sono trascritti da `lista-giochi.pdf` e restano modificabili dall'app.

- **React 19 + TypeScript + Vite**, nessuna dipendenza a runtime oltre React.
- Tutto lo stato vive nel browser (`localStorage`): niente server, niente database, niente login.
- Pensata per stare su una TV o un proiettore: tipografia grande, tema scuro, un solo tabellone.

---

## Avvio in locale

```bash
npm install
npm run importa-media     # copia immagini e audio da ../Serata giochi in public/media
npm run dev               # http://localhost:5173
```

Per la build di produzione:

```bash
npm run build             # output in dist/
npm run preview
```

---

## I quattro giochi

| # | Gioco | Chi segna | Come si calcola il punteggio |
|---|-------|-----------|------------------------------|
| 1 | Notizie false | Squadra | 1 punto a notizia. Si alterna a ogni errore; chi parte cambia a ogni domanda. |
| 2 | Immagini | Squadra | Si parte dai punti della categoria e si scala di 1 a ogni nuova immagine mostrata (minimo 1). I loghi valgono 1 punto fisso. |
| 3 | QDCP | Squadra | 4 punti al primo indizio, poi 3, 2, 1 a ogni indizio letto. |
| 4 | Musica | **Giocatore** | Titolo 1 punto, artista 1 punto. Ogni passaggio dimezza il valore (1 → 0,5 → 0,25). Chi sbaglia esce dalla categoria in corso. |

I primi tre giochi assegnano punti direttamente alla squadra; la musica li assegna al singolo
giocatore **e** alla sua squadra. Per questo il totale di squadra è sempre ≥ della somma dei suoi
giocatori.

## Punteggio per 8 giocatori

Sì, ed è il caso predefinito. In **Prepara la serata** imposti da 2 a 16 giocatori (8 di default):
vengono assegnati alle due squadre alternandosi A, B, A, B — esattamente la disposizione al tavolo
descritta dal regolamento della musica. L'ordine dell'elenco è anche l'ordine dei turni.

La **Classifica** mostra tre livelli:

- totale per squadra, con il dettaglio gioco per gioco;
- tabella dei punti individuali, ordinata;
- registro completo di ogni assegnazione, con annullamento singolo.

Ogni riga ha `+1` / `−1` per le rettifiche a mano, e ogni schermata di gioco ha «Annulla ultimo»:
durante la serata capita di sbagliare a cliccare, e nessun punteggio è mai inchiodato.

---

## Media

`npm run importa-media` legge la cartella `Serata giochi` e la copia in `public/media`
normalizzando i nomi in slug ASCII (`Persone famose/1. Zendaya/` → `persone/zendaya/`).

| Contenuto | Peso | Nel repository |
|-----------|------|----------------|
| Immagini (76 file) | ~40 MB | sì |
| Indizi audio, 2 per brano (48 file) | ~9 MB | sì |
| Brani completi (24 file) | ~219 MB | **no**, esclusi da `.gitignore` |

I brani completi servono solo al «reveal» dopo che qualcuno ha indovinato. Tenerli fuori dal
repository è deliberato: 219 MB renderebbero pesante ogni clone e ogni deploy. Se il file manca,
l'app mostra comunque titolo e artista e lo dice esplicitamente. Per averli in locale basta
rieseguire `npm run importa-media`.

Se cambi la cartella sorgente:

```bash
node scripts/importa-media.mjs "D:/percorso/Serata giochi"
```

---

## Gestione contenuti

La sezione **Gestione** modifica tutto senza toccare il codice: domande e risposte, opzioni,
spiegazioni, indizi QDCP, titoli e artisti, percorsi di immagini e audio. Si aggiungono ed
eliminano voci, categorie e brani.

Le modifiche finiscono in `localStorage`, quindi valgono per quel browser. **Backup e ripristino**
esporta e reimporta tutto come JSON, e riporta i contenuti alla versione del PDF.

I contenuti di partenza vivono in `src/dati.ts`: modificarli lì cambia il default per chiunque
apra l'app senza dati salvati.

---

## Pubblicare su GitHub

`npm run pubblica` crea il repository e fa il push leggendo le credenziali da `.env`:

```bash
cp .env.example .env          # poi riempi GITHUB_TOKEN e GITHUB_USER
npm run pubblica -- --verifica   # controlla token, permessi e stato, senza toccare nulla
npm run pubblica                 # crea il repo (se manca) e pusha
```

`.env` è escluso da `.gitignore`, quindi il token non finisce mai nel repository. Non viene
nemmeno scritto in `.git/config` né passato sulla riga di comando: git lo riceve tramite un
credential helper temporaneo che lo legge dall'ambiente del processo. In caso di errore, il token
viene mascherato prima di stampare l'output di git.

Serve un [fine-grained token](https://github.com/settings/personal-access-tokens/new) con
**Administration: Read and write** (per creare il repo) e **Contents: Read and write** (per il
push); in alternativa un token classic con il solo scope `repo`. È revocabile in qualsiasi
momento. Lo script è rieseguibile: se il repo esiste già, salta la creazione e fa solo il push.

## Deploy su Netlify

`netlify.toml` è già configurato (build `npm run build`, publish `dist`, redirect SPA, cache dei
media). Da Netlify: **Add new site → Import an existing project**, scegli il repository, e i
valori vengono letti dal file — non serve impostare nulla a mano. Funziona anche con repo privati.

---

## Struttura

```
src/
  dati.ts                 contenuti trascritti dal PDF + testi dei regolamenti
  tipi.ts                 modello di contenuti e sessione
  store.tsx               stato globale, persistenza, selettori di punteggio
  rotte.ts                router minimale su hash
  App.tsx                 barra superiore e navigazione
  componenti/Comuni.tsx   pezzi condivisi (regolamento, assegna punti, navigazione)
  schermate/              Home, Setup, Notizie, Immagini, Qdcp, Musica, Classifica, Gestione
scripts/
  importa-media.mjs       importazione e normalizzazione dei media
public/media/             immagini e audio (generati)
```
