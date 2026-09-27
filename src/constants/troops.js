// The two troops of the group — SPEC §1.

export const TROOPS = [
  {
    code: 'vlc',
    number: '220. oddíl',
    name: 'Vlčušky',
    tag: 'vlč',
    ages: '7–11 let',
  },
  {
    code: 'ss',
    number: '222. oddíl',
    name: 'Skauti a skautky',
    tag: 's&s',
    ages: '12–15 let',
  },
]

export const GROUP_EMAIL = 'zare@skaut.cz'
export const FIND_OTHER_GROUP_URL = 'https://skautskyoddil.cz'

// Meeting weekdays (SPEC §5 `weekday`); the troops' days are set in Administration.
export const WEEKDAY_NAMES = {
  mon: 'pondělí',
  tue: 'úterý',
  wed: 'středa',
  thu: 'čtvrtek',
  fri: 'pátek',
}

export const troopByCode = (code) => TROOPS.find((t) => t.code === code)

// Audience of events and news: one troop or everyone (SPEC §1).
export const AUDIENCES = {
  vlc: { name: 'vlčušky', tag: 'vlč' },
  ss: { name: 'skauti a skautky', tag: 's&s' },
  all: { name: 'všichni', tag: 'vši' },
}

// Groups of leader contacts on the parents' page (SPEC §3.1 Vedoucí).
export const CONTACT_GROUP_NAMES = {
  vlc: 'vlčušky',
  ss: 'skauti a skautky',
  other: 'ostatní',
}
