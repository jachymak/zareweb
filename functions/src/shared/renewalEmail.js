// The annual renewal e-mail — SPEC §4.6. Default text until it is editable in
// Administration (`settings/emails.waitlistRenewal`). Paragraphs are separated
// by a blank line; `{dite}` is the child's name, `{odkaz}` the renewal link.

export const RENEWAL_EMAIL_FROM = 'Skautský oddíl Záře <zare@skaut.cz>'

export const DEFAULT_RENEWAL_EMAIL = {
  subject: 'Máte stále zájem o náš oddíl?',
  body: [
    'Dobrý den!',
    'Před nějakou dobou jste na naši čekací listinu zapsali Vaše dítě {dite}.',
    'Letos jsme do oddílu právě nabrali nováčky a Vaše dítě jsme bohužel nepřijali. Chceme se Vás zeptat, zda Váš zájem stále trvá?\nPokud ano, potvrďte nám to prosím zde: {odkaz}',
    'Do oddílu nabíráme děti ve věku 7–11 let. Pokud je Vaše dítě starší, doporučujeme se podívat po jiném oddílu (např. na webu skaut.cz).',
    'S přáním hezkého dne\nvedoucí ze skautského oddílu Záře',
  ].join('\n\n'),
}

// Stored template (possibly partial) → { subject, body }.
export function renewalEmailTemplate(stored) {
  return {
    subject: stored?.subject || DEFAULT_RENEWAL_EMAIL.subject,
    body: stored?.body || DEFAULT_RENEWAL_EMAIL.body,
  }
}

// Text of the e-mail for one child.
export function renderRenewalEmail(template, { childName, link }) {
  return template.body.replaceAll('{dite}', childName).replaceAll('{odkaz}', link)
}
