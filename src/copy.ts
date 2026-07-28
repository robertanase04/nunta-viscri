import type { IconName } from './components/Ornament/icons'

/**
 * Every word on the site, in both languages.
 *
 * Kept in one file rather than scattered through the components so that a
 * change to the Romanian and its English counterpart are always visible to
 * each other — the two drifting apart is the failure mode of any other
 * arrangement.
 *
 * Place names stay in Romanian in both. A guest driving to Saschiz reads
 * road signs, not translations, and "Saschiz Peasant Citadel" is no help at
 * a junction; the English explains around the name instead of replacing it.
 *
 * There is no switch on the page. Which language a guest gets is decided by
 * the link they are sent, which is the whole point of putting it in the URL.
 */

export type Locale = 'ro' | 'en'

/** The Romanian site lives at the root; English hangs off /en. */
export const localeFromPath = (path: string): Locale =>
  /^\/en(\/|$)/.test(path) ? 'en' : 'ro'

interface Entry {
  icon: IconName
  label: string
  note?: string
}

interface Day {
  weekday: string
  date: string
  hour: string
  where: string
  entries: readonly Entry[]
}

interface Place {
  name: string
  note: string
}

interface Fact {
  term: string
  detail: string
}

export interface Copy {
  htmlLang: string
  title: string
  description: string

  intro: {
    seal: string
    scroll: string
    loading: string
    altCoverLeft: string
    altCoverRight: string
    altMap: string
  }

  masthead: { kicker: string; nameBefore: string; nameAccent: string; nameAfter: string; dates: string }

  story: { title: string; paragraphs: readonly string[]; altEmblem: string }
  programme: { title: string; days: readonly Day[] }
  places: { title: string; intro: string; items: readonly Place[]; alts: readonly string[] }
  details: { title: string; facts: readonly Fact[]; altSignpost: string }
  colophon: { altCouple: string; villages: string }

  stopLabel: (n: string, title: string) => string
}

/* ------------------------------------------------------------------ */

const ro: Copy = {
  htmlLang: 'ro',
  title: 'Casa Tănase · Trei zile pe colinele Transilvaniei · 4–6 septembrie 2026',
  description:
    'Trei zile în Saschiz, Viscri și Bunești. Program, locuri, transport și cazare.',

  intro: {
    seal: 'Rupe sigiliul și deschide invitația',
    scroll: 'Coboară',
    loading: 'Se încarcă',
    altCoverLeft: 'Casa Tanase — noi doi, va chemam pe voi, pe colinele Transilvaniei',
    altCoverRight:
      'Cele mai frumoase ture sunt cele pe care le facem impreuna cu voi — transport, cazare si dress code',
    altMap:
      'Harta weekendului: vineri la Saschiz, sâmbătă la Viscri, duminică la Bunești',
  },

  masthead: {
    kicker: 'Pe colinele Transilvaniei',
    nameBefore: 'Noi doi,',
    nameAccent: 'vă chemăm',
    nameAfter: 'pe voi',
    dates: 'septembrie 2026',
  },

  story: {
    title: 'Casa Tănase',
    paragraphs: [
      'Ne-am cunoscut la cabinet, nu pe biciclete, însă timpul liber și vacanțele ne-au fost facilitate de biciclete încă din august 2021. De atunci ne-am vândut mașina și nu prea am mai coborât de pe ele. Am pedalat prin destule locuri, dar pe colinele dintre Saschiz și Viscri ne-am tot întors — pentru drumurile de pământ care nu duc nicăieri anume, pentru liniștea de la amiază, dar mai ales pentru oamenii care însuflețesc și îngrijesc această bucată din Transilvania. Îi veți cunoaște și voi pe o parte dintre ei.',
      'Ne căsătorim aici, în septembrie. Nu într-o zi, ci în trei — pentru că drumul până la noi e lung și ar fi păcat să-l faceți degeaba.',
    ],
    altEmblem: 'Cei doi miri pe tandem, sub stema Casei Tănase',
  },

  programme: {
    title: 'Trei zile, trei sate săsești',
    days: [
      {
        weekday: 'Vineri',
        date: '4 septembrie',
        hour: '17:00',
        where: 'Saschiz',
        entries: [
          { icon: 'pin', label: 'Veți fi aduși de la cazare la Castle View' },
          { icon: 'acte', label: 'Cununia civilă la Cetatea Fortificată Saschiz' },
          { icon: 'ceaun', label: 'Cină tradițională' },
          { icon: 'disco', label: 'DJ set' },
          { icon: 'alarma', label: 'Stingerea luminilor la 23:00' },
        ],
      },
      {
        weekday: 'Sâmbătă',
        date: '5 septembrie',
        hour: '14:30',
        where: 'Viscri',
        entries: [
          { icon: 'pin', label: 'Veți fi aduși la Viscri 9' },
          { icon: 'church', label: 'Cununia spirituală' },
          { icon: 'feast', label: 'Masa festivă' },
          { icon: 'dans', label: 'Mare chef', note: 'Cât duce generatorul.' },
        ],
      },
      {
        weekday: 'Duminică',
        date: '6 septembrie',
        hour: '12:00',
        where: 'Bike Checkinn, Bunești',
        entries: [
          { icon: 'cup', label: 'Coffee Van' },
          { icon: 'bicycle', label: 'Tur cu bicicleta' },
          { icon: 'feast', label: 'Prânz târziu' },
          { icon: 'bonfire', label: 'Folk la foc' },
        ],
      },
    ],
  },

  places: {
    title: 'Locuri',
    intro:
      'Trei popasuri, trei zile diferite în trei sate săsești vecine. Pe toate le îndrăgim la fel de tare — nu ne-am putut decide la unul singur!',
    items: [
      {
        name: 'Saschiz',
        note: 'Veți fi aduși la Castle View, o casă săsească de la 1816, de unde vom porni pe deal la Cetatea Țărănească Saschiz. Acolo spunem „DA” răspicat și revenim la Castle View pentru o cină tradițională și o petrecere de warm-up.',
      },
      {
        name: 'Viscri',
        note: 'Pornim de la Viscri 9, o casă săsească la cotitură pe ulița principală. La Biserica Fortificată din Viscri ne vom împreuna destinele și în temei spiritual. Apoi, cu tot alaiul, ajungem la Viscri 125 unde — sperăm noi! — petrecem până dimineața.',
      },
      {
        name: 'Bunești',
        note: 'A treia zi, după micul dejun, ne întâlnim la Bike Checkinn să ne dregem cu cafea și limonade. Pe la unu-două dăm o tură cu bicicleta, cât ne țin pedalele. Revenim la Bike Checkinn să ne îndopăm cu gustări locale și, spre seară, încercuim un foc de tabără pe fundal de muzică folk.',
      },
    ],
    alts: [
      'Cetatea țărănească din Saschiz, văzută de sus',
      'Casa săsească din Viscri de unde pornește alaiul',
      'Bike Checkinn, punctul de plecare pentru tura de duminică',
    ],
  },

  details: {
    title: 'Ce e bine să știți',
    facts: [
      {
        term: 'Mașina rămâne la cazare',
        detail:
          'Transportul îl asigurăm noi tot weekendul, între cazare și fiecare popas. Inclusiv bicicletele — nu trebuie să veniți cu ale voastre.',
      },
      {
        term: 'Cazările sunt deja rezervate',
        detail:
          'Nu trebuie să căutați nimic. Spuneți-ne doar câte nopți vreți să rămâneți și ne ocupăm de rest. Micul dejun va fi inclus sau opțional.',
      },
      {
        term: 'Veniți cu copiii',
        detail:
          'Fiecare activitate din weekend e gândită să îi includă și pe ei. Curțile sunt mari și avem pe cine ne baza să îi distreze.',
      },
      {
        term: 'Dress code: „Albastru de Saschiz”',
        detail:
          'Albastrul de pe ceramica de Saschiz, în ce nuanță vă place. Purtați ceva ușor și comod — se merge pe iarbă și pe piatră, iar seara, în septembrie, dealurile își aduc aminte că e toamnă.',
      },
      {
        term: 'Speech sau toast',
        detail:
          'Invitație deschisă pentru a împărtăși o poveste, un sfat, o glumă sau o poză amuzantă cu noi. Cei fără frică de dentist sau de vorbit în public, anunțați-o pe Cătălina Popoviciu în prealabil.',
      },
      {
        term: 'Restricții alimentare sau muzicale?',
        detail: 'Let us know.',
      },
    ],
    altSignpost: 'Indicator rutier spre Viscri, Saschiz și Bunești',
  },

  colophon: {
    altCouple: 'Cei doi miri pe un câmp de păpădii, cu bicicleta alături',
    villages: 'Saschiz · Viscri · Bunești',
  },

  stopLabel: (n, title) => `Popasul ${n}: ${title}`,
}

/* ------------------------------------------------------------------ */

const en: Copy = {
  htmlLang: 'en',
  title: 'Casa Tănase · Three days in the hills of Transylvania · 4–6 September 2026',
  description:
    'Three days across Saschiz, Viscri and Bunești. Programme, places, transport and lodging.',

  intro: {
    seal: 'Break the seal and open the invitation',
    scroll: 'Scroll',
    loading: 'Loading',
    altCoverLeft: 'Casa Tanase — the two of us, inviting the two of you, to the hills of Transylvania',
    altCoverRight:
      'The finest rides are the ones we take with you — transport, lodging and dress code',
    altMap: 'Map of the weekend: Friday in Saschiz, Saturday in Viscri, Sunday in Bunești',
  },

  masthead: {
    kicker: 'In the hills of Transylvania',
    nameBefore: 'The two of us,',
    nameAccent: 'inviting',
    nameAfter: 'the two of you',
    dates: 'September 2026',
  },

  story: {
    title: 'Casa Tănase',
    paragraphs: [
      'We met at the practice, not on bicycles — but since August 2021 the bicycles are what our free time and our holidays have been built around. We sold the car soon after and have barely been off them since. We have pedalled through plenty of places, yet we keep coming back to the hills between Saschiz and Viscri: for the dirt roads that lead nowhere in particular, for how quiet it goes around midday, and most of all for the people who keep this corner of Transylvania alive. You will meet some of them yourselves.',
      'We are getting married here, in September. Not in one day but in three — the drive out to us is long, and it would be a shame to make it for nothing.',
    ],
    altEmblem: 'The couple on a tandem, beneath the Casa Tănase crest',
  },

  programme: {
    title: 'Three days, three Saxon villages',
    days: [
      {
        weekday: 'Friday',
        date: '4 September',
        hour: '17:00',
        where: 'Saschiz',
        entries: [
          { icon: 'pin', label: 'We collect you from your lodging and bring you to Castle View' },
          { icon: 'acte', label: 'Civil ceremony at the fortified church in Saschiz' },
          { icon: 'ceaun', label: 'Traditional dinner' },
          { icon: 'disco', label: 'DJ set' },
          { icon: 'alarma', label: 'Lights out at 23:00' },
        ],
      },
      {
        weekday: 'Saturday',
        date: '5 September',
        hour: '14:30',
        where: 'Viscri',
        entries: [
          { icon: 'pin', label: 'We bring you to Viscri 9' },
          { icon: 'church', label: 'Church ceremony' },
          { icon: 'feast', label: 'The wedding meal' },
          { icon: 'dans', label: 'Dancing', note: 'For as long as the generator holds out.' },
        ],
      },
      {
        weekday: 'Sunday',
        date: '6 September',
        hour: '12:00',
        where: 'Bike Checkinn, Bunești',
        entries: [
          { icon: 'cup', label: 'Coffee van' },
          { icon: 'bicycle', label: 'A ride out' },
          { icon: 'feast', label: 'A late lunch' },
          { icon: 'bonfire', label: 'Folk music round the fire' },
        ],
      },
    ],
  },

  places: {
    title: 'Places',
    intro:
      'Three stops, three different days, three neighbouring Saxon villages. We are equally fond of all of them — we could not bring ourselves to pick just one.',
    items: [
      {
        name: 'Saschiz',
        note: 'We bring you to Castle View, a Saxon house dating from 1816, and from there we walk up the hill to the fortified citadel. That is where we say a firm “yes”, before heading back down to Castle View for a traditional dinner and a warm-up party.',
      },
      {
        name: 'Viscri',
        note: 'We set off from Viscri 9, a Saxon house on the bend of the main lane. At the fortified church we join our lives in the spiritual sense too. Then the whole procession moves on to Viscri 125, where — we hope — we carry on until morning.',
      },
      {
        name: 'Bunești',
        note: 'On the third day, after breakfast, we gather at the Bike Checkinn to put ourselves back together with coffee and lemonade. Around one or two we take a ride out, for as long as our legs hold. Back at the Bike Checkinn we fill up on local food and, towards evening, gather round a campfire with folk music.',
      },
    ],
    alts: [
      'The peasant citadel at Saschiz, seen from above',
      'The Saxon house in Viscri the procession sets off from',
      'The Bike Checkinn, where Sunday’s ride begins',
    ],
  },

  details: {
    title: 'Worth knowing',
    facts: [
      {
        term: 'Leave the car at your lodging',
        detail:
          'We handle transport all weekend, between your lodging and every stop. Bicycles included — you do not need to bring your own.',
      },
      {
        term: 'Your rooms are already booked',
        detail:
          'There is nothing for you to arrange. Just tell us how many nights you would like to stay and we will see to the rest. Breakfast will be included or optional.',
      },
      {
        term: 'Bring the children',
        detail:
          'Every part of the weekend is planned with them in mind. The courtyards are large and there are people we can count on to keep them entertained.',
      },
      {
        term: 'Dress code: “Saschiz blue”',
        detail:
          'The blue of Saschiz pottery, in whatever shade you like. Wear something light and comfortable — there is grass and there is cobblestone, and in September the hills remember by evening that it is autumn.',
      },
      {
        term: 'A speech or a toast',
        detail:
          'An open invitation to share a story, a piece of advice, a joke or an unflattering photograph of us. Those unafraid of dentists or of public speaking, please let Cătălina Popoviciu know beforehand.',
      },
      {
        term: 'Dietary or musical restrictions?',
        detail: 'Let us know.',
      },
    ],
    altSignpost: 'Road sign pointing to Viscri, Saschiz and Bunești',
  },

  colophon: {
    altCouple: 'The couple in a field of dandelions, bicycle alongside',
    villages: 'Saschiz · Viscri · Bunești',
  },

  stopLabel: (n, title) => `Stop ${n}: ${title}`,
}

export const COPY: Record<Locale, Copy> = { ro, en }

/**
 * The active locale, resolved once.
 *
 * Switching languages is a real navigation — the toggle is an anchor, not a
 * button — so this cannot change under a running page. That makes a module
 * constant correct here, and saves threading a context through every
 * component for a value that is fixed before the first render.
 */
export const LOCALE: Locale =
  typeof window === 'undefined' ? 'ro' : localeFromPath(window.location.pathname)

export const T: Copy = COPY[LOCALE]
