// Texts of the login page — SPEC §2.4.

// Intro column per screen: [kicker, title, subtitle].
export const INTRO = {
  login: [
    'vítej zpátky',
    'Oddílový zápisník',
    'Výpravník, docházka dětí, fotky z akcí a kontakty na vedoucí — všechno na jednom místě.',
  ],
  forgot: [
    'nic se neděje',
    'Pošleme nové heslo',
    'Stává se to. Odkaz na nastavení nového hesla ti přijde do minuty.',
  ],
  register: [
    'poprvé u nás?',
    'Založení účtu',
    'Účet si může založit každý rodič dítěte z oddílu i vedoucí. Správce ho pak schválí a propojí s tvými dětmi.',
  ],
  pending: [
    'už to skoro je',
    'Účet čeká na schválení',
    'Bez schválení je účet prázdný — je to tak schválně, aby se dovnitř nedostal nikdo cizí.',
  ],
  none: ['bez přístupu', 'Účet nemá přístup', 'Obsah pro členy a vedoucí vidí jen schválené účty.'],
}

export const NOTE_MAX = 1000

// Firebase Auth error code → message. Unknown codes get a generic one.
const AUTH_ERRORS = {
  'auth/invalid-credential': 'Špatný e-mail nebo heslo.',
  'auth/invalid-login-credentials': 'Špatný e-mail nebo heslo.',
  'auth/wrong-password': 'Špatný e-mail nebo heslo.',
  'auth/user-not-found': 'Špatný e-mail nebo heslo.',
  'auth/invalid-email': 'Zadej platný e-mail.',
  'auth/user-disabled': 'Tenhle účet je zablokovaný.',
  'auth/email-already-in-use':
    'Účet s tímhle e-mailem už existuje — přihlas se, nebo si obnov heslo.',
  'auth/weak-password': 'Heslo je moc slabé, zkus delší.',
  'auth/too-many-requests': 'Moc pokusů za sebou. Zkus to prosím za chvíli.',
  'auth/network-request-failed': 'Nepodařilo se spojit se serverem. Zkontroluj připojení.',
  'auth/popup-blocked':
    'Prohlížeč zablokoval okno pro přihlášení Googlem. Povol ho a zkus to znovu.',
  'auth/account-exists-with-different-credential':
    'Tenhle e-mail už má účet s heslem — přihlas se e-mailem a heslem.',
}

// Codes that mean the user just closed the Google window — no message.
const SILENT = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']

export function authErrorMessage(e) {
  if (SILENT.includes(e?.code)) return ''
  if (!AUTH_ERRORS[e?.code]) console.error('Auth error', e)
  return AUTH_ERRORS[e?.code] ?? 'Něco se pokazilo. Zkus to prosím znovu.'
}
