// skautIS — SPEC §4.8 skautIS. Shared by the web (login link, the note in
// Administration) and the sync functions.

// The production skautIS app (login URL
// https://zare.skauting.cz/skautis/prihlaseni.php) and the two oddíly. There
// is no test app any more; development uses the fixture tokens in the emulator.
export const SKAUTIS = {
  url: 'https://is.skaut.cz',
  appId: '0e8e3482-a558-469f-bc63-b6985a39a6ed',
  units: { vlc: '116.22.220', ss: '116.22.222' },
}

// Membership categories (skautIS `ID_MembershipCategory`) of the imported
// members; everyone else (dospělý, benjamínek, ostatní) is left out.
export const CHILD_CATEGORIES = ['vlce', 'svetluska', 'skaut', 'skautka']
export const LEADER_CATEGORIES = ['rover', 'ranger']

// The skautIS login page; after login skautIS posts the token to the app's
// registered URL (`public/skautis/prihlaseni.php`).
export const skautisLoginUrl = (url, appId) => `${url}/Login/?appid=${appId}`
