// Titles and descriptions of the public pages (SPEC §8): the router sets the title on
// in-app navigation, scripts/static-pages.js writes both into each page's static HTML.

export const SITE_URL = 'https://zare.skauting.cz'

export const DEFAULT_TITLE = 'Skautský oddíl Záře — Dejvice'

export const PAGE_META = {
  '/': {
    title: DEFAULT_TITLE,
    description:
      'Dva skautské oddíly z Dejvic: 220. oddíl Vlčušky (7–11 let) a 222. oddíl skautů a skautek (12–15 let). Schůzky v klubovně v Kafkově ulici, výpravy a letní tábor v jižních Čechách.',
  },
  '/cekaci-listina': {
    title: 'Čekací listina — Skautský oddíl Záře',
    description:
      'Zápis dítěte na čekací listinu skautského oddílu Záře z Dejvic. Nováčky vybíráme jednou za rok, koncem prázdnin.',
  },
  '/historie': {
    title: 'Historie oddílu — Skautský oddíl Záře',
    description:
      'Historie skautského oddílu Záře z Dejvic od roku 1975 a jeho tábory, na které jezdíme každé léto od roku 1976.',
  },
}
