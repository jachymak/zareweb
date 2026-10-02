// Static HTML of the public pages for crawlers that don't run JavaScript (Seznam, link
// previews) — SPEC §8. Runs after `vite build` (npm run build): writes each page's title,
// description, link preview and a plain text version of its content into dist/index.html,
// dist/cekaci-listina.html and dist/historie.html (.htaccess serves /cekaci-listina from
// the .html), plus dist/sitemap.xml. The text sits inside #app: browsers with JavaScript
// hide it (index.html) and Vue replaces it on mount, so the app itself is unchanged.
// The home page text is kept here by hand — only what doesn't change from year to year.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { createServer } from 'vite'

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url))

// The content modules use the app's aliases; Vite resolves them.
const vite = await createServer({
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
  resolve: { alias: { '@': root('src'), '@shared': root('functions/src/shared') } },
})
const load = (path) => vite.ssrLoadModule(path)
const { SITE_URL, PAGE_META } = await load('/src/content/pageMeta.js')
const { TROOPS, GROUP_EMAIL } = await load('/src/constants/troops.js')
const { FAQ } = await load('/src/content/faq.js')
const { HISTORY } = await load('/src/content/history.js')
await vite.close()

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const p = (text) => `<p>${esc(text)}</p>`

const contact = `<h2>Kontakt</h2>
<p>Skautský oddíl Záře — 220. oddíl Vlčušky a 222. oddíl skautů a skautek, Junák — český skaut, středisko Šipka Praha, z. s.</p>
<p>E-mail: <a href="mailto:${GROUP_EMAIL}">${GROUP_EMAIL}</a>. Zájem o oddíl jen přes <a href="/cekaci-listina">čekací listinu</a>, díky.</p>
<p><a href="/">Úvod</a> · <a href="/cekaci-listina">Čekací listina</a> · <a href="/historie">Historie oddílu</a> · <a href="https://www.instagram.com/222zare">Instagram</a></p>`

const home = `<h1>Ahoj! My jsme Záře!</h1>
${p('Dva skautské oddíly z Dejvic. Jsme parta kluků a holek, od malých po velké. Většina z nás tu začínala jako malá vlčuška a dnes sami vedeme ty mladší.')}
${p('Pravidelně se scházíme, vyrážíme na výpravy do přírody a v létě na tábor. Jsme parta na celý život.')}
<h2>Dva oddíly: mladší a starší</h2>
<ul>${TROOPS.map((t) => `<li>${esc(t.number)} ${esc(t.name)} — ${esc(t.ages)}</li>`).join('')}</ul>
${p('Každé dítě chodí na jednu schůzku týdně.')}
<h2>Co děláme: nejen uzly a ohně</h2>
${p('Skauting nemusí být jen o uzlování a rozdělávání ohňů. Snažíme se, aby dával smysl i dnes. Na schůzkách hrajeme hry, diskutujeme, tvoříme a učíme se nové věci. Na výpravách jdeme dál, i když leje a je kolem tma jako v pytli. Máme spolu srandu, zažíváme dobrodružství, učíme se brát zodpovědnost a mít respekt k ostatním. A víme, že se na sebe můžeme spolehnout.')}
<h2>Proč nechat dítě vyrůst ve skautu?</h2>
${p('Skauting je celosvětově největší výchovné hnutí pro mládež. Na rozdíl od zájmových kroužků přináší rozmanité aktivity a jeho cílem je celkový rozvoj dětí — od fyzického, přes týmové a sociální dovednosti, až po důraz na hodnoty a morálku. To vše podává lehce a přirozeně, formou her v partě vrstevníků.')}
<h2>Od schůzky k táboru</h2>
${p('Schůzka každý týden. Díky schůzkám jsme spolu pořád v kontaktu, i když zrovna nikam nevyrážíme. Často je trávíme venku na hřišti, jindy v klubovně.')}
${p('Výprava jednou až dvakrát za měsíc. Většinou každý oddíl zvlášť, občas oba spolu. Spíme v chatě i pod plachtou, vyrážíme v pátek a v neděli jsme zpátky.')}
${p('Tábor každé léto. Několik týdnů v přírodě, na které se pak vzpomíná nejdéle. Pro mnohé vrchol celého roku.')}
<h2>Klubovna: Kafkova 23, Dejvice</h2>
${p('Klubovnu máme kousek od Kulaťáku. Ve vnitrobloku za ní je hřiště, kam na schůzkách často chodíme. Metro A Dejvická, tram a bus Vítězné náměstí — od Dejvické tři minuty pěšky.')}
<h2>Tábor v jižních Čechách</h2>
${p('Začátkem července vyrážíme na dva až tři týdny do přírody. Na Kovářovu louku u Soběnova jezdíme už přes 40 let. Dnes tam táboří vlčušky, skauti a skautky mají svůj tábor u Slavče.')}
${p('Spíme v týpí či podsadových stanech, vaříme na kamnech a myjeme se v řece. Celý tábor obvykle provází celotáborová hra.')}
<p><a href="/historie">Historie oddílu od roku 1976</a></p>
<h2>Chcete se přidat?</h2>
${p('Své dítě můžete zapsat na čekací listinu, míst je ale málo a přijetí to bohužel nezaručuje. Děti starší 11 let většinou nenabíráme.')}
<p><a href="/cekaci-listina">Zapsat na čekací listinu</a></p>
<h2>Otázky rodičů</h2>
${FAQ.map(({ q, a }) => `<h3>${esc(q)}</h3>${p(a)}`).join('\n')}`

const waitlist = `<h1>Čekací listina</h1>
${p('Vyplnění zabere asi dvě minuty. Zápis bohužel nezaručuje přijetí — nováčky vybíráme koncem prázdnin a ozveme se sami.')}
${p('Formulář potřebuje zapnutý JavaScript.')}`

const history = `<h1>Historie oddílu</h1>
${HISTORY.map((period) => `<h2>${esc(period.years)}</h2>\n${period.paragraphs.map(p).join('\n')}`).join('\n')}`

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Skautský oddíl Záře',
  url: SITE_URL,
  logo: `${SITE_URL}/apple-touch-icon.png`,
  email: GROUP_EMAIL,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Kafkova 544/23',
    addressLocality: 'Praha 6 – Dejvice',
    postalCode: '160 00',
    addressCountry: 'CZ',
  },
  sameAs: ['https://www.instagram.com/222zare'],
  parentOrganization: {
    '@type': 'Organization',
    name: 'Junák — český skaut, středisko Šipka Praha, z. s.',
    url: 'https://stredisko-sipka.skauting.cz',
  },
}

const PAGES = [
  { path: '/', file: 'index.html', body: home, jsonLd: organization },
  { path: '/cekaci-listina', file: 'cekaci-listina.html', body: waitlist },
  { path: '/historie', file: 'historie.html', body: history },
]

const template = await readFile(root('dist/index.html'), 'utf8')

for (const { path, file, body, jsonLd } of PAGES) {
  const { title, description } = PAGE_META[path]
  const url = SITE_URL + (path === '/' ? '/' : path)
  const head = [
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="cs_CZ">`,
    `<meta property="og:site_name" content="Skautský oddíl Záře">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:image" content="${SITE_URL}/og-image.jpg">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    jsonLd && `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ].filter(Boolean)

  const html = replaceOnce(
    replaceOnce(
      replaceOnce(template, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`),
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${esc(description)}">\n    ${head.join('\n    ')}`,
    ),
    '<div id="app"></div>',
    `<div id="app"><div class="static-page">\n${body}\n${contact}\n</div></div>`,
  )
  await writeFile(root(`dist/${file}`), html)
  console.log(`static page ${path} → dist/${file}`)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(({ path }) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join('\n')}
</urlset>
`
await writeFile(root('dist/sitemap.xml'), sitemap)
console.log('sitemap → dist/sitemap.xml')

// Fails the build when index.html no longer has what is replaced.
function replaceOnce(html, search, replacement) {
  const found = typeof search === 'string' ? html.includes(search) : search.test(html)
  if (!found) throw new Error(`static-pages: ${search} not found in dist/index.html`)
  return html.replace(search, () => replacement)
}
