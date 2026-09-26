// The two troops of the group — SPEC §1.

export const TROOPS = [
  {
    code: 'vlc',
    number: '220. oddíl',
    name: 'Vlčušky',
    tag: 'vlč',
    ages: '7–11 let',
    meetings: 'pondělí a čtvrtek · 17:00–19:00',
  },
  {
    code: 'ss',
    number: '222. oddíl',
    name: 'Skauti a skautky',
    tag: 's&s',
    ages: '12–15 let',
    meetings: 'úterý a středa · 17:00–19:00',
  },
]

export const GROUP_EMAIL = 'zare@skaut.cz'
export const FIND_OTHER_GROUP_URL = 'https://skautskyoddil.cz'

export const troopByCode = (code) => TROOPS.find((t) => t.code === code)
