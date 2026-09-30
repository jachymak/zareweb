// A stand-in for skautIS in the emulator (e2e suite `skautis`, trying the page
// without logging in): previewSkautisSync with the token FIXTURE_TOKEN reads
// this data instead of the web service. Compared with `seed:members` and
// `seed:activity` it has — children: new Ještěrka, Sojka's parent's phone,
// Vydra → Vydrák, returning Ježek, Liška gone; leaders: new Mravenec, Nina's
// phone, Quido gone; plus a benjamínek and a dospělý, who are left out.
// FIXTURE_TOKEN_BASIC: the same, but PersonParentAll is refused (an app with
// only the basic package of skautIS functions).

import { SkautisError } from './client.js'

export const FIXTURE_TOKEN = 'fixture'
export const FIXTURE_TOKEN_BASIC = 'fixture-basic'
export const FIXTURE_TOKENS = [FIXTURE_TOKEN, FIXTURE_TOKEN_BASIC]

const child = (id, FirstName, LastName, NickName, Birthday, category, parents) => ({
  person: { ID: id, FirstName, LastName, NickName, Birthday: `${Birthday}T00:00:00` },
  category,
  parents: parents.map(([FirstName, LastName, Email, Phone]) => ({
    FirstName,
    LastName,
    Email,
    Phone,
  })),
})
const leader = (id, FirstName, LastName, NickName, category, phone, email) => ({
  person: { ID: id, FirstName, LastName, NickName, Birthday: '2000-01-01T00:00:00' },
  category,
  contacts: [
    phone && { ID_ContactType: 'telefon_hlavni', Value: phone },
    email && { ID_ContactType: 'email_hlavni', Value: email },
  ].filter(Boolean),
})

const MEMBERS = {
  vlc: [
    child('900101', 'Anna', 'Nováková', 'Žabka', '2017-05-14', 'svetluska', [
      ['Jana', 'Nováková', 'cekajici@zare.test', '+420 731 111 222'],
    ]),
    child('900102', 'Klára', 'Krejčí', 'Sojka', '2016-11-02', 'svetluska', [
      ['Rodič', 'Testovací', 'rodic@zare.test', '+420 602 333 999'],
    ]),
    child('900104', 'Antonín', 'Registrovaný', 'Kulíšek', '2017-09-30', 'vlce', [
      ['Jana', 'Registrovaná', 'jana.jina@example.cz', null],
    ]),
    child('900105', 'Veronika', 'Malá', 'Ještěrka', '2018-03-03', 'svetluska', [
      ['Lucie', 'Malá', 'mala@example.cz', '+420 603 000 111'],
    ]),
    child('900106', 'Ema', 'Malá', '', '2020-06-06', 'benjaminek', []),
    leader('800001', 'Ondřej', 'Sýkora', 'Ondys', 'rover', '+420 608 117 442', 'ondys@example.cz'),
    leader('800002', 'Nina', 'Bártová', 'Nina', 'ranger', '+420 721 404 000', 'nina@example.cz'),
    leader('800003', 'Oskar', 'Beneš', 'Oskar', 'rover', null, 'oskar@example.cz'),
    leader(
      '800021',
      'Elina',
      'Procházková',
      'Elina',
      'ranger',
      '+420 704 889 210',
      'elina@example.cz',
    ),
  ],
  ss: [
    child('900201', 'Tomáš', 'Dub', 'Bobr', '2013-04-08', 'skaut', [
      ['Tomáš', 'Dub', 'dub.tomas@example.cz', '+420 777 555 666'],
      ['Rodič', 'Testovací', 'rodic@zare.test', '+420 602 333 444'],
    ]),
    child('900202', 'Matěj', 'Pokorný', 'Vydrák', '2012-12-12', 'skaut', [
      ['Jiří', 'Pokorný', 'pokorny.j@example.cz', '+420 608 777 888'],
    ]),
    child('900203', 'Jakub', 'Horák', 'Ježek', '2011-07-01', 'skaut', [
      ['Eva', 'Horáková', 'horakova@example.cz', null],
    ]),
    leader(
      '800011',
      'Theodor',
      'Mikolajek',
      'Hobit',
      'rover',
      '+420 776 772 777',
      'hobit@example.cz',
    ),
    leader(
      '800012',
      'Jasmína',
      'Kolářová',
      'Jasmína',
      'ranger',
      '+420 608 213 900',
      'jasmina@example.cz',
    ),
    leader('800013', 'Jakub', 'Horský', 'Kuba', 'rover', '+420 776 330 128', 'kuba@example.cz'),
    leader(
      '800014',
      'Adam',
      'Novotný',
      'Mravenec',
      'rover',
      '+420 739 222 333',
      'mravenec@example.cz',
    ),
    leader('800031', 'Karel', 'Starý', 'Děda', 'dospely', null, null),
  ],
}
const CATEGORY_NAMES = {
  vlce: 'Vlče',
  svetluska: 'Světluška',
  skaut: 'Skaut',
  rover: 'Rover',
  ranger: 'Ranger',
  benjaminek: 'Benjamínek',
  dospely: 'Člen kmene dospělých',
}

// Same interface as skautisClient(); units: { troop: registration number }.
export function fixtureClient(units, token = FIXTURE_TOKEN) {
  const unitId = (troop) => `fixture-${troop}`
  const troopOf = (id) => Object.keys(units).find((t) => unitId(t) === id)
  const everyone = Object.values(MEMBERS).flat()
  const byId = (id) => everyone.find((m) => m.person.ID === String(id))

  const handlers = {
    UserDetail: () => ({ ID: 'fixture-user' }),
    UserRoleAll: () =>
      Object.entries(units).map(([troop, regNumber]) => ({
        ID: `role-${troop}`,
        ID_Unit: unitId(troop),
        RegistrationNumber: regNumber,
        Role: 'Oddíl: vedoucí/admin',
        Key: 'vedouciOddil',
      })),
    LoginUpdate: () => ({}),
    LoginUpdateLogout: () => ({}),
    UnitAll: ({ RegistrationNumber }) =>
      Object.entries(units)
        .filter(([, regNumber]) => regNumber === RegistrationNumber)
        .map(([troop, regNumber]) => ({
          ID: unitId(troop),
          RegistrationNumber: regNumber,
          DisplayName: `Testovací oddíl ${troop}`,
        })),
    MembershipAll: ({ ID_Unit }) =>
      (MEMBERS[troopOf(ID_Unit)] ?? []).map((m) => ({
        ID_Person: m.person.ID,
        ID_MembershipType: 'radne',
        ID_MembershipCategory: m.category,
        MembershipCategory: CATEGORY_NAMES[m.category],
      })),
    PersonDetail: ({ ID }) => byId(ID).person,
    PersonParentAll: ({ ID_Person }) => {
      if (token === FIXTURE_TOKEN_BASIC) {
        throw new SkautisError('PersonParentAll', 'Aplikace nemá povolenou tuto funkci.')
      }
      return byId(ID_Person).parents ?? []
    },
    PersonContactAll: ({ ID_Person }) => byId(ID_Person).contacts ?? [],
  }
  return async (service, method, input = {}) => {
    const handler = handlers[method]
    if (!handler) throw new Error(`Fixture skautIS has no ${method}`)
    return structuredClone(handler(input))
  }
}
