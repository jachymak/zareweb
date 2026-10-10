// Texts and helpers of the leaders' directory (SPEC §4.10).
import { entryCard } from '@shared/directory'
import { pragueToday } from '@shared/schoolYear'
import { parentEmails } from '@shared/skautisExport'

export const FILTERS = [
  { value: 'all', label: 'všichni' },
  { value: 'vlc', label: 'vlčušky' },
  { value: 'ss', label: 'skauti a skautky' },
  { value: 'leaders', label: 'vedoucí' },
  { value: 'others', label: 'ostatní' },
]

export const matchesFilter = (entry, filter) =>
  filter === 'all' ||
  (filter === 'leaders'
    ? entry.kind === 'leader'
    : filter === 'others'
      ? entry.kind === 'other'
      : entry.kind === 'child' && entry.troop === filter)

// Whether an entry has any phone or e-mail.
export const hasContacts = (e) =>
  e.kind !== 'child'
    ? Boolean(e.phone || e.email)
    : e.parents.some((p) => p.phone || parentEmails(p).length) ||
      e.own.phones.length > 0 ||
      e.own.emails.length > 0

export const telHref = (phone) => `tel:${phone.replace(/\s+/g, '')}`

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

// Downloads the entries as a .vcf — own copies (without ⚜️) with all their
// contacts. The iPhone shows it as a preview with „Vytvořit nový kontakt“,
// other systems get the file.
export function saveToPhone(entries) {
  const savedOn = pragueToday()
  const text = entries
    .map((e) => entryCard(e, undefined, { savedOn }))
    .filter(Boolean)
    .join('')
  if (!text) return 0
  const url = URL.createObjectURL(new Blob([text], { type: 'text/vcard;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  if (!isIos())
    link.download = entries.length === 1 ? `${entries[0].display}.vcf` : 'zare-kontakty.vcf'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  return entries.length
}

// Steps of setting up the phone (SPEC §4.10), by system.
export const IPHONE_STEPS = [
  'Otevři Nastavení → Aplikace → Kontakty → Účty kontaktů → Přidat účet → Jiný → Přidat účet CardDAV.',
  'Server, uživatel a heslo vyplň podle údajů výš, do popisu napiš „Záře“ a dej Další.',
  'Kontakty se objeví v aplikaci Kontakty. Ve Seznamech je můžeš schovat nebo zase ukázat.',
]
// Android: DAVx⁵ first — free from GitHub, or paid once from Google Play.
export const DAVX5_RELEASES = 'https://github.com/bitfireAT/davx5-ose/releases'
export const ANDROID_INSTALL = [
  {
    title: 'Zdarma z GitHubu',
    steps: [
      'Otevři v telefonu stránku github.com/bitfireAT/davx5-ose/releases (odkaz výš).',
      'U nejnovější verze (je úplně nahoře) sjeď dolů k části „Assets“.',
      'Klepni na soubor, který končí na „-ose-release.apk“ — třeba davx5-405200005-4.5.20-ose-release.apk — a stáhni ho.',
      'Otevři stažený soubor a dej Instalovat. Když se telefon zeptá, jestli povolit instalaci z prohlížeče, povol ji.',
    ],
  },
  {
    title: 'Z Google Play (jednorázově placená)',
    steps: ['Otevři Google Play a vyhledej „DAVx5“.', 'Kup a nainstaluj ji.'],
  },
]
export const ANDROID_STEPS = [
  'Otevři DAVx⁵ a povol jí jen přístup ke kontaktům a synchronizaci bez ohledu na šetření baterie.',
  'Klepni na „+“ → „Přihlásit se pomocí URL a uživatelského jména“ a vyplň adresu, uživatele a heslo podle údajů výš.',
  'U metody seskupování kontaktů zvol „Skupiny jsou kategorie u jednotlivých kontaktů“.',
  'Zaškrtni adresář „Záře“. Kontakty se objeví v aplikaci Kontakty.',
]
