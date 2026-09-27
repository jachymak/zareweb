// Automated e-mails — SPEC §4.8 (Čekací listina, E-maily), §7.
// Texts are stored in `settings/emails.{key}` as { subject, body, enabled? };
// the defaults below apply while none is saved. Paragraphs are separated by a
// blank line; `{name}` placeholders are filled per recipient, and a paragraph
// left empty (e.g. `{prihlasovani}` when registration isn't open) is dropped.

export const EMAIL_FROM = 'Skautský oddíl Záře <zare@skaut.cz>'

const paragraphs = (...p) => p.join('\n\n')

// placeholders: { name: description }; required: placeholders the text must contain;
// switchable: the admin can turn the e-mail off.
export const EMAILS = {
  waitlistConfirmation: {
    placeholders: { dite: 'jméno dítěte' },
    required: [],
    switchable: false,
    default: {
      subject: 'Zapsali jsme Vás na čekací listinu',
      body: paragraphs(
        'Dobrý den!',
        'Děkujeme, Vaše dítě {dite} je na čekací listině skautského oddílu Záře.',
        'Nové členy nabíráme jednou za rok. Když se pro {dite} uvolní místo, ozveme se Vám. Jednou za rok Vám také přijde e-mail s dotazem, jestli zájem trvá.',
        'S přáním hezkého dne\nvedoucí ze skautského oddílu Záře',
      ),
    },
  },
  waitlistRenewal: {
    placeholders: { dite: 'jméno dítěte', odkaz: 'odkaz na potvrzení zájmu' },
    required: ['odkaz'],
    switchable: false,
    default: {
      subject: 'Máte stále zájem o náš oddíl?',
      body: paragraphs(
        'Dobrý den!',
        'Před nějakou dobou jste na naši čekací listinu zapsali Vaše dítě {dite}.',
        'Letos jsme do oddílu právě nabrali nováčky a Vaše dítě jsme bohužel nepřijali. Chceme se Vás zeptat, zda Váš zájem stále trvá?\nPokud ano, potvrďte nám to prosím zde: {odkaz}',
        'Do oddílu nabíráme děti ve věku 7–11 let. Pokud je Vaše dítě starší, doporučujeme se podívat po jiném oddílu (např. na webu skaut.cz).',
        'S přáním hezkého dne\nvedoucí ze skautského oddílu Záře',
      ),
    },
  },
  accountApproved: {
    placeholders: {
      deti: 'věta s přiřazenými dětmi — jen u rodičů',
      odkaz: 'odkaz na web oddílu',
    },
    required: ['odkaz'],
    switchable: false,
    default: {
      subject: 'Váš účet na webu oddílu Záře je schválený',
      body: paragraphs(
        'Dobrý den!',
        'Schválili jsme Váš účet na webu skautského oddílu Záře. Přihlásit se můžete tady: {odkaz}',
        '{deti}',
        'S přáním hezkého dne\nvedoucí ze skautského oddílu Záře',
      ),
    },
  },
  registrationOpened: {
    placeholders: {
      dite: 'jména dětí, které můžou jet',
      akce: 'název akce',
      termin: 'termín akce',
      uzaverka: 'poslední den přihlašování',
      odkaz: 'odkaz na přihlašování',
    },
    required: ['odkaz'],
    switchable: true,
    default: {
      subject: 'Přihlašování na akci {akce}',
      body: paragraphs(
        'Dobrý den!',
        'Spustili jsme přihlašování na akci {akce} ({termin}), kam může jet {dite}.',
        'Přihlásit můžete na webu oddílu do {uzaverka}: {odkaz}',
        'Těšíme se!\nvedoucí ze skautského oddílu Záře',
      ),
    },
  },
  posterPublished: {
    placeholders: {
      dite: 'jména dětí, které můžou jet',
      akce: 'název akce',
      termin: 'termín akce',
      prihlasovani: 'věta o přihlašování s odkazem — jen když běží',
      odkaz: 'odkaz na plakátek',
    },
    required: ['odkaz'],
    switchable: true,
    default: {
      subject: 'Plakátek na akci {akce}',
      body: paragraphs(
        'Dobrý den!',
        'Na webu oddílu je plakátek na akci {akce} ({termin}) — kdy a kde se sejdeme, co s sebou a kolik to stojí: {odkaz}',
        '{prihlasovani}',
        'Těšíme se!\nvedoucí ze skautského oddílu Záře',
      ),
    },
  },
}

// Stored template (possibly missing or partial) → { subject, body, enabled }.
export function emailTemplate(key, stored) {
  const d = EMAILS[key].default
  return {
    subject: stored?.subject || d.subject,
    body: stored?.body || d.body,
    enabled: EMAILS[key].switchable ? stored?.enabled !== false : true,
  }
}

// Placeholders the text must contain but doesn't.
export const missingPlaceholders = (key, body) =>
  EMAILS[key].required.filter((p) => !body.includes(`{${p}}`))

const fill = (text, values) =>
  text.replace(/\{(\p{L}+)\}/gu, (whole, name) => (name in values ? (values[name] ?? '') : whole))

// { subject, text } for one recipient; paragraphs left empty by a placeholder are dropped.
export function renderEmail(template, values) {
  const text = template.body
    .split(/\n\s*\n/)
    .map((p) => fill(p, values).trim())
    .filter(Boolean)
    .join('\n\n')
  return { subject: fill(template.subject, values), text }
}
