// Troop history page (SPEC §2.5) — static content, taken over from the old web.

import { pragueToday } from '@shared/schoolYear'

export const HISTORY = [
  {
    years: '1971–1982',
    paragraphs: [
      'Oddíl Záře vznikl mezi lety 1971–3. Tehdy to byl malý oddíl s všeobecně kulturním zaměřením. Vedoucím byl Jarda Hastík. V roce 1975 se vedení oddílu ujímá Vít Želva Pokorný. 11. 11. 1975 zakládá nynější oddíl Záře se zaměřením na přírodu a táboření. První výprava se uskutečnila do Loděnice u Karlštejna. První kronika byla založena 22. 9. 1976.',
      'Oddíl se dále věnoval přírodovědné činnosti, jezdil na výpravy a následující čtyři roky se zúčastnil letních skupinových stanových táborů. V letech 1980 a 1981 Záře jela místo stanových táborů na vodu. Byly to první samostatné tábory. V roce 1982 byl oddíl poprvé na samostatném táboře v Soběnově u Kaplice v Novohradských horách.',
    ],
  },
  {
    years: '1982–1989',
    paragraphs: [
      'V dubnu 1982 začíná vycházet oddílový časopis Zářič a na podzim jeho zúžené vydání Moutas. V následujících letech stoupá úroveň oddílu a jeho činnost se stále více dostává do rozporů s pionýrskou ideologií a směřuje ke skautingu. Na počátku roku 1984 vstupuje oddíl do řad ČSTV (Československý svaz tělesné výchovy), aby si v případě zákazu činnosti při pionýrské organizaci uhájil právo na existenci. Účastní se různých oddílových srazů a dosahuje úspěchů.',
      'V roce 1986 úroveň oddílu s odchodem zkušených vůdců Želvy a Šípka na vojnu klesá. Vedení se ujímá Šnek. V létě roku 1986 se nepodařilo zajistit tábor — vyjíždí se na puťák na Slovensko a již následující léto po návratu Šípka a Želvy probíhá jeden z nejúspěšnějších táborů — California.',
      'Zaměření oddílu a jeho činnost se však neshoduje s tehdejším politickým směrem, a tak má problémy. Ve štvavém komunistickém plátku Rudé právo vychází lživý článek plný výmyslů o našem táboře, který způsobuje zákaz práce s mládeží pro Želvu. Následuje cenzura Zářiče a zákaz vydávání. Nicméně díky nadšení vedení i členů se oddílu daří velmi dobře.',
    ],
  },
  {
    years: '1989–2010',
    paragraphs: [
      'Na jaře 1989 náhle Šnek zanechává vedení a jelikož většina velkých členů je na vojně, nastává úpadek. Vedení oddílu přebírají Děda a Dudu, díky nimž Záře přežívá. Na podzim roku 1990 se vedení ujímá Vaťák, Šimon a Smíšek. Koncem roku Záře přestupuje k 22. středisku Junáka „Šipka“ jako 222. chlapecký a dívčí oddíl.',
      'Oddíl vede Vaťák až do roku 2000, kdy se začíná věnovat družině bobříků a oddíl svěřuje Trpaslíkovi. Kvůli neshodám v oddíle vede Trpaslík oddíl jen do roku 2001. Po táboře Slované se oddílu ujímá Sherlock a Marcel, kteří vedou oddíl až do tábora Egypt (2003). Jako vedoucí oddílu se následně vystřídají Jeník, Méďa, Klíště, Pepík a Střízlík.',
    ],
  },
  {
    years: 'od roku 2010',
    paragraphs: [
      'Po táboře Cesta kolem světa (2010) nastává celková generační výměna ve vedení oddílu a vedoucí oddílu se stává Jabko. Nezkušenost mladých vedoucích vede k horší kvalitě programu a spolu s malým úsilím o nábor nových členů ústí v postupný úbytek členů.',
      'Na počátku léta 2013 se oddíl schází na velkou radu a s pomocí vedoucí střediska Máji se vedení shodne na další vizi oddílu. Po táboře Mystik (2013) tak pod Skokanovým vedením oddíl nabírá znovu dech a jeho řady se opět významně rozšiřují. Oddílový program se více dělí na mladší Vlčušky a starší skauty a skautky.',
    ],
  },
]

export const FIRST_CAMP_YEAR = 1976

// Camp themes by year: a name, or [troop, name] pairs when the troops had
// separate themes. Years missing here still get a row („doplníme“).
export const CAMPS = {
  1976: 'Benešova hora',
  1977: 'Malonty',
  1978: 'Sklené',
  1979: 'Sklené',
  1980: 'Berounka',
  1981: 'Vltava',
  1982: 'Chilkoot',
  1983: 'Dakota',
  1984: 'Chairman',
  1985: 'Hellada',
  1986: 'Alvaréz — Slovensko',
  1987: 'California',
  1988: 'Královská cesta',
  1989: 'Nakamakama',
  1990: 'Oregon',
  1991: 'Hobit',
  1992: 'Kalyng',
  1993: 'Koruna Česká',
  1994: 'Kuža Pahin',
  1995: 'Bruckův poklad',
  1996: 'Artuš',
  1997: 'Soptropus',
  1998: 'Oppidum',
  1999: 'Cesta kolem světa',
  2000: 'La puebla',
  2001: 'Slované',
  2002: 'Království Nirma',
  2003: 'Egypt',
  2004: 'Bablietka',
  2005: 'Japonsko',
  2006: 'Robin Hood',
  2007: 'Odysseia',
  2008: 'Apokalypsa',
  2009: 'Inkové',
  2010: 'Cesta kolem světa',
  2011: 'Mafie',
  2012: 'Star Wars',
  2013: 'Mystik',
  2014: 'Lovci mamutů',
  2015: 'Excalibur',
  2016: 'bez tématu',
  2017: [
    ['vlčušky', 'Asterix a Obelix'],
    ['skauti', 'bez tématu'],
  ],
  2018: [
    ['vlčušky', 'Škola čar a kouzel'],
    ['skauti', '20. století'],
  ],
}

// The camp starts in early July, so a year's row appears from July on.
export function lastCampYear(today = pragueToday()) {
  const [year, month] = today.split('-').map(Number)
  return month >= 7 ? year : year - 1
}

// Camps grouped by decade, oldest first: [{ decade, camps: [{ year, themes }] }],
// `themes` being [[troop | null, name]] or [] when not filled in yet.
export function campsByDecade(today) {
  const decades = []
  for (let year = FIRST_CAMP_YEAR; year <= lastCampYear(today); year++) {
    const decade = Math.floor(year / 10) * 10
    if (decades.at(-1)?.decade !== decade) decades.push({ decade, camps: [] })
    const camp = CAMPS[year]
    const themes = Array.isArray(camp) ? camp : camp ? [[null, camp]] : []
    decades.at(-1).camps.push({ year, themes })
  }
  return decades
}
