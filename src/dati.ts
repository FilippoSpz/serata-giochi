import type { DatiGiochi } from './tipi'

/**
 * Contenuti trascritti da lista-giochi.pdf.
 * Questo file e' solo il punto di partenza: la sezione Gestione dell'app
 * permette di modificare tutto e salva le modifiche nel browser.
 */
export const DATI_INIZIALI: DatiGiochi = {
  // -------------------------------------------------------------------------
  // 1. Notizie false
  // -------------------------------------------------------------------------
  notizie: [
    {
      id: 'not-1',
      domanda:
        'Ogni anno a luglio, ad Aalborg in Danimarca, si tiene un congresso mondiale. Di cosa?',
      opzioni: [
        'Babbi Natale',
        'Sosia di Elvis',
        'Cosplay di nani da giardino',
        'Smontatori assidui di lego',
      ],
      correttaIndex: 0,
      spiegazione:
        'Il congresso mondiale dei Babbo Natale, a luglio. Ogni anno, nel pieno dell’estate, Babbi Natale, signore Natale ed elfi da tutto il mondo si radunano ad Aalborg, in Danimarca, per il World Santa Claus Congress.',
    },
    {
      id: 'not-2',
      domanda:
        'Uno studente di ingegneria ha costruito, come tesi di laurea, un manichino da crash test — invenzione poi premiata con un Ig Nobel. A forma di cosa?',
      opzioni: [
        'Sua sorella',
        'Alce a grandezza naturale',
        'Ingvar Kamprad (fondatore di Ikea)',
        'Pupazzo di neve',
      ],
      correttaIndex: 1,
      spiegazione:
        'Il manichino da crash test a forma di alce. Lo svedese Magnus Gens ha sviluppato, come tesi di laurea al KTH di Stoccolma, un manichino per crash test a forma di alce — un problema molto concreto sulle strade scandinave. Ig Nobel 2022 per la sicurezza.',
    },
    {
      id: 'not-3',
      domanda:
        'Negli anni ’90 in Francia un gruppo clandestino rivendicava centinaia di furti in tutto il Paese in nome della “liberazione”. Nel 1997 il suo capo è stato condannato da un tribunale. Cosa liberavano?',
      opzioni: [
        'Aragoste dagli acquari dei ristoranti',
        'Piccioni viaggiatori dalle gabbie dei club di colombofili',
        'Nani da giardino',
        'Bonsai dai vivai',
      ],
      correttaIndex: 2,
      spiegazione:
        'Esiste (esisteva) un Fronte di Liberazione dei Nani da Giardino. Il Front de libération des nains de jardin si fece conoscere negli anni ’90 rivendicando il furto di centinaia di nani da giardino in tutta la Francia, e nel 2006 dichiarava un centinaio di militanti attivi tra Francia, Canada, Germania, Spagna e Stati Uniti. Nel 1997 un tribunale condannò il capo del gruppo a una pena sospesa e a una multa per la sparizione di circa 150 nani.',
    },
    {
      id: 'not-4',
      domanda:
        'Nel 2025, un giapponese ha speso circa 14.000 dollari per farsi costruire da un’azienda di effetti speciali un costume iperrealistico, realizzando il sogno di una vita. Quale?',
      opzioni: [
        'Fare un provino per uno spettacolo teatrale di furry',
        'Creare un cosplay di Harley Quinn',
        'Diventare un panda gigante per farsi fotografare allo zoo',
        'Trasformarsi in cane',
      ],
      correttaIndex: 3,
      spiegazione:
        'L’uomo che ha speso 2 milioni di yen per diventare un cane. Un giapponese noto solo come Toco ha commissionato all’azienda di effetti speciali Zeppet un costume iperrealistico da border collie, realizzato in 40 giorni, che replica struttura scheletrica, movimento del pelo e apertura della mandibola, e pesa circa 4 kg. Spesa: oltre 14.000 dollari. Nel 2025 ha aperto un’attività che noleggia i costumi a chi condivide il suo sogno di “diventare un animale”.',
    },
    {
      id: 'not-5',
      domanda:
        'Nel maggio 1991 il cosmonauta Sergej Krikàlev parte per la stazione spaziale Mir con una missione di cinque mesi. Ne resterà 311 giorni, il doppio del previsto. Perché?',
      opzioni: [
        'Un guasto al sistema di attracco della Soyuz rese impossibile il rientro per mesi',
        'L’URSS si dissolse e gli dissero che non c’erano più i soldi per riportarlo a terra',
        'Si offrì volontario per battere il record sovietico di permanenza in orbita',
        'Il suo posto sulla capsula di rientro fu rubato da un altro cosmonauta che doveva rimanere su al posto suo',
      ],
      correttaIndex: 1,
      spiegazione:
        'Il cosmonauta dimenticato in orbita perché il suo Paese era scomparso. Il 18 maggio 1991 Sergej Krikàlev partì per la stazione spaziale Mir; mentre era lassù, il Paese che lo aveva mandato cessò di esistere, rendendolo per qualche mese “l’ultimo cittadino sovietico”. Per accontentare il Kazakistan, dove si trova il cosmodromo di Bajkonur, Mosca cedette a un cosmonauta kazako il posto che sarebbe spettato all’ingegnere di volo esperto incaricato di sostituirlo: Krikàlev dovette restare in orbita a tempo indeterminato. Gli venne detto che non c’erano soldi per riportarlo giù, e la stessa risposta arrivò il mese dopo, e quello dopo ancora. Avrebbe potuto usare la capsula di rientro Raduga, ma sarebbe stata la fine della Mir, perché non era rimasto nessun altro a prendersene cura. Tornò dopo 311 giorni, il doppio del previsto.',
    },
  ],

  // -------------------------------------------------------------------------
  // 2. Immagini
  // -------------------------------------------------------------------------
  immagini: [
    {
      id: 'cat-persone',
      nome: 'Persone famose',
      tipo: 'progressiva',
      puntiIniziali: 3,
      descrizione:
        'Tre foto in sequenza: primo ritaglio, secondo ritaglio, figura intera. Si parte da 3 punti e si scala di uno a ogni nuova immagine.',
      voci: [
        {
          id: 'zendaya',
          nome: 'Zendaya',
          immagini: [
            '/media/immagini/persone/zendaya/1.jpg',
            '/media/immagini/persone/zendaya/2.jpg',
            '/media/immagini/persone/zendaya/3.jpg',
          ],
          reveal: '/media/immagini/persone/zendaya/reveal.jpg',
        },
        {
          id: 'de-niro',
          nome: 'Robert De Niro',
          immagini: [
            '/media/immagini/persone/de-niro/1.jpg',
            '/media/immagini/persone/de-niro/2.jpg',
            '/media/immagini/persone/de-niro/3.jpg',
          ],
          reveal: '/media/immagini/persone/de-niro/reveal.jpg',
        },
        {
          id: 'dipiazza',
          nome: 'Dipiazza',
          immagini: [
            '/media/immagini/persone/dipiazza/1.jpg',
            '/media/immagini/persone/dipiazza/2.jpg',
            '/media/immagini/persone/dipiazza/3.jpg',
          ],
          reveal: '/media/immagini/persone/dipiazza/reveal.jpg',
        },
        {
          id: 'madonna',
          nome: 'Madonna',
          immagini: [
            '/media/immagini/persone/madonna/1.jpg',
            '/media/immagini/persone/madonna/2.jpg',
            '/media/immagini/persone/madonna/3.jpg',
          ],
          reveal: '/media/immagini/persone/madonna/reveal.jpg',
        },
      ],
    },
    {
      id: 'cat-loghi',
      nome: 'Loghi',
      tipo: 'singola',
      puntiIniziali: 1,
      descrizione: 'Un logo censurato per volta. Ogni logo indovinato vale 1 punto.',
      voci: [
        {
          id: 'ford',
          nome: 'Ford',
          immagini: ['/media/immagini/loghi/ford/1.jpg'],
          reveal: '/media/immagini/loghi/ford/reveal.jpg',
        },
        {
          id: 'corsair',
          nome: 'Corsair',
          immagini: ['/media/immagini/loghi/corsair/1.jpg'],
          reveal: '/media/immagini/loghi/corsair/reveal.jpg',
        },
        {
          id: 'rummo',
          nome: 'Rummo',
          immagini: ['/media/immagini/loghi/rummo/1.jpg'],
          reveal: '/media/immagini/loghi/rummo/reveal.jpg',
        },
        {
          id: 'google-earth',
          nome: 'Google Earth',
          immagini: ['/media/immagini/loghi/google-earth/1.jpg'],
          reveal: '/media/immagini/loghi/google-earth/reveal.jpg',
        },
      ],
    },
    {
      id: 'cat-film',
      nome: 'Fotogrammi di film',
      tipo: 'progressiva',
      puntiIniziali: 3,
      descrizione:
        'Tre fotogrammi diversi per ogni film. Si parte da 3 punti e si scala di uno a ogni nuovo fotogramma.',
      voci: [
        {
          id: 'tenet',
          nome: 'Tenet',
          immagini: [
            '/media/immagini/film/tenet/1.png',
            '/media/immagini/film/tenet/2.png',
            '/media/immagini/film/tenet/3.png',
          ],
        },
        {
          id: 'harry-potter-7',
          nome: 'Harry Potter e i Doni della Morte — Parte 1',
          immagini: [
            '/media/immagini/film/harry-potter-7/1.png',
            '/media/immagini/film/harry-potter-7/2.png',
            '/media/immagini/film/harry-potter-7/3.png',
          ],
        },
        {
          id: 'mamma-ho-perso-laereo',
          nome: 'Mamma, ho perso l’aereo',
          immagini: [
            '/media/immagini/film/mamma-ho-perso-laereo/1.png',
            '/media/immagini/film/mamma-ho-perso-laereo/2.png',
            '/media/immagini/film/mamma-ho-perso-laereo/3.png',
          ],
        },
        {
          id: 'shining',
          nome: 'Shining',
          immagini: [
            '/media/immagini/film/shining/1.png',
            '/media/immagini/film/shining/2.png',
            '/media/immagini/film/shining/3.png',
          ],
        },
      ],
    },
    {
      id: 'cat-oggetti',
      nome: 'Oggetti',
      tipo: 'progressiva',
      puntiIniziali: 3,
      descrizione:
        'Tre foto ritagliate per oggetto, tre livelli di zoom. Si parte da 3 punti e si scala di uno a ogni nuovo zoom.',
      voci: [
        {
          id: 'semaforo',
          nome: 'Semaforo',
          immagini: [
            '/media/immagini/oggetti/semaforo/1.jpg',
            '/media/immagini/oggetti/semaforo/2.jpg',
            '/media/immagini/oggetti/semaforo/3.jpg',
          ],
          reveal: '/media/immagini/oggetti/semaforo/reveal.jpg',
        },
        {
          id: 'aereo',
          nome: 'Parte di aereo',
          immagini: [
            '/media/immagini/oggetti/aereo/1.jpg',
            '/media/immagini/oggetti/aereo/2.jpg',
            '/media/immagini/oggetti/aereo/3.jpg',
          ],
          reveal: '/media/immagini/oggetti/aereo/reveal.jpg',
        },
        {
          id: 'penna',
          nome: 'Punta di penna',
          immagini: [
            '/media/immagini/oggetti/penna/1.jpg',
            '/media/immagini/oggetti/penna/2.jpg',
            '/media/immagini/oggetti/penna/3.jpg',
          ],
          reveal: '/media/immagini/oggetti/penna/reveal.jpg',
        },
        {
          id: 'gatto',
          nome: 'Gatto peluche',
          immagini: [
            '/media/immagini/oggetti/gatto/1.jpg',
            '/media/immagini/oggetti/gatto/2.jpg',
            '/media/immagini/oggetti/gatto/3.jpg',
          ],
          reveal: '/media/immagini/oggetti/gatto/reveal.jpg',
        },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // 3. QDCP — Quando, dove, come, perche
  // -------------------------------------------------------------------------
  qdcp: [
    {
      id: 'qdcp-passaporto',
      parola: 'Passaporto',
      quando: 'si va lontano',
      dove: 'mai dove lo cerchi',
      come: 'si apre e si mostra',
      perche: 'senza non ti fanno salire sull’aereo',
    },
    {
      id: 'qdcp-carota',
      parola: 'Carota',
      quando: 'dopo una forte nevicata',
      dove: 'tra due bottoni',
      come: 'di colore arancione',
      perche: 'per fare da naso al pupazzo di neve',
    },
    {
      id: 'qdcp-tovaglia',
      parola: 'Tovaglia',
      quando: 'mentre sto seduto',
      dove: 'stesa davanti a me',
      come: 'sbiadita dagli anni',
      perche: 'perché per apparecchiare uso sempre la stessa',
    },
    {
      id: 'qdcp-selfie',
      parola: 'Selfie',
      quando: 'quando tutti vogliono starci dentro',
      dove: 'in fondo al bastone',
      come: 'con le smorfie allo schermo',
      perche: 'perché è l’irresistibile autoscatto',
    },
    {
      id: 'qdcp-livido',
      parola: 'Livido',
      quando: 'quando dici “ahia”',
      dove: 'in superficie',
      come: 'prima blu poi verde',
      perche: 'perché appare sulla pelle dopo un forte colpo',
    },
    {
      id: 'qdcp-francobollo',
      parola: 'Francobollo',
      quando: 'prima di andare in buca',
      dove: 'sulla punta della lingua',
      come: 'con un saporaccio',
      perche: 'per leccarlo e attaccarlo alla lettera',
    },
  ],

  // -------------------------------------------------------------------------
  // 4. Musica
  // -------------------------------------------------------------------------
  musica: [
    {
      id: 'mus-80-90',
      nome: '80s / 90s',
      brani: [
        {
          id: 'pyt',
          titolo: 'P.Y.T. (Pretty Young Thing)',
          artista: 'Michael Jackson',
          indizio1: '/media/musica/anni-80-90/pyt/indizio-1.mp3',
          indizio2: '/media/musica/anni-80-90/pyt/indizio-2.mp3',
          completo: '/media/musica/anni-80-90/pyt/completo.mp3',
        },
        {
          id: '99-luftballons',
          titolo: '99 Luftballons',
          artista: 'Nena',
          indizio1: '/media/musica/anni-80-90/99-luftballons/indizio-1.mp3',
          indizio2: '/media/musica/anni-80-90/99-luftballons/indizio-2.mp3',
          completo: '/media/musica/anni-80-90/99-luftballons/completo.mp3',
        },
        {
          id: 'funkytown',
          titolo: 'Funkytown',
          artista: 'Lipps Inc.',
          indizio1: '/media/musica/anni-80-90/funkytown/indizio-1.mp3',
          indizio2: '/media/musica/anni-80-90/funkytown/indizio-2.mp3',
          completo: '/media/musica/anni-80-90/funkytown/completo.mp3',
        },
        {
          id: 'we-didnt-start-the-fire',
          titolo: 'We Didn’t Start the Fire',
          artista: 'Billy Joel',
          indizio1: '/media/musica/anni-80-90/we-didnt-start-the-fire/indizio-1.mp3',
          indizio2: '/media/musica/anni-80-90/we-didnt-start-the-fire/indizio-2.mp3',
          completo: '/media/musica/anni-80-90/we-didnt-start-the-fire/completo.mp3',
        },
        {
          id: 'vogue',
          titolo: 'Vogue',
          artista: 'Madonna',
          indizio1: '/media/musica/anni-80-90/vogue/indizio-1.mp3',
          indizio2: '/media/musica/anni-80-90/vogue/indizio-2.mp3',
          completo: '/media/musica/anni-80-90/vogue/completo.mp3',
        },
        {
          id: 'californication',
          titolo: 'Californication',
          artista: 'Red Hot Chili Peppers',
          indizio1: '/media/musica/anni-80-90/californication/indizio-1.mp3',
          indizio2: '/media/musica/anni-80-90/californication/indizio-2.mp3',
          completo: '/media/musica/anni-80-90/californication/completo.mp3',
        },
      ],
    },
    {
      id: 'mus-edm',
      nome: 'EDM',
      brani: [
        {
          id: 'stay',
          titolo: 'Stay',
          artista: 'Zedd, Alessia Cara',
          indizio1: '/media/musica/edm/stay/indizio-1.mp3',
          indizio2: '/media/musica/edm/stay/indizio-2.mp3',
          completo: '/media/musica/edm/stay/completo.mp3',
        },
        {
          id: 'sweet-nothing',
          titolo: 'Sweet Nothing (feat. Florence Welch)',
          artista: 'Calvin Harris',
          indizio1: '/media/musica/edm/sweet-nothing/indizio-1.mp3',
          indizio2: '/media/musica/edm/sweet-nothing/indizio-2.mp3',
          completo: '/media/musica/edm/sweet-nothing/completo.mp3',
        },
        {
          id: 'without-you',
          titolo: 'Without You (feat. Sandro Cavazza)',
          artista: 'Avicii',
          indizio1: '/media/musica/edm/without-you/indizio-1.mp3',
          indizio2: '/media/musica/edm/without-you/indizio-2.mp3',
          completo: '/media/musica/edm/without-you/completo.mp3',
        },
        {
          id: 'selfie',
          titolo: '#SELFIE (Original Mix)',
          artista: 'The Chainsmokers',
          indizio1: '/media/musica/edm/selfie/indizio-1.mp3',
          indizio2: '/media/musica/edm/selfie/indizio-2.mp3',
          completo: '/media/musica/edm/selfie/completo.mp3',
        },
        {
          id: 'the-fox',
          titolo: 'The Fox (What Does the Fox Say?)',
          artista: 'Ylvis',
          indizio1: '/media/musica/edm/the-fox/indizio-1.mp3',
          indizio2: '/media/musica/edm/the-fox/indizio-2.mp3',
          completo: '/media/musica/edm/the-fox/completo.mp3',
        },
        {
          id: 'lovers-on-the-sun',
          titolo: 'Lovers on the Sun (feat. Sam Martin)',
          artista: 'David Guetta',
          indizio1: '/media/musica/edm/lovers-on-the-sun/indizio-1.mp3',
          indizio2: '/media/musica/edm/lovers-on-the-sun/indizio-2.mp3',
          completo: '/media/musica/edm/lovers-on-the-sun/completo.mp3',
        },
      ],
    },
    {
      id: 'mus-italiana',
      nome: 'Italiana',
      brani: [
        {
          id: 'da-zero-a-cento',
          titolo: 'Da zero a cento',
          artista: 'Baby K',
          indizio1: '/media/musica/italiana/da-zero-a-cento/indizio-1.mp3',
          indizio2: '/media/musica/italiana/da-zero-a-cento/indizio-2.mp3',
          completo: '/media/musica/italiana/da-zero-a-cento/completo.mp3',
        },
        {
          id: 'ma-quale-idea',
          titolo: 'Ma quale idea',
          artista: 'Pino D’Angiò',
          indizio1: '/media/musica/italiana/ma-quale-idea/indizio-1.mp3',
          indizio2: '/media/musica/italiana/ma-quale-idea/indizio-2.mp3',
          completo: '/media/musica/italiana/ma-quale-idea/completo.mp3',
        },
        {
          id: 'figli-delle-stelle',
          titolo: 'Figli delle stelle',
          artista: 'Alan Sorrenti',
          indizio1: '/media/musica/italiana/figli-delle-stelle/indizio-1.mp3',
          indizio2: '/media/musica/italiana/figli-delle-stelle/indizio-2.mp3',
          completo: '/media/musica/italiana/figli-delle-stelle/completo.mp3',
        },
        {
          id: 'se-bruciasse-la-citta',
          titolo: 'Se bruciasse la città',
          artista: 'Massimo Ranieri',
          indizio1: '/media/musica/italiana/se-bruciasse-la-citta/indizio-1.mp3',
          indizio2: '/media/musica/italiana/se-bruciasse-la-citta/indizio-2.mp3',
          completo: '/media/musica/italiana/se-bruciasse-la-citta/completo.mp3',
        },
        {
          id: 'che-ne-sanno-i-2000',
          titolo: 'Che ne sanno i 2000',
          artista: 'Gabry Ponte, Danti',
          indizio1: '/media/musica/italiana/che-ne-sanno-i-2000/indizio-1.mp3',
          indizio2: '/media/musica/italiana/che-ne-sanno-i-2000/indizio-2.mp3',
          completo: '/media/musica/italiana/che-ne-sanno-i-2000/completo.mp3',
        },
        {
          id: 'tran-tran',
          titolo: 'Tran Tran',
          artista: 'Sfera Ebbasta',
          indizio1: '/media/musica/italiana/tran-tran/indizio-1.mp3',
          indizio2: '/media/musica/italiana/tran-tran/indizio-2.mp3',
          completo: '/media/musica/italiana/tran-tran/completo.mp3',
        },
      ],
    },
    {
      id: 'mus-billions',
      nome: 'Billions Club',
      brani: [
        {
          id: 'million-dollar-baby',
          titolo: 'Million Dollar Baby',
          artista: 'Tommy Richman',
          indizio1: '/media/musica/billions-club/million-dollar-baby/indizio-1.mp3',
          indizio2: '/media/musica/billions-club/million-dollar-baby/indizio-2.mp3',
          completo: '/media/musica/billions-club/million-dollar-baby/completo.mp3',
        },
        {
          id: 'circles',
          titolo: 'Circles',
          artista: 'Post Malone',
          indizio1: '/media/musica/billions-club/circles/indizio-1.mp3',
          indizio2: '/media/musica/billions-club/circles/indizio-2.mp3',
          completo: '/media/musica/billions-club/circles/completo.mp3',
        },
        {
          id: 'finesse',
          titolo: 'Finesse (Remix) feat. Cardi B',
          artista: 'Bruno Mars, Cardi B',
          indizio1: '/media/musica/billions-club/finesse/indizio-1.mp3',
          indizio2: '/media/musica/billions-club/finesse/indizio-2.mp3',
          completo: '/media/musica/billions-club/finesse/completo.mp3',
        },
        {
          id: 'timeless',
          titolo: 'Timeless (feat. Playboi Carti)',
          artista: 'The Weeknd, Playboi Carti',
          indizio1: '/media/musica/billions-club/timeless/indizio-1.mp3',
          indizio2: '/media/musica/billions-club/timeless/indizio-2.mp3',
          completo: '/media/musica/billions-club/timeless/completo.mp3',
        },
        {
          id: 'crown',
          titolo: 'you should see me in a crown',
          artista: 'Billie Eilish',
          indizio1: '/media/musica/billions-club/crown/indizio-1.mp3',
          indizio2: '/media/musica/billions-club/crown/indizio-2.mp3',
          completo: '/media/musica/billions-club/crown/completo.mp3',
        },
        {
          id: 'physical',
          titolo: 'Physical',
          artista: 'Dua Lipa',
          indizio1: '/media/musica/billions-club/physical/indizio-1.mp3',
          indizio2: '/media/musica/billions-club/physical/indizio-2.mp3',
          completo: '/media/musica/billions-club/physical/completo.mp3',
        },
      ],
    },
  ],
}

/**
 * Durata reale di ogni spezzone audio. Il PDF diceva 10 secondi, ma i file
 * forniti ne durano 5: comanda il file, non il documento.
 */
export const SECONDI_INDIZIO = 5

/** Regolamenti mostrati in testa a ogni gioco, trascritti dal PDF. */
export const REGOLE = {
  notizie: [
    'Per ogni notizia vengono lette quattro possibilità: una sola è vera.',
    'Rispondono le squadre a turno: una notizia per squadra, poi si cambia.',
    'Chi indovina prende 1 punto. Se sbaglia non perde nulla: si passa alla notizia successiva.',
    'Consiglio per chi legge: leggi tutte e quattro le opzioni con lo stesso tono. Se enfatizzi quella giusta, il gioco finisce subito.',
  ],
  immagini: [
    'Quattro categorie: persone famose, loghi, fotogrammi di film, oggetti. Ogni categoria contiene quattro elementi da indovinare.',
    'Si gioca a squadre alternate: parte una squadra, all’immagine dopo l’altra. Un tentativo per volta; se sbaglia, provano gli avversari.',
    'Quando una categoria prevede più immagini per lo stesso elemento, le immagini successive si mostrano solo dopo che entrambe le squadre hanno provato.',
  ],
  qdcp: [
    'Si gioca a squadre alternate: una parola per squadra, poi si cambia.',
    'Per ogni parola da indovinare gli indizi si leggono uno alla volta, sempre nello stesso ordine: quando, dove, come, perché.',
    'Ogni nuovo indizio svela qualcosa in più e abbassa il valore della parola: si parte da 4 punti e si scala di uno a ogni indizio aggiuntivo.',
    'Lascia qualche secondo di silenzio tra un indizio e il successivo: chi rischia presto guadagna il massimo.',
  ],
  musica: [
    'Si sfidano le squadre, non i singoli: prima una, poi l’altra.',
    'La squadra di turno ascolta i primi 5 secondi del brano. Se indovina il titolo prende 1 punto; se indovina anche l’artista ne prende un altro.',
    'Se sbaglia, il brano passa agli avversari, che ascoltano i 5 secondi successivi: il valore si dimezza.',
    'A ogni passaggio il valore si dimezza ancora. Se non lo prende nessuno il brano si chiude senza punti.',
    'Chiuso un brano si riparte con quello nuovo, e tocca all’altra squadra.',
    'Quattro categorie da sei brani ciascuna, per un totale di 24 brani.',
  ],
} as const
