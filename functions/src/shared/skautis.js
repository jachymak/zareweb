// skautIS — SPEC §4.8 skautIS. Shared by the web (login link, the note in
// Administration) and the sync functions.

// Development runs against the test skautIS with the test app „zare-web-test“
// and two test oddíly in which its public test account is vedoucí/admin.
// Production overrides them: VITE_SKAUTIS_URL / VITE_SKAUTIS_APP_ID in `.env`
// (web), SKAUTIS_URL / SKAUTIS_APP_ID / SKAUTIS_UNIT_VLC / SKAUTIS_UNIT_SS in
// `functions/.env` (is.skaut.cz, 116.22.220, 116.22.222).
export const SKAUTIS_TEST = {
  url: 'https://test-is.skaut.cz',
  appId: '4c5b52b4-88f0-4d9d-9310-0b28892676a4',
  units: { vlc: '411.01.003', ss: '411.01.022' },
}

// Membership categories (skautIS `ID_MembershipCategory`) of the imported
// members; everyone else (dospělý, benjamínek, ostatní) is left out.
export const CHILD_CATEGORIES = ['vlce', 'svetluska', 'skaut', 'skautka']
export const LEADER_CATEGORIES = ['rover', 'ranger']

// The skautIS login page; after login skautIS posts the token to the app's
// registered URL (`public/skautis/prihlaseni.php`).
export const skautisLoginUrl = (url, appId) => `${url}/Login/?appid=${appId}`
